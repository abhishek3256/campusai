import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, TrendingUp, Award, Target, FileText, BarChart2, Briefcase, Lightbulb, AlertTriangle, Star } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ProfileScoreModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (isOpen) fetchProfileAnalysis();
    }, [isOpen]);

    const fetchProfileAnalysis = async () => {
        try {
            setLoading(true);
            const response = await api.get('/student/profile-analysis');
            setData(response.data.data);
        } catch (error) {
            console.error('Profile analysis error:', error);
            setData(null);
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Failed to load analysis');
            }
        } finally {
            setLoading(false);
        }
    };

    const ScoreCircle = ({ score, label, size = 'lg' }) => {
        const sizes = { sm: { w: 'w-16 h-16', text: 'text-lg', r: 28 }, md: { w: 'w-20 h-20', text: 'text-xl', r: 36 }, lg: { w: 'w-28 h-28', text: 'text-3xl', r: 48 } };
        const s = sizes[size];
        const circumference = 2 * Math.PI * s.r;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className={`relative ${s.w}`}>
                    <svg className={`transform -rotate-90 ${s.w}`}>
                        <circle cx={s.r + 8} cy={s.r + 8} r={s.r} stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle cx={s.r + 8} cy={s.r + 8} r={s.r} stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} className={`${score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`${s.text} font-bold text-gray-900 dark:text-white`}>{score}</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">{label}</p>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                    <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                            {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center"><BarChart2 className="w-7 h-7 mr-3" />AI Profile Analysis</h2>
                                    <p className="text-blue-100 mt-1">Comprehensive AI-powered career insights</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : data ? (
                                <div className="p-6">
                                    {/* Profile Information */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                            <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                            Profile Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{data.personalInfo?.name || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{data.personalInfo?.email || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mobile</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{data.personalInfo?.mobile || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">LinkedIn</p>
                                                    {data.personalInfo?.linkedin && data.personalInfo.linkedin !== 'N/A' ? (
                                                        <a href={data.personalInfo.linkedin.startsWith('http') ? data.personalInfo.linkedin : `https://${data.personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                                            View Profile
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">N/A</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GitHub</p>
                                                    {data.personalInfo?.github && data.personalInfo.github !== 'N/A' ? (
                                                        <a href={data.personalInfo.github.startsWith('http') ? data.personalInfo.github : `https://${data.personalInfo.github}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                                            View Profile
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">N/A</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">LeetCode</p>
                                                    {data.personalInfo?.leetcode && data.personalInfo.leetcode !== 'N/A' ? (
                                                        <a href={data.personalInfo.leetcode.startsWith('http') ? data.personalInfo.leetcode : `https://${data.personalInfo.leetcode}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                                            View Profile
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">N/A</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Overview */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 mb-6 border border-blue-200 dark:border-gray-700">
                                        <div className="flex items-center justify-center mb-6">
                                            <ScoreCircle score={data.overallScore} label="Overall Profile Score" size="lg" />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            <ScoreCircle score={data.detailedScores?.skillsQuality || 0} label="Skills Quality" size="md" />
                                            <ScoreCircle score={data.detailedScores?.experienceRelevance || 0} label="Experience" size="md" />
                                            <ScoreCircle score={data.detailedScores?.educationStrength || 0} label="Education" size="md" />
                                            <ScoreCircle score={data.detailedScores?.projectsImpact || 0} label="Projects" size="md" />
                                            <ScoreCircle score={data.detailedScores?.formattingClarity || 0} label="Formatting" size="md" />
                                            <ScoreCircle score={data.detailedScores?.keywordOptimization || 0} label="Keywords" size="md" />
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                                        <div className="border-b border-gray-200 dark:border-gray-700">
                                            <nav className="flex space-x-4 px-6 overflow-x-auto">
                                                {[
                                                    { id: 'overview', label: 'Overview', icon: Target },
                                                    { id: 'swot', label: 'SWOT Analysis', icon: BarChart2 },
                                                    { id: 'career', label: 'Career Fit', icon: Briefcase },
                                                    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
                                                    { id: 'ats', label: 'ATS Score', icon: FileText }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                            }`}
                                                    >
                                                        <tab.icon className="w-4 h-4 mr-2" />
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </nav>
                                        </div>

                                        <div className="p-6">
                                            {/* Overview Tab */}
                                            {activeTab === 'overview' && (
                                                <div className="space-y-6">
                                                    {/* Key Highlights */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4 flex items-center">
                                                            <Star className="w-5 h-5 mr-2 text-yellow-500" />
                                                            Key Highlights
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {(data.keyHighlights || []).map((highlight, idx) => (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: idx * 0.1 }}
                                                                    className="flex items-start bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
                                                                >
                                                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-gray-700 dark:text-gray-300">{highlight}</p>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Red Flags */}
                                                    {data.redFlags && data.redFlags.length > 0 && (
                                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5">
                                                            <h4 className="text-red-800 dark:text-red-400 font-semibold mb-3 flex items-center text-lg">
                                                                <AlertTriangle className="w-5 h-5 mr-2" />
                                                                Areas Needing Attention
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {data.redFlags.map((flag, idx) => (
                                                                    <div key={idx} className="text-red-700 dark:text-red-300 text-sm flex items-start">
                                                                        <span className="font-bold mr-2">•</span>
                                                                        <span>{flag.description || flag}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Industry Keywords */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                                                            <h4 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center">
                                                                <Check className="w-4 h-4 mr-2 text-green-500" />
                                                                Keywords Present ({data.industryKeywords?.present?.length || 0})
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(data.industryKeywords?.present || []).slice(0, 10).map((keyword, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                                                        {keyword}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                                                            <h4 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center">
                                                                <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                                                                Missing Keywords ({data.industryKeywords?.missing?.length || 0})
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(data.industryKeywords?.missing || []).slice(0, 10).map((keyword, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                                                                        {keyword}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SWOT Analysis Tab */}
                                            {activeTab === 'swot' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Strengths */}
                                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                                                        <h3 className="text-green-800 dark:text-green-400 font-bold text-lg mb-4 flex items-center">
                                                            <Award className="w-5 h-5 mr-2" />
                                                            Strengths
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {(data.strengths || []).map((strength, idx) => (
                                                                <div key={idx} className="flex items-start">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{strength}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Weaknesses */}
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border border-yellow-200 dark:border-yellow-800">
                                                        <h3 className="text-yellow-800 dark:text-yellow-400 font-bold text-lg mb-4 flex items-center">
                                                            <AlertCircle className="w-5 h-5 mr-2" />
                                                            Weaknesses
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {(data.weaknesses || []).map((weakness, idx) => (
                                                                <div key={idx} className="flex items-start">
                                                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{weakness}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Career Fit Tab */}
                                            {activeTab === 'career' && (
                                                <div className="space-y-6">
                                                    {/* Experience Level */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-5 border border-blue-200 dark:border-gray-700">
                                                            <h4 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Experience Level</h4>
                                                            <p className="text-gray-900 dark:text-white text-2xl font-bold">
                                                                {data.careerInsights?.experienceLevel || 'Not Available'}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                                                {data.careerInsights?.estimatedYearsOfExperience || 0} years of experience
                                                            </p>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-5 border border-purple-200 dark:border-gray-700">
                                                            <h4 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Profile Completeness</h4>
                                                            <div className="flex items-center">
                                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 mr-3">
                                                                    <div
                                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                                                                        style={{ width: `${data.overallScore}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-900 dark:text-white font-bold text-xl">{data.overallScore}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Suitable Roles */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                                                            Suitable Job Roles
                                                        </h3>
                                                        <div className="flex flex-wrap gap-3">
                                                            {(data.careerInsights?.suitableRoles || []).map((role, idx) => (
                                                                <span key={idx} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800">
                                                                    {role}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Industry Fit */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Target className="w-5 h-5 mr-2 text-purple-500" />
                                                            Industry Fit
                                                        </h3>
                                                        <div className="flex flex-wrap gap-3">
                                                            {(data.careerInsights?.industryFit || []).map((industry, idx) => (
                                                                <span key={idx} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium border border-purple-200 dark:border-purple-800">
                                                                    {industry}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recommendations Tab */}
                                            {activeTab === 'recommendations' && (
                                                <div className="space-y-6">
                                                    {/* Skills to Add */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                                                            Recommended Skills to Add
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(data.recommendations?.skillsToAdd || []).map((skill, idx) => (
                                                                <span key={idx} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
                                                                    + {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Content Suggestions */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                                                            Content Improvement Suggestions
                                                        </h3>
                                                        <ul className="space-y-3">
                                                            {(data.recommendations?.contentSuggestions || []).map((suggestion, idx) => (
                                                                <li key={idx} className="flex items-start bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <TrendingUp className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Sections to Improve */}
                                                    {data.recommendations?.sectionsToImprove && data.recommendations.sectionsToImprove.length > 0 && (
                                                        <div>
                                                            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                                                                Sections to Improve
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {data.recommendations.sectionsToImprove.map((section, idx) => (
                                                                    <div key={idx} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                                                        <p className="text-orange-700 dark:text-orange-300 font-medium text-sm">{section}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ATS Score Tab */}
                                            {activeTab === 'ats' && (
                                                <div className="space-y-6">
                                                    {/* ATS Score Card */}
                                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-indigo-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-gray-900 dark:text-white font-bold text-2xl mb-2">ATS Compatibility Score</h3>
                                                                <p className="text-gray-600 dark:text-gray-400">How well your resume works with Applicant Tracking Systems</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{data.atsScore?.score || 0}%</div>
                                                                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${(data.atsScore?.score || 0) >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                                        (data.atsScore?.score || 0) >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                    }`}>
                                                                    {(data.atsScore?.score || 0) >= 70 ? 'Excellent' : (data.atsScore?.score || 0) >= 50 ? 'Good' : 'Needs Work'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ATS Issues */}
                                                    {data.atsScore?.issues && data.atsScore.issues.length > 0 && (
                                                        <div>
                                                            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                                                                ATS Issues Found
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {data.atsScore.issues.map((issue, idx) => (
                                                                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                                                        <p className="text-red-700 dark:text-red-300">{issue}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ATS Suggestions */}
                                                    {data.atsScore?.suggestions && data.atsScore.suggestions.length > 0 && (
                                                        <div>
                                                            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                                <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
                                                                ATS Optimization Tips
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {data.atsScore.suggestions.map((suggestion, idx) => (
                                                                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start">
                                                                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                        <p className="text-blue-700 dark:text-blue-300">{suggestion}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <a href={data.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View Resume
                                        </a>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <FileText className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">No Resume Analysis Available</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your resume to get AI-powered profile analysis with detailed scores, SWOT analysis, career insights, and personalized recommendations.</p>
                                    <Link to="/student/resume" onClick={onClose} className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Upload Resume Now
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileScoreModal;
