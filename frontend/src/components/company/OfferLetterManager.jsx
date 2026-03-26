import React, { useState } from 'react';
import { FileText, Send, CheckCircle, FileCheck } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const OfferLetterManager = ({ application, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        ctc: application.jobId?.salary?.max || '',
        joiningDate: ''
    });

    const handleGenerateOffer = async () => {
        if (!formData.ctc || !formData.joiningDate) return toast.error('Please fill required offer details');
        
        try {
            setLoading(true);
            const res = await api.post(`/company/application/${application._id}/generate-offer`, formData);
            toast.success('Offer letter generated and sent via AI!');
            if (onUpdate) onUpdate(res.data.data.currentStage);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate Offer');
        } finally {
            setLoading(false);
        }
    };

    const hasOffer = application?.offerLetter?.generatedAt || application?.aiGeneratedOfferLetter;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Offer Letter Details
                </h3>
            </div>

            {!hasOffer ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Final CTC (in ₹)</label>
                            <input type="number" value={formData.ctc} onChange={(e) => setFormData({...formData, ctc: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" placeholder="e.g. 500000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proposed Joining Date</label>
                            <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                        </div>
                    </div>
                    <button onClick={handleGenerateOffer} disabled={loading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex justify-center items-center shadow-md shadow-indigo-500/20 transition-all">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send className="w-4 h-4 mr-2" /> Issue AI Offer Letter</>}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3 flex justify-center items-center">
                        <FileCheck className="w-3 h-3 mr-1" /> This will generate a formal PDF content mapping these variables.
                    </p>
                </div>
            ) : (
                <div className="border border-indigo-200 dark:border-indigo-800/50 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 border-b border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Offer Letter Issued</h4>
                        </div>
                        <div className="text-sm">
                            <span className={`px-2.5 py-1 rounded-full font-medium ${application.offerLetter?.acceptedAt ? 'bg-green-100 text-green-700' : application.offerLetter?.rejectedAt ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {application.offerLetter?.acceptedAt ? 'Accepted' : application.offerLetter?.rejectedAt ? 'Declined' : 'Pending Student Response'}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white dark:bg-gray-800">
                        <div><p className="text-gray-500 mb-1">CTC Offered</p><p className="font-semibold text-gray-800 dark:text-gray-200">₹{application.offerLetter?.ctc || '-'}</p></div>
                        <div><p className="text-gray-500 mb-1">Joining Date</p><p className="font-semibold text-gray-800 dark:text-gray-200">{application.offerLetter?.joiningDate ? new Date(application.offerLetter.joiningDate).toLocaleDateString() : '-'}</p></div>
                        <div className="col-span-2"><p className="text-gray-500 mb-1">Issued At</p><p className="font-semibold text-gray-800 dark:text-gray-200">{application.offerLetter?.generatedAt ? new Date(application.offerLetter.generatedAt).toLocaleString() : '-'}</p></div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                            {application.offerLetter?.aiGeneratedContent || application.aiGeneratedOfferLetter}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferLetterManager;
