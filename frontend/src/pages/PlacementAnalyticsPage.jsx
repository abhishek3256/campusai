import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Briefcase, Building, TrendingUp, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-10 ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-900/30')}`}>
                {icon}
            </div>
        </div>
    </div>
);

export default function PlacementAnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [companyHistory, setCompanyHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [statsRes, companyRes] = await Promise.all([
                api.get('/admin/analytics'),
                api.get('/admin/analytics/company-visits')
            ]);
            setStats(statsRes.data.data);
            setCompanyHistory(companyRes.data.data || []);
        } catch { toast.error('Failed to load analytics'); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        if (!stats) return;
        const data = JSON.stringify(stats, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'placement_analytics.json'; a.click();
        toast.success('Analytics exported!');
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><BarChart3 className="w-6 h-6 text-white" /></div>
                            Placement Analytics
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive placement and recruitment statistics</p>
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                        <Download className="w-5 h-5" /> Export
                    </button>
                </div>

                {stats && (
                    <>
                        {/* Top Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Total Students" value={stats.totalStudents} color="text-blue-600 dark:text-blue-400" />
                            <StatCard icon={<Briefcase className="w-6 h-6 text-green-600" />} label="Total Jobs" value={stats.totalJobs} color="text-green-600 dark:text-green-400" />
                            <StatCard icon={<Building className="w-6 h-6 text-purple-600" />} label="Companies" value={stats.totalCompanies} color="text-purple-600 dark:text-purple-400" />
                            <StatCard icon={<TrendingUp className="w-6 h-6 text-orange-600" />} label="Applications" value={stats.totalApplications} color="text-orange-600 dark:text-orange-400" />
                            <StatCard icon={<BarChart3 className="w-6 h-6 text-pink-600" />} label="Placement Rate" value={`${stats.placementRate}%`} color="text-pink-600 dark:text-pink-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Status Breakdown */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Application Status Breakdown</h2>
                                <div className="space-y-3">
                                    {stats.statusBreakdown?.map(s => (
                                        <div key={s._id} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{s._id || 'Unknown'}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (s.count / (stats.totalApplications || 1)) * 100)}%` }} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{s.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Trend */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Application Trend</h2>
                                {stats.monthlyTrend?.length > 0 ? (
                                    <div className="flex items-end gap-2 h-32">
                                        {stats.monthlyTrend.map((m, i) => {
                                            const maxVal = Math.max(...stats.monthlyTrend.map(x => x.count));
                                            const height = maxVal > 0 ? (m.count / maxVal) * 100 : 0;
                                            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <span className="text-xs text-gray-500">{m.count}</span>
                                                    <div className="w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${height}%`, minHeight: 4 }} />
                                                    <span className="text-xs text-gray-400">{monthNames[(m._id?.month || 1) - 1]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-gray-400 text-center py-8">No data available</p>}
                            </div>
                        </div>

                        {/* Top Jobs */}
                        {stats.topJobs?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Jobs by Applications</h2>
                                <div className="space-y-2">
                                    {stats.topJobs.map((j, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">{i+1}</span>
                                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{j.jobTitle || 'Unknown'}</span>
                                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(j.count / (stats.topJobs[0]?.count || 1)) * 100}%` }} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{j.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Company History */}
                        {companyHistory.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Company Recruitment History</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                            <th className="pb-2">Company</th><th className="pb-2">Jobs Posted</th><th className="pb-2">Total Hired</th>
                                        </tr></thead>
                                        <tbody>{companyHistory.map((c, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                                <td className="py-2 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                                <td className="py-2 text-gray-600 dark:text-gray-400">{c.jobsPosted}</td>
                                                <td className="py-2 text-green-600 dark:text-green-400 font-semibold">{c.totalHired}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
