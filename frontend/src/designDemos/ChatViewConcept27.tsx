import { useState, useEffect } from 'react';

/**
 * ChatViewConcept27: Split Panel Comparison View
 * Based on Concept 5 __DESCRIPTION__ 7 - Side-by-side model comparison
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept27() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] overflow-auto">
      {/* Header with Menu */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#151515]">
        <div className="h-14 px-6 flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-lg font-light tracking-wide">OneSeek.AI</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-xs uppercase tracking-wider text-[#666] hover:text-[#e7e7e7] transition-colors"
          >
            Meny
          </button>
        </div>

        {menuOpen && (
          <div className="absolute top-full right-0 w-56 bg-[#151515] border-l border-b border-[#1a1a1a]">
            {['Startsida', 'Analys', 'Historik', 'Källor', 'Kontakt'].map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-6 py-3 text-xs text-[#666] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Question */}
          <div className={`mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Din fråga</div>
            <h2 className="text-3xl font-light leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Synthesis Card */}
          <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-8 mb-8 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-xl">🎯</div>
              <div>
                <h3 className="text-lg font-light">Syntes från 3 AI-modeller</h3>
                <div className="text-xs text-[#666]">92% konsensus</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {['Elektrifiering av transportsektorn', 'Utbyggnad av förnybar energi', 'Energieffektivisering i alla sektorer'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                  <div className="w-1 h-1 bg-[#666] rounded-full" />
                  <span className="text-sm text-[#888]">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'GPT-3.5', icon: '🤖', score: 94 },
                { name: 'Gemini', icon: '✨', score: 91 },
                { name: 'DeepSeek', icon: '🧠', score: 89 }
              ].map((model, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{model.icon}</span>
                    <span className="text-xs font-light">{model.name}</span>
                  </div>
                  <div className="text-xs text-[#666]">{model.score}% match</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Perspectives */}
          <div className="space-y-6">
            {[
              { model: 'GPT-3.5', icon: '🤖', text: 'Elektrifiering av transportsektorn är avgörande för att nå klimatmålen. Detta inkluderar övergången till elbilar och elektrifiering av tunga transporter.' },
              { model: 'Gemini', icon: '✨', text: 'Förnybar energi måste prioriteras genom utbyggnad av sol- och vindkraft. Investeringar i infrastruktur är kritiska för att möjliggöra denna omställning.' },
              { model: 'DeepSeek', icon: '🧠', text: 'Energieffektivisering i byggnader och industri kan reducera utsläpp betydligt. Smart elnät och energilagring är tekniska lösningar som behövs.' }
            ].map((item, idx) => (
              <div key={idx} className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 transition-all duration-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{transitionDelay: `${400 + idx * 100}ms`}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base font-light">{item.model}</span>
                </div>
                <p className="text-sm text-[#888] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-md text-sm font-medium hover:bg-white transition-colors">
              Skicka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
