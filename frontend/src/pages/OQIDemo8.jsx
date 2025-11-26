import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 8: Terminal/Console Style
 * Features: Monospace font, command-line aesthetic, raw data display
 */
export default function OQIDemo8() {
  const [mood, setMood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showLogs, setShowLogs] = useState(true);
  const inputRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoHistory = [
    { time: '14:03:22', command: 'ask "Vem är du?"', status: 'OK' },
    { time: '14:07:45', command: 'ask "Vad är ditt syfte?"', status: 'OK' },
    { time: '14:12:03', command: 'ask "Vem är Robin?"', status: 'OK' },
    { time: '14:18:31', command: 'ask "Vad betyder Robin för dig?"', status: 'PROCESSING' },
  ];

  const demoMetrics = {
    loss: 0.091,
    fidelity: 99.7,
    samples: 3150,
    pc: 12,
    bias: 0.15,
    consensus: 98.9,
    uptime: '72h 34m 12s',
    queries: 1247,
  };

  const demoLogs = [
    { time: '14:18:31.001', level: 'INFO', msg: 'Query received: "Vad betyder Robin för dig?"' },
    { time: '14:18:31.012', level: 'DEBUG', msg: 'Tokenizing input...' },
    { time: '14:18:31.089', level: 'DEBUG', msg: 'Running inference on OneSeek-7B-Zero...' },
    { time: '14:18:32.234', level: 'INFO', msg: 'Response generated: 287 tokens' },
    { time: '14:18:32.256', level: 'DEBUG', msg: 'Mood analysis: calm (confidence: 0.87)' },
    { time: '14:18:32.289', level: 'LEDGER', msg: 'Block #127 created, hash: 0x7a3f...' },
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
    }, 20);
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

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return '#991B1B';
      case 'WARN': return '#B45309';
      case 'INFO': return '#059669';
      case 'DEBUG': return '#666666';
      case 'LEDGER': return '#6D28D9';
      default: return '#666666';
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-[#00FF00] font-mono transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes cursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.97; }
          50% { opacity: 1; }
        }
        .scanline {
          animation: scanline 8s linear infinite;
        }
        .terminal-cursor {
          animation: cursor 1s infinite;
        }
        .terminal-flicker {
          animation: flicker 0.1s infinite;
        }
        .terminal-glow {
          text-shadow: 0 0 5px currentColor;
        }
      `}</style>

      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-5">
        <div className="scanline absolute left-0 right-0 h-[2px] bg-[#00FF00]" />
      </div>

      {/* Terminal Container */}
      <div className="terminal-flicker">
        {/* Header Bar */}
        <div className="border-b border-[#1a1a1a] px-4 py-2 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#666666] hover:text-[#00FF00] text-xs transition-colors">
              [EXIT]
            </Link>
            <span className="text-[#666666]">|</span>
            <span className="text-xs text-[#888888]">ONESEEK-7B-ZERO TERMINAL v1.1</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#666666]">UPTIME: <span className="text-[#00FF00]">{demoMetrics.uptime}</span></span>
            <span className="text-[#666666]">QUERIES: <span className="text-[#00FF00]">{demoMetrics.queries}</span></span>
            <span className="text-[#666666]">MOOD: <span style={{ color: getMoodColor() }} className="terminal-glow">CALM</span></span>
            <span className="text-[#444444]">[Q=QUANTUM]</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-[300px_1fr_250px] h-[calc(100vh-40px)]">
          {/* Left Panel - Command History */}
          <div className="border-r border-[#1a1a1a] overflow-y-auto p-4">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">
              ═══ COMMAND HISTORY ═══
            </div>
            <div className="space-y-2 text-xs">
              {demoHistory.map((item, idx) => (
                <div key={idx} className="hover:bg-[#151515] p-2 rounded cursor-pointer group">
                  <div className="flex justify-between text-[#666666]">
                    <span>{item.time}</span>
                    <span className={item.status === 'OK' ? 'text-[#059669]' : 'text-[#B45309]'}>
                      [{item.status}]
                    </span>
                  </div>
                  <div className="text-[#00FF00] group-hover:terminal-glow">
                    $ {item.command}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Main Terminal */}
          <div className="flex flex-col overflow-hidden">
            {/* Output Area */}
            <div className="flex-1 overflow-y-auto p-6 pb-24">
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">
                ═══ TERMINAL OUTPUT ═══
              </div>

              {/* System Info */}
              <div className="mb-6 text-xs text-[#666666]">
                <div>┌─────────────────────────────────────────────────────────────┐</div>
                <div>│ OneSeek-7B-Zero Quantum Interface                           │</div>
                <div>│ Model: v1.1.sv.dsoneseek-identity-core.79171dc2             │</div>
                <div>│ Loss: {demoMetrics.loss} | Fidelity: {demoMetrics.fidelity}% | Samples: {demoMetrics.samples}           │</div>
                <div>└─────────────────────────────────────────────────────────────┘</div>
              </div>

              {/* User Input */}
              <div className="mb-4 text-sm">
                <span className="text-[#666666]">robin@oneseek:~$</span>
                <span className="text-[#00FF00] ml-2">ask "Vad betyder Robin för dig?"</span>
              </div>

              {/* Response */}
              <div className="mb-6">
                <div className="text-xs text-[#666666] mb-2">[OneSeek Response]</div>
                <div className="text-[#CCCCCC] leading-relaxed pl-4 border-l-2 border-[#1a1a1a]">
                  <span className="text-[#888888]">&gt;</span> {typingText}
                  {isTyping && <span className="terminal-cursor inline-block w-2 h-4 bg-[#00FF00] ml-1" />}
                </div>
              </div>

              {/* Processing Indicator */}
              {isTyping && (
                <div className="text-xs text-[#666666] mb-4">
                  <span className="animate-pulse">[PROCESSING...]</span>
                  <span className="ml-4">Tokens: {Math.floor(typingText.length / 4)}</span>
                </div>
              )}

              {/* Logs */}
              {showLogs && (
                <div className="mt-8">
                  <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>═══ SYSTEM LOGS ═══</span>
                    <button 
                      onClick={() => setShowLogs(false)}
                      className="text-[#666666] hover:text-[#888888]"
                    >
                      [HIDE]
                    </button>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono">
                    {demoLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-[#444444]">{log.time}</span>
                        <span style={{ color: getLevelColor(log.level) }} className="w-14">[{log.level}]</span>
                        <span className="text-[#888888]">{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Line */}
            <div className="border-t border-[#1a1a1a] p-4 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#666666]">robin@oneseek:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="ask [question] or help for commands..."
                  className="flex-1 bg-transparent border-none text-[#00FF00] placeholder-[#444444] focus:outline-none"
                />
                <span className="terminal-cursor w-2 h-4 bg-[#00FF00]" />
              </div>
            </div>
          </div>

          {/* Right Panel - System Status */}
          <div className="border-l border-[#1a1a1a] overflow-y-auto p-4">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">
              ═══ SYSTEM STATUS ═══
            </div>

            {/* Metrics */}
            <div className="space-y-3 text-xs mb-6">
              <div className="border border-[#1a1a1a] p-3 rounded">
                <div className="text-[#666666] mb-1">LOSS</div>
                <div className="text-[#00FF00] text-lg terminal-glow">{demoMetrics.loss}</div>
              </div>
              <div className="border border-[#1a1a1a] p-3 rounded">
                <div className="text-[#666666] mb-1">FIDELITY</div>
                <div className="text-[#00FF00] text-lg terminal-glow">{demoMetrics.fidelity}%</div>
              </div>
              <div className="border border-[#1a1a1a] p-3 rounded">
                <div className="text-[#666666] mb-1">SAMPLES</div>
                <div className="text-[#00FF00] text-lg terminal-glow">{demoMetrics.samples}</div>
              </div>
              <div className="border border-[#1a1a1a] p-3 rounded">
                <div className="text-[#666666] mb-1">BIAS</div>
                <div className="text-[#00FF00] text-lg terminal-glow">{demoMetrics.bias}</div>
              </div>
            </div>

            {/* Character Info */}
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-2">
              ═══ CHARACTER ═══
            </div>
            <div className="text-xs space-y-1 text-[#888888]">
              <div>NAME: OneSeek-7B-Zero</div>
              <div>CREATOR: Robin</div>
              <div>PURPOSE: Ärlig svensk AI</div>
              <div>DNA: v1.0 → v1.1</div>
            </div>

            {/* Ledger */}
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mt-6 mb-2">
              ═══ LEDGER ═══
            </div>
            <div className="text-xs space-y-1">
              <div className="text-[#6D28D9]">Block #127 (0.31s)</div>
              <div className="text-[#6D28D9]">Block #126 (0.29s)</div>
              <div className="text-[#6D28D9]">Block #125 (0.33s)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
