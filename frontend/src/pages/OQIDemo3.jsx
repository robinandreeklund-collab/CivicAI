import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 3: Full-Width Minimalist with Breathing UI
 * Features: Maximum whitespace, centered focus, subtle animations
 */
export default function OQIDemo3() {
  const [mood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoMetrics = {
    loss: 0.091,
    fidelity: 99.7,
    samples: 3150,
    politicalCorrectness: 12,
    biasScore: 0.15,
    consensus: 98.9,
  };

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
    }, 40);
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
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans transition-all duration-700 ${quantumMode ? 'opacity-60' : ''}`}>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.005); opacity: 1; }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.02); opacity: 0.2; }
        }
        @keyframes fadeUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes softGlow {
          0%, 100% { box-shadow: 0 0 30px ${getMoodColor()}22; }
          50% { box-shadow: 0 0 60px ${getMoodColor()}44; }
        }
        .breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .pulse-ring {
          animation: pulseRing 3s ease-in-out infinite;
        }
        .fade-up {
          animation: fadeUp 0.6s ease-out forwards;
        }
        .cursor-blink {
          animation: cursorBlink 1s infinite;
        }
        .soft-glow {
          animation: softGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Glow Background */}
      <div 
        className="fixed inset-0 soft-glow pointer-events-none"
        style={{ backgroundColor: '#000000' }}
      />

      {/* Minimal Header */}
      <div className="fixed top-0 left-0 right-0 z-20 px-8 py-6 flex items-center justify-between">
        <Link to="/" className="text-[#444444] hover:text-[#888888] text-xs transition-colors duration-300">
          ← back
        </Link>
        <div 
          className="breathe cursor-pointer"
          onClick={() => setShowMetrics(!showMetrics)}
        >
          <div className="text-center">
            <div className="text-[10px] font-mono text-[#666666] tracking-widest">ONESEEK-7B-ZERO</div>
            <div className="text-[8px] font-mono text-[#444444] mt-1">v1.1.sv</div>
          </div>
        </div>
        <div className="text-[10px] text-[#444444] font-mono">
          Q = quantum
        </div>
      </div>

      {/* Expandable Metrics Panel */}
      {showMetrics && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 fade-up">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-light text-[#FFFFFF]">{demoMetrics.loss}</div>
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mt-1">Loss</div>
            </div>
            <div>
              <div className="text-2xl font-light text-green-400">{demoMetrics.fidelity}%</div>
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mt-1">Fidelity</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#FFFFFF]">{demoMetrics.samples}</div>
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mt-1">Samples</div>
            </div>
          </div>
        </div>
      )}

      {/* Central Chat Area */}
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-32">
        {/* DNA Ring - Centered */}
        <div 
          className="pulse-ring absolute w-[600px] h-[600px] rounded-full border pointer-events-none"
          style={{ borderColor: getMoodColor() + '33' }}
        />
        <div 
          className="pulse-ring absolute w-[500px] h-[500px] rounded-full border pointer-events-none"
          style={{ borderColor: getMoodColor() + '22', animationDelay: '0.5s' }}
        />
        <div 
          className="pulse-ring absolute w-[400px] h-[400px] rounded-full border pointer-events-none"
          style={{ borderColor: getMoodColor() + '11', animationDelay: '1s' }}
        />

        {/* Conversation */}
        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Question */}
          <div className="mb-16 fade-up">
            <div className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-4">Robin · 14:18</div>
            <h2 className="text-3xl font-light text-[#FFFFFF] leading-relaxed">
              Vad betyder Robin för dig?
            </h2>
          </div>

          {/* Mood Indicator */}
          <div className="mb-8">
            <div 
              className="w-3 h-3 rounded-full mx-auto breathe"
              style={{ backgroundColor: getMoodColor() }}
            />
            <div className="text-[10px] text-[#666666] mt-2 uppercase tracking-widest">Lugn</div>
          </div>

          {/* Response */}
          <div className="fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-4">OneSeek · 14:18</div>
            <p className="text-xl font-light text-[#CCCCCC] leading-relaxed">
              {typingText}
              {isTyping && <span className="cursor-blink inline-block w-0.5 h-5 bg-[#FFFFFF] ml-1 -mb-0.5" />}
            </p>
          </div>

          {/* Thought Particles - Minimal */}
          {isTyping && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#666666] breathe"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input - Floating Bottom */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-xl px-8">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-2 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Skriv ditt meddelande..."
            className="flex-1 bg-transparent px-4 py-3 text-[#FFFFFF] placeholder-[#444444] focus:outline-none text-sm"
          />
          <button className="px-6 py-3 bg-[#FFFFFF] text-[#000000] rounded-xl hover:bg-[#CCCCCC] transition-colors text-sm">
            →
          </button>
        </div>
      </div>

      {/* Ledger - Subtle Bottom Edge */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-1 py-2">
        {[127, 126, 125, 124, 123].map((block, idx) => (
          <div
            key={idx}
            className="w-2 h-2 rounded-sm bg-[#1a1a1a] hover:bg-[#2a2a2a] cursor-pointer transition-colors"
            title={`Block ${block}`}
          />
        ))}
      </div>

      {/* Bottom Metrics - Minimal */}
      <div className="fixed bottom-16 left-0 right-0 flex justify-center">
        <div className="text-[10px] font-mono text-[#333333] flex gap-6">
          <span>fidelity: {demoMetrics.fidelity}%</span>
          <span>·</span>
          <span>bias: {demoMetrics.biasScore}</span>
          <span>·</span>
          <span>consensus: {demoMetrics.consensus}%</span>
        </div>
      </div>
    </div>
  );
}
