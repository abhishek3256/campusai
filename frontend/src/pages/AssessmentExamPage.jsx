import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag, Send,
    Shield, Maximize, Eye, BookOpen, Play, CheckCircle2, X
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const LANG_STARTERS = {
    javascript: `// Write your solution here\nfunction solution(input) {\n  \n}\n`,
    python:     `# Write your solution here\ndef solution(input_data):\n    pass\n`,
    java:       `public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
    'c++':      `#include <iostream>\nusing namespace std;\nint main() {\n    // Your code here\n    return 0;\n}`,
};

// ── ViolationBanner ────────────────────────────────────────────────────────
const ViolationBanner = ({ message, onDismiss }) => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-6 py-3 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">⚠️ {message ? `${message} — ` : 'Proctoring Violation Detected! '}Continued violations will result in disqualification.</span>
        </div>
        <button onClick={onDismiss} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
);

// ── MCQ Question ───────────────────────────────────────────────────────────
const MCQQuestion = ({ question, answer, onChange }) => (
    <div className="space-y-3">
        {question.options?.map((opt, i) => (
            <label key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answer === opt.optionId ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-violet-300'}`}>
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${answer === opt.optionId ? 'border-violet-500 bg-violet-500' : 'border-gray-300'}`}>
                    {answer === opt.optionId && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input type="radio" className="sr-only" checked={answer === opt.optionId} onChange={() => onChange(opt.optionId)} />
                <span className="text-gray-900 dark:text-white text-sm">{opt.text}</span>
            </label>
        ))}
    </div>
);

// ── Essay Question ─────────────────────────────────────────────────────────
const EssayQuestion = ({ question, answer, onChange }) => (
    <div>
        <textarea value={answer || ''} onChange={e => onChange(e.target.value)} rows={8}
            placeholder="Write your answer here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none outline-none focus:ring-2 focus:ring-violet-500/30" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{(answer || '').split(/\s+/).filter(Boolean).length} words</span>
            {question.essayConfig && <span>{question.essayConfig.minWords}–{question.essayConfig.maxWords} words required</span>}
        </div>
    </div>
);

// ── Coding Question ────────────────────────────────────────────────────────
const CodingQuestion = ({ question, answer, onChange, attemptId }) => {
    const [lang, setLang] = useState('python');
    const [code, setCode] = useState(answer?.code || LANG_STARTERS.python);
    const [stdin, setStdin] = useState('');
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);

    const runCode = async () => {
        setRunning(true);
        try {
            const { data } = await api.post('/assessment/execute-code', { code, language: lang, stdin });
            const result = data.data;
            setOutput(result.stderr ? `Error:\n${result.stderr}` : result.stdout || result.output || '(no output)');
        } catch { setOutput('Execution error'); }
        finally { setRunning(false); }
    };

    const handleChange = (newCode) => {
        setCode(newCode);
        onChange({ code: newCode, language: lang });
    };

    return (
        <div className="space-y-4">
            {question.codingProblem && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-sm space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">{question.codingProblem.problemStatement}</p>
                    {question.codingProblem.sampleInput && (
                        <div className="grid grid-cols-2 gap-3">
                            <div><p className="text-xs font-medium text-gray-500 mb-1">Sample Input</p><pre className="bg-gray-900 text-green-400 text-xs p-2 rounded">{question.codingProblem.sampleInput}</pre></div>
                            <div><p className="text-xs font-medium text-gray-500 mb-1">Expected Output</p><pre className="bg-gray-900 text-green-400 text-xs p-2 rounded">{question.codingProblem.sampleOutput}</pre></div>
                        </div>
                    )}
                    {question.codingProblem.constraints && <p className="text-xs text-gray-500">📌 {question.codingProblem.constraints}</p>}
                </div>
            )}
            <div className="flex items-center gap-3">
                <select value={lang} onChange={e => { setLang(e.target.value); setCode(LANG_STARTERS[e.target.value] || ''); }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    {['python','javascript','java','c++'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={runCode} disabled={running}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    <Play className="w-3.5 h-3.5" /> {running ? 'Running...' : 'Run Code'}
                </button>
            </div>
            <textarea value={code} onChange={e => handleChange(e.target.value)} rows={12} spellCheck={false}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 text-green-400 font-mono text-sm resize-none outline-none" />
            <div>
                <p className="text-xs text-gray-500 mb-1">Custom Input (stdin)</p>
                <input value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Test input..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono" />
            </div>
            {output && (
                <div>
                    <p className="text-xs text-gray-500 mb-1">Output</p>
                    <pre className={`p-3 rounded-lg text-xs font-mono ${output.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-900 text-green-400'}`}>{output}</pre>
                </div>
            )}
        </div>
    );
};

// ── Main Exam Page ─────────────────────────────────────────────────────────
export default function AssessmentExamPage() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [phase, setPhase] = useState('loading'); // loading | brief | exam | submitted
    const [assessment, setAssessment] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [allQuestions, setAllQuestions] = useState([]); // flat list
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});    // questionId -> answer
    const [flagged, setFlagged] = useState({});    // questionId -> bool
    const [timeLeft, setTimeLeft] = useState(0);
    const [violations, setViolations] = useState(0);
    const [showBanner, setShowBanner] = useState(false);
    const [violationMsg, setViolationMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    const attemptRef = useRef(null);
    const saveRef    = useRef({});              // debounce: questionId -> timeout
    const isSubmittingRef = useRef(false);

    // ── Load assessment ────────────────────────────────────────────────────
    useEffect(() => {
        api.get(`/assessment/${assessmentId}`)
            .then(r => { setAssessment(r.data.data); setPhase('brief'); })
            .catch(() => { toast.error('Could not load assessment'); navigate(-1); });
    }, [assessmentId]);

    // ── Start exam ─────────────────────────────────────────────────────────
    const startExam = async () => {
        try {
            const { data } = await api.post(`/assessment/${assessmentId}/start`);
            const att = data.data.attempt;
            const asm = data.data.assessment;
            setAttempt(att);
            attemptRef.current = att._id;
            setAssessment(asm);

            const flat = asm.sections.flatMap(sec => sec.questions.map(q => ({ ...q, sectionId: sec.sectionId, sectionName: sec.sectionName })));
            setAllQuestions(flat);

            if (att.responses && att.responses.length > 0) {
                const restored = {};
                const flags = {};
                att.responses.forEach(r => {
                    restored[r.questionId] = r.answer;
                    if (r.flaggedForReview) flags[r.questionId] = true;
                });
                setAnswers(restored);
                setFlagged(flags);
            }

            const elapsed = Math.floor((new Date() - new Date(att.startedAt)) / 1000);
            const durationSec = (asm.schedule?.duration || 60) * 60;
            setTimeLeft(Math.max(0, durationSec - elapsed));

            setPhase('exam');
            enterFullscreen();
            setIsFullscreen(true);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg === 'Already attempted') {
                toast.error('You have already taken this test!');
                setPhase('already-taken');
            } else {
                toast.error(msg || 'Failed to start');
            }
        }
    };

    // ── Timer ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'exam') return;
        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(t); handleSubmit(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [phase]);

    // ── Proctoring ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'exam') return;

        const handleVisibility = () => {
            if (isSubmittingRef.current || phase !== 'exam') return;
            if (document.hidden) logViolation('tab-switch', 'medium', 'Student switched tab or minimized window');
        };
        const blockCopy  = (e) => { e.preventDefault(); logViolation('copy-attempt', 'low', 'Copy attempt blocked'); };
        const blockPaste = (e) => { e.preventDefault(); logViolation('paste-attempt', 'low', 'Paste attempt blocked'); };
        const blockMenu  = (e) => e.preventDefault();
        const handleFull = () => { 
            if (isSubmittingRef.current || phase !== 'exam') return;
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                logViolation('window-minimize', 'high', 'Student exited fullscreen or minimized window'); 
            } else {
                setIsFullscreen(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        document.addEventListener('copy', blockCopy);
        document.addEventListener('paste', blockPaste);
        document.addEventListener('contextmenu', blockMenu);
        document.addEventListener('fullscreenchange', handleFull);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('copy', blockCopy);
            document.removeEventListener('paste', blockPaste);
            document.removeEventListener('contextmenu', blockMenu);
            document.removeEventListener('fullscreenchange', handleFull);
        };
    }, [phase]);

    const logViolation = useCallback(async (type, severity, details) => {
        if (!attemptRef.current) return;
        setViolations(v => v + 1);
        setViolationMsg(details || 'Violation Detected');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 5000);
        try {
            const { data } = await api.post(`/assessment/attempt/${attemptRef.current}/violation`, { type, severity, details });
            if (data.disqualified) {
                toast.error('You have been disqualified due to too many violations!', { duration: 5000 });
                document.exitFullscreen?.().catch(() => {});
                setPhase('already-taken');
            }
        } catch {}
    }, []);

    const enterFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => {});
    };

    // ── Save answer (debounced) ────────────────────────────────────────────
    const saveAnswer = useCallback((question, answer) => {
        clearTimeout(saveRef.current[question.questionId]);
        saveRef.current[question.questionId] = setTimeout(async () => {
            if (!attemptRef.current) return;
            try {
                await api.post(`/assessment/attempt/${attemptRef.current}/answer`, {
                    sectionId: question.sectionId,
                    questionId: question.questionId,
                    answer,
                    flaggedForReview: !!flagged[question.questionId]
                });
            } catch {}
        }, 800);
    }, [flagged]);

    const handleAnswer = (question, value) => {
        setAnswers(a => ({ ...a, [question.questionId]: value }));
        saveAnswer(question, value);
    };

    const toggleFlag = (qId) => setFlagged(f => ({ ...f, [qId]: !f[qId] }));

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (force = false) => {
        if (!force) {
            const unanswered = allQuestions.filter(q => !answers[q.questionId]).length;
            if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
        }
        isSubmittingRef.current = true;
        setSubmitting(true);
        try {
            document.exitFullscreen?.().catch(() => {});
            await api.post(`/assessment/attempt/${attemptRef.current}/submit`);
            setPhase('submitted');
        } catch { 
            toast.error('Submission failed — try again'); 
            isSubmittingRef.current = false;
        }
        finally { setSubmitting(false); }
    };

    const q = allQuestions[currentIdx];
    const answered = Object.keys(answers).length;

    // ── PHASE: LOADING ─────────────────────────────────────────────────────
    if (phase === 'loading') return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ── PHASE: BRIEF ──────────────────────────────────────────────────────
    if (phase === 'brief') return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{assessment?.basicInfo?.title}</h1>
                        <p className="text-sm text-gray-500">{assessment?.testType?.replace('-', ' ')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {[['Duration', `${assessment?.schedule?.duration || 60} min`], ['Sections', assessment?.sections?.length || 0], ['Total Questions', assessment?.sections?.reduce((s,sec)=>s+sec.questions.length,0) || 0], ['Proctoring', assessment?.proctoring?.enabled ? '✅ Enabled' : '❌ Off']].map(([l, v]) => (
                        <div key={l} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{v}</p>
                        </div>
                    ))}
                </div>
                {assessment?.basicInfo?.instructions && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">📋 Instructions</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-line">{assessment.basicInfo.instructions}</p>
                    </div>
                )}
                {assessment?.proctoring?.enabled && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-1"><Shield className="w-4 h-4" /> Proctoring Active</p>
                        <ul className="text-xs text-red-700 dark:text-red-400 space-y-0.5">
                            {assessment.proctoring.features?.tabSwitchDetection && <li>• Tab switching will be detected</li>}
                            {assessment.proctoring.features?.copyPasteDetection && <li>• Copy/paste is disabled</li>}
                            {assessment.proctoring.features?.requireFullscreen && <li>• Fullscreen mode required</li>}
                        </ul>
                    </div>
                )}
                <button onClick={startExam} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-lg">
                    Start Exam
                </button>
            </div>
        </div>
    );

    // ── PHASE: SUBMITTED ──────────────────────────────────────────────────
    if (phase === 'submitted' || phase === 'already-taken') return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                {phase === 'submitted' ? (
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {phase === 'submitted' ? 'Submitted!' : 'Test Already Given!'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {phase === 'submitted' 
                        ? 'Your exam has been submitted. Results will be published by the company.'
                        : 'You have been disqualified or have already finalized this test. You cannot take it again.'}
                </p>
                <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium">Go to Dashboard</button>
            </div>
        </div>
    );

    // ── PHASE: EXAM ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col select-none">
            {showBanner && <ViolationBanner message={violationMsg} onDismiss={() => setShowBanner(false)} />}

            {/* Top bar */}
            <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shrink-0 ${showBanner ? 'mt-12' : ''}`}>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{assessment?.basicInfo?.title}</span>
                    <span className="text-xs text-gray-400">{answered}/{allQuestions.length} answered</span>
                </div>
                <div className="flex items-center gap-4">
                    {!isFullscreen && (
                        <button onClick={enterFullscreen} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 rounded-lg text-sm font-medium transition animate-pulse">
                            <Maximize className="w-4 h-4" /> Go Fullscreen
                        </button>
                    )}
                    {violations > 0 && <span className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle className="w-3.5 h-3.5" />{violations} violation{violations>1?'s':''}</span>}
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <Clock className="w-4 h-4" /> {fmt(timeLeft)}
                    </div>
                    <button onClick={() => handleSubmit()} disabled={submitting}
                        className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                        <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Question panel */}
                <div className="flex-1 overflow-y-auto p-6">
                    {q && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">{q.sectionName}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{q.difficulty}</span>
                                            <span className="text-xs text-gray-400">{q.points} pt{q.points>1?'s':''}</span>
                                        </div>
                                        <h3 className="text-gray-900 dark:text-white font-medium">Q{currentIdx + 1}. {q.question}</h3>
                                    </div>
                                    <button onClick={() => toggleFlag(q.questionId)} className={`p-2 rounded-lg transition ${flagged[q.questionId] ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                        <Flag className="w-4 h-4" />
                                    </button>
                                </div>

                                {(q.questionType === 'mcq' || q.questionType === 'true-false') && (
                                    q.questionType === 'true-false'
                                        ? <div className="flex gap-3">
                                            {['True','False'].map(v => (
                                                <button key={v} onClick={() => handleAnswer(q, v)}
                                                    className={`flex-1 py-4 rounded-xl border-2 font-semibold transition ${answers[q.questionId] === v ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-violet-300'}`}>
                                                    {v}
                                                </button>
                                            ))}
                                          </div>
                                        : <MCQQuestion question={q} answer={answers[q.questionId]} onChange={v => handleAnswer(q, v)} />
                                )}
                                {q.questionType === 'essay' && <EssayQuestion question={q} answer={answers[q.questionId]} onChange={v => handleAnswer(q, v)} />}
                                {q.questionType === 'coding' && <CodingQuestion question={q} answer={answers[q.questionId]} onChange={v => handleAnswer(q, v)} attemptId={attempt?._id} />}
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition">
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <button onClick={() => setCurrentIdx(i => Math.min(allQuestions.length - 1, i + 1))} disabled={currentIdx === allQuestions.length - 1} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-40 transition">
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: question grid */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto shrink-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Questions</p>
                    <div className="grid grid-cols-5 gap-1.5">
                        {allQuestions.map((question, i) => (
                            <button key={i} onClick={() => setCurrentIdx(i)}
                                className={`w-9 h-9 rounded-lg text-xs font-semibold transition relative ${
                                    i === currentIdx ? 'bg-violet-600 text-white' :
                                    answers[question.questionId] ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                }`}>
                                {i + 1}
                                {flagged[question.questionId] && <span className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-full" />}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 rounded" /> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded" /> Unanswered</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-violet-600 rounded" /> Current</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-100 rounded relative"><span className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-full" /></div> Flagged</div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
