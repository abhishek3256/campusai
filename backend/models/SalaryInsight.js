const mongoose = require('mongoose');

const salaryInsightSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    role: { type: String, required: true },
    location: { type: String, default: 'India' },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior'], default: 'fresher' },
    minSalary: { type: Number, default: 0 },
    maxSalary: { type: Number, default: 0 },
    avgSalary: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    tips: [{ type: String }],
    marketDemand: { type: String, default: 'Moderate' },
    topCompanies: [{ type: String }],
    relatedRoles: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('SalaryInsight', salaryInsightSchema);
