import { useState, useEffect } from 'react';

/**
 * ChatViewConcept29: Layered Cards with 3D Depth
 * Based on Concept 1 & 5 - Stacked perspective cards with shadow depth and hover effects
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept29() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const modelCards = [
    {
      id: 0,
      model: 'GPT-3.5',
      icon: '🤖',
      summary: 'Elektrifiering av transportsektorn är avgörande',
      details: ['Övergång till elbilar', 'Elektrifiering av tunga transporter', 'Laddinfrastruktur'],
      confidence: 94,
      color: '#1a1a1a',
    },
    {
      id: 1,
      model: 'Gemini',
      icon: '✨',
      summary: 'Förnybar energi måste prioriteras',
      details: ['Utbyggnad av sol- och vindkraft', 'Investeringar i infrastruktur', 'Energilagring'],
      confidence: 91,
      color: '#151515',
    },
    {
      id: 2,
      model: 'DeepSeek',
      icon: '🧠',
      summary: 'Energieffektivisering reducerar utsläpp',
      details: ['Smart elnät', 'Energieffektiva byggnader', 'Industriell optimering'],
      confidence: 89,
      color: '#0f0f0f',
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

      {/* Main Content */}
      <div className="pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className={`mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Din fråga</div>
            <h2 className="text-2xl font-light leading-relaxed">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Stacked Cards with Depth */}
          <div className="relative" style={{perspective: '1000px'}}>
            {modelCards.map((card, idx) => {
              const isExpanded = expandedCard === idx;
              const offset = expandedCard === null 
                ? idx * 20 
                : expandedCard > idx 
                ? idx * 10 
                : expandedCard === idx 
                ? 0 
                : (idx - 1) * 10 + 80;

              return (
                <div
                  key={card.id}
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  className={`absolute left-0 right-0 cursor-pointer transition-all duration-700 ${
                    mounted ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    top: `${offset}px`,
                    zIndex: isExpanded ? 10 : modelCards.length - idx,
                    transform: isExpanded 
                      ? 'scale(1.02) rotateX(0deg)' 
                      : `scale(${1 - idx * 0.02}) rotateX(${idx * 1}deg)`,
                    transitionDelay: `${idx * 100}ms`,
                  }}
                >
                  <div 
                    className={`border rounded-lg overflow-hidden transition-all duration-500 ${
                      isExpanded 
                        ? 'border-[#2a2a2a] shadow-2xl' 
                        : 'border-[#1a1a1a] shadow-lg hover:border-[#2a2a2a]'
                    }`}
                    style={{
                      backgroundColor: card.color,
                      boxShadow: isExpanded 
                        ? '0 20px 60px rgba(0,0,0,0.8)' 
                        : `0 ${4 + idx * 2}px ${12 + idx * 4}px rgba(0,0,0,0.6)`,
                    }}
                  >
                    <div className="p-6">
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{card.icon}</span>
                          <div>
                            <h3 className="text-base font-light">{card.model}</h3>
                            <div className="text-xs text-[#666]">{card.confidence}% säkerhet</div>
                          </div>
                        </div>
                        <div className={`text-xs text-[#666] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-[#888] mb-4">{card.summary}</p>

                      {/* Confidence Bar */}
                      <div className="h-1 bg-[#0a0a0a] rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-[#2a2a2a] transition-all duration-1000"
                          style={{width: mounted ? `${card.confidence}%` : '0%'}}
                        />
                      </div>

                      {/* Expandable Details */}
                      <div className={`overflow-hidden transition-all duration-500 ${
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="pt-4 border-t border-[#1a1a1a]">
                          <div className="text-xs text-[#666] uppercase tracking-widest mb-3">Detaljer</div>
                          <div className="space-y-2">
                            {card.details.map((detail, detailIdx) => (
                              <div key={detailIdx} className="flex items-start gap-2 text-xs text-[#888]">
                                <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-1.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spacer for stacked cards */}
          <div style={{height: `${modelCards.length * 20 + 300}px`}} />

          {/* Consensus Summary */}
          <div className={`mt-8 bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 transition-all duration-700 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-center">
              <div className="text-xs text-[#666] uppercase tracking-widest mb-2">Konsensus</div>
              <div className="text-3xl font-light mb-1">92%</div>
              <div className="text-xs text-[#888]">Modellerna är överens om huvudåtgärderna</div>
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
              placeholder="Utforska perspektiven..."
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
