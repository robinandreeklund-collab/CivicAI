import { useState } from 'react';

/**
 * ChatViewConcept3: Grid-Based Multi-Agent Dashboard View
 * 
 * Design Philosophy:
 * - Dashboard-style layout with grid of agent responses
 * - Top navigation bar with logo, filters, and controls
 * - Each agent gets its own card in a responsive grid
 * - Central synthesis panel showing consensus
 * - Quick-access toolbar for common actions
 */

export default function ChatViewConcept3() {
  const [viewMode, setViewMode] = useState('grid'); // grid, list, focus
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showSynthesis, setShowSynthesis] = useState(true);

  // Mock agent responses
  const agentResponses = [
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5',
      icon: '🤖',
      color: 'blue',
      response: 'Elektrifiering av transportsektorn är kritisk. Vi behöver kraftigt ökad laddinfrastruktur.',
      confidence: 88,
      sentiment: 'neutral',
      bias: 'low',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '✨',
      color: 'purple',
      response: 'Förnybar energi måste prioriteras. Sol- och vindkraft bör subventioneras ytterligare.',
      confidence: 92,
      sentiment: 'positive',
      bias: 'low',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      color: 'cyan',
      response: 'Teknisk innovation i energilagring och smart elnät är fundamentalt för omställningen.',
      confidence: 85,
      sentiment: 'neutral',
      bias: 'low',
    },
    {
      id: 'grok',
      name: 'Grok',
      icon: '⚡',
      color: 'yellow',
      response: 'Kärnkraft måste vara del av lösningen för stabil basproduktion under omställningen.',
      confidence: 78,
      sentiment: 'neutral',
      bias: 'medium',
    },
    {
      id: 'qwen',
      name: 'Qwen',
      icon: '🌟',
      color: 'green',
      response: 'Kombination av alla förnybara källor plus energieffektivisering ger bäst resultat.',
      confidence: 90,
      sentiment: 'positive',
      bias: 'low',
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🎭',
      color: 'orange',
      response: 'Systemtänkande krävs - integration mellan transport, energi och industri är nyckeln.',
      confidence: 87,
      sentiment: 'neutral',
      bias: 'low',
    },
  ];

  const synthesis = {
    title: 'Konsensusanalys',
    summary: 'Alla modeller överens om behovet av elektrifiering och förnybar energi. Viss oenighet om kärnkraftens roll.',
    keyPoints: [
      'Elektrifiering av transport (6/6 modeller)',
      'Utbyggnad förnybar energi (6/6 modeller)',
      'Energilagring och smart elnät (5/6 modeller)',
      'Kärnkraft som bas (2/6 modeller)',
    ],
    confidence: 87,
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      cyan: 'from-cyan-500 to-cyan-600',
      yellow: 'from-yellow-500 to-yellow-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        {/* Logo */}
        <div 
          className="text-xl font-bold"
          style={{
            background: 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          OneSeek.AI
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                viewMode === 'list' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('focus')}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                viewMode === 'focus' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
              }`}
            >
              Fokus
            </button>
          </div>

          <button
            onClick={() => setShowSynthesis(!showSynthesis)}
            className={`px-4 py-2 rounded-lg text-xs transition-colors ${
              showSynthesis ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'bg-[#151515] border border-[#1a1a1a] text-[#666]'
            }`}
          >
            Syntes
          </button>

          <button className="p-2 rounded-lg bg-[#151515] border border-[#1a1a1a] text-[#666] hover:text-[#888]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Question Section */}
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
            <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Din fråga</div>
            <h2 className="text-xl text-[#e7e7e7] font-light">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Synthesis Panel */}
          {showSynthesis && (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">
                  🎯
                </div>
                <div>
                  <div className="text-sm text-[#e7e7e7] font-medium">{synthesis.title}</div>
                  <div className="text-xs text-[#666]">Tillförlitlighet: {synthesis.confidence}%</div>
                </div>
              </div>
              
              <p className="text-[#c0c0c0] mb-4 leading-relaxed">{synthesis.summary}</p>
              
              <div className="space-y-2">
                {synthesis.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-[#888]">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Responses Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentResponses.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`bg-[#151515] border rounded-xl p-5 cursor-pointer transition-all ${
                    selectedAgent === agent.id ? 'border-[#3a3a3a] shadow-lg' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                  }`}
                >
                  {/* Agent Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getColorClass(agent.color)} rounded-lg flex items-center justify-center text-2xl`}>
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-[#e7e7e7] font-medium">{agent.name}</div>
                      <div className="text-xs text-[#666]">Tillförlitlighet: {agent.confidence}%</div>
                    </div>
                  </div>

                  {/* Response */}
                  <p className="text-sm text-[#c0c0c0] leading-relaxed mb-4">
                    {agent.response}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[#1a1a1a]">
                    <div className={`px-2 py-1 rounded text-xs ${
                      agent.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                      agent.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {agent.sentiment}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      agent.bias === 'low' ? 'bg-green-500/20 text-green-400' :
                      agent.bias === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Bias: {agent.bias}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {agentResponses.map(agent => (
                <div key={agent.id} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getColorClass(agent.color)} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-[#e7e7e7] font-medium">{agent.name}</div>
                        <div className="text-xs text-[#666]">{agent.confidence}% tillförlitlig</div>
                      </div>
                      <p className="text-sm text-[#c0c0c0] leading-relaxed">{agent.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Focus View */}
          {viewMode === 'focus' && (
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-xl text-[#e7e7e7] font-medium">GPT-3.5 Turbo</h3>
                    <div className="text-sm text-[#666]">88% tillförlitlighet • Neutral ton • Låg bias</div>
                  </div>
                </div>
                <div className="text-[#c0c0c0] leading-relaxed text-lg">
                  {agentResponses[0].response}
                </div>
                <div className="mt-6 flex gap-2">
                  {agentResponses.slice(1).map(agent => (
                    <button
                      key={agent.id}
                      className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-xs text-[#888] transition-colors"
                    >
                      {agent.icon} {agent.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input Bar */}
      <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] p-6">
        <div className="max-w-7xl mx-auto flex gap-3">
          <input
            type="text"
            placeholder="Ställ en ny fråga eller förfina analysen..."
            className="flex-1 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
          />
          <button className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-[#e7e7e7] transition-colors">
            Analysera
          </button>
        </div>
      </div>
    </div>
  );
}
