const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    ticketNumber: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userType: { type: String, enum: ['student', 'company', 'other'], default: 'other' },
    subject: { type: String, required: true },
    category: {
        type: String,
        enum: ['technical', 'account', 'application', 'verification', 'exam', 'other'],
        default: 'other'
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    messages: [{
        senderId: mongoose.Schema.Types.ObjectId,
        senderName: String,
        senderType: { type: String, enum: ['user', 'admin'] },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-generate ticket number before save
supportTicketSchema.pre('save', async function (next) {
    if (!this.ticketNumber) {
        const count = await mongoose.model('SupportTicket').countDocuments();
        this.ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
