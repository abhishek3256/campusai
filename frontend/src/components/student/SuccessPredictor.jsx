import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Briefcase } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SuccessPredictor = ({ jobId, jobRole, studentId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset prediction when selected job/role changes
  useEffect(() => {
    setPrediction(null);
  }, [jobId, jobRole]);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/predict-success', {
        jobId,
        jobRole,
        studentId
      });
      setPrediction(data.data);
    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error(error.response?.data?.message || 'Prediction failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse flex flex-col space-y-4 items-center p-8">
        <TrendingUp className="w-12 h-12 text-primary-400" />
        <p className="text-gray-500 dark:text-gray-400">Analyzing your resume against this role...</p>
      </div>
    </div>
  );
  
  if (!prediction) return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center border border-gray-200 dark:border-gray-700">
      <TrendingUp className="w-16 h-16 mx-auto text-primary-500 mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Success Predictor</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">See your estimated match probability and tailored recommendations before applying to {jobRole || 'this position'}.</p>
      <button 
        onClick={fetchPrediction}
        disabled={loading}
        className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        Predict My Chances
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <TrendingUp className="text-primary-500" />
          Success Predictor
        </h3>
        <div className="text-right">
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {prediction.successProbability}%
          </span>
          <p className="text-sm text-gray-500">Match Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Target className="text-green-500" /> Strengths
          </h4>
          <ul className="space-y-2">
            {prediction.strengthsForThisRole.map((strength, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span> {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Briefcase className="text-orange-500" /> How to Improve
          </h4>
          <ul className="space-y-2">
            {prediction.improvementSimulation?.ifYouAdd?.map((item, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300">
                Add <span className="font-semibold">{item.skill}</span> 
                <span className="text-green-500 ml-2">+{item.probabilityIncrease}% match</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Recommended Actions:</h4>
        <div className="flex flex-wrap gap-2">
          {prediction.recommendedActions.map((action, i) => (
            <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuccessPredictor;
