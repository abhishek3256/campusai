import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Building2, FileText, BarChart3,
    Settings, Activity, MessageSquare, ChevronLeft, ChevronRight,
    Moon, Sun, Shield, LogOut
} from 'lucide-react';
import useThemeStore from '../store/themeStore';
import AdminOverview from './admin/AdminOverview';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminJobsPage from './admin/AdminJobsPage';
import AdminCompaniesPage from './admin/AdminCompaniesPage';
import AdminDocumentsPage from './admin/AdminDocumentsPage';
import AdminSystemPage from './admin/AdminSystemPage';
import AdminLogsPage from './admin/AdminLogsPage';
import AdminTicketsPage from './admin/AdminTicketsPage';
import AdminReportsPage from './admin/AdminReportsPage';
import NotificationBell from '../components/common/NotificationBell';

const NAV = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/documents', label: 'Documents', icon: FileText },
    { to: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
    { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 shrink-0`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">Admin Panel</span>
                        </div>
                    )}
                    {collapsed && <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto"><Shield className="w-5 h-5 text-white" /></div>}
                    <button onClick={() => setCollapsed(c => !c)} className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
                    {NAV.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`
                            }>
                            <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                    <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {!collapsed && <span>Theme</span>}
                    </button>
                    <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <LogOut className="w-4 h-4" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Campus AI — Admin</h2>
                    <NotificationBell role="admin" />
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                    <Routes>
                        <Route path="dashboard" element={<AdminOverview />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="jobs" element={<AdminJobsPage />} />
                        <Route path="companies" element={<AdminCompaniesPage />} />
                        <Route path="documents" element={<AdminDocumentsPage />} />
                        <Route path="tickets" element={<AdminTicketsPage />} />
                        <Route path="logs" element={<AdminLogsPage />} />
                        <Route path="reports" element={<AdminReportsPage />} />
                        <Route path="settings" element={<AdminSystemPage />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
