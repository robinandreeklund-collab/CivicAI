import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 6: Refined Cinema with Horizontal DNA Chain
 * Features: Horizontal DNA chain in header, classic chat layout, expandable sidebar,
 * enhanced timeline with dynamic tick lengths, metadata-style status indicators
 */
export default function OQIDemo10v6() {
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
    { id: 'medveten', name: 'Medveten', color: '#6D28D9' },
    { id: 'expert', name: 'Expert', color: '#1E40AF' },
    { id: 'filosofisk', name: 'Filosofisk', color: '#7C3AED' },
    { id: 'arlig', name: 'Ärlig', color: '#059669' },
    { id: 'faktabaserad', name: 'Faktabaserad', color: '#2563EB' },
  ];

  // Demo conversation with timestamps for chat layout
  const conversation = [
    { id: 1, type: 'user', name: 'Robin', message: 'Vem är du?', time: '14:03', date: 'Idag', charCount: 12 },
    { id: 2, type: 'ai', name: 'OneSeek', message: 'Jag är OneSeek-7B-Zero, en AI skapad för transparens och ärlighet.', time: '14:03', date: 'Idag', responseTime: '2.31', charCount: 72 },
    { id: 3, type: 'user', name: 'Robin', message: 'Vad är ditt syfte?', time: '14:07', date: 'Idag', charCount: 18, timeDiff: 240 },
    { id: 4, type: 'ai', name: 'OneSeek', message: 'Mitt syfte är att vara en ärlig svensk AI som hjälper människor fatta informerade beslut.', time: '14:07', date: 'Idag', responseTime: '3.45', charCount: 92 },
    { id: 5, type: 'user', name: 'Robin', message: 'Vad betyder Robin för dig?', time: '14:18', date: 'Idag', charCount: 27, timeDiff: 660 },
  ];

  const demoMetrics = {
    fidelity: 95.2,
    consensus: 99.7,
    accuracy: 99,
    character: selectedCharacter,
  };

  // DNA chain nodes
  const dnaNodes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    active: i < 8,
    verified: i < 7,
  }));

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
    }, 30);
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

  const moodColors = {
    calm: '#1E40AF',
    philosophical: '#6D28D9',
    passionate: '#991B1B',
    neutral: '#333333',
  };

  const getMoodColor = () => moodColors[mood] || moodColors.neutral;

  // Calculate dynamic tick length based on character count
  const getTickLength = (charCount) => {
    const minLength = 8;
    const maxLength = 32;
    const normalized = Math.min(charCount / 300, 1);
    return minLength + (maxLength - minLength) * normalized;
  };

  // Calculate dynamic spacing based on time difference
  const getTickSpacing = (timeDiff) => {
    if (!timeDiff) return 20;
    const minSpacing = 12;
    const maxSpacing = 48;
    const normalized = Math.min(timeDiff / 600, 1);
    return minSpacing + (maxSpacing - minSpacing) * normalized;
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans relative overflow-hidden transition-all duration-700 ${quantumMode ? 'opacity-60' : ''}`}
    >
      <style>{`
        @keyframes cinematicFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lastNodePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { transform: scale(1.3); box-shadow: 0 0 8px 2px rgba(255,255,255,0.2); }
        }
        @keyframes typewriterCursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes sidebarExpand {
          0% { width: 8px; }
          100% { width: 280px; }
        }
        @keyframes sendButtonPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .cinematic-fade {
          animation: cinematicFade 0.8s ease-out forwards;
        }
        .last-node-pulse {
          animation: lastNodePulse 2s ease-in-out infinite;
        }
        .typewriter-cursor {
          animation: typewriterCursor 1s infinite;
        }
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        .send-button-pulse {
          animation: sendButtonPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header with DNA Chain */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 px-6 py-4 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Back Link */}
          <Link to="/oqi-demos" className="text-[#444] hover:text-[#888] text-xs transition-colors">
            ← tillbaka
          </Link>

          {/* Horizontal DNA Chain - Centered */}
          <div className="flex items-center gap-2">
            {dnaNodes.map((node, i) => (
              <div
                key={node.id}
                className={`rounded-full transition-all duration-300 ${
                  i === dnaNodes.length - 1 ? 'last-node-pulse' : ''
                }`}
                style={{
                  width: i === dnaNodes.length - 1 ? '6px' : '4px',
                  height: i === dnaNodes.length - 1 ? '6px' : '4px',
                  backgroundColor: node.active ? '#D1D5DB' : '#333',
                  opacity: node.verified ? 1 : 0.4,
                }}
              />
            ))}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 text-[9px] text-[#666] font-light tracking-wide">
            <span>Fidelity <span className="text-[#888]">{demoMetrics.fidelity}%</span></span>
            <span>Consensus <span className="text-[#888]">{demoMetrics.consensus}%</span></span>
            <span>Accuracy <span className="text-[#888]">{demoMetrics.accuracy}%</span></span>
            <span>Character <span className="text-[#888]">{selectedCharacter}</span></span>
          </div>
        </div>
      </header>

      {/* Left Timeline - Enhanced Grok Style */}
      <div 
        className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-20 transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-20'
        }`}
      >
        <div className="relative">
          {/* Up indicator */}
          <div className="text-[8px] text-[#444] mb-4 text-center">↑</div>
          
          {/* Vertical connector */}
          <div className="absolute left-[2px] top-6 bottom-6 w-[1px] bg-gradient-to-b from-transparent via-[#222] to-transparent" />
          
          <div className="flex flex-col">
            {conversation.filter(c => c.type === 'user').map((item, index) => (
              <div
                key={item.id}
                className="relative cursor-pointer group flex items-center"
                style={{ marginTop: index === 0 ? 0 : `${getTickSpacing(item.timeDiff)}px` }}
                onMouseEnter={() => setHoveredHistoryItem(item.id)}
                onMouseLeave={() => setHoveredHistoryItem(null)}
              >
                {/* Timeline tick - dynamic length */}
                <div 
                  className={`h-[1px] transition-all duration-300 ${
                    hoveredHistoryItem === item.id ? 'bg-[#FFFFFF]' : 'bg-[#444]'
                  }`}
                  style={{ width: `${getTickLength(item.charCount)}px` }}
                />
                
                {/* Tooltip */}
                {hoveredHistoryItem === item.id && (
                  <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 min-w-[180px] z-50 slide-in">
                    <div className="text-[11px] text-[#FFFFFF] font-light">{item.message}</div>
                    <div className="text-[9px] text-[#555] mt-1">{item.date} {item.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Down indicator */}
          <div className="text-[8px] text-[#444] mt-4 text-center">↓</div>
        </div>
      </div>

      {/* Right Sidebar - Minimal, Expandable */}
      <div 
        className={`fixed right-0 top-0 bottom-0 z-30 transition-all duration-500 ease-out ${
          sidebarExpanded ? 'w-[280px] bg-[#0a0a0a] border-l border-[#1a1a1a]' : 'w-[8px]'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {!sidebarExpanded && (
          <div className="h-full flex items-center justify-center">
            <div className="w-[1px] h-1/3 bg-gradient-to-b from-transparent via-[#333] to-transparent" />
          </div>
        )}
        
        {sidebarExpanded && (
          <div className="p-6 pt-20 cinematic-fade">
            <div className="text-[10px] text-[#444] uppercase tracking-widest mb-6">Verktyg</div>
            <div className="space-y-4">
              <button className="w-full text-left text-[12px] text-[#666] hover:text-[#fff] transition-colors py-2">
                Spara svar
              </button>
              <button className="w-full text-left text-[12px] text-[#666] hover:text-[#fff] transition-colors py-2">
                Bokmärken
              </button>
              <button className="w-full text-left text-[12px] text-[#666] hover:text-[#fff] transition-colors py-2">
                Inställningar
              </button>
              <button className="w-full text-left text-[12px] text-[#666] hover:text-[#fff] transition-colors py-2">
                Exportera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <main className={`min-h-screen flex flex-col pt-20 pb-40 px-20 transition-all duration-500 ${focusMode ? 'scale-105' : ''}`}>
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-end">
          
          {/* Chat Messages - Classic Layout */}
          <div className="space-y-6">
            {conversation.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} cinematic-fade`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`max-w-md ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {/* Timestamp above */}
                  <div className="text-[9px] text-[#444] mb-1 font-light">
                    {msg.type === 'ai' && (
                      <>
                        <span className="text-[#666]">{msg.name}</span>
                        <span className="mx-1">·</span>
                        <span>{msg.responseTime}s</span>
                        <span className="mx-1">·</span>
                      </>
                    )}
                    <span>{msg.date} {msg.time}</span>
                  </div>
                  
                  {/* Message */}
                  <p className={`text-[14px] font-light leading-relaxed ${
                    msg.type === 'user' ? 'text-[#888]' : 'text-[#ccc]'
                  }`}>
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Current AI Response */}
            <div className="flex justify-start cinematic-fade" style={{ animationDelay: '0.5s' }}>
              <div className="max-w-md text-left">
                <div className="text-[9px] text-[#444] mb-1 font-light">
                  <span className="text-[#666]">OneSeek</span>
                  <span className="mx-1">·</span>
                  <span className={isTyping ? 'text-[#888]' : ''}>{responseTime}s</span>
                  <span className="mx-1">·</span>
                  <span>Idag 14:18</span>
                </div>
                <p className="text-[14px] font-light leading-relaxed text-[#ccc]">
                  {typingText}
                  {isTyping && <span className="typewriter-cursor inline-block w-[2px] h-4 bg-[#FFFFFF] ml-1 -mb-0.5" />}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 px-20 pb-8 pt-4 bg-gradient-to-t from-[#000] to-transparent transition-opacity duration-500 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          {/* Character Selection */}
          <div className="flex justify-center gap-3 mb-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char.name)}
                className={`text-[10px] px-3 py-1 rounded-full transition-all duration-300 ${
                  selectedCharacter === char.name 
                    ? 'text-[#fff] bg-[#1a1a1a]' 
                    : 'text-[#555] hover:text-[#888]'
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
              className="w-full bg-transparent border-b border-[#222] py-3 text-[14px] text-[#FFFFFF] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors font-light"
            />
            
            {/* Send Button - Only visible when typing */}
            <button 
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                messageInput ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border border-[#444] flex items-center justify-center ${
                messageInput ? '' : 'send-button-pulse'
              }`}>
                <span className="text-[10px] text-[#888]">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className={`fixed bottom-4 left-4 text-[8px] text-[#333] transition-opacity duration-500 ${
        showUI ? 'opacity-100' : 'opacity-0'
      }`}>
        Q = Quantum · F = Focus
      </div>
    </div>
  );
}
