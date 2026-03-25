import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiFileText } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SkillVerificationInterface = ({ applicationId }) => {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState(new Set());

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            const response = await api.get(`/company/applicant/${applicationId}`);
            setApplication(response.data.data);
        } catch (error) {
            toast.error('Failed to load application');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySkill = async (skillIndex, status, notes = '') => {
        setVerifying(true);
        try {
            const response = await api.post(`/company/verify-skill/${applicationId}`, {
                skillIndex,
                status,
                notes
            });
            setApplication(response.data.data);
            toast.success(`Skill ${status === 'verified' ? 'verified' : 'rejected'}`);
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleBulkVerify = async (status) => {
        if (selectedSkills.size === 0) {
            toast.error('Please select skills first');
            return;
        }

        setVerifying(true);
        try {
            const verifications = Array.from(selectedSkills).map(index => ({
                skillIndex: index,
                status,
                notes: status === 'verified' ? 'Bulk verified' : 'Bulk rejected'
            }));

            const response = await api.post(`/company/bulk-verify-skills/${applicationId}`, {
                verifications
            });

            setApplication(response.data.data);
            setSelectedSkills(new Set());
            toast.success(`${selectedSkills.size} skills ${status === 'verified' ? 'verified' : 'rejected'}`);
        } catch (error) {
            toast.error('Bulk verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const toggleSkillSelection = (index) => {
        const newSelected = new Set(selectedSkills);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedSkills(newSelected);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Application not found</div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'text-green-600 dark:text-green-400';
            case 'rejected': return 'text-red-600 dark:text-red-400';
            case 'needs-review': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Candidate Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                            {application.studentId?.name || 'Unknown'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{application.studentId?.email || 'N/A'}</p>
                    </div>
                    {application.studentId?.avatar && (
                        <img
                            src={application.studentId.avatar}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full"
                        />
                    )}
                </div>

                {/* AI Generated Summary */}
                {application.aiGeneratedSummary && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <h3 className="text-gray-900 dark:text-white font-semibold mb-2">AI Candidate Overview</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{application.aiGeneratedSummary.candidateOverview}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Key Strengths</h4>
                                <ul className="space-y-1">
                                    {application.aiGeneratedSummary.keyStrengths?.slice(0, 3).map((strength, idx) => (
                                        <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                                            <FiCheck className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Match Score</h4>
                                <div className="flex items-center">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {application.aiGeneratedSummary.matchScore || 0}%
                                    </div>
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Job Match</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {application.verificationSummary?.totalSkills || 0}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Skills</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {application.verificationSummary?.verifiedSkills || 0}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Verified</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {application.verificationSummary?.rejectedSkills || 0}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Rejected</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {application.verificationSummary?.redFlaggedSkills || 0}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Red Flagged</p>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedSkills.size > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-900 dark:text-white font-semibold">
                            {selectedSkills.size} skill(s) selected
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleBulkVerify('verified')}
                                disabled={verifying}
                                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                <FiCheck className="w-4 h-4 mr-2" />
                                Verify Selected
                            </button>
                            <button
                                onClick={() => handleBulkVerify('rejected')}
                                disabled={verifying}
                                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                <FiX className="w-4 h-4 mr-2" />
                                Reject Selected
                            </button>
                            <button
                                onClick={() => setSelectedSkills(new Set())}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Skills Verification
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Verify each skill listed on the candidate's resume
                    </p>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {application.skillsVerification?.map((skill, index) => (
                        <div
                            key={index}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${skill.redFlag?.isRedFlagged ? 'bg-red-50 dark:bg-red-900/10' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedSkills.has(index)}
                                        onChange={() => toggleSkillSelection(index)}
                                        disabled={skill.verificationStatus !== 'pending'}
                                        className="mt-1 mr-4 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    />

                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <h4 className="text-gray-900 dark:text-white font-semibold text-lg">
                                                {skill.skill}
                                            </h4>
                                            {skill.redFlag?.isRedFlagged && (
                                                <span className="ml-3 flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                                                    <FiAlertTriangle className="w-4 h-4 mr-1" />
                                                    RED FLAG
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                                {skill.category}
                                            </span>
                                            <span>Proficiency: {skill.claimedProficiency}</span>
                                            <span>Mentioned: {skill.contextMentions}x</span>
                                            {skill.evidenceInResume ? (
                                                <span className="text-green-600 dark:text-green-400 flex items-center font-medium">
                                                    <FiCheck className="w-4 h-4 mr-1" />
                                                    Evidence found
                                                </span>
                                            ) : (
                                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                                    No clear evidence
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm font-medium ${getStatusColor(skill.verificationStatus)}`}>
                                            Status: {skill.verificationStatus.replace('-', ' ').toUpperCase()}
                                        </p>

                                        {skill.companyNotes && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                                                Notes: {skill.companyNotes}
                                            </p>
                                        )}

                                        {skill.redFlag?.isRedFlagged && (
                                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded">
                                                <p className="text-sm text-red-800 dark:text-red-300">
                                                    <strong>Red Flag Reason:</strong> {skill.redFlag.reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Actions */}
                                {skill.verificationStatus === 'pending' && (
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleVerifySkill(index, 'verified')}
                                            disabled={verifying}
                                            className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                            title="Verify"
                                        >
                                            <FiCheck className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt('Reason for rejection (optional):');
                                                if (notes !== null) {
                                                    handleVerifySkill(index, 'rejected', notes);
                                                }
                                            }}
                                            disabled={verifying}
                                            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <FiX className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resume Download */}
            {application.studentId?.resume?.fileUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <button
                        onClick={() => window.open(application.studentId.resume.fileUrl, '_blank')}
                        className="w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        <FiFileText className="w-5 h-5 mr-2" />
                        View Full Resume
                    </button>
                </div>
            )}
        </div>
    );
};

export default SkillVerificationInterface;
