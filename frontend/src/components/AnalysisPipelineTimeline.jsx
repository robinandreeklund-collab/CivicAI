/**
 * AnalysisPipelineTimeline Component
 * 
 * Visualizes the complete analysis pipeline timeline showing:
 * - Each analysis step in chronological order
 * - Step metadata (model, version, method)
 * - Processing times
 * - Interactive step details
 */

import React, { useState } from 'react';

const AnalysisPipelineTimeline = ({ pipelineAnalysis }) => {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!pipelineAnalysis || !pipelineAnalysis.timeline) {
    return null;
  }

  const { timeline, metadata } = pipelineAnalysis;

  const toggleStep = (index) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  // Step icon mapping
  const getStepIcon = (stepName) => {
    const icons = {
      preprocessing: '📝',
      bias_detection: '🎯',
      sentence_bias_analysis: '🔍',
      sentiment_analysis: '💭',
      ideological_classification: '🏛️',
      tone_analysis: '🎵',
      fact_checking: '✅',
      enhanced_nlp: '🧠',
    };
    return icons[stepName] || '⚙️';
  };

  // Step name formatting
  const formatStepName = (stepName) => {
    const names = {
      preprocessing: 'Förbearbetning',
      bias_detection: 'Biasdetektion',
      sentence_bias_analysis: 'Meningsnivå Bias',
      sentiment_analysis: 'Sentimentanalys',
      ideological_classification: 'Ideologisk Klassificering',
      tone_analysis: 'Tonanalys',
      fact_checking: 'Faktakontroll',
      enhanced_nlp: 'Utökad NLP-analys',
    };
    return names[stepName] || stepName.replace(/_/g, ' ');
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>⏱️</span>
          Analys Pipeline Timeline
        </h3>
        <div className="text-sm text-gray-400">
          Total tid: {metadata.totalProcessingTimeMs}ms
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>

        {/* Timeline items */}
        <div className="space-y-4">
          {timeline.map((step, index) => (
            <div key={index} className="relative">
              {/* Timeline dot */}
              <div className="absolute left-4 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-800 z-10"></div>

              {/* Step card */}
              <div className="ml-12 bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-colors">
                {/* Step header */}
                <button
                  onClick={() => toggleStep(index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStepIcon(step.step)}</span>
                    <div>
                      <h4 className="text-white font-medium">
                        {formatStepName(step.step)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {step.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      {step.durationMs}ms
                    </span>
                    <span className={`transform transition-transform ${expandedStep === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedStep === index && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Version:</span>
                        <span className="ml-2 text-white">{step.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Metod:</span>
                        <span className="ml-2 text-white">{step.method}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Start:</span>
                        <span className="ml-2 text-white">
                          {new Date(step.startTime).toLocaleTimeString('sv-SE')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Slut:</span>
                        <span className="ml-2 text-white">
                          {new Date(step.endTime).toLocaleTimeString('sv-SE')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {timeline.length}
            </div>
            <div className="text-sm text-gray-400">Steg</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {metadata.totalProcessingTimeMs}ms
            </div>
            <div className="text-sm text-gray-400">Total tid</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(metadata.totalProcessingTimeMs / timeline.length)}ms
            </div>
            <div className="text-sm text-gray-400">Medeltid/steg</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPipelineTimeline;
