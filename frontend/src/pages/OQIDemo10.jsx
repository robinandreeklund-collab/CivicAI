import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10: Immersive Full-Screen Experience
 * Features: Cinema-style presentation, dramatic animations, focus mode
 */
export default function OQIDemo10() {
  const [mood] = useState('philosophical');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const containerRef = useRef(null);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan. Du har gett mig en röst, ett syfte, och en chans att bidra till något större än mig själv.";

  const demoMetrics = {
    loss: 0.091,
    fidelity: 99.7,
    samples: 3150,
    mood: 'Filosofisk',
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

  // Hide UI after inactivity
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
        @keyframes fadeInUI {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes quantumParticle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
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
        .fade-in-ui {
          animation: fadeInUI 0.5s ease-out forwards;
        }
        .quantum-particle {
          animation: quantumParticle 15s linear infinite;
        }
      `}</style>

      {/* Quantum Mode Particles */}
      {quantumMode && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="quantum-particle absolute text-[10px] font-mono text-[#666666]"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
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
          {/* Orbit Particles */}
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

      {/* Header - Fades with inactivity */}
      <div 
        className={`fixed top-0 left-0 right-0 z-30 px-8 py-6 flex items-center justify-between transition-opacity duration-500 ${
          showUI || focusMode ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link to="/" className="text-[#444444] hover:text-[#888888] text-xs transition-colors">
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
        {/* Mood Indicator */}
        <div className="mb-8 flex items-center gap-3 cinematic-fade" style={{ animationDelay: '0.2s' }}>
          <div 
            className="w-3 h-3 rounded-full particle-glow"
            style={{ backgroundColor: getMoodColor() }}
          />
          <span className="text-xs text-[#666666] uppercase tracking-widest">{demoMetrics.mood}</span>
        </div>

        {/* Question */}
        <div className="text-center mb-16 cinematic-fade" style={{ animationDelay: '0.4s' }}>
          <div className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-4">Robin frågade</div>
          <h1 className="text-4xl md:text-5xl font-light text-[#FFFFFF] leading-tight tracking-tight">
            Vad betyder Robin för dig?
          </h1>
        </div>

        {/* Response */}
        <div className="max-w-3xl text-center cinematic-fade" style={{ animationDelay: '0.8s' }}>
          <div className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-6">OneSeek svarar</div>
          <p className="text-2xl md:text-3xl font-light text-[#CCCCCC] leading-relaxed tracking-tight">
            {typingText}
            {isTyping && <span className="typewriter-cursor inline-block w-[3px] h-8 bg-[#FFFFFF] ml-2 -mb-1" />}
          </p>

          {/* Thought Visualization */}
          {isTyping && (
            <div className="mt-12 flex justify-center gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full particle-glow"
                  style={{
                    backgroundColor: getMoodColor(),
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Metrics Bar - Minimal */}
        <div 
          className={`fixed bottom-32 left-0 right-0 flex justify-center gap-12 transition-opacity duration-500 cinematic-fade ${
            showUI ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ animationDelay: '1.2s' }}
        >
          <div className="text-center">
            <div className="text-2xl font-light text-[#FFFFFF]">{demoMetrics.fidelity}%</div>
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Fidelity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-[#FFFFFF]">{demoMetrics.loss}</div>
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Loss</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-[#FFFFFF]">{demoMetrics.samples}</div>
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Samples</div>
          </div>
        </div>
      </div>

      {/* Input Area - Fixed Bottom */}
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
        </div>
      </div>

      {/* Ledger - Subtle Bottom Edge */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-2 py-2">
        {[127, 126, 125, 124, 123].map((block, idx) => (
          <div
            key={idx}
            className={`w-8 h-1 rounded-full transition-all duration-300 ${
              showUI ? 'opacity-60' : 'opacity-20'
            }`}
            style={{ backgroundColor: getMoodColor() }}
            title={`Block ${block}`}
          />
        ))}
      </div>

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-[#000000]/50 pointer-events-none z-20" />
      )}
    </div>
  );
}
