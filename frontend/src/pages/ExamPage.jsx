import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Send, Maximize } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ExamPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [current, setCurrent] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [phase, setPhase] = useState('loading'); // loading | briefing | exam | submitted
    const [tabWarnings, setTabWarnings] = useState(0);
    const [fsWarning, setFsWarning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        loadExam();
        return () => clearInterval(timerRef.current);
    }, []);

    // Tab visibility detection
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && phase === 'exam') {
                setTabWarnings(w => {
                    const newW = w + 1;
                    toast.error(`⚠️ Tab switch detected! Warning ${newW}/3`, { duration: 4000 });
                    if (attempt?._id) api.post('/student/exam/proctor', { attemptId: attempt._id, event: 'tab_switch' }).catch(() => {});
                    if (newW >= 3) { toast.error('Auto-submitting due to repeated tab switching!', { duration: 5000 }); setTimeout(() => handleSubmit(true), 2000); }
                    return newW;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [phase, attempt]);

    // Fullscreen exit detection
    useEffect(() => {
        const handleFsChange = () => {
            if (!document.fullscreenElement && phase === 'exam') {
                setFsWarning(true);
                if (attempt?._id) api.post('/student/exam/proctor', { attemptId: attempt._id, event: 'fullscreen_exit' }).catch(() => {});
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, [phase, attempt]);

    const loadExam = async () => {
        try {
            const { data } = await api.get(`/student/exam/${examId}`);
            if (!data.data) { toast.error('Exam not found or not yet available'); navigate(-1); return; }
            setExam(data.data);
            setTimeLeft(data.data.duration * 60);
            setAnswers(data.data.questions.map((_, i) => ({ questionIndex: i, selectedOption: -1, textAnswer: '' })));
            setPhase('briefing');
        } catch (err) { toast.error('Failed to load exam'); navigate(-1); }
    };

    const startExam = async () => {
        try {
            const { data } = await api.post(`/student/exam/${examId}/start`);
            setAttempt(data.data);
            setPhase('exam');
            // Request fullscreen
            document.documentElement.requestFullscreen?.().catch(() => {});
            // Start timer
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { clearInterval(timerRef.current); handleSubmit(false); return 0; }
                    return t - 1;
                });
            }, 1000);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to start exam'); }
    };

    const handleSubmit = useCallback(async (auto = false) => {
        if (submitting || !attempt?._id) return;
        setSubmitting(true);
        clearInterval(timerRef.current);
        try {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            const timeTaken = (exam.duration * 60) - timeLeft;
            const { data } = await api.post(`/student/exam/attempt/${attempt._id}/submit`, { answers, timeTaken });
            setResult(data.data);
            setPhase('submitted');
            if (auto) toast.success('Exam auto-submitted!');
        } catch (err) { toast.error('Submit failed: ' + (err.response?.data?.message || err.message)); }
        finally { setSubmitting(false); }
    }, [attempt, answers, timeLeft, submitting, exam]);

    const setAnswer = (qi, field, val) => setAnswers(a => a.map((item, i) => i === qi ? { ...item, [field]: val } : item));

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const timeColor = timeLeft < 300 ? 'text-red-500' : timeLeft < 600 ? 'text-yellow-500' : 'text-green-600 dark:text-green-400';
    const answeredCount = answers.filter(a => a.selectedOption >= 0 || a.textAnswer.trim()).length;

    if (phase === 'loading') return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

    if (phase === 'briefing') return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-violet-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam?.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Read instructions carefully before starting</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Duration', value: `${exam?.duration} min` },
                        { label: 'Questions', value: exam?.questions?.length },
                        { label: 'Total Marks', value: exam?.totalMarks },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Proctoring Rules</p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• Exam runs in full-screen mode — exiting will be flagged</li>
                        <li>• Tab switching is monitored — 3 violations = auto-submit</li>
                        <li>• Do not open any other applications during the exam</li>
                    </ul>
                </div>
                {exam?.instructions && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{exam.instructions}</div>
                )}
                <button onClick={startExam} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <Maximize className="w-5 h-5" /> Start Exam (Full Screen)
                </button>
            </motion.div>
        </div>
    );

    if (phase === 'submitted') return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full p-8 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam Submitted!</h1>
                {result && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <p className="text-3xl font-bold text-blue-600">{result.score}/{result.totalMarks}</p>
                            <p className="text-xs text-gray-500 mt-1">Your Score</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <p className="text-3xl font-bold text-green-600">#{result.rank}</p>
                            <p className="text-xs text-gray-500 mt-1">Current Rank</p>
                        </div>
                    </div>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">Your result will be reviewed by the company. Check your application status for updates.</p>
                <button onClick={() => navigate('/student/applications')} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                    View Applications
                </button>
            </motion.div>
        </div>
    );

    const q = exam?.questions?.[current];
    const ans = answers[current];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Fullscreen warning modal */}
            <AnimatePresence>
                {fsWarning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md text-center">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fullscreen Exited!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-5">Please return to fullscreen to continue your exam. This violation has been recorded.</p>
                            <button onClick={() => { document.documentElement.requestFullscreen?.(); setFsWarning(false); }}
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium">
                                Return to Fullscreen
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                <div>
                    <p className="font-semibold text-white">{exam?.title}</p>
                    <p className="text-xs text-gray-400">{answeredCount}/{exam?.questions?.length} answered</p>
                </div>
                <div className={`text-2xl font-mono font-bold ${timeColor}`}>{formatTime(timeLeft)}</div>
                <div className="flex items-center gap-3">
                    {tabWarnings > 0 && <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded-lg text-xs">⚠️ {tabWarnings} tab switch{tabWarnings > 1 ? 'es' : ''}</span>}
                    <button onClick={() => { if (window.confirm('Submit exam now?')) handleSubmit(false); }}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
                        <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Question Nav Panel */}
                <div className="w-56 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Questions</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {exam?.questions?.map((_, i) => {
                            const a = answers[i];
                            const answered = a?.selectedOption >= 0 || a?.textAnswer?.trim();
                            return (
                                <button key={i} onClick={() => setCurrent(i)}
                                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${i === current ? 'bg-violet-600 text-white' : answered ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-gray-400"><div className="w-3 h-3 rounded bg-green-700" /> Answered</div>
                        <div className="flex items-center gap-2 text-gray-400"><div className="w-3 h-3 rounded bg-gray-700" /> Not answered</div>
                        <div className="flex items-center gap-2 text-gray-400"><div className="w-3 h-3 rounded bg-violet-600" /> Current</div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {q && (
                        <motion.div key={current} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">{q.type}</span>
                                <span className="text-xs text-gray-500">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                                Q{current + 1}. {q.question}
                            </h2>

                            {q.type === 'mcq' && (
                                <div className="space-y-3">
                                    {q.options.filter(o => o).map((opt, oi) => (
                                        <button key={oi} onClick={() => setAnswer(current, 'selectedOption', oi)}
                                            className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all ${ans?.selectedOption === oi ? 'border-violet-500 bg-violet-900/30 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}>
                                            <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mr-3 ${ans?.selectedOption === oi ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                                {String.fromCharCode(65 + oi)}
                                            </span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {(q.type === 'descriptive' || q.type === 'coding') && (
                                <div>
                                    {q.description && <p className="text-sm text-gray-400 mb-3 italic">{q.description}</p>}
                                    <textarea value={ans?.textAnswer || ''} onChange={e => setAnswer(current, 'textAnswer', e.target.value)}
                                        rows={q.type === 'coding' ? 12 : 6}
                                        placeholder={q.type === 'coding' ? '// Write your code here...' : 'Type your answer here...'}
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-600 bg-gray-800 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none ${q.type === 'coding' ? 'font-mono' : ''}`} />
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between mt-8">
                                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-xl">
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <button onClick={() => setCurrent(c => Math.min(exam.questions.length - 1, c + 1))} disabled={current === exam.questions.length - 1}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-xl">
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
