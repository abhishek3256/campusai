import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
    ClipboardList, ChevronDown, ChevronUp, ExternalLink, FileText
} from 'lucide-react';
import StudentApplicationTimeline from './ApplicationTimeline';
import SelectionCelebration from './SelectionCelebration';

// ── Status config for overallStatus ──────────────────────────────────────────
const STATUS_CONFIG = {
    'Application Pending': {
        label: '📋 Application Pending',
        classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
        icon: Clock
    },
    'Application Under Review': {
        label: '🔍 Application Under Review',
        classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        icon: AlertCircle
    },
    'Application Shortlisted': {
        label: '✅ Application Shortlisted',
        classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800',
        icon: CheckCircle
    },
    'Application Rejected': {
        label: '❌ Application Rejected',
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800',
        icon: XCircle
    },
    'In Progress': {
        label: '⚙️ In Pipeline',
        classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
        icon: AlertCircle
    },
    'Selected': {
        label: '🎉 Selected!',
        classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold',
        icon: CheckCircle
    },
    'Offer Accepted': {
        label: '🤝 Offer Accepted',
        classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
        icon: CheckCircle
    },
    'Offer Rejected': {
        label: '🚫 Offer Rejected',
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800',
        icon: XCircle
    },
    'Joined': {
        label: '🏢 Joined',
        classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        icon: CheckCircle
    },
    'Withdrawn': {
        label: '↩️ Withdrawn',
        classes: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
        icon: Clock
    }
};

