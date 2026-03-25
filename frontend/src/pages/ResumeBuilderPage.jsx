import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Download, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STEPS = ['Personal', 'Education', 'Experience', 'Skills & Projects', 'Preview'];

const emptyResume = {
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
    education: [{ institution: '', degree: '', field: '', gpa: '', startYear: '', endYear: '' }],
    experience: [{ company: '', role: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
    skills: [],
    projects: [{ name: '', description: '', techStack: '', link: '', github: '' }],
    certifications: []
};

const Field = ({ label, value, onChange, placeholder, type = 'text', rows }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {rows ? (
            <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
        ) : (
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        )}
    </div>
);

export default function ResumeBuilderPage() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(emptyResume);
    const [resumes, setResumes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [aiContent, setAiContent] = useState(null);
    const [skillInput, setSkillInput] = useState('');
    const [templateName, setTemplateName] = useState('My Resume');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchResumes(); }, []);

    const fetchResumes = async () => {
        try { setLoading(true); const r = await api.get('/student/resume-builder'); setResumes(r.data.data || []); }
        catch { toast.error('Failed to load resumes'); } finally { setLoading(false); }
    };

    const setP = (field, val) => setForm(f => ({ ...f, personal: { ...f.personal, [field]: val } }));

    const updateEdu = (i, field, val) => setForm(f => ({ ...f, education: f.education.map((e, idx) => idx === i ? { ...e, [field]: val } : e) }));
    const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { institution: '', degree: '', field: '', gpa: '', startYear: '', endYear: '' }] }));
    const removeEdu = (i) => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));

    const updateExp = (i, field, val) => setForm(f => ({ ...f, experience: f.experience.map((e, idx) => idx === i ? { ...e, [field]: val } : e) }));
    const addExp = () => setForm(f => ({ ...f, experience: [...f.experience, { company: '', role: '', location: '', startDate: '', endDate: '', current: false, description: '' }] }));
    const removeExp = (i) => setForm(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));

    const addSkill = () => { if (skillInput.trim()) { setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] })); setSkillInput(''); } };
    const removeSkill = (i) => setForm(f => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));

    const updateProj = (i, field, val) => setForm(f => ({ ...f, projects: f.projects.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));
    const addProj = () => setForm(f => ({ ...f, projects: [...f.projects, { name: '', description: '', techStack: '', link: '', github: '' }] }));
    const removeProj = (i) => setForm(f => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) }));

    const handleGenerate = async () => {
        if (!form.personal.name) return toast.error('Please fill in your name first');
        try {
            setGenerating(true);
            const res = await api.post('/student/resume-builder/generate', { templateName, formData: form });
            setResumes(p => [res.data.data, ...p]);
            setAiContent(res.data.aiContent);
            setSelected(res.data.data);
            toast.success('Resume generated!');
        } catch { toast.error('Generation failed'); } finally { setGenerating(false); }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/student/resume-builder/${id}`); setResumes(p => p.filter(r => r._id !== id)); if (selected?._id === id) setSelected(null); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    const handleDownload = () => {
        const ai = selected?.generatedContent ? JSON.parse(selected.generatedContent) : {};
        const fd = selected?.formData || form;
        const lines = [
            `${fd.personal?.name || ''}`, `${fd.personal?.email || ''} | ${fd.personal?.phone || ''} | ${fd.personal?.location || ''}`,
            fd.personal?.linkedin ? `LinkedIn: ${fd.personal.linkedin}` : '',
            fd.personal?.github ? `GitHub: ${fd.personal.github}` : '',
            '', '--- SUMMARY ---', ai.summary || fd.personal?.summary || '',
            '', '--- EDUCATION ---',
            ...(fd.education || []).map(e => `${e.degree} in ${e.field} — ${e.institution} (${e.startYear}–${e.endYear})${e.gpa ? ' | GPA: ' + e.gpa : ''}`),
            '', '--- EXPERIENCE ---',
            ...(fd.experience || []).flatMap(e => {
                const bullets = (ai.experienceBullets || []).find(b => b.company === e.company)?.bullets || [e.description];
                return [`${e.role} at ${e.company} (${e.startDate}–${e.current ? 'Present' : e.endDate})`, ...bullets.map(b => `  • ${b}`)];
            }),
            '', '--- SKILLS ---', (fd.skills || []).join(', '),
            '', '--- PROJECTS ---',
            ...(fd.projects || []).flatMap(p => [`${p.name} (${p.techStack})`, `  ${(ai.projectHighlights || []).find(h => h.name === p.name)?.highlight || p.description}`, p.link ? `  Link: ${p.link}` : ''])
        ].filter(Boolean).join('\n');

        const blob = new Blob([lines], { type: 'text/plain' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${(selected?.templateName || 'resume')}.txt`; a.click();
        toast.success('Downloaded as text file (import into Word for PDF)');
    };

    const loadResume = (r) => { setSelected(r); setForm(r.formData || emptyResume); setTemplateName(r.templateName); setAiContent(r.generatedContent ? JSON.parse(r.generatedContent) : null); setStep(4); };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
                            AI Resume Builder
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Build an ATS-optimized resume with AI assistance</p>
                    </div>
                    <button onClick={() => { setForm(emptyResume); setSelected(null); setAiContent(null); setStep(0); setTemplateName('My Resume'); }} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-sm">
                        <Plus className="w-4 h-4" /> New Resume
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Saved list */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Saved ({resumes.length})</h2>
                        {loading ? <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
                        : resumes.map(r => (
                            <div key={r._id} onClick={() => loadResume(r)} className={`p-3 rounded-xl border cursor-pointer mb-2 transition-all ${selected?._id === r._id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-300'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{r.templateName}</p>
                                        <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); handleDelete(r._id); }} className="p-1 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Builder */}
                    <div className="lg:col-span-3">
                        {/* Progress Steps */}
                        <div className="flex items-center gap-2 mb-6">
                            {STEPS.map((s, i) => (
                                <div key={s} className="flex items-center gap-1">
                                    <button onClick={() => setStep(i)} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${step === i ? 'bg-rose-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                        {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                    </button>
                                    <span className={`text-xs hidden sm:inline ${step === i ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                                    {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-300 dark:bg-gray-600 mx-1" />}
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            {/* Step 0: Personal */}
                            {step === 0 && (
                                <div className="space-y-3">
                                    <div className="flex gap-3 mb-2">
                                        <Field label="Template Name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="My Resume v1" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Full Name *" value={form.personal.name} onChange={e => setP('name', e.target.value)} placeholder="Rahul Sharma" />
                                        <Field label="Email" value={form.personal.email} onChange={e => setP('email', e.target.value)} placeholder="rahul@gmail.com" />
                                        <Field label="Phone" value={form.personal.phone} onChange={e => setP('phone', e.target.value)} placeholder="+91 9876543210" />
                                        <Field label="Location" value={form.personal.location} onChange={e => setP('location', e.target.value)} placeholder="Pune, India" />
                                        <Field label="LinkedIn" value={form.personal.linkedin} onChange={e => setP('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
                                        <Field label="GitHub" value={form.personal.github} onChange={e => setP('github', e.target.value)} placeholder="github.com/..." />
                                    </div>
                                    <Field label="Summary / Objective (AI will enhance this)" value={form.personal.summary} onChange={e => setP('summary', e.target.value)} placeholder="Brief professional summary..." rows={3} />
                                </div>
                            )}

                            {/* Step 1: Education */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    {form.education.map((edu, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative">
                                            {form.education.length > 1 && <button onClick={() => removeEdu(i)} className="absolute top-3 right-3 text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Institution" value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} placeholder="IIT Bombay" />
                                                <Field label="Degree" value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="B.Tech" />
                                                <Field label="Field of Study" value={edu.field} onChange={e => updateEdu(i, 'field', e.target.value)} placeholder="Computer Science" />
                                                <Field label="CGPA/%" value={edu.gpa} onChange={e => updateEdu(i, 'gpa', e.target.value)} placeholder="8.5 / 10" />
                                                <Field label="Start Year" value={edu.startYear} onChange={e => updateEdu(i, 'startYear', e.target.value)} placeholder="2020" />
                                                <Field label="End Year" value={edu.endYear} onChange={e => updateEdu(i, 'endYear', e.target.value)} placeholder="2024" />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addEdu} className="flex items-center gap-1 text-sm text-rose-600 hover:underline"><Plus className="w-4 h-4" /> Add Education</button>
                                </div>
                            )}

                            {/* Step 2: Experience */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    {form.experience.map((exp, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative">
                                            {form.experience.length > 1 && <button onClick={() => removeExp(i)} className="absolute top-3 right-3 text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <Field label="Company" value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Google" />
                                                <Field label="Role" value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)} placeholder="Software Engineer Intern" />
                                                <Field label="Location" value={exp.location} onChange={e => updateExp(i, 'location', e.target.value)} placeholder="Bangalore" />
                                                <div />
                                                <Field label="Start Date" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} placeholder="Jun 2023" />
                                                <Field label="End Date" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} placeholder="Aug 2023" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input type="checkbox" checked={exp.current} onChange={e => updateExp(i, 'current', e.target.checked)} className="w-4 h-4 accent-rose-600" id={`current-${i}`} />
                                                <label htmlFor={`current-${i}`} className="text-sm text-gray-700 dark:text-gray-300">Currently working here</label>
                                            </div>
                                            <Field label="Description (AI will convert to bullet points)" value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)} placeholder="Describe your work, achievements, technologies used..." rows={3} />
                                        </div>
                                    ))}
                                    <button onClick={addExp} className="flex items-center gap-1 text-sm text-rose-600 hover:underline"><Plus className="w-4 h-4" /> Add Experience</button>
                                </div>
                            )}

                            {/* Step 3: Skills & Projects */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
                                        <div className="flex gap-2 mb-2">
                                            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Type a skill and press Enter or Add" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
                                            <button onClick={addSkill} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {form.skills.map((s, i) => (
                                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-sm">
                                                    {s}<button onClick={() => removeSkill(i)} className="ml-1 text-rose-400 hover:text-rose-600">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Projects</h3>
                                        {form.projects.map((proj, i) => (
                                            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-3 relative">
                                                {form.projects.length > 1 && <button onClick={() => removeProj(i)} className="absolute top-3 right-3 text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field label="Project Name" value={proj.name} onChange={e => updateProj(i, 'name', e.target.value)} placeholder="E-Commerce App" />
                                                    <Field label="Tech Stack" value={proj.techStack} onChange={e => updateProj(i, 'techStack', e.target.value)} placeholder="React, Node.js, MongoDB" />
                                                    <Field label="Live Link" value={proj.link} onChange={e => updateProj(i, 'link', e.target.value)} placeholder="https://..." />
                                                    <Field label="GitHub" value={proj.github} onChange={e => updateProj(i, 'github', e.target.value)} placeholder="github.com/..." />
                                                </div>
                                                <div className="mt-2"><Field label="Description" value={proj.description} onChange={e => updateProj(i, 'description', e.target.value)} placeholder="What it does and its impact..." rows={2} /></div>
                                            </div>
                                        ))}
                                        <button onClick={addProj} className="flex items-center gap-1 text-sm text-rose-600 hover:underline"><Plus className="w-4 h-4" /> Add Project</button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Preview */}
                            {step === 4 && (
                                <div>
                                    {aiContent ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> AI-Enhanced Resume Preview</h2>
                                                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium"><Download className="w-4 h-4" /> Download</button>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 text-sm font-mono space-y-4">
                                                <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-3">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{form.personal.name}</p>
                                                    <p className="text-gray-500">{form.personal.email} | {form.personal.phone} | {form.personal.location}</p>
                                                </div>
                                                {aiContent.summary && <div><p className="font-semibold text-rose-600 dark:text-rose-400 uppercase text-xs tracking-widest mb-1">Summary</p><p className="text-gray-700 dark:text-gray-300">{aiContent.summary}</p></div>}
                                                {form.education?.length > 0 && <div><p className="font-semibold text-rose-600 dark:text-rose-400 uppercase text-xs tracking-widest mb-1">Education</p>{form.education.map((e, i) => <div key={i} className="text-gray-700 dark:text-gray-300"><span className="font-medium">{e.degree} in {e.field}</span> — {e.institution} ({e.startYear}–{e.endYear}){e.gpa && ` | CGPA: ${e.gpa}`}</div>)}</div>}
                                                {aiContent.experienceBullets?.length > 0 && <div><p className="font-semibold text-rose-600 dark:text-rose-400 uppercase text-xs tracking-widest mb-1">Experience</p>{aiContent.experienceBullets.map((exp, i) => <div key={i} className="mb-2"><p className="font-medium text-gray-900 dark:text-white">{exp.role} at {exp.company}</p>{exp.bullets?.map((b, j) => <p key={j} className="text-gray-600 dark:text-gray-400">• {b}</p>)}</div>)}</div>}
                                                {form.skills?.length > 0 && <div><p className="font-semibold text-rose-600 dark:text-rose-400 uppercase text-xs tracking-widest mb-1">Skills</p><p className="text-gray-700 dark:text-gray-300">{form.skills.join(', ')}</p></div>}
                                                {aiContent.projectHighlights?.length > 0 && <div><p className="font-semibold text-rose-600 dark:text-rose-400 uppercase text-xs tracking-widest mb-1">Projects</p>{aiContent.projectHighlights.map((p, i) => <div key={i} className="mb-1"><span className="font-medium text-gray-900 dark:text-white">{p.name}</span> — <span className="text-gray-600 dark:text-gray-400">{p.highlight}</span></div>)}</div>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Sparkles className="w-12 h-12 mx-auto text-rose-400 mb-3" />
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">Ready to generate your AI-enhanced resume!</p>
                                            <button onClick={handleGenerate} disabled={generating} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto">
                                                {generating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate with AI</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button onClick={() => setStep(p => Math.max(0, p - 1))} disabled={step === 0} className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-40 hover:border-rose-300 transition-colors">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                {step < 3 ? (
                                    <button onClick={() => setStep(p => p + 1)} className="flex items-center gap-1 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : step === 3 ? (
                                    <button onClick={() => setStep(4)} className="flex items-center gap-1 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium">
                                        Preview <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    !aiContent && <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-medium">
                                        {generating ? 'Generating...' : <><Sparkles className="w-4 h-4" /> Generate</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
