import React, { useState } from 'react';
import { Send, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const JoiningLetterManager = ({ application, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        joiningDate: application.offerLetter?.joiningDate ? new Date(application.offerLetter.joiningDate).toISOString().split('T')[0] : '',
        reportingTime: '09:30 AM',
        reportingLocation: 'Head Office',
        details: {
            manager: 'HR Department',
            time: '09:30 AM',
            location: 'Head Office',
            date: application.offerLetter?.joiningDate ? new Date(application.offerLetter.joiningDate).toISOString().split('T')[0] : ''
        }
    });

    const handleGenerateJoining = async () => {
        if (!formData.joiningDate || !formData.reportingTime) return toast.error('Please fill required joining details');
        
        try {
            setLoading(true);
            const res = await api.post(`/company/application/${application._id}/generate-joining`, {
                joiningDate: formData.joiningDate,
                reportingTime: formData.reportingTime,
                reportingLocation: formData.reportingLocation,
                details: formData.details
            });
            toast.success('Joining letter generated and issued via AI!');
            if (onUpdate) onUpdate(res.data.data.currentStage);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate Joining Letter');
        } finally {
            setLoading(false);
        }
    };

    const hasJoining = application?.joiningLetter?.generatedAt || application?.aiGeneratedJoiningLetter;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg mr-3">
                        <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    Joining Details
                </h3>
            </div>

            {!hasJoining ? (
                <div className="bg-pink-50 dark:bg-pink-900/10 p-5 rounded-xl border border-pink-100 dark:border-pink-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmed Joining Date</label>
                            <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value, details: {...formData.details, date: e.target.value}})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reporting Time</label>
                            <input type="time" value={formData.reportingTime} onChange={(e) => setFormData({...formData, reportingTime: e.target.value, details: {...formData.details, time: e.target.value}})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <input type="text" value={formData.reportingLocation} onChange={(e) => setFormData({...formData, reportingLocation: e.target.value, details: {...formData.details, location: e.target.value}})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                    </div>
                    <button onClick={handleGenerateJoining} disabled={loading} className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium flex justify-center items-center shadow-md shadow-pink-500/20 transition-all">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send className="w-4 h-4 mr-2" /> Issue Formal Joining Letter</>}
                    </button>
                </div>
            ) : (
                <div className="border border-pink-200 dark:border-pink-800/50 rounded-xl overflow-hidden">
                    <div className="bg-pink-50 dark:bg-pink-900/30 p-4 border-b border-pink-100 dark:border-pink-800/50 flex justify-between items-center">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Joining Letter Issued</h4>
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <div><p className="text-gray-500 mb-1">Joining Date</p><p className="font-semibold text-gray-800 dark:text-gray-200">{application.joiningLetter?.joiningDate ? new Date(application.joiningLetter.joiningDate).toLocaleDateString() : '-'}</p></div>
                        <div><p className="text-gray-500 mb-1">Time</p><p className="font-semibold text-gray-800 dark:text-gray-200">{application.joiningLetter?.reportingTime || '-'}</p></div>
                        <div className="col-span-2"><p className="text-gray-500 mb-1">Location</p><p className="font-semibold text-gray-800 dark:text-gray-200">{application.joiningLetter?.reportingLocation || '-'}</p></div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                            {application.joiningLetter?.aiGeneratedContent || application.aiGeneratedJoiningLetter}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JoiningLetterManager;