// Legacy status → overallStatus display map
const LEGACY_DISPLAY = {
    'pending': 'Application Pending',
    'under-review': 'Application Under Review',
    'shortlisted': 'Application Shortlisted',
    'rejected': 'Application Rejected',
    'accepted': 'Selected',
    'joined': 'Joined'
};

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [celebration, setCelebration] = useState(null); // application to celebrate
    const [celebrationShown, setCelebrationShown] = useState(new Set());

    useEffect(() => {
        Promise.all([fetchApplications(), fetchAssessments()]).finally(() => setLoading(false));
    }, []);

    const fetchApplications = async () => {
        try {
            const { data } = await api.get('/student/applications');
            setApplications(data);

            // Trigger celebration for newly selected apps
            const selected = data.find(app =>
                (app.overallStatus === 'Selected' || app.overallStatus === 'Offer Accepted') &&
                !celebrationShown.has(app._id)
            );
            if (selected) {
                setCelebration(selected);
                setCelebrationShown(prev => new Set([...prev, selected._id]));
            }
        } catch (error) {
            console.error('Failed to fetch applications', error);
        }
    };

    const fetchAssessments = async () => {
        try {
            const { data } = await api.get('/assessment/student/assigned');
            if (data.success) setAssessments(data.data || []);
        } catch (error) {
            console.error('Failed to fetch assessments', error);
        }
    };

    const toggleExpanded = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const getMatchColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    };

    const getDisplayStatus = (app) => {
        if (app.overallStatus) return app.overallStatus;
        return LEGACY_DISPLAY[app.status] || 'Application Pending';
    };

    // Get offer letter content from anywhere in the application
    const getOfferLetter = (app) => {
        if (app.offerLetter?.aiGeneratedContent) return app.offerLetter.aiGeneratedContent;
        const offerStage = app.pipelineProgress?.stageResults?.find(s => s.stageName === 'Offer Letter');
        return offerStage?.generatedLetter?.letterContent;
    };

    const getJoiningLetter = (app) => {
        if (app.joiningLetter?.aiGeneratedContent) return app.joiningLetter.aiGeneratedContent;
        const joinStage = app.pipelineProgress?.stageResults?.find(s => s.stageName === 'Joining Letter');
        return joinStage?.generatedLetter?.letterContent;
    };

    const getEmploymentLetter = (app) => {
        const empStage = app.pipelineProgress?.stageResults?.find(s => s.stageName === 'Letter of Employment');
        return empStage?.generatedLetter?.letterContent;
    };

    const viewLetter = (content, title) => {
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:40px;line-height:1.8;font-size:14px;color:#1a1a1a}
pre{white-space:pre-wrap;word-wrap:break-word}
@media print{body{padding:20px}button{display:none}}
</style>
<button onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;">🖨️ Print / Save PDF</button>
</head><body><pre>${content}</pre></body></html>`);
        win.document.close();
    };

    if (loading) return (
        <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
        </div>
    );

    return (
        <>
            {/* Selection Celebration */}
            <SelectionCelebration
                isOpen={!!celebration}
                onClose={() => setCelebration(null)}
                application={celebration}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your recruitment journey across all applied positions</p>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center border border-gray-100 dark:border-gray-700">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Start applying to jobs to see them here!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => {
                            const displayStatus = getDisplayStatus(app);
                            const statusCfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG['Application Pending'];
                            const isSelected = displayStatus === 'Selected' || displayStatus === 'Offer Accepted' || displayStatus === 'Joined';
                            const isExpanded = expanded[app._id];
                            const hasPipeline = app.pipelineProgress?.stageResults?.length > 0;
                            const assessmentForJob = assessments.find(a => a.jobId?._id === app.jobId?._id || a.jobId === app.jobId?._id);
                            const offerContent = getOfferLetter(app);
                            const joiningContent = getJoiningLetter(app);
                            const employmentContent = getEmploymentLetter(app);
                            const hasLetters = offerContent || joiningContent || employmentContent;

                            return (
                                <motion.div
                                    key={app._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
                                        ${isSelected ? 'border-emerald-300 dark:border-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:shadow-md'}`}
                                >
                                    {/* Selected banner */}
                                    {isSelected && (
                                        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400" />
                                    )}

                                    <div className="p-6">
                                        {/* Header row */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                {app.companyId?.logo && (
                                                    <img src={app.companyId.logo} alt={app.companyId.companyName}
                                                        className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 object-contain" />
                                                )}
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {app.jobId?.title || 'Job Title'}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {app.companyId?.companyName || 'Company'} • {app.jobId?.location || 'Location'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                        Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'recently'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                {/* Status badge */}
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.classes}`}>
                                                    {statusCfg.label}
                                                </span>
                                                {/* AI Match */}
                                                <div className={`px-3 py-1 rounded-lg font-semibold text-xs ${getMatchColor(app.aiMatchScore)}`}>
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                        <span>{app.aiMatchScore}% AI Match</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pipeline progress mini bar */}
                                        {hasPipeline && (() => {
                                            const stages = app.pipelineProgress.stageResults;
                                            const passed = stages.filter(s => s.status === 'passed').length;
                                            const pct = Math.round((passed / stages.length) * 100);
                                            const currentStage = stages.find(s => s.status === 'in_progress');
                                            return (
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        <span>{currentStage ? `Current: ${currentStage.stageName}` : `${passed}/${stages.length} stages completed`}</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                        <div
                                                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Letters available */}
                                        {hasLetters && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {offerContent && (
                                                    <button onClick={() => viewLetter(offerContent, 'Offer Letter')}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                                                        <FileText className="w-3 h-3" /> Offer Letter
                                                    </button>
                                                )}
                                                {joiningContent && (
                                                    <button onClick={() => viewLetter(joiningContent, 'Joining Letter')}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-medium hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors">
                                                        <FileText className="w-3 h-3" /> Joining Letter
                                                    </button>
                                                )}
                                                {employmentContent && (
                                                    <button onClick={() => viewLetter(employmentContent, 'Letter of Employment')}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                                        <FileText className="w-3 h-3" /> Employment Letter
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Missing skills */}
                                        {app.missingSkills && app.missingSkills.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Skills to improve:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {app.missingSkills.slice(0, 5).map((skill, idx) => (
                                                        <span key={idx} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exam CTA */}
                                        {assessmentForJob && !['Application Rejected', 'Withdrawn'].includes(displayStatus) && (
                                            <div className="flex justify-between items-center bg-violet-50 dark:bg-violet-900/10 p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                                                        <ClipboardList className="w-4 h-4 text-violet-500" />
                                                        {assessmentForJob.basicInfo?.title || 'Assessment Available'}
                                                    </p>
                                                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                                                        {assessmentForJob.schedule?.duration || 60} min • {assessmentForJob.testType?.replace('-', ' ')}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/student/assessment/${assessmentForJob._id}/exam`}
                                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                >
                                                    Take Exam <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        )}

                                        {/* Expand / collapse timeline */}
                                        {hasPipeline && (
                                            <button
                                                onClick={() => toggleExpanded(app._id)}
                                                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-1 transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                {isExpanded ? 'Hide' : 'View'} Recruitment Journey
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded timeline */}
                                    <AnimatePresence>
                                        {isExpanded && hasPipeline && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-100 dark:border-gray-700 px-6 pb-6"
                                            >
                                                <StudentApplicationTimeline application={app} onUpdate={fetchApplications} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
