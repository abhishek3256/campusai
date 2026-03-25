const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    avatar: { type: String },
    phone: { type: String },
    dateOfBirth: { type: Date },

    education: [{
        degree: String,
        institution: String,
        stream: { type: String, enum: ['Science', 'Commerce', 'Arts', 'Engineering', 'Medical'] },
        cgpa: Number,
        percentage: Number,
        startYear: Number,
        endYear: Number,
        marksheet: String // Cloudinary URL
    }],

    tenthMarks: Number,
    tenthMarksheet: String, // Cloudinary URL
    twelfthMarks: Number,
    twelfthMarksheet: String, // Cloudinary URL

    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }, // Reference to Resume model
    resumeUrl: String, // Cloudinary URL (legacy)
    parsedResume: {
        skills: [String],
        experience: [{
            title: String,
            company: String,
            duration: String,
            description: String
        }],
        projects: [String],
        certifications: [String]
    },

    profileStrengthScore: { type: Number, default: 0 },
    aiSkills: [String],
    recommendedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],

    careerGoals: String,
    suggestedUpskilling: [String]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
