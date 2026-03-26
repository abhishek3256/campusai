import React, { useState } from 'react';
import { FileCheck, ShieldAlert, CheckCircle, XCircle, FileText, UploadCloud, AlertTriangle, Eye, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const DocumentVerificationPanel = ({ application, onUpdate }) => {
    const [loadingMap, setLoadingMap] = useState({});
    const [remarksMap, setRemarksMap] = useState({});

    const handleApproval = async (docId, status) => {
        try {
            setLoadingMap({...loadingMap, [docId]: true});
            const res = await api.put(`/company/application/${application._id}/documents/approve`, {
                documentId: docId,
                status,
                remarks: remarksMap[docId] || ''
            });
            toast.success(status === 'approved' ? 'Document approved!' : 'Document rejected');
            if (onUpdate) onUpdate(res.data.currentStage);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update document status');
        } finally {
            setLoadingMap({...loadingMap, [docId]: false});
        }
    };

    const docs = application?.documents || [];
    
    // Sort so pending docs are at top
    const sortedDocs = [...docs].sort((a,b) => {
        if(a.companyVerification?.status === 'pending' && b.companyVerification?.status !== 'pending') return -1;
        if(a.companyVerification?.status !== 'pending' && b.companyVerification?.status === 'pending') return 1;
        return 0;
    });

    if (docs.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6 text-center">
                <UploadCloud className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Documents Uploaded</h3>
                <p className="text-sm text-gray-500">The candidate has not submitted any verification documents yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                        <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Document Verification
                </h3>
            </div>

            <div className="space-y-4">
                {sortedDocs.map((doc, idx) => {
                    const isPending = !doc.companyVerification || doc.companyVerification.status === 'pending';
                    const isApproved = doc.companyVerification?.status === 'approved';
                    const aiConfidence = doc.aiVerification?.confidence || doc.aiConfidence || 0;
                    
                    return (
                        <div key={doc._id || idx} className={`border rounded-xl p-5 ${
                            isApproved ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50' : 
                            !isPending ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50' : 
                            'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}>
                            
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Left Side: AI Analysis */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white uppercase flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                            {doc.documentType || doc.type}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded flex items-center ${aiConfidence >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                AI Match: {aiConfidence}%
                                            </span>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                isApproved ? 'bg-emerald-500 text-white' : 
                                                !isPending ? 'bg-red-500 text-white' : 
                                                'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {isApproved ? 'Verified' : !isPending ? 'Rejected' : 'Pending Manual Review'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700">
                                        <p className="flex items-start">
                                            <ShieldAlert className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${aiConfidence >= 90 ? 'text-green-500' : 'text-yellow-500'}`} />
                                            <span className="italic">{doc.aiVerification?.extractedData ? `Extracted Data: ${JSON.stringify(doc.aiVerification.extractedData)}` : doc.aiNotes}</span>
                                        </p>
                                    </div>
                                    
                                    <a href={doc.fileUrl || doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm">
                                        <Eye className="w-4 h-4 mr-2" /> View Original Document
                                    </a>
                                </div>
                                
                                {/* Right Side: Actions */}
                                {isPending && (
                                    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manual Verification Action</label>
                                        <textarea 
                                            value={remarksMap[doc._id] || ''} 
                                            onChange={e => setRemarksMap({...remarksMap, [doc._id]: e.target.value})} 
                                            placeholder="Audit remarks (optional)..." 
                                            className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 mb-3" 
                                            rows="2"
                                        ></textarea>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproval(doc._id, 'approved')} disabled={loadingMap[doc._id]} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex justify-center items-center text-sm font-medium shadow-sm transition"><CheckCircle className="w-4 h-4 mr-1"/> Approve</button>
                                            <button onClick={() => handleApproval(doc._id, 'rejected')} disabled={loadingMap[doc._id]} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex justify-center items-center text-sm font-medium shadow-sm transition"><XCircle className="w-4 h-4 mr-1"/> Reject</button>
                                        </div>
                                    </div>
                                )}
                                
                                {!isPending && (
                                    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center">
                                        <p className="text-xs uppercase font-bold text-gray-500 mb-1">Company Remarks</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                            {doc.companyVerification?.remarks || 'No remarks provided.'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 text-right">Processed on {new Date(doc.companyVerification.verifiedAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentVerificationPanel;
