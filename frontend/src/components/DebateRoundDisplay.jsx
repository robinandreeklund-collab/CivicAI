/**
 * DebateRoundDisplay Component
 * Displays a single round of debate with real-time AI responses
 * - Collapsible per AI with streaming support
 * - Shows OneSeek analysis inline
 * - Cleaner, more organized presentation
 */

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function DebateRoundDisplay({ round, aiData, isActive = false }) {
  // Use dynamic turn order from round data if available, otherwise fall back to fixed order
  const turnOrder = aiData?.turnOrder || [];
  const defaultOrder = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek'];
  
  // AI display order - use turn order + oneseek at the end
  const aiOrder = turnOrder.length > 0 
    ? [...turnOrder, 'oneseek']  // Turn order from backend + OneSeek at end
    : defaultOrder;
  
  // Get all AIs that have data in this round
  const availableAIs = aiOrder.filter(ai => aiData && aiData[ai]);
  
  // Start with all available AIs expanded
  const [expandedAIs, setExpandedAIs] = useState(new Set(availableAIs));
  
  // Track if the entire round is expanded (minimize when complete)
  const [roundExpanded, setRoundExpanded] = useState(true);

  // Auto-expand AIs that are streaming or have new content
  useEffect(() => {
    const newExpanded = new Set(expandedAIs);
    availableAIs.forEach(ai => {
      if (aiData[ai] && (aiData[ai].isStreaming || aiData[ai].text)) {
        newExpanded.add(ai);
      }
    });
    setExpandedAIs(newExpanded);
  }, [aiData, availableAIs]);
  
  // Auto-minimize round when it's complete (not active)
  useEffect(() => {
    if (!isActive && aiData.summary) {
      // Round is complete, minimize it
      setRoundExpanded(false);
    }
  }, [isActive, aiData.summary]);

  const toggleAI = (aiName) => {
    const newExpanded = new Set(expandedAIs);
    if (newExpanded.has(aiName)) {
      newExpanded.delete(aiName);
    } else {
      newExpanded.add(aiName);
    }
    setExpandedAIs(newExpanded);
  };

  return (
    <div className={`bg-[#0a0a0a] rounded-lg border ${isActive ? 'border-[#333]' : 'border-[#1a1a1a]'} mb-3`}>
      {/* Round Header - Clickable to expand/collapse */}
      <button
        onClick={() => setRoundExpanded(!roundExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#888]">Runda {round}</span>
          {isActive && (
            <span className="text-xs text-[#666]">
              pågår...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {aiData.consensus !== undefined && !roundExpanded && (
            <span className="text-xs text-[#666]">
              Konsensus: {aiData.consensus}%
            </span>
          )}
          <span className="text-xs text-[#555]">
            {availableAIs.length} svar
          </span>
          <svg 
            className={`w-4 h-4 text-[#666] transition-transform ${roundExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* AI Responses - Only show if round is expanded */}
      {roundExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {availableAIs.map(aiName => {
            const ai = aiData[aiName];
            const isExpanded = expandedAIs.has(aiName);
            const hasContent = ai.text && ai.text.length > 0;
            const isOneSeek = aiName === 'oneseek';

            return (
              <div 
                key={aiName}
                className="rounded border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden"
              >
                {/* AI Header - Clickable */}
                <button
                  onClick={() => hasContent && toggleAI(aiName)}
                  disabled={!hasContent}
                  className={`w-full p-2 flex items-center justify-between transition-colors ${
                    hasContent ? 'hover:bg-[#111] cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#888]">
                      {aiName.toUpperCase()}
                    </span>
                    {ai.isStreaming && (
                      <span className="text-xs text-[#666]">
                        ...
                      </span>
                    )}
                  </div>
                  {hasContent && (
                    <svg 
                      className={`w-3 h-3 text-[#555] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* AI Content - Expandable */}
                {isExpanded && hasContent && (
                  <div className="px-3 pb-3 pt-1 border-t border-[#1a1a1a]">
                    {/* Main Response */}
                    <div className="text-sm text-[#888] leading-relaxed prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{ai.text}</ReactMarkdown>
                    </div>

                    {/* OneSeek's Reasoning - Only show for OneSeek's own answers */}
                    {isOneSeek && ai.reasoning && (
                      <div className="mt-3 pt-2 border-t border-[#1a1a1a]">
                        <div className="text-xs text-[#555] italic">
                          Resonemang: {ai.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Round Summary - Minimalist */}
          {aiData.summary && (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
              <div className="text-xs text-[#666] mb-2">
                Sammanfattning
              </div>
              <div className="text-xs text-[#888] leading-relaxed">
                <ReactMarkdown>{aiData.summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
