const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
    getStudentNotifications,
    getCompanyNotifications,
    getAdminNotifications,
    markNotificationsRead
} = require('../controllers/notificationController');

router.get('/student',  protect, roleCheck('student'),  getStudentNotifications);
router.get('/company',  protect, roleCheck('company'),  getCompanyNotifications);
router.get('/admin',    protect, roleCheck('admin'),    getAdminNotifications);

router.post('/read', protect, markNotificationsRead);

module.exports = router;
