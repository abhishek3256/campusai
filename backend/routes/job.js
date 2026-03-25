const express = require('express');
const router = express.Router();
const { getAllJobs, getJobById, deleteJob } = require('../controllers/jobController');
const { applyForJob } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Protected routes
router.post('/apply/:jobId', protect, roleCheck(['student']), applyForJob);
router.delete('/:id', protect, roleCheck(['company', 'admin']), deleteJob);

module.exports = router;
