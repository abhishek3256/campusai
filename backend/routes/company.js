const express = require('express');
const router = express.Router();
const {
    getCompanyProfile, updateCompanyProfile,
    postJob, getJobs, getJobById,
    getInternalApplicants, createAIJobDesc, createAICompanyDesc, createAIEligibility,
    updateApplicationStatus, getApplicantDetails,
    verifySkill, bulkVerifySkills,
    autoShortlist, publishResults,
    updateJob, deleteJob,
    generateOfferLetterEndpoint, generateJoiningLetterEndpoint
} = require('../controllers/companyController');
const { getRankedApplicants } = require('../controllers/analyticsController');
const { createSchedule, getSchedulesByCompany, updateSchedule, cancelSchedule } = require('../controllers/scheduleController');
const {
    createExam, getExamByJob, publishExam, getExamResults
} = require('../controllers/examController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);
router.use(roleCheck(['company']));

// Profile
router.get('/', getCompanyProfile);
router.put('/update', updateCompanyProfile);

// Jobs
router.post('/jobs', postJob);
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.put('/jobs/:id/shortlist', autoShortlist);
router.put('/jobs/:id/results', publishResults);

// Applicants
router.get('/applicants/:jobId', getInternalApplicants);
router.put('/application/:id/status', updateApplicationStatus);

// Interview Tracking
const { scheduleInterview, updateInterviewResult } = require('../controllers/companyController');
router.post('/application/:id/schedule-interview', scheduleInterview);
router.put('/application/:id/interview/:roundId/result', updateInterviewResult);

// Letters
router.post('/application/:id/generate-offer', generateOfferLetterEndpoint);
router.post('/application/:id/generate-joining', generateJoiningLetterEndpoint);

// Documents
const { approveDocuments } = require('../controllers/companyController');
router.put('/application/:id/documents/approve', approveDocuments);

// AI
router.post('/ai/job-description', createAIJobDesc);
router.post('/ai/company-description', createAICompanyDesc);
router.post('/ai/eligibility', createAIEligibility);

// Skill Verification
router.get('/applicant/:applicationId', getApplicantDetails);
router.post('/verify-skill/:applicationId', verifySkill);
router.post('/bulk-verify-skills/:applicationId', bulkVerifySkills);

// AI Candidate Ranking
router.get('/ranked-applicants/:jobId', getRankedApplicants);

// Interview Scheduling
router.post('/schedules', createSchedule);
router.get('/schedules', getSchedulesByCompany);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', cancelSchedule);

// Exams
router.post('/exams', createExam);
router.get('/exams/:jobId', getExamByJob);
router.put('/exams/:id/publish', publishExam);
router.get('/exam-results/:examId', getExamResults);

module.exports = router;
