const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college: { type: String, default: '' },
    graduationYear: { type: Number, required: true },
    currentRole: { type: String, required: true },
    currentCompany: { type: String, required: true },
    linkedin: { type: String, default: '' },
    bio: { type: String, default: '' },
    expertise: [{ type: String }],
    canGiveMockInterview: { type: Boolean, default: false },
    canGiveReferral: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    connectRequests: [{ studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, message: String, status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Alumni', alumniSchema);
