import { useState, useEffect } from 'react';
import { Users, Briefcase, Building2, BarChart3, TrendingUp, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import api from '../../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {sub && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats')
            .then(r => setData(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    const o = data?.overview || {};

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time platform stats</p>
            </div>

            {/* Alert bar */}
            {(o.pendingDocs > 0 || o.pendingCompanies > 0 || o.openTickets > 0) && (
                <div className="flex flex-wrap gap-3">
                    {o.pendingDocs > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl text-yellow-700 dark:text-yellow-300 text-sm"><AlertTriangle className="w-4 h-4" />{o.pendingDocs} documents pending review</div>}
                    {o.pendingCompanies > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-300 text-sm"><Building2 className="w-4 h-4" />{o.pendingCompanies} companies awaiting verification</div>}
                    {o.openTickets > 0 && <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm"><AlertTriangle className="w-4 h-4" />{o.openTickets} open support tickets</div>}
                </div>
            )}

            {/* Main stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={o.totalUsers} sub={`+${o.todayReg} today`} icon={Users} color="bg-blue-600" />
                <StatCard label="Total Students" value={o.totalStudents} icon={Users} color="bg-indigo-600" />
                <StatCard label="Total Companies" value={o.totalCompanies} icon={Building2} color="bg-purple-600" />
                <StatCard label="Active Jobs" value={o.activeJobs} sub={`of ${o.totalJobs} total`} icon={Briefcase} color="bg-green-600" />
                <StatCard label="Total Applications" value={o.totalApplications} sub={`+${o.todayApps} today`} icon={FileText} color="bg-amber-500" />
                <StatCard label="Pending Docs" value={o.pendingDocs} icon={FileText} color="bg-orange-500" />
                <StatCard label="Pending Companies" value={o.pendingCompanies} icon={Building2} color="bg-red-500" />
                <StatCard label="Open Tickets" value={o.openTickets} icon={AlertTriangle} color="bg-pink-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* User Growth */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">User Growth — Last 30 Days</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data?.charts?.userGrowth || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* App Status Pie */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Applications by Status</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={data?.charts?.appStatus || []}
                                dataKey="count"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                outerRadius={75}
                                innerRadius={30}
                            >
                                {(data?.charts?.appStatus || []).map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend below — no overflow risk */}
                    <div className="mt-3 flex flex-col gap-1.5">
                        {(data?.charts?.appStatus || []).map((s, i) => {
                            const total = (data?.charts?.appStatus || []).reduce((acc, x) => acc + x.count, 0);
                            const pct = total ? Math.round((s.count / total) * 100) : 0;
                            return (
                                <div key={s._id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-gray-600 dark:text-gray-400 capitalize">{s._id}</span>
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{s.count} <span className="text-gray-400">({pct}%)</span></span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Placement Funnel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Placement Funnel</h3>
                <div className="flex items-end justify-around gap-3">
                    {(data?.funnel || []).map((f, i) => {
                        const max = data?.funnel?.[0]?.value || 1;
                        const pct = Math.round((f.value / max) * 100);
                        return (
                            <div key={f.stage} className="flex flex-col items-center gap-1 flex-1">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.value}</span>
                                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(pct, 4)}px`, maxHeight: 120, minHeight: 8, backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-xs text-gray-500 text-center">{f.stage}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Companies */}
            {data?.topCompanies?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Companies by Applications</h3>
                    <div className="space-y-3">
                        {data.topCompanies.map((c, i) => (
                            <div key={c._id} className="flex items-center gap-3">
                                <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{c.companyName || 'Unknown'}</span>
                                <span className="px-3 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">{c.count} apps</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
