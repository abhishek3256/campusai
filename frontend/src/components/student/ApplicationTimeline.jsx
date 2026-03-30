import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, ExternalLink, FileText, Upload, Check } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const STAGE_ICONS = {
    'Application Screening': '📋', 'Resume Shortlisting': '📄',
    'Online Assessment': '💻', 'Technical Round': '🔧',
    'Managerial Round': '👔', 'HR Round': '🤝',
    'Group Discussion': '👥', 'Case Study': '📊',
    'Final Interview': '⭐', 'Offer Letter': '💌',
    'Document Verification': '🔍', 'Joining Letter': '📝',
    'Letter of Employment': '🏆'
};

const STATUS_CONFIG = {
    passed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', label: 'Passed' },
    in_progress: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', label: 'In Progress' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', label: 'Failed' },
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', label: 'Upcoming' },
    skipped: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', label: 'Skipped' }
};

function StageCard({ stage, isLast }) {
    const [expanded, setExpanded] = useState(stage.status === 'in_progress');
    const cfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const stageIcon = STAGE_ICONS[stage.stageName] || '📌';

    const letter = stage.generatedLetter;
    const interview = stage.interviewDetails;
    const hasScore = stage.score !== undefined && stage.score !== null;

    const viewLetter = (content) => {
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${stage.stageName}</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', serif; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 60px 80px; 
                            line-height: 1.6; 
                            color: #333;
                            background: #f0f0f0;
                        }
                        .page {
                            background: white;
                            padding: 60px 80px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            min-height: 1000px;
                        }
                        .header { text-align: right; margin-bottom: 40px; color: #666; font-size: 12px; }
                        pre { 
                            white-space: pre-wrap; 
                            word-wrap: break-word; 
                            font-family: inherit;
                            font-size: 14px;
                        }
                        @media print {
                            body { background: white; padding: 0; }
                            .page { box-shadow: none; padding: 0; }
                            .no-print { display: none; }
                        }
                        .toolbar {
                            position: fixed; top: 20px; right: 20px;
                            display: flex; gap: 10px;
                        }
                        button {
                            padding: 8px 16px; background: #4f46e5; color: white;
                            border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    <div class="toolbar no-print">
                        <button onclick="window.print()">Download as PDF</button>
                    </div>
                    <div class="page">
                        <div class="header">CAMPUS AI RECRUITMENT PORTAL</div>
                        <pre>${content}</pre>
                    </div>
                </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${cfg.bg} ${cfg.border} shadow-sm`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                {!isLast && <div className="w-0.5 bg-gray-200 dark:bg-gray-700 flex-1 my-1" />}
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-xl border ${cfg.border} ${cfg.bg} mb-3 overflow-hidden`}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{stageIcon}</span>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{stage.stageName}</p>
                            <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasScore && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${stage.score >= 70 ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                                Score: {Math.round(stage.score)}%
                            </span>
                        )}
                        {(letter || interview?.scheduledDate || hasScore) ? (
                            expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : null}
                    </div>
                </button>

                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2"
                    >
                        {/* Interview Details */}
                        {interview?.scheduledDate && (
                            <div className="text-xs space-y-1">
                                <p className="font-semibold text-gray-700 dark:text-gray-300">📅 Interview Scheduled</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {new Date(interview.scheduledDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                    {interview.scheduledTime && ` at ${interview.scheduledTime}`}
                                </p>
                                {interview.meetingLink && (
                                    <a href={interview.meetingLink} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                                        <ExternalLink className="w-3 h-3" /> Join Meeting
                                    </a>
                                )}
                                {interview.feedback && (
                                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 mt-1">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">Feedback</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{interview.feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Generated Letter */}
                        {letter?.letterContent && (
                            <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white capitalize">
                                            {letter.letterType === 'offer' ? '💌 Offer Letter' :
                                             letter.letterType === 'joining' ? '📝 Joining Letter' :
                                             '🏆 Employment Letter'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            Generated {letter.generatedAt ? new Date(letter.generatedAt).toLocaleDateString('en-IN') : 'recently'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => viewLetter(letter.letterContent)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" /> View
                                </button>
                            </div>
                        )}

                        {/* Notes */}
                        {stage.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 italic">{stage.notes}</p>
                        )}

                        {/* ── Assessment Result Button ── */}
                        {stage.stageName === 'Online Assessment' && stage.status === 'passed' && stage.assessmentAttemptId && (
                            <div className="pt-2">
                                <Link
                                    to={`/student/assessment/result/${stage.assessmentAttemptId}`}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> View Exam Result
                                </Link>
                            </div>
                        )}

                        {/* ── INTERACTIVE: Offer Letter Stage (Accept/Decline) ── */}
                        {stage.stageName === 'Offer Letter' && stage.status === 'in_progress' && (
                            <div className="flex gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                <button
                                    onClick={() => handleRespondToOffer('accept')}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-emerald-500/20"
                                >
                                    Accept Offer 🤝
                                </button>
                                <button
                                    onClick={() => handleRespondToOffer('reject')}
                                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        )}

                        {/* ── INTERACTIVE: Document Verification Stage (Upload) ── */}
                        {stage.stageName === 'Document Verification' && stage.status === 'in_progress' && (
                            <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Required Documents</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {['ID Proof', 'Degree Certificate', 'Marks Card'].map(docType => {
                                        const isUploaded = application.documents?.some(d => d.type === docType || d.documentType === docType);
                                        return (
                                            <div key={docType} className="flex items-center justify-between p-2 bg-white/40 dark:bg-black/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-full ${isUploaded ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                        {isUploaded ? <Check className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{docType}</span>
                                                </div>
                                                <label className={`cursor-pointer text-[10px] font-bold px-2 py-1 rounded transition-colors ${isUploaded ? 'bg-gray-100 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                                    {isUploaded ? 'Sent' : 'Upload'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                                                        disabled={isUploaded}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// ── Main Export ───────────────────────────────────────────────────────────
export default function StudentApplicationTimeline({ application, onUpdate }) {
    const stageResults = application?.pipelineProgress?.stageResults;

    const [processing, setProcessing] = useState(false);

    const handleRespondToOffer = async (response) => {
        try {
            setProcessing(true);
            const res = await api.put(`/student/application/${application._id}/offer/respond`, { response });
            toast.success(response === 'accept' ? 'Congratulations! You accepted the offer.' : 'Offer declined.');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to respond to offer');
        } finally {
            setProcessing(false);
        }
    };

    const handleFileUpload = async (type, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);

        try {
            setProcessing(true);
            const res = await api.post(`/student/application/${application._id}/document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`${type} uploaded successfully!`);
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to upload ${type}`);
        } finally {
            setProcessing(false);
        }
    };

    if (!stageResults || stageResults.length === 0) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No recruitment journey available for this position.
                </p>
            </div>
        );
    }

    const sorted = [...stageResults].sort((a, b) => a.order - b.order);
    const completedCount = sorted.filter(s => s.status === 'passed').length;

    return (
        <div className={`mt-4 ${processing ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recruitment Journey</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {completedCount}/{sorted.length} stages completed
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / sorted.length) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
            </div>

            {/* Stage Cards */}
            <div>
                {sorted.map((stage, idx) => (
                    <StageCard
                        key={stage.stageId || idx}
                        stage={stage}
                        application={application}
                        isLast={idx === sorted.length - 1}
                        handleRespondToOffer={handleRespondToOffer}
                        handleFileUpload={handleFileUpload}
                    />
                ))}
            </div>
        </div>
    );
}

