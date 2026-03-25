import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, ExternalLink, ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker for PDF.js using CDN for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const ResumeViewModal = ({ isOpen, onClose, resumeUrl }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    // fix path if it is local (helper function)
    const getViewerUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // Make sure to use the correct port for backend
        return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
    };

    const fileUrl = getViewerUrl(resumeUrl);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }

    function onDocumentLoadError(err) {
        console.error('Error loading PDF:', err);
        setLoading(false);
        setError(err.message);
    }

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <div className="flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                My Resume
                            </h2>
                            <div className="flex items-center space-x-2">
                                <a
                                    href={fileUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Open in New Tab"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto p-4 flex justify-center">
                            {fileUrl ? (
                                <div className="relative flex flex-col items-center">
                                    {error ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                                            <AlertCircle className="w-12 h-12 mb-2" />
                                            <p className="font-medium">Failed to load resume PDF</p>
                                            <p className="text-sm text-gray-400 mt-1">{error}</p>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-blue-500 underline text-sm">
                                                Try opening in new tab
                                            </a>
                                        </div>
                                    ) : (
                                        <>
                                            <Document
                                                file={fileUrl}
                                                onLoadSuccess={onDocumentLoadSuccess}
                                                onLoadError={onDocumentLoadError}
                                                loading={
                                                    <div className="flex items-center justify-center h-64 w-full">
                                                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                                                    </div>
                                                }
                                                className="shadow-lg max-w-full"
                                                error={<div className="text-red-500">Failed to load PDF file.</div>}
                                            >
                                                <Page
                                                    pageNumber={pageNumber}
                                                    renderTextLayer={true}
                                                    renderAnnotationLayer={true}
                                                    width={Math.min(window.innerWidth * 0.7, 700)}
                                                    className="bg-white shadow-md mb-4"
                                                    loading={<div className="h-96 w-[600px] bg-gray-200 animate-pulse rounded"></div>}
                                                />
                                            </Document>

                                            {numPages && (
                                                <div className="mt-4 flex items-center justify-center space-x-4 sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-fit mx-auto z-10">
                                                    <button
                                                        disabled={pageNumber <= 1}
                                                        onClick={previousPage}
                                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <span className="text-sm font-medium">
                                                        Page {pageNumber} of {numPages}
                                                    </span>
                                                    <button
                                                        disabled={pageNumber >= numPages}
                                                        onClick={nextPage}
                                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                                    <p>No resume found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default ResumeViewModal;
