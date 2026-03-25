import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Briefcase, Building, MessageSquare, Check, Linkedin, Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AlumniNetworkPage() {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState({ company: '', role: '' });
    const [connectModal, setConnectModal] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => { fetchAlumni(); }, []);

    const fetchAlumni = async (query = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(query).toString();
            const res = await api.get(`/student/alumni${params ? '?' + params : ''}`);
            setAlumni(res.data.data || []);
        } catch { toast.error('Failed to load alumni'); }
        finally { setLoading(false); }
    };

    const handleSearch = () => {
        const q = {};
        if (search.company) q.company = search.company;
        if (search.role) q.role = search.role;
        fetchAlumni(q);
    };

    const handleConnect = async () => {
        if (!connectModal) return;
        try {
            setSending(true);
            await api.post(`/student/alumni/${connectModal._id}/connect`, { message });
            toast.success('Connection request sent!');
            setConnectModal(null); setMessage('');
        } catch { toast.error('Failed to send request'); }
        finally { setSending(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
                        Alumni Network
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Connect with alumni for referrals and mock interviews</p>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input value={search.company} onChange={e => setSearch({...search, company: e.target.value})} placeholder="Search by company (Google, TCS...)" className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
                        <input value={search.role} onChange={e => setSearch({...search, role: e.target.value})} placeholder="Search by role (SDE, Data Analyst...)" className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
                        <button onClick={handleSearch} className="flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium">
                            <Search className="w-4 h-4" /> Search
                        </button>
                    </div>
                </div>

                {connectModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect with {connectModal.userId?.name}</h2>
                            <p className="text-gray-500 text-sm mb-4">{connectModal.currentRole} at {connectModal.currentCompany}</p>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Introduce yourself and explain why you want to connect..." className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none resize-none text-sm" />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => { setConnectModal(null); setMessage(''); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300">Cancel</button>
                                <button onClick={handleConnect} disabled={sending} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                    Send Request
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
                : alumni.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><Users className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No alumni found. Try a different search.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alumni.map((a, i) => (
                            <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                                        {a.userId?.name?.[0] || '?'}
                                    </div>
                                    {a.linkedin && (
                                        <a href={a.linkedin.startsWith('http') ? a.linkedin : `https://${a.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors">
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{a.userId?.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1"><Briefcase className="w-3.5 h-3.5" />{a.currentRole}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building className="w-3.5 h-3.5" />{a.currentCompany}</p>
                                <p className="text-xs text-gray-400 mt-1">Class of {a.graduationYear}</p>
                                {a.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{a.bio}</p>}
                                <div className="flex gap-2 mt-3">
                                    {a.canGiveReferral && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs flex items-center gap-1"><Check className="w-3 h-3" />Referral</span>}
                                    {a.canGiveMockInterview && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs flex items-center gap-1"><Star className="w-3 h-3" />Mock Interview</span>}
                                </div>
                                {a.expertise?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {a.expertise.slice(0, 3).map((e, ei) => <span key={ei} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{e}</span>)}
                                    </div>
                                )}
                                <button onClick={() => setConnectModal(a)} className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Connect
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
