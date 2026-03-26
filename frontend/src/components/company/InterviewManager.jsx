import React, { useState } from 'react';
import { Calendar, Video, MapPin, User, Mail, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const InterviewManager = ({ application, onUpdate }) => {
    const [isScheduling, setIsScheduling] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        roundName: 'Technical Interview',
        scheduledDate: '',
        scheduledTime: '',
        mode: 'online',
        meetingLink: '',
        location: '',
        interviewerName: '',
        interviewerEmail: ''
    });

    const [resultData, setResultData] = useState({ id: null, status: 'pass', feedback: '' });

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await api.post(`/company/application/${application._id}/schedule-interview`, formData);
            toast.success('Interview scheduled successfully');
            setIsScheduling(false);
            if (onUpdate) onUpdate(res.data.currentStage); // trigger refresh
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to schedule interview');
        } finally {
            setLoading(false);
        }
    };

    const handleResultSubmit = async (roundId) => {
        if (!resultData.feedback) return toast.error('Please provide feedback');
        try {
            setLoading(true);
            const res = await api.put(`/company/application/${application._id}/interview/${roundId}/result`, {
                result: resultData.status,
                feedback: resultData.feedback
            });
            toast.success(`Result updated as ${resultData.status}`);
            setResultData({ id: null, status: 'pass', feedback: '' });
            if (onUpdate) onUpdate(res.data.currentStage);
        } catch (err) {
            toast.error('Failed to update result');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Interview Management
                </h3>
                {!isScheduling && application.currentStage !== 'rejected' && application.status !== 'rejected' && application.currentStage !== 'joined' && (
                    <button 
                        onClick={() => setIsScheduling(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center shadow-md shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Schedule Next Round
                    </button>
                )}
            </div>

            {isScheduling && (
                <form onSubmit={handleSchedule} className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Schedule Interview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Round Name</label>
                            <select value={formData.roundName} onChange={e => setFormData({...formData, roundName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                                <option>Technical Interview</option>
                                <option>Managerial Interview</option>
                                <option>HR Interview</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                            <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                            <input type="time" required value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                        
                        {formData.mode === 'online' ? (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Link</label>
                                <div className="relative">
                                    <Video className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"/>
                                    <input type="url" required value={formData.meetingLink} onChange={e => setFormData({...formData, meetingLink: e.target.value})} placeholder="https://zoom.us/j/..." className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <div className="relative">
                                    <MapPin className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"/>
                                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Office Address or Cabin No." className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interviewer Name</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"/>
                                <input type="text" required value={formData.interviewerName} onChange={e => setFormData({...formData, interviewerName: e.target.value})} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interviewer Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"/>
                                <input type="email" required value={formData.interviewerEmail} onChange={e => setFormData({...formData, interviewerEmail: e.target.value})} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsScheduling(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{loading ? 'Saving...' : 'Save Schedule'}</button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {application?.interviewRounds?.length > 0 ? (
                    application.interviewRounds.map((round, idx) => (
                        <div key={round._id || idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
                                    Round {round.roundNumber}: {round.roundName}
                                    <span className={`ml-3 px-2 py-0.5 rounded text-xs border ${
                                        round.status === 'completed' ? (round.result === 'pass' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200') 
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}>
                                        {round.status === 'completed' ? (round.result === 'pass' ? 'Passed' : 'Failed') : 'Scheduled'}
                                    </span>
                                </h4>
                                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1"/> {new Date(round.scheduledDate).toLocaleDateString()} at {round.scheduledTime}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex flex-wrap gap-x-4">
                                    <span className="flex items-center"><User className="w-4 h-4 mr-1 text-gray-400"/> {round.interviewerName}</span>
                                    {round.mode === 'online' ? (
                                        <a href={round.meetingLink} target="_blank" rel="noreferrer" className="flex items-center text-blue-500 hover:underline"><Video className="w-4 h-4 mr-1"/> Join Link</a>
                                    ) : (
                                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {round.location}</span>
                                    )}
                                </p>
                                {round.feedback && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 border-l-2 border-gray-300 pl-2">Feedback: {round.feedback}</p>}
                            </div>
                            
                            {round.status === 'scheduled' && resultData.id !== round._id && (
                                <button onClick={() => setResultData({ id: round._id, status: 'pass', feedback: '' })} className="px-4 py-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium">Record Result</button>
                            )}

                            {resultData.id === round._id && (
                                <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Record Result</label>
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => setResultData({...resultData, status: 'pass'})} className={`flex-1 py-1.5 rounded flex justify-center items-center text-sm font-medium ${resultData.status === 'pass' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><CheckCircle className="w-4 h-4 mr-1"/> Pass</button>
                                        <button onClick={() => setResultData({...resultData, status: 'fail'})} className={`flex-1 py-1.5 rounded flex justify-center items-center text-sm font-medium ${resultData.status === 'fail' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><XCircle className="w-4 h-4 mr-1"/> Fail</button>
                                    </div>
                                    <textarea value={resultData.feedback} onChange={e => setResultData({...resultData, feedback: e.target.value})} placeholder="Detailed feedback..." className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 mb-2" rows="2" required></textarea>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setResultData({ id: null, status: 'pass', feedback: '' })} className="text-xs text-gray-500 hover:underline">Cancel</button>
                                        <button onClick={() => handleResultSubmit(round._id)} disabled={loading} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium">Submit</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        No interviews scheduled yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewManager;
