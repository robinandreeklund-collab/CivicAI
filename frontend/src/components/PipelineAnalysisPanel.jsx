/**
 * PipelineAnalysisPanel Component
 * 
 * Comprehensive panel that displays all pipeline analysis results:
 * - Timeline visualization
 * - Sentiment analysis
 * - Ideological classification
 * - Preprocessing results
 * - Quality indicators
 * - Risk flags
 * - Detailed processing steps with library information
 */

import React, { useState } from 'react';
import AnalysisPipelineTimeline from './AnalysisPipelineTimeline';
import SentimentAnalysisPanel from './SentimentAnalysisPanel';
import IdeologicalClassificationPanel from './IdeologicalClassificationPanel';
import ProcessingStepCard from './ProcessingStepCard';

const PipelineAnalysisPanel = ({ pipelineAnalysis }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!pipelineAnalysis) {
    return null;
  }

  const {
    preprocessing,
    sentimentAnalysis,
    ideologicalClassification,
    insights,
    summary,
    timeline,
  } = pipelineAnalysis;

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'processing', label: 'Processering', icon: '⚙️' },
    { id: 'sentiment', label: 'Sentiment', icon: '💭' },
    { id: 'ideology', label: 'Ideologi', icon: '🏛️' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'details', label: 'Detaljer', icon: '🔍' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-civic-dark-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-civic-gray-400'
                : 'text-civic-gray-500 hover:text-civic-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📄</span>
                Sammanfattning
              </h3>
              <p className="text-civic-gray-300 leading-relaxed">{summary.text}</p>
            </div>

            {/* Quality Indicators */}
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>⭐</span>
                Kvalitetsindikatorer
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(insights.qualityIndicators).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-civic-gray-400 capitalize">
                        {key === 'objectivity' ? 'Objektivitet' :
                         key === 'clarity' ? 'Tydlighet' :
                         key === 'factuality' ? 'Faktabaserad' :
                         key === 'neutrality' ? 'Neutralitet' : key}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-civic-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          value >= 0.7 ? 'bg-civic-gray-400' :
                          value >= 0.4 ? 'bg-civic-gray-500' :
                          'bg-civic-gray-600'
                        }`}
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Flags */}
            {Object.values(insights.riskFlags).some(flag => flag) && (
              <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
                <h3 className="text-lg font-semibold text-civic-gray-300 mb-4 flex items-center gap-2">
                  <span>🚨</span>
                  Riskflaggor
                </h3>
                <div className="space-y-2">
                  {insights.riskFlags.highBias && (
                    <div className="flex items-center gap-2 text-sm text-civic-gray-300">
                      <span>⚠️</span>
                      Hög bias detekterad
                    </div>
                  )}
                  {insights.riskFlags.highSubjectivity && (
                    <div className="flex items-center gap-2 text-sm text-civic-gray-400">
                      <span>⚠️</span>
                      Hög subjektivitet
                    </div>
                  )}
                  {insights.riskFlags.hasAggression && (
                    <div className="flex items-center gap-2 text-sm text-civic-gray-300">
                      <span>⚠️</span>
                      Aggressivt språk
                    </div>
                  )}
                  {insights.riskFlags.loadedLanguage && (
                    <div className="flex items-center gap-2 text-sm text-civic-gray-400">
                      <span>⚠️</span>
                      Laddat språk
                    </div>
                  )}
                  {insights.riskFlags.manyUnverifiedClaims && (
                    <div className="flex items-center gap-2 text-sm text-civic-gray-400">
                      <span>⚠️</span>
                      Många overifierade påståenden
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Metrics */}
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📏</span>
                Textmätningar
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-civic-gray-300">
                    {insights.textMetrics.wordCount}
                  </div>
                  <div className="text-sm text-civic-gray-500">Ord</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-civic-gray-300">
                    {insights.textMetrics.sentenceCount}
                  </div>
                  <div className="text-sm text-civic-gray-500">Meningar</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-civic-gray-300">
                    {insights.textMetrics.avgWordsPerSentence}
                  </div>
                  <div className="text-sm text-civic-gray-500">Ord/mening</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Tab - NEW: Detailed processing steps */}
        {activeTab === 'processing' && (
          <div className="space-y-4">
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Processningssteg
              </h3>
              <p className="text-sm text-civic-gray-400 mb-4">
                Detaljerad information om varje analyssteg, bibliotek som används och identifierade nyckelord.
              </p>
              
              {timeline && timeline.length > 0 ? (
                <div className="space-y-3">
                  {timeline.map((step, index) => {
                    // Find corresponding data for this step
                    const stepDataMap = {
                      'bias_detection_javascript': pipelineAnalysis.biasAnalysis,
                      'sentence_bias_analysis': pipelineAnalysis.sentenceBiasAnalysis,
                      'sentiment_analysis_javascript': pipelineAnalysis.sentimentAnalysis,
                      'ideology_classification_javascript': pipelineAnalysis.ideologicalClassification,
                      'preprocessing_javascript': pipelineAnalysis.preprocessing,
                    };
                    
                    const stepData = stepDataMap[step.step];
                    
                    return (
                      <ProcessingStepCard
                        key={index}
                        step={step}
                        stepData={stepData}
                        stepIndex={index}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-civic-gray-400">
                  Ingen timeline-data tillgänglig
                </div>
              )}

              {/* Python ML Statistics */}
              {pipelineAnalysis.pythonMLStats && (
                <div className="mt-6 pt-4 border-t border-civic-dark-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Python ML Statistik</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-civic-gray-300">
                        {pipelineAnalysis.pythonMLStats.pythonSteps || 0}
                      </div>
                      <div className="text-xs text-civic-gray-400">Python ML steg</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-civic-gray-300">
                        {pipelineAnalysis.pythonMLStats.javascriptSteps || 0}
                      </div>
                      <div className="text-xs text-civic-gray-400">JavaScript steg</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-civic-gray-300">
                        {pipelineAnalysis.pythonMLStats.toolsUsed?.length || 0}
                      </div>
                      <div className="text-xs text-civic-gray-400">Unika verktyg</div>
                    </div>
                  </div>
                  
                  {pipelineAnalysis.pythonMLStats.toolsUsed && pipelineAnalysis.pythonMLStats.toolsUsed.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-civic-gray-400 mb-2">Använda verktyg:</div>
                      <div className="flex flex-wrap gap-2">
                        {pipelineAnalysis.pythonMLStats.toolsUsed.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-civic-dark-900/50 text-civic-gray-300 text-xs rounded border border-civic-dark-700"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <SentimentAnalysisPanel sentimentData={sentimentAnalysis} />
        )}

        {/* Ideology Tab */}
        {activeTab === 'ideology' && (
          <IdeologicalClassificationPanel ideologyData={ideologicalClassification} />
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <AnalysisPipelineTimeline pipelineAnalysis={pipelineAnalysis} />
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Preprocessing Details */}
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📝</span>
                Förbearbetning
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Subjektivitet:</span>
                  <span className="text-white">
                    {Math.round(preprocessing.subjectivityAnalysis.subjectivityScore * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Brus:</span>
                  <span className="text-white">
                    {preprocessing.noiseAnalysis.noisePercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Laddade uttryck:</span>
                  <span className="text-white">
                    {preprocessing.loadedExpressions.count}
                  </span>
                </div>
                {preprocessing.loadedExpressions.count > 0 && (
                  <div className="mt-2 pt-2 border-t border-civic-dark-700">
                    <div className="text-xs text-civic-gray-400 mb-2">Exempel på laddade uttryck:</div>
                    <div className="space-y-1">
                      {preprocessing.loadedExpressions.loadedExpressions.slice(0, 3).map((expr, index) => (
                        <div key={index} className="bg-civic-dark-900/50 rounded p-2 text-xs">
                          <span className="text-civic-gray-300">{expr.expression}</span>
                          <span className="text-civic-gray-500 ml-2">({expr.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emotional Profile */}
            <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🎭</span>
                Känslomässig Profil
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Övergripande ton:</span>
                  <span className="text-white">{insights.emotionalProfile.overallTone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Sentiment:</span>
                  <span className="text-white">{insights.emotionalProfile.sentimentClassification}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-civic-gray-400">Intensitet:</span>
                  <span className="text-white">{insights.emotionalProfile.sentimentIntensity}</span>
                </div>
                {insights.emotionalProfile.isSarcastic && (
                  <div className="flex items-center gap-2 text-civic-gray-300">
                    <span>😏</span>
                    <span>Sarkasm detekterad</span>
                  </div>
                )}
                {insights.emotionalProfile.isAggressive && (
                  <div className="flex items-center gap-2 text-civic-gray-300">
                    <span>😠</span>
                    <span>Aggression detekterad</span>
                  </div>
                )}
                {insights.emotionalProfile.isEmpathetic && (
                  <div className="flex items-center gap-2 text-civic-gray-300">
                    <span>💚</span>
                    <span>Empati detekterad</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineAnalysisPanel;
