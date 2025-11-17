/**
 * DebateRoundDisplay Component
 * Displays a single round of debate with agent responses - live chat style with collapse/expand
 */

import { useState } from 'react';

export default function DebateRoundDisplay({ round, isLatest = false }) {
  const [isExpanded, setIsExpanded] = useState(false); // All rounds minimized by default

  return (
    <div className={`bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] ${isLatest ? 'animate-fadeIn' : ''}`}>
      {/* Round header - always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#151515] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#2a2a2a] text-[#888] rounded text-xs font-medium">
            Runda {round.roundNumber}
          </div>
          <span className="text-xs text-[#666]">
            {new Date(round.timestamp).toLocaleTimeString('sv-SE')}
          </span>
          <span className="text-xs text-[#666]">
            ({round.responses.length} svar)
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Round content - collapsible */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {round.responses.map((response, idx) => (
            <div 
              key={idx}
              className={`rounded-lg border p-2.5 transition-all duration-300 ${
                response.error 
                  ? 'border-[#888] bg-[#151515]' 
                  : 'border-[#2a2a2a] bg-[#151515] hover:bg-[#1a1a1a]'
              } ${isLatest ? 'animate-slideIn' : ''}`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="px-2 py-0.5 bg-[#2a2a2a] text-[#888] rounded text-xs font-medium">
                  {response.agent}
                </div>
                {response.error && (
                  <span className="text-xs text-[#888]">Fel</span>
                )}
              </div>
              <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap">
                {response.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
