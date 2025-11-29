import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 2: Minimalist Edge Design
 * Features: Ultra-thin edge timelines, centered character selector, animated response time
 */
export default function OQIDemo10v2() {
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
    { id: 'medveten', name: 'Medveten', color: '#6D28D9' },
    { id: 'expert', name: 'Expert', color: '#1E40AF' },
    { id: 'filosofisk', name: 'Filosofisk', color: '#7C3AED' },
    { id: 'arlig', name: 'Ärlig', color: '#059669' },
    { id: 'faktabaserad', name: 'Faktabaserad', color: '#2563EB' },
  ];

  const demoHistory = [
    { id: 1, question: 'Vem är du?', answer: 'Jag är OneSeek...', time: '14:03', date: '2024-01-15', charCount: 45 },
    { id: 2, question: 'Vad är ditt syfte?', answer: 'Mitt syfte är...', time: '14:07', date: '2024-01-15', charCount: 82 },
    { id: 3, question: 'Vem är Robin?', answer: 'Robin är min skapare...', time: '14:12', date: '2024-01-15', charCount: 156 },
    { id: 4, question: 'Vad betyder Robin för dig?', answer: fullResponse, time: '14:18', date: '2024-01-15', charCount: fullResponse.length },
  ];

  const demoLedger = [
    { block: 127, time: '0.31s', hash: '0x7a3f...', verified: true },
    { block: 126, time: '0.29s', hash: '0x8b4e...', verified: true },
    { block: 125, time: '0.33s', hash: '0x9c5d...', verified: true },
    { block: 124, time: '0.28s', hash: '0xa2f1...', verified: true },
    { block: 123, time: '0.35s', hash: '0xb3e2...', verified: true },
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
        @keyframes numberFlip {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
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
        .number-flip {
          animation: numberFlip 0.15s ease-out;
        }
      `}</style>

      {/* DNA Orbit Ring - Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="dna-orbit w-[90vmin] h-[90vmin] rounded-full border breathe-pulse"
          style={{ borderColor: getMoodColor() + '11' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full particle-glow"
              style={{
                backgroundColor: getMoodColor(),
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateX(45vmin) translateY(-50%)`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left Edge Timeline - Ultra Minimalist */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-30'
        }`}
      >
        <div className="h-full flex flex-col justify-center items-center py-20">
          {/* Timeline gradient line */}
          <div className="absolute left-2 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-[#333333] to-transparent" />
          
          {/* History ticks */}
          <div className="flex flex-col gap-8 relative z-10">
            {demoHistory.map((item) => (
              <div
                key={item.id}
                className="relative cursor-pointer group"
                onMouseEnter={() => setHoveredHistoryItem(item.id)}
                onMouseLeave={() => setHoveredHistoryItem(null)}
              >
                <div 
                  className={`w-3 h-[1px] transition-all duration-300 ${
                    hoveredHistoryItem === item.id ? 'w-6 bg-[#FFFFFF]' : 'bg-[#444444]'
                  }`}
                />
                
                {hoveredHistoryItem === item.id && (
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-[#0a0a0a]/95 backdrop-blur border border-[#222222] rounded-lg p-3 min-w-[180px] z-50">
                    <div className="text-xs text-[#FFFFFF]">{item.question}</div>
                    <div className="text-[9px] text-[#555555] mt-1">{item.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Edge Ledger Chain */}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-30'
        }`}
      >
        <div className="h-full flex flex-col justify-center items-center py-20">
          {/* DNA Chain line */}
          <div 
            className="absolute right-2 top-1/4 bottom-1/4 w-[2px] rounded-full"
            style={{ background: `linear-gradient(to bottom, transparent, ${getMoodColor()}33, transparent)` }}
          />
          
          {/* Ledger blocks */}
          <div className="flex flex-col gap-6 relative z-10">
            {demoLedger.map((item) => (
              <div
                key={item.block}
                className="relative cursor-pointer group"
                onMouseEnter={() => setHoveredLedgerItem(item.block)}
                onMouseLeave={() => setHoveredLedgerItem(null)}
              >
                <div 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hoveredLedgerItem === item.block ? 'scale-150' : ''
                  }`}
                  style={{ 
                    backgroundColor: getMoodColor(),
                    boxShadow: hoveredLedgerItem === item.block ? `0 0 8px ${getMoodColor()}` : 'none',
                  }}
                />
                
                {hoveredLedgerItem === item.block && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-[#0a0a0a]/95 backdrop-blur border border-[#222222] rounded-lg p-3 min-w-[120px] z-50">
                    <div className="text-xs text-[#FFFFFF] font-mono">#{item.block}</div>
                    <div className="text-[9px] text-[#555555] mt-1">{item.hash}</div>
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
        <Link to="/oqi-demos" className="text-[#444444] hover:text-[#888888] text-xs transition-colors">
          ← tillbaka
        </Link>
        <div className="text-center">
          <div className="text-[10px] font-mono text-[#666666] tracking-widest">ONESEEK-7B-ZERO</div>
        </div>
        <div className="text-[10px] text-[#444444]">Q=Quantum · F=Focus</div>
      </div>

      {/* Main Content */}
      <div className={`min-h-screen flex flex-col items-center justify-center px-16 transition-all duration-500 ${focusMode ? 'scale-110' : ''}`}>
        {/* Question */}
        <div className="text-center mb-10 cinematic-fade" style={{ animationDelay: '0.4s' }}>
          <div className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-4">Robin frågade</div>
          <h1 className="text-4xl md:text-5xl font-light text-[#FFFFFF] leading-tight tracking-tight">
            Vad betyder Robin för dig?
          </h1>
        </div>

        {/* Response Time - Animated Counter */}
        <div className="mb-6 flex items-center gap-2 cinematic-fade" style={{ animationDelay: '0.6s' }}>
          <span className="text-[10px] font-mono text-[#444444] uppercase tracking-widest">OneSeek svarar</span>
          <div className="flex items-center">
            <span className="text-sm font-mono text-[#666666] number-flip" key={responseTime}>{responseTime}</span>
            <span className="text-[10px] text-[#555555] ml-1">s</span>
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

      {/* Input Area */}
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
              className="flex-1 bg-transparent px-4 py-3 text-[#FFFFFF] placeholder-[#444444] focus:outline-none"
            />
            <button className="px-6 py-3 bg-[#FFFFFF] text-[#000000] rounded-xl hover:bg-[#CCCCCC] transition-colors">
              →
            </button>
          </div>
          
          {/* Character Selection - Horizontal Pills */}
          <div className="flex justify-center gap-2 mt-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char.name)}
                className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-wider transition-all duration-300 ${
                  selectedCharacter === char.name 
                    ? 'text-[#FFFFFF]' 
                    : 'text-[#555555] hover:text-[#888888]'
                }`}
                style={{ 
                  backgroundColor: selectedCharacter === char.name ? char.color + '33' : 'transparent',
                  borderColor: selectedCharacter === char.name ? char.color : 'transparent',
                  borderWidth: '1px',
                }}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Metrics - Inline Style */}
      <div 
        className={`fixed bottom-2 left-0 right-0 flex justify-center gap-6 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-[9px] text-[#333333]">
          Fidelity <span className="text-[#555555]">{demoMetrics.fidelity}%</span>
        </span>
        <span className="text-[9px] text-[#333333]">·</span>
        <span className="text-[9px] text-[#333333]">
          Consensus <span className="text-[#555555]">{demoMetrics.consensus}%</span>
        </span>
        <span className="text-[9px] text-[#333333]">·</span>
        <span className="text-[9px] text-[#333333]">
          Accuracy <span className="text-[#555555]">{demoMetrics.accuracy}%</span>
        </span>
        <span className="text-[9px] text-[#333333]">·</span>
        <span className="text-[9px]" style={{ color: characters.find(c => c.name === selectedCharacter)?.color + '99' }}>
          {selectedCharacter}
        </span>
      </div>

      {focusMode && (
        <div className="fixed inset-0 bg-[#000000]/50 pointer-events-none z-20" />
      )}
    </div>
  );
}
