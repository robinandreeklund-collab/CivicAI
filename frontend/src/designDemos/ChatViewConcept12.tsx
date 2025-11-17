import { useState, useEffect } from 'react';

/**
 * ChatViewConcept12: Minimalist with Animated Insights
 * 
 * Based on Concept 1 with enhancements:
 * - Smooth slide-in animations for all elements
 * - Pulsing insight indicators
 * - Rich data visualization
 * - Fixed positioning for input - always visible
 * - Micro-interactions on hover
 */

export default function ChatViewConcept12() {
  const [mounted, setMounted] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [activeMetric, setActiveMetric] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const insights = [
    { id: 'confidence', label: 'Tillförlitlighet', value: 92, unit: '%', color: 'from-green-500 to-emerald-600', icon: '✓' },
    { id: 'bias', label: 'Bias-nivå', value: 1.8, unit: '/10', color: 'from-yellow-500 to-orange-500', icon: '⚖️' },
    { id: 'sources', label: 'Källor', value: 5, unit: '', color: 'from-blue-500 to-cyan-600', icon: '📚' },
    { id: 'factCheck', label: 'Faktakoll', value: 100, unit: '%', color: 'from-purple-500 to-pink-600', icon: '🔍' },
  ];

  const modelData = [
    { name: 'GPT-3.5', icon: '🤖', agreement: 95, tone: 'informativ', bias: 2.1 },
    { name: 'Gemini', icon: '✨', agreement: 92, tone: 'övertygande', bias: 1.8 },
    { name: 'DeepSeek', icon: '🧠', agreement: 88, tone: 'analytisk', bias: 1.2 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Minimalist Header with Slide-in Animation */}
      <header className={`h-14 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a] flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-700 ${
        mounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            OneSeek.AI
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#151515] rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-[#888]">Klar</span>
          </div>
        </div>

        <button 
          onClick={() => setShowInsights(!showInsights)}
          className="px-4 py-2 bg-[#151515] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#e7e7e7] transition-all duration-300"
        >
          {showInsights ? 'Dölj' : 'Visa'} insikter
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            {/* Question */}
            <div className={`bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 transition-all duration-700 delay-100 ${
              mounted ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
            }`}>
              <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Din fråga</div>
              <h2 className="text-xl text-[#e7e7e7] leading-relaxed">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </h2>
            </div>

            {/* Consensus Answer */}
            <div className={`bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 transition-all duration-700 delay-200 ${
              mounted ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎯
                </div>
                <div>
                  <div className="text-lg text-[#e7e7e7] font-medium">Konsensussvar</div>
                  <div className="text-xs text-[#666]">Från 3 AI-modeller • 92% överensstämmelse</div>
                </div>
              </div>

              <div className="text-[#c0c0c0] leading-relaxed space-y-4 mb-6">
                <p>
                  Baserat på omfattande analys från flera AI-modeller har vi identifierat följande prioriterade klimatpolitiska åtgärder:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: '⚡', title: 'Elektrifiering', desc: 'Transport och industri' },
                    { icon: '🌱', title: 'Förnybar energi', desc: 'Sol och vindkraft' },
                    { icon: '🏠', title: 'Energieffektivisering', desc: 'Byggnader och lokaler' },
                    { icon: '🔋', title: 'Energilagring', desc: 'Batterier och smart elnät' },
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-lg p-4 hover:border-blue-500/50 hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer"
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <div className="text-[#e7e7e7] font-medium mb-1">{item.title}</div>
                      <div className="text-xs text-[#666]">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Agreement Indicators */}
              <div className="border-t border-[#2a2a2a] pt-4">
                <div className="text-xs text-[#666] mb-3">Modellöverensstämmelse:</div>
                <div className="flex gap-2">
                  {modelData.map((model, idx) => (
                    <div 
                      key={idx}
                      className="flex-1 bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#151515] transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{model.icon}</span>
                        <span className="text-xs text-[#e7e7e7]">{model.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#151515] rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${model.agreement}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-500 font-medium">{model.agreement}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Insights Panel */}
        {showInsights && (
          <div className={`w-80 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col transition-all duration-500 ${
            mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
            <div className="p-4 border-b border-[#1a1a1a]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Live Insikter</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {insights.map((insight, idx) => (
                <div
                  key={insight.id}
                  onMouseEnter={() => setActiveMetric(insight.id)}
                  onMouseLeave={() => setActiveMetric(null)}
                  className={`bg-[#151515] border rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                    activeMetric === insight.id ? 'border-[#3a3a3a] shadow-lg scale-105' : 'border-[#1a1a1a]'
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{insight.icon}</span>
                      <span className="text-xs text-[#888]">{insight.label}</span>
                    </div>
                    <div className={`text-2xl font-bold bg-gradient-to-r ${insight.color} bg-clip-text text-transparent`}>
                      {insight.value}{insight.unit}
                    </div>
                  </div>
                  
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${insight.color} transition-all duration-1000 rounded-full`}
                      style={{ 
                        width: `${insight.unit === '%' ? insight.value : (insight.value / 10) * 100}%`,
                        boxShadow: activeMetric === insight.id ? `0 0 10px ${insight.color.split(' ')[1]}` : 'none'
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Additional Metrics */}
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-4">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Tonanalys</div>
                <div className="space-y-2">
                  {modelData.map((model, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-[#888]">{model.name}</span>
                      <span className="text-[#e7e7e7] capitalize">{model.tone}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-sm text-green-400 font-medium">Faktakollad</span>
                </div>
                <p className="text-xs text-[#888]">Alla påståenden verifierade mot 5 oberoende källor</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Input - Always Visible */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-6 pb-6 z-40 transition-all duration-700 delay-300 ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl p-3 flex gap-3 hover:border-[#3a3a3a] transition-all duration-300">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-300 shadow-lg">
              Skicka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
