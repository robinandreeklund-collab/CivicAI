import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 8: Pure Essence
 * Features: Centered DNA chain header, asymmetric chat bubbles, 
 * whisper-thin timeline, ghost sidebar
 */
export default function OQIDemo10v8() {
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredTick, setHoveredTick] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const characters = ['Medveten', 'Expert', 'Filosofisk', 'Ärlig', 'Faktabaserad'];

  const historyTicks = [
    { id: 1, q: 'Vem är du?', chars: 42, time: '14:03', gap: 0 },
    { id: 2, q: 'Vad är ditt syfte?', chars: 78, time: '14:07', gap: 240 },
    { id: 3, q: 'Vem är Robin?', chars: 145, time: '14:12', gap: 300 },
    { id: 4, q: 'Vad betyder Robin för dig?', chars: 340, time: '14:18', gap: 360 },
  ];

  const metrics = { fidelity: 95.2, consensus: 99.7, accuracy: 99 };

  useEffect(() => {
    if (isTyping) {
      const start = Date.now();
      const timer = setInterval(() => setResponseTime(((Date.now() - start) / 1000).toFixed(2)), 50);
      return () => clearInterval(timer);
    }
  }, [isTyping]);

  useEffect(() => {
    if (!isTyping) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullResponse.length) {
        setTypingText(fullResponse.slice(0, ++i));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 26);
    return () => clearInterval(timer);
  }, [isTyping, fullResponse]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let t;
    const onMove = () => {
      setShowUI(true);
      clearTimeout(t);
      t = setTimeout(() => setShowUI(false), 3500);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(t);
    };
  }, []);

  const tickLen = (chars) => Math.min(6 + chars / 12, 45);
  const tickGap = (gap) => gap > 400 ? 32 : gap > 200 ? 22 : 14;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-black text-white font-sans relative overflow-hidden transition-all duration-700 ${quantumMode ? 'opacity-55' : ''}`}
    >
      <style>{`
        @keyframes softFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseNode {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
          50% { transform: scale(1.35); box-shadow: 0 0 6px 2px rgba(255,255,255,0.15); }
        }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes tipSlide { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        .soft-fade { animation: softFade 0.5s ease-out forwards; }
        .pulse-node { animation: pulseNode 2.2s ease-in-out infinite; }
        .blink { animation: blink 1s infinite; }
        .tip-slide { animation: tipSlide 0.2s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className={`fixed inset-x-0 top-0 z-50 px-6 py-4 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <Link to="/oqi-demos" className="text-[9px] text-[#3a3a3a] hover:text-[#666] transition-colors uppercase tracking-widest">
            ← Tillbaka
          </Link>

          {/* DNA Chain - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[5px]">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full ${i === 13 ? 'pulse-node' : ''}`}
                style={{
                  width: i === 13 ? '6px' : '3px',
                  height: i === 13 ? '6px' : '3px',
                  backgroundColor: '#D1D5DB',
                  opacity: i < 10 ? 0.3 : i === 13 ? 1 : 0.5,
                }}
              />
            ))}
          </div>

          {/* Metrics */}
          <div className="flex gap-4 text-[7px] text-[#444] tracking-widest uppercase">
            <span>Fidelity {metrics.fidelity}%</span>
            <span>Consensus {metrics.consensus}%</span>
            <span>Accuracy {metrics.accuracy}%</span>
            <span className="text-[#555]">{selectedCharacter}</span>
          </div>
        </div>
      </header>

      {/* Left Timeline */}
      <aside className={`fixed left-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start relative">
          <span className="text-[6px] text-[#2a2a2a] mb-2">↑</span>
          <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#1a1a1a] to-transparent" />
          
          {historyTicks.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center cursor-pointer relative"
              style={{ marginTop: i === 0 ? 0 : `${tickGap(t.gap)}px` }}
              onMouseEnter={() => setHoveredTick(t.id)}
              onMouseLeave={() => setHoveredTick(null)}
            >
              <div 
                className={`h-px transition-all duration-150 ${hoveredTick === t.id ? 'bg-white' : 'bg-[#2a2a2a]'}`}
                style={{ width: `${tickLen(t.chars)}px` }}
              />
              {hoveredTick === t.id && (
                <div className="absolute left-full ml-3 bg-[#060606] border border-[#181818] rounded px-3 py-2 min-w-[180px] tip-slide z-50">
                  <p className="text-[10px] text-[#bbb] font-light">{t.q}</p>
                  <p className="text-[7px] text-[#444] mt-1">Idag {t.time}</p>
                </div>
              )}
            </div>
          ))}
          
          <span className="text-[6px] text-[#2a2a2a] mt-2">↓</span>
        </div>
      </aside>

      {/* Right Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-400 ${sidebarOpen ? 'w-72' : 'w-2'}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {!sidebarOpen ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#222] to-transparent" />
          </div>
        ) : (
          <div className="h-full bg-[#030303] border-l border-[#111] p-6 pt-20 soft-fade">
            <p className="text-[8px] text-[#333] uppercase tracking-widest mb-6">Verktyg</p>
            {['Spara', 'Bokmärken', 'Historik', 'Export'].map(item => (
              <button key={item} className="block w-full text-left text-[11px] text-[#444] hover:text-white py-2 transition-colors">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <main className={`min-h-screen flex flex-col justify-end px-20 pb-48 pt-20 ${focusMode ? 'scale-[1.01]' : ''} transition-transform duration-500`}>
        <div className="max-w-lg mx-auto w-full space-y-6">
          {/* User - Right */}
          <div className="flex justify-end soft-fade" style={{ animationDelay: '0.1s' }}>
            <p className="text-[12px] text-[#666] font-light max-w-xs text-right leading-relaxed">
              Vad betyder Robin för dig?
            </p>
          </div>

          {/* AI - Left */}
          <div className="flex justify-start soft-fade" style={{ animationDelay: '0.15s' }}>
            <div className="max-w-md">
              <p className="text-[7px] text-[#3a3a3a] mb-2 tracking-wide">
                OneSeek <span className="text-[#555]">{responseTime}s</span> · 26 nov 2025 14:18
              </p>
              <p className="text-[12px] text-[#aaa] font-light leading-[1.9] tracking-tight">
                {typingText}
                {isTyping && <span className="blink inline-block w-[1.5px] h-[13px] bg-white ml-0.5 -mb-[1px]" />}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Input */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black to-transparent px-20 pb-8 pt-4">
          <div className="max-w-lg mx-auto">
            {/* Characters */}
            <div className="flex justify-center gap-5 mb-4">
              {characters.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCharacter(c)}
                  className={`text-[8px] tracking-wider transition-colors ${selectedCharacter === c ? 'text-white' : 'text-[#333] hover:text-[#666]'}`}
                >
                  {c}
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
                className="w-full bg-transparent border-b border-[#151515] focus:border-[#2a2a2a] py-2 text-[12px] text-white placeholder-[#2a2a2a] focus:outline-none transition-colors font-light"
              />
              <button 
                className={`absolute right-0 bottom-2 w-4 h-4 rounded-full border border-[#2a2a2a] flex items-center justify-center transition-all duration-300 ${
                  messageInput ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <span className="text-[7px] text-[#666]">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-2 left-4 text-[6px] text-[#1a1a1a] transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        Q = Quantum · F = Focus
      </div>
    </div>
  );
}
