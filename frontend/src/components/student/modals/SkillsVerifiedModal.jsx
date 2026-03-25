import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, TrendingUp, Code, CheckCircle, FileText } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const SkillsVerifiedModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (isOpen) fetchSkillsAnalysis();
    }, [isOpen]);

    const fetchSkillsAnalysis = async () => {
        try {
            setLoading(true);
            const response = await api.get('/student/skills-analysis');
            setData(response.data.data);
        } catch (error) {
            console.error('Skills analysis error:', error);
            setData(null);
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Failed to load skills');
            }
        } finally {
            setLoading(false);
        }
    };

    const getProficiencyColor = (level) => {
        const colors = {
            Expert: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
            Advanced: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
            Intermediate: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
            Beginner: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
        };
        return colors[level] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    };

    const getFilteredSkills = () => {
        if (!data) return [];
        if (filter === 'all') return data.skillsBreakdown;
        return data.skillsByCategory[filter] || [];
    };

    const filteredSkills = getFilteredSkills();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
                    <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center"><Award className="w-7 h-7 mr-3" />Skills Analysis</h2>
                                    <p className="text-purple-100 mt-1">{data?.totalSkills || 0} skills extracted by AI</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                                </div>
                            ) : data ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{data.proficiencyLevels?.expert || 0}</div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Expert</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{data.proficiencyLevels?.advanced || 0}</div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Advanced</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{data.proficiencyLevels?.intermediate || 0}</div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Intermediate</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{data.proficiencyLevels?.beginner || 0}</div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Beginner</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-purple-500" />Top 10 Skills</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {(data.topSkills || []).map((skill, idx) => (
                                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-600">
                                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">#{idx + 1}</div>
                                                    <p className="text-gray-900 dark:text-white font-semibold text-sm">{skill.skill}</p>
                                                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{skill.contextMentions} mentions</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Award className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">No Skills Data Available</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your resume to get AI-powered skills analysis with proficiency levels and recommendations.</p>
                                    <Link to="/student/resume" onClick={onClose} className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
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

export default SkillsVerifiedModal;
