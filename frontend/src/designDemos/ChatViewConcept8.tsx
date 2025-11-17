import { useState } from 'react';

/**
 * ChatViewConcept8: Bottom Drawer Navigation with Top Insights
 * 
 * Design Philosophy:
 * - Top insights bar showing key metrics at a glance
 * - Main chat area dominates the screen
 * - Bottom drawer slides up for navigation and controls
 * - Persistent floating input field
 * - Gesture-friendly mobile-first design
 */

export default function ChatViewConcept8() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('history');

  const insights = [
    { label: 'Tillförlitlighet', value: '92%', color: 'green' },
    { label: 'Källor', value: '5', color: 'blue' },
    { label: 'Bias', value: 'Låg', color: 'green' },
    { label: 'Tid', value: '3.2s', color: 'gray' },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Insights Bar */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between px-6 py-3">
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

          {/* Insights Pills */}
          <div className="flex items-center gap-3">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className="bg-[#151515] border border-[#1a1a1a] rounded-full px-3 py-1.5 flex items-center gap-2"
              >
                <span className="text-xs text-[#666]">{insight.label}</span>
                <span className={`text-xs font-medium ${
                  insight.color === 'green' ? 'text-green-500' :
                  insight.color === 'blue' ? 'text-blue-500' :
                  'text-[#e7e7e7]'
                }`}>
                  {insight.value}
                </span>
              </div>
            ))}
          </div>

          <button className="p-2 rounded-lg bg-[#151515] border border-[#1a1a1a] text-[#666] hover:text-[#888]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Question */}
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                💭
              </div>
              <div>
                <div className="text-xs text-[#666] uppercase tracking-wider">Din fråga</div>
                <div className="text-xs text-[#888]">Just nu</div>
              </div>
            </div>
            <h2 className="text-2xl text-[#e7e7e7] leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Response */}
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {['🤖', '✨', '🧠'].map((icon, idx) => (
                    <div 
                      key={idx}
                      className="w-12 h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center text-xl border-2 border-[#151515]"
                    >
                      {icon}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm text-[#e7e7e7] font-medium">Konsensussvar</div>
                  <div className="text-xs text-[#666]">Från 5 AI-modeller</div>
                </div>
              </div>
              
              <button className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#666]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>

            <div className="text-[#c0c0c0] leading-relaxed space-y-4">
              <p>
                Baserat på analys från flera ledande AI-modeller har vi identifierat följande prioriterade klimatpolitiska åtgärder:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '⚡', title: 'Elektrifiering', desc: 'Transport och industri' },
                  { icon: '🌱', title: 'Förnybar energi', desc: 'Sol och vindkraft' },
                  { icon: '🏠', title: 'Energieffektivisering', desc: 'Byggnader och lokaler' },
                  { icon: '🔋', title: 'Energilagring', desc: 'Batterier och smart elnät' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="text-[#e7e7e7] font-medium mb-1">{item.title}</div>
                    <div className="text-xs text-[#666]">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6">
        <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl p-2 flex gap-2">
          <input
            type="text"
            placeholder="Ställ en följdfråga..."
            className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
          />
          <button className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-xl text-[#e7e7e7] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Drawer */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] transition-all duration-300 ${
          drawerOpen ? 'h-96' : 'h-16'
        }`}
      >
        {/* Drawer Handle */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full h-16 flex items-center justify-center hover:bg-[#151515] transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-1 bg-[#2a2a2a] rounded-full" />
            <svg 
              className={`w-5 h-5 text-[#666] transition-transform ${drawerOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>

        {/* Drawer Content */}
        {drawerOpen && (
          <div className="h-[calc(100%-4rem)] flex flex-col">
            {/* Drawer Tabs */}
            <div className="flex border-b border-[#1a1a1a] px-6">
              {[
                { id: 'history', label: 'Historik', icon: '📜' },
                { id: 'sources', label: 'Källor', icon: '📚' },
                { id: 'settings', label: 'Inställningar', icon: '⚙️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    drawerTab === tab.id
                      ? 'border-blue-500 text-[#e7e7e7]'
                      : 'border-transparent text-[#666] hover:text-[#888]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Drawer Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === 'history' && (
                <div className="space-y-3">
                  {[
                    'Klimatpolitiska åtgärder...',
                    'Ekonomisk politik...',
                    'Utbildningsreformer...',
                  ].map((title, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] cursor-pointer transition-colors"
                    >
                      <div className="text-sm text-[#e7e7e7] mb-1">{title}</div>
                      <div className="text-xs text-[#666]">2024-01-{15 - idx}</div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'sources' && (
                <div className="space-y-3">
                  {[
                    { name: 'Naturvårdsverket', trust: 95 },
                    { name: 'Energimyndigheten', trust: 92 },
                    { name: 'IEA Report', trust: 88 },
                  ].map((source, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-[#e7e7e7]">{source.name}</div>
                        <div className="text-xs text-green-500">✓</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${source.trust}%` }} />
                        </div>
                        <div className="text-xs text-[#666]">{source.trust}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'settings' && (
                <div className="space-y-4">
                  {[
                    { label: 'AI-agenter', value: '5 aktiva' },
                    { label: 'Språk', value: 'Svenska' },
                    { label: 'Detaljnivå', value: 'Hög' },
                  ].map((setting, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#888]">{setting.label}</span>
                        <span className="text-sm text-[#e7e7e7]">{setting.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
