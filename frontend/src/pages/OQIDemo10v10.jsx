import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 10: Ultimate Refinement
 * The most polished version combining all requested features:
 * - Horizontal DNA chain in header (monochrome, scrollable, with hover info)
 * - Status indicators as metadata + Microtraining status
 * - Smaller text (13-14px)
 * - Classic chat layout (user right, AI left) with timestamps
 * - Enhanced organic timeline with pulsing active tick
 * - Ultra-minimal ghost sidebar with elegant animation
 * - Fade-in send button
 * - W = White mode toggle
 */
export default function OQIDemo10v10() {
  const [quantumMode, setQuantumMode] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredTick, setHoveredTick] = useState(null);
  const [hoveredDnaNode, setHoveredDnaNode] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [microtrainingQueue, setMicrotrainingQueue] = useState(3);
  const [microtrainingActive, setMicrotrainingActive] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState(4);
  const containerRef = useRef(null);
  const dnaScrollRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const personas = ['Medveten', 'Expert', 'Filosofisk', 'Ärlig', 'Faktabaserad'];

  // History items with timing data for organic rhythm
  const history = [
    { id: 1, question: 'Vem är du?', charCount: 42, time: '14:03', date: '26 nov 2025', timeDelta: 0 },
    { id: 2, question: 'Vad är ditt syfte?', charCount: 78, time: '14:07', date: '26 nov 2025', timeDelta: 240 },
    { id: 3, question: 'Vem är Robin?', charCount: 148, time: '14:12', date: '26 nov 2025', timeDelta: 300 },
    { id: 4, question: 'Vad betyder Robin för dig?', charCount: 345, time: '14:18', date: '26 nov 2025', timeDelta: 360 },
  ];

  const metrics = { fidelity: 95.2, consensus: 99.7, accuracy: 99 };

  // DNA chain with ledger data - scrollable
  const dnaChain = [
    { id: 1, block: 'Block 101', time: '13:45', hash: '0x8a2f...c4d1', status: 'verified' },
    { id: 2, block: 'Block 102', time: '13:51', hash: '0x9b3e...d5e2', status: 'verified' },
    { id: 3, block: 'Block 103', time: '13:58', hash: '0xa4c1...e6f3', status: 'verified' },
    { id: 4, block: 'Block 104', time: '14:03', hash: '0xb5d2...f7g4', status: 'verified' },
    { id: 5, block: 'Block 105', time: '14:07', hash: '0xc6e3...g8h5', status: 'verified' },
    { id: 6, block: 'Block 106', time: '14:12', hash: '0xd7f4...h9i6', status: 'verified' },
    { id: 7, block: 'Block 107', time: '14:15', hash: '0xe8g5...i0j7', status: 'verified' },
    { id: 8, block: 'Block 108', time: '14:18', hash: '0xf9h6...j1k8', status: 'pending' },
  ];

  // Response time counter
  useEffect(() => {
    if (isTyping) {
      const start = Date.now();
      const timer = setInterval(() => setResponseTime(((Date.now() - start) / 1000).toFixed(2)), 50);
      return () => clearInterval(timer);
    }
  }, [isTyping]);

  // Microtraining queue simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMicrotrainingQueue(prev => {
        if (prev > 0) return prev - 1;
        return Math.floor(Math.random() * 4) + 1;
      });
      setMicrotrainingActive(prev => !prev || Math.random() > 0.3);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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
      if (e.key.toLowerCase() === 'w') setWhiteMode(p => !p);
      if (e.key === 'Escape') {
        setFocusMode(false);
        setWhiteMode(false);
      }
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
      className={`min-h-screen font-sans relative overflow-hidden transition-all duration-700 ${
        whiteMode 
          ? 'bg-[#fafafa] text-[#111]' 
          : 'bg-[#000] text-white'
      } ${quantumMode ? 'opacity-50' : ''}`}
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
        @keyframes activeTickPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes tooltipAppear {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sidebarGlowPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes microPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes dnaTooltipFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .elegant-fade { animation: elegantFade 0.5s ease-out forwards; }
        .last-node-glow { animation: lastNodeGlow 2.2s ease-in-out infinite; }
        .active-tick-pulse { animation: activeTickPulse 2s ease-in-out infinite; }
        .cursor-blink { animation: cursorBlink 1s infinite; }
        .tooltip-appear { animation: tooltipAppear 0.2s ease-out forwards; }
        .sidebar-glow-pulse { animation: sidebarGlowPulse 3s ease-in-out infinite; }
        .micro-pulse { animation: microPulse 1.5s ease-in-out infinite; }
        .dna-tooltip-fade { animation: dnaTooltipFade 0.15s ease-out forwards; }
        .dna-scroll::-webkit-scrollbar { display: none; }
        .dna-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ===== HEADER ===== */}
      <header className={`fixed inset-x-0 top-0 z-50 px-7 py-5 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          {/* Back */}
          <Link 
            to="/oqi-demos" 
            className={`text-[9px] uppercase tracking-[0.2em] transition-colors ${
              whiteMode ? 'text-[#aaa] hover:text-[#666]' : 'text-[#333] hover:text-[#666]'
            }`}
          >
            ← Tillbaka
          </Link>

          {/* ONESEEK Title + DNA Chain - Horizontal, Scrollable */}
          <div className="absolute left-1/2 -translate-x-[55%] flex items-center gap-4">
            {/* ONESEEK Title */}
            <span className={`text-[10px] font-mono tracking-[0.2em] uppercase ${
              whiteMode ? 'text-[#888]' : 'text-[#555]'
            }`}>ONESEEK</span>
            
            {/* DNA Chain - Scrollable with hover info */}
            <div 
              ref={dnaScrollRef}
              className="flex items-center gap-[6px] overflow-x-auto dna-scroll max-w-[200px] py-2"
            >
              {dnaChain.map((node, i) => {
                const isLast = i === dnaChain.length - 1;
                const baseOpacity = i < dnaChain.length - 4 ? 0.25 : i < dnaChain.length - 2 ? 0.45 : isLast ? 1 : 0.65;
                return (
                  <div
                    key={node.id}
                    className="relative flex-shrink-0"
                    onMouseEnter={() => setHoveredDnaNode(node.id)}
                    onMouseLeave={() => setHoveredDnaNode(null)}
                  >
                    <div
                      className={`rounded-full cursor-pointer transition-all duration-200 ${
                        isLast ? 'last-node-glow' : ''
                      } ${whiteMode ? 'bg-[#333]' : 'bg-[#D1D5DB]'}`}
                      style={{
                        width: isLast ? '6px' : '3px',
                        height: isLast ? '6px' : '3px',
                        opacity: hoveredDnaNode === node.id ? 1 : baseOpacity,
                      }}
                    />
                    
                    {/* DNA Node Tooltip */}
                    {hoveredDnaNode === node.id && (
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 rounded-md min-w-[140px] dna-tooltip-fade z-50 ${
                        whiteMode 
                          ? 'bg-white border border-[#e0e0e0] shadow-sm' 
                          : 'bg-[#050505] border border-[#151515]'
                      }`}>
                        <p className={`text-[9px] font-medium ${whiteMode ? 'text-[#333]' : 'text-[#aaa]'}`}>{node.block}</p>
                        <p className={`text-[7px] mt-1 ${whiteMode ? 'text-[#888]' : 'text-[#444]'}`}>{node.time} · {node.hash}</p>
                        <Link 
                          to="/ledger" 
                          className={`block text-[7px] mt-2 underline ${
                            whiteMode ? 'text-[#666] hover:text-[#333]' : 'text-[#555] hover:text-white'
                          }`}
                        >
                          Visa i Ledger →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Indicators + Microtraining - Metadata Style */}
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-5 text-[8px] tracking-[0.12em] uppercase font-light ${
              whiteMode ? 'text-[#999]' : 'text-[#3a3a3a]'
            }`}>
              <span>Fidelity <span className={whiteMode ? 'text-[#666]' : 'text-[#555]'}>{metrics.fidelity}%</span></span>
              <span>Consensus <span className={whiteMode ? 'text-[#666]' : 'text-[#555]'}>{metrics.consensus}%</span></span>
              <span>Accuracy <span className={whiteMode ? 'text-[#666]' : 'text-[#555]'}>{metrics.accuracy}%</span></span>
              <span className={whiteMode ? 'text-[#777]' : 'text-[#4a4a4a]'}>{selectedCharacter}</span>
            </div>
            
            {/* Microtraining Status */}
            <div className={`flex items-center gap-2 text-[7px] tracking-[0.1em] uppercase ${
              whiteMode ? 'text-[#aaa]' : 'text-[#2a2a2a]'
            }`}>
              <span className={`inline-block w-[4px] h-[4px] rounded-full ${
                microtrainingActive 
                  ? (whiteMode ? 'bg-[#666] micro-pulse' : 'bg-[#444] micro-pulse')
                  : (whiteMode ? 'bg-[#ccc]' : 'bg-[#222]')
              }`} />
              <span>Mikroträning</span>
              <span className={whiteMode ? 'text-[#888]' : 'text-[#3a3a3a]'}>
                {microtrainingActive ? `${microtrainingQueue} i kö` : 'väntar'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== LEFT TIMELINE ===== */}
      <aside className={`fixed left-5 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start">
          {/* Up indicator */}
          <div className={`text-[6px] mb-3 ${whiteMode ? 'text-[#ccc]' : 'text-[#222]'}`}>↑</div>
          
          {/* Timeline container */}
          <div className="relative">
            {/* Vertical line */}
            <div className={`absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b ${
              whiteMode 
                ? 'from-[#f0f0f0] via-[#ddd] to-[#f0f0f0]' 
                : 'from-[#0a0a0a] via-[#181818] to-[#0a0a0a]'
            }`} />
            
            {/* Timeline ticks */}
            {history.map((item, idx) => {
              const isActive = item.id === activeHistoryId;
              return (
                <div
                  key={item.id}
                  className="flex items-center cursor-pointer relative"
                  style={{ marginTop: idx === 0 ? 0 : `${getTickSpacing(item.timeDelta)}px` }}
                  onMouseEnter={() => setHoveredTick(item.id)}
                  onMouseLeave={() => setHoveredTick(null)}
                  onClick={() => setActiveHistoryId(item.id)}
                >
                  {/* Tick line - dynamic width based on content length, pulsing if active */}
                  <div 
                    className={`h-px transition-all duration-200 ${
                      isActive 
                        ? `active-tick-pulse ${whiteMode ? 'bg-[#333]' : 'bg-white'}`
                        : hoveredTick === item.id 
                          ? (whiteMode ? 'bg-[#333]' : 'bg-white')
                          : (whiteMode ? 'bg-[#ccc]' : 'bg-[#222]')
                    }`}
                    style={{ width: `${getTickWidth(item.charCount)}px` }}
                  />
                  
                  {/* Tooltip */}
                  {hoveredTick === item.id && (
                    <div className={`absolute left-full ml-4 rounded-md px-4 py-2.5 min-w-[200px] tooltip-appear z-50 ${
                      whiteMode 
                        ? 'bg-white border border-[#e0e0e0] shadow-sm' 
                        : 'bg-[#050505] border border-[#151515]'
                    }`}>
                      <p className={`text-[11px] font-light leading-relaxed ${whiteMode ? 'text-[#333]' : 'text-[#c0c0c0]'}`}>{item.question}</p>
                      <p className={`text-[7px] mt-2 tracking-wide ${whiteMode ? 'text-[#999]' : 'text-[#444]'}`}>{item.date} {item.time}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Down indicator */}
          <div className={`text-[6px] mt-3 ${whiteMode ? 'text-[#ccc]' : 'text-[#222]'}`}>↓</div>
        </div>
      </aside>

      {/* ===== RIGHT SIDEBAR - Ultra Minimal ===== */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-500 ease-out ${
          sidebarActive ? 'w-[180px]' : 'w-[3px]'
        }`}
        onMouseEnter={() => setSidebarActive(true)}
        onMouseLeave={() => setSidebarActive(false)}
      >
        {/* Collapsed state - glowing thin line */}
        {!sidebarActive && (
          <div className="h-full flex items-center justify-center">
            <div className={`w-[1px] h-32 sidebar-glow-pulse ${
              whiteMode 
                ? 'bg-gradient-to-b from-transparent via-[#ccc] to-transparent' 
                : 'bg-gradient-to-b from-transparent via-[#1a1a1a] to-transparent'
            }`} />
          </div>
        )}
        
        {/* Expanded state - minimal and elegant */}
        {sidebarActive && (
          <div className={`h-full p-6 pt-24 transition-all duration-300 ${
            whiteMode 
              ? 'bg-white/80 backdrop-blur-sm border-l border-[#eee]' 
              : 'bg-[#020202]/80 backdrop-blur-sm border-l border-[#0a0a0a]'
          }`}
          style={{ animation: 'elegantFade 0.3s ease-out forwards' }}
          >
            <div className="space-y-4">
              {['Spara', 'Bokmärken', 'Historik', 'Export'].map((item, i) => (
                <button 
                  key={item}
                  className={`block w-full text-left text-[9px] tracking-[0.1em] uppercase transition-all py-1 ${
                    whiteMode 
                      ? 'text-[#aaa] hover:text-[#333]' 
                      : 'text-[#2a2a2a] hover:text-white'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
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
          
          {/* User Message - Right Aligned with timestamp */}
          <div className="flex flex-col items-end elegant-fade" style={{ animationDelay: '0.05s' }}>
            {/* Timestamp above user message */}
            <p className={`text-[7px] mb-2 tracking-wide uppercase ${
              whiteMode ? 'text-[#bbb]' : 'text-[#2a2a2a]'
            }`}>
              26 nov 2025 · 14:18
            </p>
            <p className={`text-[14px] font-light text-right leading-relaxed max-w-sm tracking-tight ${
              whiteMode ? 'text-[#555]' : 'text-[#666]'
            }`}>
              Vad betyder Robin för dig?
            </p>
          </div>

          {/* AI Response - Left Aligned */}
          <div className="flex justify-start elegant-fade" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-md">
              {/* Meta info line with ONESEEK SVARAR */}
              <div className={`text-[8px] mb-3 tracking-wide font-light uppercase ${
                whiteMode ? 'text-[#999]' : 'text-[#3a3a3a]'
              }`}>
                <span className={whiteMode ? 'text-[#666]' : 'text-[#555]'}>ONESEEK SVARAR</span> · <span className={whiteMode ? 'text-[#888]' : 'text-[#444]'}>{responseTime}s</span> · 26 nov 2025 14:18
              </div>
              
              {/* Response text - reduced size */}
              <p className={`text-[14px] font-light leading-[1.9] tracking-tight ${
                whiteMode ? 'text-[#333]' : 'text-[#aaa]'
              }`}>
                {typingText}
                {isTyping && (
                  <span className={`cursor-blink inline-block w-[1.5px] h-[15px] ml-1 -mb-[2px] ${
                    whiteMode ? 'bg-[#333]' : 'bg-white'
                  }`} />
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ===== INPUT AREA ===== */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`px-24 pb-10 pt-6 ${
          whiteMode 
            ? 'bg-gradient-to-t from-[#fafafa] via-[#fafafa]/98 to-transparent' 
            : 'bg-gradient-to-t from-black via-black/98 to-transparent'
        }`}>
          <div className="max-w-xl mx-auto">
            
            {/* Character/Persona Selection */}
            <div className="flex justify-center gap-6 mb-6">
              {personas.map((persona) => (
                <button
                  key={persona}
                  onClick={() => setSelectedCharacter(persona)}
                  className={`text-[9px] tracking-[0.12em] transition-all duration-300 ${
                    selectedCharacter === persona 
                      ? (whiteMode ? 'text-[#333]' : 'text-white')
                      : (whiteMode ? 'text-[#bbb] hover:text-[#666]' : 'text-[#2a2a2a] hover:text-[#555]')
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
                className={`w-full bg-transparent border-b py-3 text-[14px] placeholder-opacity-50 focus:outline-none transition-colors font-light tracking-wide ${
                  whiteMode 
                    ? 'border-[#ddd] focus:border-[#aaa] text-[#333] placeholder-[#ccc]' 
                    : 'border-[#111] focus:border-[#2a2a2a] text-white placeholder-[#222]'
                }`}
              />
              
              {/* Send Button - Fade in when typing */}
              <button 
                className={`absolute right-0 bottom-3 transition-all duration-400 ${
                  messageInput 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  whiteMode 
                    ? 'border-[#ccc] hover:border-[#888] hover:bg-black/5' 
                    : 'border-[#222] hover:border-[#444] hover:bg-white/5'
                }`}>
                  <span className={`text-[8px] ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`}>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className={`fixed bottom-3 left-5 text-[7px] transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'} ${
        whiteMode ? 'text-[#ccc]' : 'text-[#1a1a1a]'
      }`}>
        Q = Quantum · F = Focus · W = White
      </div>
    </div>
  );
}
