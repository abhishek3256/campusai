import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Briefcase, GraduationCap, Code2, Calendar, ChevronRight, ChevronLeft, Sparkles, Check, X, GitBranch, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
    { id: 0, label: 'Company Info', icon: Building2 },
    { id: 1, label: 'Job Details', icon: Briefcase },
    { id: 2, label: 'Eligibility', icon: GraduationCap },
    { id: 3, label: 'Skills', icon: Code2 },
    { id: 4, label: 'Timeline', icon: Calendar },
    { id: 5, label: 'Pipeline', icon: GitBranch },
];

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'MBA', 'MCA'];
const EMPLOYMENT_TYPES = ['full-time', 'internship', 'contract', 'part-time'];
const WORK_MODES = ['on-site', 'remote', 'hybrid'];

const ALL_STAGES = [
    { stageName: 'Application Screening', icon: '📋', description: 'Initial screening of applications' },
    { stageName: 'Resume Shortlisting', icon: '📄', description: 'Review and shortlist resumes' },
    { stageName: 'Online Assessment', icon: '💻', description: 'Online aptitude/technical test' },
    { stageName: 'Technical Round', icon: '🔧', description: 'Technical interview round' },
    { stageName: 'Managerial Round', icon: '👔', description: 'Managerial interview round' },
    { stageName: 'HR Round', icon: '🤝', description: 'HR interview round' },
    { stageName: 'Group Discussion', icon: '👥', description: 'Group discussion round' },
    { stageName: 'Case Study', icon: '📊', description: 'Case study presentation' },
    { stageName: 'Final Interview', icon: '⭐', description: 'Final decision interview' },
    { stageName: 'Offer Letter', icon: '💌', description: 'AI-generated offer letter' },
    { stageName: 'Document Verification', icon: '🔍', description: 'Verify student documents' },
    { stageName: 'Joining Letter', icon: '📝', description: 'AI-generated joining instructions' },
    { stageName: 'Letter of Employment', icon: '🏆', description: 'Official employment confirmation letter' },
];

const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm ${className}`} />
);

const Select = ({ value, onChange, children }) => (
    <select value={value} onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        {children}
    </select>
);

const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
);

const TagInput = ({ tags, onAdd, onRemove, placeholder }) => {
    const [input, setInput] = useState('');
    const add = () => { const t = input.trim(); if (t && !tags.includes(t)) { onAdd(t); setInput(''); } };
    return (
        <div>
            <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button type="button" onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                        {t} <button type="button" onClick={() => onRemove(i)} className="ml-1 hover:text-red-500">×</button>
                    </span>
                ))}
            </div>
        </div>
    );
};

// ── Pipeline Builder Component ────────────────────────────────────────────────
const PipelineBuilder = ({ stages, onStagesChange }) => {
    const toggleStage = (stageName) => {
        const idx = stages.findIndex(s => s.stageName === stageName);
        if (idx === -1) {
            const newStage = {
                stageId: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                stageName,
                order: stages.length + 1,
                isEnabled: true,
                isRequired: true
            };
            onStagesChange([...stages, newStage]);
        } else {
            onStagesChange(stages.filter(s => s.stageName !== stageName));
        }
    };

    const isEnabled = (stageName) => stages.some(s => s.stageName === stageName);

    const moveStage = (idx, dir) => {
        const newStages = [...stages];
        const target = idx + dir;
        if (target < 0 || target >= newStages.length) return;
        [newStages[idx], newStages[target]] = [newStages[target], newStages[idx]];
        onStagesChange(newStages.map((s, i) => ({ ...s, order: i + 1 })));
    };

    const toggleRequired = (idx) => {
        const newStages = [...stages];
        newStages[idx] = { ...newStages[idx], isRequired: !newStages[idx].isRequired };
        onStagesChange(newStages);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Available Stages — Click to Add</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_STAGES.map(stage => {
                        const active = isEnabled(stage.stageName);
                        return (
                            <button
                                key={stage.stageName}
                                type="button"
                                onClick={() => toggleStage(stage.stageName)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-medium text-left transition-all ${
                                    active
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <span className="text-base">{stage.icon}</span>
                                <div>
                                    <div>{stage.stageName}</div>
                                    {active && <div className="text-green-600 dark:text-green-400 text-xs">✓ Added</div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {stages.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Your Pipeline — Drag to Reorder ({stages.length} stages)
                    </h3>
                    <div className="space-y-2">
                        {stages.map((stage, idx) => {
                            const stageInfo = ALL_STAGES.find(s => s.stageName === stage.stageName);
                            return (
                                <div
                                    key={stage.stageId || idx}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <button type="button" onClick={() => moveStage(idx, -1)} disabled={idx === 0}
                                            className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1}
                                            className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <span className="text-lg">{stageInfo?.icon || '📌'}</span>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.stageName}</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{stageInfo?.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleRequired(idx)}
                                        className={`text-xs px-2 py-1 rounded-lg border ${
                                            stage.isRequired
                                                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                                : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {stage.isRequired ? 'Required' : 'Optional'}
                                    </button>
                                    <button type="button" onClick={() => toggleStage(stage.stageName)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {stages.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <GitBranch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No pipeline stages added yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click stages above to add them to your pipeline</p>
                </div>
            )}
        </div>
    );
};

