const mongoose = require('mongoose');

// ── Stage Result (per pipeline stage) ─────────────────────────────────────────
const stageResultSchema = new mongoose.Schema({
    stageId: String,
    stageName: String,
    order: Number,

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'passed', 'failed', 'skipped'],
        default: 'pending'
    },

    // Assessment
    assessmentAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentAttempt' },
    score: Number,

    // Interview
    interviewDetails: {
        scheduledDate: Date,
        scheduledTime: String,
        meetingLink: String,
        location: String,
        interviewerName: String,
        feedback: String,
        rating: Number
    },

    // Document Verification
    uploadedDocuments: [{
        documentType: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        aiVerificationStatus: {
            verified: Boolean,
            confidence: Number,
            issues: [String]
        },
        companyApprovalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],

    // AI-Generated Letters (Offer / Joining / Employment)
    generatedLetter: {
        letterType: { type: String, enum: ['offer', 'joining', 'employment'] },
        letterContent: String,     // AI-generated text (rendered in browser)
        pdfUrl: String,            // If PDF is generated via Cloudinary
        generatedAt: Date,
        sentAt: Date,
        viewedAt: Date,
        offerDetails: {
            ctc: Number,
            joiningDate: Date,
            designation: String,
            department: String,
            reportingLocation: String,
            reportingTime: String
        },
        studentResponse: {
            type: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
            respondedAt: Date
        }
    },

    startedAt: Date,
    completedAt: Date,
    notes: String
}, { _id: false });

// ── Main Application Schema ────────────────────────────────────────────────────
const applicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    // ── NEW: Overall Application Status ────────────────────────────────────────
    overallStatus: {
        type: String,
        enum: [
            'Application Pending',       // Just applied (default)
            'Application Under Review',  // Company reviewing
            'Application Shortlisted',   // CV shortlisted
            'Application Rejected',      // Rejected at application stage
            'In Progress',               // In pipeline stages
            'Selected',                  // Final selection
            'Offer Accepted',            // Student accepted offer
            'Offer Rejected',            // Student rejected offer
            'Joined',                    // Joined company
            'Withdrawn'                  // Student withdrew
        ],
        default: 'Application Pending'
    },

    // ── NEW: Pipeline Progress ──────────────────────────────────────────────────
    pipelineProgress: {
        currentStageId: String,
        currentStageOrder: { type: Number, default: 0 },
        stageResults: [stageResultSchema]
    },

    // Legacy status (kept for backward compat with old code)
    currentStage: {
        type: String,
        enum: [
            'applied', 'under_review', 'assessment_assigned', 'assessment_completed',
            'technical_interview', 'managerial_interview', 'hr_interview', 'selected',
            'offer_sent', 'offer_accepted', 'offer_declined', 'document_verification',
            'documents_verified', 'joining_letter_issued', 'joined', 'rejected'
        ],
        default: 'applied'
    },
    status: {
        type: String,
        enum: ['pending', 'under-review', 'shortlisted', 'technical-interview', 'hr-interview',
               'offered', 'accepted', 'documents-submitted', 'documents-verified', 'joined',
               'rejected', 'verification-failed'],
        default: 'pending'
    },

    // Status change history
    statusHistory: [{
        stage: String,
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        notes: String
    }],

    // AI Match Scoring & Summaries
    aiMatchScore: { type: Number, default: 0 },
    missingSkills: [String],
    aiGeneratedSummary: {
        candidateOverview: String,
        keyStrengths: [String],
        relevantExperience: String,
        skillHighlights: [String],
        educationSummary: String,
        projectHighlights: [String],
        matchScore: Number,
        recommendationReason: String,
        potentialConcerns: [String]
    },

    // Skills Verification
    skillsVerification: [{
        skill: String,
        claimedProficiency: String,
        category: String,
        verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected', 'needs-review'], default: 'pending' },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        companyNotes: String,
        evidenceInResume: Boolean,
        contextMentions: Number,
        redFlag: {
            isRedFlagged: Boolean,
            reason: String,
            severity: String,
            flaggedAt: Date
        }
    }],
    verificationSummary: {
        totalSkills: Number,
        verifiedSkills: Number,
        rejectedSkills: Number,
        redFlaggedSkills: Number,
        verificationScore: Number,
        overallStatus: { type: String, enum: ['not-started', 'in-progress', 'completed', 'rejected'], default: 'not-started' },
        completedAt: Date
    },

    coverLetter: String,
    aiGeneratedCoverLetter: String,

    // Legacy Assessment Details
    assessment: {
        assignedAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentAttempt' },
        score: Number,
        result: { type: String, enum: ['pass', 'fail', 'pending'] }
    },

    // Legacy Interview Rounds
    interviewRounds: [{
        roundNumber: Number,
        roundName: { type: String, enum: ['Technical Interview', 'Managerial Interview', 'HR Interview', 'Other'] },
        scheduledDate: Date,
        scheduledTime: String,
        mode: { type: String, enum: ['online', 'offline'] },
        meetingLink: String,
        location: String,
        interviewerName: String,
        interviewerEmail: String,
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
        result: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
        feedback: String,
        completedAt: Date
    }],

    // Legacy Offer Letter
    offerLetter: {
        generatedAt: Date,
        sentAt: Date,
        fileUrl: String,
        ctc: Number,
        joiningDate: Date,
        acceptedAt: Date,
        rejectedAt: Date,
        aiGeneratedContent: String
    },

    // Legacy Documents
    documents: [{
        documentType: {
            type: String,
            enum: ['10th_marksheet', '12th_marksheet', 'degree', 'id_proof', 'photo', 'pan', 'aadhaar', '10th', '12th', 'uan', 'nsr', 'other']
        },
        fileName: String,
        fileUrl: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
        aiVerification: {
            verified: Boolean,
            confidence: Number,
            extractedData: Object,
            issues: [String],
            verifiedAt: Date
        },
        companyVerification: {
            status: { type: String, enum: ['pending', 'approved', 'rejected'] },
            verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            verifiedAt: Date,
            remarks: String
        },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        aiConfidence: Number,
        aiNotes: String,
        verifiedAt: Date
    }],

    // Legacy Joining Letter
    joiningLetter: {
        generatedAt: Date,
        sentAt: Date,
        fileUrl: String,
        joiningDate: Date,
        reportingTime: String,
        reportingLocation: String,
        aiGeneratedContent: String
    },

    joinedAt: Date,
    rejectionReason: String,
    rejectedAt: Date,
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
