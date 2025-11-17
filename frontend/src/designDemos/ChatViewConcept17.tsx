import { useState, useEffect } from 'react';

/**
 * ChatViewConcept17: Enhanced Design Concept
 * Rich data, animations, and always-visible search
 */

export default function ChatViewConcept17() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const modelData = [
    { name: 'GPT-3.5', icon: '🤖', confidence: 88, bias: 2.1, facts: 92 },
    { name: 'Gemini', icon: '✨', confidence: 92, bias: 1.8, facts: 94 },
    { name: 'DeepSeek', icon: '🧠', confidence: 85, bias: 1.2, facts: 96 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            OneSeek.AI
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#151515] rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-[#888]">Klar</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-32 space-y-6">
        {/* Question */}
        <div className={`bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Din fråga</div>
          <h2 className="text-2xl text-[#e7e7e7] leading-relaxed">
            Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
          </h2>
        </div>

        {/* Consensus */}
        <div className={`bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-8 transition-all duration-700 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <div className="text-lg text-[#e7e7e7] font-medium">Konsensusanalys</div>
              <div className="text-xs text-[#666]">92% överensstämmelse mellan modeller</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Elektrifiering', desc: 'Transport och industri' },
              { icon: '🌱', title: 'Förnybar energi', desc: 'Sol och vindkraft' },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-xl p-4 hover:border-blue-500/50 transition-all">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-[#e7e7e7] font-medium mb-1">{item.title}</div>
                <div className="text-xs text-[#666]">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modelData.map((model, idx) => (
            <div key={idx} className={`bg-[#151515]/80 border border-[#2a2a2a] rounded-2xl p-6 transition-all duration-700 hover:border-[#3a3a3a] hover:scale-105 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{transitionDelay: `${200 + idx * 100}ms`}}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{model.icon}</span>
                <div>
                  <div className="text-sm text-[#e7e7e7] font-semibold">{model.name}</div>
                  <div className="text-xs text-[#666]">{model.confidence}% säker</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Bias</span>
                  <span className="text-green-500">{model.bias}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Faktahalt</span>
                  <span className="text-blue-500">{model.facts}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl p-3 flex gap-3">
            <input
              type="text"
              placeholder="Ställ en följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all">
              Skicka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
