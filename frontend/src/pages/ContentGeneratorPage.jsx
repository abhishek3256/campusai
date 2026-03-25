import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Mail, Plus, Trash2, Copy, Star, StarOff, Edit2, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPES = ['linkedin', 'email_thankyou', 'email_followup', 'email_inquiry'];
const TYPE_LABELS = { linkedin: '💼 LinkedIn Post', email_thankyou: '📧 Thank You Email', email_followup: '📧 Follow-up Email', email_inquiry: '📧 Inquiry Email' };

export default function ContentGeneratorPage() {
    const [tab, setTab] = useState('linkedin');
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ companyName: '', jobTitle: '', interviewerName: '', sentiment: 'professional', type: 'email_thankyou' });

    useEffect(() => { fetchTemplates(); }, [tab]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/student/content?type=${tab}`);
            setTemplates(res.data.data || []);
            setSelected(null);
        } catch { toast.error('Failed to load templates'); } finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!form.companyName || !form.jobTitle) return toast.error('Company and job title are required');
        try {
            setGenerating(true);
            let res;
            if (tab === 'linkedin') {
                res = await api.post('/student/content/linkedin', { ...form });
            } else {
                res = await api.post('/student/content/email', { ...form, type: tab });
            }
            setTemplates(p => [res.data.data, ...p]);
            setSelected(res.data.data);
            setShowForm(false);
            toast.success('Content generated!');
        } catch { toast.error('Failed to generate'); } finally { setGenerating(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/student/content/${id}`);
            setTemplates(p => p.filter(t => t._id !== id));
            if (selected?._id === id) setSelected(null);
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const handleFavorite = async (t) => {
        try {
            const res = await api.put(`/student/content/${t._id}`, { isFavorite: !t.isFavorite });
            setTemplates(p => p.map(x => x._id === t._id ? res.data.data : x));
            if (selected?._id === t._id) setSelected(res.data.data);
        } catch { toast.error('Failed to update'); }
    };

    const saveEdit = async () => {
        try {
            const res = await api.put(`/student/content/${selected._id}`, { content: editContent });
            setSelected(res.data.data);
            setTemplates(p => p.map(x => x._id === selected._id ? res.data.data : x));
            setEditing(false);
            toast.success('Saved');
        } catch { toast.error('Failed to save'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Linkedin className="w-6 h-6 text-white" /></div>
                            Content Generator
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-crafted LinkedIn posts and professional email templates</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                        <Plus className="w-5 h-5" /> Generate
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {TYPES.map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                            {TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>

                {/* Generate Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Generate {TYPE_LABELS[tab]}</h2>
                            <div className="space-y-3">
                                {tab !== 'linkedin' && (
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Type</label>
                                        <select value={tab} onChange={e => setTab(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                                            {TYPES.filter(t => t !== 'linkedin').map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                                    <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="Google, TCS..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                                    <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} placeholder="Software Engineer..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                {tab !== 'linkedin' && (
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interviewer Name</label>
                                        <input value={form.interviewerName} onChange={e => setForm({...form, interviewerName: e.target.value})} placeholder="Ms. Sharma (optional)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                )}
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
                                    <select value={form.sentiment} onChange={e => setForm({...form, sentiment: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                                        <option value="professional">Professional</option>
                                        <option value="enthusiastic">Enthusiastic</option>
                                        <option value="formal">Formal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button onClick={handleGenerate} disabled={generating} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                                    {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : '✨ Generate'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Saved ({templates.length})</h2>
                        {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                        : templates.length === 0 ? <div className="text-center py-8 text-gray-400"><Mail className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No templates yet</p></div>
                        : templates.map(t => (
                            <motion.div key={t._id} onClick={() => { setSelected(t); setEditing(false); }} whileHover={{ scale: 1.01 }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selected?._id === t._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{t.title}</p>
                                        <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        <button onClick={e => { e.stopPropagation(); handleFavorite(t); }} className="p-1 rounded text-yellow-400">{t.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}</button>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(t._id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Detail */}
                    <div className="lg:col-span-2">
                        {!selected ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                <Mail className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Template</h3>
                                <p className="text-gray-500 dark:text-gray-400">Click a template or generate a new one</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-gray-900 dark:text-white">{selected.title}</h2>
                                        {selected.subject && <p className="text-sm text-gray-500 dark:text-gray-400">Subject: {selected.subject}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleCopy(selected.content)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </button>
                                        {!editing ? (
                                            <button onClick={() => { setEditing(true); setEditContent(selected.content); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                        ) : (
                                            <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                                                <Check className="w-3.5 h-3.5" /> Save
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {editing ? (
                                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={16} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" />
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 min-h-48">
                                            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-sm font-sans leading-relaxed">{selected.content}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
