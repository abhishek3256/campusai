const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },

    answers: [{ // indexed same as exam.questions
        questionIndex: { type: Number },
        selectedOption: { type: Number, default: -1 },  // MCQ
        textAnswer: { type: String, default: '' },       // descriptive/coding
    }],

    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentile: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },

    proctoring: {
        tabSwitches: { type: Number, default: 0 },
        fullscreenViolations: { type: Number, default: 0 },
        suspiciousAlerts: [{ event: String, timestamp: Date }],
        isFlagged: { type: Boolean, default: false }
    },

    startedAt: { type: Date },
    submittedAt: { type: Date },
    timeTaken: { type: Number, default: 0 }, // seconds
    isSubmitted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
