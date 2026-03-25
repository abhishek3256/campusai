import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Camera, Mic, Square, CheckCircle, AlertTriangle, AlertCircle, PlayCircle, SkipForward } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const VideoInterviewPage = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);

    const [cameraActive, setCameraActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false); // require user to click to start

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialization
    useEffect(() => {
        if (!assessmentId) return;
        startInterviewAttempt();
        return () => {
            stopCamera();
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [assessmentId]);

    const startInterviewAttempt = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/assessment/${assessmentId}/start`);
            if (res.data.success) {
                const { attempt: att, assessment: ass } = res.data.data;
                setAssessment(ass);
                setAttempt(att);
                
                // Flatten questions from sections
                let allQs = [];
                if (ass.sections) {
                    ass.sections.forEach(sec => {
                        if (sec.questions) {
                            sec.questions.forEach(q => {
                                allQs.push({ ...q, sectionId: sec.sectionId });
                            });
                        }
                    });
                }
                setQuestions(allQs);
                
                // Setup Speech Recognition right away if supported
                setupSpeechRecognition();
            } else {
                toast.error(res.data.message || 'Could not start interview');
            }
        } catch (err) {
            console.error('Error starting interview:', err);
            toast.error(err.response?.data?.message || 'Error initializing interview');
        } finally {
            setLoading(false);
        }
    };

    const setupSpeechRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            setTranscript(prev => {
                // If there's new final text, append it.
                // We keep it simple: just append whatever is marked final.
                if (finalTranscript) {
                    return prev + ' ' + finalTranscript;
                }
                return prev;
            });
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                toast.error('Microphone access denied. Please allow microphone access.');
            }
        };

        recognition.onend = () => {
            // If we are still supposed to be recording, restart it to bypass limits
            // This is needed for long answers where Webkit stops automatically
            if (isRecording) {
                try {
                    recognition.start();
                } catch(e) {}
            }
        };

        recognitionRef.current = recognition;
    }, [isRecording]);

    // Camera Management
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            console.error('Error accessing media devices.', err);
            toast.error('Please allow camera and microphone permissions to start the interview.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // Interview Actions
    const beginInterview = async () => {
        setInitializing(true);
        await startCamera();
        setHasInteracted(true);
        setInitializing(false);
    };

    const toggleRecording = () => {
        if (!isRecording) {
            setTranscript(''); // clear prev answer text
            setIsRecording(true);
            try {
                recognitionRef.current?.start();
            } catch(e) { console.log(e); }
            toast('Recording started... Speak now.', { icon: '🎙️' });
        } else {
            setIsRecording(false);
            try {
                recognitionRef.current?.stop();
            } catch(e) { console.log(e); }
            toast.success('Recording saved.');
        }
    };

    const submitAnswerAndGoNext = async () => {
        if (!attempt || !questions[currentIdx]) return;
        
        if (isRecording) {
            toggleRecording(); // stop if it's still running
        }

        const currentQ = questions[currentIdx];
        
        try {
            await api.post(`/assessment/attempt/${attempt._id}/answer`, {
                sectionId: currentQ.sectionId,
                questionId: currentQ.questionId,
                answer: transcript.trim() || 'No answer provided.',
                timeTaken: 60 // Mocking time taken for now
            });
            
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(prev => prev + 1);
                setTranscript(''); // Clear for next question
            } else {
                finishInterview();
            }
        } catch (err) {
            console.error('Error submitting answer:', err);
            toast.error('Failed to save answer. Please try again.');
        }
    };

    const finishInterview = async () => {
        try {
            await api.post(`/assessment/attempt/${attempt._id}/submit`);
            stopCamera();
            toast.success('Interview Completed Successfully!');
            navigate(`/student/assessment/result/${attempt._id}`);
        } catch (err) {
            console.error('Finish interview error:', err);
            toast.error('Failed to submit interview.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Toaster />
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!assessment || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                <div className="max-w-md bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No Questions Available</h2>
                    <p className="text-gray-400 mb-6">This interview does not contain any generated questions yet.</p>
                    <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIdx];
    const isLastQuestion = currentIdx === questions.length - 1;

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
            <Toaster position="top-center" />
            
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 py-4 px-6 flex justify-between items-center z-10">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-4 shadow-lg shadow-indigo-500/30">
                        <Camera className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">{assessment.basicInfo?.title || 'Video Interview'}</h1>
                        <p className="text-gray-400 text-sm">{assessment.companyId?.companyName} • AI Monitored</p>
                    </div>
                </div>
                {hasInteracted && (
                    <div className="bg-gray-800 border border-gray-700 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium">
                        Question {currentIdx + 1} of {questions.length}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row relative">
                
                {/* Left Side: Video Preview */}
                <div className="w-full md:w-1/2 lg:w-3/5 bg-black relative flex flex-col">
                    {!cameraActive && !hasInteracted && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20 px-6 text-center">
                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md shadow-2xl">
                                <Camera className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-3">Setup Interview Environment</h2>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    This interview requires your camera and microphone. The AI will transcribe your spoken answers. Please ensure you are in a quiet room with good lighting.
                                </p>
                                <button 
                                    onClick={beginInterview}
                                    disabled={initializing}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center transition disabled:opacity-50"
                                >
                                    {initializing ? 'Starting...' : <><PlayCircle className="w-5 h-5 mr-2" /> Start Interview</>}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <video 
                        ref={videoRef}
                        autoPlay 
                        muted 
                        playsInline
                        className={`w-full h-full object-cover shadow-2xl transition-opacity duration-700 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transform: 'scaleX(-1)' }} // Mirror view
                    />
                    
                    {/* Recording overlay indicator */}
                    <AnimatePresence>
                        {isRecording && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute top-6 left-6 flex items-center bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700"
                            >
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-3"></div>
                                <span className="text-white text-sm font-medium tracking-wide">RECORDING</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Question & Answers */}
                <div className="w-full md:w-1/2 lg:w-2/5 bg-gray-900 flex flex-col border-l border-gray-800">
                    {hasInteracted ? (
                        <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
                            
                            {/* Question Card */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl mb-6 flex-shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h3 className="text-indigo-400 text-xs font-bold tracking-wider uppercase mb-2">Interview Question</h3>
                                <p className="text-white text-lg font-medium leading-relaxed">
                                    {currentQuestion?.question}
                                </p>
                            </div>

                            {/* Transcript Area */}
                            <div className="flex-1 bg-gray-950 rounded-2xl border border-gray-800 p-6 flex flex-col mb-6 relative group overflow-hidden">
                                <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-4 flex items-center justify-between">
                                    Your Spoken Answer (Live Transcript)
                                    {isRecording && <Mic className="w-4 h-4 text-red-500 animate-pulse" />}
                                </h3>
                                
                                <textarea
                                    className="flex-1 bg-transparent text-gray-300 resize-none outline-none leading-relaxed overflow-y-auto"
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    placeholder={isRecording ? "Listening to your answer..." : "Click record to speak, or type your answer manually here."}
                                />
                                
                                <div className="absolute bottom-4 right-4 flex space-x-2">
                                    <button 
                                        onClick={toggleRecording}
                                        className={`flex items-center px-4 py-2 rounded-full font-medium transition-all shadow-lg ${
                                            isRecording 
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500'
                                        }`}
                                    >
                                        {isRecording ? <><Square className="w-4 h-4 mr-2" /> Stop Recording</> : <><Mic className="w-4 h-4 mr-2" /> Start Recording</>}
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end pt-4 border-t border-gray-800 mt-auto flex-shrink-0">
                                <button 
                                    onClick={submitAnswerAndGoNext}
                                    className={`px-8 py-3 rounded-xl font-bold flex items-center transition shadow-xl ${
                                        isLastQuestion 
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {isLastQuestion ? (
                                        <><CheckCircle className="w-5 h-5 mr-2" /> Finish Interview</>
                                    ) : (
                                        <>Next Question <SkipForward className="w-5 h-5 ml-2" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center bg-gray-900 border-l border-gray-800">
                            <div className="opacity-50">
                                <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">Please start the interview to view questions.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default VideoInterviewPage;
