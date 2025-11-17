import { useState, useEffect } from 'react';

/**
 * ChatViewConcept23: Mobile-First Slide-Up Panel
 * Based on Concept 8 - Bottom drawer with swipe-up navigation
 * Brand: OneSeek.AI grayscale with touch-friendly design
 */

export default function ChatViewConcept23() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] relative overflow-hidden">
      {/* Header with Menu */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#151515]">
        <div className="h-16 px-6 flex items-center justify-between">
          <h1 className="text-xl font-light tracking-wide">OneSeek.AI</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-[#e7e7e7] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Menu Panel */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#151515] border-b border-[#1a1a1a]">
            <nav className="py-2">
              {['Hem', 'Analys', 'Historik', 'Inställningar'].map((item, idx) => (
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
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-40 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Question */}
          <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Din fråga</div>
            <h2 className="text-2xl font-light leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Quick Stats Bar */}
          <div className={`flex gap-4 mb-8 overflow-x-auto pb-2 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {[
              { label: 'Modeller', value: '3' },
              { label: 'Konsensus', value: '92%' },
              { label: 'Källor', value: '15' },
            ].map((stat, idx) => (
              <div key={idx} className="flex-shrink-0 bg-[#151515] border border-[#1a1a1a] rounded-lg px-6 py-4">
                <div className="text-xs text-[#666] mb-1">{stat.label}</div>
                <div className="text-lg font-light">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Answer Card */}
          <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 mb-6 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">🎯</div>
              <div className="text-base font-light">Syntes</div>
            </div>
            <p className="text-sm text-[#888] leading-relaxed mb-6">
              Baserat på analys från tre AI-modeller är de viktigaste klimatpolitiska åtgärderna för Sverige:
            </p>
            <div className="space-y-3">
              {['Elektrifiering av transportsektorn', 'Utbyggnad av förnybar energi', 'Energieffektivisering'].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#1a1a1a] rounded flex items-center justify-center text-xs text-[#666] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-[#888]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Perspectives */}
          {['GPT-3.5', 'Gemini', 'DeepSeek'].map((model, idx) => (
            <div
              key={idx}
              className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 mb-4 transition-all duration-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{transitionDelay: `${300 + idx * 100}ms`}}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{idx === 0 ? '🤖' : idx === 1 ? '✨' : '🧠'}</span>
                <span className="text-sm font-light">{model}</span>
              </div>
              <p className="text-sm text-[#888] leading-relaxed">
                Perspektiv från {model} betonar vikten av systematiska klimatåtgärder.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Drawer Trigger */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#151515] border border-[#1a1a1a] rounded-full px-6 py-3 text-xs text-[#666] hover:text-[#e7e7e7] hover:border-[#2a2a2a] transition-all shadow-lg"
      >
        {drawerOpen ? 'Dölj detaljer' : 'Visa detaljer'}
      </button>

      {/* Bottom Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#151515] border-t border-[#1a1a1a] transition-all duration-500 ${
        drawerOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{height: '60vh'}}>
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-light mb-6">Detaljerad analys</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-sm text-[#888]">Analyspunkt {idx}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-full p-2 flex gap-2">
            <input
              type="text"
              placeholder="Fortsätt konversationen..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
            />
            <button className="px-5 py-2 bg-[#e7e7e7] text-[#0a0a0a] rounded-full text-sm font-medium hover:bg-white transition-colors">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
