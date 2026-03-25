import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Check, Clock, MapPin, Video, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };

export default function InterviewSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ applicationId: '', jobTitle: '', round: 'Round 1', mode: 'online', meetLink: '', venue: '', notes: '', slots: [{ date: '', startTime: '', endTime: '' }] });

    useEffect(() => { fetchSchedules(); }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/company/schedules');
            setSchedules(res.data.data || []);
        } catch { toast.error('Failed to load schedules'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!form.applicationId) return toast.error('Application ID is required');
        try {
            const validSlots = form.slots.filter(s => s.date && s.startTime && s.endTime);
            if (!validSlots.length) return toast.error('Add at least one time slot');
            const res = await api.post('/company/schedules', { ...form, slots: validSlots });
            setSchedules(p => [res.data.data, ...p]);
            setShowForm(false);
            toast.success('Interview scheduled!');
        } catch { toast.error('Failed to create schedule'); }
    };

    const handleCancel = async (id) => {
        try {
            await api.delete(`/company/schedules/${id}`);
            setSchedules(p => p.map(s => s._id === id ? { ...s, status: 'cancelled' } : s));
            toast.success('Interview cancelled');
        } catch { toast.error('Failed to cancel'); }
    };

    const addSlot = () => setForm(p => ({ ...p, slots: [...p.slots, { date: '', startTime: '', endTime: '' }] }));
    const updateSlot = (i, field, val) => setForm(p => ({ ...p, slots: p.slots.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div>
                            Interview Scheduling
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage candidate interviews</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                        <Plus className="w-5 h-5" /> Schedule Interview
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Schedule New Interview</h2>
                            <div className="space-y-3">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application ID *</label>
                                    <input value={form.applicationId} onChange={e => setForm({...form, applicationId: e.target.value})} placeholder="Paste application _id" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                                        <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} placeholder="Software Engineer" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Round</label>
                                        <input value={form.round} onChange={e => setForm({...form, round: e.target.value})} placeholder="Round 1" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                                    <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                                        <option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                {form.mode !== 'offline' && <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meet Link</label>
                                    <input value={form.meetLink} onChange={e => setForm({...form, meetLink: e.target.value})} placeholder="https://meet.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>}
                                {form.mode !== 'online' && <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                                    <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Office address..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Slots *</label>
                                        <button onClick={addSlot} className="text-sm text-blue-600 hover:underline">+ Add slot</button>
                                    </div>
                                    {form.slots.map((slot, i) => (
                                        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                                            <input type="date" value={slot.date} onChange={e => updateSlot(i, 'date', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                                            <input type="time" value={slot.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                                            <input type="time" value={slot.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                                        </div>
                                    ))}
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                    <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none resize-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">Schedule</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                : schedules.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No interviews scheduled yet</p></div>
                ) : (
                    <div className="space-y-4">
                        {schedules.map(s => (
                            <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{s.jobTitle || 'Interview'}</h3>
                                            <span className="text-sm text-gray-500">• {s.round}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            Student: {s.studentId?.userId?.name || 'N/A'} • {s.studentId?.userId?.email || ''}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            {s.mode === 'online' ? <span className="flex items-center gap-1"><Video className="w-4 h-4" /> Online</span> : <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.venue || 'Offline'}</span>}
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.slots?.length} slot{s.slots?.length !== 1 ? 's' : ''} offered</span>
                                        </div>
                                        {s.confirmedSlot && (
                                            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <Check className="w-4 h-4" /> Confirmed: {new Date(s.confirmedSlot.date).toLocaleDateString()} {s.confirmedSlot.startTime}–{s.confirmedSlot.endTime}
                                            </p>
                                        )}
                                    </div>
                                    {s.status === 'pending' || s.status === 'confirmed' ? (
                                        <button onClick={() => handleCancel(s._id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100">
                                            <Trash2 className="w-4 h-4" /> Cancel
                                        </button>
                                    ) : null}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
