import { useState, useEffect, useCallback } from 'react';
import { Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '' });
    const [togglingId, setTogglingId] = useState(null);

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/jobs', { params: filters });
            setJobs(data.data.jobs);
            setTotal(data.data.total);
            setPages(data.data.pages);
        } catch { toast.error('Failed to load jobs'); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const toggleJob = async (id) => {
        setTogglingId(id);
        try {
            const { data } = await api.put(`/admin/jobs/${id}/toggle`);
            setJobs(prev => prev.map(j => j._id === id ? { ...j, isActive: data.isActive } : j));
            toast.success(data.message);
        } catch { toast.error('Failed to toggle'); }
        finally { setTogglingId(null); }
    };

    const deleteJob = async (id) => {
        if (!confirm('Delete this job permanently?')) return;
        try { await api.delete(`/admin/jobs/${id}`); toast.success('Job deleted'); fetchJobs(); }
        catch { toast.error('Failed to delete'); }
    };

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));
    const inputCls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h1>
                <p className="text-gray-500 text-sm mt-0.5">{total} total jobs across all companies</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search job title or location..." className={inputCls + ' pl-9 w-full'} />
                </div>
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={inputCls}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['Job Title', 'Company', 'Type', 'Apps', 'Status', 'Posted', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {jobs.map(j => (
                                <tr key={j._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{j.title}</p>
                                        <p className="text-xs text-gray-400">{j.location}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{j.companyId?.companyName || j.companyDisplayName || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{j.employmentType || j.jobType || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{j.appCount ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${j.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            {j.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(j.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleJob(j._id)} disabled={togglingId === j._id} title={j.isActive ? 'Deactivate' : 'Activate'}
                                                className={`p-1.5 rounded-lg transition ${j.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                {togglingId === j._id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : j.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => deleteJob(j._id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Page {filters.page} of {pages}</span>
                    <div className="flex gap-2">
                        <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Prev</button>
                        <button disabled={filters.page >= pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
