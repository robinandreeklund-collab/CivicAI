import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 5: Vertical Stacked Layout
 * Features: Full-width sections stacked vertically, scrolling experience
 */
export default function OQIDemo5() {
  const [mood, setMood] = useState('calm');
  const [quantumMode, setQuantumMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [visibleSections, setVisibleSections] = useState(['header']);

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const demoHistory = [
    { time: '14:03', question: 'Vem är du?', mood: 'neutral' },
    { time: '14:07', question: 'Vad är ditt syfte?', mood: 'philosophical' },
    { time: '14:12', question: 'Vem är Robin?', mood: 'calm' },
    { time: '14:18', question: 'Vad betyder Robin för dig?', mood: 'passionate' },
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
    { block: 127, time: '0.31s', data: 'Response verified' },
    { block: 126, time: '0.29s', data: 'Query processed' },
    { block: 125, time: '0.33s', data: 'Session started' },
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

  // Intersection Observer for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => [...new Set([...prev, entry.target.id])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const moodColors = {
    calm: '#1E40AF',
    philosophical: '#6D28D9',
    passionate: '#991B1B',
    neutral: '#333333',
  };

  const getMoodColor = (m = mood) => moodColors[m] || moodColors.neutral;

  return (
    <div className={`min-h-screen bg-[#000000] text-[#FFFFFF] font-sans transition-all duration-500 ${quantumMode ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes slideInUp {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes dnaScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        @keyframes pulseWidth {
          0%, 100% { width: 0%; }
          50% { width: 100%; }
        }
        .slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        .dna-scroll {
          animation: dnaScroll 10s linear infinite;
        }
        .pulse-width {
          animation: pulseWidth 3s ease-in-out infinite;
        }
      `}</style>

      {/* Fixed DNA Sidebar */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-1 dna-scroll z-30"
        style={{ 
          background: `repeating-linear-gradient(to bottom, ${getMoodColor()}22 0px, ${getMoodColor()}44 2px, transparent 2px, transparent 10px)` 
        }}
      />

      {/* Fixed Header */}
      <div className="fixed top-0 left-4 right-0 z-20 bg-[#000000]/90 backdrop-blur border-b border-[#1a1a1a] px-8 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="text-[#666666] hover:text-[#FFFFFF] text-sm transition-colors">
            ← Tillbaka
          </Link>
          <div className="text-center">
            <div className="text-xs font-mono text-[#CCCCCC]">ONESEEK-7B-ZERO</div>
            <div className="text-[10px] text-[#666666]">v1.1.sv | Fidelity: 99.7%</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMoodColor() }} />
            <span className="text-xs text-[#666666]">Lugn</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="pt-20 pl-6">
        {/* Section 1: Character Profile */}
        <section 
          id="character" 
          data-section
          className={`min-h-[50vh] py-16 px-8 border-b border-[#1a1a1a] ${visibleSections.includes('character') ? 'slide-in-up' : 'opacity-0'}`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Character Profile</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-light text-[#FFFFFF]">OneSeek-7B-Zero</div>
                  <div className="text-sm text-[#666666] mt-1">Created by Robin</div>
                </div>
                <p className="text-[#888888] leading-relaxed">
                  Ärlig svensk AI designad för transparens och rättvisa. Varje svar kan spåras genom en fullständig provenans-kedja.
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#666666]">DNA Chain</span>
                  <span className="text-[#FFFFFF]">v1.0 → v1.1</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#666666]">Training Samples</span>
                  <span className="text-[#FFFFFF]">3,150</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#666666]">Loss</span>
                  <span className="text-[#FFFFFF]">0.091</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#666666]">Current Mood</span>
                  <span style={{ color: getMoodColor() }}>Lugn</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: History Timeline */}
        <section 
          id="history" 
          data-section
          className={`min-h-[50vh] py-16 px-8 border-b border-[#1a1a1a] ${visibleSections.includes('history') ? 'slide-in-up' : 'opacity-0'}`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Conversation History</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1a1a1a]" />
              
              <div className="space-y-6">
                {demoHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-6 pl-8 relative">
                    <div 
                      className="absolute left-2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: getMoodColor(item.mood), top: '0.5rem' }}
                    />
                    <div className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#666666]">{item.time}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: getMoodColor(item.mood) + '33', color: getMoodColor(item.mood) }}>
                          {item.mood}
                        </span>
                      </div>
                      <p className="text-[#FFFFFF]">{item.question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Current Chat */}
        <section 
          id="chat" 
          data-section
          className={`min-h-screen py-16 px-8 border-b border-[#1a1a1a] ${visibleSections.includes('chat') ? 'slide-in-up' : 'opacity-0'}`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Chat Core</h2>
            
            {/* Question */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">R</div>
                <div>
                  <span className="text-[#CCCCCC]">Robin</span>
                  <span className="text-xs text-[#666666] ml-2">14:18</span>
                </div>
              </div>
              <p className="text-2xl font-light text-[#FFFFFF] pl-13 ml-13">Vad betyder Robin för dig?</p>
            </div>

            {/* Response */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getMoodColor() + '33' }}
                >O</div>
                <div>
                  <span className="text-[#CCCCCC]">OneSeek</span>
                  <span className="text-xs text-[#666666] ml-2">14:18</span>
                </div>
              </div>
              <p className="text-xl text-[#CCCCCC] leading-relaxed pl-13 ml-13">
                {typingText}
                {isTyping && <span className="inline-block w-0.5 h-5 bg-[#FFFFFF] ml-1 animate-pulse" />}
              </p>

              {/* Typing Wave */}
              {isTyping && (
                <div className="mt-8 ml-13 pl-13">
                  <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full pulse-width" style={{ backgroundColor: getMoodColor() }} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#666666] animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-4">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-6 py-4 text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#3a3a3a]"
              />
              <button className="px-8 py-4 bg-[#FFFFFF] text-[#000000] rounded-xl hover:bg-[#CCCCCC] transition-colors">
                Skicka
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Metrics */}
        <section 
          id="metrics" 
          data-section
          className={`min-h-[50vh] py-16 px-8 border-b border-[#1a1a1a] ${visibleSections.includes('metrics') ? 'slide-in-up' : 'opacity-0'}`}
        >
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Mätvärden</h2>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(demoMetrics).map(([key, value], idx) => (
                <div key={key} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#2a2a2a] transition-colors cursor-pointer">
                  <div className="text-3xl font-light text-[#FFFFFF] mb-2">{value}{typeof value === 'number' && key !== 'biasScore' ? '%' : ''}</div>
                  <div className="text-xs text-[#666666] uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Ledger */}
        <section 
          id="ledger" 
          data-section
          className={`min-h-[40vh] py-16 px-8 pb-32 ${visibleSections.includes('ledger') ? 'slide-in-up' : 'opacity-0'}`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mb-6">Ledger Flow</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {demoLedger.map((block, idx) => (
                <div 
                  key={idx}
                  className="flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 w-64 hover:border-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-mono text-[#FFFFFF]">Block {block.block}</span>
                    <span className="text-xs text-[#666666]">{block.time}</span>
                  </div>
                  <div className="text-xs text-[#888888]">{block.data}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
