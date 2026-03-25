import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Briefcase, Users, PlusCircle, Pencil, Trash2, ClipboardList, Trophy, CalendarClock, X, Copy } from 'lucide-react';
import NotificationBell from '../components/common/NotificationBell';

const CompanyDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingJob, setDeletingJob] = useState(null);
    const [confirmJobId, setConfirmJobId] = useState(null);

    const [deletingAssessment, setDeletingAssessment] = useState(null);
    const [confirmAssessmentId, setConfirmAssessmentId] = useState(null);

    const [postponeModal, setPostponeModal] = useState({ isOpen: false, assessment: null, startDate: '', endDate: '' });

    const navigate = useNavigate();

    useEffect(() => { 
        Promise.all([fetchJobs(), fetchAssessments()]).finally(() => setLoading(false));
    }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/company/jobs');
            setJobs(data);
        } catch (error) { console.error(error); }
    };

    const fetchAssessments = async () => {
        try {
            const { data } = await api.get('/assessment');
            if (data.success) setAssessments(data.data);
        } catch (error) { console.error(error); }
    };

    const handleDeleteJobClick = (jobId) => {
        if (confirmJobId === jobId) {
            performDeleteJob(jobId);
        } else {
            setConfirmJobId(jobId);
            setTimeout(() => setConfirmJobId(null), 3000);
        }
    };

    const performDeleteJob = async (jobId) => {
        setConfirmJobId(null);
        setDeletingJob(jobId);
        try {
            await api.delete(`/company/jobs/${jobId}`);
            setJobs(prev => prev.filter(j => String(j._id) !== String(jobId)));
            toast.success('Job deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeletingJob(null);
        }
    };

    // ── AST DELETION ──
    const handleDeleteAssessmentClick = (id) => {
        if (confirmAssessmentId === id) {
            performDeleteAssessment(id);
        } else {
            setConfirmAssessmentId(id);
            setTimeout(() => setConfirmAssessmentId(null), 3000);
        }
    };

    const performDeleteAssessment = async (id) => {
        setConfirmAssessmentId(null);
        setDeletingAssessment(id);
        try {
            await api.delete(`/assessment/${id}`);
            setAssessments(prev => prev.filter(a => String(a._id) !== String(id)));
            toast.success('Assessment deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeletingAssessment(null);
        }
    };

    // ── AST DUPLICATE / RECONDUCT ──
    const [duplicatingId, setDuplicatingId] = useState(null);
    const handleDuplicateAssessment = async (id) => {
        setDuplicatingId(id);
        try {
            const { data } = await api.post(`/assessment/${id}/duplicate`);
            if (data.success) {
                toast.success('Exam duplicated Successfully! You can now edit it.');
                setAssessments(prev => [data.data, ...prev]);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reconduct exam');
        } finally {
            setDuplicatingId(null);
        }
    };

    // ── AST POSTPONE ──
    const handleSavePostpone = async () => {
        try {
            const { assessment, startDate, endDate } = postponeModal;
            const updatedSchedule = { ...assessment.schedule, startDate, endDate };
            await api.put(`/assessment/${assessment._id}`, { schedule: updatedSchedule });
            toast.success('Schedule updated successfully');
            setAssessments(prev => prev.map(a => a._id === assessment._id ? { ...a, schedule: updatedSchedule } : a));
            setPostponeModal({ isOpen: false, assessment: null, startDate: '', endDate: '' });
        } catch (err) {
            toast.error('Failed to update schedule');
        }
    };

    const stageColor = (stage) => {
        const map = {
            open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            shortlisting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            exam: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            results: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        };
        return map[stage] || map.open;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Dashboard</h1>
                <div className="flex items-center gap-3">
                    <NotificationBell role="company" />
                    <Link to="/company/exam/create"
                        className="bg-violet-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-violet-700 transition shadow-lg text-sm font-medium">
                        <ClipboardList className="w-4 h-4" /> Create Exam
                    </Link>
                    <Link to="/company/post-job"
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg text-sm font-medium">
                        <PlusCircle className="w-4 h-4" /> Post New Job
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Active Jobs</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{jobs.filter(j => j.isActive).length}</h3>
                    </div>
                    <Briefcase className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Applicants</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{jobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0)}</h3>
                    </div>
                    <Users className="w-10 h-10 text-green-500 opacity-20" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Vacancies</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{jobs.reduce((acc, j) => acc + (j.vacancies || 0), 0)}</h3>
                    </div>
                    <Trophy className="w-10 h-10 text-amber-500 opacity-20" />
                </div>
            </div>

            {/* Jobs Table */}
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Job Postings</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-30" />
                        <p>No jobs posted yet. <Link to="/company/post-job" className="text-blue-600 hover:underline">Post your first job</Link></p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Job</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applicants</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stage</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {jobs.map(job => (
                                <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{job.location}{job.vacancies ? ` • ${job.vacancies} vacancies` : ''}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                        {job.employmentType || job.jobType || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {job.applications?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full capitalize ${stageColor(job.recruitmentStage || (job.isActive ? 'open' : 'closed'))}`}>
                                            {job.recruitmentStage || (job.isActive ? 'Open' : 'Closed')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/company/applicants/${job._id}`}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition">
                                                Applicants
                                            </Link>
                                            <Link to={`/company/jobs/edit/${job._id}`}
                                                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition"
                                                title="Edit job">
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteJobClick(job._id)}
                                                disabled={deletingJob === job._id}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                                                    confirmJobId === job._id
                                                        ? 'bg-red-600 text-white animate-pulse'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                                }`}
                                                title={confirmJobId === job._id ? 'Click again to confirm delete' : 'Delete job'}>
                                                {deletingJob === job._id
                                                    ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                                {confirmJobId === job._id ? 'Confirm?' : ''}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Assessments Table */}
            <h2 className="text-xl font-bold mb-4 mt-12 text-gray-900 dark:text-white">Your Assessments</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-30" />
                        <p>No assessments created yet. <Link to="/company/exam/create" className="text-violet-600 hover:underline">Create an exam</Link></p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assessment Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type / Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {assessments.map(assessment => (
                                <tr key={assessment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900 dark:text-white">{assessment.basicInfo?.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{assessment.basicInfo?.designation}{assessment.jobId ? ` • Linked Job: ${assessment.jobId.title}` : ''}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                        <p>{assessment.testType?.replace('-', ' ')}</p>
                                        <p className="text-xs text-gray-400">{assessment.schedule?.duration || 60} mins</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full capitalize ${assessment.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {assessment.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/company/exam/results/${assessment._id}`}
                                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition" title="View Results">
                                                Results
                                            </Link>
                                            <button
                                                onClick={() => setPostponeModal({
                                                    isOpen: true,
                                                    assessment: assessment,
                                                    startDate: assessment.schedule?.startDate ? new Date(new Date(assessment.schedule.startDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
                                                    endDate: assessment.schedule?.endDate ? new Date(new Date(assessment.schedule.endDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''
                                                })}
                                                className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition"
                                                title="Postpone / Edit Schedule">
                                                <CalendarClock className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateAssessment(assessment._id)}
                                                disabled={duplicatingId === assessment._id}
                                                className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                                                title="Reconduct / Duplicate Exam">
                                                {duplicatingId === assessment._id ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssessmentClick(assessment._id)}
                                                disabled={deletingAssessment === assessment._id}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                                                    confirmAssessmentId === assessment._id
                                                        ? 'bg-red-600 text-white animate-pulse'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                                }`}
                                                title={confirmAssessmentId === assessment._id ? 'Click again to confirm delete' : 'Delete assessment'}>
                                                {deletingAssessment === assessment._id
                                                    ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                                {confirmAssessmentId === assessment._id ? 'Confirm?' : ''}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Postpone Schedule Modal */}
            {postponeModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-violet-500" /> Edit Assessment Schedule
                            </h3>
                            <button onClick={() => setPostponeModal({ isOpen: false, assessment: null, startDate: '', endDate: '' })} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Update the exam window for <span className="font-semibold text-gray-800 dark:text-gray-200">{postponeModal.assessment?.basicInfo?.title}</span>.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Start Date/Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={postponeModal.startDate} 
                                    onChange={(e) => setPostponeModal(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New End Date/Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={postponeModal.endDate} 
                                    onChange={(e) => setPostponeModal(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <button onClick={() => setPostponeModal({ isOpen: false, assessment: null, startDate: '', endDate: '' })} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                            <button onClick={handleSavePostpone} className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-2">
                                <CalendarClock className="w-4 h-4" /> Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
