const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    category: { type: String, default: 'General' }
});

const interviewPrepSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, default: '' },
    companyName: { type: String, default: '' },
    flashcards: [flashcardSchema],
    notes: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('InterviewPrep', interviewPrepSchema);
