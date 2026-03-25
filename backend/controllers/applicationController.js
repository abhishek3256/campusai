const Application = require('../models/Application');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Resume = require('../models/Resume');
const { matchSkills } = require('../utils/skillMatcher');
const { generateApplicationSummary, prepareSkillsForVerification } = require('../utils/aiApplicationSummary');

exports.applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const student = await Student.findOne({ userId: req.user._id });

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found. Please complete your profile first.' });
        }

        const job = await Job.findById(jobId).populate('companyId');
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const exists = await Application.findOne({ studentId: student._id, jobId });
        if (exists) return res.status(400).json({ message: 'Already applied' });

        // Get student's resume
        const resume = await Resume.findOne({ studentId: student._id }).sort({ uploadedAt: -1 });
        if (!resume) {
            return res.status(400).json({ message: 'Please upload a resume first' });
        }

        // Calculate AI Match Score
        const matchResult = await matchSkills(job.requirements?.skills || job.skills || [], student.aiSkills);

        console.log('Generating AI summary for application...');

        // Generate AI summary for company
        const aiSummary = await generateApplicationSummary(student, resume, job);

        // Prepare skills for verification
        const skillsForVerification = prepareSkillsForVerification(
            resume.parsedData,
            resume.aiAnalysis
        );

        const application = await Application.create({
            studentId: student._id,
            jobId,
            companyId: job.companyId,
            aiMatchScore: matchResult.matchPercentage || 0,
            missingSkills: matchResult.missingSkills || [],
            aiGeneratedSummary: aiSummary,
            skillsVerification: skillsForVerification,
            verificationSummary: {
                totalSkills: skillsForVerification.length,
                verifiedSkills: 0,
                rejectedSkills: 0,
                redFlaggedSkills: 0,
                verificationScore: 0,
                overallStatus: 'not-started'
            },
            coverLetter: req.body.coverLetter
        });

        // Add to update arrays
        job.applications.push(application._id);
        await job.save();

        student.applications.push(application._id);
        await student.save();

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });
    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getApplicationDetails = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('studentId')
            .populate('jobId')
            .populate('companyId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
