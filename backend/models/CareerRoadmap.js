const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['skill', 'certification', 'project', 'experience', 'education'], default: 'skill' },
    resources: { type: [mongoose.Schema.Types.Mixed], default: [] },
    estimatedDuration: { type: String, default: '2 weeks' },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
});


const careerRoadmapSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    targetRole: { type: String, required: true },
    currentRole: { type: String, default: 'Student' },
    currentSkills: [{ type: String }],
    timeframe: { type: String, default: '6 months' },
    milestones: [milestoneSchema],
    summary: { type: String, default: '' },
    progressPercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CareerRoadmap', careerRoadmapSchema);
