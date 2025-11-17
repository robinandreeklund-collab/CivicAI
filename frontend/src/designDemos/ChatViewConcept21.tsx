import { useState, useEffect } from 'react';

/**
 * ChatViewConcept21: Premium Minimalist Command Center
 * Based on Concept 1 & 11 - Ultra-clean interface with floating synthesis card
 * Brand: OneSeek.AI grayscale aesthetic with premium feel
 */

export default function ChatViewConcept21() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const modelData = [
    { name: 'GPT-3.5', icon: '🤖', consensus: 94, sources: 12 },
    { name: 'Gemini', icon: '✨', consensus: 91, sources: 15 },
    { name: 'DeepSeek', icon: '🧠', consensus: 89, sources: 18 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] overflow-auto">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#151515]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-light tracking-wide">OneSeek.AI</h1>
          
          {/* Menu Button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#666] hover:text-[#e7e7e7] transition-colors"
          >
            <span>Meny</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-full right-0 w-64 bg-[#151515] border-l border-b border-[#1a1a1a] shadow-2xl">
            <nav className="py-2">
              {['Hem', 'Analys', 'Historik', 'Källor', 'Inställningar', 'Om OneSeek.AI'].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-6 py-3 text-sm text-[#666] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Question */}
          <div className={`mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Din fråga</div>
            <h2 className="text-3xl font-light text-[#e7e7e7] leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Floating Synthesis Card */}
          <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-8 mb-12 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-lg">🎯</div>
              <div className="flex-1">
                <h3 className="text-lg font-light mb-1">Syntes från 3 AI-modeller</h3>
                <div className="text-xs text-[#666]">94% konsensus mellan modeller</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {['Elektrifiering av transportsektorn', 'Utbyggnad av förnybar energi', 'Energieffektivisering i alla sektorer'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
                  <div className="w-1 h-1 bg-[#666] rounded-full" />
                  <div className="text-sm text-[#888]">{item}</div>
                </div>
              ))}
            </div>

            {/* Model Grid */}
            <div className="grid grid-cols-3 gap-4">
              {modelData.map((model, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{model.icon}</span>
                    <div className="text-xs font-light">{model.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#666]">Konsensus</span>
                      <span className="text-[#e7e7e7]">{model.consensus}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#666]">Källor</span>
                      <span className="text-[#e7e7e7]">{model.sources}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Details */}
          <div className="grid grid-cols-1 gap-6">
            {modelData.map((model, idx) => (
              <div key={idx} className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 transition-all duration-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{transitionDelay: `${400 + idx * 100}ms`}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{model.icon}</span>
                  <div className="text-base font-light">{model.name}</div>
                </div>
                <p className="text-sm text-[#888] leading-relaxed">
                  {model.name === 'GPT-3.5' && 'Elektrifiering av transportsektorn är avgörande för att nå klimatmålen. Detta inkluderar övergången till elbilar och elektrifiering av tunga transporter.'}
                  {model.name === 'Gemini' && 'Förnybar energi måste prioriteras genom utbyggnad av sol- och vindkraft. Investeringar i infrastruktur är kritiska för att möjliggöra denna omställning.'}
                  {model.name === 'DeepSeek' && 'Energieffektivisering i byggnader och industri kan reducera utsläpp betydligt. Smart elnät och energilagring är tekniska lösningar som behövs.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2 hover:border-[#2a2a2a] transition-colors">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-md text-sm font-medium hover:bg-white transition-colors">
              Analysera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
