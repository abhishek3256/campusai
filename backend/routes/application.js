const express = require('express');
const router = express.Router();
const {
    getApplicationDetails,
    updateOverallStatus,
    advanceToNextStage,
    failCurrentStage
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get application details (student & company)
router.get('/:id', getApplicationDetails);

// Update overallStatus (company sets Application Pending/Under Review/Shortlisted/Rejected/etc)
router.put('/:id/status', updateOverallStatus);

// Advance to next pipeline stage (company action)
router.post('/:id/advance-stage', advanceToNextStage);

// Fail/reject at current stage
router.post('/:id/fail-stage', failCurrentStage);

module.exports = router;
