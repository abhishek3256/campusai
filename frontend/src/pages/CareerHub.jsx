import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import CareerRoadmap from '../components/student/CareerRoadmap';
import ResumeGapAnalyzer from '../components/student/ResumeGapAnalyzer';
import SuccessPredictor from '../components/student/SuccessPredictor';
import MockInterviewSimulator from '../components/student/MockInterviewSimulator';
import { Target, Search, FileText, Video, Briefcase, Bot } from 'lucide-react';

const CareerHub = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('roadmap');
  const [applications, setApplications] = useState([]);
  const [selectedSelection, setSelectedSelection] = useState('');

  const presetRoles = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Architect",
    "Mobile App Developer",
    "UI/UX Designer",
    "Product Manager"
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data } = await api.get('/student/applications');
        setApplications(data);
        if (data && data.length > 0) {
          setSelectedSelection(`job:${data[0].jobId._id}`);
        } else {
          setSelectedSelection(`role:${presetRoles[0]}`);
        }
      } catch (error) {
        console.error('Failed to fetch applications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const tabs = [
    { id: 'roadmap', name: 'Career Roadmap', icon: <Target className="w-5 h-5" /> },
    { id: 'gap-analyzer', name: 'Resume AI Fixer', icon: <FileText className="w-5 h-5" /> },
    { id: 'success-predictor', name: 'Success Predictor', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'mock-interview', name: 'AI Mock Interview', icon: <Video className="w-5 h-5" /> },
  ];

  const parsedJobId = selectedSelection.startsWith('job:') ? selectedSelection.replace('job:', '') : undefined;
  const parsedJobRole = selectedSelection.startsWith('role:') ? selectedSelection.replace('role:', '') : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Bot className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career AI Hub</h1>
          <p className="text-gray-500 dark:text-gray-400">Your personalized AI-powered career growth center</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto md:overflow-visible flex md:block whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors font-medium text-sm mb-1 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Job Selection needed for predictor & interview */}
          {(activeTab === 'success-predictor' || activeTab === 'mock-interview') && (
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select a Job Role or Applied Job to Analyze:
              </label>
              <select
                value={selectedSelection}
                onChange={(e) => setSelectedSelection(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">-- Select a Job or Role --</option>
                <optgroup label="Practice Roles">
                  {presetRoles.map(role => (
                    <option key={role} value={`role:${role}`}>
                      {role}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Your Applied Jobs">
                  {applications.map(app => (
                    <option key={app._id} value={`job:${app.jobId?._id}`}>
                      {app.jobId?.title} at {app.companyId?.companyName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {activeTab === 'roadmap' && <CareerRoadmap />}
          {activeTab === 'gap-analyzer' && <ResumeGapAnalyzer />}
          
          {activeTab === 'success-predictor' && (
            selectedSelection ? (
              <SuccessPredictor jobId={parsedJobId} jobRole={parsedJobRole} studentId={user._id} />
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Please select a job above to view success prediction.</p>
              </div>
            )
          )}

          {activeTab === 'mock-interview' && (
            selectedSelection ? (
              <MockInterviewSimulator jobId={parsedJobId} jobRole={parsedJobRole} studentId={user._id} />
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Please select a job above to start the mock interview.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerHub;
