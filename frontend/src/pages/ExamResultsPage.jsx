import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, CheckCircle, Download, Users, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const SCORE_BAND = (pct) => {
    if (pct >= 80) return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Excellent' };
    if (pct >= 60) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Good' };
    if (pct >= 40) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Average' };
    return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Below Average' };
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function ExamResultsPage() {
    const { examId } = useParams();
    const [results, setResults] = useState([]);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | flagged | clean
    const [shortlistThreshold, setShortlistThreshold] = useState(60);

    useEffect(() => { loadResults(); }, [examId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const [attRes, asmRes] = await Promise.all([
                api.get(`/assessment/${examId}/attempts`),
                api.get(`/assessment/${examId}`)
            ]);
            setResults(attRes.data.data || []);
            setAssessment(asmRes.data.data);
        } catch { toast.error('Failed to load results'); }
        finally { setLoading(false); }
    };

    const handleUpdateManualStatus = async (attemptId, manualStatus) => {
        try {
            await api.put(`/assessment/attempt/${attemptId}/status`, { manualStatus });
            toast.success('Status updated successfully');
            setResults(prev => prev.map(r => r._id === attemptId ? { ...r, manualStatus } : r));
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const exportCSV = () => {
        const rows = [['Rank', 'Name', 'Email', 'Score', 'Total', 'Percentage', 'Tab Switches', 'Window Minimizes', 'Violations', 'Final Status']];
        filtered.forEach((r, i) => {
            const name = r.studentId?.name || 'Unknown';
            const email = r.studentId?.userId?.email || '';
            const pct = Math.round(r.scoring?.overall?.percentage || 0);
            const score = r.scoring?.overall?.scoredPoints || 0;
            const total = r.scoring?.overall?.totalPoints || 0;
            const isFlagged = (r.proctoring?.totalViolations > 0);
            const autoPass = pct >= shortlistThreshold && !isFlagged;
            const finalStatus = r.manualStatus === 'shortlisted' ? 'Shortlisted (Manual)' : r.manualStatus === 'rejected' ? 'Rejected (Manual)' : r.status === 'disqualified' ? 'Disqualified' : autoPass ? 'Shortlisted' : 'Below cut-off';
            
            rows.push([i + 1, name, email, score, total, pct + '%', r.proctoring?.tabSwitchCount || 0, r.proctoring?.windowMinimizeCount || 0, isFlagged ? 'Yes' : 'No', finalStatus]);
        });
        const content = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'exam_results.csv'; a.click();
        toast.success('CSV exported!');
    };

    const filtered = results.filter(r => {
        const isFlagged = (r.proctoring?.totalViolations > 0);
        if (filter === 'flagged') return isFlagged;
        if (filter === 'clean') return !isFlagged;
        return true;
    });

    const shortlisted = results.filter(r => {
        if (r.manualStatus === 'shortlisted') return true;
        if (r.manualStatus === 'rejected') return false;
        if (r.status === 'disqualified') return false;
        
        const pct = r.scoring?.overall?.percentage || 0;
        const isFlagged = (r.proctoring?.totalViolations > 0);
        return pct >= shortlistThreshold && !isFlagged;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><Trophy className="w-6 h-6 text-white" /></div>
                            Exam Results
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{results.length} submissions — ranked by score</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {assessment?.jobId && (
                            <Link to={`/company/applicants/${assessment.jobId}`} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-500/20">
                                <Briefcase className="w-4 h-4" /> Manage Candidates
                            </Link>
                        )}
                        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 transition shadow-sm">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {results.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Appeared', value: results.length, icon: Users, color: 'text-blue-600' },
                            { label: 'Flagged', value: results.filter(r => (r.proctoring?.totalViolations > 0)).length, icon: AlertTriangle, color: 'text-red-600' },
                            { label: 'Avg Score %', value: `${Math.round(results.reduce((s, r) => s + (r.scoring?.overall?.percentage || 0), 0) / (results.length || 1))}%`, icon: Trophy, color: 'text-amber-500' },
                            { label: `Above ${shortlistThreshold}%`, value: shortlisted.length, icon: CheckCircle, color: 'text-green-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                                <s.icon className={`w-6 h-6 ${s.color}`} />
                                <div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex gap-2">
                        {['all', 'clean', 'flagged'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                                {f === 'all' ? 'All' : f === 'clean' ? '✅ Clean' : '⚠️ Flagged'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-500">Shortlist Cutoff:</span>
                        <input type="number" value={shortlistThreshold} onChange={e => setShortlistThreshold(Number(e.target.value))} min={0} max={100}
                            className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center" />
                        <span className="text-sm text-gray-500">%</span>
                    </div>
                </div>

                {/* Results Table */}
                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No results yet</p></div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Candidate</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">%</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Proctoring</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => {
                                    const pct = Math.round(r.scoring?.overall?.percentage || 0);
                                    const score = r.scoring?.overall?.scoredPoints || 0;
                                    const totalMarks = r.scoring?.overall?.totalPoints || 0;
                                    const band = SCORE_BAND(pct);
                                    const name = r.studentId?.name || 'Unknown';
                                    const email = r.studentId?.userId?.email || '';
                                    const isFlagged = (r.proctoring?.totalViolations > 0);
                                    const aboveCutoff = pct >= shortlistThreshold && !isFlagged;
                                    return (
                                        <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-5 py-4">
                                                <span className="text-xl">{i < 3 ? MEDAL[i] : ''}</span>
                                                <span className={`${i < 3 ? 'ml-1' : ''} text-sm font-bold text-gray-900 dark:text-white`}>#{i + 1}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                                                <p className="text-xs text-gray-400">{email}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-900 dark:text-white font-semibold">{score}<span className="text-gray-400 font-normal">/{totalMarks}</span></td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.color}`}>{pct}%</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {isFlagged ? (
                                                    <span className="flex items-center gap-1 text-red-500 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Flagged ({r.proctoring?.tabSwitchCount || 0}T/{r.proctoring?.windowMinimizeCount || 0}W)</span>
                                                ) : (
                                                    <span className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Clean</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={r.manualStatus || 'auto'}
                                                        onChange={(e) => handleUpdateManualStatus(r._id, e.target.value)}
                                                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors cursor-pointer ${
                                                            r.manualStatus === 'shortlisted' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                            r.manualStatus === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                            'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <option value="auto">Auto ({aboveCutoff ? 'Pass' : 'Fail'})</option>
                                                        <option value="shortlisted">Force Shortlist</option>
                                                        <option value="rejected">Force Reject</option>
                                                    </select>

                                                    {r.manualStatus === 'shortlisted' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">✓ Shortlisted</span>
                                                    ) : r.manualStatus === 'rejected' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">✗ Rejected</span>
                                                    ) : r.status === 'disqualified' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">✗ Disqualified</span>
                                                    ) : (isFlagged && pct >= shortlistThreshold) ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">⚠️ Flagged</span>
                                                    ) : aboveCutoff ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">✓ Shortlisted</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">Below cutoff</span>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
