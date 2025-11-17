import { useState, useEffect } from 'react';

/**
 * ChatViewConcept26: Split-Screen Dual Model Comparison
 * Based on Concept 5 & 6 - Side-by-side model comparison with visual diff highlighting
 * Brand: OneSeek.AI grayscale aesthetic
 */

export default function ChatViewConcept26() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState(['GPT-3.5', 'Gemini']);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const availableModels = [
    { id: 'GPT-3.5', icon: '🤖', name: 'GPT-3.5' },
    { id: 'Gemini', icon: '✨', name: 'Gemini' },
    { id: 'DeepSeek', icon: '🧠', name: 'DeepSeek' },
  ];

  const modelResponses = {
    'GPT-3.5': {
      points: ['Elektrifiering av transport', 'Förnybar energi', 'Energieffektivisering'],
      tone: 'Teknisk',
      confidence: 94,
    },
    'Gemini': {
      points: ['Förnybar energi som prioritet', 'Elektrifiering', 'Infrastrukturinvesteringar'],
      tone: 'Övertygande',
      confidence: 91,
    },
    'DeepSeek': {
      points: ['Energieffektivisering först', 'Smart elnät', 'Elektrifiering av industri'],
      tone: 'Analytisk',
      confidence: 89,
    },
  };

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

      {/* Model Selectors */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#151515]">
        <div className="grid grid-cols-2 divide-x divide-[#151515]">
          {selectedModels.map((model, idx) => (
            <div key={idx} className="px-6 py-4">
              <select 
                value={model}
                onChange={(e) => {
                  const newModels = [...selectedModels];
                  newModels[idx] = e.target.value;
                  setSelectedModels(newModels);
                }}
                className="w-full bg-[#151515] border border-[#1a1a1a] rounded px-3 py-2 text-sm text-[#e7e7e7] focus:outline-none focus:border-[#2a2a2a]"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="pt-28 pb-32">
        <div className="grid grid-cols-2 divide-x divide-[#151515]">
          {selectedModels.map((modelId, panelIdx) => {
            const model = availableModels.find(m => m.id === modelId);
            const response = modelResponses[modelId];
            
            return (
              <div key={panelIdx} className="px-6 py-8">
                <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: `${panelIdx * 100}ms`}}>
                  {/* Model Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{model?.icon}</span>
                    <div>
                      <h3 className="text-base font-light">{model?.name}</h3>
                      <div className="text-xs text-[#666]">{response?.tone} ton</div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#666]">Säkerhet</span>
                      <span className="text-xs text-[#e7e7e7]">{response?.confidence}%</span>
                    </div>
                    <div className="h-1 bg-[#151515] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#e7e7e7] transition-all duration-1000"
                        style={{width: mounted ? `${response?.confidence}%` : '0%'}}
                      />
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="space-y-3">
                    <div className="text-xs text-[#666] uppercase tracking-widest mb-3">Huvudpunkter</div>
                    {response?.points.map((point, idx) => (
                      <div 
                        key={idx}
                        className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs text-[#666] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-[#888]">{point}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Agreement Badge */}
                  <div className="mt-6 px-4 py-2 bg-[#151515] border border-[#1a1a1a] rounded-lg text-center">
                    <div className="text-xs text-[#666]">Överensstämmer med andra modeller</div>
                    <div className="text-lg font-light text-[#e7e7e7] mt-1">
                      {panelIdx === 0 ? '87%' : '91%'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2">
            <input
              type="text"
              placeholder="Jämför modellernas svar..."
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
