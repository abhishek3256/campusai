const express = require('express');
const router = express.Router();
const {
    parseResumeHandler,
    skillMatchHandler,
    generateJobDescriptionHandler,
    generateCoverLetterHandler,
    generateOfferLetterHandler,
    careerGuidanceHandler,
    interviewQuestionsHandler,
    profileScoreHandler,
    verifyDocumentHandler,
    predictApplicationSuccess,
    generateInterviewQuestions,
    simulateMockInterview,
    generateSalaryNegotiationStrategy,
    generateCareerRoadmap,
    analyzeResumeGaps,
    autoFixResume
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All AI routes require authentication
router.use(protect);

router.post('/parse-resume', upload.single('resume'), parseResumeHandler);
router.post('/skill-match', skillMatchHandler);
router.post('/job-description', generateJobDescriptionHandler);
router.post('/generate-cover-letter', generateCoverLetterHandler);
router.post('/generate-offer-letter', generateOfferLetterHandler);
router.post('/career-guidance', careerGuidanceHandler);
router.post('/interview-questions', interviewQuestionsHandler);
router.post('/profile-score', profileScoreHandler);
router.post('/verify-document', upload.single('document'), verifyDocumentHandler);

// New AI Feature Routes
router.post('/predict-success', predictApplicationSuccess);
router.post('/generate-interview-questions', generateInterviewQuestions);
router.post('/simulate-interview', simulateMockInterview);
router.post('/salary-strategy', generateSalaryNegotiationStrategy);
router.post('/career-roadmap', generateCareerRoadmap);
router.get('/analyze-resume-gaps', analyzeResumeGaps);
router.post('/autofix-resume', autoFixResume);

module.exports = router;
