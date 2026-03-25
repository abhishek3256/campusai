import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload PDF or DOCX file only');
      return;
    }
    
    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/student/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        toast.success('Resume uploaded and analyzed successfully!');
        setFile(null);
        // Optionally trigger a reload or navigate to analysis page
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.hint ||
                          'Upload failed. Please try again.';
      
      toast.error(errorMessage, { duration: 5000 });
      
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
      <h2 className="text-gray-900 dark:text-white text-2xl font-bold mb-6">Upload Resume</h2>
      
      <div className="mb-6">
        <label className="block mb-4">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            {file ? (
              <div className="flex items-center justify-center">
                <File className="w-5 h-5 text-primary-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
              </div>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Click to select resume</p>
                <p className="text-gray-500 text-sm">PDF or DOCX (max 10MB)</p>
              </>
            )}
          </div>
        </label>

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Uploading...</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-2 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Tips for best results:
        </h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-7">
          <li>• Use a text-based PDF (not scanned images)</li>
          <li>• Include clear section headers</li>
          <li>• List skills, experience, and education clearly</li>
          <li>• Keep file size under 10MB</li>
        </ul>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Analyzing...' : 'Upload & Analyze Resume'}
      </button>
    </div>
  );
};

export default ResumeUpload;
