const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: String,
    action: {
        type: String,
        required: true,
        enum: [
            'user_created', 'user_updated', 'user_deleted', 'user_banned', 'user_activated',
            'job_created', 'job_updated', 'job_deleted', 'job_toggled',
            'company_verified', 'company_rejected',
            'document_verified', 'document_rejected',
            'settings_updated', 'bulk_operation',
            'ticket_updated', 'report_generated',
            'login', 'logout'
        ]
    },
    targetType: {
        type: String,
        enum: ['user', 'student', 'company', 'job', 'application', 'document', 'system', 'ticket']
    },
    targetId: mongoose.Schema.Types.ObjectId,
    details: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

activityLogSchema.index({ adminId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
