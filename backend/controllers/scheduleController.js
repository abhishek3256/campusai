const InterviewSchedule = require('../models/InterviewSchedule');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');

// Company: POST /company/schedules — create a new interview schedule
exports.createSchedule = async (req, res) => {
    try {
        const { applicationId, slots, mode, meetLink, venue, round, notes, jobTitle } = req.body;
        if (!applicationId || !slots?.length) return res.status(400).json({ success: false, message: 'Application ID and slots are required' });

        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const application = await Application.findById(applicationId);
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const schedule = new InterviewSchedule({
            applicationId,
            studentId: application.studentId,
            companyId: company._id,
            jobId: application.jobId,
            jobTitle: jobTitle || '',
            slots,
            mode: mode || 'online',
            meetLink: meetLink || '',
            venue: venue || '',
            round: round || 'Round 1',
            notes: notes || '',
            status: 'pending'
        });
        await schedule.save();

        res.status(201).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Create schedule error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Company: GET /company/schedules — all schedules for the company
exports.getSchedulesByCompany = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const schedules = await InterviewSchedule.find({ companyId: company._id })
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
            .populate('jobId', 'title')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: schedules });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Company: PUT /company/schedules/:id — update schedule
exports.updateSchedule = async (req, res) => {
    try {
        const { slots, mode, meetLink, venue, round, notes, status } = req.body;
        const schedule = await InterviewSchedule.findByIdAndUpdate(
            req.params.id,
            { $set: { slots, mode, meetLink, venue, round, notes, status } },
            { new: true }
        );
        if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Company: DELETE /company/schedules/:id
exports.cancelSchedule = async (req, res) => {
    try {
        await InterviewSchedule.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
        res.json({ success: true, message: 'Interview cancelled' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Student: GET /student/schedules — student's upcoming interviews
exports.getSchedulesByStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const schedules = await InterviewSchedule.find({ studentId: student._id, status: { $ne: 'cancelled' } })
            .populate('companyId', 'name logo')
            .populate('jobId', 'title')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: schedules });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Student: PUT /student/schedules/:id/confirm — student confirms a slot
exports.confirmSlot = async (req, res) => {
    try {
        const { confirmedSlot } = req.body;
        const schedule = await InterviewSchedule.findByIdAndUpdate(
            req.params.id,
            { $set: { confirmedSlot, status: 'confirmed' } },
            { new: true }
        );
        if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
