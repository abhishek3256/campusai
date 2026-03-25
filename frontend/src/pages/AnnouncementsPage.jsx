import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Megaphone, Briefcase, Info, AlertTriangle, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
    drive: { icon: Briefcase, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', label: 'Campus Drive' },
    internship: { icon: Megaphone, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', label: 'Internship' },
    info: { icon: Info, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', label: 'Information' },
    urgent: { icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-red-200 dark:border-red-800', label: 'Urgent' }
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/announcements');
            setAnnouncements(res.data.data || []);
        } catch { toast.error('Failed to load announcements'); }
        finally { setLoading(false); }
    };

    const filtered = filter === 'all' ? announcements : announcements.filter(a => a.type === filter);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-white" /></div>
                        Announcements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Campus drives, internships, and important notices</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['all', 'drive', 'internship', 'urgent', 'info'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label || f}
                        </button>
                    ))}
                </div>

                {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><Bell className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No announcements yet</p></div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((a, i) => {
                            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
                            const Icon = cfg.icon;
                            return (
                                <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${cfg.border} p-5`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{a.body}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                {a.deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Deadline: {new Date(a.deadline).toLocaleDateString()}</span>}
                                                {a.targetCGPA > 0 && <span>Min CGPA: {a.targetCGPA}</span>}
                                                {a.targetBranches?.length > 0 && <span>Branches: {a.targetBranches.join(', ')}</span>}
                                                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
