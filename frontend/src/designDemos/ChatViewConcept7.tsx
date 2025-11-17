import { useState } from 'react';

/**
 * ChatViewConcept7: Tabbed Interface with Integrated Timeline
 * 
 * Design Philosophy:
 * - Horizontal tab navigation for different analysis views
 * - Integrated timeline at the bottom showing conversation flow
 * - Each tab shows different aspect (Overview, Sources, Analysis, Export)
 * - Minimal top bar with essential controls
 * - Timeline can expand for detailed history
 */

export default function ChatViewConcept7() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Översikt', icon: '📋' },
    { id: 'sources', label: 'Källor', icon: '📚' },
    { id: 'analysis', label: 'Analys', icon: '📊' },
    { id: 'export', label: 'Exportera', icon: '💾' },
  ];

  const timelineEvents = [
    { id: 1, time: '14:32', type: 'question', label: 'Fråga ställd' },
    { id: 2, time: '14:32', type: 'processing', label: 'AI-analys startad' },
    { id: 3, time: '14:33', type: 'complete', label: 'Svar mottaget' },
    { id: 4, time: '14:33', type: 'analysis', label: 'Analys klar' },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        <div 
          className="text-lg font-bold"
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

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-[#e7e7e7] transition-colors">
            Ny konversation
          </button>
          <button className="p-2 rounded-lg bg-[#151515] border border-[#1a1a1a] text-[#666] hover:text-[#888]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-[#e7e7e7]'
                  : 'border-transparent text-[#666] hover:text-[#888]'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Question */}
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Din fråga</div>
                <h2 className="text-xl text-[#e7e7e7]">
                  Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
                </h2>
              </div>

              {/* Summary */}
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <div>
                    <div className="text-sm text-[#e7e7e7] font-medium">Konsensussammanfattning</div>
                    <div className="text-xs text-[#666]">Baserat på 5 AI-modeller</div>
                  </div>
                </div>
                
                <div className="text-[#c0c0c0] leading-relaxed mb-4">
                  Alla modeller är överens om att elektrifiering av transport och utbyggnad av förnybar energi är de två viktigaste åtgärderna. Energieffektivisering och innovation inom energilagring nämns också av majoriteten.
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm text-[#e7e7e7] font-medium mb-1">Elektrifiering</div>
                    <div className="text-xs text-[#666]">Konsensus: 100%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-2xl mb-2">🌱</div>
                    <div className="text-sm text-[#e7e7e7] font-medium mb-1">Förnybar energi</div>
                    <div className="text-xs text-[#666]">Konsensus: 100%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-2xl mb-2">💡</div>
                    <div className="text-sm text-[#e7e7e7] font-medium mb-1">Energieffektivisering</div>
                    <div className="text-xs text-[#666]">Konsensus: 80%</div>
                  </div>
                </div>
              </div>

              {/* AI Responses */}
              <div className="space-y-4">
                <div className="text-xs text-[#666] uppercase tracking-wider">AI-svar</div>
                {['GPT-3.5', 'Gemini', 'DeepSeek'].map((model, idx) => (
                  <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">
                        {idx === 0 ? '🤖' : idx === 1 ? '✨' : '🧠'}
                      </div>
                      <div className="text-sm text-[#e7e7e7] font-medium">{model}</div>
                    </div>
                    <div className="text-sm text-[#888] line-clamp-2">
                      Elektrifiering av transportsektorn är kritisk för att nå klimatmålen...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="p-8">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-4">
                Verifierade källor (5)
              </div>
              {[
                { title: 'Naturvårdsverket', url: 'naturvardsverket.se', trust: 95 },
                { title: 'Energimyndigheten', url: 'energimyndigheten.se', trust: 92 },
                { title: 'IEA Report', url: 'iea.org', trust: 88 },
              ].map((source, idx) => (
                <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[#e7e7e7] font-medium mb-1">{source.title}</h3>
                      <div className="text-xs text-[#666]">{source.url}</div>
                    </div>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#666]">Tillförlitlighet:</span>
                    <div className="flex-1 bg-[#1a1a1a] rounded-full h-2 max-w-xs">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${source.trust}%` }} />
                    </div>
                    <span className="text-xs text-[#e7e7e7] font-medium">{source.trust}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-[#e7e7e7] font-medium mb-4">Sentimentanalys</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#888]">Positiv</span>
                      <span className="text-[#e7e7e7]">65%</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#888]">Neutral</span>
                      <span className="text-[#e7e7e7]">30%</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-[#e7e7e7] font-medium mb-4">Bias-detektion</h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-green-500">✓</span>
                  </div>
                  <div>
                    <div className="text-sm text-[#e7e7e7] font-medium">Låg bias</div>
                    <div className="text-xs text-[#666]">Balanserat innehåll</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-xs text-[#666] uppercase tracking-wider">Exportera konversation</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { format: 'PDF', icon: '📄', desc: 'Fullständig rapport' },
                  { format: 'JSON', icon: '💾', desc: 'Strukturerad data' },
                  { format: 'Markdown', icon: '📝', desc: 'Formaterad text' },
                  { format: 'CSV', icon: '📊', desc: 'Tabulär data' },
                ].map((option, idx) => (
                  <button
                    key={idx}
                    className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#2a2a2a] transition-colors text-left"
                  >
                    <div className="text-3xl mb-3">{option.icon}</div>
                    <div className="text-[#e7e7e7] font-medium mb-1">{option.format}</div>
                    <div className="text-xs text-[#666]">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline */}
      <div className={`bg-[#0a0a0a] border-t border-[#1a1a1a] transition-all ${
        timelineExpanded ? 'h-48' : 'h-16'
      }`}>
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#1a1a1a]">
          <div className="text-xs text-[#666] uppercase tracking-wider">Tidslinje</div>
          <button
            onClick={() => setTimelineExpanded(!timelineExpanded)}
            className="text-[#666] hover:text-[#888]"
          >
            <svg className={`w-4 h-4 transition-transform ${timelineExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-xs text-[#e7e7e7]">
                    {idx + 1}
                  </div>
                  <div className="text-xs text-[#666] mt-2">{event.time}</div>
                  {timelineExpanded && (
                    <div className="text-xs text-[#888] mt-1 text-center">{event.label}</div>
                  )}
                </div>
                {idx < timelineEvents.length - 1 && (
                  <div className="w-16 h-px bg-[#2a2a2a]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
