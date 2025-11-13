import { useState } from 'react';
import AgentBubble from './AgentBubble';

/**
 * CleanResponseCarousel Component
 * Ultra-minimal carousel interface for AI responses
 * Clean, modern, and uncluttered design for 10+ services
 */
export default function CleanResponseCarousel({ responses, question }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  const currentResponse = responses[currentIndex];
  const totalResponses = responses.length;

  // Agent theme mapping
  const agentThemes = {
    'gpt-3.5': { icon: '🤖', color: '#3b82f6' },
    'gemini': { icon: '✨', color: '#a855f7' },
    'deepseek': { icon: '🧠', color: '#06b6d4' },
    'claude': { icon: '🎭', color: '#f97316' },
    'llama': { icon: '🦙', color: '#22c55e' },
    'mistral': { icon: '🌪️', color: '#6366f1' },
    'palm': { icon: '🌴', color: '#10b981' },
    'cohere': { icon: '🔮', color: '#ec4899' },
    'anthropic': { icon: '🔬', color: '#14b8a6' },
    'openai': { icon: '⚡', color: '#eab308' },
  };

  const getAgentTheme = (agentId) => {
    return agentThemes[agentId] || { icon: '🤖', color: '#6b7280' };
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalResponses);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalResponses) % totalResponses);
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  const theme = getAgentTheme(currentResponse.agent);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Minimal Header with Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-civic-dark-800/30 rounded-xl backdrop-blur-sm border border-civic-dark-700">
        {/* Left: Current AI Info */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${theme.color}20` }}
          >
            {theme.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-200">
              {currentResponse.metadata?.model || currentResponse.agent}
            </div>
            <div className="text-xs text-gray-500">
              {currentIndex + 1} av {totalResponses} AI-svar
            </div>
          </div>
        </div>

        {/* Right: Navigation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg bg-civic-dark-700/50 hover:bg-civic-dark-600 text-gray-400 hover:text-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={totalResponses <= 1}
            title="Föregående"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 rounded-lg bg-civic-dark-700/50 hover:bg-civic-dark-600 text-gray-400 hover:text-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={totalResponses <= 1}
            title="Nästa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Response Content */}
      <div className="relative">
        <AgentBubble
          agent={currentResponse.agent}
          response={currentResponse.response}
          metadata={currentResponse.metadata}
          analysis={currentResponse.analysis}
          index={0}
        />
      </div>

      {/* Minimal Pagination Dots */}
      {totalResponses > 1 && (
        <div className="flex items-center justify-center space-x-2 py-2">
          {responses.map((resp, idx) => {
            const respTheme = getAgentTheme(resp.agent);
            return (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`
                  transition-all duration-300 rounded-full
                  ${idx === currentIndex 
                    ? 'w-8 h-2' 
                    : 'w-2 h-2 hover:scale-125'
                  }
                `}
                style={{
                  backgroundColor: idx === currentIndex ? respTheme.color : `${respTheme.color}40`,
                }}
                title={resp.metadata?.model || resp.agent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
