import React, { useState } from 'react';
import { Award, Send, CheckCircle, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const EmploymentLetterManager = ({ application, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/company/application/${application._id}/generate-employment`, {
                employeeId: `EMP-${Date.now().toString(36).toUpperCase()}`,
                department: application.jobId?.department || 'Engineering',
                designation: application.jobId?.title || 'Employee',
                joiningDate: application.joiningLetter?.joiningDate || application.offerLetter?.joiningDate || new Date().toISOString().split('T')[0],
            });
            toast.success('Employment letter generated!');
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate employment letter');
        } finally {
            setLoading(false);
        }
    };

    // Check pipeline progress for employment letter stage
    const empStage = application?.pipelineProgress?.stageResults?.find(
        s => s.stageName === 'Letter of Employment'
    );
    const letterContent = empStage?.generatedLetter?.letterContent;
    const hasLetter = !!letterContent || application?.joiningLetter?.employmentLetter;

    const viewLetter = () => {
        const content = letterContent || application?.joiningLetter?.employmentLetter || '';
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><title>Letter of Employment</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:40px;line-height:1.8;font-size:14px;color:#1a1a1a}
pre{white-space:pre-wrap;word-wrap:break-word}
@media print{button{display:none}}</style>
<button onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:8px 16px;background:#7c3aed;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">🖨️ Print</button>
</head><body><pre>${content}</pre></body></html>`);
        win.document.close();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Letter of Employment
                </h3>
                {hasLetter && (
                    <button onClick={viewLetter}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                        <ExternalLink className="w-4 h-4" /> View Letter
                    </button>
                )}
            </div>

            {!hasLetter ? (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Generate an official Letter of Employment for the employee. This letter is typically used for bank accounts, visa applications, and rental agreements.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex justify-center items-center shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
                    >
                        {loading
                            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><Award className="w-4 h-4 mr-2" /> Generate Employment Letter</>}
                    </button>
                </div>
            ) : (
                <div className="border border-purple-200 dark:border-purple-800/50 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-gray-900 dark:text-white">Employment Letter Issued</span>
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                            {empStage?.generatedLetter?.generatedAt
                                ? new Date(empStage.generatedLetter.generatedAt).toLocaleDateString('en-IN')
                                : 'Recently'}
                        </span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 max-h-52 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans line-clamp-6">
                            {letterContent?.slice(0, 400)}...
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmploymentLetterManager;
