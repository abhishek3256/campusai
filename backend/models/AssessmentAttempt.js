const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student',    required: true },
    jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },

    startedAt:   Date,
    submittedAt: Date,

    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'submitted', 'evaluated', 'expired', 'disqualified'],
        default: 'scheduled'
    },
    
    manualStatus: {
        type: String,
        enum: ['auto', 'shortlisted', 'rejected'],
        default: 'auto'
    },

    responses: [{
        sectionId:  String,
        questionId: String,
        answer: mongoose.Schema.Types.Mixed,
        code: String,
        language: String,
        isCorrect: Boolean,
        pointsAwarded: Number,
        timeTaken: Number,
        attemptedAt: Date,
        flaggedForReview: Boolean
    }],

    proctoring: {
        violations: [{
            type: { type: String },
            timestamp: Date,
            severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            details: String
        }],
        tabSwitchCount:     { type: Number, default: 0 },
        windowMinimizeCount:{ type: Number, default: 0 },
        copyAttempts:       { type: Number, default: 0 },
        pasteAttempts:      { type: Number, default: 0 },
        totalViolations:    { type: Number, default: 0 },
        suspiciousActivityScore: { type: Number, default: 0 },
        autoSubmitted: Boolean,
        disqualificationReason: String
    },

    scoring: {
        sections: [{
            sectionId: String,
            sectionName: String,
            totalQuestions: Number,
            attemptedQuestions: Number,
            correctAnswers: Number,
            wrongAnswers: Number,
            skippedQuestions: Number,
            totalPoints: Number,
            scoredPoints: Number,
            percentage: Number
        }],
        overall: {
            totalQuestions: Number,
            attemptedQuestions: Number,
            correctAnswers: Number,
            wrongAnswers: Number,
            skippedQuestions: Number,
            totalPoints: Number,
            scoredPoints: Number,
            percentage: Number,
            grade: String,
            passed: Boolean
        },
        timeTaken: Number,
        rank: Number,
        percentile: Number
    },

    aiAnalysis: {
        strengthAreas: [String],
        weakAreas: [String],
        recommendations: [String],
        predictedJobFit: Number,
        generatedAt: Date
    },

    resultPublished: { type: Boolean, default: false },
    resultPublishedAt: Date
}, { timestamps: true });

assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
assessmentAttemptSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
