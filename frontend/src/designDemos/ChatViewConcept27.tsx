import { useState, useEffect } from 'react';

/**
 * ChatViewConcept27: Horizontal Card Carousel
 * Based on Concept 7 - Swipeable horizontal scrolling timeline with card stages
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept27() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const stages = [
    {
      id: 'question',
      title: 'Din Fråga',
      icon: '❓',
      content: 'Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?',
    },
    {
      id: 'analysis',
      title: 'Analys Pågår',
      icon: '⚙️',
      content: '3 AI-modeller analyserar din fråga med olika perspektiv och källor...',
    },
    {
      id: 'synthesis',
      title: 'Syntes',
      icon: '🎯',
      content: 'Baserat på 3 modeller har vi identifierat 92% konsensus kring följande åtgärder...',
    },
    {
      id: 'details',
      title: 'Fördjupning',
      icon: '📊',
      content: 'Utforska varje modells unika perspektiv och källmaterial i detalj.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#151515]">
        <div className="h-14 px-6 flex items-center justify-between">
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

      {/* Progress Timeline */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#151515] px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <button
                onClick={() => setActiveStage(idx)}
                className={`flex flex-col items-center gap-2 transition-all ${
                  activeStage === idx ? 'text-[#e7e7e7]' : 'text-[#444]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  activeStage === idx 
                    ? 'border-[#e7e7e7] bg-[#1a1a1a]' 
                    : activeStage > idx
                    ? 'border-[#2a2a2a] bg-[#151515]'
                    : 'border-[#151515] bg-[#0a0a0a]'
                }`}>
                  {stage.icon}
                </div>
                <span className="text-xs">{stage.title}</span>
              </button>
              {idx < stages.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${
                  activeStage > idx ? 'bg-[#2a2a2a]' : 'bg-[#151515]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Carousel */}
      <div className="pt-36 pb-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            {/* Active Stage Card */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-8 min-h-[400px]">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">{stages[activeStage].icon}</span>
                <h2 className="text-2xl font-light">{stages[activeStage].title}</h2>
              </div>

              <p className="text-base text-[#888] leading-relaxed mb-8">
                {stages[activeStage].content}
              </p>

              {/* Stage-specific content */}
              {activeStage === 2 && (
                <div className="space-y-3">
                  {['Elektrifiering av transportsektorn', 'Utbyggnad av förnybar energi', 'Energieffektivisering i alla sektorer'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
                      <div className="w-2 h-2 bg-[#666] rounded-full" />
                      <span className="text-sm text-[#888]">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeStage === 3 && (
                <div className="grid grid-cols-3 gap-4">
                  {['GPT-3.5', 'Gemini', 'DeepSeek'].map((model, idx) => (
                    <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">{['🤖', '✨', '🧠'][idx]}</div>
                      <div className="text-xs text-[#666]">{model}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setActiveStage(Math.max(0, activeStage - 1))}
                disabled={activeStage === 0}
                className="px-4 py-2 bg-[#151515] border border-[#1a1a1a] rounded text-sm text-[#666] hover:text-[#e7e7e7] hover:border-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Föregående
              </button>
              <div className="text-xs text-[#666]">
                {activeStage + 1} / {stages.length}
              </div>
              <button
                onClick={() => setActiveStage(Math.min(stages.length - 1, activeStage + 1))}
                disabled={activeStage === stages.length - 1}
                className="px-4 py-2 bg-[#151515] border border-[#1a1a1a] rounded text-sm text-[#666] hover:text-[#e7e7e7] hover:border-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Nästa →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2">
            <input
              type="text"
              placeholder="Ställ en ny fråga..."
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
