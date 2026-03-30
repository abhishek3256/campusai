const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Student = require('../models/Student');
const Application = require('../models/Application');

// ── COMPANY: Create Exam for a Job ──────────────────────────────────────────
exports.createExam = async (req, res) => {
    try {
        const { jobId, title, instructions, duration, questions, scheduledAt } = req.body;
        if (!jobId || !title || !questions?.length) {
            return res.status(400).json({ success: false, message: 'jobId, title and at least one question are required' });
        }
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

        const exam = await Exam.create({
            jobId, companyId: company._id, title,
            instructions: instructions || '',
            duration: duration || 60,
            questions, totalMarks,
            scheduledAt: scheduledAt || null,
            isPublished: false, isActive: false
        });
        res.status(201).json({ success: true, data: exam });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── COMPANY: Get Exam for a Job ──────────────────────────────────────────────
exports.getExamByJob = async (req, res) => {
    try {
        const exam = await Exam.findOne({ jobId: req.params.jobId });
        res.json({ success: true, data: exam });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── COMPANY: Publish / Activate Exam ────────────────────────────────────────
exports.publishExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { isPublished: true, isActive: true },
            { new: true }
        );
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        // Update job stage
        await Job.findByIdAndUpdate(exam.jobId, { recruitmentStage: 'exam' });
        res.json({ success: true, data: exam });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── COMPANY: Get Ranked Results ──────────────────────────────────────────────
exports.getExamResults = async (req, res) => {
    try {
        const attempts = await ExamAttempt.find({ examId: req.params.examId, isSubmitted: true })
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
            .sort({ score: -1 });

        // Add rank
        const ranked = attempts.map((a, i) => ({ ...a.toObject(), rank: i + 1 }));
        res.json({ success: true, data: ranked });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── STUDENT: Get Exam (sanitized - no answers) ───────────────────────────────
exports.getExamForStudent = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        if (!exam.isPublished) return res.status(403).json({ success: false, message: 'Exam not yet available' });
        
        // ── NEW: Check if student has applied for this job ──────────────────
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

        const application = await Application.findOne({ 
            studentId: student._id, 
            jobId: exam.jobId,
            overallStatus: { $nin: ['Application Rejected', 'Withdrawn'] } // Must have active application
        });

        if (!application) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must apply for this job before you can view the assessment.' 
            });
        }

        // Strip correct answers before sending to student
        const sanitized = {
            ...exam.toObject(),
            questions: exam.questions.map(q => ({
                _id: q._id, type: q.type, question: q.question,
                options: q.options, marks: q.marks, description: q.description
            }))
        };
        res.json({ success: true, data: sanitized });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── STUDENT: Start Attempt ───────────────────────────────────────────────────
exports.startAttempt = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam || !exam.isActive) return res.status(400).json({ success: false, message: 'Exam is not active' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // ── NEW: Verify application exists ──────────────────────────────────
        const application = await Application.findOne({ 
            studentId: student._id, 
            jobId: exam.jobId,
            overallStatus: { $nin: ['Application Rejected', 'Withdrawn'] }
        });
        if (!application) {
            return res.status(403).json({ 
                success: false, 
                message: 'Application required to start assessment' 
            });
        }

        // Check if already attempted
        const existing = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id });
        if (existing?.isSubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });
        if (existing) return res.json({ success: true, data: existing }); // Resume

        const attempt = await ExamAttempt.create({
            examId: exam._id, studentId: student._id, jobId: exam.jobId,
            totalMarks: exam.totalMarks,
            answers: exam.questions.map((_, i) => ({ questionIndex: i, selectedOption: -1, textAnswer: '' })),
            startedAt: new Date()
        });
        res.status(201).json({ success: true, data: attempt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── STUDENT: Submit Attempt ──────────────────────────────────────────────────
exports.submitAttempt = async (req, res) => {
    try {
        const { answers, timeTaken } = req.body;
        const attempt = await ExamAttempt.findById(req.params.attemptId);
        if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
        if (attempt.isSubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });

        const exam = await Exam.findById(attempt.examId);

        // Auto-score MCQ
        let score = 0;
        const gradedAnswers = exam.questions.map((q, i) => {
            const ans = answers[i] || {};
            if (q.type === 'mcq' && ans.selectedOption === q.correctAnswer) {
                score += q.marks || 1;
            }
            return { questionIndex: i, selectedOption: ans.selectedOption ?? -1, textAnswer: ans.textAnswer || '' };
        });

        attempt.answers = gradedAnswers;
        attempt.score = score;
        attempt.timeTaken = timeTaken || 0;
        attempt.submittedAt = new Date();
        attempt.isSubmitted = true;
        await attempt.save();

        // Recalculate ranks for all submitted attempts
        const allAttempts = await ExamAttempt.find({ examId: exam._id, isSubmitted: true }).sort({ score: -1 });
        await Promise.all(allAttempts.map((a, i) => ExamAttempt.findByIdAndUpdate(a._id, { rank: i + 1 })));

        res.json({ success: true, data: { ...attempt.toObject(), rank: allAttempts.findIndex(a => a._id.equals(attempt._id)) + 1 } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── STUDENT: Log Proctoring Event ────────────────────────────────────────────
exports.logProctoringEvent = async (req, res) => {
    try {
        const { attemptId, event } = req.body;
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

        if (event === 'tab_switch') attempt.proctoring.tabSwitches += 1;
        if (event === 'fullscreen_exit') attempt.proctoring.fullscreenViolations += 1;

        attempt.proctoring.suspiciousAlerts.push({ event, timestamp: new Date() });
        attempt.proctoring.isFlagged = attempt.proctoring.tabSwitches > 3 || attempt.proctoring.fullscreenViolations > 2;
        await attempt.save();

        res.json({ success: true, tabSwitches: attempt.proctoring.tabSwitches, flagged: attempt.proctoring.isFlagged });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── STUDENT: Get My Result ────────────────────────────────────────────────────
exports.getMyResult = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        const attempt = await ExamAttempt.findOne({ examId: req.params.examId, studentId: student._id })
            .populate('examId', 'title totalMarks questions duration');
        if (!attempt) return res.status(404).json({ success: false, message: 'No attempt found' });
        res.json({ success: true, data: attempt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
