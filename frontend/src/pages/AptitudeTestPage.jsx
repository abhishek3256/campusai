import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, CheckCircle, XCircle, BarChart3, Trophy, RefreshCcw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { key: 'quantitative', label: 'Quantitative', emoji: '🔢' },
    { key: 'logical', label: 'Logical Reasoning', emoji: '🧩' },
    { key: 'verbal', label: 'Verbal Ability', emoji: '📖' },
    { key: 'mixed', label: 'Mixed', emoji: '🎯' }
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function AptitudeTestPage() {
    const [view, setView] = useState('home'); // home | test | results | history
    const [category, setCategory] = useState('quantitative');
    const [difficulty, setDifficulty] = useState('medium');
    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeTaken, setTimeTaken] = useState(0);
    const timerRef = useRef(null);

    const startTimer = (totalSecs) => {
        setTimeLeft(totalSecs);
        timerRef.current = setInterval(() => {
            setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current); return 0; }
                return p - 1;
            });
            setTimeTaken(p => p + 1);
        }, 1000);
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const res = await api.post('/student/aptitude/generate', { category, difficulty });
            const testData = res.data.data;
            setTest(testData);
            setAnswers(new Array(testData.questions.length).fill(-1));
            setTimeTaken(0);
            startTimer((difficulty === 'easy' ? 15 : difficulty === 'hard' ? 25 : 20) * 60);
            setView('test');
        } catch { toast.error('Failed to generate test'); }
        finally { setGenerating(false); }
    };

    const handleSubmit = async () => {
        if (answers.some(a => a === -1)) {
            if (!confirm(`You have ${answers.filter(a => a === -1).length} unanswered questions. Submit anyway?`)) return;
        }
        try {
            setSubmitting(true);
            clearInterval(timerRef.current);
            const res = await api.post(`/student/aptitude/${test._id}/submit`, { answers, timeTaken });
            setTest(res.data.data);
            setView('results');
        } catch { toast.error('Submission failed'); }
        finally { setSubmitting(false); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/student/aptitude/results');
            setHistory(res.data.data || []);
        } catch { toast.error('Failed to load history'); }
    };

    const formatTime = (secs) => `${Math.floor(secs/60).toString().padStart(2,'0')}:${(secs%60).toString().padStart(2,'0')}`;
    const percent = test ? Math.round((test.score / test.totalQuestions) * 100) : 0;

    if (view === 'test' && test) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white capitalize">{test.category} • {test.difficulty}</h2>
                            <p className="text-sm text-gray-500">{answers.filter(a => a !== -1).length} / {test.questions.length} answered</p>
                        </div>
                        <div className={`flex items-center gap-2 text-lg font-bold ${timeLeft < 120 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            <Clock className="w-5 h-5" />{formatTime(timeLeft)}
                        </div>
                        <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm">
                            {submitting ? 'Submitting...' : 'Submit Test'}
                        </button>
                    </div>
                    <div className="space-y-6">
                        {test.questions.map((q, qi) => (
                            <motion.div key={qi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <p className="font-semibold text-gray-900 dark:text-white mb-4">Q{qi+1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oi) => (
                                        <button key={oi} onClick={() => setAnswers(p => { const a = [...p]; a[qi] = oi; return a; })}
                                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${answers[qi] === oi ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'}`}>
                                            <span className="font-bold mr-2">{String.fromCharCode(65+oi)}.</span>{opt}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'results' && test?.isCompleted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center mb-6">
                        <Trophy className={`w-16 h-16 mx-auto mb-4 ${percent >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Test Complete!</h2>
                        <div className={`text-5xl font-bold mb-2 ${percent >= 70 ? 'text-green-600 dark:text-green-400' : percent >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>{percent}%</div>
                        <p className="text-gray-500 dark:text-gray-400">{test.score} / {test.totalQuestions} correct • {formatTime(test.timeTaken)} taken</p>
                        <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{test.category} • {test.difficulty}</p>
                    </div>
                    <div className="space-y-4">
                        {test.questions.map((q, qi) => {
                            const isCorrect = test.studentAnswers[qi] === q.correctAnswer;
                            return (
                                <div key={qi} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 ${isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">Q{qi+1}. {q.question}</p>
                                            {!isCorrect && <p className="text-red-500 text-xs mb-1">Your answer: {test.studentAnswers[qi] === -1 ? 'Not answered' : q.options[test.studentAnswers[qi]]}</p>}
                                            <p className="text-green-600 dark:text-green-400 text-xs mb-1">Correct: {q.options[q.correctAnswer]}</p>
                                            {q.explanation && <p className="text-gray-500 dark:text-gray-400 text-xs">{q.explanation}</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => setView('home')} className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                        <RefreshCcw className="w-4 h-4" /> Take Another Test
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div>
                            Aptitude Tests
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-generated adaptive aptitude tests for placement prep</p>
                    </div>
                    <button onClick={() => { fetchHistory(); setView('history'); }} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:border-indigo-300">
                        <BarChart3 className="w-4 h-4" /> My Results
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {CATEGORIES.map(cat => (
                            <button key={cat.key} onClick={() => setCategory(cat.key)}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${category === cat.key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                                <div className="text-2xl mb-1">{cat.emoji}</div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</p>
                            </button>
                        ))}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Difficulty</h2>
                    <div className="flex gap-3 mb-8">
                        {DIFFICULTIES.map(d => (
                            <button key={d} onClick={() => setDifficulty(d)}
                                className={`flex-1 py-3 rounded-xl border-2 capitalize font-medium text-sm transition-all ${difficulty === d ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'}`}>
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6 text-sm text-indigo-700 dark:text-indigo-300">
                        <strong>10 questions</strong> • {difficulty === 'easy' ? '15' : difficulty === 'hard' ? '25' : '20'} minutes • AI-generated adaptive questions
                    </div>
                    <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2">
                        {generating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Questions...</> : <><Brain className="w-5 h-5" /> Start Test</>}
                    </button>
                </div>

                {view === 'history' && (
                    <div className="mt-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Test History</h2>
                        {history.length === 0 ? <p className="text-gray-400 text-center py-8">No tests completed yet</p> : (
                            <div className="space-y-3">
                                {history.map((h, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{h.category} • {h.difficulty}</p>
                                            <p className="text-sm text-gray-400">{new Date(h.createdAt).toLocaleDateString()} • {formatTime(h.timeTaken)}</p>
                                        </div>
                                        <div className={`text-xl font-bold ${Math.round((h.score/h.totalQuestions)*100) >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                            {h.score}/{h.totalQuestions}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
