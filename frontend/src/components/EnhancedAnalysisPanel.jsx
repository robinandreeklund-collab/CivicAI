import { useState } from 'react';
import ProvenanceTag from './ProvenanceTag';

/**
 * EnhancedAnalysisPanel Component
 * Displays data-rich enhanced analysis from NLP processors
 * Shows emotion, topics, intent, fact/opinion, entities, argumentation
 */
export default function EnhancedAnalysisPanel({ enhancedAnalysis, agentName }) {
  const [expandedSections, setExpandedSections] = useState({
    emotion: true,
    topics: true,
    intent: false,
    factOpinion: false,
    entities: false,
    argumentation: true,
    counterpoints: false,
  });

  if (!enhancedAnalysis) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const emotionColors = {
    joy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    anger: 'bg-red-500/20 text-red-300 border-red-500/30',
    sadness: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    fear: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    surprise: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    disgust: 'bg-green-500/20 text-green-300 border-green-500/30',
    neutral: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const intentIcons = {
    task: '📋',
    opinion: '💭',
    question: '❓',
    statement: '📢',
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-civic-gray-400">Utökad Analys</h4>
        <span className="text-xs text-civic-gray-600">
          {enhancedAnalysis.metadata?.wordCount || 0} ord
        </span>
      </div>

      {/* Emotion Analysis */}
      {enhancedAnalysis.emotion && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('emotion')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">😊</span>
              <span className="text-sm font-medium text-civic-gray-300">Emotionell Ton</span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.emotion ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.emotion && (
            <div className="px-4 pb-3 space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${emotionColors[enhancedAnalysis.emotion.primary]}`}>
                <span className="font-medium capitalize">{enhancedAnalysis.emotion.primary}</span>
                <span className="text-[10px] opacity-70">
                  {Math.round(enhancedAnalysis.emotion.confidence * 100)}%
                </span>
              </div>
              
              {enhancedAnalysis.emotion.allEmotions && enhancedAnalysis.emotion.allEmotions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {enhancedAnalysis.emotion.allEmotions.map((emotion, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 bg-civic-dark-800 text-civic-gray-400 text-[10px] rounded"
                    >
                      {emotion.emotion} ({emotion.intensity})
                    </span>
                  ))}
                </div>
              )}
              
              <ProvenanceTag provenance={enhancedAnalysis.emotion.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Topics */}
      {enhancedAnalysis.topics && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('topics')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <span className="text-sm font-medium text-civic-gray-300">
                Ämnen & Nyckelord ({enhancedAnalysis.topics.mainTopics?.length || 0})
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.topics ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.topics && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {enhancedAnalysis.topics.mainTopics?.map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 bg-civic-gray-500/20 text-civic-gray-300 text-xs rounded-full border border-civic-gray-500/30"
                  >
                    {topic.topic} <span className="text-[10px] opacity-60">×{topic.frequency}</span>
                  </span>
                ))}
              </div>
              
              <ProvenanceTag provenance={enhancedAnalysis.topics.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Intent Classification */}
      {enhancedAnalysis.intent && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('intent')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{intentIcons[enhancedAnalysis.intent.primary] || '📄'}</span>
              <span className="text-sm font-medium text-civic-gray-300">Syfte</span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.intent ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.intent && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-civic-gray-500/20 text-civic-gray-300 text-sm rounded-full capitalize">
                  {enhancedAnalysis.intent.primary}
                </span>
                <span className="text-xs text-civic-gray-600">
                  {Math.round(enhancedAnalysis.intent.confidence * 100)}% säkerhet
                </span>
              </div>
              
              <ProvenanceTag provenance={enhancedAnalysis.intent.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Fact vs Opinion */}
      {enhancedAnalysis.factOpinion && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('factOpinion')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <span className="text-sm font-medium text-civic-gray-300">Fakta vs Åsikter</span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.factOpinion ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.factOpinion && (
            <div className="px-4 pb-3 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-civic-dark-800/50 rounded p-2">
                  <div className="text-xs text-civic-gray-500 mb-1">Fakta</div>
                  <div className="text-lg font-medium text-green-400">
                    {enhancedAnalysis.factOpinion.summary?.factPercentage || 0}%
                  </div>
                </div>
                <div className="bg-civic-dark-800/50 rounded p-2">
                  <div className="text-xs text-civic-gray-500 mb-1">Åsikter</div>
                  <div className="text-lg font-medium text-blue-400">
                    {enhancedAnalysis.factOpinion.summary?.opinionPercentage || 0}%
                  </div>
                </div>
                <div className="bg-civic-dark-800/50 rounded p-2">
                  <div className="text-xs text-civic-gray-500 mb-1">Blandat</div>
                  <div className="text-lg font-medium text-gray-400">
                    {enhancedAnalysis.factOpinion.summary?.mixedPercentage || 0}%
                  </div>
                </div>
              </div>
              
              <ProvenanceTag provenance={enhancedAnalysis.factOpinion.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Entities */}
      {enhancedAnalysis.entities && enhancedAnalysis.entities.summary?.total > 0 && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('entities')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-sm font-medium text-civic-gray-300">
                Entiteter ({enhancedAnalysis.entities.summary.total})
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.entities ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.entities && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {enhancedAnalysis.entities.entities?.slice(0, 10).map((entity, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-civic-dark-800 text-civic-gray-300 text-xs rounded border border-civic-dark-600"
                    title={`Roll: ${entity.role}`}
                  >
                    {entity.entity}
                    <span className="ml-1 text-[10px] text-civic-gray-500">
                      ({entity.type})
                    </span>
                  </span>
                ))}
              </div>
              
              <ProvenanceTag provenance={enhancedAnalysis.entities.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Argumentation (Huvudpunkter) */}
      {enhancedAnalysis.argumentation && enhancedAnalysis.argumentation.huvudpunkter?.length > 0 && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('argumentation')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📌</span>
              <span className="text-sm font-medium text-civic-gray-300">
                Huvudpunkter ({enhancedAnalysis.argumentation.huvudpunkter.length})
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.argumentation ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.argumentation && (
            <div className="px-4 pb-3 space-y-2">
              <div className="space-y-2">
                {enhancedAnalysis.argumentation.huvudpunkter.map((point, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-civic-gray-500 text-sm mt-0.5">{idx + 1}.</span>
                    <p className="text-sm text-civic-gray-300 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
              
              {enhancedAnalysis.argumentation.supportingArguments?.length > 0 && (
                <div className="mt-3 pt-2 border-t border-civic-dark-700">
                  <div className="text-xs text-civic-gray-500 mb-2">Stödargument:</div>
                  <div className="space-y-1.5">
                    {enhancedAnalysis.argumentation.supportingArguments.map((arg, idx) => (
                      <p key={idx} className="text-xs text-civic-gray-400 leading-relaxed">• {arg}</p>
                    ))}
                  </div>
                </div>
              )}
              
              <ProvenanceTag provenance={enhancedAnalysis.argumentation.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Counterpoints */}
      {enhancedAnalysis.counterpoints && enhancedAnalysis.counterpoints.count > 0 && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700">
          <button
            onClick={() => toggleSection('counterpoints')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-800/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">↔️</span>
              <span className="text-sm font-medium text-civic-gray-300">
                Motargument ({enhancedAnalysis.counterpoints.count})
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-civic-gray-500 transition-transform ${expandedSections.counterpoints ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.counterpoints && (
            <div className="px-4 pb-3 space-y-2">
              <div className="space-y-2">
                {enhancedAnalysis.counterpoints.counterpoints?.map((cp, idx) => (
                  <div key={idx} className="bg-civic-dark-800/50 rounded p-2">
                    <div className="text-xs text-orange-400 mb-1">Markör: "{cp.marker}"</div>
                    <p className="text-sm text-civic-gray-300">{cp.text}</p>
                  </div>
                ))}
              </div>
              
              <ProvenanceTag provenance={enhancedAnalysis.counterpoints.provenance} />
            </div>
          )}
        </div>
      )}

      {/* Response Time */}
      {enhancedAnalysis.responseTime && (
        <div className="text-xs text-civic-gray-600 text-right">
          Svarstid: {enhancedAnalysis.responseTime.responseTimeSec}s
        </div>
      )}
    </div>
  );
}
