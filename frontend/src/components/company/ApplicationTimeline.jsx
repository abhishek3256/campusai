import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, X, CircleDot } from 'lucide-react';

// ── Legacy static stages (fallback for old applications) ─────────────────────
const LEGACY_STAGES = [
    { id: 'applied', label: 'Applied' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'assessment_assigned', label: 'Assessment' },
    { id: 'technical_interview', label: 'Tech Interview' },
    { id: 'hr_interview', label: 'HR Interview' },
    { id: 'selected', label: 'Selected' },
    { id: 'offer_sent', label: 'Offer Sent' },
    { id: 'offer_accepted', label: 'Offer Accepted' },
    { id: 'document_verification', label: 'Documents' },
    { id: 'documents_verified', label: 'Verified' },
    { id: 'joining_letter_issued', label: 'Joining Letter' },
    { id: 'joined', label: 'Joined' }
];

const STAGE_ICONS = {
    'Application Screening': '📋', 'Resume Shortlisting': '📄',
    'Online Assessment': '💻', 'Technical Round': '🔧',
    'Managerial Round': '👔', 'HR Round': '🤝',
    'Group Discussion': '👥', 'Case Study': '📊',
    'Final Interview': '⭐', 'Offer Letter': '💌',
    'Document Verification': '🔍', 'Joining Letter': '📝',
    'Letter of Employment': '🏆'
};

// ── Dynamic Pipeline View (for new-style applications) ────────────────────────
const DynamicPipelineView = ({ stageResults }) => {
    const sorted = [...stageResults].sort((a, b) => a.order - b.order);
    const passedCount = sorted.filter(s => s.status === 'passed').length;
    const pct = sorted.length ? Math.round((passedCount / sorted.length) * 100) : 0;

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Company Pipeline</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{passedCount}/{sorted.length} stages</span>
            </div>

            {/* Overall progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
            </div>

            {/* Stage chips */}
            <div className="flex flex-wrap gap-2">
                {sorted.map((stage, idx) => {
                    const icon = STAGE_ICONS[stage.stageName] || '📌';
                    let chipClass = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600';
                    let badge = null;

                    if (stage.status === 'passed') {
                        chipClass = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
                        badge = '✓';
                    } else if (stage.status === 'in_progress') {
                        chipClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-400 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800';
                        badge = '→';
                    } else if (stage.status === 'failed') {
                        chipClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
                        badge = '✗';
                    }

                    return (
                        <div key={stage.stageId || idx} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${chipClass}`}>
                            <span>{icon}</span>
                            <span>{stage.stageName}</span>
                            {badge && <span className="font-bold ml-0.5">{badge}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Legacy Horizontal Stepper (for old applications) ──────────────────────────
const LegacyTimeline = ({ currentStage, statusHistory, isRejected }) => {
    let currentIndex = LEGACY_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex === -1) {
        const fallbacks = {
            'documents-submitted': 'document_verification',
            'documents-verified': 'documents_verified',
            'offered': 'offer_sent',
            'accepted': 'selected',
            'shortlisted': 'under_review',
        };
        if (fallbacks[currentStage]) {
            currentIndex = LEGACY_STAGES.findIndex(s => s.id === fallbacks[currentStage]);
        } else if (isRejected) {
            currentIndex = statusHistory?.length > 0
                ? LEGACY_STAGES.findIndex(s => s.id === statusHistory[statusHistory.length - 1]?.stage)
                : 1;
        }
    }
    if (currentIndex < 0) currentIndex = 0;

    return (
        <div className="w-full py-4 px-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recruitment Stage</h3>
            <div className="relative min-w-[800px] px-4">
                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / (LEGACY_STAGES.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`absolute top-5 left-8 h-1 rounded-full ${isRejected ? 'bg-red-500' : 'bg-blue-500'}`}
                />
                <div className="relative flex justify-between">
                    {LEGACY_STAGES.map((stage, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isRejectedHere = isRejected && isCurrent;

                        let Icon = Clock;
                        let bubbleClass = 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400';

                        if (isCompleted) {
                            Icon = Check;
                            bubbleClass = 'bg-blue-500 border-2 border-blue-500 text-white';
                        } else if (isRejectedHere) {
                            Icon = X;
                            bubbleClass = 'bg-red-500 border-2 border-red-500 text-white shadow-lg shadow-red-500/30';
                        } else if (isCurrent) {
                            Icon = CircleDot;
                            bubbleClass = 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20';
                        }

                        return (
                            <div key={stage.id} className="flex flex-col items-center relative z-10 w-24">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${bubbleClass}`}
                                >
                                    <Icon className={`w-5 h-5 ${isCurrent && !isRejectedHere ? 'animate-pulse' : ''}`} />
                                </motion.div>
                                <span className={`mt-3 text-xs font-medium text-center transition-colors duration-300 ${
                                    isRejectedHere ? 'text-red-600 dark:text-red-400 font-bold' :
                                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' :
                                    isCompleted ? 'text-gray-800 dark:text-gray-200' :
                                    'text-gray-400 dark:text-gray-500'
                                }`}>
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status History Log */}
            {statusHistory && statusHistory.length > 0 && (
                <div className="mt-6 px-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Activity</p>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                        {[...statusHistory].reverse().map((history, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-1">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {history.notes || history.status || `Moved to ${history.stage}`}
                                </span>
                                <span className="text-gray-400 text-xs shadow-sm bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded">
                                    {new Date(history.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Export: Smart Timeline that uses dynamic or legacy ───────────────────
const ApplicationTimeline = ({ currentStage, statusHistory = [], isRejected = false, pipelineProgress = null }) => {
    const hasDynamicPipeline = pipelineProgress?.stageResults?.length > 0;

    return (
        <>
            {hasDynamicPipeline
                ? <DynamicPipelineView stageResults={pipelineProgress.stageResults} />
                : <LegacyTimeline currentStage={currentStage} statusHistory={statusHistory} isRejected={isRejected} />
            }
        </>
    );
};

export default ApplicationTimeline;
