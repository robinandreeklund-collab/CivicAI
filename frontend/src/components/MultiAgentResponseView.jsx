import { useState } from 'react';
import AgentBubble from './AgentBubble';

/**
 * MultiAgentResponseView Component
 * Modern, scalable interface for displaying responses from multiple AI services
 * Supports both tabbed and grid views for optimal clarity with 10+ services
 */
export default function MultiAgentResponseView({ responses, question }) {
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' or 'grid'
  const [activeTab, setActiveTab] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  if (!responses || responses.length === 0) {
    return null;
  }

  // Agent theme mapping
  const agentThemes = {
    'gpt-3.5': { icon: '🤖', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
    'gemini': { icon: '✨', color: 'purple', gradient: 'from-purple-500 to-purple-600' },
    'deepseek': { icon: '🧠', color: 'cyan', gradient: 'from-cyan-500 to-cyan-600' },
    'claude': { icon: '🎭', color: 'orange', gradient: 'from-orange-500 to-orange-600' },
    'llama': { icon: '🦙', color: 'green', gradient: 'from-green-500 to-green-600' },
    'mistral': { icon: '🌪️', color: 'indigo', gradient: 'from-indigo-500 to-indigo-600' },
    'palm': { icon: '🌴', color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
    'cohere': { icon: '🔮', color: 'pink', gradient: 'from-pink-500 to-pink-600' },
    'anthropic': { icon: '🔬', color: 'teal', gradient: 'from-teal-500 to-teal-600' },
    'openai': { icon: '⚡', color: 'yellow', gradient: 'from-yellow-500 to-yellow-600' },
  };

  const getAgentTheme = (agentId) => {
    return agentThemes[agentId] || { icon: '🤖', color: 'gray', gradient: 'from-gray-500 to-gray-600' };
  };


  // Tabbed View
  const TabsView = () => (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-2 pb-2">
            {responses.map((resp, idx) => {
              const theme = getAgentTheme(resp.agent);
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap
                    ${activeTab === idx
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg scale-105`
                      : 'bg-civic-dark-800/50 text-gray-400 hover:bg-civic-dark-700 hover:text-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{theme.icon}</span>
                  <span>{resp.metadata?.model || resp.agent}</span>
                  {resp.analysis?.confidence && (
                    <span className={`text-xs ${activeTab === idx ? 'text-white/80' : 'text-gray-500'}`}>
                      {Math.round(resp.analysis.confidence * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setViewMode('tabs')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'tabs' ? 'bg-blue-500 text-white' : 'bg-civic-dark-800 text-gray-400 hover:text-gray-300'
            }`}
            title="Tab View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-civic-dark-800 text-gray-400 hover:text-gray-300'
            }`}
            title="Grid View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Response */}
      <AgentBubble
        agent={responses[activeTab].agent}
        response={responses[activeTab].response}
        metadata={responses[activeTab].metadata}
        analysis={responses[activeTab].analysis}
        index={0}
      />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {responses.map((resp, idx) => {
          const theme = getAgentTheme(resp.agent);
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`
                p-3 rounded-xl transition-all duration-200
                ${activeTab === idx
                  ? `bg-gradient-to-br ${theme.gradient} text-white shadow-lg`
                  : 'bg-civic-dark-800/50 hover:bg-civic-dark-700 text-gray-400'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{theme.icon}</span>
                {resp.analysis?.confidence && (
                  <span className="text-xs font-semibold">
                    {Math.round(resp.analysis.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="text-xs font-medium truncate">
                {resp.metadata?.model || resp.agent}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Grid View
  const GridView = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          Alla {responses.length} AI-svar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('tabs')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'tabs' ? 'bg-blue-500 text-white' : 'bg-civic-dark-800 text-gray-400 hover:text-gray-300'
            }`}
            title="Tab View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-civic-dark-800 text-gray-400 hover:text-gray-300'
            }`}
            title="Grid View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid of Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {responses.map((resp, idx) => (
          <div key={idx} className="relative">
            <AgentBubble
              agent={resp.agent}
              response={resp.response}
              metadata={resp.metadata}
              analysis={resp.analysis}
              index={idx}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {viewMode === 'tabs' ? <TabsView /> : <GridView />}
    </div>
  );
}
