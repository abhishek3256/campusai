const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ctrl = require('../controllers/assessmentController');

// ── Static POST routes FIRST (before /:id param routes) ──────────────────
router.post('/generate-questions', protect, roleCheck('company'), ctrl.generateAIQuestions);
router.post('/generate-text',      protect, roleCheck('company'), ctrl.generateText);
router.post('/execute-code',       protect, ctrl.executeCode);

// Company — list & create
router.get('/',  protect, roleCheck('company'), ctrl.getCompanyAssessments);
router.post('/', protect, roleCheck('company'), ctrl.createAssessment);

// Student — static paths before /:id
router.get('/student/assigned',              protect, roleCheck('student'), ctrl.getAssignedAssessments);
router.post('/attempt/:attemptId/answer',    protect, roleCheck('student'), ctrl.submitAnswer);
router.post('/attempt/:attemptId/violation', protect, roleCheck('student'), ctrl.logViolation);
router.post('/attempt/:attemptId/submit',    protect, roleCheck('student'), ctrl.submitAssessment);
router.get('/attempt/:attemptId/result',     protect, ctrl.getAttemptResult);

// Company — param routes (must come AFTER static routes)
router.get('/:id',                  protect, ctrl.getAssessmentById);
router.put('/attempt/:attemptId/status', protect, roleCheck('company'), ctrl.updateAttemptStatus);
router.put('/:id',                  protect, roleCheck('company'), ctrl.updateAssessment);
router.delete('/:id',               protect, roleCheck('company'), ctrl.deleteAssessment);
router.post('/:id/duplicate',      protect, roleCheck('company'), ctrl.duplicateAssessment);
router.post('/:id/publish',        protect, roleCheck('company'), ctrl.publishAssessment);
router.get('/:id/attempts',        protect, roleCheck('company'), ctrl.getAssessmentAttempts);
router.post('/:id/publish-results',protect, roleCheck('company'), ctrl.publishResults);

// Student — param routes
router.post('/:id/start', protect, roleCheck('student'), ctrl.startAssessment);

module.exports = router;
