import { useState, useEffect } from 'react';
import { FiFileText, FiBriefcase, FiAward } from 'react-icons/fi';
import StatCard from './cards/StatCard';
import ProfileScoreModal from './modals/ProfileScoreModal';
import AppliedJobsModal from './modals/AppliedJobsModal';
import SkillsVerifiedModal from './modals/SkillsVerifiedModal';
import api from '../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        profileScore: 0,
        appliedJobs: 0,
        skillsVerified: 0
    });

    const [modals, setModals] = useState({
        profileScore: false,
        appliedJobs: false,
        skillsVerified: false
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            // Fetch all stats in parallel
            const [profileRes, appsRes, skillsRes] = await Promise.all([
                api.get('/student/profile-analysis').catch(() => ({ data: { data: { overallScore: 0 } } })),
                api.get('/student/applications-detailed').catch(() => ({ data: { data: { totalApplications: 0 } } })),
                api.get('/student/skills-analysis').catch(() => ({ data: { data: { totalSkills: 0 } } }))
            ]);

            setStats({
                profileScore: profileRes.data.data.overallScore || 0,
                appliedJobs: appsRes.data.data.totalApplications || 0,
                skillsVerified: skillsRes.data.data.totalSkills || 0
            });
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

    return (
        <div className="page-container min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-heading text-3xl font-bold mb-2">
                        Welcome to Your Dashboard
                    </h1>
                    <p className="text-body">
                        Track your applications and improve your profile with AI-powered insights.
                    </p>
                </div>

                {/* Stats Cards - CLICKABLE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={FiFileText}
                        title="Profile Score"
                        value={stats.profileScore}
                        subtitle="AI Calculated Strength"
                        iconColor="bg-blue-500/10"
                        onClick={() => openModal('profileScore')}
                    />

                    <StatCard
                        icon={FiBriefcase}
                        title="Applied Jobs"
                        value={stats.appliedJobs}
                        subtitle="Active Applications"
                        iconColor="bg-green-500/10"
                        onClick={() => openModal('appliedJobs')}
                    />

                    <StatCard
                        icon={FiAward}
                        title="Skills Verified"
                        value={stats.skillsVerified}
                        subtitle="Skills extracted by AI"
                        iconColor="bg-purple-500/10"
                        onClick={() => openModal('skillsVerified')}
                    />
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                    <h2 className="text-heading text-xl font-semibold mb-6">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="btn-primary">Upload Resume</button>
                        <button className="btn-secondary">Search Jobs</button>
                        <button className="btn-secondary">View Applications</button>
                        <button className="btn-secondary">Edit Profile</button>
                    </div>
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
        </div>
    );
};

export default Dashboard;
