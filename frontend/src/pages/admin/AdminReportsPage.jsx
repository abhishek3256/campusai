import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
    { value: 'analytics', label: 'Platform Analytics Summary' },
    { value: 'users', label: 'All Users List' },
    { value: 'jobs', label: 'All Jobs List' },
    { value: 'applications', label: 'All Applications List' },
];

export default function AdminReportsPage() {
    const [form, setForm] = useState({ reportType: 'analytics', startDate: '', endDate: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const { data } = await api.post('/admin/reports', form);
            setResult(data);
            toast.success('Report generated!');
        } catch { toast.error('Failed to generate report'); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!result) return;
        const items = Array.isArray(result.data) ? result.data : Object.entries(result.data).map(([k, v]) => ({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : v }));
        if (items.length === 0) return toast.error('No data to export');
        const keys = Object.keys(items[0]);
        const rows = [keys.join(','), ...items.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${result.reportType}_report.csv`; a.click();
        toast.success('CSV downloaded');
    };

    const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-5 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Export</h1>
                <p className="text-gray-500 text-sm mt-0.5">Generate platform reports with custom date ranges</p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Configure Report</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Report Type</label>
                        <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))} className={inputCls}>
                            {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Start Date</label>
                        <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">End Date</label>
                        <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={generate} disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
                        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><BarChart3 className="w-4 h-4" /> Generate Report</>}
                    </button>
                    {result && (
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{result.reportType} Report</h3>
                        <span className="text-xs text-gray-400">Generated {new Date(result.generatedAt).toLocaleString('en-IN')}</span>
                    </div>

                    {result.reportType === 'analytics' ? (
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(result.data).map(([k, v]) => (
                                typeof v !== 'object' ? (
                                    <div key={k} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{String(v)}</p>
                                        <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                                    </div>
                                ) : null
                            ))}
                            {result.data.appsByStatus && (
                                <div className="col-span-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Applications by Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.data.appsByStatus.map(s => (
                                            <span key={s._id} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                                                <strong>{s._id}</strong>: {s.count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-500 mb-3">{Array.isArray(result.data) ? result.data.length : 0} records</p>
                            <div className="max-h-80 overflow-auto border border-gray-200 dark:border-gray-600 rounded-xl">
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {(Array.isArray(result.data) ? result.data.slice(0, 50) : []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                {Object.entries(row).filter(([k]) => ['email', 'role', 'title', 'status', 'createdAt', 'isActive'].includes(k)).map(([k, v]) => (
                                                    <td key={k} className="px-3 py-2 text-gray-700 dark:text-gray-300">{String(v).substring(0, 40)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
