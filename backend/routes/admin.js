const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers, getUserById, updateUser, deactivateUser, activateUser, deleteUser, bulkUserAction,
    getAllJobsAdmin, adminToggleJob, adminDeleteJob,
    getAllCompanies, verifyCompany,
    getPendingDocuments, verifyDocumentAdmin,
    getSystemSettings, updateSystemSettings,
    getActivityLogs,
    getAllTickets, createTicket, replyToTicket, updateTicketStatus,
    generateReport,
    getExamProctoringStats
} = require('../controllers/adminController');
const { getPlacementStats, getCompanyVisitHistory } = require('../controllers/analyticsController');
const { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { getAllAlumni, adminVerifyAlumni } = require('../controllers/alumniController');
const { getAllResults } = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);
router.use(roleCheck(['admin']));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/stats', getDashboardStats);
router.get('/analytics', getPlacementStats);
router.get('/analytics/company-visits', getCompanyVisitHistory);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/deactivate', deactivateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/bulk-action', bulkUserAction);

// ── Job Management ────────────────────────────────────────────────────────────
router.get('/jobs', getAllJobsAdmin);
router.put('/jobs/:id/toggle', adminToggleJob);
router.delete('/jobs/:id', adminDeleteJob);

// ── Company Verification ──────────────────────────────────────────────────────
router.get('/companies', getAllCompanies);
router.post('/verify-company/:id', verifyCompany);       // legacy
router.put('/companies/:id/verify', verifyCompany);

// ── Document Verification ─────────────────────────────────────────────────────
router.get('/documents/pending', getPendingDocuments);
router.put('/document/:id/verify', verifyDocumentAdmin);  // legacy
router.put('/documents/:id/verify', verifyDocumentAdmin);

// ── System Settings ───────────────────────────────────────────────────────────
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// ── Activity Logs ─────────────────────────────────────────────────────────────
router.get('/activity-logs', getActivityLogs);

// ── Support Tickets ───────────────────────────────────────────────────────────
router.get('/tickets', getAllTickets);
router.post('/tickets', createTicket);
router.post('/tickets/:id/reply', replyToTicket);
router.put('/tickets/:id/status', updateTicketStatus);

// ── Reports ───────────────────────────────────────────────────────────────────
router.post('/reports', generateReport);

// ── Exam Proctoring ───────────────────────────────────────────────────────────
router.get('/exam-proctoring', getExamProctoringStats);

// ── Announcements ─────────────────────────────────────────────────────────────
router.post('/announcements', createAnnouncement);
router.get('/announcements', getAnnouncements);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// ── Alumni ────────────────────────────────────────────────────────────────────
router.get('/alumni', getAllAlumni);
router.put('/alumni/:id/verify', adminVerifyAlumni);

// ── Aptitude Results ──────────────────────────────────────────────────────────
router.get('/aptitude-results', getAllResults);

module.exports = router;
