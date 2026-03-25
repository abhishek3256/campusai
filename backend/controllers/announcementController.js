const Announcement = require('../models/Announcement');
const Student = require('../models/Student');

// Admin: POST /admin/announcements
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, body, type, targetCGPA, targetBranches, deadline } = req.body;
        if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body are required' });

        const announcement = new Announcement({
            title, body,
            type: type || 'info',
            targetCGPA: targetCGPA || 0,
            targetBranches: targetBranches || [],
            deadline: deadline ? new Date(deadline) : undefined,
            createdBy: req.user._id
        });
        await announcement.save();
        res.status(201).json({ success: true, data: announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Both: GET /admin/announcements and /student/announcements
exports.getAnnouncements = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = { isActive: true };
        if (type) filter.type = type;

        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: PUT /admin/announcements/:id
exports.updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: DELETE /admin/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
