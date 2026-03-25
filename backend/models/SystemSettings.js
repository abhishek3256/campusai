const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    general: {
        siteName: { type: String, default: 'Campus AI' },
        siteDescription: { type: String, default: 'AI-powered campus placement platform' },
        supportEmail: { type: String, default: 'support@campusai.in' },
        maintenanceMode: { type: Boolean, default: false },
        allowRegistration: { type: Boolean, default: true }
    },
    features: {
        enableAIFeatures: { type: Boolean, default: true },
        enableResumeVerification: { type: Boolean, default: true },
        enableJobRecommendations: { type: Boolean, default: true },
        enableInterviewPrep: { type: Boolean, default: true },
        enableCareerRoadmap: { type: Boolean, default: true },
        enableExamModule: { type: Boolean, default: true }
    },
    limits: {
        maxResumeSize: { type: Number, default: 10 },       // MB
        maxApplicationsPerStudent: { type: Number, default: 100 },
        maxJobsPerCompany: { type: Number, default: 50 }
    },
    notifications: {
        emailOnNewRegistration: { type: Boolean, default: true },
        emailOnJobPosted: { type: Boolean, default: true },
        emailOnApplicationReceived: { type: Boolean, default: true }
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
