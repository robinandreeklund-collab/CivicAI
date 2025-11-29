import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 9: Zen Flow
 * Features: Fluid DNA chain, breath-like animations, organic timeline with 
 * natural spacing, whisper-light UI elements
 */
export default function OQIDemo10v9() {
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [sidebarHover, setSidebarHover] = useState(false);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const personas = ['Medveten', 'Expert', 'Filosofisk', 'Ärlig', 'Faktabaserad'];

  const history = [
    { id: 1, text: 'Vem är du?', len: 38, time: '14:03', delta: 0 },
    { id: 2, text: 'Vad är ditt syfte?', len: 85, time: '14:07', delta: 240 },
    { id: 3, text: 'Vem är Robin?', len: 162, time: '14:12', delta: 300 },
    { id: 4, text: 'Vad betyder Robin för dig?', len: 345, time: '14:18', delta: 360 },
  ];

  const stats = { fidelity: 95.2, consensus: 99.7, accuracy: 99 };

  useEffect(() => {
    if (isTyping) {
      const t0 = Date.now();
      const interval = setInterval(() => setResponseTime(((Date.now() - t0) / 1000).toFixed(2)), 50);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  useEffect(() => {
    if (!isTyping) return;
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < fullResponse.length) {
        setTypingText(fullResponse.slice(0, ++idx));
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [isTyping, fullResponse]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    let timer;
    const handleMove = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowUI(false), 4000);
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(timer);
    };
  }, []);

  // Organic calculations
  const tickWidth = (len) => Math.min(5 + len / 10, 50);
  const tickMargin = (delta) => delta > 350 ? 36 : delta > 200 ? 24 : 16;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#000] text-white font-sans relative overflow-hidden transition-all duration-800 ${quantumMode ? 'opacity-50' : ''}`}
    >
      <style>{`
        @keyframes gentleFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes cursorPulse { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes slideReveal {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .gentle-fade { animation: gentleFade 0.6s ease-out forwards; }
        .breathe { animation: breathe 2.4s ease-in-out infinite; }
        .cursor-pulse { animation: cursorPulse 1s infinite; }
        .slide-reveal { animation: slideReveal 0.2s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-opacity duration-600 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="px-8 py-5 flex items-center justify-between">
          <Link to="/oqi-demos" className="text-[8px] text-[#333] hover:text-[#555] uppercase tracking-[0.2em] transition-colors">
            ← Tillbaka
          </Link>

          {/* DNA Chain - Flowing */}
          <div className="absolute left-1/2 -translate-x-[40%] flex items-center gap-1">
            {Array.from({ length: 16 }).map((_, i) => {
              const isLast = i === 15;
              const opacity = i < 10 ? 0.25 : i < 14 ? 0.45 : isLast ? 1 : 0.65;
              return (
                <div
                  key={i}
                  className={`rounded-full bg-[#D1D5DB] transition-all duration-500 ${isLast ? 'breathe' : ''}`}
                  style={{
                    width: isLast ? '7px' : '3px',
                    height: isLast ? '7px' : '3px',
                    opacity,
                  }}
                />
              );
            })}
          </div>

          {/* Metrics - Whisper */}
          <div className="flex items-center gap-5 text-[7px] text-[#3a3a3a] tracking-[0.15em] uppercase">
            <span>Fidelity {stats.fidelity}%</span>
            <span>Consensus {stats.consensus}%</span>
            <span>Accuracy {stats.accuracy}%</span>
            <span className="text-[#4a4a4a]">{selectedCharacter}</span>
          </div>
        </div>
      </header>

      {/* Timeline - Organic Rhythm */}
      <aside className={`fixed left-5 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-600 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start">
          <span className="text-[5px] text-[#222] mb-3">▲</span>
          
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#111] via-[#1a1a1a] to-[#111]" />
            
            {history.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center cursor-pointer"
                style={{ marginTop: i === 0 ? 0 : `${tickMargin(item.delta)}px` }}
                onMouseEnter={() => setActiveHistoryId(item.id)}
                onMouseLeave={() => setActiveHistoryId(null)}
              >
                <div 
                  className={`h-px transition-all duration-200 ${
                    activeHistoryId === item.id ? 'bg-white' : 'bg-[#1f1f1f]'
                  }`}
                  style={{ width: `${tickWidth(item.len)}px` }}
                />
                
                {activeHistoryId === item.id && (
                  <div className="absolute left-full ml-4 bg-[#040404] border border-[#141414] rounded-md px-4 py-2.5 min-w-[190px] slide-reveal z-50">
                    <p className="text-[10px] text-[#c0c0c0] font-light">{item.text}</p>
                    <p className="text-[6px] text-[#444] mt-1.5 tracking-wide">Idag {item.time}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <span className="text-[5px] text-[#222] mt-3">▼</span>
        </div>
      </aside>

      {/* Sidebar - Ghost */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-500 ease-out ${
          sidebarHover ? 'w-[280px]' : 'w-[8px]'
        }`}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        {!sidebarHover ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#1a1a1a] to-transparent" />
          </div>
        ) : (
          <div className="h-full bg-[#020202] border-l border-[#0f0f0f] p-7 pt-24 gentle-fade">
            <p className="text-[7px] text-[#2a2a2a] uppercase tracking-[0.2em] mb-7">Verktyg</p>
            <div className="space-y-4">
              {['Spara svar', 'Bokmärken', 'Historik', 'Exportera'].map(item => (
                <button 
                  key={item}
                  className="block w-full text-left text-[10px] text-[#3a3a3a] hover:text-white transition-colors py-1"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      <main className={`min-h-screen flex flex-col justify-end px-24 pb-52 pt-24 ${focusMode ? 'scale-[1.015]' : ''} transition-transform duration-600`}>
        <div className="max-w-xl mx-auto w-full space-y-8">
          
          {/* User */}
          <div className="flex justify-end gentle-fade" style={{ animationDelay: '0.05s' }}>
            <p className="text-[13px] text-[#5a5a5a] font-light text-right leading-relaxed max-w-sm">
              Vad betyder Robin för dig?
            </p>
          </div>

          {/* AI */}
          <div className="flex justify-start gentle-fade" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-md">
              <div className="text-[7px] text-[#333] mb-2.5 tracking-[0.1em]">
                OneSeek <span className="text-[#4a4a4a]">{responseTime}s</span> · 26 nov 2025 14:18
              </div>
              <p className="text-[13px] text-[#9a9a9a] font-light leading-[1.95] tracking-tight">
                {typingText}
                {isTyping && <span className="cursor-pulse inline-block w-[1.5px] h-[14px] bg-white ml-1 -mb-[2px]" />}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Input */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-600 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black via-black/98 to-transparent px-24 pb-10 pt-5">
          <div className="max-w-xl mx-auto">
            {/* Personas */}
            <div className="flex justify-center gap-6 mb-5">
              {personas.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedCharacter(p)}
                  className={`text-[8px] tracking-[0.15em] transition-colors ${
                    selectedCharacter === p ? 'text-white' : 'text-[#2a2a2a] hover:text-[#555]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                className="w-full bg-transparent border-b border-[#111] focus:border-[#222] py-3 text-[13px] text-white placeholder-[#222] focus:outline-none transition-colors font-light tracking-wide"
              />
              <button 
                className={`absolute right-0 bottom-3 transition-all duration-400 ${
                  messageInput ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-[#222] hover:border-[#444] flex items-center justify-center transition-colors">
                  <span className="text-[7px] text-[#555]">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-3 left-5 text-[6px] text-[#151515] transition-opacity duration-600 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        Q = Quantum · F = Focus
      </div>
    </div>
  );
}
