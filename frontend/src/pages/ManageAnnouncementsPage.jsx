import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, Edit2, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPES = ['drive', 'internship', 'info', 'urgent'];
const BRANCHES = ['CS', 'IT', 'EC', 'EE', 'ME', 'CE', 'All'];

export default function ManageAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: '', body: '', type: 'info', targetCGPA: 0, targetBranches: [], deadline: '' });

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try { setLoading(true); const res = await api.get('/admin/announcements'); setAnnouncements(res.data.data || []); }
        catch { toast.error('Failed to load'); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title || !form.body) return toast.error('Title and body required');
        try {
            if (editId) {
                const res = await api.put(`/admin/announcements/${editId}`, form);
                setAnnouncements(p => p.map(a => a._id === editId ? res.data.data : a));
                toast.success('Updated');
            } else {
                const res = await api.post('/admin/announcements', form);
                setAnnouncements(p => [res.data.data, ...p]);
                toast.success('Announcement created');
            }
            setShowForm(false); setEditId(null); setForm({ title: '', body: '', type: 'info', targetCGPA: 0, targetBranches: [], deadline: '' });
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/admin/announcements/${id}`); setAnnouncements(p => p.filter(a => a._id !== id)); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    const startEdit = (a) => { setForm({ title: a.title, body: a.body, type: a.type, targetCGPA: a.targetCGPA || 0, targetBranches: a.targetBranches || [], deadline: a.deadline ? new Date(a.deadline).toISOString().split('T')[0] : '' }); setEditId(a._id); setShowForm(true); };
    const toggleBranch = (b) => setForm(p => ({ ...p, targetBranches: p.targetBranches.includes(b) ? p.targetBranches.filter(x => x !== b) : [...p.targetBranches, b] }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-white" /></div>
                            Manage Announcements
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Post and manage campus announcements</p>
                    </div>
                    <button onClick={() => { setEditId(null); setForm({ title: '', body: '', type: 'info', targetCGPA: 0, targetBranches: [], deadline: '' }); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium">
                        <Plus className="w-5 h-5" /> New Announcement
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editId ? 'Edit' : 'Create'} Announcement</h2>
                            <div className="space-y-3">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body *</label>
                                    <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min CGPA</label>
                                        <input type="number" min={0} max={10} step={0.1} value={form.targetCGPA} onChange={e => setForm({...form, targetCGPA: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                                    </div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                                    <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Branches</label>
                                    <div className="flex flex-wrap gap-2">{BRANCHES.map(b => (
                                        <button key={b} onClick={() => toggleBranch(b)} className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${form.targetBranches.includes(b) ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>{b}</button>
                                    ))}</div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300">Cancel</button>
                                <button onClick={handleSave} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium">{editId ? 'Update' : 'Publish'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                : announcements.length === 0 ? <div className="text-center py-16 text-gray-400"><Bell className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No announcements yet</p></div>
                : (
                    <div className="space-y-4">
                        {announcements.map((a, i) => (
                            <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs capitalize">{a.type}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{a.body.substring(0, 150)}{a.body.length > 150 ? '...' : ''}</p>
                                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                            {a.deadline && <span>Deadline: {new Date(a.deadline).toLocaleDateString()}</span>}
                                            {a.targetCGPA > 0 && <span>Min CGPA: {a.targetCGPA}</span>}
                                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button onClick={() => startEdit(a)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(a._id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
