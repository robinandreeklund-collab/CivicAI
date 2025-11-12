import { useState, useEffect } from 'react';

/**
 * AgentBubble Component
 * Compact chat-style AI response bubbles
 */
export default function AgentBubble({ agent, response, metadata, index = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

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
  };

  const agentNames = {
    'gpt-3.5': 'GPT-3.5',
    'gemini': 'Gemini',
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
      <div className={`flex-1 ${theme.bg} backdrop-blur-sm border ${theme.border} rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-100">{displayName}</h3>
            <div className={`w-1.5 h-1.5 rounded-full ${theme.accentColor} animate-pulse`}></div>
          </div>
          {metadata?.timestamp && (
            <span className="text-xs text-gray-500">
              {new Date(metadata.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Response */}
        <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
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

        {/* Model info */}
        {metadata?.model && (
          <div className="mt-2 pt-2 border-t border-civic-dark-700/50">
            <span className="text-xs text-gray-500">
              {metadata.model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
