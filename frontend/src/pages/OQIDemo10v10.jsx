import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 10: Ultimate Refinement
 * The most polished version combining all requested features:
 * - Horizontal DNA chain in header (monochrome, last node pulses)
 * - Status indicators as metadata
 * - Smaller text (13-14px)
 * - Classic chat layout (user right, AI left)
 * - Enhanced organic timeline
 * - Ghost sidebar (8px → 280px)
 * - Fade-in send button
 */
export default function OQIDemo10v10() {
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredTick, setHoveredTick] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const personas = ['Medveten', 'Expert', 'Filosofisk', 'Ärlig', 'Faktabaserad'];

  // History items with timing data for organic rhythm
  const history = [
    { id: 1, question: 'Vem är du?', charCount: 42, time: '14:03', timeDelta: 0 },
    { id: 2, question: 'Vad är ditt syfte?', charCount: 78, time: '14:07', timeDelta: 240 },
    { id: 3, question: 'Vem är Robin?', charCount: 148, time: '14:12', timeDelta: 300 },
    { id: 4, question: 'Vad betyder Robin för dig?', charCount: 345, time: '14:18', timeDelta: 360 },
  ];

  const metrics = { fidelity: 95.2, consensus: 99.7, accuracy: 99 };

  // DNA chain configuration
  const dnaNodes = 18;

  // Response time counter
  useEffect(() => {
    if (isTyping) {
      const start = Date.now();
      const timer = setInterval(() => setResponseTime(((Date.now() - start) / 1000).toFixed(2)), 50);
      return () => clearInterval(timer);
    }
  }, [isTyping]);

  // Typing animation
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
    }, 24);
    return () => clearInterval(timer);
  }, [isTyping, fullResponse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // UI auto-hide
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

  // Dynamic tick calculations for organic timeline
  const getTickWidth = (charCount) => {
    const min = 6;
    const max = 48;
    const normalized = Math.min(charCount / 300, 1);
    return min + (max - min) * normalized;
  };

  const getTickSpacing = (timeDelta) => {
    if (timeDelta > 400) return 34;
    if (timeDelta > 250) return 26;
    if (timeDelta > 150) return 18;
    return 12;
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#000] text-white font-sans relative overflow-hidden transition-all duration-700 ${quantumMode ? 'opacity-50' : ''}`}
    >
      <style>{`
        @keyframes elegantFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lastNodeGlow {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(209, 213, 219, 0.3);
          }
          50% { 
            transform: scale(1.3); 
            box-shadow: 0 0 8px 2px rgba(209, 213, 219, 0.15);
          }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes tooltipAppear {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sidebarSlide {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .elegant-fade { animation: elegantFade 0.5s ease-out forwards; }
        .last-node-glow { animation: lastNodeGlow 2.2s ease-in-out infinite; }
        .cursor-blink { animation: cursorBlink 1s infinite; }
        .tooltip-appear { animation: tooltipAppear 0.2s ease-out forwards; }
        .sidebar-slide { animation: sidebarSlide 0.3s ease-out forwards; }
      `}</style>

      {/* ===== HEADER ===== */}
      <header className={`fixed inset-x-0 top-0 z-50 px-7 py-5 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          {/* Back */}
          <Link 
            to="/oqi-demos" 
            className="text-[9px] text-[#333] hover:text-[#666] uppercase tracking-[0.2em] transition-colors"
          >
            ← Tillbaka
          </Link>

          {/* ONESEEK Title + DNA Chain - Horizontal, Left of Center */}
          <div className="absolute left-1/2 -translate-x-[55%] flex items-center gap-4">
            {/* ONESEEK Title */}
            <span className="text-[10px] font-mono text-[#555] tracking-[0.2em] uppercase">ONESEEK</span>
            
            {/* DNA Chain */}
            <div className="flex items-center gap-[5px]">
              {Array.from({ length: dnaNodes }).map((_, i) => {
                const isLast = i === dnaNodes - 1;
                const opacity = i < dnaNodes - 5 ? 0.25 : i < dnaNodes - 2 ? 0.45 : isLast ? 1 : 0.65;
                return (
                  <div
                    key={i}
                    className={`rounded-full bg-[#D1D5DB] ${isLast ? 'last-node-glow' : ''}`}
                    style={{
                      width: isLast ? '6px' : '3px',
                      height: isLast ? '6px' : '3px',
                      opacity,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Status Indicators - Metadata Style */}
          <div className="flex items-center gap-5 text-[8px] text-[#3a3a3a] tracking-[0.12em] uppercase font-light">
            <span>Fidelity <span className="text-[#555]">{metrics.fidelity}%</span></span>
            <span>Consensus <span className="text-[#555]">{metrics.consensus}%</span></span>
            <span>Accuracy <span className="text-[#555]">{metrics.accuracy}%</span></span>
            <span className="text-[#4a4a4a]">{selectedCharacter}</span>
          </div>
        </div>
      </header>

      {/* ===== LEFT TIMELINE ===== */}
      <aside className={`fixed left-5 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start">
          {/* Up indicator */}
          <div className="text-[6px] text-[#222] mb-3">↑</div>
          
          {/* Timeline container */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#0a0a0a] via-[#181818] to-[#0a0a0a]" />
            
            {/* Timeline ticks */}
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center cursor-pointer relative"
                style={{ marginTop: idx === 0 ? 0 : `${getTickSpacing(item.timeDelta)}px` }}
                onMouseEnter={() => setHoveredTick(item.id)}
                onMouseLeave={() => setHoveredTick(null)}
              >
                {/* Tick line - dynamic width based on content length */}
                <div 
                  className={`h-px transition-all duration-200 ${
                    hoveredTick === item.id ? 'bg-white' : 'bg-[#222]'
                  }`}
                  style={{ width: `${getTickWidth(item.charCount)}px` }}
                />
                
                {/* Tooltip */}
                {hoveredTick === item.id && (
                  <div className="absolute left-full ml-4 bg-[#050505] border border-[#151515] rounded-md px-4 py-2.5 min-w-[200px] tooltip-appear z-50">
                    <p className="text-[11px] text-[#c0c0c0] font-light leading-relaxed">{item.question}</p>
                    <p className="text-[7px] text-[#444] mt-2 tracking-wide">Idag {item.time}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Down indicator */}
          <div className="text-[6px] text-[#222] mt-3">↓</div>
        </div>
      </aside>

      {/* ===== RIGHT SIDEBAR ===== */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-400 ease-out ${
          sidebarActive ? 'w-[280px]' : 'w-[8px]'
        }`}
        onMouseEnter={() => setSidebarActive(true)}
        onMouseLeave={() => setSidebarActive(false)}
      >
        {/* Collapsed state - thin line */}
        {!sidebarActive && (
          <div className="h-full flex items-center justify-center">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#1a1a1a] to-transparent" />
          </div>
        )}
        
        {/* Expanded state */}
        {sidebarActive && (
          <div className="h-full bg-[#030303] border-l border-[#0f0f0f] p-8 pt-24 sidebar-slide">
            <p className="text-[8px] text-[#2a2a2a] uppercase tracking-[0.2em] mb-8">Verktyg</p>
            <div className="space-y-5">
              {['Spara svar', 'Bokmärken', 'Historik', 'Exportera', 'Inställningar'].map((item) => (
                <button 
                  key={item}
                  className="block w-full text-left text-[11px] text-[#3a3a3a] hover:text-white transition-colors py-1"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <main className={`min-h-screen flex flex-col justify-end px-24 pb-52 pt-24 ${focusMode ? 'scale-[1.01]' : ''} transition-transform duration-500`}>
        <div className="max-w-xl mx-auto w-full space-y-8">
          
          {/* User Message - Right Aligned */}
          <div className="flex justify-end elegant-fade" style={{ animationDelay: '0.05s' }}>
            <p className="text-[14px] text-[#666] font-light text-right leading-relaxed max-w-sm tracking-tight">
              Vad betyder Robin för dig?
            </p>
          </div>

          {/* AI Response - Left Aligned */}
          <div className="flex justify-start elegant-fade" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-md">
              {/* Meta info line with ONESEEK SVARAR */}
              <div className="text-[8px] text-[#3a3a3a] mb-3 tracking-wide font-light uppercase">
                <span className="text-[#555]">ONESEEK SVARAR</span> · <span className="text-[#444]">{responseTime}s</span> · 26 nov 2025 14:18
              </div>
              
              {/* Response text - reduced size */}
              <p className="text-[14px] text-[#aaa] font-light leading-[1.9] tracking-tight">
                {typingText}
                {isTyping && (
                  <span className="cursor-blink inline-block w-[1.5px] h-[15px] bg-white ml-1 -mb-[2px]" />
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ===== INPUT AREA ===== */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black via-black/98 to-transparent px-24 pb-10 pt-6">
          <div className="max-w-xl mx-auto">
            
            {/* Character/Persona Selection */}
            <div className="flex justify-center gap-6 mb-6">
              {personas.map((persona) => (
                <button
                  key={persona}
                  onClick={() => setSelectedCharacter(persona)}
                  className={`text-[9px] tracking-[0.12em] transition-all duration-300 ${
                    selectedCharacter === persona 
                      ? 'text-white' 
                      : 'text-[#2a2a2a] hover:text-[#555]'
                  }`}
                >
                  {persona}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                className="w-full bg-transparent border-b border-[#111] focus:border-[#2a2a2a] py-3 text-[14px] text-white placeholder-[#222] focus:outline-none transition-colors font-light tracking-wide"
              />
              
              {/* Send Button - Fade in when typing */}
              <button 
                className={`absolute right-0 bottom-3 transition-all duration-400 ${
                  messageInput 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                <div className="w-6 h-6 rounded-full border border-[#222] hover:border-[#444] hover:bg-white/5 flex items-center justify-center transition-all">
                  <span className="text-[8px] text-[#666]">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className={`fixed bottom-3 left-5 text-[7px] text-[#1a1a1a] transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        Q = Quantum · F = Focus
      </div>
    </div>
  );
}
