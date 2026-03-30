import React from 'react';
import { GitBranch, ChevronUp, ChevronDown, X } from 'lucide-react';

export const ALL_STAGES = [
    { stageName: 'Application Screening', icon: '📋', description: 'Initial screening of applications' },
    { stageName: 'Resume Shortlisting', icon: '📄', description: 'Review and shortlist resumes' },
    { stageName: 'Online Assessment', icon: '💻', description: 'Online aptitude/technical test' },
    { stageName: 'Technical Round', icon: '🔧', description: 'Technical interview round' },
    { stageName: 'Managerial Round', icon: '👔', description: 'Managerial interview round' },
    { stageName: 'HR Round', icon: '🤝', description: 'HR interview round' },
    { stageName: 'Group Discussion', icon: '👥', description: 'Group discussion round' },
    { stageName: 'Case Study', icon: '📊', description: 'Case study presentation' },
    { stageName: 'Final Interview', icon: '⭐', description: 'Final decision interview' },
    { stageName: 'Offer Letter', icon: '💌', description: 'AI-generated offer letter' },
    { stageName: 'Document Verification', icon: '🔍', description: 'Verify student documents' },
    { stageName: 'Joining Letter', icon: '📝', description: 'AI-generated joining instructions' },
    { stageName: 'Letter of Employment', icon: '🏆', description: 'Official employment confirmation letter' },
];

const PipelineBuilder = ({ stages, onStagesChange }) => {
    const toggleStage = (stageName) => {
        const idx = stages.findIndex(s => s.stageName === stageName);
        if (idx === -1) {
            const newStage = {
                stageId: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                stageName,
                order: stages.length + 1,
                isEnabled: true,
                isRequired: true
            };
            onStagesChange([...stages, newStage]);
        } else {
            onStagesChange(stages.filter(s => s.stageName !== stageName));
        }
    };

    const isEnabled = (stageName) => stages.some(s => s.stageName === stageName);

    const moveStage = (idx, dir) => {
        const newStages = [...stages];
        const target = idx + dir;
        if (target < 0 || target >= newStages.length) return;
        [newStages[idx], newStages[target]] = [newStages[target], newStages[idx]];
        onStagesChange(newStages.map((s, i) => ({ ...s, order: i + 1 })));
    };

    const toggleRequired = (idx) => {
        const newStages = [...stages];
        newStages[idx] = { ...newStages[idx], isRequired: !newStages[idx].isRequired };
        onStagesChange(newStages);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Available Stages — Click to Add</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_STAGES.map(stage => {
                        const active = isEnabled(stage.stageName);
                        return (
                            <button
                                key={stage.stageName}
                                type="button"
                                onClick={() => toggleStage(stage.stageName)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-medium text-left transition-all ${
                                    active
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <span className="text-base">{stage.icon}</span>
                                <div>
                                    <div>{stage.stageName}</div>
                                    {active && <div className="text-green-600 dark:text-green-400 text-xs">✓ Added</div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {stages.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Your Pipeline — Reorder stages as they appear to students ({stages.length} stages)
                    </h3>
                    <div className="space-y-2">
                        {stages.map((stage, idx) => {
                            const stageInfo = ALL_STAGES.find(s => s.stageName === stage.stageName);
                            return (
                                <div
                                    key={stage.stageId || idx}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group shadow-sm"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <button type="button" onClick={() => moveStage(idx, -1)} disabled={idx === 0}
                                            className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1}
                                            className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <span className="text-lg">{stageInfo?.icon || '📌'}</span>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.stageName}</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{stageInfo?.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleRequired(idx)}
                                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                                            stage.isRequired
                                                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                                : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {stage.isRequired ? 'Required' : 'Optional'}
                                    </button>
                                    <button type="button" onClick={() => toggleStage(stage.stageName)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {stages.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <GitBranch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No pipeline stages added yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click stages above to add them to your recruitment process</p>
                </div>
            )}
        </div>
    );
};

export default PipelineBuilder;
