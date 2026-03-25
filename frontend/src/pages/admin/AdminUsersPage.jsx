import { useState, useEffect, useCallback } from 'react';
import { Search, UserX, UserCheck, Trash2, CheckSquare, Square, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_BADGE = { student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', company: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [filters, setFilters] = useState({ page: 1, limit: 20, role: '', status: '', search: '' });
    const [bulkAction, setBulkAction] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/users', { params: filters });
            setUsers(data.data.users);
            setTotal(data.data.total);
            setPages(data.data.pages);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleDeactivate = async (id) => {
        try { await api.put(`/admin/users/${id}/deactivate`); toast.success('User deactivated'); fetchUsers(); }
        catch { toast.error('Failed'); }
    };
    const handleActivate = async (id) => {
        try { await api.put(`/admin/users/${id}/activate`); toast.success('User activated'); fetchUsers(); }
        catch { toast.error('Failed'); }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchUsers(); }
        catch { toast.error('Failed'); }
    };
    const runBulkAction = async () => {
        if (!bulkAction || selected.length === 0) return toast.error('Select users and an action');
        try {
            const { data } = await api.post('/admin/users/bulk-action', { userIds: selected, action: bulkAction });
            toast.success(data.message);
            setSelected([]); fetchUsers();
        } catch { toast.error('Bulk action failed'); }
    };

    const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(s => s.length === users.length ? [] : users.map(u => u._id));
    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

    const inputCls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{total} total users</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search email or name..." className={inputCls + ' pl-9 w-full'} />
                </div>
                <select value={filters.role} onChange={e => setFilter('role', e.target.value)} className={inputCls}>
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="company">Companies</option>
                    <option value="admin">Admins</option>
                </select>
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={inputCls}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {selected.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{selected.length} selected</span>
                        <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className={inputCls}>
                            <option value="">Bulk Action</option>
                            <option value="activate">Activate</option>
                            <option value="deactivate">Deactivate</option>
                        </select>
                        <button onClick={runBulkAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Apply</button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <button onClick={toggleAll}>{selected.length === users.length && users.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}</button>
                                </th>
                                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleSelect(u._id)}>{selected.includes(u._id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}</button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.displayName || u.email}</p>
                                        <p className="text-xs text-gray-400">{u.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ROLE_BADGE[u.role] || ''}`}>{u.role}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                            {u.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {u.isActive !== false ? (
                                                <button onClick={() => handleDeactivate(u._id)} title="Deactivate" className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100"><UserX className="w-4 h-4" /></button>
                                            ) : (
                                                <button onClick={() => handleActivate(u._id)} title="Activate" className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100"><UserCheck className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={() => handleDelete(u._id)} title="Delete" className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
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
