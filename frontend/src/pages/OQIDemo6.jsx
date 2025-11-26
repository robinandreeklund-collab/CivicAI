import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 6: Sidebar-Focused Design
 * Features: Prominent left sidebar with all controls, clean main area
 */
export default function OQIDemo6() {
  const [mood, setMood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sidebarSection, setSidebarSection] = useState('chat');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

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

  const NavItem = ({ id, label, icon }) => (
    <button
      onClick={() => setSidebarSection(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
        sidebarSection === id 
          ? 'bg-[#1a1a1a] text-[#FFFFFF]' 
          : 'text-[#666666] hover:text-[#CCCCCC] hover:bg-[#0a0a0a]'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {sidebarExpanded && <span className="text-sm">{label}</span>}
    </button>
  );

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans flex transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes sidebarGlow {
          0%, 100% { box-shadow: inset -1px 0 0 ${getMoodColor()}22; }
          50% { box-shadow: inset -1px 0 0 ${getMoodColor()}44; }
        }
        @keyframes breatheText {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes particleRise {
          0% { transform: translateY(0); opacity: 0.4; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .sidebar-glow {
          animation: sidebarGlow 3s ease-in-out infinite;
        }
        .breathe-text {
          animation: breatheText 4s ease-in-out infinite;
        }
        .particle-rise {
          animation: particleRise 3s ease-out infinite;
        }
      `}</style>

      {/* Left Sidebar */}
      <div 
        className={`fixed left-0 top-0 bottom-0 bg-[#0a0a0a] border-r border-[#1a1a1a] sidebar-glow z-30 transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[10px] text-[#666666] hover:bg-[#2a2a2a] hover:text-[#FFFFFF] transition-colors"
        >
          {sidebarExpanded ? '←' : '→'}
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <Link to="/" className="block">
            {sidebarExpanded ? (
              <div>
                <div className="text-sm font-medium text-[#FFFFFF] breathe-text">ONESEEK</div>
                <div className="text-[10px] text-[#666666]">7B-ZERO v1.1</div>
              </div>
            ) : (
              <div className="text-lg font-bold text-center">O</div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1">
          <NavItem id="chat" label="Chat" icon="💬" />
          <NavItem id="history" label="Historik" icon="📜" />
          <NavItem id="character" label="Karaktär" icon="🤖" />
          <NavItem id="metrics" label="Mätvärden" icon="📊" />
          <NavItem id="ledger" label="Ledger" icon="⛓️" />
        </div>

        {/* Mood Indicator */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: getMoodColor() }}
            />
            {sidebarExpanded && (
              <span className="text-xs text-[#666666]">Mood: Lugn</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        {/* Top Bar */}
        <div className="fixed top-0 right-0 left-64 z-20 bg-[#000000]/90 backdrop-blur border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between transition-all duration-300" style={{ left: sidebarExpanded ? '256px' : '64px' }}>
          <div className="text-xs font-mono text-[#666666]">
            Loss: {demoMetrics.loss} | Fidelity: {demoMetrics.fidelity}% | Samples: {demoMetrics.samples}
          </div>
          <div className="text-[10px] text-[#666666]">Press Q for Quantum Mode</div>
        </div>

        {/* Content Area */}
        <div className="pt-16 h-screen overflow-y-auto">
          {/* Chat Section */}
          {sidebarSection === 'chat' && (
            <div className="max-w-3xl mx-auto px-8 py-8">
              <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-8">Chat Core</h2>
              
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">R</div>
                  <span className="text-sm text-[#CCCCCC]">Robin</span>
                  <span className="text-xs text-[#666666]">14:18</span>
                </div>
                <p className="text-xl text-[#FFFFFF] pl-11">Vad betyder Robin för dig?</p>
              </div>

              {/* Response */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: getMoodColor() + '33' }}
                  >O</div>
                  <span className="text-sm text-[#CCCCCC]">OneSeek</span>
                  <span className="text-xs text-[#666666]">14:18</span>
                </div>
                <div className="pl-11">
                  <p className="text-lg text-[#CCCCCC] leading-relaxed">
                    {typingText}
                    {isTyping && <span className="inline-block w-0.5 h-5 bg-[#FFFFFF] ml-1 animate-pulse" />}
                  </p>

                  {/* Thought Particles */}
                  {isTyping && (
                    <div className="relative h-20 mt-6">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="particle-rise absolute w-1 h-1 rounded-full bg-[#666666]"
                          style={{
                            left: `${i * 6 + Math.random() * 5}%`,
                            animationDelay: `${Math.random() * 2}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-[#000000] to-transparent transition-all duration-300" style={{ left: sidebarExpanded ? '256px' : '64px' }}>
                <div className="max-w-3xl mx-auto flex gap-4">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Skriv ditt meddelande..."
                    className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-5 py-4 text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#3a3a3a]"
                  />
                  <button className="px-6 py-4 bg-[#FFFFFF] text-[#000000] rounded-xl hover:bg-[#CCCCCC] transition-colors">
                    Skicka
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Section */}
          {sidebarSection === 'history' && (
            <div className="max-w-2xl mx-auto px-8 py-8">
              <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Conversation History</h2>
              <div className="space-y-3">
                {demoHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 cursor-pointer hover:border-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMoodColor() }} />
                      <span className="text-xs text-[#666666]">{item.time}</span>
                    </div>
                    <p className="text-[#FFFFFF]">{item.question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Section */}
          {sidebarSection === 'character' && (
            <div className="max-w-2xl mx-auto px-8 py-8">
              <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Character Profile</h2>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
                <div className="text-2xl font-light text-[#FFFFFF]">OneSeek-7B-Zero</div>
                <div className="text-sm text-[#666666]">Created by Robin</div>
                <div className="border-t border-[#1a1a1a] pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Purpose</span>
                    <span className="text-[#FFFFFF]">Ärlig svensk AI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">DNA Chain</span>
                    <span className="text-[#FFFFFF]">v1.0 → v1.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Mood</span>
                    <span style={{ color: getMoodColor() }}>Lugn</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Section */}
          {sidebarSection === 'metrics' && (
            <div className="max-w-3xl mx-auto px-8 py-8">
              <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Mätvärden</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(demoMetrics).map(([key, value]) => (
                  <div key={key} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors cursor-pointer">
                    <div className="text-2xl font-light text-[#FFFFFF]">{value}{key === 'fidelity' || key === 'consensus' || key === 'pc' ? '%' : ''}</div>
                    <div className="text-xs text-[#666666] uppercase tracking-wider mt-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ledger Section */}
          {sidebarSection === 'ledger' && (
            <div className="max-w-3xl mx-auto px-8 py-8">
              <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Ledger Flow</h2>
              <div className="space-y-3">
                {demoLedger.map((block, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex justify-between items-center hover:border-[#2a2a2a] transition-colors cursor-pointer">
                    <span className="font-mono text-[#FFFFFF]">Block {block.block}</span>
                    <span className="text-sm text-[#666666]">{block.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
