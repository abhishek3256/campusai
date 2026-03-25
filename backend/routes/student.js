const express = require('express');
const router = express.Router();
const {
    getStudentProfile,
    updateStudentProfile,
    uploadResume,
    getResumeAnalysis,
    uploadDocument,
    getRecommendedJobs,
    getApplications,
    getProfileAnalysis,
    getApplicationsDetailed,
    getSkillsAnalysis,
    getJobAnalysis
} = require('../controllers/studentController');

const { generatePrep, getPreps, getPrepById, updatePrep, deletePrep } = require('../controllers/interviewPrepController');
const { generateInsights, getHistory, deleteInsight } = require('../controllers/salaryController');
const { generateRoadmap, getRoadmaps, getRoadmapById, updateRoadmap, deleteRoadmap } = require('../controllers/roadmapController');
const { generateLinkedInPost, generateEmailTemplate, getTemplates, updateTemplate, deleteTemplate } = require('../controllers/contentController');

const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// All routes require authentication and student role
router.use(protect);
router.use(roleCheck(['student']));

router.get('/', getStudentProfile);
router.put('/update', updateStudentProfile);
router.post(
  '/upload-resume',
  upload.single('resume'),
  upload.handleUploadError || ((err, req, res, next) => next(err)),
  uploadResume
);
router.post('/upload-document', upload.single('document'), uploadDocument);
const { uploadApplicationDocument } = require('../controllers/studentController');
router.post('/application/:id/document', upload.single('document'), uploadApplicationDocument);
router.get('/resume-analysis', getResumeAnalysis);
router.get('/recommended-jobs', getRecommendedJobs);
router.get('/applications', getApplications);

// Dashboard modal endpoints
router.get('/profile-analysis', getProfileAnalysis);
router.get('/applications-detailed', getApplicationsDetailed);
router.get('/skills-analysis', getSkillsAnalysis);
router.get('/job-analysis/:jobId', getJobAnalysis);

// Feature 1: Interview Prep
router.post('/interview-prep/generate', generatePrep);
router.get('/interview-prep', getPreps);
router.get('/interview-prep/:id', getPrepById);
router.put('/interview-prep/:id', updatePrep);
router.delete('/interview-prep/:id', deletePrep);

// Feature 2: Salary Insights
router.post('/salary-insights/generate', generateInsights);
router.get('/salary-insights', getHistory);
router.delete('/salary-insights/:id', deleteInsight);

// Feature 3: Career Roadmap
router.post('/roadmap/generate', generateRoadmap);
router.get('/roadmap', getRoadmaps);
router.get('/roadmap/:id', getRoadmapById);
router.put('/roadmap/:id', updateRoadmap);
router.delete('/roadmap/:id', deleteRoadmap);

// Feature 4: Content Generator (LinkedIn posts + Email templates)
router.post('/content/linkedin', generateLinkedInPost);
router.post('/content/email', generateEmailTemplate);
router.get('/content', getTemplates);
router.put('/content/:id', updateTemplate);
router.delete('/content/:id', deleteTemplate);

// Feature 6: Interview Scheduling (student-side)
const { getSchedulesByStudent, confirmSlot } = require('../controllers/scheduleController');
router.get('/schedules', getSchedulesByStudent);
router.put('/schedules/:id/confirm', confirmSlot);

// Feature 8: Announcements (student view)
const { getAnnouncements } = require('../controllers/announcementController');
router.get('/announcements', getAnnouncements);

// Feature 9: Alumni Network
const { registerAlumni, getAlumni, requestConnect } = require('../controllers/alumniController');
router.post('/alumni/register', registerAlumni);
router.get('/alumni', getAlumni);
router.post('/alumni/:id/connect', requestConnect);

// Feature 11: Aptitude Tests
const { generateTest, submitTest, getResults } = require('../controllers/aptitudeController');
router.post('/aptitude/generate', generateTest);
router.post('/aptitude/:id/submit', submitTest);
router.get('/aptitude/results', getResults);

// Feature 10: AI Resume Builder
const { buildResume, getBuiltResumes, updateResume, deleteResume } = require('../controllers/resumeBuilderController');
router.post('/resume-builder/generate', buildResume);
router.get('/resume-builder', getBuiltResumes);
router.put('/resume-builder/:id', updateResume);
router.delete('/resume-builder/:id', deleteResume);

// Exam (student-side)
const { getExamForStudent, startAttempt, submitAttempt, logProctoringEvent, getMyResult } = require('../controllers/examController');
router.get('/exam/:examId', getExamForStudent);
router.post('/exam/:examId/start', startAttempt);
router.post('/exam/attempt/:attemptId/submit', submitAttempt);
router.post('/exam/proctor', logProctoringEvent);
router.get('/exam/:examId/result', getMyResult);

module.exports = router;
