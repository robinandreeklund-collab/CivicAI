import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 4: Curved Timeline Design
 * Features: Arc-shaped timelines, floating character badges, streaming time display
 */
export default function OQIDemo10v4() {
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
    { id: 1, question: 'Vem är du?', time: '14:03', charCount: 45 },
    { id: 2, question: 'Vad är ditt syfte?', time: '14:07', charCount: 82 },
    { id: 3, question: 'Vem är Robin?', time: '14:12', charCount: 156 },
    { id: 4, question: 'Vad betyder Robin för dig?', time: '14:18', charCount: 280 },
  ];

  const demoLedger = [
    { block: 127, time: '0.31s', verified: true },
    { block: 126, time: '0.29s', verified: true },
    { block: 125, time: '0.33s', verified: true },
    { block: 124, time: '0.28s', verified: true },
    { block: 123, time: '0.35s', verified: true },
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
        @keyframes streamTime {
          0% { opacity: 0.4; transform: translateY(2px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0.4; transform: translateY(-2px); }
        }
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
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
        .stream-time {
          animation: streamTime 0.5s ease-in-out infinite;
        }
        .fade-slide {
          animation: fadeSlide 0.3s ease-out forwards;
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

      {/* Left Arc Timeline - History */}
      <div 
        className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-20'
        }`}
      >
        {/* Arc path visualization */}
        <svg className="absolute -left-2 -top-4" width="60" height="250" viewBox="0 0 60 250">
          <path 
            d="M 50 10 Q 10 125, 50 240" 
            fill="none" 
            stroke="#222" 
            strokeWidth="1"
          />
        </svg>
        
        <div className="relative flex flex-col gap-8 ml-8">
          {demoHistory.map((item, idx) => (
            <div
              key={item.id}
              className="relative cursor-pointer group"
              onMouseEnter={() => setHoveredHistoryItem(item.id)}
              onMouseLeave={() => setHoveredHistoryItem(null)}
              style={{ marginLeft: `${Math.abs(idx - 1.5) * 8}px` }}
            >
              {/* Timeline marker */}
              <div className="flex items-center gap-2">
                <div 
                  className={`w-4 h-[1px] transition-all duration-300 ${
                    hoveredHistoryItem === item.id ? 'w-8 bg-white' : 'bg-[#333]'
                  }`}
                />
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    hoveredHistoryItem === item.id ? 'scale-150 bg-white' : 'bg-[#444]'
                  }`}
                />
              </div>
              
              {/* Tooltip */}
              {hoveredHistoryItem === item.id && (
                <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#0a0a0a]/95 backdrop-blur border border-[#1a1a1a] rounded-xl p-4 min-w-[220px] z-50 fade-slide">
                  <div className="text-sm text-[#FFFFFF]">{item.question}</div>
                  <div className="text-[10px] text-[#555] mt-2">{item.time}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Arrows */}
        <div className="absolute -top-8 left-10 text-[#333] text-xs">↑</div>
        <div className="absolute -bottom-8 left-10 text-[#333] text-xs">↓</div>
      </div>

      {/* Right Arc Timeline - Ledger DNA */}
      <div 
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-20'
        }`}
      >
        {/* DNA Chain label */}
        <div className="text-[8px] text-[#333] uppercase tracking-widest text-center mb-4 mr-8">
          DNA<br/>Chain
        </div>
        
        {/* Arc path */}
        <svg className="absolute -right-2 -top-4" width="60" height="280" viewBox="0 0 60 280">
          <path 
            d="M 10 30 Q 50 140, 10 270" 
            fill="none" 
            stroke={getCharColor() + '33'}
            strokeWidth="2"
          />
        </svg>
        
        <div className="relative flex flex-col gap-6 items-end mr-8">
          {demoLedger.map((item, idx) => (
            <div
              key={item.block}
              className="relative cursor-pointer group"
              onMouseEnter={() => setHoveredLedgerItem(item.block)}
              onMouseLeave={() => setHoveredLedgerItem(null)}
              style={{ marginRight: `${Math.abs(idx - 2) * 6}px` }}
            >
              {/* Block marker */}
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hoveredLedgerItem === item.block ? 'scale-150' : ''
                  }`}
                  style={{ 
                    backgroundColor: getCharColor(),
                    boxShadow: hoveredLedgerItem === item.block ? `0 0 10px ${getCharColor()}` : 'none'
                  }}
                />
                <div 
                  className={`h-[1px] transition-all duration-300 ${
                    hoveredLedgerItem === item.block ? 'w-8' : 'w-4'
                  }`}
                  style={{ backgroundColor: getCharColor() + '66' }}
                />
              </div>
              
              {/* Tooltip */}
              {hoveredLedgerItem === item.block && (
                <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-[#0a0a0a]/95 backdrop-blur border border-[#1a1a1a] rounded-xl p-4 min-w-[160px] z-50 fade-slide">
                  <div className="text-sm text-[#FFFFFF] font-mono">Block #{item.block}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-green-400 text-[10px]">✓</span>
                    <span className="text-[10px] text-[#666]">{item.time}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
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
      <div className={`min-h-screen flex flex-col items-center justify-center px-24 transition-all duration-500 ${focusMode ? 'scale-110' : ''}`}>
        {/* Question */}
        <div className="text-center mb-10 cinematic-fade" style={{ animationDelay: '0.4s' }}>
          <div className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-4">Robin frågade</div>
          <h1 className="text-4xl md:text-5xl font-light text-[#FFFFFF] leading-tight tracking-tight">
            Vad betyder Robin för dig?
          </h1>
        </div>

        {/* Streaming Response Time */}
        <div className="mb-6 flex flex-col items-center gap-1 cinematic-fade" style={{ animationDelay: '0.6s' }}>
          <span className="text-[10px] font-mono text-[#444444] uppercase tracking-widest">OneSeek svarar</span>
          <div className="flex items-baseline gap-1 stream-time">
            <span className="text-2xl font-light tabular-nums" style={{ color: getCharColor() }}>{responseTime}</span>
            <span className="text-xs text-[#444]">sek</span>
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

      {/* Input with Character Floating Badges */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-8 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-2xl mx-auto relative">
          {/* Floating Character Badges */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-2">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char.name)}
                className={`w-3 h-3 rounded-full transition-all duration-300 relative ${
                  selectedCharacter === char.name ? 'scale-125' : 'opacity-40 hover:opacity-70'
                }`}
                style={{ 
                  backgroundColor: char.color,
                  boxShadow: selectedCharacter === char.name ? `0 0 12px ${char.color}` : 'none',
                  transform: `translateY(${selectedCharacter === char.name ? '-4px' : '0'})`,
                }}
                title={char.name}
              >
                {selectedCharacter === char.name && (
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[8px] text-[#666] whitespace-nowrap">
                    {char.name}
                  </span>
                )}
              </button>
            ))}
          </div>
          
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
        </div>
      </div>

      {/* Bottom Metrics */}
      <div 
        className={`fixed bottom-2 left-0 right-0 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-center items-center gap-8 text-[9px] text-[#444]">
          <span>Fidelity = <span className="text-[#666]">{demoMetrics.fidelity}%</span></span>
          <span>Consensus = <span className="text-[#666]">{demoMetrics.consensus}%</span></span>
          <span>Accuracy = <span className="text-[#666]">{demoMetrics.accuracy}%</span></span>
          <span>Character = <span style={{ color: getCharColor() }}>{demoMetrics.character}</span></span>
        </div>
      </div>

      {focusMode && (
        <div className="fixed inset-0 bg-[#000000]/50 pointer-events-none z-20" />
      )}
    </div>
  );
}
