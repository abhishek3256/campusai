const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionId: String,
    questionType: { type: String, enum: ['mcq', 'multiple-select', 'true-false', 'coding', 'essay', 'fill-blank'], default: 'mcq' },
    question: String,
    options: [{ optionId: String, text: String, isCorrect: Boolean }],
    codingProblem: {
        problemStatement: String,
        inputFormat: String,
        outputFormat: String,
        constraints: String,
        sampleInput: String,
        sampleOutput: String,
        hiddenTestCases: [{ input: String, expectedOutput: String, points: Number }],
        allowedLanguages: [String],
        timeLimit: Number,
        memoryLimit: Number
    },
    essayConfig: { minWords: Number, maxWords: Number, keyPoints: [String] },
    correctAnswer: String,
    points: { type: Number, default: 1 },
    negativeMark: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    skill: String,
    explanation: String,
    isAIGenerated: { type: Boolean, default: false }
});

const sectionSchema = new mongoose.Schema({
    sectionId: String,
    sectionName: String,
    sectionType: String,
    skills: [String],
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'medium' },
    questionsCount: Number,
    questions: [questionSchema],
    sectionDuration: Number,
    totalPoints: Number,
    passingScore: Number
});

const assessmentSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },

    basicInfo: {
        title: { type: String, required: true },
        designation: String,
        description: String,
        instructions: { type: String, default: '' }
    },

    testType: {
        type: String,
        enum: ['aptitude', 'technical-mcq', 'coding-round', 'typing-test',
               'situational-judgment', 'personality-assessment', 'case-study',
               'essay-writing', 'technical-interview', 'hr-interview', 'mixed'],
        default: 'technical-mcq'
    },

    schedule: {
        startDate: Date,
        endDate: Date,
        duration: { type: Number, default: 60 },
        timezone: { type: String, default: 'Asia/Kolkata' },
        allowLateSubmission: { type: Boolean, default: false }
    },

    eligibility: {
        minCGPA: Number,
        requiredSkills: [String],
        branches: [String]
    },

    sections: [sectionSchema],

    proctoring: {
        enabled: { type: Boolean, default: true },
        features: {
            webcamMonitoring: { type: Boolean, default: true },
            screenRecording: { type: Boolean, default: false },
            tabSwitchDetection: { type: Boolean, default: true },
            copyPasteDetection: { type: Boolean, default: true },
            violations: {
                maxTabSwitches: { type: Number, default: 3 },
                maxWindowMinimizes: { type: Number, default: 2 },
                autoSubmitOnViolation: { type: Boolean, default: true }
            }
        }
    },

    settings: {
        shuffleQuestions: { type: Boolean, default: true },
        shuffleOptions: { type: Boolean, default: true },
        showResultImmediately: { type: Boolean, default: false },
        allowReview: { type: Boolean, default: true },
        requireFullscreen: { type: Boolean, default: true },
        preventCopyPaste: { type: Boolean, default: true }
    },

    targetStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    invitedCount: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
        default: 'draft'
    },

    results: {
        totalAttempts: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        passRate: { type: Number, default: 0 }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

assessmentSchema.index({ companyId: 1, status: 1 });
assessmentSchema.index({ jobId: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
