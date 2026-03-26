const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    // Current Stage Tracking
    currentStage: {
        type: String,
        enum: [
            'applied',
            'under_review',
            'assessment_assigned',
            'assessment_completed',
            'technical_interview',
            'managerial_interview',
            'hr_interview',
            'selected',
            'offer_sent',
            'offer_accepted',
            'offer_declined',
            'document_verification',
            'documents_verified',
            'joining_letter_issued',
            'joined',
            'rejected'
        ],
        default: 'applied'
    },

    // Legacy status for backward compatibility, mapped to currentStage
    status: {
        type: String,
        enum: ['pending', 'under-review', 'shortlisted', 'technical-interview', 'hr-interview', 'offered', 'accepted', 'documents-submitted', 'documents-verified', 'joined', 'rejected', 'verification-failed'],
        default: 'pending'
    },

    // Status History
    statusHistory: [{
        stage: String,
        timestamp: Date,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

    // Skills Verification (Pre-existing)
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

    // Assessment Details
    assessment: {
        assignedAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentAttempt' },
        score: Number,
        result: { type: String, enum: ['pass', 'fail', 'pending'] }
    },

    // Interview Rounds
    interviewRounds: [{
        roundNumber: Number,
        roundName: {
            type: String,
            enum: ['Technical Interview', 'Managerial Interview', 'HR Interview', 'Other']
        },
        scheduledDate: Date,
        scheduledTime: String,
        mode: { type: String, enum: ['online', 'offline'] },
        meetingLink: String,
        location: String,
        interviewerName: String,
        interviewerEmail: String,
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled'
        },
        result: {
            type: String,
            enum: ['pass', 'fail', 'pending'],
            default: 'pending'
        },
        feedback: String,
        completedAt: Date
    }],

    // Offer Letter
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

    // Document Verification
    documents: [{
        documentType: {
            type: String,
            enum: ['10th_marksheet', '12th_marksheet', 'degree', 'id_proof', 'photo', 'pan', 'aadhaar', '10th', '12th', 'uan', 'nsr', 'other']
        },
        fileName: String,
        fileUrl: String, // Kept for backward compat with 'url'
        url: String,     // Kept for backward compatibility
        type: String,    // Kept for backward compatibility
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

    // Joining Letter
    joiningLetter: {
        generatedAt: Date,
        sentAt: Date,
        fileUrl: String,
        joiningDate: Date,
        reportingTime: String,
        reportingLocation: String,
        aiGeneratedContent: String
    },

    // Final Status
    joinedAt: Date,
    rejectionReason: String,
    rejectedAt: Date,

    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
