import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, TrendingUp, TrendingDown, Clock, Target, BarChart2,
    CheckCircle2, XCircle, AlertTriangle, Lightbulb, Award, Users, ArrowLeft
} from 'lucide-react';
import api from '../services/api';

const GRADE_COLOR = { 'A+':'text-green-600', A:'text-green-500', 'B+':'text-blue-600', B:'text-blue-500', C:'text-amber-600', D:'text-orange-600', F:'text-red-600' };
const GRADE_BG    = { 'A+':'bg-green-100', A:'bg-green-50', 'B+':'bg-blue-100', B:'bg-blue-50', C:'bg-amber-100', D:'bg-orange-100', F:'bg-red-100' };

const StatCard = ({ icon: Icon, label, value, sub, color = 'bg-violet-100 text-violet-700' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color} dark:opacity-80`}><Icon className="w-6 h-6" /></div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const SegmentBar = ({ correct, wrong, skipped, total }) => {
    const cp = ((correct / total) * 100) || 0;
    const wp = ((wrong / total) * 100) || 0;
    const sp = ((skipped / total) * 100) || 0;
    return (
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${cp}%` }} />
            <div className="bg-red-400 h-full transition-all" style={{ width: `${wp}%` }} />
            <div className="bg-gray-300 dark:bg-gray-600 h-full transition-all" style={{ width: `${sp}%` }} />
        </div>
    );
};

