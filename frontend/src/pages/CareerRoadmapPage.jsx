import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Plus, Trash2, CheckCircle, Circle, Target, Code, Award, Briefcase, GraduationCap, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ROLES = ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Cloud Architect', 'Product Manager', 'Cybersecurity Analyst', 'Mobile Developer'];
const TIMEFRAMES = ['3 months', '6 months', '1 year', '2 years'];
const categoryIcon = { skill: Code, certification: Award, project: Briefcase, experience: Target, education: GraduationCap };
const colorClass = { skill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', certification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', project: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', experience: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', education: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };

export default function CareerRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ targetRole: '', timeframe: '6 months' });
    const [expanded, setExpanded] = useState({});

    useEffect(() => { fetchRoadmaps(); }, []);

    const fetchRoadmaps = async () => {
        try { setLoading(true); const res = await api.get('/student/roadmap'); setRoadmaps(res.data.data || []); if (res.data.data?.length > 0) setSelected(res.data.data[0]); }
        catch { toast.error('Failed to load roadmaps'); } finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!form.targetRole) return toast.error('Select a target role');
        try {
            setGenerating(true);
            const res = await api.post('/student/roadmap/generate', form);
            setRoadmaps(p => [res.data.data, ...p]); setSelected(res.data.data); setShowForm(false);
            toast.success('Roadmap generated!');
        } catch { toast.error('Failed to generate'); } finally { setGenerating(false); }
    };

    const toggleMilestone = async (idx) => {
        if (!selected) return;
        const updated = selected.milestones.map((m, i) => i === idx ? { ...m, isCompleted: !m.isCompleted } : m);
        try {
            const res = await api.put(`/student/roadmap/${selected._id}`, { milestones: updated });
            setSelected(res.data.data); setRoadmaps(p => p.map(r => r._id === selected._id ? res.data.data : r));
        } catch { toast.error('Failed to update'); }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/student/roadmap/${id}`); setRoadmaps(p => p.filter(r => r._id !== id)); if (selected?._id === id) setSelected(null); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center"><Map className="w-6 h-6 text-white" /></div>
                            Career Roadmap
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Personalized AI-powered path to your dream role</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
                        <Plus className="w-5 h-5" /> New Roadmap
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Generate Career Roadmap</h2>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Role *</label>
                                    <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="">Select Role</option>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe</label>
                                    <select value={form.timeframe} onChange={e => setForm({...form, timeframe: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                                        {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                <button onClick={handleGenerate} disabled={generating} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                                    {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : '✨ Generate'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">My Roadmaps ({roadmaps.length})</h2>
                        {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
                        : roadmaps.length === 0 ? <div className="text-center py-8 text-gray-400"><Map className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No roadmaps yet</p></div>
                        : roadmaps.map(r => (
                            <motion.div key={r._id} onClick={() => setSelected(r)} whileHover={{ scale: 1.01 }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selected?._id === r._id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{r.targetRole}</p>
                                        <p className="text-xs text-gray-400">{r.timeframe} • {r.milestones?.length || 0} milestones</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${r.progressPercent}%` }} />
                                            </div>
                                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{r.progressPercent}%</span>
                                        </div>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); handleDelete(r._id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="lg:col-span-2">
                        {!selected ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                <Map className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Roadmap</h3>
                                <p className="text-gray-500 dark:text-gray-400">Click a roadmap, or create a new one</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                                    <h2 className="text-2xl font-bold">{selected.targetRole}</h2>
                                    <p className="text-purple-100">{selected.timeframe} • {selected.progressPercent}% complete</p>
                                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full" style={{ width: `${selected.progressPercent}%` }} />
                                    </div>
                                    {selected.summary && <p className="mt-3 text-purple-100 text-sm">{selected.summary}</p>}
                                </div>
                                <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                                    {selected.milestones?.sort((a,b)=>a.order-b.order).map((m, idx) => {
                                        const Icon = categoryIcon[m.category] || Target;
                                        return (
                                            <div key={idx} className={`border rounded-xl overflow-hidden ${m.isCompleted ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                                                <div className="p-4 flex items-start gap-3">
                                                    <button onClick={() => toggleMilestone(idx)} className="mt-0.5 flex-shrink-0">
                                                        {m.isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-400 hover:text-purple-500" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass[m.category] || ''}`}>
                                                                <Icon className="w-3 h-3" />{m.category}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{m.estimatedDuration}</span>
                                                        </div>
                                                        <p className={`font-semibold ${m.isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{m.title}</p>
                                                        {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                                                    </div>
                                                    {m.resources?.length > 0 && (
                                                        <button onClick={() => setExpanded(p => ({...p, [idx]: !p[idx]}))} className="p-1 text-gray-400">
                                                            {expanded[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                                {expanded[idx] && m.resources?.length > 0 && (
                                                    <div className="px-4 pb-4 ml-8 border-t border-gray-100 dark:border-gray-700 pt-3">
                                                        {m.resources.map((res, ri) => (
                                                            <a key={ri} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-1">
                                                                <ExternalLink className="w-3 h-3" />{res.title} <span className="text-xs text-gray-400">({res.type})</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
