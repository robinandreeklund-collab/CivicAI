import { useState, useEffect } from 'react';
import ToneIndicator from './ToneIndicator';
import BiasIndicator from './BiasIndicator';
import FactCheckIndicator from './FactCheckIndicator';
import AgentProfileCard from './AgentProfileCard';

/**
 * AgentBubble Component
 * Compact chat-style AI response bubbles with Phase 2 analysis
 */
export default function AgentBubble({ agent, response, metadata, analysis, index = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(index === 0);

  useEffect(() => {
    // Staggered animation entrance
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  // Color schemes for different AI agents
  const agentThemes = {
    'gpt-3.5': {
      bg: 'bg-civic-dark-800/80',
      border: 'border-blue-500/30',
      icon: '🤖',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      accentColor: 'bg-blue-500',
    },
    'gemini': {
      bg: 'bg-civic-dark-800/80',
      border: 'border-purple-500/30',
      icon: '✨',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      accentColor: 'bg-purple-500',
    },
    'deepseek': {
      bg: 'bg-civic-dark-800/80',
      border: 'border-cyan-500/30',
      icon: '🧠',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      accentColor: 'bg-cyan-500',
    },
  };

  const agentNames = {
    'gpt-3.5': 'GPT-3.5',
    'gemini': 'Gemini',
    'deepseek': 'DeepSeek',
  };

  const theme = agentThemes[agent] || {
    bg: 'bg-civic-dark-800/80',
    border: 'border-gray-500/30',
    icon: '🔮',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400',
    accentColor: 'bg-gray-500',
  };
  
  const displayName = agentNames[agent] || agent;

  return (
    <div 
      className={`
        flex space-x-3 transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Agent Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.iconColor} text-lg`}>
        {theme.icon}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 ${theme.bg} backdrop-blur-sm border ${theme.border} rounded-2xl rounded-tl-sm shadow-lg overflow-hidden`}>
        {/* Header - Always visible, clickable to expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-civic-dark-700/30 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-100">{displayName}</h3>
            <div className={`w-1.5 h-1.5 rounded-full ${theme.accentColor} animate-pulse`}></div>
          </div>
          <div className="flex items-center space-x-2">
            {metadata?.timestamp && (
              <span className="text-xs text-gray-500">
                {new Date(metadata.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 pb-3 animate-fade-in">
            {/* Response */}
            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {response || (
                <div className="flex items-center space-x-2 text-gray-500 italic">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="text-xs">Genererar svar...</span>
                </div>
              )}
            </div>

            {/* Phase 2: Analysis Section */}
            {analysis && (
              <div className="mt-3 pt-3 border-t border-civic-dark-700/50 space-y-3">
                {/* Tone Analysis */}
                {analysis.tone && <ToneIndicator toneAnalysis={analysis.tone} />}

                {/* Bias Detection */}
                {analysis.bias && <BiasIndicator biasAnalysis={analysis.bias} />}

                {/* Fact Checking */}
                {analysis.factCheck && <FactCheckIndicator factCheck={analysis.factCheck} />}

                {/* Agent Profile Toggle */}
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{showProfile ? 'Dölj' : 'Visa'} agentprofil</span>
                </button>

                {/* Agent Profile */}
                {showProfile && (
                  <div className="animate-fade-in">
                    <AgentProfileCard agent={agent} metadata={metadata} />
                  </div>
                )}
              </div>
            )}

            {/* Model info (shown if no analysis) */}
            {!analysis && metadata?.model && (
              <div className="mt-2 pt-2 border-t border-civic-dark-700/50">
                <span className="text-xs text-gray-500">
                  {metadata.model}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
