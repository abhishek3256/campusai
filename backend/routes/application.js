const express = require('express');
const router = express.Router();
const { getApplicationDetails } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, getApplicationDetails);

module.exports = router;
