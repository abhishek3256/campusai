import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Briefcase, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, ClipboardList } from 'lucide-react';

const Applications = () => {
    const [applications, setApplications] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchApplications(), fetchAssessments()]).finally(() => setLoading(false));
    }, []);

    const fetchApplications = async () => {
        try {
            const { data } = await api.get('/student/applications');
            setApplications(data);
        } catch (error) { console.error('Failed to fetch applications', error); }
    };

    const fetchAssessments = async () => {
        try {
            const { data } = await api.get('/assessment/student/assigned');
            if (data.success) setAssessments(data.data || []);
        } catch (error) { console.error('Failed to fetch assessments', error); }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'under-review': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'shortlisted': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'accepted': return <CheckCircle className="w-5 h-5 text-green-600 font-bold" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getMatchColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    };

    if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Loading applications...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your job applications and AI match scores</p>
            </div>

            {applications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center border border-gray-100 dark:border-gray-700">
                    <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Start applying to jobs to see them here!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <div key={app._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {app.companyId?.logo && (
                                            <img
                                                src={app.companyId.logo}
                                                alt={app.companyId.companyName}
                                                className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700"
                                            />
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {app.jobId?.title || 'Job Title'}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {app.companyId?.companyName || 'Company'} • {app.jobId?.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* AI Match Score */}
                                    <div className={`px-4 py-2 rounded-lg font-semibold ${getMatchColor(app.aiMatchScore)}`}>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            <span>{app.aiMatchScore}% Match</span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(app.status)}
                                        <span className="capitalize text-gray-700 dark:text-gray-300">{app.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Missing Skills */}
                            {app.missingSkills && app.missingSkills.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Skills to improve:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {app.missingSkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assessment Link */}
                            {['accepted', 'shortlisted'].includes(app.status?.toLowerCase()) && assessments.find(a => a.jobId?._id === app.jobId?._id || a.jobId === app.jobId?._id) && (() => {
                                const assessmentForJob = assessments.find(a => a.jobId?._id === app.jobId?._id || a.jobId === app.jobId?._id);
                                return (
                                    <div className="mt-4 border-t border-violet-100 dark:border-violet-900/30 flex justify-between items-center bg-violet-50/50 dark:bg-violet-900/10 p-4 rounded-b-xl -mx-6 -mb-6">
                                        <div>
                                            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-violet-500" /> {assessmentForJob.basicInfo?.title || 'Required Assessment'}
                                            </p>
                                            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 pl-6">
                                                Duration: {assessmentForJob.schedule?.duration || 60} mins • {assessmentForJob.testType?.replace('-', ' ')}
                                            </p>
                                        </div>
                                        <Link 
                                            to={`/student/assessment/${assessmentForJob._id}/exam`}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            Take Assessment
                                        </Link>
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Applications;
