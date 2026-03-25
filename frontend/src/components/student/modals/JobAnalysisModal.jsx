import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, Briefcase, DollarSign, Building2, AlertTriangle,
    Target, Award, Clock, Users, BarChart3, Lightbulb, CheckCircle,
    XCircle, AlertCircle, Star, Calendar, MapPin, FileText
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const JobAnalysisModal = ({ isOpen, onClose, jobId, jobTitle, companyName }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (isOpen && jobId) {
            console.log('JobAnalysisModal opened for job:', jobId);
            fetchJobAnalysis();
        }
    }, [isOpen, jobId]);

    const fetchJobAnalysis = async () => {
        try {
            setLoading(true);
            console.log('Fetching job analysis for job ID:', jobId);
            const response = await api.get(`/student/job-analysis/${jobId}`);
            console.log('Job analysis response:', response.data);
            setData(response.data.data);
        } catch (error) {
            console.error('Job analysis error:', error);
            toast.error(error.response?.data?.message || 'Failed to load job analysis');
        } finally {
            setLoading(false);
        }
    };

    const ScoreCircle = ({ score, label, size = 'lg' }) => {
        const sizes = { sm: { w: 'w-16 h-16', text: 'text-lg', r: 28 }, md: { w: 'w-20 h-20', text: 'text-xl', r: 36 }, lg: { w: 'w-32 h-32', text: 'text-4xl', r: 56 } };
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center font-medium">{label}</p>
            </div>
        );
    };

    console.log('JobAnalysisModal rendering, isOpen:', isOpen, 'jobId:', jobId);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                    <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                            {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center">
                                        <Lightbulb className="w-7 h-7 mr-3" />
                                        AI Job Analysis
                                    </h2>
                                    <p className="text-indigo-100 mt-1">{jobTitle} at {companyName}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Analyzing job with AI...</p>
                                </div>
                            ) : data ? (
                                <div className="p-6">
                                    {/* Tabs */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                                        <div className="border-b border-gray-200 dark:border-gray-700">
                                            <nav className="flex space-x-4 px-6 overflow-x-auto">
                                                {[
                                                    { id: 'overview', label: 'Overview', icon: Target },
                                                    { id: 'role', label: 'Role Details', icon: Briefcase },
                                                    { id: 'compensation', label: 'Compensation', icon: DollarSign },
                                                    { id: 'company', label: 'Company Insights', icon: Building2 },
                                                    { id: 'career', label: 'Career Path', icon: TrendingUp },
                                                    { id: 'concerns', label: 'Concerns', icon: AlertTriangle }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
                                                    {/* Suitability Score */}
                                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-indigo-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-center mb-6">
                                                            <ScoreCircle score={data.aiInsights?.suitabilityScore || 0} label="Suitability Score" size="lg" />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <ScoreCircle score={data.aiInsights?.skillMatch || 0} label="Skill Match" size="md" />
                                                            <ScoreCircle score={data.aiInsights?.experienceMatch || 0} label="Experience Match" size="md" />
                                                            <ScoreCircle score={data.aiInsights?.cultureFit || 0} label="Culture Fit" size="md" />
                                                        </div>
                                                    </div>

                                                    {/* Quick Insights */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Strengths */}
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                                                            <h3 className="text-green-800 dark:text-green-400 font-bold text-lg mb-3 flex items-center">
                                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                                Your Strengths for This Role
                                                            </h3>
                                                            <ul className="space-y-2">
                                                                {(data.aiInsights?.matchAnalysis?.strengths || []).map((strength, idx) => (
                                                                    <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                        <span>{strength}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Gaps */}
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border border-orange-200 dark:border-orange-800">
                                                            <h3 className="text-orange-800 dark:text-orange-400 font-bold text-lg mb-3 flex items-center">
                                                                <AlertCircle className="w-5 h-5 mr-2" />
                                                                Areas to Improve
                                                            </h3>
                                                            <ul className="space-y-2">
                                                                {(data.aiInsights?.matchAnalysis?.gaps || []).map((gap, idx) => (
                                                                    <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                        <span>{gap}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {/* AI Recommendation */}
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                                        <h3 className="text-blue-800 dark:text-blue-400 font-bold text-lg mb-3 flex items-center">
                                                            <Lightbulb className="w-5 h-5 mr-2" />
                                                            AI Recommendation
                                                        </h3>
                                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            {data.aiInsights?.recommendation || 'Based on your profile analysis, this role appears to be a good match for your skills and experience.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Role Details Tab */}
                                            {activeTab === 'role' && (
                                                <div className="space-y-6">
                                                    {/* Responsibilities */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Briefcase className="w-5 h-5 mr-2 text-indigo-500" />
                                                            Key Responsibilities
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {(data.aiInsights?.roleBreakdown?.responsibilities || []).map((resp, idx) => (
                                                                <div key={idx} className="flex items-start bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <p className="text-gray-700 dark:text-gray-300">{resp}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Requirements */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Target className="w-5 h-5 mr-2 text-purple-500" />
                                                            Requirements & Qualifications
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(data.aiInsights?.roleBreakdown?.requirements || []).map((req, idx) => (
                                                                <div key={idx} className="flex items-start bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                                                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{req}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Day-to-Day Work */}
                                                    {data.aiInsights?.dayToDay && (
                                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-5 border border-blue-200 dark:border-gray-700">
                                                            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-3 flex items-center">
                                                                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                                                                Typical Day-to-Day Work
                                                            </h3>
                                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.aiInsights.dayToDay}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Compensation Tab */}
                                            {activeTab === 'compensation' && (
                                                <div className="space-y-6">
                                                    {/* CTC Breakdown */}
                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-green-200 dark:border-gray-700">
                                                        <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-4 flex items-center">
                                                            <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                                                            CTC Breakdown
                                                        </h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Base Salary</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    ₹{((data.companyData?.ctc?.base || data.aiInsights?.ctc?.base || 0) / 100000).toFixed(1)}L
                                                                </p>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Variable Pay</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    ₹{((data.companyData?.ctc?.variable || data.aiInsights?.ctc?.variable || 0) / 100000).toFixed(1)}L
                                                                </p>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bonus</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    ₹{((data.companyData?.ctc?.bonus || data.aiInsights?.ctc?.bonus || 0) / 100000).toFixed(1)}L
                                                                </p>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stocks/ESOP</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    ₹{((data.companyData?.ctc?.stocks || data.aiInsights?.ctc?.stocks || 0) / 100000).toFixed(1)}L
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-600 dark:text-gray-400 font-medium">Total CTC</span>
                                                                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                                    ₹{((
                                                                        (data.companyData?.ctc?.base || data.aiInsights?.ctc?.base || 0) +
                                                                        (data.companyData?.ctc?.variable || data.aiInsights?.ctc?.variable || 0) +
                                                                        (data.companyData?.ctc?.bonus || data.aiInsights?.ctc?.bonus || 0) +
                                                                        (data.companyData?.ctc?.stocks || data.aiInsights?.ctc?.stocks || 0)
                                                                    ) / 100000).toFixed(1)}L
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Industry Comparison */}
                                                    {data.aiInsights?.salaryComparison && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                                            <h3 className="text-blue-800 dark:text-blue-400 font-bold text-lg mb-3 flex items-center">
                                                                <BarChart3 className="w-5 h-5 mr-2" />
                                                                Industry Comparison
                                                            </h3>
                                                            <p className="text-gray-700 dark:text-gray-300">{data.aiInsights.salaryComparison}</p>
                                                        </div>
                                                    )}

                                                    {/* Benefits */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Award className="w-5 h-5 mr-2 text-purple-500" />
                                                            Benefits & Perks
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(data.companyData?.benefits || data.aiInsights?.benefits || []).map((benefit, idx) => (
                                                                <div key={idx} className="flex items-center bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                                                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0" />
                                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Company Insights Tab */}
                                            {activeTab === 'company' && (
                                                <div className="space-y-6">
                                                    {/* Company Overview */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <Calendar className="w-8 h-8 text-blue-500 mb-2" />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Founded</p>
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {data.aiInsights?.companyInsights?.founded || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <Users className="w-8 h-8 text-green-500 mb-2" />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Employees</p>
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {data.aiInsights?.companyInsights?.employeeCount || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Growth Rate</p>
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {data.aiInsights?.companyInsights?.growthRate || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <Star className="w-8 h-8 text-yellow-500 mb-2" />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Glassdoor</p>
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {data.aiInsights?.companyInsights?.glassdoorRating || 'N/A'}/5
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* 10-Year Track Record */}
                                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-5 border border-indigo-200 dark:border-gray-700">
                                                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4 flex items-center">
                                                            <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                                                            10-Year Track Record
                                                        </h3>
                                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                                            {data.aiInsights?.companyInsights?.trackRecord || 'Company has shown consistent growth over the past decade with strong market presence.'}
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Financial Health</p>
                                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                    {data.aiInsights?.companyInsights?.financialHealth || 'Stable'}
                                                                </p>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Market Position</p>
                                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                    {data.aiInsights?.companyInsights?.marketPosition || 'Strong'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Recent News */}
                                                    {data.aiInsights?.companyInsights?.recentNews && data.aiInsights.companyInsights.recentNews.length > 0 && (
                                                        <div>
                                                            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                                                Recent News & Updates
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {data.aiInsights.companyInsights.recentNews.map((news, idx) => (
                                                                    <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                        <p className="text-gray-700 dark:text-gray-300">{news}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Career Path Tab */}
                                            {activeTab === 'career' && (
                                                <div className="space-y-6">
                                                    {/* Growth Potential */}
                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-green-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-center mb-4">
                                                            <ScoreCircle score={data.aiInsights?.careerGrowth?.score || 0} label="Career Growth Potential" size="lg" />
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                                                            {data.aiInsights?.careerGrowth?.analysis || 'This role offers good opportunities for career advancement and skill development.'}
                                                        </p>
                                                    </div>

                                                    {/* Learning Opportunities */}
                                                    <div>
                                                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4 flex items-center">
                                                            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                                                            Learning & Development
                                                        </h3>
                                                        <div className="space-y-3">
                                                            {(data.aiInsights?.learningOpportunities || []).map((opportunity, idx) => (
                                                                <div key={idx} className="flex items-start bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                                    <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-gray-700 dark:text-gray-300">{opportunity}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Work-Life Balance */}
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                                        <h3 className="text-blue-800 dark:text-blue-400 font-bold text-lg mb-3 flex items-center">
                                                            <Clock className="w-5 h-5 mr-2" />
                                                            Work-Life Balance Score: {data.aiInsights?.workLifeBalance?.score || 0}/100
                                                        </h3>
                                                        <p className="text-gray-700 dark:text-gray-300">
                                                            {data.aiInsights?.workLifeBalance?.analysis || 'Based on industry data and employee reviews, this company maintains a reasonable work-life balance.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Concerns Tab */}
                                            {activeTab === 'concerns' && (
                                                <div className="space-y-6">
                                                    {/* Bond Details */}
                                                    {(data.companyData?.bond || data.aiInsights?.bond) && (
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border border-orange-200 dark:border-orange-800">
                                                            <h3 className="text-orange-800 dark:text-orange-400 font-bold text-lg mb-4 flex items-center">
                                                                <FileText className="w-5 h-5 mr-2" />
                                                                Service Bond Details
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                        {(data.companyData?.bond?.duration || data.aiInsights?.bond?.duration || 0)} years
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bond Amount</p>
                                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                        ₹{((data.companyData?.bond?.amount || data.aiInsights?.bond?.amount || 0) / 100000).toFixed(1)}L
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fairness Rating</p>
                                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                        {data.aiInsights?.bond?.fairnessScore || 'N/A'}/10
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conditions:</p>
                                                                <p className="text-gray-700 dark:text-gray-300">
                                                                    {data.companyData?.bond?.conditions || data.aiInsights?.bond?.conditions || 'Standard service agreement applies.'}
                                                                </p>
                                                            </div>
                                                            {data.aiInsights?.bond?.analysis && (
                                                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                                                        <strong>AI Analysis:</strong> {data.aiInsights.bond.analysis}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Red Flags */}
                                                    {data.aiInsights?.redFlags && data.aiInsights.redFlags.length > 0 && (
                                                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-5 border border-red-200 dark:border-red-800">
                                                            <h3 className="text-red-800 dark:text-red-400 font-bold text-lg mb-4 flex items-center">
                                                                <AlertTriangle className="w-5 h-5 mr-2" />
                                                                Potential Concerns
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {data.aiInsights.redFlags.map((flag, idx) => (
                                                                    <div key={idx} className="flex items-start bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                        <p className="text-gray-700 dark:text-gray-300">{flag}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Interview Preparation */}
                                                    {data.aiInsights?.interviewTips && data.aiInsights.interviewTips.length > 0 && (
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                                                            <h3 className="text-green-800 dark:text-green-400 font-bold text-lg mb-4 flex items-center">
                                                                <Lightbulb className="w-5 h-5 mr-2" />
                                                                Interview Preparation Tips
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {data.aiInsights.interviewTips.map((tip, idx) => (
                                                                    <div key={idx} className="flex items-start bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                                                        <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">Analysis Not Available</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Unable to generate job analysis at this time.</p>
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

export default JobAnalysisModal;
