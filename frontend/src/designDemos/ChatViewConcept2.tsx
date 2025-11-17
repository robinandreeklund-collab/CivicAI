import { useState } from 'react';

/**
 * ChatViewConcept2: Timeline-Based History Sidebar with Agent Controls
 * 
 * Design Philosophy:
 * - Left sidebar with vertical timeline showing conversation flow
 * - Agent toggle controls integrated in sidebar
 * - Main chat area with source attribution inline
 * - Top bar with minimal branding and search
 * - Right panel for context-aware analysis details
 */

export default function ChatViewConcept2() {
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [activeAgents, setActiveAgents] = useState({
    'gpt-3.5': true,
    'gemini': true,
    'deepseek': true,
    'grok': false,
    'qwen': true,
  });
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  // Mock timeline data
  const timeline = [
    { id: 1, type: 'question', text: 'Klimatpolitiska åtgärder...', time: '14:32', active: true },
    { id: 2, type: 'processing', text: 'AI-analys pågår', time: '14:32', active: true },
    { id: 3, type: 'response', text: 'Svar mottaget', time: '14:33', active: false },
  ];

  const agents = [
    { id: 'gpt-3.5', name: 'GPT-3.5', icon: '🤖', color: 'blue' },
    { id: 'gemini', name: 'Gemini', icon: '✨', color: 'purple' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🧠', color: 'cyan' },
    { id: 'grok', name: 'Grok', icon: '⚡', color: 'yellow' },
    { id: 'qwen', name: 'Qwen', icon: '🌟', color: 'green' },
  ];

  const toggleAgent = (agentId) => {
    setActiveAgents(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Left Sidebar - Timeline & Agent Controls */}
      <div className="w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div 
            className="text-lg font-bold mb-3"
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
          <button className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-[#e7e7e7] transition-colors">
            + Ny konversation
          </button>
        </div>

        {/* Agent Controls */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="text-xs text-[#666] uppercase tracking-wider mb-3">AI-Agenter</div>
          <div className="space-y-2">
            {agents.map(agent => (
              <label key={agent.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeAgents[agent.id]}
                  onChange={() => toggleAgent(agent.id)}
                  className="w-4 h-4 rounded border-[#3a3a3a] bg-[#1a1a1a] checked:bg-[#2a2a2a]"
                />
                <span className="text-lg">{agent.icon}</span>
                <span className="text-sm text-[#888] group-hover:text-[#e7e7e7] transition-colors">
                  {agent.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Tidslinje</div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1a1a1a]" />
            
            {/* Timeline items */}
            <div className="space-y-4">
              {timeline.map(item => (
                <div key={item.id} className="relative pl-8">
                  {/* Dot */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    item.active ? 'bg-blue-500 border-blue-400' : 'bg-[#1a1a1a] border-[#2a2a2a]'
                  }`}>
                    {item.active && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  </div>
                  
                  {/* Content */}
                  <div 
                    onClick={() => setSelectedTimestamp(item.id)}
                    className={`cursor-pointer p-3 rounded-lg transition-colors ${
                      selectedTimestamp === item.id ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'hover:bg-[#151515]'
                    }`}
                  >
                    <div className="text-xs text-[#666] mb-1">{item.time}</div>
                    <div className="text-sm text-[#e7e7e7]">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6">
          <div className="flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Sök i konversationer..."
              className="w-full bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-2 text-sm text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <button 
            onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
            className="ml-4 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-[#e7e7e7] transition-colors"
          >
            {showAnalysisPanel ? 'Dölj' : 'Visa'} Analys
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Question Card */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-sm">
                  👤
                </div>
                <div className="text-xs text-[#666] uppercase tracking-wider">Din fråga</div>
              </div>
              <p className="text-[#e7e7e7] text-lg leading-relaxed">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </p>
            </div>

            {/* AI Response with Sources */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {agents.filter(a => activeAgents[a.id]).slice(0, 3).map(agent => (
                      <div key={agent.id} className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-sm border-2 border-[#151515]">
                        {agent.icon}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[#666] uppercase tracking-wider">
                    Konsensus från {Object.values(activeAgents).filter(Boolean).length} agenter
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#666]">Tillförlitlighet:</span>
                  <span className="text-xs text-[#e7e7e7] font-medium">92%</span>
                </div>
              </div>

              <div className="text-[#c0c0c0] leading-relaxed mb-4">
                Baserat på omfattande analys har vi identifierat följande prioriterade åtgärder:
              </div>

              {/* Response sections with inline sources */}
              <div className="space-y-4">
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1">
                      <h4 className="text-[#e7e7e7] font-medium mb-2">Elektrifiering av transport</h4>
                      <p className="text-sm text-[#888] leading-relaxed">
                        Snabb omställning till elfordon och utbyggnad av laddinfrastruktur.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[#666]">Källor:</span>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-[#888]">🤖 GPT-3.5</span>
                          <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-[#888]">✨ Gemini</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌱</span>
                    <div className="flex-1">
                      <h4 className="text-[#e7e7e7] font-medium mb-2">Förnybar energi</h4>
                      <p className="text-sm text-[#888] leading-relaxed">
                        Fortsatt utbyggnad av sol- och vindkraft samt energilagring.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[#666]">Källor:</span>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-[#888]">🧠 DeepSeek</span>
                          <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-[#888]">🌟 Qwen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[#1a1a1a] p-6">
          <div className="max-w-5xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
            />
            <button className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-[#e7e7e7] transition-colors">
              Skicka
            </button>
          </div>
        </div>
      </div>

      {/* Right Analysis Panel */}
      {showAnalysisPanel && (
        <div className="w-80 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-[#1a1a1a]">
            <div className="text-xs text-[#666] uppercase tracking-wider">Detaljerad Analys</div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Sentiment Analysis */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-sm text-[#e7e7e7] font-medium mb-3">Sentimentanalys</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#888]">Positiv</span>
                  <span className="text-[#e7e7e7]">65%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>

            {/* Bias Detection */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-sm text-[#e7e7e7] font-medium mb-3">Bias-detektion</div>
              <div className="text-xs text-[#888] mb-2">Låg bias detekterad</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs text-[#e7e7e7]">Balanserad</span>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-sm text-[#e7e7e7] font-medium mb-3">Källor</div>
              <div className="space-y-2">
                <div className="text-xs text-[#888]">5 källor verifierade</div>
                <div className="text-xs text-green-500 flex items-center gap-1">
                  <span>✓</span>
                  <span>Faktakollad med Tavily</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
