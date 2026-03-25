import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, CheckCircle, FileText, ArrowLeft, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const DOCUMENT_TYPES = [
    { id: 'pan', label: 'PAN Card', desc: 'Required for tax identification' },
    { id: 'aadhaar', label: 'Aadhaar Card', desc: 'Proof of Identity & Address' },
    { id: '10th', label: '10th Marksheet', desc: 'Proof of Birth & Basics' },
    { id: '12th', label: '12th Marksheet', desc: 'Highschool verification' },
    { id: 'uan', label: 'UAN Card', desc: 'Provident Fund (if applicable)' },
    { id: 'nsr', label: 'NSR Card', desc: 'National Skills Registry' },
];

const DocumentUploadPortal = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);
    const [application, setApplication] = useState(null);
    
    useEffect(() => {
        fetchApplication();
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/student/applications');
            const targetApp = data.find(app => app._id === applicationId);
            if (!targetApp) {
                toast.error('Application not found');
                navigate('/student/dashboard');
                return;
            }
            setApplication(targetApp);
        } catch (err) {
            toast.error('Failed to load application');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, typeId) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validating type (images and pdfs)
        if (!file.type.match('image.*') && file.type !== 'application/pdf') {
            toast.error('Please upload an Image or PDF file.');
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', typeId);

        setUploading(typeId);
        try {
            const res = await api.post(`/student/application/${applicationId}/document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`${typeId.toUpperCase()} uploaded successfully!`);
            
            // Re-fetch to update DB state locally
            fetchApplication();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(null);
            e.target.value = null; // reset input
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    if (!application) return null;

    const uploadedDocs = application.documents || [];
    
    return (
        <div className="max-w-5xl mx-auto px-4 py-8 font-sans transition-colors duration-200">
            <Toaster position="top-right" />
            <button onClick={() => navigate('/student/dashboard')} className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                            <ShieldCheck className="w-8 h-8 text-blue-500 flex-shrink-0 mr-3" />
                            Secure Document Portal
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Upload your official documents for background verification. 
                            The AI OCR will extract and cross-verify details with your profile.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DOCUMENT_TYPES.map(docType => {
                        const existingDoc = uploadedDocs.find(d => d.type === docType.id);
                        const isUploading = uploading === docType.id;
                        
                        return (
                            <div key={docType.id} className={`p-6 rounded-xl border-2 transition-all ${existingDoc ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className={`p-3 rounded-xl mr-4 ${existingDoc ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            <FileText className={`w-6 h-6 ${existingDoc ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{docType.label}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{docType.desc}</p>
                                        </div>
                                    </div>
                                    {existingDoc && (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    )}
                                </div>
                                
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {existingDoc ? (
                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">
                                                <ShieldCheck className="w-4 h-4 mr-1" /> OCR AI Validated
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full">
                                                <AlertCircle className="w-4 h-4 mr-1" /> Pending Upload
                                            </span>
                                        )}
                                        
                                        {existingDoc && (
                                            <a 
                                                href={existingDoc.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full transition"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" /> View Image/PDF
                                            </a>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="image/*,.pdf" 
                                            onChange={(e) => handleFileUpload(e, docType.id)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            disabled={isUploading}
                                        />
                                        <button 
                                            disabled={isUploading}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center pointer-events-none transition-colors ${
                                                existingDoc 
                                                    ? 'bg-white border border-green-500 text-green-600 hover:bg-green-50' 
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            {isUploading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            ) : (
                                                <UploadCloud className="w-4 h-4 mr-2" />
                                            )}
                                            {existingDoc ? 'Re-upload' : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadPortal;
