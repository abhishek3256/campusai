import { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIORITY_COLOR = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const STATUS_COLOR = { open: 'bg-yellow-100 text-yellow-700', 'in-progress': 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' };

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', priority: '' });
    const [expanded, setExpanded] = useState(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/tickets', { params: filters });
            setTickets(data.data.tickets);
            setTotal(data.data.total);
        } catch { toast.error('Failed to load tickets'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, [filters]);

    const sendReply = async (ticketId) => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            const { data } = await api.post(`/admin/tickets/${ticketId}/reply`, { message: reply });
            setTickets(prev => prev.map(t => t._id === ticketId ? data.data : t));
            setReply('');
            toast.success('Reply sent');
        } catch { toast.error('Failed to send reply'); }
        finally { setSending(false); }
    };

    const changeStatus = async (ticketId, status) => {
        try {
            await api.put(`/admin/tickets/${ticketId}/status`, { status });
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status } : t));
            toast.success(`Ticket marked ${status}`);
        } catch { toast.error('Failed to update status'); }
    };

    const inputCls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none';

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                <p className="text-gray-500 text-sm mt-0.5">{total} tickets</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3 flex-wrap">
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className={inputCls}>
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))} className={inputCls}>
                    <option value="">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Ticket List */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-30" /><p>No tickets found</p></div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(t => (
                        <div key={t._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Ticket Header */}
                            <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(expanded === t._id ? null : t._id)}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-mono text-xs text-gray-400">{t.ticketNumber}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[t.status] || ''}`}>{t.status}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLOR[t.priority] || ''}`}>{t.priority}</span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{t.category}</span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{t.subject}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{t.userId?.email || 'Anonymous'} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {t.status !== 'resolved' && (
                                        <button onClick={e => { e.stopPropagation(); changeStatus(t._id, 'resolved'); }}
                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                                        </button>
                                    )}
                                    {t.status !== 'closed' && (
                                        <button onClick={e => { e.stopPropagation(); changeStatus(t._id, 'closed'); }}
                                            className="px-3 py-1 bg-gray-500 text-white rounded-lg text-xs font-medium">Close</button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded: messages + reply */}
                            {expanded === t._id && (
                                <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/30">
                                    {(t.messages || []).map((m, i) => (
                                        <div key={i} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-sm px-4 py-2 rounded-xl text-sm ${m.senderType === 'admin' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'}`}>
                                                <p className="text-xs opacity-60 mb-0.5">{m.senderName}</p>
                                                <p>{m.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2">
                                        <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply(t._id)}
                                            placeholder="Type a reply..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                                        <button onClick={() => sendReply(t._id)} disabled={sending}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
