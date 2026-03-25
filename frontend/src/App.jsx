import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useThemeStore from './store/themeStore';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/common/ProtectedRoute';

// Student Components
import StudentDashboard from './pages/StudentDashboard';
import ResumeUploadAnalysis from './components/student/ResumeUploadAnalysis';
import JobSearch from './components/student/JobSearch';
import ProfileEdit from './components/student/ProfileEdit';
import Applications from './components/student/Applications';
import DocumentUploadPortal from './pages/DocumentUploadPortal';
import CareerHub from './pages/CareerHub';
import InterviewPrepPage from './pages/InterviewPrepPage';
import SalaryInsightsPage from './pages/SalaryInsightsPage';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import ContentGeneratorPage from './pages/ContentGeneratorPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AlumniNetworkPage from './pages/AlumniNetworkPage';
import AptitudeTestPage from './pages/AptitudeTestPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import ExamPage from './pages/ExamPage';
import OfferLetterPage from './pages/OfferLetterPage';

// Company Components
import CompanyDashboard from './pages/CompanyDashboard';
import PostJob from './components/company/PostJob';
import CompanyApplicants from './pages/CompanyApplicants';
import InterviewSchedulePage from './pages/InterviewSchedulePage';
import CandidateRankingPage from './pages/CandidateRankingPage';
import ExamCreatorPage from './pages/ExamCreatorPage';
import ExamResultsPage from './pages/ExamResultsPage';
import EditJobPage from './pages/EditJobPage';
import AssessmentExamPage from './pages/AssessmentExamPage';
import AssessmentResultPage from './pages/AssessmentResultPage';
import VideoInterviewPage from './pages/VideoInterviewPage';

// Admin Components
import AdminDashboard from './pages/AdminDashboard';

// Separate inner component so useLocation works inside <Router>
function AppContent() {
    const { theme } = useThemeStore();
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 font-sans">
            {/* Hide global navbar on admin pages — admin has its own sidebar */}
            {!isAdminPage && <Navbar />}
            <Toaster position="top-right" />

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student Routes */}
                <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="profile" element={<ProfileEdit />} />
                    <Route path="resume" element={<ResumeUploadAnalysis />} />
                    <Route path="jobs" element={<JobSearch />} />
                    <Route path="applications" element={<Applications />} />
                    <Route path="application/:applicationId/documents" element={<DocumentUploadPortal />} />
                    <Route path="career-hub" element={<CareerHub />} />
                    <Route path="interview-prep" element={<InterviewPrepPage />} />
                    <Route path="salary-insights" element={<SalaryInsightsPage />} />
                    <Route path="roadmap" element={<CareerRoadmapPage />} />
                    <Route path="content-generator" element={<ContentGeneratorPage />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />
                    <Route path="alumni" element={<AlumniNetworkPage />} />
                    <Route path="aptitude" element={<AptitudeTestPage />} />
                    <Route path="resume-builder" element={<ResumeBuilderPage />} />
                    <Route path="exam/:examId" element={<ExamPage />} />
                    <Route path="offer-letter/:jobId" element={<OfferLetterPage />} />
                    <Route path="assessment/:assessmentId/exam" element={<AssessmentExamPage />} />
                    <Route path="assessment/:assessmentId/video-interview" element={<VideoInterviewPage />} />
                    <Route path="assessment/result/:attemptId" element={<AssessmentResultPage />} />
                </Route>

                {/* Company Routes */}
                <Route path="/company" element={<ProtectedRoute allowedRoles={['company']} />}>
                    <Route path="dashboard" element={<CompanyDashboard />} />
                    <Route path="post-job" element={<PostJob />} />
                    <Route path="applicants/:jobId" element={<CompanyApplicants />} />
                    <Route path="schedules" element={<InterviewSchedulePage />} />
                    <Route path="ranking" element={<CandidateRankingPage />} />
                    <Route path="exam/create" element={<ExamCreatorPage />} />
                    <Route path="exam/create/:jobId" element={<ExamCreatorPage />} />
                    <Route path="exam/results/:examId" element={<ExamResultsPage />} />
                    <Route path="jobs/edit/:id" element={<EditJobPage />} />
                </Route>

                {/* Admin Routes — AdminDashboard handles nested routing internally */}
                <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="*" element={<AdminDashboard />} />
                </Route>
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
