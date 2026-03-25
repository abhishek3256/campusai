const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    description: String,
    industry: String,
    website: String,
    logo: String, // Cloudinary URL
    location: String,
    size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },

    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    contactPerson: {
        name: String,
        email: String,
        phone: String,
        designation: String
    },

    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
