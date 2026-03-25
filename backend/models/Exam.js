const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: { type: String, enum: ['mcq', 'descriptive', 'coding'], default: 'mcq' },
    question: { type: String, required: true },
    options: [{ type: String }],       // MCQ options
    correctAnswer: { type: Number, default: -1 }, // MCQ index
    marks: { type: Number, default: 1 },
    description: { type: String, default: '' }, // coding/descriptive hint
});

const examSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: '' },
    duration: { type: Number, default: 60 }, // minutes
    totalMarks: { type: Number, default: 0 },
    questions: [questionSchema],
    scheduledAt: { type: Date },
    isActive: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
