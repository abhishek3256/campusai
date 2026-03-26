import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, X, CircleDot } from 'lucide-react';

const stages = [
    { id: 'applied', label: 'Applied' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'assessment_assigned', label: 'Assessment' },
    { id: 'technical_interview', label: 'Tech Interview' },
    { id: 'hr_interview', label: 'HR Interview' },
    { id: 'selected', label: 'Selected' },
    { id: 'offer_sent', label: 'Offer Sent' },
    { id: 'offer_accepted', label: 'Offer Accepted' },
    { id: 'document_verification', label: 'Documents' },
    { id: 'documents_verified', label: 'Verified' },
    { id: 'joining_letter_issued', label: 'Joining Letter' },
    { id: 'joined', label: 'Joined' }
];

const ApplicationTimeline = ({ currentStage, statusHistory = [], isRejected = false }) => {
    
    // Find the index of the current stage
    let currentIndex = stages.findIndex(s => s.id === currentStage);
    
    // Fallback mapping for legacy statuses
    if (currentIndex === -1) {
        if (currentStage === 'documents-submitted') currentIndex = stages.findIndex(s => s.id === 'document_verification');
        else if (currentStage === 'documents-verified') currentIndex = stages.findIndex(s => s.id === 'documents_verified');
        else if (currentStage === 'offered') currentIndex = stages.findIndex(s => s.id === 'offer_sent');
        else if (currentStage === 'accepted') currentIndex = stages.findIndex(s => s.id === 'selected');
        else if (currentStage === 'shortlisted') currentIndex = stages.findIndex(s => s.id === 'under_review');
        else if (currentStage === 'rejected' || isRejected) currentIndex = statusHistory.length > 0 ? stages.findIndex(s => s.id === statusHistory[statusHistory.length - 1]?.stage) : 1;
    }

    // Default to at least applied
    if (currentIndex < 0) currentIndex = 0;

    return (
        <div className="w-full py-6 px-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 px-2">Recruitment Pipeline</h3>
            <div className="relative min-w-[800px] px-4">
                {/* Background Line */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                
                {/* Progress Line */}
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`absolute top-5 left-8 h-1 rounded-full ${isRejected ? 'bg-red-500' : 'bg-blue-500'}`}
                ></motion.div>

                <div className="relative flex justify-between">
                    {stages.map((stage, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isRejectedHere = isRejected && isCurrent;
                        
                        let Icon = Clock;
                        let bubbleClass = "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400";
                        
                        if (isCompleted) {
                            Icon = Check;
                            bubbleClass = "bg-blue-500 border-2 border-blue-500 text-white";
                        } else if (isRejectedHere) {
                            Icon = X;
                            bubbleClass = "bg-red-500 border-2 border-red-500 text-white shadow-lg shadow-red-500/30";
                        } else if (isCurrent) {
                            Icon = CircleDot;
                            bubbleClass = "bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20";
                        }

                        return (
                            <div key={stage.id} className="flex flex-col items-center relative z-10 w-24">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${bubbleClass}`}
                                >
                                    <Icon className={`w-5 h-5 ${isCurrent && !isRejectedHere ? 'animate-pulse' : ''}`} />
                                </motion.div>
                                <span className={`mt-3 text-xs font-medium text-center transition-colors duration-300 ${
                                    isRejectedHere ? 'text-red-600 dark:text-red-400 font-bold' :
                                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' :
                                    isCompleted ? 'text-gray-800 dark:text-gray-200' :
                                    'text-gray-400 dark:text-gray-500'
                                }`}>
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Status History Log */}
            {statusHistory && statusHistory.length > 0 && (
                <div className="mt-8 px-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Activity</p>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                        {[...statusHistory].reverse().map((history, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-1">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {history.notes || `Moved to ${history.stage}`}
                                </span>
                                <span className="text-gray-400 text-xs shadow-sm bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded">
                                    {new Date(history.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationTimeline;
