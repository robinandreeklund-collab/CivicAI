import { useState, useEffect } from 'react';

/**
 * ChatViewConcept28: Compact Mobile with Floating Actions
 * Based on Concept 8 - Mobile-optimized with floating action button and bottom sheet
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept28() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Minimal Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#151515]">
          <h1 className="text-base font-light">OneSeek.AI</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="bg-[#151515] border-b border-[#1a1a1a]">
            {['Hem', 'Analys', 'Historik', 'Källor'].map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-3 text-sm text-[#666] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors border-b border-[#151515] last:border-0"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#151515] border-b border-[#1a1a1a]">
        <div className="px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#666] rounded-full" />
            <span className="text-[#666]">3 modeller</span>
          </div>
          <div className="text-[#666]">92% konsensus</div>
          <div className="text-[#666]">18 källor</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-28 pb-24 px-4">
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Question Card */}
          <div className="mb-4">
            <div className="text-xs text-[#444] uppercase tracking-widest mb-2">Din fråga</div>
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </p>
            </div>
          </div>

          {/* Compact Synthesis */}
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-sm font-light">Syntes</div>
                <div className="text-xs text-[#666]">3 AI-modeller</div>
              </div>
            </div>
            <div className="space-y-2">
              {['Elektrifiering av transport', 'Förnybar energi', 'Energieffektivisering'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#888]">
                  <div className="w-1 h-1 bg-[#666] rounded-full" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Compact Model Cards */}
          <div className="space-y-3">
            {[
              { model: 'GPT-3.5', icon: '🤖', score: 94 },
              { model: 'Gemini', icon: '✨', score: 91 },
              { model: 'DeepSeek', icon: '🧠', score: 89 }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-3 transition-all duration-700"
                style={{transitionDelay: `${idx * 100}ms`}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-light">{item.model}</span>
                  </div>
                  <span className="text-xs text-[#666]">{item.score}%</span>
                </div>
                <div className="h-1 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2a2a2a] transition-all duration-1000"
                    style={{width: mounted ? `${item.score}%` : '0%'}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 bg-[#e7e7e7] text-[#0a0a0a] rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={fabOpen ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
        </button>

        {fabOpen && (
          <div className="absolute bottom-16 right-0 w-48 bg-[#151515] border border-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden">
            {['Exportera', 'Dela', 'Favorit', 'Historik'].map((action, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-3 text-sm text-[#666] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors border-b border-[#151515] last:border-0"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#151515] px-4 py-3">
        <div className="bg-[#151515] border border-[#1a1a1a] rounded-full p-1 flex gap-2">
          <input
            type="text"
            placeholder="Ny fråga..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
          />
          <button className="w-10 h-10 bg-[#e7e7e7] text-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
