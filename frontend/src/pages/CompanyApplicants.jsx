import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Search, Filter, User, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import ApplicantDetailModal from '../components/company/ApplicantDetailModal';

const CompanyApplicants = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedApplicantId, setSelectedApplicantId] = useState(null);

    useEffect(() => {
        fetchApplicants();
    }, [jobId]);

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/company/applicants/${jobId}`);
            setApplicants(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = () => {
        fetchApplicants(); // Refresh list after status change
    };

    const filteredApplicants = applicants.filter(app => {
        const matchesFilter = filter === 'all' || app.status === filter;
        const matchesSearch = (app.studentId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (app.studentId?.email || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (app) => {
        const displayLabel = app.currentStage ? app.currentStage.replace(/_/g, ' ').toUpperCase() : (app.status || 'PENDING').toUpperCase();
        
        if (['JOINED', 'JOINING LETTER ISSUED', 'DOCUMENTS VERIFIED', 'OFFER ACCEPTED', 'ACCEPTED'].includes(displayLabel) || app.status === 'joined' || app.status === 'accepted') {
            return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-[10px] font-bold tracking-wider flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> {displayLabel}</span>;
        } else if (['REJECTED', 'VERIFICATION FAILED'].includes(displayLabel) || app.status === 'rejected') {
            return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-[10px] font-bold tracking-wider flex items-center w-fit"><AlertCircle className="w-3 h-3 mr-1" /> {displayLabel}</span>;
        } else if (app.currentStage && app.currentStage !== 'applied') {
            return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-[10px] font-bold tracking-wider flex items-center w-fit"><User className="w-3 h-3 mr-1" /> {displayLabel}</span>;
        } else if (['UNDER-REVIEW', 'SHORTLISTED', 'TECHNICAL-INTERVIEW', 'HR-INTERVIEW', 'OFFERED', 'DOCUMENTS-SUBMITTED'].includes(app.status?.toUpperCase())) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-[10px] font-bold tracking-wider flex items-center w-fit"><User className="w-3 h-3 mr-1" /> {displayLabel}</span>;
        } else {
            return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-[10px] font-bold tracking-wider flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> PENDING</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => navigate('/company/dashboard')} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Applicants</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Reviewing candidates for Job ID: {jobId}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search applicants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 hidden md:block" />
                    {['all', 'pending', 'under-review', 'shortlisted', 'technical-interview', 'hr-interview', 'offered', 'documents-submitted', 'joined'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applicants List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            ) : filteredApplicants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApplicants.map(app => (
                        <div
                            key={app._id}
                            onClick={() => setSelectedApplicantId(app._id)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                                        {app.studentId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{app.studentId?.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{app.studentId?.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(app)}
                                    {app.documents && app.documents.length > 0 && (
                                        <span className="flex items-center text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                                            <FileText className="w-3 h-3 mr-1" />
                                            {app.documents.length} Docs
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">AI Match Score</span>
                                    <span className={`font-bold ${app.aiMatchScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                        app.aiMatchScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
                                            'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {Math.round(app.aiMatchScore || 0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${app.aiMatchScore >= 80 ? 'bg-green-500' :
                                            app.aiMatchScore >= 60 ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }`}
                                        style={{ width: `${app.aiMatchScore || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-xs text-gray-400">Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Unknown'}</span>
                                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View Details</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <User className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No applicants found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or check back later.</p>
                </div>
            )}

            {/* Details Modal */}
            <ApplicantDetailModal
                isOpen={!!selectedApplicantId}
                onClose={() => setSelectedApplicantId(null)}
                applicationId={selectedApplicantId}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
};

export default CompanyApplicants;
