import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Lightbulb, FileText } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import JobAnalysisModal from './JobAnalysisModal';
import LetterViewerModal from './LetterViewerModal';


const AppliedJobsModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState('all');
    const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [viewingLetter, setViewingLetter] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) fetchApplications();
    }, [isOpen]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/student/applications-detailed');
            setData(response.data.data);
        } catch (error) {
            console.error('Applications error:', error);
            setData({ totalApplications: 0, applications: [] });
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Failed to load applications');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (app) => {
        const displayLabel = app.currentStage ? app.currentStage.replace(/_/g, ' ').toUpperCase() : (app.status || 'PENDING').toUpperCase();
        
        if (['JOINED', 'JOINING LETTER ISSUED', 'DOCUMENTS VERIFIED', 'OFFER ACCEPTED', 'ACCEPTED'].includes(displayLabel) || app.status === 'joined' || app.status === 'accepted') {
            return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-xs font-bold tracking-wider flex items-center w-fit"><CheckCircle className="w-4 h-4 mr-1.5" /> {displayLabel}</span>;
        } else if (['REJECTED', 'VERIFICATION FAILED'].includes(displayLabel) || app.status === 'rejected') {
            return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-xs font-bold tracking-wider flex items-center w-fit"><XCircle className="w-4 h-4 mr-1.5" /> {displayLabel}</span>;
        } else if (app.currentStage && app.currentStage !== 'applied') {
            return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg text-xs font-bold tracking-wider flex items-center w-fit"><Briefcase className="w-4 h-4 mr-1.5" /> {displayLabel}</span>;
        } else if (['UNDER-REVIEW', 'SHORTLISTED', 'TECHNICAL-INTERVIEW', 'HR-INTERVIEW', 'OFFERED', 'DOCUMENTS-SUBMITTED'].includes(app.status?.toUpperCase())) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-lg text-xs font-bold tracking-wider flex items-center w-fit"><Briefcase className="w-4 h-4 mr-1.5" /> {displayLabel}</span>;
        } else {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-lg text-xs font-bold tracking-wider flex items-center w-fit"><Clock className="w-4 h-4 mr-1.5" /> PENDING</span>;
        }
    };


    const filteredApplications = data?.applications.filter(app => filter === 'all' || app.status === filter) || [];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                        <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center"><Briefcase className="w-7 h-7 mr-3" />My Applications</h2>
                                        <p className="text-green-100 mt-1">{data?.totalApplications || 0} total applications</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                            </div>

                            <div className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary px-6">
                                <nav className="flex space-x-6 overflow-x-auto pb-2">
                                    {[{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'under-review', label: 'Under Review' }, { id: 'shortlisted', label: 'Shortlisted' }, { id: 'accepted', label: 'Accepted' }, { id: 'rejected', label: 'Rejected' }].map(tab => (
                                        <button key={tab.id} onClick={() => setFilter(tab.id)} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${filter === tab.id ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-secondary'}`}>{tab.label}</button>
                                    ))}
                                </nav>
                            </div>

                            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                                    </div>
                                ) : filteredApplications.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredApplications.map((app) => (
                                            <div key={app._id} className="card p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-start flex-1">
                                                        {app.companyLogo && <img src={app.companyLogo} alt={app.companyName} className="w-12 h-12 rounded-lg mr-4 object-cover" />}
                                                        <div className="flex-1">
                                                            <h3 className="text-heading text-xl font-bold mb-1">{app.jobTitle}</h3>
                                                            <p className="text-body font-medium mb-2">{app.companyName}</p>
                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                                                                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{app.location}</span>
                                                                <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1" />{app.jobType}</span>
                                                                <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />₹{app.salary.min / 100000}L - ₹{app.salary.max / 100000}L</span>
                                                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">{getStatusBadge(app)}</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="card p-3">
                                                        <p className="text-muted text-xs mb-1">AI Match Score</p>
                                                        <span className={`text-2xl font-bold ${app.aiMatchScore >= 70 ? 'text-green-600' : app.aiMatchScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{app.aiMatchScore}%</span>
                                                    </div>
                                                    <div className="card p-3">
                                                        <p className="text-muted text-xs mb-1">Skills Verification</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-green-600 dark:text-green-400 text-sm font-semibold">{app.verificationSummary?.verifiedSkills || 0} Verified</span>
                                                            {app.verificationSummary?.redFlaggedSkills > 0 && (
                                                                <span className="text-red-600 dark:text-red-400 text-sm font-semibold flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />{app.verificationSummary.redFlaggedSkills} Flagged</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="card p-3">
                                                        <p className="text-muted text-xs mb-1">Verification Status</p>
                                                        <p className="text-body text-sm font-semibold capitalize">{app.verificationSummary?.overallStatus?.replace('-', ' ') || 'Not Started'}</p>
                                                    </div>
                                                </div>

                                                {app.interviewSchedule && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                                        <p className="text-blue-800 dark:text-blue-400 font-semibold text-sm mb-1">Interview Scheduled</p>
                                                        <p className="text-blue-700 dark:text-blue-300 text-sm">{new Date(app.interviewSchedule.date).toLocaleDateString()} at {app.interviewSchedule.time}</p>
                                                        {app.interviewSchedule.link && <a href={app.interviewSchedule.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm underline mt-1 inline-block">Join Interview</a>}
                                                    </div>
                                                )}

                                                {/* AI Analysis Button */}
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('AI Analysis button clicked for job:', app.jobId);
                                                            setSelectedJob({ id: app.jobId, title: app.jobTitle, company: app.companyName });
                                                            setAnalysisModalOpen(true);
                                                            console.log('Modal state set to open');
                                                        }}
                                                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                                    >
                                                        <Lightbulb className="w-5 h-5 mr-2" />
                                                        Get AI Job Analysis
                                                    </button>
                                                </div>

                                                {(app.aiGeneratedOfferLetter || app.offerLetter?.generatedAt) && (
                                                    <div className="mt-3">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setViewingLetter({ title: 'Offer Letter', content: app.offerLetter?.aiGeneratedContent || app.aiGeneratedOfferLetter }); }}
                                                            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-medium transition-all"
                                                        >
                                                            <FileText className="w-5 h-5 mr-2" /> Read Offer Letter
                                                        </button>
                                                    </div>
                                                )}

                                                {(app.aiGeneratedJoiningLetter || app.joiningLetter?.generatedAt) && (
                                                    <div className="mt-3">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setViewingLetter({ title: 'Joining Letter', content: app.joiningLetter?.aiGeneratedContent || app.aiGeneratedJoiningLetter }); }}
                                                            className="w-full flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg font-medium transition-all"
                                                        >
                                                            <FileText className="w-5 h-5 mr-2" /> Read Joining Letter
                                                        </button>
                                                    </div>
                                                )}

                                                {((app.currentStage && ['offer_accepted', 'document_verification', 'documents_verified', 'joining_letter_issued', 'joined'].includes(app.currentStage)) || (!app.currentStage && ['accepted', 'offered', 'documents-submitted', 'documents-verified', 'joined'].includes(app.status))) && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onClose();
                                                                navigate(`/student/application/${app._id}/documents`);
                                                            }}
                                                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] shadow-sm"
                                                        >
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            Upload & Manage Documents
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-12"><Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" /><p className="text-muted">No applications found</p></div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
                )}
            </AnimatePresence>

            {/* Job Analysis Modal - Rendered outside to avoid z-index conflicts */}
            {selectedJob && (
                <JobAnalysisModal
                    isOpen={analysisModalOpen}
                    onClose={() => {
                        setAnalysisModalOpen(false);
                        setSelectedJob(null);
                    }}
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                    companyName={selectedJob.company}
                />
            )}

            {/* AI Letter Viewer Modal */}
            <LetterViewerModal 
                isOpen={!!viewingLetter}
                onClose={() => setViewingLetter(null)}
                title={viewingLetter?.title || 'Document'}
                markdownContent={viewingLetter?.content || ''}
            />
        </>

    );
};

export default AppliedJobsModal;

