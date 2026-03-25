import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Search, FileCheck, Rocket } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Home = () => {
    const { isAuthenticated, user } = useAuthStore();

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'student') return '/student/dashboard';
        if (user.role === 'company') return '/company/dashboard';
        if (user.role === 'admin') return '/admin/dashboard';
        return '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                            AI-Powered <span className="text-primary">Campus Placements</span>
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300">
                            Connect students with top companies using intelligent resume parsing, skill matching, and automated career guidance.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            {isAuthenticated ? (
                                <Link to={getDashboardLink()} className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition shadow-lg hover:shadow-primary/30">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition">
                                        Get Started
                                    </Link>
                                    <Link to="/login" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                        Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <FeatureCard
                        icon={<Brain className="w-8 h-8 text-purple-500" />}
                        title="AI Resume Parsing"
                        desc="Automatically extract skills and experience from resumes."
                    />
                    <FeatureCard
                        icon={<Search className="w-8 h-8 text-blue-500" />}
                        title="Smart Job Matching"
                        desc="AI algorithms match students to the perfect job opportunities."
                    />
                    <FeatureCard
                        icon={<FileCheck className="w-8 h-8 text-green-500" />}
                        title="Document Verification"
                        desc="Automated verification of marksheets and certificates."
                    />
                    <FeatureCard
                        icon={<Rocket className="w-8 h-8 text-red-500" />}
                        title="Career Growth"
                        desc="Personalized upskilling paths and career guidance."
                    />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200"
    >
        <div className="bg-gray-50 dark:bg-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{desc}</p>
    </motion.div>
);

export default Home;
