import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, Trash2, Sparkles, ChevronRight, ChevronLeft,
    Send, Clock, Shield, Settings, Eye, Loader2, CheckCircle2, X, Wand2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const DESIGNATIONS = [
    'Software Engineer','Senior Software Engineer','Frontend Developer','Backend Developer',
    'Full Stack Developer','Mobile App Developer','DevOps Engineer','Cloud Engineer',
    'Data Scientist','Data Analyst','Data Engineer','Machine Learning Engineer',
    'AI Research Engineer','UI/UX Designer','Product Designer','QA Engineer',
    'Test Automation Engineer','Cybersecurity Analyst','Security Engineer',
    'Database Administrator','Blockchain Developer','Game Developer','IoT Engineer',
    'Technical Architect','Solutions Architect','HR Manager','HR Generalist',
    'Talent Acquisition Specialist','Recruiter','Marketing Manager',
    'Digital Marketing Specialist','Content Marketing Manager','Social Media Manager',
    'SEO Specialist','Sales Manager','Business Development Manager','Account Manager',
    'Operations Manager','Operations Analyst','Supply Chain Manager',
    'Project Manager','Product Manager','Business Analyst','Finance Manager',
    'Financial Analyst','Accountant','Customer Service Representative',
    'Content Writer','Copywriter','Technical Writer','Legal Counsel',
    'Compliance Officer','Administrative Assistant','Executive Assistant'
];

const TEST_TYPES = [
    { value: 'aptitude',            label: '🧠 Aptitude Test' },
    { value: 'technical-mcq',      label: '💡 Technical MCQ' },
    { value: 'coding-round',       label: '💻 Coding Round' },
    { value: 'essay-writing',      label: '✍️ Essay Writing' },
    { value: 'situational-judgment',label: '🎭 Situational Judgment' },
    { value: 'personality-assessment', label: '🧩 Personality Assessment' },
    { value: 'case-study',         label: '📋 Case Study' },
    { value: 'typing-test',        label: '⌨️ Typing Test' },
    { value: 'technical-interview', label: '🎥 AI Tech Video Interview' },
    { value: 'hr-interview',        label: '🎥 AI HR Video Interview' },
    { value: 'mixed',              label: '🔀 Mixed' },
];

const STEPS = ['Basic Info', 'Schedule', 'Questions', 'Proctoring', 'Review'];

const INPUT = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/30";
const CARD  = "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6";
const BTN_P = "flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-50 transition";
const BTN_S = "flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition";

const getTargetSectionType = (testType) => {
    if (testType === 'coding-round') return 'coding';
    if (['essay-writing', 'case-study', 'typing-test', 'technical-interview', 'hr-interview'].includes(testType)) return 'essay';
    return 'mcq';
};

const defaultSection = (testType = '') => ({
    sectionId: `s_${Date.now()}`,
    sectionName: '',
    sectionType: getTargetSectionType(testType),
    skills: [],
    difficultyLevel: 'medium',
    questionsCount: 5,
    questions: []
});

