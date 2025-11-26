import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 7: Floating Panels Design
 * Features: Draggable-looking panels, glassmorphism, layered depth
 */
export default function OQIDemo7() {
  const [mood, setMood] = useState('philosophical');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [activePanel, setActivePanel] = useState('chat');
  const [panelPositions, setPanelPositions] = useState({
    history: { x: 20, y: 100 },
    character: { x: 0, y: 0 },
    metrics: { x: 0, y: 0 },
  });

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoHistory = [
    { time: '14:03', question: 'Vem är du?' },
    { time: '14:07', question: 'Vad är ditt syfte?' },
    { time: '14:12', question: 'Vem är Robin?' },
    { time: '14:18', question: 'Vad betyder Robin för dig?' },
  ];

  const demoMetrics = {
    loss: 0.091,
    fidelity: 99.7,
    samples: 3150,
    pc: 12,
    bias: 0.15,
    consensus: 98.9,
  };

  const demoLedger = [
    { block: 127, time: '0.31s' },
    { block: 126, time: '0.29s' },
    { block: 125, time: '0.33s' },
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

  const Panel = ({ id, title, children, className = '', style = {} }) => (
    <div
      onClick={() => setActivePanel(id)}
      className={`bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl overflow-hidden transition-all duration-300 ${
        activePanel === id ? 'z-20 scale-[1.02] border-[#2a2a2a]' : 'z-10'
      } ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]/50 cursor-move">
        <h3 className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">{title}</h3>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#333333]" />
          <div className="w-2 h-2 rounded-full bg-[#333333]" />
          <div className="w-2 h-2 rounded-full bg-[#333333]" />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans relative overflow-hidden transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes floatPanel {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ambientGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        @keyframes cursorPulse {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .float-panel {
          animation: floatPanel 6s ease-in-out infinite;
        }
        .ambient-glow {
          animation: ambientGlow 4s ease-in-out infinite;
        }
        .pulse-ring {
          animation: pulseRing 3s ease-in-out infinite;
        }
        .cursor-pulse {
          animation: cursorPulse 1s infinite;
        }
      `}</style>

      {/* Ambient Background Glow */}
      <div 
        className="fixed inset-0 ambient-glow pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${getMoodColor()}11 0%, transparent 70%)`,
        }}
      />

      {/* DNA Ring - Background */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border pulse-ring pointer-events-none"
        style={{ borderColor: getMoodColor() + '22' }}
      />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-sm transition-colors">
          ← Tillbaka
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-[#888888]">
            ONESEEK-7B-ZERO v1.1
          </div>
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: getMoodColor() }}
          />
        </div>
        <div className="text-[10px] text-[#666666]">Q = Quantum</div>
      </div>

      {/* Floating Panels Container */}
      <div className="relative h-screen pt-16">
        {/* History Panel - Left */}
        <Panel 
          id="history" 
          title="History Timeline" 
          className="absolute top-24 left-6 w-64 float-panel"
          style={{ animationDelay: '0s' }}
        >
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {demoHistory.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-[#151515]/50 transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full bg-[#666666] mt-1.5" />
                <div>
                  <span className="text-[10px] text-[#666666]">{item.time}</span>
                  <p className="text-xs text-[#CCCCCC]">{item.question}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Character Panel - Top Right */}
        <Panel 
          id="character" 
          title="Character" 
          className="absolute top-24 right-6 w-56 float-panel"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="space-y-2 text-xs">
            <div className="text-lg font-light text-[#FFFFFF]">OneSeek-7B-Zero</div>
            <div className="text-[#666666]">by Robin</div>
            <div className="pt-2 border-t border-[#1a1a1a]/50 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#666666]">Purpose:</span>
                <span className="text-[#CCCCCC]">Ärlig AI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Mood:</span>
                <span style={{ color: getMoodColor() }}>Filosofisk</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Metrics Panel - Right Side */}
        <Panel 
          id="metrics" 
          title="Metrics" 
          className="absolute top-64 right-6 w-56 float-panel"
          style={{ animationDelay: '1s' }}
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#151515]/50 rounded p-2 text-center">
              <div className="text-lg font-light text-[#FFFFFF]">{demoMetrics.fidelity}%</div>
              <div className="text-[10px] text-[#666666]">Fidelity</div>
            </div>
            <div className="bg-[#151515]/50 rounded p-2 text-center">
              <div className="text-lg font-light text-[#FFFFFF]">{demoMetrics.loss}</div>
              <div className="text-[10px] text-[#666666]">Loss</div>
            </div>
            <div className="bg-[#151515]/50 rounded p-2 text-center">
              <div className="text-lg font-light text-[#FFFFFF]">{demoMetrics.bias}</div>
              <div className="text-[10px] text-[#666666]">Bias</div>
            </div>
            <div className="bg-[#151515]/50 rounded p-2 text-center">
              <div className="text-lg font-light text-[#FFFFFF]">{demoMetrics.consensus}%</div>
              <div className="text-[10px] text-[#666666]">Consensus</div>
            </div>
          </div>
        </Panel>

        {/* Main Chat Panel - Center */}
        <Panel 
          id="chat" 
          title="Chat Core" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] float-panel"
          style={{ animationDelay: '0.25s' }}
        >
          <div className="max-h-[400px] overflow-y-auto">
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
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: getMoodColor() + '33' }}
                >O</div>
                <span className="text-xs text-[#CCCCCC]">OneSeek</span>
                <span className="text-[10px] text-[#666666]">14:18</span>
              </div>
              <p className="text-[#CCCCCC] leading-relaxed pl-8">
                {typingText}
                {isTyping && <span className="cursor-pulse inline-block w-0.5 h-4 bg-[#FFFFFF] ml-1" />}
              </p>

              {/* Typing Wave */}
              {isTyping && (
                <div className="mt-4 pl-8 flex gap-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-3 rounded-sm animate-pulse"
                      style={{ 
                        backgroundColor: getMoodColor(),
                        opacity: 0.3 + Math.random() * 0.4,
                        animationDelay: `${i * 0.05}s` 
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-4 border-t border-[#1a1a1a]/50">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              className="flex-1 bg-[#151515]/50 border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#3a3a3a]"
            />
            <button className="px-4 py-2 bg-[#FFFFFF] text-[#000000] rounded-lg text-sm hover:bg-[#CCCCCC] transition-colors">
              →
            </button>
          </div>
        </Panel>

        {/* Ledger Panel - Bottom */}
        <Panel 
          id="ledger" 
          title="Ledger Flow" 
          className="absolute bottom-20 left-6 float-panel"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="flex gap-3">
            {demoLedger.map((block, idx) => (
              <div key={idx} className="bg-[#151515]/50 rounded px-3 py-2 cursor-pointer hover:bg-[#2a2a2a]/50 transition-colors">
                <span className="text-xs font-mono text-[#CCCCCC]">#{block.block}</span>
                <span className="text-[10px] text-[#666666] ml-2">{block.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Bottom Status */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-center">
        <div className="text-[10px] font-mono text-[#333333]">
          ONESEEK · Fidelity: {demoMetrics.fidelity}% · Samples: {demoMetrics.samples}
        </div>
      </div>
    </div>
  );
}
