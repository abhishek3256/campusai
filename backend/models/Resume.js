const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },

    fileUrl: {
        type: String,
        required: true
    },

    fileName: String,
    fileSize: Number,
    uploadedAt: {
        type: Date,
        default: Date.now
    },

    // Parsed Data
    parsedData: {
        personalInfo: {
            name: String,
            email: String,
            phone: String,
            location: String,
            linkedin: String,
            github: String,
            portfolio: String
        },

        summary: String,

        skills: {
            technical: [String],
            softSkills: [String],
            tools: [String],
            languages: [String]
        },

        experience: [{
            title: String,
            company: String,
            location: String,
            startDate: String,
            endDate: String,
            current: Boolean,
            description: String,
            achievements: [String]
        }],

        education: [{
            degree: String,
            institution: String,
            location: String,
            startYear: String,
            endYear: String,
            cgpa: Number,
            percentage: Number,
            stream: String
        }],

        projects: [{
            name: String,
            description: String,
            technologies: [String],
            link: String,
            duration: String
        }],

        certifications: [{
            name: String,
            issuer: String,
            date: String,
            credential: String
        }],

        achievements: [String],
        languages: [String]
    },

    // AI Analysis
    aiAnalysis: {
        overallScore: {
            type: Number,
            min: 0,
            max: 100
        },

        detailedScores: {
            skillsQuality: Number,
            experienceRelevance: Number,
            educationStrength: Number,
            projectsImpact: Number,
            formattingClarity: Number,
            keywordOptimization: Number
        },

        strengths: [String],
        weaknesses: [String],

        recommendations: {
            skillsToAdd: [String],
            sectionsToImprove: [String],
            formattingTips: [String],
            contentSuggestions: [String]
        },

        careerInsights: {
            suitableRoles: [String],
            industryFit: [String],
            experienceLevel: String, // Fresher, Junior, Mid-level, Senior
            estimatedYearsOfExperience: Number
        },

        atsScore: {
            score: Number,
            issues: [String],
            suggestions: [String]
        },

        skillsBreakdown: [{
            skill: String,
            category: String, // Technical, Soft, Tool, Language
            proficiencyLevel: String, // Beginner, Intermediate, Advanced, Expert
            evidenceFound: Boolean,
            contextMentions: Number
        }],

        // Use Mixed to safely store structured red flag objects coming from AI,
        // avoiding cast errors when the shape varies slightly.
        redFlags: [mongoose.Schema.Types.Mixed],

        keyHighlights: [String],

        industryKeywords: {
            present: [String],
            missing: [String]
        },

        generatedAt: {
            type: Date,
            default: Date.now
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
