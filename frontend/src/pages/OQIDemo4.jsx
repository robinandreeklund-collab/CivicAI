import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 4: Card-Based Modular Layout
 * Features: Clickable card panels, modular design, stacked information
 */
export default function OQIDemo4() {
  const [mood] = useState('philosophical');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [activeCard, setActiveCard] = useState('chat');
  const [expandedMetric, setExpandedMetric] = useState(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoHistory = [
    { time: '14:03', question: 'Vem är du?' },
    { time: '14:07', question: 'Vad är ditt syfte?' },
    { time: '14:12', question: 'Vem är Robin?' },
    { time: '14:18', question: 'Vad betyder Robin för dig?' },
  ];

  const demoMetrics = [
    { id: 'pc', label: 'Political Correctness', value: '12%', status: 'rå' },
    { id: 'precision', label: 'Precision', value: '99.7%', status: 'high' },
    { id: 'datasets', label: 'Verified Datasets', value: '4/4', status: 'complete' },
    { id: 'fidelity', label: 'Fidelity', value: '99.7%', status: 'certified' },
    { id: 'bias', label: 'Bias Score', value: '0.15', status: 'low' },
    { id: 'consensus', label: 'Consensus', value: '98.9%', status: 'high' },
  ];

  const demoLedger = [
    { block: 127, time: '0.31s', hash: '0x7a3f...' },
    { block: 126, time: '0.29s', hash: '0x8b4e...' },
    { block: 125, time: '0.33s', hash: '0x9c5d...' },
  ];

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

  const Card = ({ title, children, onClick, isActive, className = '' }) => (
    <div
      onClick={onClick}
      className={`bg-[#0a0a0a] border rounded-xl p-4 transition-all duration-300 cursor-pointer ${
        isActive ? 'border-[#2a2a2a] scale-[1.02]' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
      } ${className}`}
    >
      <h3 className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes cardPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 30px ${getMoodColor()}22; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes typingDot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .card-pulse {
          animation: cardPulse 3s ease-in-out infinite;
        }
        .slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
        .typing-dot {
          animation: typingDot 1s ease-in-out infinite;
        }
      `}</style>

      {/* DNA Ring Border */}
      <div 
        className="fixed inset-3 rounded-2xl pointer-events-none card-pulse"
        style={{ border: `1px solid ${getMoodColor()}33` }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-sm transition-colors">
          ← Tillbaka
        </Link>
        <div className="text-center">
          <div className="text-xs font-mono text-[#CCCCCC]">ONESEEK-7B-ZERO v1.1</div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMoodColor() }} />
            <span className="text-[10px] text-[#666666]">Filosofisk</span>
          </div>
        </div>
        <div className="text-[10px] text-[#666666]">Q = Quantum</div>
      </div>

      {/* Card Grid */}
      <div className="relative z-10 p-6 grid grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-140px)]">
        {/* Left Column */}
        <div className="space-y-4 overflow-y-auto">
          {/* History Card */}
          <Card title="History Timeline" onClick={() => setActiveCard('history')} isActive={activeCard === 'history'}>
            <div className="space-y-2">
              {demoHistory.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded hover:bg-[#151515] transition-colors slide-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#666666] mt-1.5" />
                  <div>
                    <span className="text-[10px] text-[#666666]">{item.time}</span>
                    <p className="text-xs text-[#CCCCCC]">{item.question}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Character Card */}
          <Card title="Character" onClick={() => setActiveCard('character')} isActive={activeCard === 'character'}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666666]">Name:</span>
                <span className="text-[#FFFFFF]">OneSeek-7B-Zero</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Creator:</span>
                <span className="text-[#FFFFFF]">Robin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Purpose:</span>
                <span className="text-[#FFFFFF]">Ärlig svensk AI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">DNA Chain:</span>
                <span className="text-[#FFFFFF]">v1.0 → v1.1</span>
              </div>
            </div>
          </Card>

          {/* Ledger Card */}
          <Card title="Ledger Flow" onClick={() => setActiveCard('ledger')} isActive={activeCard === 'ledger'}>
            <div className="space-y-2">
              {demoLedger.map((block, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-[#151515] rounded text-xs slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <span className="text-[#CCCCCC]">Block {block.block}</span>
                  <span className="text-[#666666]">{block.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center - Chat */}
        <div className="flex flex-col">
          <Card 
            title="Chat Core" 
            onClick={() => setActiveCard('chat')} 
            isActive={activeCard === 'chat'}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto mb-4">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px]">R</div>
                  <span className="text-xs text-[#CCCCCC]">Robin</span>
                  <span className="text-[10px] text-[#666666]">14:18</span>
                </div>
                <p className="text-[#FFFFFF] pl-8">Vad betyder Robin för dig?</p>
              </div>

              {/* Response */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: getMoodColor() + '33' }}
                  >O</div>
                  <span className="text-xs text-[#CCCCCC]">OneSeek</span>
                  <span className="text-[10px] text-[#666666]">14:18</span>
                </div>
                <div className="pl-8">
                  <p className="text-[#FFFFFF] leading-relaxed">
                    {typingText}
                    {isTyping && <span className="inline-block w-2 h-4 bg-[#FFFFFF] ml-1 typing-dot" />}
                  </p>

                  {/* Typing Wave */}
                  {isTyping && (
                    <div className="mt-4 flex gap-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-3 bg-[#333333] rounded-sm typing-dot"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-4 border-t border-[#1a1a1a]">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                className="flex-1 bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-[#FFFFFF] placeholder-[#666666] focus:outline-none"
              />
              <button className="px-4 py-2 bg-[#FFFFFF] text-[#000000] rounded-lg text-sm hover:bg-[#CCCCCC] transition-colors">
                Skicka
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column - Metrics */}
        <div className="space-y-2 overflow-y-auto">
          <h3 className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-3">Mätvärden</h3>
          {demoMetrics.map((metric) => (
            <div
              key={metric.id}
              onClick={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
              className={`bg-[#0a0a0a] border rounded-lg p-3 cursor-pointer transition-all ${
                expandedMetric === metric.id ? 'border-[#2a2a2a] scale-[1.02]' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#666666]">{metric.label}</span>
                <span className={`text-sm font-mono ${metric.status === 'certified' || metric.status === 'high' ? 'text-green-400' : 'text-[#FFFFFF]'}`}>
                  {metric.value}
                </span>
              </div>
              {expandedMetric === metric.id && (
                <div className="mt-2 pt-2 border-t border-[#1a1a1a] text-[10px] text-[#666666] slide-up">
                  Status: <span className="text-[#CCCCCC]">{metric.status}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-3 bg-[#000000] border-t border-[#1a1a1a] flex justify-center">
        <div className="flex items-center gap-6 text-[10px] font-mono text-[#666666]">
          <span>Loss: <span className="text-[#FFFFFF]">0.091</span></span>
          <span>·</span>
          <span>Samples: <span className="text-[#FFFFFF]">3150</span></span>
          <span>·</span>
          <span>Mood: <span style={{ color: getMoodColor() }}>Filosofisk</span></span>
        </div>
      </div>
    </div>
  );
}
