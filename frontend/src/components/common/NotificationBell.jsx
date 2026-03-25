import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../../services/api';

const COLOR_CLASSES = {
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    gray:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const DOT_COLORS = {
    blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500',
    gray: 'bg-gray-400', orange: 'bg-orange-500', purple: 'bg-purple-500',
    amber: 'bg-amber-500', indigo: 'bg-indigo-500',
};

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

/**
 * role: 'student' | 'company' | 'admin'
 */
export default function NotificationBell({ role }) {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const ENDPOINT = {
        student: '/notifications/student',
        company: '/notifications/company',
        admin:   '/notifications/admin',
    }[role];

    const fetchNotifs = async () => {
        if (!ENDPOINT) return;
        setLoading(true);
        try {
            const { data } = await api.get(ENDPOINT);
            setNotifs(data.notifications || []);
            setUnread(data.unreadCount || 0);
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchNotifs();
        // Poll every 60 s
        const t = setInterval(fetchNotifs, 60_000);
        return () => clearInterval(t);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen(o => {
            if (!o) { // If opening, mark as read on backend
                api.post('/notifications/read').catch(() => {});
                setUnread(0);
            }
            return !o;
        });
    };

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-96 max-h-[500px] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchNotifs} className="text-xs text-blue-600 hover:underline">Refresh</button>
                            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Bell className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifs.map((n) => (
                                <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-default">
                                    <div className="flex items-start gap-3">
                                        {/* Color dot */}
                                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[n.color] || 'bg-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{n.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>

                                            {/* Meta extras */}
                                            {n.meta?.mode && (
                                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${COLOR_CLASSES[n.color] || COLOR_CLASSES.gray}`}>
                                                    {n.meta.mode}
                                                </span>
                                            )}
                                            {n.meta?.link && (
                                                <a href={n.meta.link} target="_blank" rel="noreferrer"
                                                    className="inline-block mt-1 text-[11px] text-blue-600 hover:underline">
                                                    Join Meeting →
                                                </a>
                                            )}
                                            {n.meta?.score != null && (
                                                <span className="inline-block mt-1 text-[11px] text-gray-400">
                                                    AI Match: <strong className="text-gray-700 dark:text-gray-300">{n.meta.score}%</strong>
                                                </span>
                                            )}

                                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.time)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
