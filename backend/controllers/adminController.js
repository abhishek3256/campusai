const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const SupportTicket = require('../models/SupportTicket');
const SystemSettings = require('../models/SystemSettings');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');

// ── Helper: log admin action ──────────────────────────────────────────────────
const log = (adminId, adminName, action, targetType, targetId, details, metadata = {}) =>
    ActivityLog.create({ adminId, adminName, action, targetType, targetId, details, metadata }).catch(() => {});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);

        const [
            totalUsers, totalStudents, totalCompanies, totalJobs, activeJobs,
            totalApplications, pendingDocs, pendingCompanies,
            todayReg, todayApps, openTickets
        ] = await Promise.all([
            User.countDocuments(),
            Student.countDocuments(),
            Company.countDocuments(),
            Job.countDocuments(),
            Job.countDocuments({ isActive: true }),
            Application.countDocuments(),
            Document.countDocuments({ verificationStatus: 'pending' }),
            Company.countDocuments({ isVerified: false }),
            User.countDocuments({ createdAt: { $gte: todayStart } }),
            Application.countDocuments({ createdAt: { $gte: todayStart } }),
            SupportTicket.countDocuments({ status: { $in: ['open', 'in-progress'] } })
        ]);

        // User growth last 30 days
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Application status breakdown
        const appStatus = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Placement funnel
        const placedCount = await Application.countDocuments({ status: 'accepted' });
        const shortlistedCount = await Application.countDocuments({ status: { $in: ['shortlisted', 'accepted'] } });
        const interviewedCount = await Application.countDocuments({ status: { $in: ['interview', 'accepted'] } });
        const examAttempts = await ExamAttempt.countDocuments({ isSubmitted: true });

        // Top companies by applications
        const topCompanies = await Application.aggregate([
            { $group: { _id: '$companyId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 5 },
            { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'c' } },
            { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
            { $project: { companyName: '$c.companyName', count: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers, totalStudents, totalCompanies, totalJobs, activeJobs,
                    totalApplications, pendingDocs, pendingCompanies,
                    todayReg, todayApps, openTickets
                },
                charts: { userGrowth, appStatus },
                funnel: [
                    { stage: 'Applied', value: totalApplications },
                    { stage: 'Shortlisted', value: shortlistedCount },
                    { stage: 'Exam Taken', value: examAttempts },
                    { stage: 'Interviewed', value: interviewedCount },
                    { stage: 'Selected', value: placedCount },
                ],
                topCompanies
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
        const query = {};
        if (role) query.role = role;
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (search) query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User.find(query).sort({ [sortBy]: order === 'desc' ? -1 : 1 }).skip(skip).limit(parseInt(limit)).select('-password').lean(),
            User.countDocuments(query)
        ]);

        // Enrich with role-specific name
        const enriched = await Promise.all(users.map(async u => {
            if (u.role === 'student') {
                const s = await Student.findOne({ userId: u._id }).select('name phone').lean();
                return { ...u, displayName: s?.name };
            }
            if (u.role === 'company') {
                const c = await Company.findOne({ userId: u._id }).select('companyName isVerified').lean();
                return { ...u, displayName: c?.companyName, isVerified: c?.isVerified };
            }
            return u;
        }));

        res.json({ success: true, data: { users: enriched, total, page: +page, pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let profile = null;
        if (user.role === 'student') profile = await Student.findOne({ userId: user._id }).lean();
        if (user.role === 'company') profile = await Company.findOne({ userId: user._id }).populate('jobs', 'title isActive').lean();

        const recentLogs = await ActivityLog.find({ targetId: user._id }).sort({ timestamp: -1 }).limit(10).lean();
        res.json({ success: true, data: { user, profile, recentLogs } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await log(req.user._id, req.user.name || req.user.email, 'user_updated', 'user', user._id, `Updated ${user.email}`);
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deactivateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await log(req.user._id, req.user.email, 'user_banned', 'user', user._id, `Deactivated ${user.email}`);
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.activateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await log(req.user._id, req.user.email, 'user_activated', 'user', user._id, `Activated ${user.email}`);
        res.json({ success: true, message: 'User activated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // Cascade-soft by deactivating rather than hard delete to preserve data integrity
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        await user.save();
        await log(req.user._id, req.user.email, 'user_deleted', 'user', user._id, `Deleted user: ${user.email}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.bulkUserAction = async (req, res) => {
    try {
        const { userIds, action } = req.body; // action: 'activate' | 'deactivate'
        const update = action === 'activate' ? { isActive: true } : { isActive: false };
        const result = await User.updateMany({ _id: { $in: userIds } }, update);
        await log(req.user._id, req.user.email, 'bulk_operation', 'user', null, `Bulk ${action} — ${result.modifiedCount} users`, { userIds });
        res.json({ success: true, message: `${result.modifiedCount} users ${action}d`, modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// JOB MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAllJobsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const query = {};
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (search) query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
        ];

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [jobs, total] = await Promise.all([
            Job.find(query).populate('companyId', 'companyName').sort({ [sortBy]: order === 'desc' ? -1 : 1 }).skip(skip).limit(parseInt(limit)).lean(),
            Job.countDocuments(query)
        ]);

        // Add app count
        const enriched = await Promise.all(jobs.map(async j => {
            const appCount = await Application.countDocuments({ jobId: j._id });
            return { ...j, appCount };
        }));

        res.json({ success: true, data: { jobs: enriched, total, page: +page, pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.adminToggleJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        job.isActive = !job.isActive;
        await job.save();
        await log(req.user._id, req.user.email, 'job_toggled', 'job', job._id, `${job.isActive ? 'Activated' : 'Deactivated'} job: ${job.title}`);
        res.json({ success: true, isActive: job.isActive, message: `Job ${job.isActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.adminDeleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        await log(req.user._id, req.user.email, 'job_deleted', 'job', job._id, `Deleted job: ${job.title}`);
        res.json({ success: true, message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAllCompanies = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status === 'pending') query.isVerified = false;
        if (status === 'verified') query.isVerified = true;
        const companies = await Company.find(query).populate('userId', 'email createdAt').sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: companies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.verifyCompany = async (req, res) => {
    try {
        const { decision, notes } = req.body; // 'approve' | 'reject'
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
        company.isVerified = decision === 'approve';
        if (notes) company.rejectionNotes = notes;
        await company.save();
        await log(req.user._id, req.user.email, decision === 'approve' ? 'company_verified' : 'company_rejected', 'company', company._id, `${decision === 'approve' ? 'Verified' : 'Rejected'} ${company.companyName}`, { notes });
        res.json({ success: true, message: `Company ${decision === 'approve' ? 'verified' : 'rejected'}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
exports.getPendingDocuments = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (+page - 1) * +limit;
        const [docs, total] = await Promise.all([
            Document.find({ verificationStatus: 'pending' }).populate('studentId', 'name').sort({ createdAt: -1 }).skip(skip).limit(+limit),
            Document.countDocuments({ verificationStatus: 'pending' })
        ]);
        res.json({ success: true, data: { docs, total, page: +page } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.verifyDocumentAdmin = async (req, res) => {
    try {
        const { status, notes } = req.body; // 'verified' | 'rejected'
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        doc.verificationStatus = status;
        doc.verifiedBy = req.user._id;
        doc.verifiedAt = Date.now();
        if (notes) doc.verificationNotes = notes;
        await doc.save();
        await log(req.user._id, req.user.email, 'document_verified', 'document', doc._id, `${status} document`);
        res.json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = await SystemSettings.create({});
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = new SystemSettings();
        
        // Deep merge incoming fields
        const merge = (target, source) => {
            Object.keys(source || {}).forEach(k => {
                if (typeof source[k] === 'object' && !Array.isArray(source[k]) && source[k] !== null) {
                    target[k] = target[k] || {};
                    merge(target[k], source[k]);
                } else {
                    target[k] = source[k];
                }
            });
        };
        merge(settings, req.body);
        settings.updatedBy = req.user._id;
        settings.updatedAt = new Date();
        settings.markModified('general'); settings.markModified('features'); settings.markModified('limits'); settings.markModified('notifications');
        await settings.save();
        await log(req.user._id, req.user.email, 'settings_updated', 'system', null, 'System settings updated');
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, startDate, endDate } = req.query;
        const query = {};
        if (action) query.action = action;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        const skip = (+page - 1) * +limit;
        const [logs, total] = await Promise.all([
            ActivityLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(+limit).lean(),
            ActivityLog.countDocuments(query)
        ]);
        res.json({ success: true, data: { logs, total, page: +page, pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════════════════════════════════════════
exports.getAllTickets = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, priority } = req.query;
        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        const skip = (+page - 1) * +limit;
        const [tickets, total] = await Promise.all([
            SupportTicket.find(query).populate('userId', 'email').sort({ createdAt: -1 }).skip(skip).limit(+limit).lean(),
            SupportTicket.countDocuments(query)
        ]);
        res.json({ success: true, data: { tickets, total, page: +page, pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { subject, category, priority, message } = req.body;
        const ticket = await SupportTicket.create({
            userId: req.user._id,
            userType: req.user.role || 'other',
            subject, category, priority,
            messages: [{ senderId: req.user._id, senderName: req.user.email, senderType: 'user', message }]
        });
        res.json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.replyToTicket = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        ticket.messages.push({ senderId: req.user._id, senderName: req.user.email || 'Admin', senderType: 'admin', message });
        if (ticket.status === 'open') ticket.status = 'in-progress';
        await ticket.save();
        await log(req.user._id, req.user.email, 'ticket_updated', 'ticket', ticket._id, `Replied to ticket ${ticket.ticketNumber}`);
        res.json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        ticket.status = status;
        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date();
            ticket.resolvedBy = req.user._id;
        }
        await ticket.save();
        res.json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
exports.generateReport = async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.body;
        const dateQuery = {};
        if (startDate) dateQuery.$gte = new Date(startDate);
        if (endDate) dateQuery.$lte = new Date(endDate);

        let data = {};
        const dateField = { users: 'createdAt', applications: 'createdAt', jobs: 'createdAt' };
        const field = dateField[reportType] || 'createdAt';

        if (reportType === 'users') {
            data = await User.find(Object.keys(dateQuery).length ? { [field]: dateQuery } : {}).select('-password').lean();
        } else if (reportType === 'applications') {
            data = await Application.find(Object.keys(dateQuery).length ? { [field]: dateQuery } : {})
                .populate('studentId', 'name').populate('jobId', 'title').lean();
        } else if (reportType === 'jobs') {
            data = await Job.find(Object.keys(dateQuery).length ? { [field]: dateQuery } : {})
                .populate('companyId', 'companyName').lean();
        } else if (reportType === 'analytics') {
            const qMatch = Object.keys(dateQuery).length ? { $match: { createdAt: dateQuery } } : { $match: {} };
            data = {
                totalUsers: await User.countDocuments(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {}),
                totalJobs: await Job.countDocuments(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {}),
                totalApplications: await Application.countDocuments(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {}),
                appsByStatus: await Application.aggregate([qMatch, { $group: { _id: '$status', count: { $sum: 1 } } }])
            };
        }

        await log(req.user._id, req.user.email, 'report_generated', 'system', null, `Generated ${reportType} report`);
        res.json({ success: true, reportType, data, generatedAt: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXAM PROCTORING SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
exports.getExamProctoringStats = async (req, res) => {
    try {
        const exams = await Exam.find().populate('jobId', 'title companyDisplayName').lean();
        const enriched = await Promise.all(exams.map(async ex => {
            const total = await ExamAttempt.countDocuments({ examId: ex._id, status: 'submitted' });
            const flagged = await ExamAttempt.countDocuments({ examId: ex._id, 'proctoring.isFlagged': true });
            return { ...ex, total, flagged, flagRate: total ? ((flagged / total) * 100).toFixed(1) : '0' };
        }));
        res.json({ success: true, data: enriched });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── Keep original getAllStats for backward compat ────────────────────────────
exports.getAllStats = exports.getDashboardStats;