export default function AssessmentResultPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        api.get(`/assessment/attempt/${attemptId}/result`)
            .then(r => setResult(r.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!result) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Results not yet published</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-violet-600 hover:underline">Go back</button>
            </div>
        </div>
    );

    const overall = result.scoring?.overall || {};
    const pct = overall.percentage?.toFixed(1) || '0.0';
    const grade = overall.grade || 'N/A';
    const passed = overall.passed;
    const timeTaken = result.scoring?.timeTaken || 0;
    const ai = result.aiAnalysis || {};
    const proc = result.proctoring || {};

    const TABS = ['overview', 'sections', 'ai-analysis', 'proctoring'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{result.assessmentId?.basicInfo?.title || 'Assessment Result'}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{result.studentId?.name} • {new Date(result.submittedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>
                </div>

                {/* Hero score card */}
                <div className={`rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
                    <div className="text-center md:text-left">
                        <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold mb-3 ${passed ? 'bg-white/20' : 'bg-white/20'}`}>
                            {passed ? <><CheckCircle2 className="w-4 h-4" /> PASSED</> : <><XCircle className="w-4 h-4" /> NOT PASSED</>}
                        </div>
                        <h2 className="text-5xl font-black">{pct}%</h2>
                        <p className="text-white/80 mt-1">{overall.scoredPoints} / {overall.totalPoints} points</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div className="text-center bg-white/10 rounded-2xl p-4 min-w-[100px]">
                            <p className={`text-4xl font-black ${GRADE_COLOR[grade] ? 'text-white' : 'text-white'}`}>{grade}</p>
                            <p className="text-white/70 text-xs mt-1">Grade</p>
                        </div>
                        {result.rank && (
                            <div className="text-center bg-white/10 rounded-2xl p-4">
                                <p className="text-4xl font-black">#{result.rank}</p>
                                <p className="text-white/70 text-xs mt-1">Rank of {result.totalParticipants}</p>
                            </div>
                        )}
                        {result.percentile != null && (
                            <div className="text-center bg-white/10 rounded-2xl p-4">
                                <p className="text-4xl font-black">{result.percentile}%</p>
                                <p className="text-white/70 text-xs mt-1">Percentile</p>
                            </div>
                        )}
                        <div className="text-center bg-white/10 rounded-2xl p-4">
                            <p className="text-3xl font-black">{Math.floor(timeTaken/60)}m {timeTaken%60}s</p>
                            <p className="text-white/70 text-xs mt-1">Time Taken</p>
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={CheckCircle2} label="Correct" value={overall.correctAnswers || 0} color="bg-green-100 text-green-700" />
                    <StatCard icon={XCircle}     label="Wrong"   value={overall.wrongAnswers || 0}   color="bg-red-100 text-red-700" />
                    <StatCard icon={AlertTriangle} label="Skipped" value={overall.skippedQuestions || 0} color="bg-amber-100 text-amber-700" />
                    <StatCard icon={Target}      label="Attempted" value={`${overall.attemptedQuestions || 0}/${overall.totalQuestions || 0}`} color="bg-violet-100 text-violet-700" />
                </div>

                {/* Answer progress bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Correct ({overall.correctAnswers})</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> Wrong ({overall.wrongAnswers})</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full" /> Skipped ({overall.skippedQuestions})</span>
                    </div>
                    <SegmentBar correct={overall.correctAnswers} wrong={overall.wrongAnswers} skipped={overall.skippedQuestions} total={overall.totalQuestions} />
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        {TABS.map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 py-3 text-sm font-medium capitalize transition ${tab === t ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50 dark:bg-violet-900/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                {t.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {/* ── Overview tab ── */}
                        {tab === 'overview' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score Breakdown</p>
                                        <div className="space-y-2 text-sm">
                                            {[['Total Questions', overall.totalQuestions], ['Attempted', overall.attemptedQuestions], ['Correct', overall.correctAnswers], ['Wrong', overall.wrongAnswers], ['Skipped', overall.skippedQuestions], ['Total Points', overall.totalPoints], ['Points Scored', overall.scoredPoints]].map(([l, v]) => (
                                                <div key={l} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                    <span className="text-gray-500 dark:text-gray-400">{l}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{v ?? '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {ai.predictedJobFit != null && (
                                        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-6 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">AI Predicted Job Fit</p>
                                            <div className="relative w-32 h-32">
                                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray={`${ai.predictedJobFit}, 100`} />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black text-violet-700 dark:text-violet-300">{ai.predictedJobFit}%</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-violet-700 dark:text-violet-300 mt-2">Job Fit Score</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Sections tab ── */}
                        {tab === 'sections' && (
                            <div className="space-y-4">
                                {result.scoring?.sections?.map((sec, i) => (
                                    <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900 dark:text-white">{sec.sectionName || `Section ${i+1}`}</h4>
                                            <span className="text-sm font-bold text-violet-600">{sec.percentage?.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${sec.percentage || 0}%` }} />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-500">
                                            <div><p className="font-semibold text-green-600">{sec.correctAnswers}</p><p>Correct</p></div>
                                            <div><p className="font-semibold text-red-500">{sec.wrongAnswers}</p><p>Wrong</p></div>
                                            <div><p className="font-semibold text-gray-400">{sec.skippedQuestions}</p><p>Skipped</p></div>
                                            <div><p className="font-semibold text-violet-600">{sec.scoredPoints}/{sec.totalPoints}</p><p>Points</p></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── AI Analysis tab ── */}
                        {tab === 'ai-analysis' && (
                            <div className="space-y-5">
                                {ai.strengthAreas?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-green-500" /> Strength Areas</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {ai.strengthAreas.map((s, i) => <span key={i} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">{s}</span>)}
                                        </div>
                                    </div>
                                )}
                                {ai.weakAreas?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-red-500" /> Areas to Improve</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {ai.weakAreas.map((s, i) => <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">{s}</span>)}
                                        </div>
                                    </div>
                                )}
                                {ai.recommendations?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-amber-500" /> Recommendations</h4>
                                        <ul className="space-y-2">
                                            {ai.recommendations.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {!ai.strengthAreas && !ai.weakAreas && (
                                    <p className="text-gray-400 text-sm text-center py-8">AI analysis is being generated…</p>
                                )}
                            </div>
                        )}

                        {/* ── Proctoring tab ── */}
                        {tab === 'proctoring' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[['Tab Switches', proc.tabSwitchCount || 0, 'bg-red-100 text-red-700'], ['Copy Attempts', proc.copyAttempts || 0, 'bg-orange-100 text-orange-700'], ['Paste Attempts', proc.pasteAttempts || 0, 'bg-amber-100 text-amber-700'], ['Total Violations', proc.totalViolations || 0, proc.totalViolations > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']].map(([l,v,c]) => (
                                        <div key={l} className={`rounded-xl p-4 text-center ${c}`}>
                                            <p className="text-2xl font-black">{v}</p>
                                            <p className="text-xs mt-0.5">{l}</p>
                                        </div>
                                    ))}
                                </div>
                                {proc.autoSubmitted && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Auto-Submitted</p>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{proc.disqualificationReason}</p>
                                    </div>
                                )}
                                {proc.violations?.length > 0 ? (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Violation Log</p>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {proc.violations.map((v, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 text-xs">
                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${v.severity === 'high' || v.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{v.type}</span>
                                                    <span className="text-gray-500">{v.details}</span>
                                                    <span className="text-gray-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No violations recorded</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={() => navigate('/student/dashboard')} className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
