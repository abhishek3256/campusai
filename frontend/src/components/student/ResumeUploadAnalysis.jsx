import { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, TrendingUp, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResumeUploadAnalysis = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Load existing analysis on mount
    useEffect(() => {
        loadExistingAnalysis();
    }, []);

    const loadExistingAnalysis = async () => {
        try {
            const response = await api.get('/student/resume-analysis');
            if (response.data.success) {
                setAnalysis(response.data.data);
            }
        } catch (error) {
            // No resume uploaded yet
            console.log('No existing resume');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error('Please upload PDF or DOCX file only');
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await api.post('/student/upload-resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAnalysis(response.data.data);
            toast.success('Resume analyzed successfully!');
            setFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const ScoreCircle = ({ score, label }) => (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${score * 2.51} 251`}
                        className={`${score >= 70 ? 'text-green-500' :
                            score >= 50 ? 'text-yellow-500' :
                                'text-red-500'
                            }`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}</span>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{label}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Resume Analysis</h1>

                {/* Upload Section */}
                {!analysis && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <FileText className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            Upload Your Resume
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Get instant AI-powered analysis and insights
                        </p>

                        <div className="max-w-md mx-auto">
                            <label className="block">
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors">
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    {file ? (
                                        <p className="text-gray-900 dark:text-white">{file.name}</p>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">Click to select PDF or DOCX</p>
                                    )}
                                </div>
                            </label>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {uploading ? 'Analyzing...' : 'Upload & Analyze'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <div className="space-y-6">
                        {/* Overall Score Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                                Resume Analysis Results
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <ScoreCircle
                                    score={analysis.aiAnalysis?.overallScore || 0}
                                    label="Overall Score"
                                />
                                <ScoreCircle
                                    score={analysis.aiAnalysis?.detailedScores?.skillsQuality || 0}
                                    label="Skills Quality"
                                />
                                <ScoreCircle
                                    score={analysis.aiAnalysis?.detailedScores?.experienceRelevance || 0}
                                    label="Experience"
                                />
                                <ScoreCircle
                                    score={analysis.aiAnalysis?.atsScore?.score || 0}
                                    label="ATS Score"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav className="flex space-x-8 px-6 overflow-x-auto">
                                    {['overview', 'strengths', 'weaknesses', 'skills', 'recommendations'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                                Key Highlights
                                            </h3>
                                            <div className="space-y-2">
                                                {analysis.aiAnalysis?.keyHighlights?.map((highlight, idx) => (
                                                    <div key={idx} className="flex items-start">
                                                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                        <p className="text-gray-700 dark:text-gray-300">{highlight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                                Career Insights
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Experience Level</p>
                                                    <p className="text-gray-900 dark:text-white font-semibold">
                                                        {analysis.aiAnalysis?.careerInsights?.experienceLevel || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Suitable Roles</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysis.aiAnalysis?.careerInsights?.suitableRoles?.map((role, idx) => (
                                                            <span key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                                                {role}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {analysis.aiAnalysis?.redFlags?.length > 0 && (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                                <h4 className="text-red-800 dark:text-red-400 font-semibold mb-3 flex items-center">
                                                    <AlertCircle className="w-5 h-5 mr-2" />
                                                    Red Flags Detected
                                                </h4>
                                                <div className="space-y-2">
                                                    {analysis.aiAnalysis.redFlags.map((flag, idx) => (
                                                        <div key={idx} className="text-red-700 dark:text-red-300 text-sm">
                                                            • {flag.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strengths Tab */}
                                {activeTab === 'strengths' && (
                                    <div className="space-y-3">
                                        {analysis.aiAnalysis?.strengths?.map((strength, idx) => (
                                            <div key={idx} className="flex items-start bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                                <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-700 dark:text-gray-300">{strength}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Weaknesses Tab */}
                                {activeTab === 'weaknesses' && (
                                    <div className="space-y-3">
                                        {analysis.aiAnalysis?.weaknesses?.map((weakness, idx) => (
                                            <div key={idx} className="flex items-start bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-700 dark:text-gray-300">{weakness}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Skills Tab */}
                                {activeTab === 'skills' && (
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {analysis.aiAnalysis?.skillsBreakdown?.map((skill, idx) => (
                                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-gray-900 dark:text-white font-semibold">{skill.skill}</h4>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${skill.proficiencyLevel === 'Expert' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                                            skill.proficiencyLevel === 'Advanced' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                                skill.proficiencyLevel === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                                                    'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                                            }`}>
                                                            {skill.proficiencyLevel}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{skill.category}</p>
                                                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                                        <span>
                                                            Mentioned {skill.contextMentions} time(s)
                                                        </span>
                                                        {skill.evidenceFound && (
                                                            <Check className="w-4 h-4 text-green-500 ml-2" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations Tab */}
                                {activeTab === 'recommendations' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                                Skills to Add
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.aiAnalysis?.recommendations?.skillsToAdd?.map((skill, idx) => (
                                                    <span key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                                Sections to Improve
                                            </h3>
                                            <ul className="space-y-2">
                                                {analysis.aiAnalysis?.recommendations?.sectionsToImprove?.map((section, idx) => (
                                                    <li key={idx} className="text-gray-700 dark:text-gray-300 flex items-start">
                                                        <TrendingUp className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        {section}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                                Content Suggestions
                                            </h3>
                                            <ul className="space-y-2">
                                                {analysis.aiAnalysis?.recommendations?.contentSuggestions?.map((suggestion, idx) => (
                                                    <li key={idx} className="text-gray-700 dark:text-gray-300">
                                                        • {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => {
                                    setAnalysis(null);
                                    setFile(null);
                                }}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Upload New Resume
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUploadAnalysis;
