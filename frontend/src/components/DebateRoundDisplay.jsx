/**
 * DebateRoundDisplay Component
 * Displays a single round of debate with real-time AI responses
 * - Collapsible per AI with streaming support
 * - Shows OneSeek analysis inline
 * - Cleaner, more organized presentation
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function DebateRoundDisplay({ round, aiData, isActive = false }) {
  const [expandedAIs, setExpandedAIs] = useState(new Set());

  const toggleAI = (aiName) => {
    const newExpanded = new Set(expandedAIs);
    if (newExpanded.has(aiName)) {
      newExpanded.delete(aiName);
    } else {
      newExpanded.add(aiName);
    }
    setExpandedAIs(newExpanded);
  };

  // AI display order
  const aiOrder = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek'];
  
  // Get all AIs that have data in this round
  const availableAIs = aiOrder.filter(ai => aiData && aiData[ai]);

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border-2 ${isActive ? 'border-[#00d9ff]' : 'border-[#2d2d44]'} p-4 mb-4 ${isActive ? 'animate-fadeIn' : ''}`}>
      {/* Round Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl font-bold text-[#00d9ff]">🎤 Runda {round}</span>
        {isActive && (
          <span className="text-sm text-[#ffa500] animate-pulse">
            ● Pågår...
          </span>
        )}
        <span className="text-xs text-[#666] ml-auto">
          {availableAIs.length} AI-modeller
        </span>
      </div>

      {/* AI Responses */}
      <div className="space-y-3">
        {availableAIs.map(aiName => {
          const ai = aiData[aiName];
          const isExpanded = expandedAIs.has(aiName);
          const hasContent = ai.text && ai.text.length > 0;
          const isOneSeek = aiName === 'oneseek';

          return (
            <div 
              key={aiName}
              className={`rounded-lg border overflow-hidden transition-all ${
                isOneSeek 
                  ? 'border-[#00d9ff] bg-[#1a1a3e]' 
                  : 'border-[#3a3a54] bg-[#242438]'
              }`}
            >
              {/* AI Header - Clickable */}
              <button
                onClick={() => hasContent && toggleAI(aiName)}
                disabled={!hasContent}
                className={`w-full p-3 flex items-center justify-between transition-colors ${
                  hasContent ? 'hover:bg-[#2a2a4e] cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{isOneSeek ? '🤖' : '🔷'}</span>
                  <span className={`font-bold ${isOneSeek ? 'text-[#00d9ff]' : 'text-white'}`}>
                    {aiName.toUpperCase()}
                  </span>
                  {ai.model && (
                    <span className="text-xs text-[#888]">{ai.model}</span>
                  )}
                  {ai.isStreaming && (
                    <span className="text-xs text-[#0f0] animate-pulse flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-[#0f0] rounded-full"></span>
                      Streamar...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ai.reasoning && (
                    <span className="text-xs text-[#00d9ff]" title="Har analys">💭</span>
                  )}
                  {ai.insights && ai.insights.length > 0 && (
                    <span className="text-xs text-[#ffa500]">💡 {ai.insights.length}</span>
                  )}
                  {hasContent && (
                    <svg 
                      className={`w-4 h-4 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* AI Content - Expandable */}
              {isExpanded && hasContent && (
                <div className="px-4 pb-4 pt-2 border-t border-[#3a3a54]">
                  {/* Main Response with Markdown */}
                  <div className="text-[#e0e0e0] prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{ai.text}</ReactMarkdown>
                  </div>

                  {/* OneSeek's Reasoning/Analysis */}
                  {ai.reasoning && (
                    <div className="mt-3 p-3 bg-[#1a1a2e] rounded-lg border-l-4 border-[#00d9ff]">
                      <div className="text-xs text-[#00d9ff] font-bold mb-2 flex items-center gap-2">
                        <span>💭</span>
                        <span>ONESEEK ANALYS</span>
                      </div>
                      <div className="text-sm text-[#c0c0c0] italic leading-relaxed">
                        {ai.reasoning}
                      </div>
                    </div>
                  )}

                  {/* Live Insights */}
                  {ai.insights && ai.insights.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {ai.insights.map((insight, idx) => (
                        <div 
                          key={idx}
                          className="text-xs text-[#ffa500] bg-[#2a2a1e] px-3 py-2 rounded-md"
                        >
                          💡 {insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round Summary (if available) */}
      {aiData.summary && (
        <div className="mt-4 p-4 bg-[#2a2a1e] rounded-lg border-l-4 border-[#ffa500]">
          <div className="text-sm text-[#ffa500] font-bold mb-2 flex items-center gap-2">
            <span>📚</span>
            <span>RUNDSAMMANFATTNING</span>
          </div>
          <div className="text-sm text-[#e0e0e0] prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{aiData.summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
