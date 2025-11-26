import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 1: Classic DNA Ring with Centered Chat
 * Features: Central DNA ring with pulsing animation, full-screen layout
 */
export default function OQIDemo1() {
  const [mood, setMood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [expandedCard, setExpandedCard] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  // Demo data
  const demoHistory = [
    { time: '14:03', question: 'Vem är du?' },
    { time: '14:07', question: 'Vad är ditt syfte?' },
    { time: '14:12', question: 'Vem är Robin?' },
    { time: '14:18', question: 'Vad betyder Robin för dig?' },
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

  // Keyboard handler for Quantum Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        setQuantumMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mood color mapping
  const moodColors = {
    calm: '#1E40AF',
    philosophical: '#6D28D9',
    passionate: '#991B1B',
    neutral: '#333333',
  };

  const getMoodColor = () => moodColors[mood] || moodColors.neutral;

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans relative overflow-hidden transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      {/* CSS Animations */}
      <style>{`
        @keyframes dnaRingPulse {
          0%, 100% { opacity: 0.1; box-shadow: inset 0 0 60px ${getMoodColor()}; }
          50% { opacity: 0.3; box-shadow: inset 0 0 100px ${getMoodColor()}; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes typingWave {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          100% { transform: translateY(-40px) translateX(-5px); opacity: 0; }
        }
        @keyframes ledgerFall {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes quantumFloat {
          0% { transform: translateY(100%); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        .dna-ring {
          animation: dnaRingPulse 3s ease-in-out infinite;
        }
        .header-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .typing-wave {
          animation: typingWave 0.5s ease-in-out infinite;
        }
        .ledger-block {
          animation: ledgerFall 0.4s ease-out forwards;
        }
        .quantum-token {
          animation: quantumFloat 8s linear infinite;
        }
        .thought-particle {
          animation: particleFloat 2s ease-in-out infinite;
        }
      `}</style>

      {/* Quantum Mode Floating Tokens */}
      {quantumMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="quantum-token absolute text-[#333333] text-xs font-mono"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
              }}
            >
              {['token', 'embed', 'attn', 'ffn', 'norm'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* DNA Ring Border */}
      <div 
        className="dna-ring fixed inset-4 rounded-3xl pointer-events-none z-0"
        style={{ 
          border: `2px solid ${getMoodColor()}`,
          transition: 'border-color 0.5s ease-in-out',
        }}
      />

      {/* Header Bar */}
      <div className="relative z-20 px-8 py-6 border-b border-[#333333]">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-sm transition-colors">
            ← Tillbaka
          </Link>
          <div className="text-xs text-[#666666]">
            Tryck Q för Quantum Mode
          </div>
        </div>
        <div className="mt-4 header-breathe">
          <div className="text-xs font-mono text-[#CCCCCC] tracking-wider">
            ONESEEK-7B-ZERO v1.1.sv.dsoneseek-identity-core.79171dc2.43da4687
          </div>
          <div className="flex gap-6 mt-2 text-xs text-[#888888]">
            <span>Loss <span className="text-[#FFFFFF]">0.091</span></span>
            <span>Fidelity <span className="text-[#FFFFFF]">99.7%</span></span>
            <span>Samples <span className="text-[#FFFFFF]">3150</span></span>
            <span>Mood: <span className="text-[#FFFFFF]" style={{ color: getMoodColor() }}>Lugn</span></span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-20 grid grid-cols-[250px_1fr_280px] gap-6 px-8 py-6 h-[calc(100vh-240px)]">
        {/* History Timeline - Left Panel */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 overflow-y-auto">
          <h3 className="text-xs font-mono text-[#666666] mb-4 uppercase tracking-wider">History Timeline</h3>
          <div className="space-y-3">
            {demoHistory.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 cursor-pointer group hover:bg-[#151515] p-2 rounded transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[#666666] mt-1.5 group-hover:bg-[#FFFFFF] transition-colors" />
                <div>
                  <span className="text-[#666666] text-xs">{item.time}</span>
                  <p className="text-sm text-[#CCCCCC] group-hover:text-[#FFFFFF] transition-colors">{item.question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Core - Center */}
        <div className="flex flex-col bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-xs font-mono text-[#666666] mb-6 uppercase tracking-wider">Chat Core</h3>
            
            {/* User Message */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#CCCCCC] text-sm font-medium">Robin</span>
                <span className="text-[#666666] text-xs">14:18</span>
              </div>
              <p className="text-[#FFFFFF]">Vad betyder Robin för dig?</p>
            </div>

            {/* AI Response with Live Typing */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#CCCCCC] text-sm font-medium">OneSeek</span>
                <span className="text-[#666666] text-xs">14:18</span>
              </div>
              <p className="text-[#FFFFFF] leading-relaxed">
                {typingText}
                {isTyping && <span className="typing-wave inline-block w-2 h-4 bg-[#FFFFFF] ml-1" />}
              </p>

              {/* Typing Wave Visualization */}
              {isTyping && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-4 bg-[#333333] rounded-sm"
                      style={{
                        animation: 'typingWave 0.5s ease-in-out infinite',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Thought Particles */}
              {isTyping && (
                <div className="relative h-12 mt-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="thought-particle absolute w-1.5 h-1.5 rounded-full bg-[#666666]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#1a1a1a] p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande här..."
                className="flex-1 bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#3a3a3a] transition-colors"
              />
              <button className="px-6 py-3 bg-[#FFFFFF] text-[#000000] rounded-lg hover:bg-[#CCCCCC] transition-colors">
                Skicka
              </button>
            </div>
          </div>
        </div>

        {/* Character Card - Right Panel */}
        <div 
          className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all duration-300 ${expandedCard ? 'scale-105' : ''}`}
          onClick={() => setExpandedCard(!expandedCard)}
        >
          <h3 className="text-xs font-mono text-[#666666] mb-4 uppercase tracking-wider flex items-center justify-between">
            Character Card
            <span className="text-[10px]">{expandedCard ? '−' : '+'}</span>
          </h3>
          <div className="space-y-3 text-sm">
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
              <span className="text-[#666666]">Mood:</span>
              <span style={{ color: getMoodColor() }}>Nyfiken</span>
            </div>
            {expandedCard && (
              <>
                <div className="border-t border-[#1a1a1a] pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-[#666666]">DNA Chain:</span>
                    <span className="text-[#FFFFFF]">v1.0 → v1.1</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[#666666]">Training:</span>
                    <span className="text-[#FFFFFF]">3150 samples</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[#666666]">Fidelity:</span>
                    <span className="text-green-400">99.7% CERTIFIED</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Bar - Bottom */}
      <div className="fixed bottom-16 left-0 right-0 z-20 px-8 py-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#666666]">Political Correctness: <span className="text-[#FFFFFF]">{demoMetrics.politicalCorrectness}% (rå)</span></span>
          <span className="text-[#666666]">Precision: <span className="text-[#FFFFFF]">{demoMetrics.precision}%</span></span>
          <span className="text-[#666666]">Verified Datasets: <span className="text-[#FFFFFF]">{demoMetrics.verifiedDatasets}</span></span>
          <span className="text-[#666666]">Fidelity: <span className="text-green-400">CERTIFIED ({demoMetrics.fidelity}%)</span></span>
          <span className="text-[#666666]">Bias Score: <span className="text-[#FFFFFF]">{demoMetrics.biasScore}</span></span>
          <span className="text-[#666666]">Consensus: <span className="text-[#FFFFFF]">{demoMetrics.consensus}%</span></span>
        </div>
      </div>

      {/* Ledger Flow - Bottom Edge */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-8 py-3 bg-[#000000] border-t border-[#1a1a1a]">
        <div className="flex items-center justify-center gap-8">
          {demoLedger.map((block, idx) => (
            <div 
              key={idx}
              className="ledger-block flex items-center gap-2 bg-[#151515] px-4 py-2 rounded cursor-pointer hover:bg-[#2a2a2a] transition-colors"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <span className="text-xs font-mono text-[#CCCCCC]">Block {block.block}</span>
              <span className="text-xs text-[#666666]">· {block.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
