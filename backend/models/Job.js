const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    stageId: { type: String, required: true },
    stageName: {
        type: String,
        enum: [
            'Application Screening',
            'Resume Shortlisting',
            'Online Assessment',
            'Technical Round',
            'Managerial Round',
            'HR Round',
            'Group Discussion',
            'Case Study',
            'Final Interview',
            'Offer Letter',
            'Document Verification',
            'Joining Letter',
            'Letter of Employment'
        ],
        required: true
    },
    order: { type: Number, required: true },
    isRequired: { type: Boolean, default: true },
    isEnabled: { type: Boolean, default: true },

    // For Online Assessment
    linkedAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },

    // For interview stages
    interviewConfig: {
        duration: { type: Number, default: 60 },
        mode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
        interviewers: [String]
    },

    // For Document Verification
    requiredDocuments: [{
        type: String,
        enum: ['10th Marksheet', '12th Marksheet', 'Degree Certificate', 'Aadhar Card', 'PAN Card', 'Passport Photo', 'Resume', 'Other']
    }]
}, { _id: false });

const jobSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    // Company Display Info
    companyDisplayName: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    industryType: { type: String, default: '' },
    companyDescription: { type: String, default: '' },

    // Job Information
    title: { type: String, required: true },
    description: { type: String, default: '' },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    employmentType: { type: String, enum: ['full-time', 'internship', 'contract', 'part-time'], default: 'full-time' },
    workMode: { type: String, enum: ['on-site', 'remote', 'hybrid'], default: 'on-site' },
    salary: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 }, currency: { type: String, default: 'INR' } },
    stipend: { type: Number, default: 0 },
    bond: { duration: { type: String, default: '' }, conditions: { type: String, default: '' } },
    vacancies: { type: Number, default: 1 },

    // Eligibility
    eligibility: {
        minCGPA: { type: Number, default: 0 },
        branches: [{ type: String }],
        passingYear: { type: Number, default: 0 },
        academicRequirements: { type: String, default: '' }
    },

    // Skills
    skills: {
        mustHave: [{ type: String }],
        goodToHave: [{ type: String }],
        technologies: [{ type: String }]
    },

    // Legacy requirements (kept for backward compat)
    requirements: {
        skills: [String],
        experience: String,
        education: String,
        stream: [String],
        minCGPA: Number,
        minTenthMarks: Number,
        minTwelfthMarks: Number
    },

    // Timeline
    timeline: {
        applicationDeadline: { type: Date },
        shortlistingDate: { type: Date },
        examDate: { type: Date },
        interviewDate: { type: Date },
        finalSelectionDate: { type: Date }
    },

    // ── NEW: Dynamic Recruitment Pipeline ──────────────────────────────────────
    recruitmentPipeline: {
        stages: [stageSchema],
        autoRejectOnFailure: { type: Boolean, default: false }
    },

    // Legacy Recruitment State (kept for backward compat)
    recruitmentStage: {
        type: String,
        enum: ['open', 'shortlisting', 'exam', 'interview', 'results', 'closed'],
        default: 'open'
    },

    // Applications & Results
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
    shortlistedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    selectedStudents: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        offerCTC: { type: Number, default: 0 },
        joiningDate: { type: Date },
        offerStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],

    isActive: { type: Boolean, default: true },
    aiGenerated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
