import React, { useState, useEffect } from 'react';
import { Map, Target, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const CareerRoadmap = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const { data } = await api.post('/ai/career-roadmap', {
          careerGoal: 'Full Stack Engineer', // Could be driven by a form
          timeframe: 3
        });
        setRoadmap(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  if (loading) return <div>Generating your personalized career path...</div>;
  if (!roadmap) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-10">
        <Map className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Your AI Career Roadmap</h2>
        <p className="text-gray-600 dark:text-gray-300">A personalized step-by-step guide to reach your career goals.</p>
      </div>

      <div className="space-y-8">
        {roadmap.roadmap.map((phase, idx) => (
          <div key={idx} className="relative pl-8 border-l-2 border-primary-200 dark:border-primary-800 mb-8">
            <div className="absolute w-4 h-4 bg-primary-500 rounded-full -left-[9px] top-1 border-4 border-white dark:border-gray-800"></div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Year {phase.year}, Q{phase.quarter}: {phase.phase}
            </h3>
            <p className="text-primary-600 dark:text-primary-400 font-medium mb-4">
              Target Role: {phase.jobTitles[0]} | Expected: ${phase.expectedSalary.min.toLocaleString()}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
                  <Target className="w-4 h-4 text-blue-500" /> Key Objectives
                </h4>
                <ul className="space-y-2">
                  {phase.objectives.map((obj, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Skills to Acquire</h4>
                <div className="space-y-3">
                  {phase.skillsToAcquire.map((skill, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <div className="flex justify-between font-medium mb-1 dark:text-white">
                        <span>{skill.skill}</span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                          {skill.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Project: {skill.projectIdea}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerRoadmap;
