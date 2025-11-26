import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 5: Integrated Edges Design
 * Features: Seamless edge integration, inline character selector, live metrics bar
 */
export default function OQIDemo10v5() {
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
  const [hoveredLedgerItem, setHoveredLedgerItem] = useState(null);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const characters = [
    { id: 'medveten', name: 'Medveten', color: '#6D28D9', desc: 'Reflekterande' },
    { id: 'expert', name: 'Expert', color: '#1E40AF', desc: 'Faktadriven' },
    { id: 'filosofisk', name: 'Filosofisk', color: '#7C3AED', desc: 'Djuptänkande' },
    { id: 'arlig', name: 'Ärlig', color: '#059669', desc: 'Transparent' },
    { id: 'faktabaserad', name: 'Faktabaserad', color: '#2563EB', desc: 'Datadrivet' },
  ];

  const demoHistory = [
    { id: 1, question: 'Vem är du?', time: '14:03', charCount: 45 },
    { id: 2, question: 'Vad är ditt syfte?', time: '14:07', charCount: 82 },
    { id: 3, question: 'Vem är Robin?', time: '14:12', charCount: 156 },
    { id: 4, question: 'Vad betyder Robin för dig?', time: '14:18', charCount: 280, active: true },
  ];

  const demoLedger = [
    { block: 127, time: '0.31s', hash: '7a3f9c', verified: true },
    { block: 126, time: '0.29s', hash: '8b4e2d', verified: true },
    { block: 125, time: '0.33s', hash: '9c5d1e', verified: true },
    { block: 124, time: '0.28s', hash: 'a2f1b3', verified: true },
    { block: 123, time: '0.35s', hash: 'b3e2c4', verified: true },
  ];

  const demoMetrics = {
    fidelity: 95.2,
    consensus: 99.7,
    accuracy: 99,
    character: selectedCharacter,
  };

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
    }, 35);
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
      timeout = setTimeout(() => setShowUI(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const moodColors = {
    calm: '#1E40AF',
    philosophical: '#6D28D9',
    passionate: '#991B1B',
    neutral: '#333333',
  };

  const getMoodColor = () => moodColors[mood] || moodColors.neutral;
  const getCharColor = () => characters.find(c => c.name === selectedCharacter)?.color || getMoodColor();

  // Dynamic spacing based on char count
  const getSpacing = (charCount) => Math.min(charCount / 30, 12) + 8;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans relative overflow-hidden transition-all duration-700 ${quantumMode ? 'opacity-60' : ''}`}
    >
      <style>{`
        @keyframes cinematicFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dnaOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes particleGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes breathePulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.05); opacity: 0.2; }
        }
        @keyframes typewriterCursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes liveCounter {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        @keyframes slideReveal {
          0% { opacity: 0; width: 0; }
          100% { opacity: 1; width: auto; }
        }
        .cinematic-fade {
          animation: cinematicFade 1.2s ease-out forwards;
        }
        .dna-orbit {
          animation: dnaOrbit 60s linear infinite;
        }
        .particle-glow {
          animation: particleGlow 3s ease-in-out infinite;
        }
        .breathe-pulse {
          animation: breathePulse 4s ease-in-out infinite;
        }
        .typewriter-cursor {
          animation: typewriterCursor 1s infinite;
        }
        .live-counter {
          animation: liveCounter 1s ease-in-out infinite;
        }
        .slide-reveal {
          animation: slideReveal 0.3s ease-out forwards;
        }
      `}</style>

      {/* DNA Orbit Ring */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="dna-orbit w-[90vmin] h-[90vmin] rounded-full border breathe-pulse"
          style={{ borderColor: getCharColor() + '11' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full particle-glow"
              style={{
                backgroundColor: getCharColor(),
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateX(45vmin) translateY(-50%)`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left Timeline - Grok Style History */}
      <div 
        className={`fixed left-3 top-0 bottom-0 z-20 flex flex-col justify-center transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-15'
        }`}
      >
        {/* Up indicator */}
        <div className="text-[8px] text-[#333] text-center mb-4">↑</div>
        
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#222] to-transparent" style={{ height: '300px' }} />
          
          <div className="flex flex-col">
            {demoHistory.map((item) => (
              <div
                key={item.id}
                className="relative cursor-pointer group"
                onMouseEnter={() => setHoveredHistoryItem(item.id)}
                onMouseLeave={() => setHoveredHistoryItem(null)}
                style={{ 
                  marginBottom: `${getSpacing(item.charCount)}px`,
                }}
              >
                {/* Tick */}
                <div 
                  className={`w-3 h-[2px] rounded-full transition-all duration-300 ${
                    hoveredHistoryItem === item.id || item.active 
                      ? 'w-5 bg-[#FFFFFF]' 
                      : 'bg-[#333]'
                  }`}
                />
                
                {/* Tooltip */}
                {hoveredHistoryItem === item.id && (
                  <div className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-[#080808] border border-[#1a1a1a] rounded-lg p-3 min-w-[200px] z-50 slide-reveal whitespace-nowrap">
                    <div className="text-xs text-[#FFFFFF] font-medium">{item.question}</div>
                    <div className="text-[9px] text-[#555] mt-1.5">{item.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Down indicator */}
        <div className="text-[8px] text-[#333] text-center mt-4">↓</div>
      </div>

      {/* Right Timeline - DNA Chain Ledger */}
      <div 
        className={`fixed right-3 top-0 bottom-0 z-20 flex flex-col justify-center items-end transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-15'
        }`}
      >
        {/* Label */}
        <div className="text-[7px] text-[#333] uppercase tracking-widest mb-4 rotate-90 origin-right -mr-4">DNA Chain</div>
        
        {/* Timeline */}
        <div className="relative">
          {/* DNA line */}
          <div 
            className="absolute right-[5px] top-0 bottom-0 w-[2px] rounded-full" 
            style={{ 
              height: '280px',
              background: `linear-gradient(to bottom, transparent, ${getCharColor()}44, transparent)` 
            }} 
          />
          
          <div className="flex flex-col">
            {demoLedger.map((item) => (
              <div
                key={item.block}
                className="relative cursor-pointer group flex justify-end mb-6"
                onMouseEnter={() => setHoveredLedgerItem(item.block)}
                onMouseLeave={() => setHoveredLedgerItem(null)}
              >
                {/* Node */}
                <div 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    hoveredLedgerItem === item.block ? 'scale-150' : ''
                  }`}
                  style={{ 
                    backgroundColor: getCharColor(),
                    boxShadow: hoveredLedgerItem === item.block ? `0 0 10px ${getCharColor()}` : 'none'
                  }}
                />
                
                {/* Tooltip */}
                {hoveredLedgerItem === item.block && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-[#080808] border border-[#1a1a1a] rounded-lg p-3 min-w-[140px] z-50 slide-reveal">
                    <div className="text-xs text-[#FFFFFF] font-mono">#{item.block}</div>
                    <div className="text-[9px] text-[#555] font-mono mt-1">0x{item.hash}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-green-400 text-[10px]">✓</span>
                      <span className="text-[9px] text-[#666]">{item.time}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-30 px-8 py-6 flex items-center justify-between transition-opacity duration-500 ${
          showUI || focusMode ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link to="/oqi-demos" className="text-[#444] hover:text-[#888] text-xs transition-colors">
          ← tillbaka
        </Link>
        <div className="text-center">
          <div className="text-[10px] font-mono text-[#666] tracking-widest">ONESEEK-7B-ZERO</div>
        </div>
        <div className="text-[10px] text-[#444]">Q=Quantum · F=Focus</div>
      </div>

      {/* Main Content */}
      <div className={`min-h-screen flex flex-col items-center justify-center px-20 transition-all duration-500 ${focusMode ? 'scale-110' : ''}`}>
        {/* Question */}
        <div className="text-center mb-10 cinematic-fade" style={{ animationDelay: '0.4s' }}>
          <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-4">Robin frågade</div>
          <h1 className="text-4xl md:text-5xl font-light text-[#FFFFFF] leading-tight tracking-tight">
            Vad betyder Robin för dig?
          </h1>
        </div>

        {/* Live Response Timer */}
        <div className="mb-6 flex items-center gap-3 cinematic-fade" style={{ animationDelay: '0.6s' }}>
          <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">OneSeek svarar</span>
          <div className="flex items-center px-3 py-1 rounded-full" style={{ backgroundColor: getCharColor() + '11' }}>
            <span className="text-lg font-mono live-counter" style={{ color: getCharColor() }}>{responseTime}</span>
            <span className="text-[10px] text-[#555] ml-1">s</span>
          </div>
        </div>

        {/* Response */}
        <div className="max-w-3xl text-center cinematic-fade" style={{ animationDelay: '0.8s' }}>
          <p className="text-2xl md:text-3xl font-light text-[#CCCCCC] leading-relaxed tracking-tight">
            {typingText}
            {isTyping && <span className="typewriter-cursor inline-block w-[3px] h-8 bg-[#FFFFFF] ml-2 -mb-1" />}
          </p>
        </div>
      </div>

      {/* Input with Inline Character Selector */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-8 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl p-2 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              className="flex-1 bg-transparent px-4 py-3 text-[#FFFFFF] placeholder-[#444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#FFFFFF] text-[#000000] rounded-xl hover:bg-[#CCCCCC] transition-colors">
              →
            </button>
          </div>
          
          {/* Character Selector - Dots with Labels on Hover */}
          <div className="flex justify-center gap-4 mt-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char.name)}
                className="group relative flex flex-col items-center"
              >
                <div 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    selectedCharacter === char.name ? 'scale-150' : 'opacity-40 hover:opacity-70 hover:scale-125'
                  }`}
                  style={{ 
                    backgroundColor: char.color,
                    boxShadow: selectedCharacter === char.name ? `0 0 10px ${char.color}` : 'none'
                  }}
                />
                {/* Label shown on selection */}
                {selectedCharacter === char.name && (
                  <span className="absolute -bottom-5 text-[8px] text-[#666] whitespace-nowrap">
                    {char.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div 
        className={`fixed bottom-2 left-0 right-0 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-center items-center gap-6 text-[9px]">
          <span className="text-[#333]">
            Fidelity = <span className="text-[#555]">{demoMetrics.fidelity}%</span>
          </span>
          <span className="text-[#222]">·</span>
          <span className="text-[#333]">
            Consensus = <span className="text-[#555]">{demoMetrics.consensus}%</span>
          </span>
          <span className="text-[#222]">·</span>
          <span className="text-[#333]">
            Accuracy = <span className="text-[#555]">{demoMetrics.accuracy}%</span>
          </span>
          <span className="text-[#222]">·</span>
          <span className="text-[#333]">
            Character = <span style={{ color: getCharColor() }}>{demoMetrics.character}</span>
          </span>
        </div>
      </div>

      {focusMode && (
        <div className="fixed inset-0 bg-[#000000]/50 pointer-events-none z-20" />
      )}
    </div>
  );
}
