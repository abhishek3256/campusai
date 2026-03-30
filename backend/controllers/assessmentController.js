const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Company = require('../models/Company');
const Student = require('../models/Student');
const groq = require('../config/groq');
const https = require('https');


// Helper: call Groq
async function callGroq(userPrompt, systemPrompt) {
    const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            { role: 'user',   content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
    });
    const text = completion.choices[0]?.message?.content || '{}';
    // Strip markdown fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
}

const calculateGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
};

// ── COMPANY ──────────────────────────────────────────────────────────────────

// GET  /assessment/company          — list all assessments for a company
exports.getCompanyAssessments = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const assessments = await Assessment.find({ companyId: company._id })
            .populate('jobId', 'title')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: assessments });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment                  — create a new assessment (draft)
exports.createAssessment = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const assessment = new Assessment({
            ...req.body,
            companyId: company._id,
            createdBy: req.user._id,
            status: req.body.status || 'draft'
        });
        await assessment.save();
        res.status(201).json({ success: true, data: assessment });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /assessment/:id               — update assessment
exports.updateAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: assessment });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /assessment/:id
exports.deleteAssessment = async (req, res) => {
    try {
        await Assessment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Assessment deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment/:id/publish      — publish to students
exports.publishAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
        assessment.status = 'published';
        await assessment.save();
        res.json({ success: true, message: 'Assessment published', data: assessment });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment/generate-questions  — AI question generation
exports.generateAIQuestions = async (req, res) => {
    try {
        const { skills = [], difficulty = 'medium', questionType = 'mcq', count = 5, designation = 'Software Engineer' } = req.body;

        let prompt = '';

        if (questionType === 'mcq') {
            prompt = `Generate ${count} multiple-choice questions for a ${designation} role.
Skills to cover: ${skills.join(', ')}.
Difficulty: ${difficulty}.

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "questionId": "q1",
      "question": "question text",
      "questionType": "mcq",
      "options": [
        {"optionId": "a", "text": "Option A", "isCorrect": false},
        {"optionId": "b", "text": "Option B", "isCorrect": true},
        {"optionId": "c", "text": "Option C", "isCorrect": false},
        {"optionId": "d", "text": "Option D", "isCorrect": false}
      ],
      "difficulty": "${difficulty}",
      "skill": "one of the skills",
      "points": 1,
      "explanation": "why the answer is correct"
    }
  ]
}`;
        } else if (questionType === 'coding') {
            prompt = `Generate ${count} coding problems for a ${designation} role.
Skills: ${skills.join(', ')}.
Difficulty: ${difficulty}.

Return ONLY a JSON object:
{
  "questions": [
    {
      "questionId": "q1",
      "question": "Problem Title",
      "questionType": "coding",
      "codingProblem": {
        "problemStatement": "Detailed description",
        "inputFormat": "Input description",
        "outputFormat": "Output description",
        "constraints": "1 <= n <= 10^5",
        "sampleInput": "5\\n1 2 3 4 5",
        "sampleOutput": "15",
        "hiddenTestCases": [
          {"input": "3\\n1 2 3", "expectedOutput": "6", "points": 2}
        ],
        "allowedLanguages": ["JavaScript", "Python", "Java", "C++"],
        "timeLimit": 2,
        "memoryLimit": 256
      },
      "difficulty": "${difficulty}",
      "skill": "one of the skills",
      "points": 10,
      "explanation": "solution approach"
    }
  ]
}`;
        } else {
            prompt = `Generate ${count} essay/open-ended questions for a ${designation} role.
Skills: ${skills.join(', ')}.
Difficulty: ${difficulty}.

Return ONLY a JSON object:
{
  "questions": [
    {
      "questionId": "q1",
      "question": "Essay prompt or scenario",
      "questionType": "essay",
      "essayConfig": {
        "minWords": 150,
        "maxWords": 400,
        "keyPoints": ["key point 1", "key point 2", "key point 3"]
      },
      "difficulty": "${difficulty}",
      "skill": "one of the skills",
      "points": 10,
      "explanation": "what a good answer covers"
    }
  ]
}`;
        }

        const result = await callGroq(prompt, 'You are an expert technical interviewer. Generate practical, industry-relevant questions. Return ONLY valid JSON.');

        if (result.questions) {
            result.questions = result.questions.map((q, i) => ({
                ...q,
                isAIGenerated: true,
                questionId: q.questionId || `ai_${Date.now()}_${i}`
            }));
        }
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('AI generation error:', err.message);
        res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
    }
};

// GET /assessment/:id/attempts      — all student attempts (company view)
exports.getAssessmentAttempts = async (req, res) => {
    try {
        const attempts = await AssessmentAttempt.find({ assessmentId: req.params.id })
            .populate({
                path: 'studentId',
                select: 'name phone userId',
                populate: { path: 'userId', select: 'email' }
            })
            .sort({ 'scoring.overall.percentage': -1 });
        res.json({ success: true, data: attempts });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment/:id/publish-results
exports.publishResults = async (req, res) => {
    try {
        const result = await AssessmentAttempt.updateMany(
            { assessmentId: req.params.id, status: 'submitted' },
            { $set: { status: 'evaluated', resultPublished: true, resultPublishedAt: new Date() } }
        );
        res.json({ success: true, message: `Results published for ${result.modifiedCount} students` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── STUDENT ───────────────────────────────────────────────────────────────────

// GET /assessment/student/assigned — only shows exams for jobs the student applied to
exports.getAssignedAssessments = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.json({ success: true, data: [] });

        const Application = require('../models/Application');

        // Find ALL jobs the student applied to (not rejected/withdrawn)
        const applications = await Application.find({ 
            studentId: student._id,
            $or: [
                { overallStatus: { $nin: ['Application Rejected', 'Withdrawn', 'Offer Rejected'] } },
                { status: { $in: ['pending', 'under-review', 'shortlisted', 'accepted', 'technical-interview', 'hr-interview'] } }
            ]
        });

        const appliedJobIds = [...new Set(applications.map(app => app.jobId.toString()))];

        if (appliedJobIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const existingAttempts = await AssessmentAttempt.find({ 
            studentId: student._id,
            status: { $in: ['submitted', 'evaluated', 'disqualified'] }
        }).select('assessmentId');
        const completedIds = existingAttempts.map(a => a.assessmentId);

        // Find published assessments linked to jobs the student applied to
        const assessments = await Assessment.find({
            _id: { $nin: completedIds },
            jobId: { $in: appliedJobIds },
            status: { $in: ['published', 'ongoing'] }
        })
        .populate('companyId', 'companyName logo')
        .populate('jobId', 'title')
        .select('-sections.questions');

        res.json({ success: true, data: assessments });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /assessment/:id
exports.getAssessmentById = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .populate('companyId', 'companyName logo')
            .populate('jobId', 'title');
        if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
        
        // Return full assessment. Sensitive info is tracked natively by exam controllers if needed.
        res.json({ success: true, data: assessment });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment/:id/start
exports.startAssessment = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        const existing = await AssessmentAttempt.findOne({ assessmentId: req.params.id, studentId: student._id });
        const assessment = await Assessment.findById(req.params.id);

        if (existing) {
            if (existing.status === 'in-progress') {
                return res.json({ success: true, data: { attempt: existing, assessment } });
            } else {
                return res.status(400).json({ success: false, message: 'Already attempted' });
            }
        }

        const attempt = new AssessmentAttempt({
            assessmentId: req.params.id,
            studentId: student._id,
            jobId: assessment.jobId,
            startedAt: new Date(),
            status: 'in-progress'
        });
        await attempt.save();
        res.json({ success: true, data: { attempt, assessment } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /assessment/attempt/:attemptId/submit
exports.submitAssessment = async (req, res) => {
    try {
        const attempt = await AssessmentAttempt.findById(req.params.attemptId);
        if (!attempt || attempt.status !== 'in-progress')
            return res.status(400).json({ success: false, message: 'Invalid attempt' });

        const assessment = await Assessment.findById(attempt.assessmentId);
        attempt.submittedAt = new Date();
        attempt.status = 'submitted';

        // Score calculation
        let totalPoints = 0, scoredPoints = 0, totalQ = 0, attempted = 0, correct = 0, wrong = 0;
        const sectionScores = [];

        for (const section of assessment.sections) {
            let sp = 0, sc = 0, sw = 0, sa = 0;
            for (const q of section.questions) {
                totalPoints += q.points || 1;
                totalQ++;
                const resp = attempt.responses?.find(r => r.questionId === q.questionId);
                if (resp) { sa++; attempted++; if (resp.isCorrect) { correct++; sc++; sp += resp.pointsAwarded || 0; } else { wrong++; sw++; sp -= q.negativeMark || 0; } }
            }
            scoredPoints += sp;
            sectionScores.push({ sectionId: section.sectionId, sectionName: section.sectionName, totalQuestions: section.questions.length, attemptedQuestions: sa, correctAnswers: sc, wrongAnswers: sw, skippedQuestions: section.questions.length - sa, totalPoints: section.totalPoints || section.questions.reduce((s,q)=>s+q.points,0), scoredPoints: sp, percentage: section.totalPoints ? (sp/section.totalPoints)*100 : 0 });
        }

        const pct = totalPoints ? (scoredPoints / totalPoints) * 100 : 0;
        attempt.scoring = {
            sections: sectionScores,
            overall: { totalQuestions: totalQ, attemptedQuestions: attempted, correctAnswers: correct, wrongAnswers: wrong, skippedQuestions: totalQ - attempted, totalPoints, scoredPoints, percentage: pct, grade: calculateGrade(pct), passed: pct >= 40 },
            timeTaken: Math.floor((attempt.submittedAt - attempt.startedAt) / 1000)
        };

        await attempt.save();
        res.json({ success: true, data: attempt });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /assessment/attempt/:attemptId/answer ─────────────────────────────
exports.submitAnswer = async (req, res) => {
    try {
        const { sectionId, questionId, answer, timeTaken, flaggedForReview } = req.body;
        const attempt = await AssessmentAttempt.findById(req.params.attemptId);
        if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

        const assessment = await Assessment.findById(attempt.assessmentId);
        let isCorrect = false, pointsAwarded = 0;

        const section = assessment.sections.find(s => s.sectionId === sectionId);
        const question = section?.questions.find(q => q.questionId === questionId);

        if (question) {
            if (question.questionType === 'mcq') {
                const correctOpt = question.options.find(o => o.isCorrect);
                isCorrect = answer === correctOpt?.optionId;
                pointsAwarded = isCorrect ? (question.points || 1) : -(question.negativeMark || 0);
            } else if (question.questionType === 'true-false') {
                isCorrect = String(answer) === String(question.correctAnswer);
                pointsAwarded = isCorrect ? (question.points || 1) : 0;
            }
            // essay / coding: scored manually or later
        }

        const idx = attempt.responses.findIndex(r => r.sectionId === sectionId && r.questionId === questionId);
        const responseData = { sectionId, questionId, answer, isCorrect, pointsAwarded, timeTaken: timeTaken || 0, attemptedAt: new Date(), flaggedForReview: !!flaggedForReview };
        if (idx >= 0) attempt.responses[idx] = responseData;
        else attempt.responses.push(responseData);

        await attempt.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /assessment/attempt/:attemptId/violation ──────────────────────────
exports.logViolation = async (req, res) => {
    try {
        const { type, severity, details } = req.body;
        const attempt = await AssessmentAttempt.findById(req.params.attemptId);
        if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

        attempt.proctoring.violations.push({ type, severity: severity || 'medium', details, timestamp: new Date() });
        attempt.proctoring.totalViolations++;
        if (type === 'tab-switch')      attempt.proctoring.tabSwitchCount++;
        if (type === 'window-minimize') attempt.proctoring.windowMinimizeCount++;
        if (type === 'copy-attempt')    attempt.proctoring.copyAttempts++;
        if (type === 'paste-attempt')   attempt.proctoring.pasteAttempts++;

        // Auto-disqualify check
        const assessment = await Assessment.findById(attempt.assessmentId);
        const limits = assessment?.proctoring?.features?.violations;
        const autoSub = limits?.autoSubmitOnViolation;
        const overTabs = limits?.maxTabSwitches > 0 && attempt.proctoring.tabSwitchCount > limits.maxTabSwitches;
        const overMin  = limits?.maxWindowMinimizes > 0 && attempt.proctoring.windowMinimizeCount > limits.maxWindowMinimizes;

        if (autoSub && (overTabs || overMin)) {
            attempt.status = 'disqualified';
            attempt.proctoring.autoSubmitted = true;
            attempt.proctoring.disqualificationReason = `Max violations exceeded (${type})`;
            attempt.submittedAt = new Date();
        }

        await attempt.save();
        res.json({ success: true, totalViolations: attempt.proctoring.totalViolations, disqualified: attempt.status === 'disqualified' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /assessment/execute-code ── Piston API (free, no key) ────────────
exports.executeCode = async (req, res) => {
    try {
        const { code, language, stdin = '' } = req.body;
        const LANG_MAP = { javascript: { language: 'javascript', version: '18.15.0' }, python: { language: 'python', version: '3.10.0' }, java: { language: 'java', version: '15.0.2' }, 'c++': { language: 'c++', version: '10.2.0' }, c: { language: 'c', version: '10.2.0' } };
        const lang = LANG_MAP[language?.toLowerCase()] || LANG_MAP.python;

        const body = JSON.stringify({ language: lang.language, version: lang.version, files: [{ content: code }], stdin });
        const options = { hostname: 'emkc.org', path: '/api/v2/piston/execute', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };

        const result = await new Promise((resolve, reject) => {
            const reqHttp = require('https').request(options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(JSON.parse(data)));
            });
            reqHttp.on('error', reject);
            reqHttp.write(body);
            reqHttp.end();
        });

        const run = result.run || {};
        res.json({ success: true, data: { stdout: run.stdout || '', stderr: run.stderr || '', output: run.output || '', exitCode: run.code ?? 0 } });
    } catch (err) { res.status(500).json({ success: false, message: 'Code execution failed: ' + err.message }); }
};

// ── GET /assessment/attempt/:attemptId/result ─────────────────────────────
exports.getAttemptResult = async (req, res) => {
    try {
        const attempt = await AssessmentAttempt.findById(req.params.attemptId)
            .populate('assessmentId', 'basicInfo testType schedule proctoring')
            .populate('studentId', 'name email');
        if (!attempt) return res.status(404).json({ success: false, message: 'Result not found' });

        // Generate AI analysis if not done
        if (!attempt.aiAnalysis?.generatedAt && attempt.status !== 'in-progress') {
            try {
                const prompt = `Analyze this exam performance and return JSON with keys: strengthAreas (array of strings), weakAreas (array of strings), recommendations (array of strings), predictedJobFit (0-100 number).
Performance: overall ${attempt.scoring?.overall?.percentage?.toFixed(1)}%, correct ${attempt.scoring?.overall?.correctAnswers}, wrong ${attempt.scoring?.overall?.wrongAnswers}, grade ${attempt.scoring?.overall?.grade}.`;
                const analysis = await callGroq(prompt, 'You are a career counselor. Return ONLY valid JSON.');
                attempt.aiAnalysis = { ...analysis, generatedAt: new Date() };
                await attempt.save();
            } catch {}
        }

        // Calculate rank among all attempts
        const allAttempts = await AssessmentAttempt.find({ assessmentId: attempt.assessmentId, status: { $in: ['submitted','evaluated'] } }).sort({ 'scoring.overall.percentage': -1 });
        const rank = allAttempts.findIndex(a => a._id.toString() === attempt._id.toString()) + 1;
        const percentile = allAttempts.length > 1 ? Math.round(((allAttempts.length - rank) / (allAttempts.length - 1)) * 100) : 100;

        res.json({ success: true, data: { ...attempt.toObject(), rank, percentile, totalParticipants: allAttempts.length } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /assessment/generate-text ── plain-text AI generation ────────────
exports.generateText = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ success: false, message: 'Prompt required' });

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a professional HR and assessment expert. Return ONLY the requested text with no extra explanation, no JSON, no markdown.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const text = completion.choices[0]?.message?.content || '';
        res.json({ success: true, text: text.trim() });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /assessment/:id/duplicate ── Duplicate an Assessment ────────────
exports.duplicateAssessment = async (req, res) => {
    try {
        const Assessment = require('../models/Assessment'); // Ensure imported in scope if not globally
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
        
        // Convert to plain object and clone
        const assessmentObj = assessment.toObject();
        delete assessmentObj._id;
        delete assessmentObj.__v;
        delete assessmentObj.createdAt;
        delete assessmentObj.updatedAt;
        
        // Wipe assigned students and resets state to draft
        assessmentObj.basicInfo.title = `${assessmentObj.basicInfo.title} (Reconduct)`;
        assessmentObj.status = 'draft'; 
        assessmentObj.studentsArr = []; 

        if (assessmentObj.sections) {
            const crypto = require('crypto');
            assessmentObj.sections.forEach(sec => {
                sec.sectionId = crypto.randomUUID();
                sec.questions.forEach(q => q.questionId = crypto.randomUUID());
            });
        }
        
        const newAssessment = await Assessment.create(assessmentObj);
        res.status(201).json({ success: true, message: 'Assessment duplicated successfully', data: newAssessment });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to duplicate assessment', error: err.message });
    }
};

// ── PUT /assessment/attempt/:attemptId/status ── Manually override attempt status ──
exports.updateAttemptStatus = async (req, res) => {
    try {
        const { manualStatus } = req.body;
        console.log(`Updating Attempt ${req.params.attemptId} -> ${manualStatus}`);
        if (!['auto', 'shortlisted', 'rejected'].includes(manualStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const AssessmentAttempt = require('../models/AssessmentAttempt');
        const attempt = await AssessmentAttempt.findById(req.params.attemptId);
        if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
        
        attempt.manualStatus = manualStatus;
        await attempt.save();
        
        res.json({ success: true, data: attempt });
    } catch (err) {
        console.error("STATUS UPDATE ERROR: ", err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
