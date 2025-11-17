import { useState, useEffect } from 'react';

/**
 * ChatViewConcept25: Grid Dashboard with Command Palette
 * Based on Concept 1 & 5 - Modular grid layout with quick actions
 * Brand: OneSeek.AI grayscale with dashboard aesthetics
 */

export default function ChatViewConcept25() {
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    
    // Keyboard shortcut
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/98 backdrop-blur-sm border-b border-[#151515]">
        <div className="h-14 px-6 flex items-center justify-between">
          <h1 className="text-lg font-light tracking-wide">OneSeek.AI</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCommandOpen(true)}
              className="px-3 py-1.5 bg-[#151515] border border-[#1a1a1a] rounded text-xs text-[#666] hover:text-[#e7e7e7] hover:border-[#2a2a2a] transition-colors"
            >
              ⌘K
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-xs uppercase tracking-wider text-[#666] hover:text-[#e7e7e7] transition-colors"
            >
              Meny
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute top-full right-0 w-56 bg-[#151515] border-l border-b border-[#1a1a1a]">
            {['Hem', 'Dashboard', 'Inställningar', 'Hjälp'].map((item, idx) => (
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

      {/* Command Palette */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm flex items-start justify-center pt-32" onClick={() => setCommandOpen(false)}>
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Sök kommando eller funktion..."
              className="w-full bg-transparent px-6 py-4 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none border-b border-[#1a1a1a]"
              autoFocus
            />
            <div className="p-2">
              {['Ny analys', 'Visa historik', 'Exportera', 'Inställningar'].map((cmd, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-4 py-3 rounded text-sm text-[#666] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Question Header */}
          <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-xs text-[#444] uppercase tracking-widest mb-3">Aktuell analys</div>
            <h2 className="text-2xl font-light leading-relaxed max-w-4xl">
              Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
            </h2>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Card */}
            <div className={`lg:col-span-2 bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">🎯</div>
                <div>
                  <div className="text-base font-light">Syntes</div>
                  <div className="text-xs text-[#666]">92% konsensus</div>
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

            {/* Stats Card */}
            <div className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-xs text-[#666] uppercase tracking-wider mb-4">Översikt</div>
              <div className="space-y-4">
                {[
                  { label: 'Modeller', value: '3' },
                  { label: 'Källor', value: '15' },
                  { label: 'Tillförlitlighet', value: '94%' },
                ].map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-[#1a1a1a] last:border-0">
                    <span className="text-xs text-[#666]">{stat.label}</span>
                    <span className="text-sm text-[#e7e7e7]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Cards */}
            {[
              { name: 'GPT-3.5', icon: '🤖' },
              { name: 'Gemini', icon: '✨' },
              { name: 'DeepSeek', icon: '🧠' }
            ].map((model, idx) => (
              <div
                key={idx}
                className={`bg-[#151515] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#2a2a2a] transition-all duration-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{transitionDelay: `${300 + idx * 100}ms`}}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{model.icon}</span>
                  <div className="text-sm font-light">{model.name}</div>
                </div>
                <p className="text-xs text-[#888] leading-relaxed">
                  Perspektiv från {model.name} visar på vikten av systematiska klimatåtgärder.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-2 flex gap-2">
            <input
              type="text"
              placeholder="Ny fråga eller följdfråga..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[#e7e7e7] placeholder-[#444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-md text-sm font-medium hover:bg-white transition-colors">
              Analysera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