export default function PostJob() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [generatingDesc, setGeneratingDesc] = useState(false);
    const [generatingCompany, setGeneratingCompany] = useState(false);
    const [generatingEligibility, setGeneratingEligibility] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        // Tab 0 - Company
        companyDisplayName: '', companyWebsite: '', industryType: '', companyDescription: '',
        // Tab 1 - Job
        title: '', description: '', department: '', location: '',
        employmentType: 'full-time', workMode: 'on-site',
        salaryMin: '', salaryMax: '', stipend: '',
        bondDuration: '', bondConditions: '', vacancies: 1,
        // Tab 2 - Eligibility
        minCGPA: '', branches: [], passingYear: '', academicRequirements: '',
        // Tab 3 - Skills
        mustHave: [], goodToHave: [], technologies: [],
        // Tab 4 - Timeline
        applicationDeadline: '', shortlistingDate: '', examDate: '', interviewDate: '', finalSelectionDate: '',
        // Tab 5 - Pipeline
        pipelineStages: []
    });

    const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
    const addTag = (field, val) => setForm(p => ({ ...p, [field]: [...p[field], val] }));
    const removeTag = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
    const toggleBranch = (b) => form.branches.includes(b)
        ? setForm(p => ({ ...p, branches: p.branches.filter(x => x !== b) }))
        : setForm(p => ({ ...p, branches: [...p.branches, b] }));

    const handleGenerateDesc = async () => {
        if (!form.title) return toast.error('Enter a job title first');
        try {
            setGeneratingDesc(true);
            const { data } = await api.post('/company/ai/job-description', {
                title: form.title, skills: form.mustHave.join(', '), experience: form.department
            });
            set('description', data.description);
            toast.success('Description generated!');
        } catch { toast.error('AI generation failed'); }
        finally { setGeneratingDesc(false); }
    };

    const handleGenerateCompanyDesc = async () => {
        if (!form.companyDisplayName) return toast.error('Enter a company name first');
        try {
            setGeneratingCompany(true);
            const { data } = await api.post('/company/ai/company-description', {
                companyName: form.companyDisplayName,
                industry: form.industryType,
                title: form.title
            });
            set('companyDescription', data.description);
            toast.success('Company description generated!');
        } catch { toast.error('AI generation failed'); }
        finally { setGeneratingCompany(false); }
    };

    const handleGenerateEligibility = async () => {
        if (!form.title) return toast.error('Enter a job title first (Tab 2)');
        try {
            setGeneratingEligibility(true);
            const { data } = await api.post('/company/ai/eligibility', {
                title: form.title,
                minCGPA: form.minCGPA,
                branches: form.branches.join(', ')
            });
            set('academicRequirements', data.requirements);
            toast.success('Eligibility requirements generated!');
        } catch { toast.error('AI generation failed'); }
        finally { setGeneratingEligibility(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title) return toast.error('Job title is required');
        try {
            setSubmitting(true);
            const payload = {
                companyDisplayName: form.companyDisplayName,
                companyWebsite: form.companyWebsite,
                industryType: form.industryType,
                companyDescription: form.companyDescription,
                title: form.title, description: form.description,
                department: form.department, location: form.location,
                employmentType: form.employmentType, workMode: form.workMode,
                salary: { min: Number(form.salaryMin) || 0, max: Number(form.salaryMax) || 0 },
                stipend: Number(form.stipend) || 0,
                bond: { duration: form.bondDuration, conditions: form.bondConditions },
                vacancies: Number(form.vacancies) || 1,
                eligibility: {
                    minCGPA: Number(form.minCGPA) || 0,
                    branches: form.branches,
                    passingYear: Number(form.passingYear) || 0,
                    academicRequirements: form.academicRequirements
                },
                skills: { mustHave: form.mustHave, goodToHave: form.goodToHave, technologies: form.technologies },
                requirements: { skills: form.mustHave },
                timeline: {
                    applicationDeadline: form.applicationDeadline || null,
                    shortlistingDate: form.shortlistingDate || null,
                    examDate: form.examDate || null,
                    interviewDate: form.interviewDate || null,
                    finalSelectionDate: form.finalSelectionDate || null,
                },
                deadline: form.applicationDeadline || null,
                // Pipeline
                recruitmentPipeline: {
                    stages: form.pipelineStages,
                    autoRejectOnFailure: false
                }
            };
            await api.post('/company/jobs', payload);
            toast.success('Job posted successfully!');
            navigate('/company/dashboard');
        } catch (err) { toast.error('Failed to post job'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Briefcase className="w-6 h-6 text-white" /></div>
                            Post a New Job
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Fill in all details to attract the right candidates</p>
                    </div>
                    <button 
                        onClick={() => navigate('/company/dashboard')}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 rounded-full transition-colors"
                        title="Cancel and return to dashboard"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 mb-6 overflow-x-auto">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)} type="button"
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                {t.id < tab ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit}>
                    <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

                        {/* ── TAB 0: Company Info ── */}
                        {tab === 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Company Name" required>
                                        <Input value={form.companyDisplayName} onChange={e => set('companyDisplayName', e.target.value)} placeholder="Google, TCS, Infosys..." />
                                    </Field>
                                    <Field label="Company Website">
                                        <Input value={form.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} placeholder="https://..." />
                                    </Field>
                                </div>
                                <Field label="Industry Type">
                                    <Input value={form.industryType} onChange={e => set('industryType', e.target.value)} placeholder="Software, Finance, Healthcare..." />
                                </Field>
                                <Field label="Company Description">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500">Brief description about the company, culture, products</span>
                                        <button type="button" onClick={handleGenerateCompanyDesc} disabled={generatingCompany}
                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50">
                                            <Sparkles className="w-3.5 h-3.5" />{generatingCompany ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <Textarea value={form.companyDescription} onChange={e => set('companyDescription', e.target.value)} placeholder="E.g. We are a fast-growing startup..." rows={4} />
                                </Field>
                            </div>
                        )}

                        {/* ── TAB 1: Job Details ── */}
                        {tab === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Job Title / Role" required>
                                        <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Software Engineer, Data Analyst..." />
                                    </Field>
                                    <Field label="Department">
                                        <Input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Engineering, Finance, HR..." />
                                    </Field>
                                    <Field label="Job Location" required>
                                        <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bangalore, Remote, Pune..." />
                                    </Field>
                                    <Field label="Employment Type">
                                        <Select value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                                            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </Select>
                                    </Field>
                                    <Field label="Work Mode">
                                        <Select value={form.workMode} onChange={e => set('workMode', e.target.value)}>
                                            {WORK_MODES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </Select>
                                    </Field>
                                    <Field label="Number of Vacancies">
                                        <Input type="number" value={form.vacancies} onChange={e => set('vacancies', e.target.value)} placeholder="1" />
                                    </Field>
                                    <Field label="Min Salary / CTC (INR)">
                                        <Input type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="500000" />
                                    </Field>
                                    <Field label="Max Salary / CTC (INR)">
                                        <Input type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="1200000" />
                                    </Field>
                                </div>
                                {form.employmentType === 'internship' && (
                                    <Field label="Stipend (INR/month)">
                                        <Input type="number" value={form.stipend} onChange={e => set('stipend', e.target.value)} placeholder="15000" />
                                    </Field>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Bond Duration">
                                        <Input value={form.bondDuration} onChange={e => set('bondDuration', e.target.value)} placeholder="1 year, 2 years, None..." />
                                    </Field>
                                    <Field label="Bond Conditions">
                                        <Input value={form.bondConditions} onChange={e => set('bondConditions', e.target.value)} placeholder="Penalty clause, training cost..." />
                                    </Field>
                                </div>
                                <Field label="Job Description / JD">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500">Detailed job responsibilities and requirements</span>
                                        <button type="button" onClick={handleGenerateDesc} disabled={generatingDesc}
                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50">
                                            <Sparkles className="w-3.5 h-3.5" />{generatingDesc ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe role, responsibilities, day-to-day work..." rows={6} />
                                </Field>
                            </div>
                        )}

                        {/* ── TAB 2: Eligibility ── */}
                        {tab === 2 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Eligibility Criteria</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Minimum CGPA">
                                        <Input type="number" value={form.minCGPA} onChange={e => set('minCGPA', e.target.value)} placeholder="7.0" />
                                    </Field>
                                    <Field label="Passing Year">
                                        <Input type="number" value={form.passingYear} onChange={e => set('passingYear', e.target.value)} placeholder="2025" />
                                    </Field>
                                </div>
                                <Field label="Eligible Branches / Departments">
                                    <p className="text-xs text-gray-400 mb-2">Select all applicable branches (leave empty for all)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {BRANCHES.map(b => (
                                            <button key={b} type="button" onClick={() => toggleBranch(b)}
                                                className={`px-3 py-1.5 rounded-xl border-2 text-sm transition-all ${form.branches.includes(b) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                                <Field label="Academic Requirements">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500">Specific academic or behavioral criteria</span>
                                        <button type="button" onClick={handleGenerateEligibility} disabled={generatingEligibility}
                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50">
                                            <Sparkles className="w-3.5 h-3.5" />{generatingEligibility ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <Textarea value={form.academicRequirements} onChange={e => set('academicRequirements', e.target.value)} placeholder="No active backlogs, 60% in 10th and 12th..." rows={3} />
                                </Field>
                            </div>
                        )}

                        {/* ── TAB 3: Skills ── */}
                        {tab === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Technologies</h2>
                                <Field label="Must Have Skills">
                                    <TagInput tags={form.mustHave} onAdd={v => addTag('mustHave', v)} onRemove={i => removeTag('mustHave', i)} placeholder="React, Python, SQL... (press Enter)" />
                                </Field>
                                <Field label="Good to Have Skills">
                                    <TagInput tags={form.goodToHave} onAdd={v => addTag('goodToHave', v)} onRemove={i => removeTag('goodToHave', i)} placeholder="Docker, AWS, GraphQL..." />
                                </Field>
                                <Field label="Technologies / Tools">
                                    <TagInput tags={form.technologies} onAdd={v => addTag('technologies', v)} onRemove={i => removeTag('technologies', i)} placeholder="VS Code, Jira, Git..." />
                                </Field>
                            </div>
                        )}

                        {/* ── TAB 4: Timeline ── */}
                        {tab === 4 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recruitment Timeline</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Application Deadline', field: 'applicationDeadline' },
                                        { label: 'Shortlisting Date', field: 'shortlistingDate' },
                                        { label: 'Online Exam Date', field: 'examDate' },
                                        { label: 'Interview Date', field: 'interviewDate' },
                                        { label: 'Final Selection Date', field: 'finalSelectionDate' },
                                    ].map(({ label, field }) => (
                                        <Field key={field} label={label}>
                                            <Input type="date" value={form[field]} onChange={e => set(field, e.target.value)} />
                                        </Field>
                                    ))}
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300 mt-2">
                                    Students will see these dates on the job listing and in their application tracker.
                                </div>
                            </div>
                        )}

                        {/* ── TAB 5: Pipeline ── */}
                        {tab === 5 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recruitment Pipeline</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            Define the hiring stages students will go through. AI will auto-generate letters for Offer, Joining, and Employment stages.
                                        </p>
                                    </div>
                                    {form.pipelineStages.length > 0 && (
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                            {form.pipelineStages.length} stages
                                        </span>
                                    )}
                                </div>

                                <PipelineBuilder
                                    stages={form.pipelineStages}
                                    onStagesChange={stages => set('pipelineStages', stages)}
                                />

                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    <p className="font-semibold mb-1">💡 Pipeline Tips</p>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li>Add <strong>Online Assessment</strong> to automatically link any exam you create for this job</li>
                                        <li>Add <strong>Offer Letter</strong> to enable AI-powered offer letter generation</li>
                                        <li>Add <strong>Document Verification</strong> to collect student documents</li>
                                        <li>Add <strong>Joining Letter</strong> and <strong>Letter of Employment</strong> for post-selection stages</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-5">
                        <button type="button" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-40 hover:border-blue-300 transition-all">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        {tab < 5 ? (
                            <button type="button" onClick={() => setTab(t => t + 1)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-semibold">
                                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</> : '🚀 Post Job'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
