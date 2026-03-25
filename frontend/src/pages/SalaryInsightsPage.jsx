import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Trash2, Search, MapPin, Briefcase, BarChart3, Star, Building } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ROLES = ['Software Engineer', 'Data Analyst', 'Full Stack Developer', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer', 'Backend Developer', 'Frontend Developer', 'Machine Learning Engineer', 'Cybersecurity Analyst'];
const LEVELS = ['fresher', 'junior', 'mid', 'senior'];

const SalaryInsightsPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ role: '', location: 'India', experienceLevel: 'fresher' });

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/salary-insights');
            setHistory(res.data.data || []);
            if (res.data.data?.length > 0) setSelected(res.data.data[0]);
        } catch { toast.error('Failed to load insights'); }
        finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!form.role) return toast.error('Select a role');
        try {
            setGenerating(true);
            const res = await api.post('/student/salary-insights/generate', form);
            setHistory(prev => [res.data.data, ...prev]);
            setSelected(res.data.data);
            toast.success('Salary insights generated!');
        } catch { toast.error('Failed to generate insights'); }
        finally { setGenerating(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/student/salary-insights/${id}`);
            setHistory(prev => prev.filter(h => h._id !== id));
            if (selected?._id === id) setSelected(history.find(h => h._id !== id) || null);
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const demandColor = { High: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', Moderate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', Low: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
                        Salary Insights
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered salary data & negotiation tips for the Indian tech market</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none">
                                <option value="">Select Role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="City or India"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
                            <select value={form.experienceLevel} onChange={e => setForm({...form, experienceLevel: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none">
                                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleGenerate} disabled={generating}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                                {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Search className="w-4 h-4" /> Get Insights</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* History */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Search History</h2>
                        {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
                        : history.length === 0 ? <div className="text-center py-8 text-gray-400"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No searches yet</p></div>
                        : history.map(h => (
                            <motion.div key={h._id} onClick={() => setSelected(h)} whileHover={{ scale: 1.01 }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selected?._id === h._id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{h.role}</p>
                                        <p className="text-xs text-gray-400">{h.location} • {h.experienceLevel}</p>
                                        <p className="text-sm font-bold text-green-600 mt-1">{h.minSalary}–{h.maxSalary} LPA</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(h._id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Insight Detail */}
                    <div className="lg:col-span-2">
                        {!selected ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Search for Salary Insights</h3>
                                <p className="text-gray-500 dark:text-gray-400">Select a role above to see AI-powered salary data</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Salary Range Card */}
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold">{selected.role}</h2>
                                            <p className="text-green-100">{selected.location} • {selected.experienceLevel}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${demandColor[selected.marketDemand] || 'bg-white/20 text-white'}`}>{selected.marketDemand} Demand</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[['Min', selected.minSalary], ['Avg', selected.avgSalary], ['Max', selected.maxSalary]].map(([label, val]) => (
                                            <div key={label} className="bg-white/20 rounded-xl p-4 text-center">
                                                <p className="text-green-100 text-sm">{label}</p>
                                                <p className="text-2xl font-bold">{val} <span className="text-sm font-normal">LPA</span></p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Salary Bar */}
                                    <div className="mt-4">
                                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white rounded-full" style={{width: `${((selected.avgSalary - selected.minSalary) / (selected.maxSalary - selected.minSalary || 1)) * 100}%`}} />
                                        </div>
                                        <div className="flex justify-between text-xs text-green-100 mt-1">
                                            <span>{selected.minSalary} LPA</span><span>{selected.maxSalary} LPA</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Top Companies */}
                                    {selected.topCompanies?.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Building className="w-4 h-4 text-blue-500" /> Top Hiring Companies</h3>
                                            <div className="space-y-2">
                                                {selected.topCompanies.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Related Roles */}
                                    {selected.relatedRoles?.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-500" /> Related Roles</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selected.relatedRoles.map((r, i) => (
                                                    <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">{r}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Negotiation Tips */}
                                {selected.tips?.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Negotiation Tips</h3>
                                        <div className="space-y-2">
                                            {selected.tips.map((tip, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                                                    <span className="w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalaryInsightsPage;
