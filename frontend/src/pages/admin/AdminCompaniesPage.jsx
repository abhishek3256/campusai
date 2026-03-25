import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Building2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending | verified | all
    const [notes, setNotes] = useState({});
    const [processing, setProcessing] = useState(null);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/companies', { params: { status: filter === 'all' ? '' : filter } });
            setCompanies(data.data);
        } catch { toast.error('Failed to load companies'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCompanies(); }, [filter]);

    const decide = async (id, decision) => {
        setProcessing(id + decision);
        try {
            await api.put(`/admin/companies/${id}/verify`, { decision, notes: notes[id] || '' });
            toast.success(`Company ${decision === 'approve' ? 'approved ✅' : 'rejected ❌'}`);
            fetchCompanies();
        } catch { toast.error('Failed'); }
        finally { setProcessing(null); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Verification</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{companies.length} companies</p>
                </div>
                <div className="flex gap-2">
                    {['pending', 'verified', 'all'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>{f}</button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : companies.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Building2 className="w-14 h-14 mx-auto mb-3 opacity-30" /><p>No companies found.</p></div>
            ) : (
                <div className="space-y-3">
                    {companies.map(c => (
                        <div key={c._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{c.companyName}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                            {c.isVerified ? '✓ Verified' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{c.userId?.email} · Registered {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                                    {c.website && <p className="text-sm text-blue-600 mt-1">{c.website}</p>}
                                    {c.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                                </div>
                                {!c.isVerified && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <input
                                            placeholder="Rejection reason (optional)"
                                            value={notes[c._id] || ''}
                                            onChange={e => setNotes(n => ({ ...n, [c._id]: e.target.value }))}
                                            className="w-56 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => decide(c._id, 'approve')} disabled={!!processing}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium disabled:opacity-50">
                                                {processing === c._id + 'approve' ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                                            </button>
                                            <button onClick={() => decide(c._id, 'reject')} disabled={!!processing}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium disabled:opacity-50">
                                                {processing === c._id + 'reject' ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
