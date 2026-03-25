const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
});

const interviewScheduleSchema = new mongoose.Schema({
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    jobTitle: { type: String, default: '' },
    slots: [slotSchema],
    confirmedSlot: slotSchema,
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    meetLink: { type: String, default: '' },
    venue: { type: String, default: '' },
    round: { type: String, default: 'Round 1' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewSchedule', interviewScheduleSchema);
