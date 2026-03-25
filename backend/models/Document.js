const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    documentType: { type: String, enum: ['10th', '12th', 'degree', 'experience', 'certificate'], required: true },
    fileUrl: { type: String, required: true }, // Cloudinary URL

    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    aiExtractedData: {
        marksObtained: Number,
        percentage: Number,
        grade: String,
        institution: String,
        year: Number
    },

    verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
