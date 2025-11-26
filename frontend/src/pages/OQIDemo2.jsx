import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 2: Horizontal Split with Prominent History
 * Features: Wide history panel, horizontal layout, floating chat
 */
export default function OQIDemo2() {
  const [mood, setMood] = useState('philosophical');
  const [quantumMode, setQuantumMode] = useState(false);
  const [expandedCard, setExpandedCard] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(3);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoHistory = [
    { time: '14:03', question: 'Vem är du?', answer: 'Jag är OneSeek-7B-Zero, en AI skapad för transparens...' },
    { time: '14:07', question: 'Vad är ditt syfte?', answer: 'Mitt syfte är att vara en ärlig svensk AI...' },
    { time: '14:12', question: 'Vem är Robin?', answer: 'Robin är min skapare och grundare av OneSeek...' },
    { time: '14:18', question: 'Vad betyder Robin för dig?', answer: fullResponse },
  ];

  const demoMetrics = {
    politicalCorrectness: 12,
    precision: 99.7,
    verifiedDatasets: '4/4',
    fidelity: 99.7,
    biasScore: 0.15,
    consensus: 98.9,
  };

  const demoLedger = [
    { block: 127, time: '0.31s' },
    { block: 126, time: '0.29s' },
    { block: 125, time: '0.33s' },
    { block: 124, time: '0.28s' },
    { block: 123, time: '0.35s' },
  ];

  // Typing animation
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
      if (e.key === 'q' || e.key === 'Q') {
        setQuantumMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const moodColors = {
    calm: '#1E40AF',
    philosophical: '#6D28D9',
    passionate: '#991B1B',
    neutral: '#333333',
  };

  const getMoodColor = () => moodColors[mood] || moodColors.neutral;

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes horizontalPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.25; }
        }
        @keyframes slideInFromLeft {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes glowLine {
          0%, 100% { box-shadow: 0 0 5px ${getMoodColor()}; }
          50% { box-shadow: 0 0 20px ${getMoodColor()}; }
        }
        @keyframes typingBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .horizontal-pulse {
          animation: horizontalPulse 3s ease-in-out infinite;
        }
        .slide-in {
          animation: slideInFromLeft 0.4s ease-out forwards;
        }
        .glow-line {
          animation: glowLine 2s ease-in-out infinite;
        }
        .typing-cursor {
          animation: typingBlink 1s infinite;
        }
      `}</style>

      {/* Horizontal DNA Line */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 glow-line z-30"
        style={{ backgroundColor: getMoodColor() }}
      />

      {/* Header */}
      <div className="relative z-20 px-8 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-sm transition-colors">
            ← Tillbaka
          </Link>
          <div className="text-xs font-mono text-[#888888]">
            ONESEEK-7B-ZERO v1.1 | Loss: 0.091 | Fidelity: 99.7%
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#666666]">Mood:</span>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: getMoodColor() + '33', color: getMoodColor() }}>
            Filosofisk
          </span>
          <span className="text-xs text-[#666666]">Press Q for Quantum</span>
        </div>
      </div>

      {/* Main Content - Horizontal Split */}
      <div className="grid grid-cols-[350px_1fr] h-[calc(100vh-160px)]">
        {/* History Timeline - Left (Wide) */}
        <div className="border-r border-[#1a1a1a] overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-mono text-[#666666] uppercase tracking-wider mb-4">
              Conversation History
            </h3>
            <div className="space-y-2">
              {demoHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedHistory(idx)}
                  className={`slide-in p-4 rounded-lg cursor-pointer transition-all ${
                    selectedHistory === idx 
                      ? 'bg-[#151515] border border-[#2a2a2a]' 
                      : 'hover:bg-[#0a0a0a]'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedHistory === idx ? getMoodColor() : '#666666' }}
                    />
                    <span className="text-[#666666] text-xs">{item.time}</span>
                  </div>
                  <p className="text-sm text-[#CCCCCC] mb-2">{item.question}</p>
                  <p className="text-xs text-[#666666] line-clamp-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area - Right */}
        <div className="flex flex-col">
          {/* Character Card - Floating Top Right */}
          <div 
            className={`absolute top-20 right-8 z-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 w-64 cursor-pointer transition-all duration-300 ${
              expandedCard ? 'w-80' : ''
            }`}
            onClick={() => setExpandedCard(!expandedCard)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono text-[#666666] uppercase">Character</h4>
              <span className="text-[10px] text-[#666666]">{expandedCard ? '−' : '+'}</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-[#FFFFFF]">OneSeek-7B-Zero</div>
              <div className="text-[#666666]">by Robin</div>
              {expandedCard && (
                <div className="pt-2 border-t border-[#1a1a1a] mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666666]">Purpose:</span>
                    <span className="text-[#FFFFFF]">Ärlig svensk AI</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666666]">DNA:</span>
                    <span className="text-[#FFFFFF]">v1.0 → v1.1</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-8 pr-80">
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">
                  R
                </div>
                <span className="text-[#CCCCCC]">Robin</span>
                <span className="text-xs text-[#666666]">14:18</span>
              </div>
              <p className="text-[#FFFFFF] text-lg pl-11">{demoHistory[selectedHistory].question}</p>
            </div>

            {/* Response */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: getMoodColor() + '33' }}
                >
                  O
                </div>
                <span className="text-[#CCCCCC]">OneSeek</span>
                <span className="text-xs text-[#666666]">14:18</span>
              </div>
              <div className="pl-11">
                <p className="text-[#FFFFFF] leading-relaxed text-lg">
                  {typingText}
                  {isTyping && <span className="typing-cursor inline-block w-0.5 h-5 bg-[#FFFFFF] ml-1" />}
                </p>

                {/* Typing Wave */}
                {isTyping && (
                  <div className="mt-6 h-8 flex items-end gap-0.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-[#333333] rounded-t"
                        style={{
                          height: `${10 + Math.sin(Date.now() / 200 + i * 0.3) * 10}px`,
                          opacity: 0.3 + Math.sin(Date.now() / 300 + i * 0.2) * 0.3,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-[#1a1a1a] p-6">
            <div className="flex gap-4 max-w-3xl">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande här..."
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-5 py-4 text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#3a3a3a]"
              />
              <button className="px-8 py-4 bg-[#FFFFFF] text-[#000000] rounded-lg hover:bg-[#CCCCCC] transition-colors font-medium">
                Skicka
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="fixed bottom-12 left-0 right-0 px-8 py-3 bg-[#0a0a0a]/90 backdrop-blur border-t border-[#1a1a1a]">
        <div className="flex justify-center gap-8 text-xs font-mono">
          <span className="text-[#666666]">PC: <span className="text-[#FFFFFF]">{demoMetrics.politicalCorrectness}%</span></span>
          <span className="text-[#666666]">Precision: <span className="text-[#FFFFFF]">{demoMetrics.precision}%</span></span>
          <span className="text-[#666666]">Datasets: <span className="text-[#FFFFFF]">{demoMetrics.verifiedDatasets}</span></span>
          <span className="text-[#666666]">Fidelity: <span className="text-green-400">{demoMetrics.fidelity}%</span></span>
          <span className="text-[#666666]">Bias: <span className="text-[#FFFFFF]">{demoMetrics.biasScore}</span></span>
        </div>
      </div>

      {/* Ledger Flow */}
      <div className="fixed bottom-0 left-0 right-0 px-8 py-2 bg-[#000000] flex items-center justify-center gap-4 overflow-x-auto">
        {demoLedger.map((block, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 px-3 py-1.5 bg-[#151515] rounded text-xs font-mono cursor-pointer hover:bg-[#2a2a2a] transition-colors"
          >
            <span className="text-[#CCCCCC]">#{block.block}</span>
            <span className="text-[#666666] ml-2">{block.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
