const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    status: {
        type: String,
        enum: ['pending', 'under-review', 'shortlisted', 'technical-interview', 'hr-interview', 'offered', 'accepted', 'documents-submitted', 'documents-verified', 'joined', 'rejected', 'verification-failed'],
        default: 'pending'
    },

    aiMatchScore: { type: Number, default: 0 },
    missingSkills: [String],

    // AI-Generated Content for Company
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

    // Company Verification
    skillsVerification: [{
        skill: String,
        claimedProficiency: String,
        category: String,

        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'needs-review'],
            default: 'pending'
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        verifiedAt: Date,
        companyNotes: String,
        evidenceInResume: Boolean,
        contextMentions: Number,

        redFlag: {
            isRedFlagged: Boolean,
            reason: String,
            severity: String, // low, medium, high, critical
            flaggedAt: Date
        }
    }],

    // Overall Verification Summary
    verificationSummary: {
        totalSkills: Number,
        verifiedSkills: Number,
        rejectedSkills: Number,
        redFlaggedSkills: Number,
        verificationScore: Number, // Percentage of verified skills
        overallStatus: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed', 'rejected'],
            default: 'not-started'
        },
        completedAt: Date
    },

    coverLetter: String,
    aiGeneratedCoverLetter: String,

    offerLetter: String, // Cloudinary URL
    aiGeneratedOfferLetter: String,

    joiningLetter: String,
    aiGeneratedJoiningLetter: String,

    documents: [{
        type: { type: String, enum: ['pan', 'aadhaar', '10th', '12th', 'uan', 'nsr'] },
        url: String, // Cloudinary URL
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        aiConfidence: Number,
        aiNotes: String,
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date
    }],

    interviewSchedule: {
        date: Date,
        time: String,
        mode: String,
        link: String
    },

    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
