const Application = require('../models/Application');
const InterviewSchedule = require('../models/InterviewSchedule');
const Student = require('../models/Student');
const Company = require('../models/Company');
const ActivityLog = require('../models/ActivityLog');
const Announcement = require('../models/Announcement');
const Job = require('../models/Job');
const User = require('../models/User');

// ── STATUS helpers ────────────────────────────────────────────────────────────
const STATUS_ICON = {
    pending:     '⏳', 'under-review': '🔍', shortlisted: '✅',
    rejected:    '❌', accepted:       '🎉', 'verification-failed': '⚠️'
};
const STATUS_COLOR = {
    pending:     'gray',  'under-review': 'blue', shortlisted: 'green',
    rejected:    'red',   accepted:       'green', 'verification-failed': 'orange'
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getStudentNotifications = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.json({ success: true, notifications: [] });

        const apps = await Application.find({ studentId: student._id })
            .populate('jobId', 'title')
            .populate('companyId', 'companyName logo')
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();

        const interviews = await InterviewSchedule.find({ studentId: student._id })
            .populate('companyId', 'companyName')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const announcements = await Announcement.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const notifications = [];

        // Application status updates
        for (const app of apps) {
            const company = app.companyId?.companyName || 'Company';
            const job = app.jobId?.title || 'Job';
            const icon = STATUS_ICON[app.status] || '📋';

            let title = '', body = '', color = STATUS_COLOR[app.status] || 'gray';

            if (app.status === 'shortlisted') {
                title = 'Resume Shortlisted! 🎉';
                body = `Your resume was shortlisted for ${job} at ${company}`;
            } else if (app.status === 'rejected') {
                title = 'Application Update';
                body = `Your application for ${job} at ${company} was not selected this time`;
            } else if (app.status === 'accepted') {
                title = 'Offer Letter Available! 🎊';
                body = `Congratulations! You have been selected for ${job} at ${company}`;
            } else if (app.status === 'under-review') {
                title = 'Application Under Review';
                body = `${company} is reviewing your application for ${job}`;
            } else {
                title = `Application ${icon}`;
                body = `Your application for ${job} at ${company} is ${app.status}`;
            }

            // Interview schedule embedded in application
            if (app.interviewSchedule?.date) {
                notifications.push({
                    id: `interview-${app._id}`,
                    type: 'interview',
                    title: '📅 Interview Scheduled',
                    body: `Interview for ${job} at ${company} on ${new Date(app.interviewSchedule.date).toLocaleDateString('en-IN')}${app.interviewSchedule.time ? ' at ' + app.interviewSchedule.time : ''}`,
                    color: 'blue',
                    time: app.interviewSchedule.date,
                    meta: { company, job, mode: app.interviewSchedule.mode, link: app.interviewSchedule.link }
                });
            }

            notifications.push({
                id: `app-${app._id}`,
                type: 'application',
                title,
                body,
                color,
                time: app.updatedAt,
                meta: { company, job, status: app.status, logo: app.companyId?.logo }
            });
        }

        // Interview schedules (separate model)
        for (const iv of interviews) {
            const slot = iv.confirmedSlot || (iv.slots && iv.slots[0]);
            const company = iv.companyId?.companyName || 'Company';
            notifications.push({
                id: `iv-${iv._id}`,
                type: 'interview',
                title: `🗓️ ${iv.round || 'Interview'} — ${iv.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}`,
                body: `${company} — ${iv.jobTitle || 'Interview'}${slot ? ' on ' + new Date(slot.date).toLocaleDateString('en-IN') + ' ' + slot.startTime : ''}`,
                color: iv.status === 'confirmed' ? 'green' : 'blue',
                time: iv.updatedAt,
                meta: { mode: iv.mode, link: iv.meetLink, venue: iv.venue, round: iv.round }
            });
        }

        // Campus announcements
        for (const ann of announcements) {
            notifications.push({
                id: `ann-${ann._id}`,
                type: 'announcement',
                title: `📢 ${ann.title}`,
                body: ann.body?.substring(0, 120) || 'New announcement',
                color: 'purple',
                time: ann.createdAt,
            });
        }

        // Sort by time desc
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        const lastRead = req.user.lastReadNotificationsAt ? new Date(req.user.lastReadNotificationsAt) : new Date(0);
        const unreadCount = notifications.filter(n => new Date(n.time) > lastRead).length;

        res.json({ success: true, notifications: notifications.slice(0, 30), unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getCompanyNotifications = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.json({ success: true, notifications: [] });

        // New/updated applications
        const apps = await Application.find({ companyId: company._id })
            .populate('studentId', 'name phone')
            .populate('jobId', 'title')
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();

        const announcements = await Announcement.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const interviews = await InterviewSchedule.find({ companyId: company._id })
            .populate('studentId', 'name')
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        const notifications = [];

        // New applications by students
        for (const app of apps) {
            const student = app.studentId?.name || 'A student';
            const job = app.jobId?.title || 'your job';
            notifications.push({
                id: `capp-${app._id}`,
                type: 'application',
                title: app.status === 'pending' ? '📩 New Application' : `📋 Application ${app.status}`,
                body: `${student} applied for ${job}${app.aiMatchScore ? ` — AI match ${app.aiMatchScore}%` : ''}`,
                color: app.status === 'pending' ? 'blue' : 'gray',
                time: app.createdAt,
                meta: { student, job, status: app.status, score: app.aiMatchScore }
            });
        }

        // Interview schedules
        for (const iv of interviews) {
            const student = iv.studentId?.name || 'Student';
            const slot = iv.confirmedSlot || (iv.slots && iv.slots[0]);
            notifications.push({
                id: `civ-${iv._id}`,
                type: 'interview',
                title: `🗓️ Interview — ${iv.jobTitle || 'Role'}`,
                body: `${student} — ${iv.round || 'Interview'}${slot ? ' on ' + new Date(slot.date).toLocaleDateString('en-IN') : ''}${iv.status === 'confirmed' ? ' (Confirmed)' : ''}`,
                color: 'blue',
                time: iv.updatedAt,
                meta: { student, mode: iv.mode, round: iv.round }
            });
        }

        // Campus announcements (e.g. campus visit info)
        for (const ann of announcements) {
            notifications.push({
                id: `cann-${ann._id}`,
                type: 'announcement',
                title: `📢 ${ann.title}`,
                body: ann.body?.substring(0, 120) || 'New announcement',
                color: 'purple',
                time: ann.createdAt,
            });
        }

        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
        const lastRead = req.user.lastReadNotificationsAt ? new Date(req.user.lastReadNotificationsAt) : new Date(0);
        const unreadCount = notifications.filter(n => new Date(n.time) > lastRead).length;

        res.json({ success: true, notifications: notifications.slice(0, 30), unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATIONS (activity log feed)
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAdminNotifications = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

        const ACTION_COLOR = {
            user_created: 'green', user_updated: 'blue', user_banned: 'red', user_activated: 'green',
            user_deleted: 'red', job_deleted: 'red', job_toggled: 'blue',
            company_verified: 'green', company_rejected: 'red',
            document_verified: 'purple', settings_updated: 'amber',
            bulk_operation: 'indigo', report_generated: 'gray', ticket_updated: 'blue',
        };
        const ACTION_ICON = {
            user_created: '👤', user_updated: '✏️', user_banned: '🚫', user_activated: '✅',
            user_deleted: '🗑️', job_deleted: '🗑️', job_toggled: '🔄',
            company_verified: '✅', company_rejected: '❌',
            document_verified: '📄', settings_updated: '⚙️',
            bulk_operation: '📦', report_generated: '📊', ticket_updated: '🎫',
        };

        const notifications = logs.map(l => ({
            id: l._id,
            type: l.action,
            title: `${ACTION_ICON[l.action] || '🔔'} ${l.action?.replace(/_/g, ' ')}`,
            body: l.details || 'Admin action performed',
            color: ACTION_COLOR[l.action] || 'gray',
            time: l.timestamp,
            meta: { admin: l.adminName }
        }));

        const lastRead = req.user.lastReadNotificationsAt ? new Date(req.user.lastReadNotificationsAt) : new Date(0);
        const unreadCount = notifications.filter(n => new Date(n.time) > lastRead).length;

        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id, { lastReadNotificationsAt: new Date() }, { new: true });
        res.json({ success: true, lastRead: user.lastReadNotificationsAt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
