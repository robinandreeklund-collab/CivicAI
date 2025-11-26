import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 1: Enhanced with Grok-style Timeline
 * Features: Left vertical history timeline, character personas, response time, ledger DNA chain
 */
export default function OQIDemo10v1() {
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
    { id: 1, question: 'Vem är du?', answer: 'Jag är OneSeek, en AI skapad för transparens...', time: '14:03', date: '2024-01-15', charCount: 45 },
    { id: 2, question: 'Vad är ditt syfte?', answer: 'Mitt syfte är att vara en ärlig svensk AI som hjälper...', time: '14:07', date: '2024-01-15', charCount: 82 },
    { id: 3, question: 'Vem är Robin?', answer: 'Robin är min skapare och grundare...', time: '14:12', date: '2024-01-15', charCount: 156 },
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

  // Response time counter
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
      if (e.key === 'q' || e.key === 'Q') {
        setQuantumMode(prev => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        setFocusMode(prev => !prev);
      }
      if (e.key === 'Escape') {
        setFocusMode(false);
      }
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

  // Calculate dynamic height for timeline items based on content length
  const getTimelineHeight = (charCount) => {
    const baseHeight = 8;
    const extraHeight = Math.min(charCount / 50, 20);
    return baseHeight + extraHeight;
  };

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
        @keyframes timelineGlow {
          0%, 100% { box-shadow: 0 0 2px ${getMoodColor()}; }
          50% { box-shadow: 0 0 8px ${getMoodColor()}; }
        }
        @keyframes countUp {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
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
        .timeline-glow {
          animation: timelineGlow 2s ease-in-out infinite;
        }
        .count-up {
          animation: countUp 0.1s ease-out;
        }
      `}</style>

      {/* Quantum Mode Particles */}
      {quantumMode && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-[10px] font-mono text-[#666666]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleGlow ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              {['▓', '░', '▒', '█', '▄'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

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

      {/* Left Timeline - Grok Style */}
      <div 
        className={`fixed left-8 top-1/2 transform -translate-y-1/2 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative h-[400px] flex flex-col justify-center">
          {/* Up Arrow */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[#333333] text-xs">↑</div>
          
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-[#333333] to-transparent" />
          
          {/* Timeline Items */}
          <div className="flex flex-col gap-4 items-center">
            {demoHistory.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredHistoryItem(item.id)}
                onMouseLeave={() => setHoveredHistoryItem(null)}
              >
                {/* Tick Line */}
                <div 
                  className={`w-6 h-[2px] rounded-full transition-all duration-300 ${
                    hoveredHistoryItem === item.id ? 'bg-[#FFFFFF] timeline-glow' : 'bg-[#444444]'
                  }`}
                  style={{ 
                    marginTop: `${getTimelineHeight(item.charCount)}px`,
                    marginBottom: `${getTimelineHeight(item.charCount)}px`,
                  }}
                />
                
                {/* Tooltip */}
                {hoveredHistoryItem === item.id && (
                  <div className="absolute left-10 top-1/2 transform -translate-y-1/2 bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 min-w-[200px] z-50 cinematic-fade">
                    <div className="text-xs text-[#FFFFFF] font-medium mb-1">{item.question}</div>
                    <div className="text-[10px] text-[#666666]">{item.time} · {item.date}</div>
                    <div className="text-[10px] text-[#888888] mt-2 line-clamp-2">{item.answer.slice(0, 80)}...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Down Arrow */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[#333333] text-xs">↓</div>
        </div>
      </div>

      {/* Right Ledger Chain - DNA Style */}
      <div 
        className={`fixed right-8 top-1/2 transform -translate-y-1/2 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative h-[400px] flex flex-col justify-center">
          {/* DNA Chain Label */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[10px] text-[#444444] tracking-widest whitespace-nowrap">DNA CHAIN</div>
          
          {/* Timeline Line */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-[2px] h-full rounded-full"
            style={{ background: `linear-gradient(to bottom, transparent, ${getMoodColor()}44, transparent)` }}
          />
          
          {/* Ledger Items */}
          <div className="flex flex-col gap-6 items-center">
            {demoLedger.map((item) => (
              <div
                key={item.block}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredLedgerItem(item.block)}
                onMouseLeave={() => setHoveredLedgerItem(null)}
              >
                {/* Block Indicator */}
                <div 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    hoveredLedgerItem === item.block ? 'scale-150' : ''
                  }`}
                  style={{ 
                    backgroundColor: item.verified ? getMoodColor() : '#666666',
                    boxShadow: hoveredLedgerItem === item.block ? `0 0 10px ${getMoodColor()}` : 'none',
                  }}
                />
                
                {/* Tooltip */}
                {hoveredLedgerItem === item.block && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 min-w-[150px] z-50 cinematic-fade">
                    <div className="text-xs text-[#FFFFFF] font-mono">Block #{item.block}</div>
                    <div className="text-[10px] text-[#666666] mt-1">{item.time} · {item.hash}</div>
                    <div className="text-[10px] text-green-400 mt-1">✓ Verified</div>
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
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-[10px] font-mono text-[#666666] tracking-widest">ONESEEK-7B-ZERO</div>
          </div>
        </div>
        <div className="text-[10px] text-[#444444]">Q=Quantum · F=Focus</div>
      </div>

      {/* Main Content */}
      <div className={`min-h-screen flex flex-col items-center justify-center px-8 transition-all duration-500 ${focusMode ? 'scale-110' : ''}`}>
        {/* Question */}
        <div className="text-center mb-12 cinematic-fade" style={{ animationDelay: '0.4s' }}>
          <div className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-4">Robin frågade</div>
          <h1 className="text-4xl md:text-5xl font-light text-[#FFFFFF] leading-tight tracking-tight">
            Vad betyder Robin för dig?
          </h1>
        </div>

        {/* Response Time Counter (replacing pulsating dot) */}
        <div className="mb-8 flex items-center gap-3 cinematic-fade" style={{ animationDelay: '0.6s' }}>
          <span className="text-[10px] font-mono text-[#444444] uppercase tracking-widest">OneSeek svarar</span>
          <span className="text-[10px] font-mono text-[#666666] count-up">{responseTime}s</span>
        </div>

        {/* Response */}
        <div className="max-w-3xl text-center cinematic-fade" style={{ animationDelay: '0.8s' }}>
          <p className="text-2xl md:text-3xl font-light text-[#CCCCCC] leading-relaxed tracking-tight">
            {typingText}
            {isTyping && <span className="typewriter-cursor inline-block w-[3px] h-8 bg-[#FFFFFF] ml-2 -mb-1" />}
          </p>
        </div>
      </div>

      {/* Input Area with Character Selection */}
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
          
          {/* Character Personas */}
          <div className="flex justify-center gap-3 mt-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char.name)}
                className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-150 ${
                  selectedCharacter === char.name ? 'scale-150 ring-2 ring-offset-2 ring-offset-black' : ''
                }`}
                style={{ 
                  backgroundColor: char.color,
                  ringColor: char.color,
                }}
                title={char.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div 
        className={`fixed bottom-2 left-0 right-0 flex justify-center gap-8 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-[10px] text-[#444444]">
          Fidelity = <span className="text-[#666666]">{demoMetrics.fidelity}%</span>
        </div>
        <div className="text-[10px] text-[#444444]">
          Consensus = <span className="text-[#666666]">{demoMetrics.consensus}%</span>
        </div>
        <div className="text-[10px] text-[#444444]">
          Accuracy = <span className="text-[#666666]">{demoMetrics.accuracy}%</span>
        </div>
        <div className="text-[10px] text-[#444444]">
          Character = <span style={{ color: characters.find(c => c.name === selectedCharacter)?.color }}>{demoMetrics.character}</span>
        </div>
      </div>

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-[#000000]/50 pointer-events-none z-20" />
      )}
    </div>
  );
}
