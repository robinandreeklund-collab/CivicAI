import { useState } from 'react';

/**
 * ChatViewConcept10: Radial Navigation with Central Chat
 * 
 * Design Philosophy:
 * - Central chat interface with radial menu system
 * - Circular navigation orbiting the main content
 * - Innovative spatial organization
 * - Contextual tools appear around the chat
 * - Futuristic, unique interaction pattern
 */

export default function ChatViewConcept10() {
  const [activeOrbit, setActiveOrbit] = useState(null);
  const [showRadialMenu, setShowRadialMenu] = useState(false);

  const orbits = [
    {
      id: 'agents',
      icon: '🤖',
      label: 'AI-Agenter',
      color: 'blue',
      items: ['GPT-3.5', 'Gemini', 'DeepSeek', 'Grok', 'Qwen'],
    },
    {
      id: 'analysis',
      icon: '📊',
      label: 'Analys',
      color: 'purple',
      items: ['Sentiment', 'Bias', 'Ton', 'Faktakoll'],
    },
    {
      id: 'sources',
      icon: '📚',
      label: 'Källor',
      color: 'green',
      items: ['Naturvårdsverket', 'Energimyndigheten', 'IEA'],
    },
    {
      id: 'export',
      icon: '💾',
      label: 'Export',
      color: 'orange',
      items: ['PDF', 'JSON', 'Markdown'],
    },
  ];

  const getOrbitColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Center Logo/Brand */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <div 
          className="text-2xl font-bold"
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
      </div>

      {/* Central Chat Container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw]">
        <div className="bg-[#151515]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-3xl shadow-2xl p-8">
          {/* Question */}
          <div className="mb-6">
            <div className="text-xs text-[#666] uppercase tracking-wider mb-3 text-center">Din fråga</div>
            <h2 className="text-xl text-[#e7e7e7] text-center leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Response Preview */}
          <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {['🤖', '✨', '🧠'].map((icon, idx) => (
                  <div 
                    key={idx}
                    className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center border-2 border-[#151515]"
                  >
                    {icon}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#666]">Konsensus från 5 modeller</span>
            </div>

            <div className="text-sm text-[#c0c0c0] leading-relaxed text-center">
              Elektrifiering av transport och utbyggnad av förnybar energi är de två viktigaste åtgärderna enligt samtliga modeller...
            </div>
          </div>

          {/* Central Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Förfina eller ställ ny fråga..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:shadow-lg transition-all">
              Skicka
            </button>
          </div>
        </div>
      </div>

      {/* Radial Menu Toggle */}
      <button
        onClick={() => setShowRadialMenu(!showRadialMenu)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#151515]/90 backdrop-blur-xl border-2 border-[#2a2a2a] rounded-full flex items-center justify-center shadow-2xl hover:border-[#3a3a3a] transition-all z-50"
      >
        <svg 
          className={`w-6 h-6 text-[#e7e7e7] transition-transform ${showRadialMenu ? 'rotate-45' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Radial Menu */}
      {showRadialMenu && (
        <>
          {/* Orbit Circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-[900px] h-[900px] border border-[#1a1a1a]/50 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-[#1a1a1a]/30 rounded-full" />
          </div>

          {/* Orbiting Items */}
          {orbits.map((orbit, orbitIdx) => {
            const angle = (orbitIdx / orbits.length) * 360;
            const radius = 450;
            const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
            const y = Math.sin((angle - 90) * Math.PI / 180) * radius;

            return (
              <div
                key={orbit.id}
                className="absolute top-1/2 left-1/2 z-40"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <button
                  onClick={() => setActiveOrbit(activeOrbit === orbit.id ? null : orbit.id)}
                  className={`w-20 h-20 bg-gradient-to-br ${getOrbitColor(orbit.color)} rounded-2xl flex flex-col items-center justify-center shadow-2xl hover:scale-110 transition-all ${
                    activeOrbit === orbit.id ? 'ring-4 ring-white/20 scale-110' : ''
                  }`}
                >
                  <span className="text-3xl mb-1">{orbit.icon}</span>
                  <span className="text-[10px] text-white font-medium">{orbit.label}</span>
                </button>

                {/* Expanded Items */}
                {activeOrbit === orbit.id && (
                  <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 min-w-[200px]">
                    <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-xl shadow-2xl p-3 space-y-2">
                      <div className="text-xs text-[#666] uppercase tracking-wider mb-2 text-center">
                        {orbit.label}
                      </div>
                      {orbit.items.map((item, idx) => (
                        <button
                          key={idx}
                          className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-xs text-[#e7e7e7] transition-colors text-left"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Status Indicators */}
      <div className="absolute top-8 right-8 flex flex-col gap-3">
        <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs text-[#888]">5 agenter aktiva</span>
        </div>
        <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs text-[#888]">Analyserar</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="absolute top-8 left-8 bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-4">
        <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Insyn</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#888]">Tillförlitlighet</span>
            <span className="text-sm text-green-500 font-bold">92%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#888]">Källor</span>
            <span className="text-sm text-[#e7e7e7] font-bold">5</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#888]">Bias</span>
            <span className="text-sm text-green-500 font-bold">Låg</span>
          </div>
        </div>
      </div>

      {/* Help Hint */}
      {!showRadialMenu && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-xs text-[#666] text-center animate-pulse">
          Tryck på + för att öppna radiell meny
        </div>
      )}
    </div>
  );
}
