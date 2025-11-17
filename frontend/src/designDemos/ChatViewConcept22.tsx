import { useState, useEffect } from 'react';

/**
 * ChatViewConcept22: Elegant Stacked Cards with Side Navigation
 * Based on Concept 5 & 7 - Card-based interface with vertical tab navigation
 * Brand: OneSeek.AI grayscale with sophisticated stacking
 */

export default function ChatViewConcept22() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('översikt');
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const tabs = [
    { id: 'översikt', label: 'Översikt', icon: '📊' },
    { id: 'modeller', label: 'Modeller', icon: '🤖' },
    { id: 'källor', label: 'Källor', icon: '📚' },
    { id: 'historik', label: 'Historik', icon: '⏱️' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/98 backdrop-blur-sm border-b border-[#151515]">
        <div className="h-14 px-6 flex items-center justify-between">
          <div className="text-lg font-light tracking-wide">OneSeek.AI</div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-xs uppercase tracking-wider text-[#666] hover:text-[#e7e7e7] transition-colors"
          >
            Meny
          </button>
        </div>

        {/* Menu Dropdown */}
        {menuOpen && (
          <div className="absolute top-full right-0 w-56 bg-[#151515] border-l border-b border-[#1a1a1a]">
            {['Hem', 'Chat', 'Inställningar', 'Kontakt'].map((item, idx) => (
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

      {/* Main Layout */}
      <div className="flex pt-14">
        {/* Left Side Navigation */}
        <div className="w-64 fixed left-0 top-14 bottom-0 bg-[#0a0a0a] border-r border-[#151515] overflow-y-auto">
          <div className="p-6">
            <div className="text-xs text-[#444] uppercase tracking-widest mb-6">Navigering</div>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#151515] text-[#e7e7e7] border border-[#1a1a1a]'
                      : 'text-[#666] hover:text-[#888] hover:bg-[#0f0f0f]'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 ml-64 p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            {/* Question Card */}
            <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-8 mb-6 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="text-xs text-[#444] uppercase tracking-wider mb-3">Din fråga</div>
              <h2 className="text-2xl font-light leading-relaxed">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </h2>
            </div>

            {activeTab === 'översikt' && (
              <>
                {/* Consensus Card */}
                <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-8 mb-6 transition-all duration-700 delay-100 ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-xl">🎯</div>
                    <div>
                      <h3 className="text-lg font-light">Konsensusanalys</h3>
                      <div className="text-xs text-[#666]">3 modeller • 92% överensstämmelse</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {['Elektrifiering prioriteras', 'Förnybar energi betonas', 'Energieffektivisering viktigt'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-2">
                        <div className="w-1.5 h-1.5 bg-[#666] rounded-full" />
                        <span className="text-sm text-[#888]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Cards Stack */}
                {['GPT-3.5', 'Gemini', 'DeepSeek'].map((model, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 mb-4 transition-all duration-700 hover:border-[#2a2a2a] ${
                      mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    }`}
                    style={{transitionDelay: `${200 + idx * 100}ms`}}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{idx === 0 ? '🤖' : idx === 1 ? '✨' : '🧠'}</span>
                      <span className="text-base font-light">{model}</span>
                    </div>
                    <p className="text-sm text-[#888] leading-relaxed">
                      Detaljerad analys från {model} visar på vikten av systematiska klimatåtgärder med fokus på elektrifiering och förnybar energi.
                    </p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'modeller' && (
              <div className="grid grid-cols-1 gap-6">
                {['GPT-3.5', 'Gemini', 'DeepSeek'].map((model, idx) => (
                  <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-8">
                    <h3 className="text-lg font-light mb-4">{model}</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Tillförlitlighet</span>
                        <span className="text-[#e7e7e7]">{90 + idx * 2}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Källor verifierade</span>
                        <span className="text-[#e7e7e7]">{12 + idx * 3}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'källor' && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
                    <div className="text-sm text-[#e7e7e7] mb-2">Regeringen.se - Klimatplan 2030</div>
                    <div className="text-xs text-[#666]">Officiell källa • Verifierad {idx + 2} gånger</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'historik' && (
              <div className="space-y-4">
                {['Idag 14:32', 'Idag 12:15', 'Igår 16:40'].map((time, idx) => (
                  <div key={idx} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
                    <div className="text-xs text-[#666] mb-2">{time}</div>
                    <div className="text-sm text-[#888]">Klimatpolitiska åtgärder för Sverige</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-64 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-8">
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
