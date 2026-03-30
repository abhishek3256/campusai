import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, CheckCircle, AlertTriangle, FileText, Download, ExternalLink, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, ChevronDown, ChevronUp, Layers, Video, FileCheck, UserCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

import ApplicationTimeline from './ApplicationTimeline';
import InterviewManager from './InterviewManager';
import OfferLetterManager from './OfferLetterManager';
import DocumentVerificationPanel from './DocumentVerificationPanel';
import JoiningLetterManager from './JoiningLetterManager';
import EmploymentLetterManager from './EmploymentLetterManager';
import ResumeViewModal from '../student/modals/ResumeViewModal';

const ApplicantDetailModal = ({ isOpen, onClose, applicationId, onStatusUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, documents, offer, joining
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchApplicantDetails();
            setActiveTab('overview');
        }
    }, [isOpen, applicationId]);

    const fetchApplicantDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/company/applicant/${applicationId}`);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching applicant details:', error);
            toast.error('Failed to load applicant details');
        } finally {
            setLoading(false);
        }
    };

    const handleDataUpdate = (newStage) => {
        fetchApplicantDetails();
        if (onStatusUpdate) onStatusUpdate();
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setStatusUpdating(true);
            await api.put(`/applications/${applicationId}/status`, { status: newStatus });
            toast.success(`Status updated to: ${newStatus}`);
            fetchApplicantDetails();
            if (onStatusUpdate) onStatusUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAdvanceStage = async () => {
        try {
            setStatusUpdating(true);
            await api.post(`/applications/${applicationId}/advance-stage`, { passCurrentStage: true });
            toast.success('Advanced to next pipeline stage!');
            fetchApplicantDetails();
            if (onStatusUpdate) onStatusUpdate();
        } catch (error) {
            toast.error('Failed to advance stage');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleFailStage = async () => {
        try {
            setStatusUpdating(true);
            await api.post(`/applications/${applicationId}/fail-stage`, { reason: 'Rejected at current stage' });
            toast.success('Application rejected at current stage');
            fetchApplicantDetails();
            if (onStatusUpdate) onStatusUpdate();
        } catch (error) {
            toast.error('Failed to reject at stage');
        } finally {
            setStatusUpdating(false);
        }
    };

    const ScoreCircle = ({ score, label, size = 'lg', color = 'blue' }) => {
        const sizes = { sm: { w: 'w-16 h-16', text: 'text-lg', r: 28 }, md: { w: 'w-20 h-20', text: 'text-xl', r: 36 }, lg: { w: 'w-28 h-28', text: 'text-3xl', r: 48 } };
        const s = sizes[size];
        const circumference = 2 * Math.PI * s.r;
        const offset = circumference - (score / 100) * circumference;

        const colors = {
            green: 'text-green-500',
            yellow: 'text-yellow-500',
            red: 'text-red-500',
            blue: 'text-blue-500'
        };

        return (
            <div className="flex flex-col items-center">
                <div className={`relative ${s.w}`}>
                    <svg className={`transform -rotate-90 ${s.w}`}>
                        <circle cx={s.r + 8} cy={s.r + 8} r={s.r} stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle cx={s.r + 8} cy={s.r + 8} r={s.r} stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} className={`${colors[color] || (score >= 70 ? colors.green : score >= 50 ? colors.yellow : colors.red)} transition-all duration-1000`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`${s.text} font-bold text-gray-900 dark:text-white`}>{score}</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center font-medium">{label}</p>
            </div>
        );
    };

    if (!isOpen) return null;

    const navTabs = [
        { id: 'overview', label: 'Overview', icon: UserCircle },
        { id: 'pipeline', label: 'Pipeline & Actions', icon: Layers }
    ];

    return (
        <>
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 pb-0 flex flex-col flex-shrink-0 z-10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg mr-4 border-2 border-white dark:border-gray-800">
                                        {data?.studentId?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data?.studentId?.name}</h2>
                                        <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                            <Mail className="w-4 h-4 mr-1.5" /> {data?.studentId?.email}
                                            <span className="mx-2">•</span>
                                            <Phone className="w-4 h-4 mr-1.5" /> {data?.studentId?.phone || 'N/A'}
                                        </p>
                                        <div className="mt-2 flex space-x-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800">
                                                Stage: {data?.currentStage ? data.currentStage.replace(/_/g, ' ').toUpperCase() : 'APPLIED'}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${(data?.aiMatchScore || 0) >= 80 ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                                    (data?.aiMatchScore || 0) >= 60 ? 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' :
                                                        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                                }`}>
                                                AI Match: {Math.round(data?.aiMatchScore || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors focus:ring-2 focus:ring-indigo-500">
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 mt-4">
                                {navTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 scroll-smooth">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                                </div>
                            ) : data ? (
                                <div className="max-w-5xl mx-auto">
                                    
                                    {/* --- OVERVIEW TAB --- */}
                                    {activeTab === 'overview' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left Column: AI Overview */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* AI Analysis Card */}
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                                                            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        Resume AI Score
                                                    </h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                        <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.overallScore || 0} label="Overall Score" />
                                                        <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.detailedScores?.skillsQuality || 0} label="Skills" size="md" />
                                                        <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.detailedScores?.experienceRelevance || 0} label="Experience" size="md" />
                                                        <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.atsScore?.score || 0} label="ATS Compatibility" size="md" />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Highlights</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {data?.studentId?.resume?.aiAnalysis?.keyHighlights?.map((highlight, i) => (
                                                                    <div key={i} className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                            {typeof highlight === 'string' ? highlight : highlight?.description || highlight?.text || JSON.stringify(highlight)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {data?.studentId?.resume?.aiAnalysis?.redFlags?.length > 0 && (
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Potential Concerns</h4>
                                                                <div className="space-y-2">
                                                                    {data?.studentId?.resume?.aiAnalysis?.redFlags?.map((flag, i) => (
                                                                        <div key={i} className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                                                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                                {typeof flag === 'string' ? flag : flag?.description || 'Potential concern identified'}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Resume Preview */}
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                                            <FileText className="w-5 h-5 mr-3 text-indigo-500" /> Resume Profile
                                                        </h3>
                                                        {data?.studentId?.resume?.fileUrl && (
                                                            <button 
                                                                onClick={() => setIsResumeModalOpen(true)}
                                                                className="flex items-center text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                                                                <ExternalLink className="w-4 h-4 mr-1.5" /> View PDF Form
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {data?.studentId?.resume?.parsedData?.skills?.technical?.map((skill, i) => (
                                                                    <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                                                                        {skill}
                                                                    </span>
                                                                )) || <span className="text-sm text-gray-500">Not specified</span>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Experience</h4>
                                                            <div className="space-y-4">
                                                                {data?.studentId?.resume?.parsedData?.experience?.map((exp, i) => (
                                                                    <div key={i} className="border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 py-1">
                                                                        <h5 className="font-semibold text-gray-900 dark:text-white">{exp.title}</h5>
                                                                        <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">{exp.company}</p>
                                                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{exp.startDate} - {exp.endDate}</p>
                                                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{exp.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Education</h4>
                                                            <div className="space-y-4">
                                                                {data?.studentId?.resume?.parsedData?.education?.map((edu, i) => (
                                                                    <div key={i} className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                                                        <GraduationCap className="w-5 h-5 text-indigo-400 mr-3 mt-0.5" />
                                                                        <div>
                                                                            <h5 className="font-semibold text-gray-900 dark:text-white">{edu?.institution || 'Unknown Institution'}</h5>
                                                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{edu?.degree || ''} {edu?.stream ? `- ${edu.stream}` : ''}</p>
                                                                            <p className="text-gray-500 dark:text-gray-400 text-xs">{edu?.startYear || ''} - {edu?.endYear || 'Present'} {edu?.cgpa ? `• CGPA: ${edu.cgpa}` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Context */}
                                            <div className="space-y-6">
                                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Context</h3>
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-2">{data?.jobId?.title}</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{data?.jobId?.location || 'Remote'}</p>
                                                    <div className="mb-6">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Status</label>
                                                        <select 
                                                            value={data?.overallStatus || data?.status || 'Application Pending'} 
                                                            onChange={(e) => handleStatusUpdate(e.target.value)}
                                                            disabled={statusUpdating}
                                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/30"
                                                        >
                                                            <option value="Application Pending">📋 Application Pending</option>
                                                            <option value="Application Under Review">🔍 Application Under Review</option>
                                                            <option value="Application Shortlisted">✅ Application Shortlisted</option>
                                                            <option value="Application Rejected">❌ Application Reject</option>
                                                            <option value="In Progress">⚙️ In Pipeline (Assessment/Interview)</option>
                                                            <option value="Selected">🎉 Selected</option>
                                                            <option value="Offer Accepted">🤝 Offer Accepted</option>
                                                            <option value="Offer Rejected">🚫 Offer Rejected</option>
                                                            <option value="Joined">🏢 Joined</option>
                                                            <option value="Withdrawn">↩️ Withdrawn</option>
                                                        </select>
                                                        <p className="text-xs text-gray-400 mt-2">Use Pipeline tab to advance through stages.</p>
                                                    </div>

                                                    {/* Pipeline Stage Actions */}
                                                    {(data?.overallStatus === 'Application Shortlisted' || data?.overallStatus === 'In Progress') && (
                                                        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Pipeline Actions</p>
                                                            {data?.overallStatus === 'Application Shortlisted' && (
                                                                <button
                                                                    onClick={handleAdvanceStage}
                                                                    disabled={statusUpdating}
                                                                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                                >
                                                                    🚀 Start Pipeline
                                                                </button>
                                                            )}
                                                            {data?.overallStatus === 'In Progress' && (
                                                                <>
                                                                    <button
                                                                        onClick={handleAdvanceStage}
                                                                        disabled={statusUpdating}
                                                                        className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                                    >
                                                                        ✅ Pass &amp; Advance Stage
                                                                    </button>
                                                                    <button
                                                                        onClick={handleFailStage}
                                                                        disabled={statusUpdating}
                                                                        className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                                    >
                                                                        ❌ Fail &amp; Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- PIPELINE TAB --- */}
                                    {activeTab === 'pipeline' && (
                                        <div className="flex flex-col space-y-2">
                                            {/* Timeline Progress */}
                                            <ApplicationTimeline 
                                                currentStage={data.currentStage} 
                                                statusHistory={data.statusHistory} 
                                                isRejected={data.status === 'rejected' || data.overallStatus === 'Application Rejected'}
                                                pipelineProgress={data.pipelineProgress}
                                            />
                                            
                                            <div className="grid grid-cols-1 gap-6">
                                                {/* Interviews Module */}
                                                <InterviewManager application={data} onUpdate={handleDataUpdate} />
                                                
                                                {/* Offer Module — show when offer stage active or already generated */}
                                                {(data.currentStage === 'offer_sent' || data.currentStage === 'offer_accepted' || 
                                                  data.status === 'offered' || data.status === 'accepted' || 
                                                  data.currentStage === 'selected' || data.offerLetter?.generatedAt ||
                                                  data.overallStatus === 'Selected' || data.overallStatus === 'Offer Accepted' || data.overallStatus === 'In Progress' ||
                                                  data.pipelineProgress?.stageResults?.some(s => s.stageName === 'Offer Letter' && ['in_progress', 'passed'].includes(s.status))) && (
                                                    <OfferLetterManager application={data} onUpdate={handleDataUpdate} />
                                                )}
                                                
                                                {/* Document Verification Module */}
                                                {(data.currentStage === 'document_verification' || data.currentStage === 'documents_verified' || 
                                                  data.status === 'documents-submitted' || data.status === 'documents-verified' || 
                                                  data.documents?.length > 0 ||
                                                  data.pipelineProgress?.stageResults?.some(s => s.stageName === 'Document Verification' && s.status !== 'pending')) && (
                                                    <DocumentVerificationPanel application={data} onUpdate={handleDataUpdate} />
                                                )}
                                                
                                                {/* Joining Letter Module */}
                                                {(data.currentStage === 'documents_verified' || data.currentStage === 'joining_letter_issued' || 
                                                  data.currentStage === 'joined' || data.status === 'documents-verified' || 
                                                  data.joiningLetter?.generatedAt ||
                                                  data.pipelineProgress?.stageResults?.some(s => s.stageName === 'Joining Letter' && ['in_progress', 'passed'].includes(s.status))) && (
                                                    <JoiningLetterManager application={data} onUpdate={handleDataUpdate} />
                                                )}

                                                {/* Employment Letter Module */}
                                                {(data.overallStatus === 'Joined' ||
                                                  data.joiningLetter?.generatedAt ||
                                                  data.pipelineProgress?.stageResults?.some(s => s.stageName === 'Letter of Employment' && s.status !== 'pending')) && (
                                                    <EmploymentLetterManager application={data} onUpdate={handleDataUpdate} />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">Failed to load applicant data.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>

        <ResumeViewModal
            isOpen={isResumeModalOpen}
            onClose={() => setIsResumeModalOpen(false)}
            resumeUrl={data?.studentId?.resume?.fileUrl}
        />
        </>
    );
};

export default ApplicantDetailModal;
