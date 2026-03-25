const Alumni = require('../models/Alumni');
const Student = require('../models/Student');

// POST /student/alumni/register — alumni registers
exports.registerAlumni = async (req, res) => {
    try {
        const { college, graduationYear, currentRole, currentCompany, linkedin, bio, expertise, canGiveMockInterview, canGiveReferral } = req.body;
        if (!graduationYear || !currentRole || !currentCompany) return res.status(400).json({ success: false, message: 'Graduation year, role, and company are required' });

        const existing = await Alumni.findOne({ userId: req.user._id });
        if (existing) {
            const updated = await Alumni.findByIdAndUpdate(existing._id, { $set: req.body }, { new: true }).populate('userId', 'name email');
            return res.json({ success: true, data: updated });
        }

        const alumni = new Alumni({ userId: req.user._id, college, graduationYear, currentRole, currentCompany, linkedin, bio, expertise: expertise || [], canGiveMockInterview: canGiveMockInterview || false, canGiveReferral: canGiveReferral || false });
        await alumni.save();
        const populated = await Alumni.findById(alumni._id).populate('userId', 'name email');
        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/alumni — search alumni
exports.getAlumni = async (req, res) => {
    try {
        const { company, role } = req.query;
        const filter = { isVerified: true };
        if (company) filter.currentCompany = { $regex: company, $options: 'i' };
        if (role) filter.currentRole = { $regex: role, $options: 'i' };

        const alumni = await Alumni.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: alumni });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/alumni/all — get all (including unverified for admin)
exports.getAllAlumni = async (req, res) => {
    try {
        const alumni = await Alumni.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: alumni });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/alumni/:id/connect — request connection
exports.requestConnect = async (req, res) => {
    try {
        const { message } = req.body;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const alumni = await Alumni.findByIdAndUpdate(
            req.params.id,
            { $push: { connectRequests: { studentId: student._id, message: message || '', status: 'pending' } } },
            { new: true }
        );
        if (!alumni) return res.status(404).json({ success: false, message: 'Alumni not found' });
        res.json({ success: true, message: 'Connection request sent!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: PUT /admin/alumni/:id/verify
exports.adminVerifyAlumni = async (req, res) => {
    try {
        const { isVerified } = req.body;
        const alumni = await Alumni.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
        if (!alumni) return res.status(404).json({ success: false, message: 'Alumni not found' });
        res.json({ success: true, data: alumni });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
