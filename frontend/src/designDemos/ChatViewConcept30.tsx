import { useState, useEffect } from 'react';

/**
 * ChatViewConcept30: Zen Minimal with Progressive Disclosure
 * Based on Concept 11 - Ultra-minimal, distraction-free with content revealing on scroll
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept30() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Minimal Header - Auto-hide */}
      <div className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300">
        <div className="h-12 px-6 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-sm">
          <h1 className="text-sm font-light tracking-widest">ONESEEK.AI</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-[#e7e7e7] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="absolute top-full right-0 w-48 bg-[#0a0a0a] border-l border-b border-[#151515]">
            {['Hem', 'Analys', 'Historik'].map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-2.5 text-xs text-[#444] hover:text-[#e7e7e7] transition-colors border-b border-[#151515] last:border-0"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content - Centered */}
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full">
          {/* Question - Large and Centered */}
          <div className={`mb-16 text-center transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
          }`}>
            <h2 className="text-3xl md:text-4xl font-extralight leading-relaxed text-[#e7e7e7]">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Minimal Synthesis - Fade In */}
          <div className={`transition-all duration-1000 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
          }`}>
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1.5 bg-[#151515] border border-[#1a1a1a] rounded-full text-xs text-[#666] mb-6">
                Syntes från 3 AI-modeller • 92% konsensus
              </div>
            </div>

            {/* Key Points - Minimal */}
            <div className="space-y-6 mb-12">
              {[
                'Elektrifiering av transportsektorn',
                'Utbyggnad av förnybar energi',
                'Energieffektivisering i alla sektorer'
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`text-center transition-all duration-700 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{transitionDelay: `${500 + idx * 150}ms`}}
                >
                  <p className="text-lg font-light text-[#888]">{item}</p>
                </div>
              ))}
            </div>

            {/* Show Details Toggle */}
            <div className="text-center mb-8">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-[#666] hover:text-[#e7e7e7] transition-colors uppercase tracking-widest"
              >
                {showDetails ? '↑ Dölj detaljer' : '↓ Visa detaljer'}
              </button>
            </div>

            {/* Progressive Details */}
            <div className={`overflow-hidden transition-all duration-700 ${
              showDetails ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-8 pt-8 border-t border-[#151515]">
                {[
                  { model: 'GPT-3.5', icon: '🤖', insight: 'Fokuserar på transport och tekniska lösningar' },
                  { model: 'Gemini', icon: '✨', insight: 'Betonar förnybar energi och infrastruktur' },
                  { model: 'DeepSeek', icon: '🧠', insight: 'Prioriterar energieffektivisering och smarta system' }
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-sm font-light text-[#666]">{item.model}</span>
                    </div>
                    <p className="text-sm text-[#444]">{item.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Bottom Input - Ghost Style */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6">
        <div className="bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#151515] rounded-full p-1.5 flex gap-2 hover:border-[#1a1a1a] transition-colors">
          <input
            type="text"
            placeholder="Ställ en ny fråga..."
            className="flex-1 bg-transparent px-5 py-2.5 text-sm text-[#e7e7e7] placeholder-[#333] focus:outline-none"
          />
          <button className="w-10 h-10 bg-[#151515] text-[#666] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
