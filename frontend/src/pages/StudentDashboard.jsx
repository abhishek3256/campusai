import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { FileText, Briefcase, Award, TrendingUp, ChevronRight, ClipboardList } from 'lucide-react';
import ProfileScoreModal from '../components/student/modals/ProfileScoreModal';
import AppliedJobsModal from '../components/student/modals/AppliedJobsModal';
import SkillsVerifiedModal from '../components/student/modals/SkillsVerifiedModal';
import ResumeViewModal from '../components/student/modals/ResumeViewModal';
import NotificationBell from '../components/common/NotificationBell';

const StudentDashboard = () => {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [stats, setStats] = useState({
        profileScore: 0,
        appliedJobs: 0,
        skillsVerified: 0
    });
    const [assessments, setAssessments] = useState([]);
    const [modals, setModals] = useState({
        profileScore: false,
        appliedJobs: false,
        skillsVerified: false,
        viewResume: false
    });

    useEffect(() => {
        fetchProfile();
        fetchDashboardStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/student');
            setProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            // Fetch all stats in parallel
            const [profileRes, appsRes, skillsRes, assessRes] = await Promise.all([
                api.get('/student/profile-analysis').catch(() => ({ data: { data: { overallScore: 0, resumeUrl: null } } })),
                api.get('/student/applications-detailed').catch(() => ({ data: { data: { totalApplications: 0 } } })),
                api.get('/student/skills-analysis').catch(() => ({ data: { data: { totalSkills: 0 } } })),
                api.get('/assessment/student/assigned').catch(() => ({ data: { success: false, data: [] } }))
            ]);

            setResumeUrl(profileRes.data.data.resumeUrl);

            setStats({
                profileScore: profileRes.data.data.overallScore || 0,
                appliedJobs: appsRes.data.data.totalApplications || 0,
                skillsVerified: skillsRes.data.data.totalSkills || 0
            });

            if (assessRes?.data?.success) {
                setAssessments(assessRes.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    };

    const openModal = (modalName) => {
        setModals(prev => ({ ...prev, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
    };

    if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {profile?.name || user?.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track your applications and improve your profile.</p>
                </div>
                <NotificationBell role="student" />
            </div>

            {/* CLICKABLE Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ClickableDashboardCard
                    icon={<FileText className="w-8 h-8 text-blue-500" />}
                    title="Profile Score"
                    value={stats.profileScore}
                    desc="AI Calculated Strength"
                    onClick={() => openModal('profileScore')}
                    bgColor="hover:border-blue-500"
                />
                <ClickableDashboardCard
                    icon={<Briefcase className="w-8 h-8 text-green-500" />}
                    title="Applied Jobs"
                    value={stats.appliedJobs}
                    desc="Active Applications"
                    onClick={() => openModal('appliedJobs')}
                    bgColor="hover:border-green-500"
                />
                <ClickableDashboardCard
                    icon={<Award className="w-8 h-8 text-purple-500" />}
                    title="Skills Verified"
                    value={stats.skillsVerified}
                    desc="Skills extracted by AI"
                    onClick={() => openModal('skillsVerified')}
                    bgColor="hover:border-purple-500"
                />
            </div>

            {/* Pending Assessments */}
            {assessments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-violet-500" /> Pending Assessments
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assessments.map(assessment => (
                            <div key={assessment._id} className="border border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4 rounded-xl flex items-center justify-between group hover:border-violet-300 transition-colors">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{assessment.basicInfo?.title || 'Required Assessment'}</h3>
                                    <p className="text-sm text-gray-500">{assessment.jobId?.title || 'For Approved Application'}</p>
                                </div>
                                <Link 
                                    to={assessment.testType === 'technical-interview' || assessment.testType === 'hr-interview' ? `/student/assessment/${assessment._id}/video-interview` : `/student/assessment/${assessment._id}/exam`}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    {assessment.testType === 'technical-interview' || assessment.testType === 'hr-interview' ? 'Start Interview' : 'Take Test'}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                <div className="flex gap-4 flex-wrap">
                    <Link to="/student/resume" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200">
                        Upload Resume
                    </Link>
                    <button
                        onClick={() => openModal('viewResume')}
                        className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors duration-200 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        View Resume
                    </button>
                    <Link to="/student/jobs" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors duration-200">
                        Search Jobs
                    </Link>
                    <Link to="/student/applications" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors duration-200">
                        View Applications
                    </Link>
                    <Link to="/student/career-hub" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors duration-200 font-medium">
                        Career AI Hub
                    </Link>
                    <Link to="/student/profile" className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                        Edit Profile
                    </Link>
                    <Link to="/student/interview-prep" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors duration-200">
                        🎙️ Interview Prep
                    </Link>
                    <Link to="/student/salary-insights" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-200">
                        💰 Salary Insights
                    </Link>
                    <Link to="/student/roadmap" className="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-4 py-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors duration-200">
                        🗺️ Career Roadmap
                    </Link>
                    <Link to="/student/content-generator" className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 px-4 py-2 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors duration-200">
                        ✍️ Content Generator
                    </Link>
                    <Link to="/student/announcements" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors duration-200">
                        🔔 Announcements
                    </Link>
                    <Link to="/student/alumni" className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors duration-200">
                        🌐 Alumni Network
                    </Link>
                    <Link to="/student/aptitude" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors duration-200">
                        🧠 Aptitude Tests
                    </Link>
                    <Link to="/student/resume-builder" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors duration-200">
                        📄 AI Resume Builder
                    </Link>
                </div>
            </div>

            {/* Modals */}
            <ProfileScoreModal
                isOpen={modals.profileScore}
                onClose={() => closeModal('profileScore')}
            />

            <AppliedJobsModal
                isOpen={modals.appliedJobs}
                onClose={() => closeModal('appliedJobs')}
            />

            <SkillsVerifiedModal
                isOpen={modals.skillsVerified}
                onClose={() => closeModal('skillsVerified')}
            />

            <ResumeViewModal
                isOpen={modals.viewResume}
                onClose={() => closeModal('viewResume')}
                resumeUrl={resumeUrl}
            />
        </div>
    );
};

// Clickable Dashboard Card Component
const ClickableDashboardCard = ({ icon, title, value, desc, onClick, bgColor }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105 ${bgColor}`}
    >
        <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg transition-colors duration-200">{icon}</div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{desc}</p>
        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
            <span>View Details</span>
            <ChevronRight className="w-4 h-4 ml-1" />
        </div>
    </div>
);

export default StudentDashboard;

