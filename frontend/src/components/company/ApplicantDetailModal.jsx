import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, CheckCircle, AlertTriangle, FileText, Download, ExternalLink, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ApplicantDetailModal = ({ isOpen, onClose, applicationId, onStatusUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [verifyingSkill, setVerifyingSkill] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchApplicantDetails();
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

    const handleStatusUpdate = async (newStatus) => {
        try {
            setStatusUpdating(true);
            const { data: updateRes } = await api.put(`/company/application/${applicationId}/status`, { status: newStatus });
            toast.success(`Application status updated to ${newStatus}`);
            setData(updateRes); // Use the updated doc instead of relying purely on fetch loop
            if (onStatusUpdate) onStatusUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const generateLetter = async (type) => {
        try {
            setLoading(true);
            const res = await api.post(`/company/application/${applicationId}/generate-${type}`);
            toast.success(`${type === 'offer' ? 'Offer' : 'Joining'} letter generated successfully!`);
            setData(res.data.data);
            if (onStatusUpdate) onStatusUpdate();
        } catch (err) {
            toast.error(`Failed to generate ${type} letter`);
            console.error(err);
        } finally {
            setLoading(false);
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

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start flex-shrink-0 z-10">
                            <div className="flex items-center">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg mr-4">
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
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${data?.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                                data?.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                                    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                                            }`}>
                                            Status: {data?.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Pending'}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${(data?.aiMatchScore || 0) >= 80 ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                                (data?.aiMatchScore || 0) >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                                    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                            }`}>
                                            AI Match: {Math.round(data?.aiMatchScore || 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : data ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left Column: AI Overview */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* AI Analysis Card */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                                                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                AI Analysis Overview
                                            </h3>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.overallScore || 0} label="Resume Score" />
                                                <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.detailedScores?.skillsQuality || 0} label="Skills" size="md" />
                                                <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.detailedScores?.experienceRelevance || 0} label="Experience" size="md" />
                                                <ScoreCircle score={data?.studentId?.resume?.aiAnalysis?.atsScore?.score || 0} label="ATS Score" size="md" />
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

                                        {/* Resume Preview/Details */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                                    <FileText className="w-5 h-5 mr-3 text-indigo-500" />
                                                    Resume Details
                                                </h3>
                                                {data?.studentId?.resume?.fileUrl && (
                                                    <a href={data.studentId.resume.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                                                        <ExternalLink className="w-4 h-4 mr-1" /> View Original PDF
                                                    </a>
                                                )}
                                            </div>

                                            <div className="space-y-6">
                                                {/* Skills */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Skills</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {data?.studentId?.resume?.parsedData?.skills?.technical?.map((skill, i) => (
                                                            <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {data?.studentId?.resume?.parsedData?.skills?.softSkills?.map((skill, i) => (
                                                            <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Experience */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Experience</h4>
                                                    <div className="space-y-4">
                                                        {data?.studentId?.resume?.parsedData?.experience?.map((exp, i) => (
                                                            <div key={i} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-1">
                                                                <h5 className="font-semibold text-gray-900 dark:text-white">{exp.title}</h5>
                                                                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">{exp.company}</p>
                                                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{exp.startDate} - {exp.endDate}</p>
                                                                <p className="text-gray-600 dark:text-gray-300 text-sm">{exp.description}</p>
                                                            </div>
                                                        ))}
                                                        {(!data?.studentId?.resume?.parsedData?.experience || data?.studentId?.resume?.parsedData?.experience.length === 0) && (
                                                            <p className="text-gray-500 dark:text-gray-400 italic">No experience listed</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Education */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Education</h4>
                                                    <div className="space-y-4">
                                                        {data?.studentId?.resume?.parsedData?.education?.map((edu, i) => (
                                                            <div key={i} className="flex items-start">
                                                                <GraduationCap className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
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

                                        {/* Document Verification Viewer */}
                                        {data?.documents?.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                                                        <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    Verified Documents (OCR AI)
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {data.documents.map((doc, idx) => (
                                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white uppercase text-sm tracking-wide">{doc.type}</h4>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${doc.aiConfidence >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                                                    {doc.aiConfidence}% Match
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 italic mb-4 line-clamp-2">{doc.aiNotes}</p>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-sm font-medium transition">
                                                                <ExternalLink className="w-4 h-4 mr-2" /> View Document
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Actions & Job Context */}
                                    <div className="space-y-6">
                                        {/* Actions Card */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Application Status</h3>

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Application Stage</label>
                                                <select 
                                                    value={data?.status || 'pending'} 
                                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                                    disabled={statusUpdating}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/30"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="under-review">Under Review</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="technical-interview">Technical Interview</option>
                                                    <option value="hr-interview">HR Interview</option>
                                                    <option value="offered">Offer Extended</option>
                                                    <option value="accepted">Offer Accepted</option>
                                                    <option value="documents-submitted">Documents Submitted</option>
                                                    <option value="documents-verified">Documents Verified</option>
                                                    <option value="joined">Joined</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="verification-failed">Verification Failed</option>
                                                </select>
                                                {statusUpdating && <p className="text-xs text-blue-500 mt-2 animate-pulse">Updating status...</p>}
                                            </div>

                                            {data?.status === 'offered' && !data?.aiGeneratedOfferLetter ? (
                                                <button onClick={() => generateLetter('offer')} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center transition mb-6 shadow-md shadow-indigo-500/20">
                                                    <FileText className="w-4 h-4 mr-2" /> Generate Offer Letter
                                                </button>
                                            ) : data?.aiGeneratedOfferLetter ? (
                                                <div className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg mb-6 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                                                     <span className="font-medium text-sm flex items-center"><Check className="w-4 h-4 mr-1"/> Offer Letter Issued</span>
                                                </div>
                                            ) : null}

                                            {data?.status === 'documents-verified' && !data?.aiGeneratedJoiningLetter ? (
                                                <button onClick={() => generateLetter('joining')} className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center transition mb-6 shadow-md shadow-purple-500/20">
                                                    <FileText className="w-4 h-4 mr-2" /> Generate Joining Letter
                                                </button>
                                            ) : data?.aiGeneratedJoiningLetter ? (
                                                <div className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg mb-6 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                                                     <span className="font-medium text-sm flex items-center"><Check className="w-4 h-4 mr-1"/> Joining Letter Issued</span>
                                                </div>
                                            ) : null}

                                            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Job Details</h4>
                                                <h5 className="font-bold text-gray-900 dark:text-white mb-2">{data?.jobId?.title}</h5>

                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Skills:</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {(() => {
                                                        let jobSkills = [];
                                                        if (Array.isArray(data?.jobId?.skills)) {
                                                            jobSkills = data.jobId.skills;
                                                        } else if (data?.jobId?.skills && typeof data.jobId.skills === 'object') {
                                                            jobSkills = [
                                                                ...(data.jobId.skills.mustHave || []),
                                                                ...(data.jobId.skills.goodToHave || []),
                                                                ...(data.jobId.skills.technologies || [])
                                                            ];
                                                        } else if (data?.jobId?.requirements?.skills) {
                                                            jobSkills = data.jobId.requirements.skills;
                                                        }

                                                        return (
                                                            <>
                                                                {jobSkills.slice(0, 5).map((skill, i) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300">
                                                                        {typeof skill === 'string' ? skill : skill?.name || JSON.stringify(skill)}
                                                                    </span>
                                                                ))}
                                                                {jobSkills.length > 5 && (
                                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300">
                                                                        +{jobSkills.length - 5} more
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Applied on {data?.appliedAt ? new Date(data.appliedAt).toLocaleDateString() : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
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
    );
};

export default ApplicantDetailModal;
