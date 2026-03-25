const mongoose = require('mongoose');

const aptitudeTestSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    category: { type: String, enum: ['quantitative', 'logical', 'verbal', 'mixed'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number, // index of correct option
        explanation: String,
        category: String
    }],
    studentAnswers: [{ type: Number, default: -1 }], // -1 = not answered
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 10 },
    timeTaken: { type: Number, default: 0 }, // seconds
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AptitudeTest', aptitudeTestSchema);
