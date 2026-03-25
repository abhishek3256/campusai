const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['drive', 'internship', 'info', 'urgent'], default: 'info' },
    targetCGPA: { type: Number, default: 0 },
    targetBranches: [{ type: String }],
    deadline: { type: Date },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
