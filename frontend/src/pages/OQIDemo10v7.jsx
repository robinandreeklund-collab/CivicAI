import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 7: Elegant Monochrome
 * Features: Horizontal DNA chain with subtle glow, ultra-minimal chat bubbles,
 * organic timeline rhythm, floating sidebar
 */
export default function OQIDemo10v7() {
  const [mood] = useState('philosophical');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredHistoryItem, setHoveredHistoryItem] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const characters = [
    { id: 'medveten', name: 'Medveten' },
    { id: 'expert', name: 'Expert' },
    { id: 'filosofisk', name: 'Filosofisk' },
    { id: 'arlig', name: 'Ärlig' },
    { id: 'faktabaserad', name: 'Faktabaserad' },
  ];

  // Timeline items with activity data
  const timelineItems = [
    { id: 1, question: 'Vem är du?', charCount: 45, time: '14:03', timeDiff: 0 },
    { id: 2, question: 'Vad är ditt syfte?', charCount: 82, time: '14:07', timeDiff: 240 },
    { id: 3, question: 'Vem är Robin?', charCount: 156, time: '14:12', timeDiff: 300 },
    { id: 4, question: 'Vad betyder Robin för dig?', charCount: 340, time: '14:18', timeDiff: 360 },
  ];

  const conversation = [
    { id: 1, type: 'user', message: 'Vad betyder Robin för dig?', time: '14:18', date: '26 nov 2025' },
  ];

  const demoMetrics = {
    fidelity: 95.2,
    consensus: 99.7,
    accuracy: 99,
    character: selectedCharacter,
  };

  // DNA chain with 15 nodes
  const dnaChainLength = 15;

  useEffect(() => {
    if (isTyping) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        setResponseTime(((Date.now() - startTime) / 1000).toFixed(2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  useEffect(() => {
    if (!isTyping) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullResponse.length) {
        setTypingText(fullResponse.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [isTyping, fullResponse]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'q' || e.key === 'Q') setQuantumMode(prev => !prev);
      if (e.key === 'f' || e.key === 'F') setFocusMode(prev => !prev);
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowUI(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowUI(false), 4000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Dynamic tick calculation
  const getTickLength = (charCount) => Math.min(8 + charCount / 15, 40);
  const getTickSpacing = (timeDiff) => timeDiff > 300 ? 28 : timeDiff > 180 ? 20 : 14;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#000] text-[#fff] font-sans relative overflow-hidden transition-all duration-700 ${quantumMode ? 'opacity-50' : ''}`}
    >
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes nodeGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; filter: blur(0); }
          50% { transform: scale(1.4); opacity: 1; filter: blur(1px); }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes slideTooltip {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes expandSidebar {
          0% { width: 10px; opacity: 0.5; }
          100% { width: 300px; opacity: 1; }
        }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .node-glow { animation: nodeGlow 2.5s ease-in-out infinite; }
        .cursor-blink { animation: cursorBlink 1s infinite; }
        .slide-tooltip { animation: slideTooltip 0.25s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="px-8 py-5 flex items-center justify-between">
          {/* Back */}
          <Link to="/oqi-demos" className="text-[10px] text-[#444] hover:text-[#777] transition-colors tracking-wide">
            ← TILLBAKA
          </Link>

          {/* DNA Chain - Horizontal, Left of Center */}
          <div className="flex items-center gap-[6px] ml-[-60px]">
            {Array.from({ length: dnaChainLength }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full bg-[#D1D5DB] transition-all duration-500 ${
                  i === dnaChainLength - 1 ? 'node-glow' : ''
                }`}
                style={{
                  width: i === dnaChainLength - 1 ? '7px' : '4px',
                  height: i === dnaChainLength - 1 ? '7px' : '4px',
                  opacity: i < dnaChainLength - 3 ? 0.4 : i === dnaChainLength - 1 ? 1 : 0.6,
                }}
              />
            ))}
          </div>

          {/* Metadata Status */}
          <div className="flex items-center gap-5 text-[8px] text-[#555] font-light tracking-widest uppercase">
            <span>Fidelity {demoMetrics.fidelity}%</span>
            <span>Consensus {demoMetrics.consensus}%</span>
            <span>Accuracy {demoMetrics.accuracy}%</span>
            <span className="text-[#666]">{selectedCharacter}</span>
          </div>
        </div>
      </header>

      {/* Left Timeline - Organic Rhythm */}
      <div className={`fixed left-5 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-15'}`}>
        <div className="relative flex flex-col items-start">
          <div className="text-[7px] text-[#333] mb-3 tracking-widest">↑</div>
          
          {/* Vertical line */}
          <div className="absolute left-0 top-5 bottom-5 w-px bg-gradient-to-b from-transparent via-[#222] to-transparent" />
          
          {timelineItems.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center cursor-pointer group"
              style={{ marginTop: idx === 0 ? 0 : `${getTickSpacing(item.timeDiff)}px` }}
              onMouseEnter={() => setHoveredHistoryItem(item.id)}
              onMouseLeave={() => setHoveredHistoryItem(null)}
            >
              {/* Tick line - dynamic length */}
              <div 
                className={`h-px transition-all duration-200 ${
                  hoveredHistoryItem === item.id ? 'bg-white' : 'bg-[#3a3a3a]'
                }`}
                style={{ width: `${getTickLength(item.charCount)}px` }}
              />
              
              {/* Tooltip on hover */}
              {hoveredHistoryItem === item.id && (
                <div className="absolute left-full ml-4 bg-[#080808] border border-[#1a1a1a] rounded-lg px-4 py-2 min-w-[200px] slide-tooltip z-50">
                  <p className="text-[11px] text-[#ccc] font-light">{item.question}</p>
                  <p className="text-[8px] text-[#444] mt-1">Idag {item.time}</p>
                </div>
              )}
            </div>
          ))}
          
          <div className="text-[7px] text-[#333] mt-3 tracking-widest">↓</div>
        </div>
      </div>

      {/* Right Sidebar - Ultra Minimal */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-400 ease-out cursor-pointer ${
          sidebarExpanded ? 'w-[300px]' : 'w-[10px]'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {!sidebarExpanded && (
          <div className="h-full flex items-center justify-center">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#2a2a2a] to-transparent" />
          </div>
        )}
        
        {sidebarExpanded && (
          <div className="h-full bg-[#050505] border-l border-[#151515] p-8 pt-24 fade-up">
            <p className="text-[9px] text-[#444] uppercase tracking-widest mb-8">Verktyg</p>
            <div className="space-y-5">
              {['Spara svar', 'Bokmärken', 'Historik', 'Inställningar'].map((item) => (
                <button key={item} className="block w-full text-left text-[12px] text-[#555] hover:text-white transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area - Smaller Text, Classic Layout */}
      <main className={`min-h-screen flex flex-col justify-end px-24 pb-44 pt-24 transition-transform duration-500 ${focusMode ? 'scale-[1.02]' : ''}`}>
        <div className="max-w-xl mx-auto w-full space-y-5">
          
          {/* User Message - Right aligned */}
          <div className="flex justify-end fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-right max-w-sm">
              <p className="text-[13px] text-[#777] font-light leading-relaxed">
                {conversation[0].message}
              </p>
            </div>
          </div>

          {/* AI Response - Left aligned */}
          <div className="flex justify-start fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-left max-w-md">
              {/* Meta line */}
              <p className="text-[8px] text-[#444] mb-2 tracking-wide font-light">
                OneSeek <span className="text-[#666]">{responseTime}s</span> · {conversation[0].date} {conversation[0].time}
              </p>
              
              <p className="text-[13px] text-[#bbb] font-light leading-[1.8] tracking-tight">
                {typingText}
                {isTyping && (
                  <span className="cursor-blink inline-block w-[2px] h-[14px] bg-white ml-1 -mb-[2px]" />
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent px-24 pb-10 pt-6">
          <div className="max-w-xl mx-auto">
            {/* Character Selector */}
            <div className="flex justify-center gap-4 mb-5">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.name)}
                  className={`text-[9px] tracking-wide transition-all duration-300 ${
                    selectedCharacter === char.name 
                      ? 'text-white' 
                      : 'text-[#444] hover:text-[#777]'
                  }`}
                >
                  {char.name}
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
                className="w-full bg-transparent border-b border-[#1a1a1a] focus:border-[#333] py-3 text-[13px] text-white placeholder-[#333] focus:outline-none transition-colors font-light tracking-wide"
              />
              
              {/* Send button - appears on input */}
              <div 
                className={`absolute right-0 bottom-3 transition-all duration-300 ${
                  messageInput ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
                }`}
              >
                <button className="w-5 h-5 rounded-full border border-[#333] flex items-center justify-center hover:border-white hover:bg-white/5 transition-all">
                  <span className="text-[8px] text-[#777]">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className={`fixed bottom-3 left-5 text-[7px] text-[#222] transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        Q = Quantum · F = Focus
      </div>
    </div>
  );
}
