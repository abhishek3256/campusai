import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { LogOut, User, LayoutDashboard, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        localStorage.removeItem('token');
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        if (user.role === 'student') return '/student/dashboard';
        if (user.role === 'company') return '/company/dashboard';
        if (user.role === 'admin') return '/admin/dashboard';
        return '/';
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            <span className="text-2xl font-bold text-primary">Campus AI</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                        </button>
                        {isAuthenticated ? (
                            <>
                                <Link to={getDashboardLink()} className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center space-x-1">
                                    <LayoutDashboard className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </Link>
                                {user?.role === 'student' && (
                                    <Link to="/student/career-hub" className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary flex items-center space-x-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                        <span>Career AI</span>
                                    </Link>
                                )}
                                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                                    {(user?.avatar || user?.logo) ? (
                                        <img
                                            src={user.avatar || user.logo}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full border-2 border-primary object-cover"
                                            onError={(e) => {
                                                console.error('Avatar failed to load:', e.target.src);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                    <span className="font-medium">{user?.name || user?.companyName || user?.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center space-x-1 transition-colors duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 dark:text-gray-200 hover:text-primary font-medium transition-colors duration-200">Login</Link>
                                <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
