import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
    user_created: 'bg-green-100 text-green-700',
    user_updated: 'bg-blue-100 text-blue-700',
    user_banned: 'bg-red-100 text-red-700',
    user_activated: 'bg-green-100 text-green-700',
    user_deleted: 'bg-red-100 text-red-700',
    job_deleted: 'bg-red-100 text-red-700',
    job_toggled: 'bg-blue-100 text-blue-700',
    company_verified: 'bg-green-100 text-green-700',
    company_rejected: 'bg-red-100 text-red-700',
    document_verified: 'bg-purple-100 text-purple-700',
    settings_updated: 'bg-amber-100 text-amber-700',
    bulk_operation: 'bg-indigo-100 text-indigo-700',
    report_generated: 'bg-gray-100 text-gray-700',
};

export default function AdminLogsPage() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, limit: 50, action: '', startDate: '', endDate: '' });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/activity-logs', { params: filters });
            setLogs(data.data.logs);
            setTotal(data.data.total);
        } catch { toast.error('Failed to load logs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [filters]);

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));
    const inputCls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none';

    const ALL_ACTIONS = Object.keys(ACTION_COLORS);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
                <p className="text-gray-500 text-sm mt-0.5">{total} total log entries (admin audit trail)</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3">
                <select value={filters.action} onChange={e => setFilter('action', e.target.value)} className={inputCls}>
                    <option value="">All Actions</option>
                    {ALL_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} className={inputCls} />
                <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} className={inputCls} />
                <button onClick={() => setFilters({ page: 1, limit: 50, action: '', startDate: '', endDate: '' })} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">Clear</button>
            </div>

            {/* Log list */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Activity className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No logs found</p></div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>{['Time', 'Admin', 'Action', 'Target', 'Details'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {logs.map(l => (
                                <tr key={l._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{l.adminName || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACTION_COLORS[l.action] || 'bg-gray-100 text-gray-600'}`}>
                                            {l.action?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{l.targetType || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">{l.details || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 justify-end">
                        <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Prev</button>
                        <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={logs.length < filters.limit} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
