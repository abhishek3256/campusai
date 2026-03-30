const Application = require('../models/Application');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Resume = require('../models/Resume');
const { matchSkills } = require('../utils/skillMatcher');
const { generateApplicationSummary, prepareSkillsForVerification } = require('../utils/aiApplicationSummary');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build initial pipelineProgress from a job's recruitmentPipeline
// ─────────────────────────────────────────────────────────────────────────────
function buildInitialPipelineProgress(job) {
    if (!job.recruitmentPipeline || !job.recruitmentPipeline.stages || job.recruitmentPipeline.stages.length === 0) {
        return { currentStageId: null, currentStageOrder: 0, stageResults: [] };
    }

    const sorted = [...job.recruitmentPipeline.stages]
        .filter(s => s.isEnabled)
        .sort((a, b) => a.order - b.order);

    const stageResults = sorted.map(stage => ({
        stageId: stage.stageId,
        stageName: stage.stageName,
        order: stage.order,
        status: 'pending'
    }));

    return {
        currentStageId: null,
        currentStageOrder: 0,
        stageResults
    };
}

// ─────────────────────────────────────────────────────────────────────────────
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

        const resume = await Resume.findOne({ studentId: student._id }).sort({ uploadedAt: -1 });
        if (!resume) {
            return res.status(400).json({ message: 'Please upload a resume first' });
        }

        const matchResult = await matchSkills(job.requirements?.skills || job.skills || [], student.aiSkills);
        const aiSummary = await generateApplicationSummary(student, resume, job);
        const skillsForVerification = prepareSkillsForVerification(resume.parsedData, resume.aiAnalysis);

        // Build initial pipeline progress from job's recruitmentPipeline
        const pipelineProgress = buildInitialPipelineProgress(job);

        const application = await Application.create({
            studentId: student._id,
            jobId,
            companyId: job.companyId,
            overallStatus: 'Application Pending',
            pipelineProgress,
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

// ─────────────────────────────────────────────────────────────────────────────
exports.getApplicationDetails = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('studentId')
            .populate('jobId')
            .populate('companyId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update overall status (company action)
// PUT /api/applications/:id/status
// ─────────────────────────────────────────────────────────────────────────────
exports.updateOverallStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        const prevStatus = application.overallStatus;
        application.overallStatus = status;

        // Keep legacy status in sync for backward compat
        const legacyMap = {
            'Application Pending': 'pending',
            'Application Under Review': 'under-review',
            'Application Shortlisted': 'shortlisted',
            'Application Rejected': 'rejected',
            'In Progress': 'shortlisted',
            'Selected': 'accepted',
            'Offer Accepted': 'accepted',
            'Offer Rejected': 'rejected',
            'Joined': 'joined',
            'Withdrawn': 'rejected'
        };
        if (legacyMap[status]) application.status = legacyMap[status];

        // Stage sync
        const stageMap = {
            'Application Under Review': 'under_review',
            'Application Shortlisted': 'under_review',
            'Application Rejected': 'rejected',
            'Selected': 'selected',
            'Offer Accepted': 'offer_accepted',
            'Joined': 'joined'
        };
        if (stageMap[status]) application.currentStage = stageMap[status];

        // Track history
        application.statusHistory.push({
            status,
            stage: stageMap[status] || application.currentStage,
            timestamp: new Date(),
            updatedBy: req.user._id,
            reason: reason || `Status changed to ${status}`
        });

        if (status === 'Application Rejected' || status === 'Withdrawn') {
            application.rejectedAt = new Date();
            application.rejectionReason = reason || status;
        }
        if (status === 'Joined') application.joinedAt = new Date();

        application.updatedAt = new Date();
        await application.save();

        res.json({ success: true, data: application });
    } catch (error) {
        console.error('Update overallStatus error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Advance to next pipeline stage
// POST /api/applications/:id/advance-stage
// ─────────────────────────────────────────────────────────────────────────────
exports.advanceToNextStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { passCurrentStage = true, notes } = req.body;

        const application = await Application.findById(id).populate('jobId');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        const stageResults = application.pipelineProgress?.stageResults || [];
        if (stageResults.length === 0) {
            return res.status(400).json({ message: 'No pipeline stages configured for this job' });
        }

        const sorted = [...stageResults].sort((a, b) => a.order - b.order);
        const currentOrder = application.pipelineProgress.currentStageOrder || 0;

        // Mark current stage as passed if requested
        if (currentOrder > 0 && passCurrentStage) {
            const currentIdx = application.pipelineProgress.stageResults.findIndex(
                s => s.order === currentOrder
            );
            if (currentIdx !== -1) {
                application.pipelineProgress.stageResults[currentIdx].status = 'passed';
                application.pipelineProgress.stageResults[currentIdx].completedAt = new Date();
                if (notes) application.pipelineProgress.stageResults[currentIdx].notes = notes;
            }
        }

        // Find next pending stage
        const nextStage = sorted.find(s => s.order > currentOrder && s.status === 'pending');

        if (!nextStage) {
            // All stages complete → Selected!
            application.overallStatus = 'Selected';
            application.status = 'accepted';
            application.currentStage = 'selected';
            application.statusHistory.push({
                status: 'Selected',
                stage: 'selected',
                timestamp: new Date(),
                updatedBy: req.user._id,
                reason: 'All pipeline stages completed — Student Selected!'
            });
            application.updatedAt = new Date();
            await application.save();
            return res.json({ success: true, data: application, message: 'Student selected! All stages completed.' });
        }

        // Advance to nextStage
        application.pipelineProgress.currentStageId = nextStage.stageId;
        application.pipelineProgress.currentStageOrder = nextStage.order;

        const nextIdx = application.pipelineProgress.stageResults.findIndex(s => s.order === nextStage.order);
        if (nextIdx !== -1) {
            application.pipelineProgress.stageResults[nextIdx].status = 'in_progress';
            application.pipelineProgress.stageResults[nextIdx].startedAt = new Date();
        }

        // Update overall status
        application.overallStatus = 'In Progress';
        application.status = 'shortlisted';
        application.currentStage = 'assessment_assigned';

        application.statusHistory.push({
            status: 'In Progress',
            stage: nextStage.stageName,
            timestamp: new Date(),
            updatedBy: req.user._id,
            reason: `Advanced to stage: ${nextStage.stageName}`
        });

        application.updatedAt = new Date();
        application.markModified('pipelineProgress');
        await application.save();

        res.json({ success: true, data: application, currentStage: nextStage });
    } catch (error) {
        console.error('Advance stage error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fail current stage (reject at stage level)
// POST /api/applications/:id/fail-stage
// ─────────────────────────────────────────────────────────────────────────────
exports.failCurrentStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        const currentOrder = application.pipelineProgress.currentStageOrder;
        if (currentOrder > 0) {
            const idx = application.pipelineProgress.stageResults.findIndex(s => s.order === currentOrder);
            if (idx !== -1) {
                application.pipelineProgress.stageResults[idx].status = 'failed';
                application.pipelineProgress.stageResults[idx].completedAt = new Date();
                application.pipelineProgress.stageResults[idx].notes = reason || 'Failed at this stage';
            }
        }

        application.overallStatus = 'Application Rejected';
        application.status = 'rejected';
        application.currentStage = 'rejected';
        application.rejectedAt = new Date();
        application.rejectionReason = reason || 'Failed at recruitment stage';

        application.statusHistory.push({
            status: 'Application Rejected',
            stage: 'rejected',
            timestamp: new Date(),
            updatedBy: req.user._id,
            reason: reason || 'Failed at stage'
        });

        application.updatedAt = new Date();
        application.markModified('pipelineProgress');
        await application.save();

        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
