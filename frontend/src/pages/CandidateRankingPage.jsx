import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Users, Download, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ApplicantDetailModal from '../components/company/ApplicantDetailModal';

const SCORE_COLOR = (score) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
};

export default function CandidateRankingPage() {
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [filter, setFilter] = useState(0);
    const [selectedApplicantId, setSelectedApplicantId] = useState(null);

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = async () => {
        try { setLoadingJobs(true); const res = await api.get('/company/jobs'); setJobs(res.data?.jobs ? res.data.jobs : (Array.isArray(res.data) ? res.data : [])); }
        catch { toast.error('Failed to load jobs'); } finally { setLoadingJobs(false); }
    };

    const fetchRanked = async (jobId) => {
        try {
            setLoading(true);
            const res = await api.get(`/company/ranked-applicants/${jobId}`);
            setApplicants(res.data.data || []);
        } catch { toast.error('Failed to load applicants'); }
        finally { setLoading(false); }
    };

    const handleJobSelect = (job) => {
        setSelectedJob(job);
        fetchRanked(job._id);
    };

    const toggleShortlist = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'Application Shortlisted' ? 'Application Pending' : 'Application Shortlisted';
            await api.put(`/applications/${id}/status`, { status: newStatus });
            setApplicants(prev => prev.map(a => a._id === id ? { ...a, overallStatus: newStatus } : a));
            toast.success(newStatus === 'Application Shortlisted' ? 'Candidate shortlisted!' : 'Shortlist removed');
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleExportCSV = () => {
        const rows = filtered.map((a, i) => {
            const s = a.studentId;
            return [i + 1, s?.userId?.name || 'N/A', s?.userId?.email || '', a.aiMatchScore || 0, (s?.aiSkills || []).join('; '), a.status].join(',');
        });
        const csv = ['Rank,Name,Email,AI Score,Skills,Status', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `ranked_${selectedJob?.title || 'applicants'}.csv`; a.click();
        toast.success('CSV exported!');
    };

    const filtered = applicants.filter(a => (a.aiMatchScore || 0) >= filter);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><Trophy className="w-6 h-6 text-white" /></div>
                            AI Candidate Ranking
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-ranked applicants sorted by match score</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Job list */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Jobs</h2>
                        {loadingJobs ? (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No jobs posted yet</p>
                        ) : (
                            jobs.map(j => (
                                <button
                                    key={j._id}
                                    onClick={() => handleJobSelect(j)}
                                    className={`w-full text-left p-3 rounded-xl border mb-2 transition-all ${
                                        selectedJob?._id === j._id
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300'
                                    }`}
                                >
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{j.title}</p>
                                    <p className="text-xs text-gray-400">{j.location}</p>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Ranked applicants */}
                    <div className="lg:col-span-3">
                        {!selectedJob ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                <Trophy className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500">Select a job to see ranked applicants</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-gray-400" />
                                        <h2 className="font-semibold text-gray-900 dark:text-white">{selectedJob.title} — {filtered.length} candidates</h2>
                                        {applicants.filter(a => a.overallStatus === 'Application Shortlisted').length > 0 && (
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                                                {applicants.filter(a => a.overallStatus === 'Application Shortlisted').length} shortlisted
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                                            <Filter className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-500">Min score:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={filter}
                                                onChange={e => setFilter(parseInt(e.target.value) || 0)}
                                                className="w-12 text-sm bg-transparent outline-none text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={handleExportCSV}
                                            disabled={filtered.length === 0}
                                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl text-sm"
                                        >
                                            <Download className="w-4 h-4" /> CSV
                                        </button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No applicants match the filter</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filtered.map((a, i) => {
                                            const s = a.studentId;
                                            const score = a.aiMatchScore || 0;
                                            const isShortlisted = a.overallStatus === 'Application Shortlisted';
                                            return (
                                                <motion.div
                                                    key={a._id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                                                        isShortlisted ? 'border-green-400 dark:border-green-600' : 'border-gray-200 dark:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            i === 1 ? 'bg-gray-100 text-gray-600' :
                                                            i === 2 ? 'bg-orange-100 text-orange-600' :
                                                            'bg-gray-50 dark:bg-gray-700 text-gray-500'
                                                        }`}>
                                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                                        </div>

                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                            {s?.userId?.name?.[0] || '?'}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{s?.userId?.name || 'Unknown'}</p>
                                                            <p className="text-sm text-gray-400">{s?.userId?.email}</p>
                                                            {s?.aiSkills?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {s.aiSkills.slice(0, 5).map((sk, si) => (
                                                                        <span key={si} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                                            {sk}
                                                                        </span>
                                                                    ))}
                                                                    {s.aiSkills.length > 5 && (
                                                                        <span className="text-xs text-gray-400">+{s.aiSkills.length - 5}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className={`px-3 py-1 rounded-xl font-bold text-sm ${SCORE_COLOR(score)}`}>
                                                                <Star className="w-3.5 h-3.5 inline mr-1" />{score}%
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setSelectedApplicantId(a._id)}
                                                                    className="px-3 py-1 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                                >
                                                                    View Profile
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleShortlist(a._id, a.overallStatus)}
                                                                    className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                                                                        isShortlisted
                                                                            ? 'bg-green-600 border-green-600 text-white'
                                                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400'
                                                                    }`}
                                                                >
                                                                    {isShortlisted ? '✓ Shortlisted' : 'Shortlist'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {a.missingSkills?.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            <span className="text-xs text-red-400">Missing:</span>
                                                            {a.missingSkills.map((ms, j) => (
                                                                <span key={j} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs">
                                                                    {ms}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedApplicantId && (
                <ApplicantDetailModal
                    applicationId={selectedApplicantId}
                    onClose={() => setSelectedApplicantId(null)}
                    onStatusUpdate={() => {
                        fetchRanked(selectedJob._id);
                        setSelectedApplicantId(null);
                    }}
                />
            )}
        </div>
    );
}
