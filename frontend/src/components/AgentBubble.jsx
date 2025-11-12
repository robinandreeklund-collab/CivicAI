import { useState, useEffect } from 'react';

/**
 * AgentBubble Component
 * Displays an AI model's response with modern design, animations, and visual effects
 */
export default function AgentBubble({ agent, response, metadata, index = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Staggered animation entrance
    const timer = setTimeout(() => setIsVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  // Color schemes for different AI agents with gradients
  const agentThemes = {
    'gpt-3.5': {
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/40',
      glow: 'shadow-blue-500/20',
      icon: '🤖',
      accentColor: 'bg-blue-500',
    },
    'gemini': {
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/40',
      glow: 'shadow-purple-500/20',
      icon: '✨',
      accentColor: 'bg-purple-500',
    },
  };

  const agentNames = {
    'gpt-3.5': 'GPT-3.5',
    'gemini': 'Gemini',
  };

  const theme = agentThemes[agent] || {
    gradient: 'from-gray-500/20 to-gray-600/20',
    border: 'border-gray-500/40',
    glow: 'shadow-gray-500/20',
    icon: '🔮',
    accentColor: 'bg-gray-500',
  };
  
  const displayName = agentNames[agent] || agent;

  return (
    <div 
      className={`
        agent-bubble relative overflow-hidden
        ${theme.border} ${theme.glow}
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
      
      {/* Animated shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Animated icon */}
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl ${theme.accentColor} flex items-center justify-center text-xl animate-bounce-slow`}>
                {theme.icon}
              </div>
              <div className={`absolute inset-0 rounded-xl ${theme.accentColor} opacity-20 blur-md animate-pulse-slow`}></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100 tracking-tight">{displayName}</h3>
              {metadata?.model && (
                <p className="text-xs text-gray-500 mt-0.5">{metadata.model}</p>
              )}
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            {metadata?.timestamp && (
              <span className="text-xs text-gray-500 px-3 py-1 rounded-full bg-civic-dark-700/50">
                {new Date(metadata.timestamp).toLocaleTimeString('sv-SE')}
              </span>
            )}
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${theme.accentColor} animate-pulse-slow`}></div>
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${theme.accentColor} opacity-50 blur-sm`}></div>
            </div>
          </div>
        </div>
        
        {/* Divider with gradient */}
        <div className={`h-px bg-gradient-to-r ${theme.gradient} mb-4`}></div>

        {/* Response text with typing effect appearance */}
        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap animate-fade-in-up">
          {response || (
            <div className="flex items-center space-x-2">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-gray-500 italic ml-2">Genererar svar...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`}></div>
    </div>
  );
}
