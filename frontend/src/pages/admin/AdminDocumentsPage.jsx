import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDocumentsPage() {
    const [docs, setDocs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [notes, setNotes] = useState({});
    const [page, setPage] = useState(1);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/documents/pending', { params: { page, limit: 15 } });
            setDocs(data.data.docs);
            setTotal(data.data.total);
        } catch { toast.error('Failed to load documents'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(); }, [page]);

    const decide = async (id, status) => {
        setProcessing(id + status);
        try {
            await api.put(`/admin/documents/${id}/verify`, { status, notes: notes[id] || '' });
            toast.success(`Document ${status}`);
            fetchDocs();
        } catch { toast.error('Failed'); }
        finally { setProcessing(null); }
    };

    const typeColor = { marksheet_10: 'bg-blue-100 text-blue-700', marksheet_12: 'bg-purple-100 text-purple-700', degree: 'bg-green-100 text-green-700', id_proof: 'bg-amber-100 text-amber-700' };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Verification</h1>
                <p className="text-gray-500 text-sm mt-0.5">{total} documents pending review</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : docs.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><FileText className="w-14 h-14 mx-auto mb-3 opacity-30" /><p>No pending documents 🎉</p></div>
            ) : (
                <div className="space-y-3">
                    {docs.map(doc => (
                        <div key={doc._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-start gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${typeColor[doc.documentType] || 'bg-gray-100 text-gray-600'}`}>{doc.documentType?.replace(/_/g, ' ') || 'Document'}</span>
                                        <span className="text-sm text-gray-500">from <strong>{doc.studentId?.name || 'Student'}</strong></span>
                                    </div>
                                    <p className="text-xs text-gray-400">Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN')}</p>
                                    {doc.documentUrl && (
                                        <a href={doc.documentUrl} target="_blank" rel="noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
                                            <ExternalLink className="w-3.5 h-3.5" /> View Document
                                        </a>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <input placeholder="Notes (optional)" value={notes[doc._id] || ''} onChange={e => setNotes(n => ({ ...n, [doc._id]: e.target.value }))}
                                        className="w-48 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                                    <div className="flex gap-2">
                                        <button onClick={() => decide(doc._id, 'verified')} disabled={!!processing}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-medium disabled:opacity-50">
                                            {processing === doc._id + 'verified' ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Verify
                                        </button>
                                        <button onClick={() => decide(doc._id, 'rejected')} disabled={!!processing}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-medium disabled:opacity-50">
                                            {processing === doc._id + 'rejected' ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Prev</button>
                <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
                <button disabled={docs.length < 15} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm disabled:opacity-40">Next</button>
            </div>
        </div>
    );
}