// ── Toggle switch component ───────────────────────────────────────────────────
const Toggle = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
            {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        <button onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

// ── Step indicator ────────────────────────────────────────────────────────────
const StepBar = ({ step }) => (
    <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    i + 1 < step ? 'bg-violet-600 text-white' :
                    i + 1 === step ? 'bg-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                    {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <p className={`text-xs ml-2 font-medium whitespace-nowrap ${i + 1 === step ? 'text-violet-600' : 'text-gray-400'}`}>{label}</p>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i + 1 < step ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
        ))}
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function ExamCreatorPage() {
    const { jobId } = useParams();
    const navigate  = useNavigate();
    const [step, setStep] = useState(1);
    const [jobs, setJobs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [genLoading, setGenLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState({ title: false, description: false, instructions: false });
    const [skillInput, setSkillInput] = useState('');
    const [activeSection, setActiveSection] = useState(null); // index of section being edited

    const [form, setForm] = useState({
        jobId: jobId || '',
        basicInfo: { title: '', designation: '', description: '', instructions: '' },
        testType: '',
        schedule: { startDate: '', endDate: '', duration: 60 },
        sections: [],
        proctoring: {
            enabled: true,
            features: {
                webcamMonitoring: true,
                screenRecording: false,
                tabSwitchDetection: true,
                copyPasteDetection: true,
                violations: { maxTabSwitches: 3, maxWindowMinimizes: 2, autoSubmitOnViolation: true }
            }
        },
        settings: { shuffleQuestions: true, shuffleOptions: true, requireFullscreen: true, preventCopyPaste: true }
    });

    const [section, setSection] = useState(defaultSection());

    useEffect(() => { api.get('/company/jobs').then(r => setJobs(r.data || [])).catch(() => {}); }, []);

    const setBasic = (k, v) => setForm(f => ({ ...f, basicInfo: { ...f.basicInfo, [k]: v } }));
    const setSched = (k, v) => setForm(f => ({ ...f, schedule: { ...f.schedule, [k]: v } }));
    const setProc  = (k, v) => setForm(f => ({ ...f, proctoring: { ...f.proctoring, features: { ...f.proctoring.features, [k]: v } } }));
    const setViol  = (k, v) => setForm(f => ({ ...f, proctoring: { ...f.proctoring, features: { ...f.proctoring.features, violations: { ...f.proctoring.features.violations, [k]: v } } } }));
    const setSett  = (k, v) => setForm(f => ({ ...f, settings: { ...f.settings, [k]: v } }));

    // ── AI Text Generation ──
    const generateField = async (field) => {
        const designation = form.basicInfo.designation;
        const testType    = form.testType;
        if (!designation) return toast.error('Select a Designation first');

        const prompts = {
            title:        `Generate a concise, professional assessment title for a ${designation} role. Test type: ${testType || 'Technical'}. Return ONLY the title text, nothing else. Example: "${designation} — Technical Assessment Round 1"`,
            description:  `Write a 2-3 sentence description for a ${designation} assessment exam. Test type: ${testType || 'Technical'}. Be professional and encouraging. Return ONLY the description text.`,
            instructions: `Write clear exam instructions for a ${designation} assessment. Include: time awareness, tab-switching warning, read carefully note, attempt all questions advice. 4-6 bullet points. Return ONLY the instructions text (no JSON, no markdown headers).`
        };

        setAiLoading(s => ({ ...s, [field]: true }));
        try {
            const { data } = await api.post('/assessment/generate-text', { prompt: prompts[field] });
            if (data.text) {
                setBasic(field, data.text.trim());
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} generated!`);
            }
        } catch (err) {
            console.error('Generate field error:', err);
            const msg = err?.response?.data?.message || err.message || 'AI generation failed';
            toast.error(msg);
        }
        finally { setAiLoading(s => ({ ...s, [field]: false })); }
    };

    // ── AI Questions Generation ──
    const generateQuestions = async () => {
        if (!section.skills.length) return toast.error('Add at least one skill');
        if (!form.basicInfo.designation) return toast.error('Select a designation first');
        setGenLoading(true);
        try {
            const { data } = await api.post('/assessment/generate-questions', {
                skills: section.skills,
                difficulty: section.difficultyLevel,
                questionType: section.sectionType,
                count: section.questionsCount,
                designation: form.basicInfo.designation
            });
            if (data.data?.questions?.length) {
                setSection(s => ({ ...s, questions: data.data.questions }));
                toast.success(`${data.data.questions.length} questions generated!`);
            } else toast.error('No questions returned, try again');
        } catch (err) {
            toast.error('AI generation failed');
        } finally { setGenLoading(false); }
    };

    const addSectionToForm = () => {
        if (!section.sectionName.trim()) return toast.error('Enter a section name');
        if (!section.questions.length) return toast.error('Generate or add questions first');
        setForm(f => ({ ...f, sections: [...f.sections, { ...section, sectionId: `s_${Date.now()}` }] }));
        setSection(defaultSection(form.testType));
        setSkillInput('');
        toast.success('Section added!');
    };

    const removeSection = (i) => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !section.skills.includes(s)) setSection(sec => ({ ...sec, skills: [...sec.skills, s] }));
        setSkillInput('');
    };
    const removeSkill = (i) => setSection(s => ({ ...s, skills: s.skills.filter((_, idx) => idx !== i) }));

    // ── Save ──
    const handleSave = async () => {
        if (!form.basicInfo.title) return toast.error('Enter a title');
        if (!form.sections.length) return toast.error('Add at least one section');
        setSaving(true);
        try {
            await api.post('/assessment', { ...form, status: 'published' });
            toast.success('Assessment created and published!');
            navigate('/company/dashboard');
        } catch (err) { toast.error('Failed to save assessment'); }
        finally { setSaving(false); }
    };

    const totalQuestions = form.sections.reduce((s, sec) => s + sec.questions.length, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-7 flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shrink-0">
                        <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Assessment</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-powered exam builder with proctoring</p>
                    </div>
                </div>

                <StepBar step={step} />

                {/* ── STEP 1: Basic Info ── */}
                {step === 1 && (
                    <div className={CARD + ' space-y-5'}>
                        <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Basic Information</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Select Job
                                    <span className="ml-1 text-xs text-gray-400 font-normal">({jobs.length} posted)</span>
                                </label>
                                <select value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))} className={INPUT}>
                                    <option value="">— No specific job (standalone assessment) —</option>
                                    {jobs.map(j => <option key={j._id} value={j._id}>{j.title}{j.location ? ` — ${j.location}` : ''}</option>)}
                                </select>
                                {jobs.length === 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">💡 No jobs posted yet. You can still create a standalone assessment.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Designation / Role *</label>
                                <select value={form.basicInfo.designation} onChange={e => setBasic('designation', e.target.value)} className={INPUT}>
                                    <option value="">Select Designation</option>
                                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assessment Title *</label>
                                <button type="button" onClick={() => generateField('title')} disabled={aiLoading.title || !form.basicInfo.designation}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium disabled:opacity-50 transition">
                                    {aiLoading.title ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    {aiLoading.title ? 'Generating...' : '✨ Generate with AI'}
                                </button>
                            </div>
                            <input value={form.basicInfo.title} onChange={e => setBasic('title', e.target.value)} placeholder="e.g. Frontend Developer — Technical Round 1" className={INPUT} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Test Type *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {TEST_TYPES.map(t => (
                                    <button key={t.value} type="button" onClick={() => {
                                            setForm(f => ({...f, testType: t.value}));
                                            setSection(s => ({...s, sectionType: getTargetSectionType(t.value)}));
                                        }}
                                        className={`p-3 rounded-xl border text-sm text-left transition ${form.testType === t.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-violet-300'}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <button type="button" onClick={() => generateField('description')} disabled={aiLoading.description || !form.basicInfo.designation}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium disabled:opacity-50 transition">
                                    {aiLoading.description ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    {aiLoading.description ? 'Generating...' : '✨ AI Generate'}
                                </button>
                            </div>
                            <textarea value={form.basicInfo.description} onChange={e => setBasic('description', e.target.value)} rows={2} placeholder="Brief description of this assessment..." className={INPUT + ' resize-none'} />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructions for Students</label>
                                <button type="button" onClick={() => generateField('instructions')} disabled={aiLoading.instructions || !form.basicInfo.designation}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium disabled:opacity-50 transition">
                                    {aiLoading.instructions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    {aiLoading.instructions ? 'Generating...' : '✨ AI Generate'}
                                </button>
                            </div>
                            <textarea value={form.basicInfo.instructions} onChange={e => setBasic('instructions', e.target.value)} rows={3} placeholder="Rules, guidelines, important notes..." className={INPUT + ' resize-none'} />
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setStep(2)} disabled={!form.basicInfo.title || !form.basicInfo.designation || !form.testType} className={BTN_P}>
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Schedule ── */}
                {step === 2 && (
                    <div className={CARD + ' space-y-5'}>
                        <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-violet-500" /> Schedule</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date & Time *</label>
                                <input type="datetime-local" value={form.schedule.startDate} onChange={e => setSched('startDate', e.target.value)} className={INPUT} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date & Time *</label>
                                <input type="datetime-local" value={form.schedule.endDate} onChange={e => setSched('endDate', e.target.value)} className={INPUT} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (minutes) *</label>
                            <input type="number" min={15} max={300} value={form.schedule.duration} onChange={e => setSched('duration', parseInt(e.target.value))} className={INPUT} />
                            <p className="text-xs text-gray-400 mt-1">15 – 300 minutes</p>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(1)} className={BTN_S}><ChevronLeft className="w-4 h-4" /> Back</button>
                            <button onClick={() => setStep(3)} disabled={!form.schedule.startDate || !form.schedule.endDate} className={BTN_P}>Next <ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Questions ── */}
                {step === 3 && (
                    <div className="space-y-5">
                        {/* Section builder */}
                        <div className={CARD + ' space-y-4'}>
                            <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Add Section</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Name</label>
                                    <input value={section.sectionName} onChange={e => setSection(s => ({ ...s, sectionName: e.target.value }))} placeholder="e.g. JavaScript Fundamentals" className={INPUT} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Question Type</label>
                                    <select value={section.sectionType} onChange={e => setSection(s => ({ ...s, sectionType: e.target.value }))} className={INPUT}>
                                        <option value="mcq">Multiple Choice (MCQ)</option>
                                        <option value="coding">Coding Problem</option>
                                        <option value="essay">Essay / Open-ended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty</label>
                                    <select value={section.difficultyLevel} onChange={e => setSection(s => ({ ...s, difficultyLevel: e.target.value }))} className={INPUT}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">No. of Questions</label>
                                    <input type="number" min={1} max={30} value={section.questionsCount} onChange={e => setSection(s => ({ ...s, questionsCount: parseInt(e.target.value) }))} className={INPUT} />
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Skills to Test</label>
                                <div className="flex gap-2">
                                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="Type skill + Enter  (e.g. React, SQL, Python)" className={INPUT + ' flex-1'} />
                                    <button type="button" onClick={addSkill} className={BTN_P}><Plus className="w-4 h-4" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {section.skills.map((sk, i) => (
                                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                                            {sk}
                                            <button onClick={() => removeSkill(i)}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Generate */}
                            <button onClick={generateQuestions} disabled={genLoading} className={BTN_P + ' w-full justify-center'}>
                                {genLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</> : <><Sparkles className="w-4 h-4" /> Generate Questions with AI</>}
                            </button>

                            {/* Preview generated questions */}
                            {section.questions.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.questions.length} Questions Generated</p>
                                        <span className="text-xs text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-full">AI Generated ✨</span>
                                    </div>
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                        {section.questions.map((q, qi) => (
                                            <div key={qi} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{qi + 1}. {q.question}</p>
                                                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{q.difficulty}</span>
                                                </div>
                                                {q.options && (
                                                    <div className="space-y-1 ml-3">
                                                        {q.options.map((opt, oi) => (
                                                            <p key={oi} className={`text-xs ${opt.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {opt.isCorrect ? '✓' : '○'} {opt.text}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.codingProblem && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{q.codingProblem.problemStatement}</p>}
                                                {q.essayConfig && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📝 {q.essayConfig.minWords}–{q.essayConfig.maxWords} words · {q.essayConfig.keyPoints?.length} key points</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addSectionToForm} className={BTN_P + ' w-full justify-center mt-3'}>
                                        <Plus className="w-4 h-4" /> Add Section to Assessment
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sections added */}
                        {form.sections.length > 0 && (
                            <div className={CARD}>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Added Sections ({form.sections.length})</h3>
                                <div className="space-y-2">
                                    {form.sections.map((sec, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{sec.sectionName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{sec.questions.length} questions · {sec.skills.join(', ')} · {sec.difficultyLevel}</p>
                                            </div>
                                            <button onClick={() => removeSection(i)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(2)} className={BTN_S}><ChevronLeft className="w-4 h-4" /> Back</button>
                            <button 
                                onClick={() => {
                                    if (form.sections.length === 0 && section.questions.length > 0) {
                                        if (!section.sectionName.trim()) return toast.error('Please enter a Section Name first, then click Next');
                                        setForm(f => ({ ...f, sections: [...f.sections, { ...section, sectionId: `s_${Date.now()}` }] }));
                                        setSection(defaultSection(form.testType));
                                        setSkillInput('');
                                        toast.success('Section auto-added!');
                                        setStep(4);
                                    } else {
                                        setStep(4);
                                    }
                                }} 
                                disabled={form.sections.length === 0 && section.questions.length === 0} 
                                className={BTN_P}
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Proctoring ── */}
                {step === 4 && (
                    <div className="space-y-5">
                        <div className={CARD}>
                            <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-violet-500" /> Proctoring Settings</h2>
                            <Toggle label="Enable Proctoring" desc="Monitor students during the exam" checked={form.proctoring.enabled} onChange={v => setForm(f => ({ ...f, proctoring: { ...f.proctoring, enabled: v } }))} />
                            {form.proctoring.enabled && <>
                                <Toggle label="Webcam Monitoring" desc="Capture webcam snapshots periodically" checked={form.proctoring.features.webcamMonitoring} onChange={v => setProc('webcamMonitoring', v)} />
                                <Toggle label="Screen Recording" desc="Record the student's screen" checked={form.proctoring.features.screenRecording} onChange={v => setProc('screenRecording', v)} />
                                <Toggle label="Tab Switch Detection" desc="Flag when student leaves the exam tab" checked={form.proctoring.features.tabSwitchDetection} onChange={v => setProc('tabSwitchDetection', v)} />
                                <Toggle label="Copy/Paste Detection" desc="Block and flag copy-paste attempts" checked={form.proctoring.features.copyPasteDetection} onChange={v => setProc('copyPasteDetection', v)} />
                                <Toggle label="Auto-submit on Max Violations" desc="Automatically submit when limits exceeded" checked={form.proctoring.features.violations.autoSubmitOnViolation} onChange={v => setViol('autoSubmitOnViolation', v)} />

                                <div className="grid grid-cols-2 gap-4 pt-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Tab Switches Allowed</label>
                                        <input type="number" min={0} max={10} value={form.proctoring.features.violations.maxTabSwitches} onChange={e => setViol('maxTabSwitches', parseInt(e.target.value))} className={INPUT} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Window Minimizes</label>
                                        <input type="number" min={0} max={10} value={form.proctoring.features.violations.maxWindowMinimizes} onChange={e => setViol('maxWindowMinimizes', parseInt(e.target.value))} className={INPUT} />
                                    </div>
                                </div>
                            </>}
                        </div>

                        <div className={CARD}>
                            <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-violet-500" /> Exam Settings</h2>
                            <Toggle label="Shuffle Questions" desc="Randomize question order per student" checked={form.settings.shuffleQuestions} onChange={v => setSett('shuffleQuestions', v)} />
                            <Toggle label="Shuffle Options" desc="Randomize MCQ option order" checked={form.settings.shuffleOptions} onChange={v => setSett('shuffleOptions', v)} />
                            <Toggle label="Require Fullscreen" desc="Students must enter fullscreen mode" checked={form.settings.requireFullscreen} onChange={v => setSett('requireFullscreen', v)} />
                            <Toggle label="Prevent Copy/Paste" desc="Disable clipboard in exam window" checked={form.settings.preventCopyPaste} onChange={v => setSett('preventCopyPaste', v)} />
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(3)} className={BTN_S}><ChevronLeft className="w-4 h-4" /> Back</button>
                            <button onClick={() => setStep(5)} className={BTN_P}>Review <ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                {/* ── STEP 5: Review ── */}
                {step === 5 && (
                    <div className="space-y-5">
                        <div className={CARD}>
                            <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-5"><Eye className="w-5 h-5 text-violet-500" /> Review Assessment</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                {[
                                    ['Title', form.basicInfo.title],
                                    ['Designation', form.basicInfo.designation],
                                    ['Test Type', TEST_TYPES.find(t => t.value === form.testType)?.label || form.testType],
                                    ['Duration', `${form.schedule.duration} minutes`],
                                    ['Sections', `${form.sections.length} section(s)`],
                                    ['Total Questions', totalQuestions],
                                    ['Proctoring', form.proctoring.enabled ? '✅ Enabled' : '❌ Disabled'],
                                    ['Shuffle', form.settings.shuffleQuestions ? 'On' : 'Off'],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                                    </div>
                                ))}
                            </div>
                            {form.sections.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-xs text-gray-400 mb-2">Sections</p>
                                    {form.sections.map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                            <span className="text-gray-700 dark:text-gray-300">{s.sectionName}</span>
                                            <span className="text-gray-500">{s.questions.length} Qs · {s.difficultyLevel}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(4)} className={BTN_S}><ChevronLeft className="w-4 h-4" /> Back</button>
                            <button onClick={handleSave} disabled={saving} className={BTN_P + ' bg-green-600 hover:bg-green-700'}>
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Send className="w-4 h-4" /> Save Assessment</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
