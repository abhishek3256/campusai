const mongoose = require('mongoose');

const contentTemplateSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type: { type: String, enum: ['linkedin', 'email_followup', 'email_thankyou', 'email_inquiry'], required: true },
    title: { type: String, required: true },
    subject: { type: String, default: '' }, // For emails
    content: { type: String, required: true },
    context: {
        companyName: String,
        jobTitle: String,
        interviewerName: String,
        sentiment: { type: String, enum: ['professional', 'enthusiastic', 'formal'], default: 'professional' }
    },
    isFavorite: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ContentTemplate', contentTemplateSchema);
