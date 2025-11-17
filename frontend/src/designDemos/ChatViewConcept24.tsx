import { useState, useEffect } from 'react';

/**
 * ChatViewConcept24: Horizontal Timeline Flow
 * Based on Concept 7 & 11 - Horizontal scrolling timeline with card progression
 * Brand: OneSeek.AI grayscale with flowing narrative
 */

export default function ChatViewConcept24() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const stages = [
    { id: 1, title: 'Din fråga', status: 'complete' },
    { id: 2, title: 'Analys', status: 'complete' },
    { id: 3, title: 'Syntes', status: 'active' },
    { id: 4, title: 'Fördjupning', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Header */}
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
          <div className="absolute top-full right-0 w-60 bg-[#151515] border-l border-b border-[#1a1a1a]">
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

      {/* Timeline Progress */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#151515]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div className={`flex-1 flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                  stage.status === 'active' ? 'bg-[#151515] border border-[#1a1a1a]' :
                  stage.status === 'complete' ? 'text-[#888]' :
                  'text-[#444]'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    stage.status === 'active' ? 'bg-[#e7e7e7]' :
                    stage.status === 'complete' ? 'bg-[#666]' :
                    'bg-[#2a2a2a]'
                  }`} />
                  <span className="text-xs">{stage.title}</span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${
                    stages[idx + 1].status === 'pending' ? 'bg-[#1a1a1a]' : 'bg-[#2a2a2a]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Steg 1: Din fråga</div>
            <h2 className="text-3xl font-light leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Analysis Cards */}
          <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-4">Steg 2: Analys från 3 modeller</div>
            <div className="grid grid-cols-3 gap-4">
              {['🤖 GPT-3.5', '✨ Gemini', '🧠 DeepSeek'].map((model, idx) => (
                <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="text-sm mb-2">{model}</div>
                  <div className="text-xs text-[#666]">Analyserad</div>
                </div>
              ))}
            </div>
          </div>

          {/* Synthesis */}
          <div className={`mb-8 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-4">Steg 3: Syntes</div>
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">🎯</div>
                <div>
                  <div className="text-base font-light">Konsensusbedömning</div>
                  <div className="text-xs text-[#666]">92% överensstämmelse</div>
                </div>
              </div>
              <div className="space-y-3">
                {['Elektrifiering av transport', 'Förnybar energi', 'Energieffektivisering'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                    <div className="w-1 h-1 bg-[#666] rounded-full" />
                    <span className="text-sm text-[#888]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className={`transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-4">Steg 4: Fördjupning (tillgänglig)</div>
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <div className="text-sm text-[#666] mb-4">Utforska djupare analyser eller ställ en följdfråga</div>
              <button className="text-sm text-[#888] hover:text-[#e7e7e7] transition-colors">
                → Visa detaljerad modellanalys
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-md text-sm font-medium hover:bg-white transition-colors">
              Nästa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
