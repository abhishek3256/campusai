import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, Check } from 'lucide-react';
import api from '../../services/api';

const ResumeGapAnalyzer = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data } = await api.get('/ai/analyze-resume-gaps');
        setAnalysis(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  const handleAutoFix = async () => {
    setFixing(true);
    try {
      await api.post('/ai/autofix-resume', {
        resumeId: 'current', // Logic to pass correct resume ID
        fixOptions: { applyAll: true }
      });
      alert('Resume fixed successfully! Please check your profile.');
    } catch (error) {
      console.error(error);
    } finally {
      setFixing(false);
    }
  };

  if (loading) return <div>Analyzing resume health...</div>;
  if (!analysis) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Gap Analyzer</h2>
          <p className="text-gray-600 dark:text-gray-300">We found {analysis.criticalIssues} critical and {analysis.minorIssues} minor issues.</p>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${analysis.overallHealthScore > 75 ? 'text-green-500' : 'text-orange-500'}`}>
            {analysis.overallHealthScore}/100
          </div>
          <p className="text-sm text-gray-500">Health Score</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {analysis.employmentGaps.map((gap, i) => (
          <div key={i} className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start gap-4">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-300">Employment Gap Detected ({gap.gapPeriod})</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{gap.detectedIssue}</p>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded mt-2 border border-red-100 dark:border-red-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">AI Suggested Fix:</p>
                <p className="text-sm italic dark:text-gray-300">"{gap.suggestedFixes[0].rewrittenText}"</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Strategy: {gap.suggestedFixes[0].strategy}</p>
              </div>
            </div>
          </div>
        ))}

        {analysis.weakSections.map((sect, i) => (
          <div key={i} className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-start gap-4">
            <Wrench className="text-orange-500 shrink-0 mt-1" />
            <div className="w-full">
              <h4 className="font-semibold text-orange-800 dark:text-orange-300">Weak Section: {sect.section}</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">{sect.issue}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded text-sm text-gray-600 dark:text-gray-400 line-through">
                  {sect.currentText}
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded text-sm text-gray-800 dark:text-gray-200 border border-green-200 dark:border-green-800">
                  {sect.improvedVersion}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {analysis.autoFixAvailable && (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">AI Auto-Fix Available</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Let our AI automatically rewrite these sections, fix formatting, and optimize keywords.</p>
          <button 
            onClick={handleAutoFix}
            disabled={fixing}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
          >
            {fixing ? 'Fixing Resume...' : <><Check className="w-5 h-5"/> 1-Click Auto-Fix</>}
          </button>
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">Estimated time saved: {analysis.estimatedTimeToFix}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeGapAnalyzer;
