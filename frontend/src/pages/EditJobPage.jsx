import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Briefcase, GraduationCap, Code2, Calendar, ChevronRight, ChevronLeft, Check, Save, Sparkles, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = [
    { id: 0, label: 'Company Info', icon: Building2 },
    { id: 1, label: 'Job Details', icon: Briefcase },
    { id: 2, label: 'Eligibility', icon: GraduationCap },
    { id: 3, label: 'Skills', icon: Code2 },
    { id: 4, label: 'Timeline', icon: Calendar },
];

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'MBA', 'MCA'];
const EMPLOYMENT_TYPES = ['full-time', 'internship', 'contract', 'part-time'];
const WORK_MODES = ['on-site', 'remote', 'hybrid'];

const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const TagInput = ({ tags, onAdd, onRemove, placeholder }) => {
    const [input, setInput] = useState('');
    const add = () => { const t = input.trim(); if (t && !tags.includes(t)) { onAdd(t); setInput(''); } };
    return (
        <div>
            <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder} className={inputCls} />
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

const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

export default function EditJobPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [generatingDesc, setGeneratingDesc] = useState(false);
    const [generatingCompany, setGeneratingCompany] = useState(false);
    const [generatingEligibility, setGeneratingEligibility] = useState(false);

    const [form, setForm] = useState({
        companyDisplayName: '', companyWebsite: '', industryType: '', companyDescription: '',
        title: '', description: '', department: '', location: '',
        employmentType: 'full-time', workMode: 'on-site',
        salaryMin: '', salaryMax: '', stipend: '',
        bondDuration: '', bondConditions: '', vacancies: 1,
        minCGPA: '', branches: [], passingYear: '', academicRequirements: '',
        mustHave: [], goodToHave: [], technologies: [],
        applicationDeadline: '', shortlistingDate: '', examDate: '', interviewDate: '', finalSelectionDate: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/company/jobs/${id}`);
                const j = data.data || data;
                setForm({
                    companyDisplayName: j.companyDisplayName || '',
                    companyWebsite: j.companyWebsite || '',
                    industryType: j.industryType || '',
                    companyDescription: j.companyDescription || '',
                    title: j.title || '',
                    description: j.description || '',
                    department: j.department || '',
                    location: j.location || '',
                    employmentType: j.employmentType || 'full-time',
                    workMode: j.workMode || 'on-site',
                    salaryMin: j.salary?.min || '',
                    salaryMax: j.salary?.max || '',
                    stipend: j.stipend || '',
                    bondDuration: j.bond?.duration || '',
                    bondConditions: j.bond?.conditions || '',
                    vacancies: j.vacancies || 1,
                    minCGPA: j.eligibility?.minCGPA || '',
                    branches: j.eligibility?.branches || [],
                    passingYear: j.eligibility?.passingYear || '',
                    academicRequirements: j.eligibility?.academicRequirements || '',
                    mustHave: j.skills?.mustHave || [],
                    goodToHave: j.skills?.goodToHave || [],
                    technologies: j.skills?.technologies || [],
                    applicationDeadline: fmt(j.timeline?.applicationDeadline),
                    shortlistingDate: fmt(j.timeline?.shortlistingDate),
                    examDate: fmt(j.timeline?.examDate),
                    interviewDate: fmt(j.timeline?.interviewDate),
                    finalSelectionDate: fmt(j.timeline?.finalSelectionDate),
                });
            } catch { toast.error('Failed to load job'); navigate('/company/dashboard'); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

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
                companyDisplayName: form.companyDisplayName, companyWebsite: form.companyWebsite,
                industryType: form.industryType, companyDescription: form.companyDescription,
                title: form.title, description: form.description, department: form.department,
                location: form.location, employmentType: form.employmentType, workMode: form.workMode,
                salary: { min: Number(form.salaryMin) || 0, max: Number(form.salaryMax) || 0 },
                stipend: Number(form.stipend) || 0,
                bond: { duration: form.bondDuration, conditions: form.bondConditions },
                vacancies: Number(form.vacancies) || 1,
                eligibility: {
                    minCGPA: Number(form.minCGPA) || 0, branches: form.branches,
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
            };
            await api.put(`/company/jobs/${id}`, payload);
            toast.success('Job updated successfully!');
            navigate('/company/dashboard');
        } catch { toast.error('Failed to update job'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><Briefcase className="w-6 h-6 text-white" /></div>
                            Edit Job Posting
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Update the job details below</p>
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
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${tab === t.id ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                {t.id < tab ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit}>
                    <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

                        {tab === 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Company Name"><input value={form.companyDisplayName} onChange={e => set('companyDisplayName', e.target.value)} className={inputCls} placeholder="Google, TCS..." /></Field>
                                    <Field label="Company Website"><input value={form.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} className={inputCls} placeholder="https://..." /></Field>
                                </div>
                                <Field label="Industry Type"><input value={form.industryType} onChange={e => set('industryType', e.target.value)} className={inputCls} placeholder="Software, Finance..." /></Field>
                                <Field label="Company Description">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500">Brief description about the company, culture, products</span>
                                        <button type="button" onClick={handleGenerateCompanyDesc} disabled={generatingCompany}
                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50">
                                            <Sparkles className="w-3.5 h-3.5" />{generatingCompany ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <textarea value={form.companyDescription} onChange={e => set('companyDescription', e.target.value)} rows={4} className={inputCls + ' resize-none'} placeholder="Brief description..." />
                                </Field>
                            </div>
                        )}

                        {tab === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Job Title" required><input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} placeholder="Software Engineer..." /></Field>
                                    <Field label="Department"><input value={form.department} onChange={e => set('department', e.target.value)} className={inputCls} placeholder="Engineering..." /></Field>
                                    <Field label="Location" required><input value={form.location} onChange={e => set('location', e.target.value)} className={inputCls} placeholder="Bangalore, Remote..." /></Field>
                                    <Field label="Employment Type">
                                        <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)} className={inputCls}>
                                            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Work Mode">
                                        <select value={form.workMode} onChange={e => set('workMode', e.target.value)} className={inputCls}>
                                            {WORK_MODES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Vacancies"><input type="number" value={form.vacancies} onChange={e => set('vacancies', e.target.value)} className={inputCls} /></Field>
                                    <Field label="Min Salary (INR)"><input type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} className={inputCls} placeholder="500000" /></Field>
                                    <Field label="Max Salary (INR)"><input type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} className={inputCls} placeholder="1200000" /></Field>
                                </div>
                                {form.employmentType === 'internship' && (
                                    <Field label="Stipend (INR/month)"><input type="number" value={form.stipend} onChange={e => set('stipend', e.target.value)} className={inputCls} /></Field>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Bond Duration"><input value={form.bondDuration} onChange={e => set('bondDuration', e.target.value)} className={inputCls} placeholder="1 year, None..." /></Field>
                                    <Field label="Bond Conditions"><input value={form.bondConditions} onChange={e => set('bondConditions', e.target.value)} className={inputCls} placeholder="Conditions..." /></Field>
                                </div>
                                <Field label="Job Description">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-gray-500">Detailed job responsibilities and requirements</span>
                                        <button type="button" onClick={handleGenerateDesc} disabled={generatingDesc}
                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50">
                                            <Sparkles className="w-3.5 h-3.5" />{generatingDesc ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={6} className={inputCls + ' resize-none'} placeholder="Job responsibilities..." />
                                </Field>
                            </div>
                        )}

                        {tab === 2 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Eligibility Criteria</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Minimum CGPA"><input type="number" value={form.minCGPA} onChange={e => set('minCGPA', e.target.value)} className={inputCls} placeholder="7.0" /></Field>
                                    <Field label="Passing Year"><input type="number" value={form.passingYear} onChange={e => set('passingYear', e.target.value)} className={inputCls} placeholder="2025" /></Field>
                                </div>
                                <Field label="Eligible Branches">
                                    <p className="text-xs text-gray-400 mb-2">Select applicable (empty = all branches)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {BRANCHES.map(b => (
                                            <button key={b} type="button" onClick={() => toggleBranch(b)}
                                                className={`px-3 py-1.5 rounded-xl border-2 text-sm transition-all ${form.branches.includes(b) ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
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
                                    <textarea value={form.academicRequirements} onChange={e => set('academicRequirements', e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="No active backlogs, 60% in 10th..." />
                                </Field>
                            </div>
                        )}

                        {tab === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Technologies</h2>
                                <Field label="Must Have Skills"><TagInput tags={form.mustHave} onAdd={v => addTag('mustHave', v)} onRemove={i => removeTag('mustHave', i)} placeholder="React, Python... (press Enter)" /></Field>
                                <Field label="Good to Have Skills"><TagInput tags={form.goodToHave} onAdd={v => addTag('goodToHave', v)} onRemove={i => removeTag('goodToHave', i)} placeholder="Docker, AWS..." /></Field>
                                <Field label="Technologies / Tools"><TagInput tags={form.technologies} onAdd={v => addTag('technologies', v)} onRemove={i => removeTag('technologies', i)} placeholder="Git, Jira..." /></Field>
                            </div>
                        )}

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
                                            <input type="date" value={form[field]} onChange={e => set(field, e.target.value)} className={inputCls} />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <div className="flex justify-between mt-5">
                        <button type="button" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-40 transition-all">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        {tab < 4 ? (
                            <button type="button" onClick={() => setTab(t => t + 1)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium">
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-semibold">
                                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
