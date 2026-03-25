const mongoose = require('mongoose');

const resumeTemplateSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    templateName: { type: String, default: 'My Resume' },
    formData: {
        personal: {
            name: String, email: String, phone: String, location: String,
            linkedin: String, github: String, portfolio: String, summary: String
        },
        education: [{
            institution: String, degree: String, field: String,
            gpa: String, startYear: String, endYear: String
        }],
        experience: [{
            company: String, role: String, location: String,
            startDate: String, endDate: String, current: Boolean,
            description: String
        }],
        skills: [String],
        projects: [{
            name: String, description: String, techStack: String,
            link: String, github: String
        }],
        certifications: [{
            name: String, issuer: String, year: String, link: String
        }]
    },
    generatedContent: { type: String, default: '' }, // AI-polished resume text
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ResumeTemplate', resumeTemplateSchema);
