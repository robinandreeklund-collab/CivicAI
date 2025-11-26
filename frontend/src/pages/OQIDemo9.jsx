import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 9: Grid-Based Dashboard
 * Features: Bento box layout, data-dense, metrics focused
 */
export default function OQIDemo9() {
  const [mood, setMood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening.";

  const demoHistory = [
    { time: '14:03', question: 'Vem är du?' },
    { time: '14:07', question: 'Vad är ditt syfte?' },
    { time: '14:12', question: 'Vem är Robin?' },
    { time: '14:18', question: 'Vad betyder Robin för dig?' },
  ];

  const demoMetrics = {
    loss: { value: 0.091, trend: 'down' },
    fidelity: { value: 99.7, trend: 'up' },
    samples: { value: 3150, trend: 'up' },
    pc: { value: 12, trend: 'stable' },
    bias: { value: 0.15, trend: 'down' },
    consensus: { value: 98.9, trend: 'up' },
    latency: { value: 234, unit: 'ms' },
    tokens: { value: 287, unit: 'total' },
  };

  const demoLedger = [
    { block: 127, time: '0.31s', verified: true },
    { block: 126, time: '0.29s', verified: true },
    { block: 125, time: '0.33s', verified: true },
    { block: 124, time: '0.28s', verified: true },
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

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <span className="text-green-400">↑</span>;
    if (trend === 'down') return <span className="text-red-400">↓</span>;
    return <span className="text-[#666666]">→</span>;
  };

  const GridCell = ({ children, className = '', onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2a2a2a] transition-all cursor-pointer ${className}`}
    >
      {children}
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans p-4 transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes valueCount {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blockStack {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .grid-pulse {
          animation: gridPulse 4s ease-in-out infinite;
        }
        .value-count {
          animation: valueCount 0.5s ease-out forwards;
        }
        .block-stack {
          animation: blockStack 0.3s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-xs transition-colors">
            ← Back
          </Link>
          <div>
            <div className="text-sm font-medium text-[#FFFFFF]">ONESEEK-7B-ZERO</div>
            <div className="text-[10px] text-[#666666]">Quantum Interface v1.1</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getMoodColor() }}
            />
            <span className="text-xs text-[#666666]">Lugn</span>
          </div>
          <span className="text-[10px] text-[#444444]">Q = Quantum</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-3 h-[calc(100vh-80px)]">
        {/* DNA Ring Visual - Spans 3 cols */}
        <GridCell className="col-span-3 row-span-2 flex flex-col items-center justify-center relative overflow-hidden">
          <div 
            className="absolute inset-8 rounded-full border-2 grid-pulse"
            style={{ borderColor: getMoodColor() + '44' }}
          />
          <div 
            className="absolute inset-16 rounded-full border grid-pulse"
            style={{ borderColor: getMoodColor() + '22', animationDelay: '0.5s' }}
          />
          <div className="relative z-10 text-center">
            <div className="text-3xl font-light text-[#FFFFFF] value-count">{demoMetrics.fidelity.value}%</div>
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mt-1">Fidelity</div>
            <div className="text-[10px] text-green-400 mt-2">CERTIFIED</div>
          </div>
        </GridCell>

        {/* Main Chat - Spans 6 cols, 3 rows */}
        <GridCell className="col-span-6 row-span-3">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">Chat Core</div>
          
          {/* Question */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px]">R</div>
              <span className="text-xs text-[#888888]">14:18</span>
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
              <span className="text-xs text-[#888888]">14:18</span>
            </div>
            <p className="text-[#CCCCCC] leading-relaxed pl-8">
              {typingText}
              {isTyping && <span className="inline-block w-0.5 h-4 bg-[#FFFFFF] ml-1 animate-pulse" />}
            </p>
          </div>

          {/* Input */}
          <div className="mt-auto pt-4 border-t border-[#1a1a1a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv meddelande..."
                className="flex-1 bg-[#151515] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder-[#666666] focus:outline-none"
              />
              <button className="px-4 py-2 bg-[#FFFFFF] text-[#000000] rounded-lg text-sm hover:bg-[#CCCCCC] transition-colors">
                →
              </button>
            </div>
          </div>
        </GridCell>

        {/* Character Card - Spans 3 cols */}
        <GridCell className="col-span-3">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Character</div>
          <div className="text-lg font-light text-[#FFFFFF] mb-1">OneSeek-7B-Zero</div>
          <div className="text-xs text-[#666666]">by Robin</div>
          <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#666666]">DNA</span>
              <span className="text-[#FFFFFF]">v1.0→v1.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Purpose</span>
              <span className="text-[#FFFFFF]">Ärlig AI</span>
            </div>
          </div>
        </GridCell>

        {/* History - Spans 3 cols */}
        <GridCell className="col-span-3">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">History</div>
          <div className="space-y-2">
            {demoHistory.slice(-3).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs hover:bg-[#151515] p-1 rounded">
                <div className="w-1 h-1 rounded-full bg-[#666666]" />
                <span className="text-[#666666]">{item.time}</span>
                <span className="text-[#CCCCCC] truncate">{item.question}</span>
              </div>
            ))}
          </div>
        </GridCell>

        {/* Metrics Grid - 6 small cells */}
        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">Loss</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-[#FFFFFF] value-count">{demoMetrics.loss.value}</span>
            <TrendIcon trend={demoMetrics.loss.trend} />
          </div>
        </GridCell>

        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">Samples</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-[#FFFFFF] value-count">{demoMetrics.samples.value}</span>
            <TrendIcon trend={demoMetrics.samples.trend} />
          </div>
        </GridCell>

        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">Bias</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-[#FFFFFF] value-count">{demoMetrics.bias.value}</span>
            <TrendIcon trend={demoMetrics.bias.trend} />
          </div>
        </GridCell>

        {/* Ledger - Spans 3 cols, 2 rows */}
        <GridCell className="col-span-3 row-span-2">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Ledger Flow</div>
          <div className="space-y-2">
            {demoLedger.map((block, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-[#151515] rounded-lg p-3 block-stack"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[#FFFFFF]">#{block.block}</span>
                  {block.verified && <span className="text-[10px] text-green-400">✓</span>}
                </div>
                <span className="text-xs text-[#666666]">{block.time}</span>
              </div>
            ))}
          </div>
        </GridCell>

        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">PC Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-[#FFFFFF] value-count">{demoMetrics.pc.value}%</span>
            <span className="text-[10px] text-[#666666]">rå</span>
          </div>
        </GridCell>

        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">Consensus</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-green-400 value-count">{demoMetrics.consensus.value}%</span>
            <TrendIcon trend={demoMetrics.consensus.trend} />
          </div>
        </GridCell>

        <GridCell className="col-span-2">
          <div className="text-[10px] text-[#666666] mb-2">Latency</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-[#FFFFFF] value-count">{demoMetrics.latency.value}</span>
            <span className="text-[10px] text-[#666666]">{demoMetrics.latency.unit}</span>
          </div>
        </GridCell>

        {/* Typing Wave - Spans bottom */}
        <GridCell className="col-span-6">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">Processing Wave</div>
          <div className="flex items-end gap-1 h-12">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-t transition-all duration-150 ${isTyping ? 'animate-pulse' : ''}`}
                style={{ 
                  height: isTyping ? `${20 + Math.sin(Date.now() / 200 + i * 0.3) * 15}px` : '4px',
                  backgroundColor: isTyping ? getMoodColor() : '#333333',
                  animationDelay: `${i * 0.02}s`
                }}
              />
            ))}
          </div>
        </GridCell>
      </div>
    </div>
  );
}
