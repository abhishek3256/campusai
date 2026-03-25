import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, FileText, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LetterViewerModal = ({ isOpen, onClose, title, markdownContent }) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose} 
                    className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm print:hidden" 
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:w-full print:h-auto print:max-h-none print:block"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-6 flex justify-between items-center text-white print:hidden flex-shrink-0">
                        <div className="flex items-center">
                            <FileText className="w-6 h-6 mr-3" />
                            <h2 className="text-xl font-bold">{title}</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={handlePrint}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center text-sm font-medium mr-2"
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print PDF
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 print:p-0 bg-gray-50 dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-2xl">
                        <div className="print:hidden mb-6 flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 py-3 rounded-lg border border-green-200 dark:border-green-800">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span className="font-medium text-sm">Official System Generated Document</span>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12 print:shadow-none print:border-none prose prose-indigo dark:prose-invert max-w-none">
                            {markdownContent ? (
                                <ReactMarkdown>
                                    {markdownContent}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-gray-500 italic text-center py-10">Document content is unavailable.</p>
                            )}
                        </div>

                        {/* Signature area (Print only roughly, or visual addition) */}
                        <div className="mt-16 flex justify-between items-end text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">
                            <div className="text-center">
                                <div className="border-t border-gray-400 dark:border-gray-600 w-40 pt-2 font-semibold">Authorized Signatory</div>
                                <div className="text-xs text-gray-500 mt-1">Company Representative</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 dark:border-gray-600 w-40 pt-2 font-semibold">Candidate Acceptance</div>
                                <div className="text-xs text-gray-500 mt-1">Sign & Date</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LetterViewerModal;
