import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, MessageSquare, Award, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MockInterviewSimulator = ({ jobId, jobRole, studentId }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Track completion and scores
  const [isComplete, setIsComplete] = useState(false);
  const [scores, setScores] = useState([]);
  
  // Speech Recognition Ref
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => {
          // simple logic to append only new final chunks or just overwrite the latest interim
          // for a cleaner setup, if continuous, we just append to a ref, but simple overwrite here works if they speak continuously.
          return prev + " " + currentTranscript.trim();
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        toast.error('Voice recording failed. Please type your answer.');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    } else {
      setUserAnswer(''); // Clear before new recording optionally? Or just append. Let's keep existing text.
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Listening... Speak your answer.');
      } else {
        toast.error('Voice recognition is not supported in this browser.');
      }
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setScores([]);
    setIsComplete(false);
    setCurrentIdx(0);
    setFeedback(null);
    setUserAnswer('');
    try {
      const { data } = await api.post('/ai/generate-interview-questions', { jobId, jobRole, studentId });
      setQuestions(data.data.questions);
    } catch (error) {
      console.error('Interview generation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to start interview. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (isRecording) {
      toggleRecording(); // Stop recording if they submit while it's active
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/simulate-interview', {
        questionId: questions[currentIdx].id,
        userAnswer,
        conversationHistory: questions.slice(0, currentIdx + 1)
      });
      setFeedback(data.data);
      setScores(prev => [...prev, data.data.score]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze answer');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIdx === questions.length - 1) {
      setIsComplete(true);
    } else {
      setFeedback(null);
      setUserAnswer('');
      setCurrentIdx(prev => prev + 1);
    }
  };

  const calculateAverageScore = () => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, score) => sum + score, 0);
    return (total / scores.length).toFixed(1);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center border border-gray-200 dark:border-gray-700">
        <Video className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">AI Mock Interview</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Practice with industry-specific questions tailored to your resume and this job.</p>
        <button 
          onClick={startInterview}
          disabled={loading}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Generating Questions...' : 'Start Practice Session'}
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
        <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Interview Complete!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8">You have answered all {questions.length} questions.</p>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl inline-block mb-8 border border-gray-100 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Overall Average Score</p>
          <div className="text-5xl font-extrabold text-primary-600 dark:text-primary-400">
            {calculateAverageScore()} <span className="text-2xl text-gray-400">/ 10</span>
          </div>
        </div>

        <div>
          <button 
            onClick={() => setQuestions([])} // reset to start
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            Start Another Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-6 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full">
          {questions[currentIdx].type}
        </span>
      </div>

      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {questions[currentIdx].question}
      </h3>

      {!feedback ? (
        <div className="space-y-4">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Type your answer here or click 'Start Recording' to dictate..."
          />
          <div className="flex justify-between">
             <button 
               onClick={toggleRecording}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                 isRecording 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
               }`}
             >
               {isRecording ? <><MicOff className="w-5 h-5" /> Stop Recording</> : <><Mic className="w-5 h-5" /> Start Recording</>}
             </button>
             <button
               onClick={submitAnswer}
               disabled={loading || !userAnswer.trim()}
               className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
             >
               {loading ? 'Analyzing...' : 'Submit & Get Feedback'}
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Award className="text-yellow-500" /> 
              Score: {feedback.score}/{feedback.maxScore}
            </h4>
          </div>
          
          <div className="space-y-4 text-sm">
            <p className="text-gray-700 dark:text-gray-300"><strong>Feedback:</strong> {feedback.feedback}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-green-800 dark:text-green-300 border border-green-100 dark:border-green-800/30">
                <strong>Strengths:</strong>
                <ul className="list-disc pl-4 mt-1">
                  {feedback.evaluation?.strengths?.map((s,i) => <li key={i}>{s}</li>) || <li>Good effort</li>}
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-red-800 dark:text-red-300 border border-red-100 dark:border-red-800/30">
                <strong>To Improve:</strong>
                <ul className="list-disc pl-4 mt-1">
                  {feedback.improvementSuggestions?.map((s,i) => <li key={i}>{s}</li>) || <li>Add more details</li>}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <button
                onClick={handleNext}
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                {currentIdx === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewSimulator;
