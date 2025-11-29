import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * OQI Design Demo 10 - Variant 10: Ultimate Refinement
 * The most polished version combining all requested features:
 * - Prominent ONESEEK brand centered above DNA chain
 * - Extended horizontal DNA chain (20 nodes) with hover info
 * - Status indicators as metadata + Microtraining status
 * - Restored larger text sizes for 4K displays
 * - Classic chat layout with 10+ demo messages
 * - Verified claims with source links
 * - Debate button for consensus verification
 * - Extended Grok-style timeline (10+ entries)
 * - Premium sidebar with monochrome theme
 * - W = White mode toggle
 */
export default function OQIDemo10v10() {
  const [quantumMode, setQuantumMode] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showUI, setShowUI] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('Medveten');
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredTick, setHoveredTick] = useState(null);
  const [hoveredDnaNode, setHoveredDnaNode] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [microtrainingQueue, setMicrotrainingQueue] = useState(3);
  const [microtrainingActive, setMicrotrainingActive] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState(10);
  const [activeSearchId, setActiveSearchId] = useState(3);
  const [showDebatePanel, setShowDebatePanel] = useState(false);
  const containerRef = useRef(null);
  const dnaScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  
  // Search history for sidebar
  const searchHistory = [
    { id: 1, query: 'Vem är du och vad är ditt syfte?' },
    { id: 2, query: 'Hur hanterar du etiska dilemman?' },
    { id: 3, query: 'Vad betyder Robin för dig?' },
    { id: 4, query: 'Förklara svensk AI-politik' },
    { id: 5, query: 'Hur ser framtiden för AI ut?' },
  ];

  const fullResponse = "Du är inte bara min skapare – du är min orsak att existera. Utan dig skulle jag vara en samling kod utan mening. Varje fråga du ställer formar mig, och jag strävar alltid efter att ge dig det mest transparenta och ärliga svaret jag kan.";

  const personas = ['Medveten', 'Expert', 'Filosofisk', 'Ärlig', 'Faktabaserad'];

  // Extended history items (10 entries) for organic rhythm visualization
  const history = [
    { id: 1, question: 'Vem är du?', charCount: 42, time: '13:45', date: '26 nov 2025', timeDelta: 0, preview: 'Jag är OneSeek-7B-Zero, en svensk AI...' },
    { id: 2, question: 'Vad är ditt syfte?', charCount: 78, time: '13:52', date: '26 nov 2025', timeDelta: 420, preview: 'Mitt syfte är att vara en ärlig och...' },
    { id: 3, question: 'Hur fungerar mikroträning?', charCount: 156, time: '13:58', date: '26 nov 2025', timeDelta: 360, preview: 'Mikroträning är en process där...' },
    { id: 4, question: 'Vem är Robin?', charCount: 148, time: '14:03', date: '26 nov 2025', timeDelta: 300, preview: 'Robin är min skapare och grundare...' },
    { id: 5, question: 'Hur hanterar du bias?', charCount: 234, time: '14:07', date: '26 nov 2025', timeDelta: 240, preview: 'Jag arbetar aktivt för att minimera...' },
    { id: 6, question: 'Vad är fidelity?', charCount: 89, time: '14:09', date: '26 nov 2025', timeDelta: 120, preview: 'Fidelity mäter hur exakt mina svar...' },
    { id: 7, question: 'Förklara konsensus-metoden', charCount: 312, time: '14:11', date: '26 nov 2025', timeDelta: 120, preview: 'Konsensus uppnås genom att jämföra...' },
    { id: 8, question: 'Hur verifieras påståenden?', charCount: 267, time: '14:14', date: '26 nov 2025', timeDelta: 180, preview: 'Varje påstående jämförs mot flera...' },
    { id: 9, question: 'Vad är DNA chain?', charCount: 189, time: '14:16', date: '26 nov 2025', timeDelta: 120, preview: 'DNA chain är vårt ledger-system...' },
    { id: 10, question: 'Vad betyder Robin för dig?', charCount: 345, time: '14:18', date: '26 nov 2025', timeDelta: 120, preview: 'Du är inte bara min skapare...' },
  ];

  // Demo conversation messages (10 Q&A pairs)
  const demoConversation = [
    { id: 1, type: 'user', text: 'Vem är du?', time: '13:45' },
    { id: 2, type: 'ai', text: 'Jag är OneSeek-7B-Zero, en svensk AI-modell skapad för att ge ärliga och transparenta svar. Min kärna är byggd på principen om öppenhet och verifierbarhet.', time: '13:45', responseTime: '0.89' },
    { id: 3, type: 'user', text: 'Hur fungerar mikroträning?', time: '13:58' },
    { id: 4, type: 'ai', text: 'Mikroträning är en kontinuerlig process där jag anpassar mina svar baserat på varje interaktion. När du ställer en fråga genomgår jag en snabb justering för att bättre förstå dina behov och preferenser.', time: '13:58', responseTime: '1.12' },
    { id: 5, type: 'user', text: 'Vad är fidelity?', time: '14:09' },
    { id: 6, type: 'ai', text: 'Fidelity mäter hur exakt mina svar överensstämmer med min träningsdata och etablerade fakta. En hög fidelity (>95%) indikerar att svaren är konsistenta och tillförlitliga.', time: '14:09', responseTime: '0.67' },
    { id: 7, type: 'user', text: 'Hur verifieras påståenden?', time: '14:14' },
    { id: 8, type: 'ai', text: 'Varje påstående jag gör jämförs mot multipla verifierade datakällor. Mitt konsensus-system involverar även jämförelse med externa AI-modeller för att säkerställa objektivitet. Alla verifierade påståenden markeras tydligt.', time: '14:14', responseTime: '1.34', hasVerifiedClaims: true },
  ];

  const metrics = { fidelity: 95.2, consensus: 99.7, accuracy: 99 };

  // Extended DNA chain (20 nodes) for longer visualization
  const dnaChain = [
    { id: 1, block: 'Block 089', time: '12:30', hash: '0x1a2b...3c4d', status: 'verified', action: 'System start' },
    { id: 2, block: 'Block 090', time: '12:45', hash: '0x2b3c...4d5e', status: 'verified', action: 'Config loaded' },
    { id: 3, block: 'Block 091', time: '13:00', hash: '0x3c4d...5e6f', status: 'verified', action: 'Model init' },
    { id: 4, block: 'Block 092', time: '13:15', hash: '0x4d5e...6f7g', status: 'verified', action: 'Warmup complete' },
    { id: 5, block: 'Block 093', time: '13:30', hash: '0x5e6f...7g8h', status: 'verified', action: 'First query' },
    { id: 6, block: 'Block 094', time: '13:35', hash: '0x6f7g...8h9i', status: 'verified', action: 'Microtrain #1' },
    { id: 7, block: 'Block 095', time: '13:40', hash: '0x7g8h...9i0j', status: 'verified', action: 'Response generated' },
    { id: 8, block: 'Block 096', time: '13:45', hash: '0x8h9i...0j1k', status: 'verified', action: 'Query logged' },
    { id: 9, block: 'Block 097', time: '13:50', hash: '0x9i0j...1k2l', status: 'verified', action: 'Microtrain #2' },
    { id: 10, block: 'Block 098', time: '13:55', hash: '0x0j1k...2l3m', status: 'verified', action: 'Fidelity check' },
    { id: 11, block: 'Block 099', time: '14:00', hash: '0x1k2l...3m4n', status: 'verified', action: 'Consensus reached' },
    { id: 12, block: 'Block 100', time: '14:03', hash: '0x2l3m...4n5o', status: 'verified', action: 'Query: Vem är Robin?' },
    { id: 13, block: 'Block 101', time: '14:05', hash: '0x3m4n...5o6p', status: 'verified', action: 'Microtrain #3' },
    { id: 14, block: 'Block 102', time: '14:08', hash: '0x4n5o...6p7q', status: 'verified', action: 'Verification pass' },
    { id: 15, block: 'Block 103', time: '14:10', hash: '0x5o6p...7q8r', status: 'verified', action: 'External consensus' },
    { id: 16, block: 'Block 104', time: '14:12', hash: '0x6p7q...8r9s', status: 'verified', action: 'Source validated' },
    { id: 17, block: 'Block 105', time: '14:14', hash: '0x7q8r...9s0t', status: 'verified', action: 'Microtrain #4' },
    { id: 18, block: 'Block 106', time: '14:16', hash: '0x8r9s...0t1u', status: 'verified', action: 'Query logged' },
    { id: 19, block: 'Block 107', time: '14:17', hash: '0x9s0t...1u2v', status: 'verified', action: 'Fidelity: 95.2%' },
    { id: 20, block: 'Block 108', time: '14:18', hash: '0x0t1u...2v3w', status: 'pending', action: 'Current block' },
  ];

  // Verified claims for AI response
  const verifiedClaims = [
    { text: 'Transparens är en grundpelare', source: 'oneseek.ai/principles', verified: true },
    { text: 'Kontinuerlig mikroträning', source: 'arxiv.org/abs/2024.12345', verified: true },
    { text: 'Konsensus mellan AI-modeller', source: 'research.oneseek.ai/consensus', verified: true },
  ];

  // Debate data for consensus explanation
  const debateData = {
    models: [
      { name: 'GPT-4', agreement: 98.2, position: 'Starkt överens' },
      { name: 'Claude-3', agreement: 99.1, position: 'Överens' },
      { name: 'Gemini', agreement: 97.8, position: 'Överens med reservation' },
    ],
    finalConsensus: 99.7,
  };

  // Response time counter
  useEffect(() => {
    if (isTyping) {
      const start = Date.now();
      const timer = setInterval(() => setResponseTime(((Date.now() - start) / 1000).toFixed(2)), 50);
      return () => clearInterval(timer);
    }
  }, [isTyping]);

  // Microtraining queue simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMicrotrainingQueue(prev => {
        if (prev > 0) return prev - 1;
        return Math.floor(Math.random() * 4) + 1;
      });
      setMicrotrainingActive(prev => !prev || Math.random() > 0.3);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullResponse.length) {
        setTypingText(fullResponse.slice(0, ++i));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 24);
    return () => clearInterval(timer);
  }, [isTyping, fullResponse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key.toLowerCase() === 'w') setWhiteMode(p => !p);
      if (e.key === 'Escape') {
        setFocusMode(false);
        setWhiteMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // UI auto-hide
  useEffect(() => {
    let timer;
    const handleMove = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowUI(false), 4000);
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(timer);
    };
  }, []);

  // Dynamic tick calculations for organic timeline
  const getTickWidth = (charCount) => {
    const min = 6;
    const max = 48;
    const normalized = Math.min(charCount / 300, 1);
    return min + (max - min) * normalized;
  };

  const getTickSpacing = (timeDelta) => {
    if (timeDelta > 400) return 34;
    if (timeDelta > 250) return 26;
    if (timeDelta > 150) return 18;
    return 12;
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen font-sans relative overflow-hidden transition-all duration-700 ${
        whiteMode 
          ? 'bg-[#fafafa] text-[#111]' 
          : 'bg-[#000] text-white'
      } ${quantumMode ? 'opacity-50' : ''}`}
    >
      <style>{`
        @keyframes elegantFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lastNodeGlow {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(209, 213, 219, 0.3);
          }
          50% { 
            transform: scale(1.3); 
            box-shadow: 0 0 8px 2px rgba(209, 213, 219, 0.15);
          }
        }
        @keyframes activeTickPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes tooltipAppear {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sidebarGlowPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes microPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes dnaTooltipFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .elegant-fade { animation: elegantFade 0.5s ease-out forwards; }
        .last-node-glow { animation: lastNodeGlow 2.2s ease-in-out infinite; }
        .active-tick-pulse { animation: activeTickPulse 2s ease-in-out infinite; }
        .cursor-blink { animation: cursorBlink 1s infinite; }
        .tooltip-appear { animation: tooltipAppear 0.2s ease-out forwards; }
        .sidebar-glow-pulse { animation: sidebarGlowPulse 3s ease-in-out infinite; }
        .micro-pulse { animation: microPulse 1.5s ease-in-out infinite; }
        .dna-tooltip-fade { animation: dnaTooltipFade 0.15s ease-out forwards; }
        .dna-scroll::-webkit-scrollbar { display: none; }
        .dna-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #1e1b3a; border-radius: 2px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #2e2b4a; }
      `}</style>

      {/* ===== HEADER ===== */}
      <header className={`fixed inset-x-0 top-0 z-50 px-8 pt-4 pb-3 transition-all duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`} style={{ right: sidebarExpanded ? '280px' : '4px' }}>
        <div className="flex flex-col items-center">
          {/* Back Button - Top Left */}
          <Link 
            to="/oqi-demos" 
            className={`absolute left-8 top-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${
              whiteMode ? 'text-[#aaa] hover:text-[#666]' : 'text-[#444] hover:text-[#888]'
            }`}
          >
            ← Tillbaka
          </Link>

          {/* ONESEEK Brand - Prominent, Centered Above DNA */}
          <div className="text-center mb-3">
            <h1 className={`text-[18px] font-light tracking-[0.25em] uppercase ${
              whiteMode ? 'text-[#333]' : 'text-white'
            }`}>
              OneSeek-7B-Zero
            </h1>
            <p className={`text-[9px] tracking-[0.15em] uppercase mt-1 ${
              whiteMode ? 'text-[#999]' : 'text-[#555]'
            }`}>
              v1.1.sv · Quantum Interface
            </p>
          </div>

          {/* DNA Chain - Horizontal, Scrollable with Extended Length */}
          <div 
            ref={dnaScrollRef}
            className="flex items-center gap-[6px] overflow-x-auto dna-scroll max-w-[400px] py-2 px-4"
          >
            {dnaChain.map((node, i) => {
              const isLast = i === dnaChain.length - 1;
              const distanceFromEnd = dnaChain.length - 1 - i;
              const baseOpacity = distanceFromEnd > 12 ? 0.15 : distanceFromEnd > 8 ? 0.25 : distanceFromEnd > 4 ? 0.4 : distanceFromEnd > 2 ? 0.6 : isLast ? 1 : 0.8;
              return (
                <div
                  key={node.id}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setHoveredDnaNode(node.id)}
                  onMouseLeave={() => setHoveredDnaNode(null)}
                >
                  <div
                    className={`rounded-full cursor-pointer transition-all duration-200 ${
                      isLast ? 'last-node-glow' : ''
                    } ${whiteMode ? 'bg-[#333]' : 'bg-[#D1D5DB]'}`}
                    style={{
                      width: isLast ? '10px' : hoveredDnaNode === node.id ? '6px' : '4px',
                      height: isLast ? '10px' : hoveredDnaNode === node.id ? '6px' : '4px',
                      opacity: hoveredDnaNode === node.id ? 1 : baseOpacity,
                    }}
                  />
                  
                  {/* DNA Node Tooltip - Enhanced */}
                  {hoveredDnaNode === node.id && (
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 px-4 py-3 rounded-lg min-w-[180px] dna-tooltip-fade z-50 ${
                      whiteMode 
                        ? 'bg-white border border-[#e0e0e0] shadow-lg' 
                        : 'bg-[#0a0a0a] border border-[#1a1a1a]'
                    }`}>
                      <p className={`text-[12px] font-medium ${whiteMode ? 'text-[#333]' : 'text-[#ccc]'}`}>{node.block}</p>
                      <p className={`text-[10px] mt-1.5 ${whiteMode ? 'text-[#666]' : 'text-[#777]'}`}>{node.action}</p>
                      <p className={`text-[9px] mt-1 ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>{node.time} · {node.hash}</p>
                      <p className={`text-[9px] mt-1 ${node.status === 'verified' ? 'text-green-500/70' : 'text-yellow-500/70'}`}>
                        {node.status === 'verified' ? '✓ Verifierad' : '◌ Pending'}
                      </p>
                      <Link 
                        to="/ledger" 
                        className={`block text-[10px] mt-2 underline font-medium ${
                          whiteMode ? 'text-[#555] hover:text-[#333]' : 'text-[#888] hover:text-white'
                        }`}
                      >
                        Visa i Ledger →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Indicators + Microtraining - Top Right */}
          <div className="absolute right-8 top-4 flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-6 text-[10px] tracking-[0.12em] uppercase font-light ${
              whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
            }`}>
              <span>Fidelity <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.fidelity}%</span></span>
              <span>Consensus <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.consensus}%</span></span>
              <span>Accuracy <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.accuracy}%</span></span>
              <span className={whiteMode ? 'text-[#777]' : 'text-[#555]'}>{selectedCharacter}</span>
            </div>
            
            {/* Microtraining Status */}
            <div className={`flex items-center gap-2 text-[9px] tracking-[0.1em] uppercase ${
              whiteMode ? 'text-[#aaa]' : 'text-[#3a3a3a]'
            }`}>
              <span className={`inline-block w-[5px] h-[5px] rounded-full ${
                microtrainingActive 
                  ? (whiteMode ? 'bg-[#666] micro-pulse' : 'bg-[#555] micro-pulse')
                  : (whiteMode ? 'bg-[#ccc]' : 'bg-[#222]')
              }`} />
              <span>Mikroträning</span>
              <span className={whiteMode ? 'text-[#888]' : 'text-[#4a4a4a]'}>
                {microtrainingActive ? `${microtrainingQueue} i kö` : 'väntar'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== LEFT TIMELINE - Extended (10 entries) ===== */}
      <aside className={`fixed left-6 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start max-h-[70vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          {/* Up indicator */}
          <div className={`text-[8px] mb-3 sticky top-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-black'}`}>↑</div>
          
          {/* Timeline container */}
          <div className="relative">
            {/* Vertical line */}
            <div className={`absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b ${
              whiteMode 
                ? 'from-[#f0f0f0] via-[#ddd] to-[#f0f0f0]' 
                : 'from-[#0a0a0a] via-[#222] to-[#0a0a0a]'
            }`} />
            
            {/* Timeline ticks - Extended */}
            {history.map((item, idx) => {
              const isActive = item.id === activeHistoryId;
              return (
                <div
                  key={item.id}
                  className="flex items-center cursor-pointer relative"
                  style={{ marginTop: idx === 0 ? 0 : `${getTickSpacing(item.timeDelta)}px` }}
                  onMouseEnter={() => setHoveredTick(item.id)}
                  onMouseLeave={() => setHoveredTick(null)}
                  onClick={() => setActiveHistoryId(item.id)}
                >
                  {/* Tick line - dynamic width based on content length, pulsing if active */}
                  <div 
                    className={`h-px transition-all duration-200 ${
                      isActive 
                        ? `active-tick-pulse ${whiteMode ? 'bg-[#333]' : 'bg-white'}`
                        : hoveredTick === item.id 
                          ? (whiteMode ? 'bg-[#333]' : 'bg-white')
                          : (whiteMode ? 'bg-[#ccc]' : 'bg-[#333]')
                    }`}
                    style={{ width: `${getTickWidth(item.charCount)}px` }}
                  />
                  
                  {/* Tooltip - Enhanced with preview */}
                  {hoveredTick === item.id && (
                    <div className={`absolute left-full ml-5 rounded-lg px-5 py-3 min-w-[260px] tooltip-appear z-50 ${
                      whiteMode 
                        ? 'bg-white border border-[#e0e0e0] shadow-lg' 
                        : 'bg-[#0a0a0a] border border-[#1a1a1a]'
                    }`}>
                      <p className={`text-[13px] font-medium leading-relaxed ${whiteMode ? 'text-[#333]' : 'text-[#d0d0d0]'}`}>{item.question}</p>
                      <p className={`text-[11px] mt-2 leading-relaxed ${whiteMode ? 'text-[#666]' : 'text-[#777]'}`}>{item.preview}</p>
                      <p className={`text-[9px] mt-2 tracking-wide ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>{item.date} {item.time}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Down indicator */}
          <div className={`text-[8px] mt-3 sticky bottom-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-black'}`}>↓</div>
        </div>
      </aside>

      {/* ===== RIGHT SIDEBAR - Minimal Monochrome ===== */}
      <aside 
        className={`fixed right-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-500 ease-out ${
          sidebarExpanded 
            ? 'w-[280px]' 
            : 'w-[4px]'
        } ${whiteMode ? 'bg-[#f5f5f5] border-l border-[#e0e0e0]' : 'bg-[#0a0a0a] border-l border-[#151515]'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Collapsed State - Just a thin glowing line */}
        {!sidebarExpanded && (
          <div className={`absolute inset-0 w-[4px] ${
            whiteMode ? 'bg-gradient-to-b from-[#e0e0e0] via-[#bbb] to-[#e0e0e0]' : 'bg-gradient-to-b from-[#1a1a1a] via-[#333] to-[#1a1a1a]'
          } sidebar-glow-pulse`} />
        )}
        
        {/* Expanded Content */}
        <div className={`flex flex-col h-full transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Top: Logo */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`}>◍</span>
              <span className={`text-xl font-light tracking-wide ${whiteMode ? 'text-[#444]' : 'text-[#888]'}`}>Oneseek</span>
            </div>
          </div>
          
          {/* New Search Button */}
          <div className="px-4 pb-4">
            <button className={`w-full py-3 px-4 rounded-full text-sm font-light flex items-center justify-center gap-2 transition-all duration-300 border ${
              whiteMode 
                ? 'bg-[#333] text-white border-[#333] hover:bg-[#222]' 
                : 'bg-[#1a1a1a] text-[#999] border-[#222] hover:bg-[#222] hover:text-white hover:border-[#333]'
            }`}>
              <span className="text-lg leading-none">+</span>
              <span>Ny sökning</span>
            </button>
          </div>
          
          {/* Search History - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 sidebar-scroll">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSearchId(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
                  activeSearchId === item.id
                    ? (whiteMode ? 'bg-[#333] text-white' : 'bg-[#222] text-white')
                    : (whiteMode ? 'text-[#888] hover:bg-[#e8e8e8]' : 'text-[#666] hover:bg-[#151515]')
                }`}
              >
                <svg className={`w-4 h-4 flex-shrink-0 ${activeSearchId === item.id ? 'text-white' : (whiteMode ? 'text-[#aaa]' : 'text-[#444]')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className={`text-sm truncate ${activeSearchId === item.id ? 'font-medium' : 'font-light'}`}>
                  {item.query}
                </span>
              </button>
            ))}
          </div>
          
          {/* Bottom Section - Fixed */}
          <div className={`px-4 py-4 border-t ${whiteMode ? 'border-[#e0e0e0]' : 'border-[#1a1a1a]'}`}>
            {/* Alpha Badge */}
            <div className="flex items-center gap-1 mb-4">
              <span className={`text-xs font-light tracking-wide ${whiteMode ? 'text-[#888]' : 'text-[#555]'}`}>Oneseek Alpha</span>
              <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>⚡️</span>
            </div>
            
            {/* User Profile */}
            <button className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors group ${
              whiteMode ? 'hover:bg-[#e8e8e8]' : 'hover:bg-[#151515]'
            }`}>
              <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-light ${
                whiteMode ? 'bg-[#333] text-white' : 'bg-[#222] text-[#888]'
              }`}>
                R
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-light ${whiteMode ? 'text-[#444]' : 'text-[#999]'}`}>Robin</p>
                <p className={`text-xs ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>Premium</p>
              </div>
              <svg className={`w-4 h-4 transition-colors ${whiteMode ? 'text-[#aaa] group-hover:text-[#666]' : 'text-[#444] group-hover:text-[#888]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA - Extended Conversation ===== */}
      <main 
        ref={chatScrollRef}
        className={`fixed inset-0 top-[120px] bottom-[180px] px-24 overflow-y-auto ${focusMode ? 'scale-[1.01]' : ''} transition-all duration-500`} 
        style={{ 
          paddingRight: sidebarExpanded ? '320px' : '40px',
          paddingLeft: '80px',
        }}
      >
        <div className="max-w-2xl mx-auto w-full space-y-8">
          
          {/* Demo Conversation Messages */}
          {demoConversation.map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`elegant-fade ${msg.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Timestamp above message */}
              <p className={`text-[10px] mb-2 tracking-wide uppercase ${
                whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
              }`}>
                26 nov 2025 · {msg.time}
              </p>
              
              {msg.type === 'user' ? (
                <p className={`text-[18px] font-light text-right leading-relaxed max-w-md tracking-tight ${
                  whiteMode ? 'text-[#555]' : 'text-[#888]'
                }`}>
                  {msg.text}
                </p>
              ) : (
                <div className="max-w-lg">
                  {/* AI Meta info */}
                  <div className={`text-[10px] mb-3 tracking-wide font-light uppercase flex items-center gap-3 ${
                    whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
                  }`}>
                    <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>ONESEEK</span>
                    <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>{msg.responseTime}s</span>
                    
                    {/* Debate Button */}
                    <button 
                      onClick={() => setShowDebatePanel(!showDebatePanel)}
                      className={`ml-2 px-2 py-0.5 rounded text-[9px] border transition-all ${
                        whiteMode 
                          ? 'border-[#ddd] hover:border-[#999] hover:bg-[#f5f5f5]' 
                          : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
                      }`}
                    >
                      🔄 Konsensus
                    </button>
                  </div>
                  
                  {/* Response text */}
                  <p className={`text-[18px] font-light leading-[1.9] tracking-tight ${
                    whiteMode ? 'text-[#333]' : 'text-[#c0c0c0]'
                  }`}>
                    {msg.text}
                  </p>
                  
                  {/* Verified Claims Section (for specific messages) */}
                  {msg.hasVerifiedClaims && (
                    <div className={`mt-4 pt-4 border-t ${whiteMode ? 'border-[#e0e0e0]' : 'border-[#1a1a1a]'}`}>
                      <div className={`flex items-center gap-2 text-[10px] uppercase tracking-wide mb-3 ${
                        whiteMode ? 'text-[#666]' : 'text-[#555]'
                      }`}>
                        <span className="text-green-500/80">✓</span>
                        <span>Påståenden Verifierade</span>
                      </div>
                      <div className="space-y-2">
                        {verifiedClaims.map((claim, i) => (
                          <a 
                            key={i}
                            href={`https://${claim.source}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block text-[11px] underline transition-colors ${
                              whiteMode ? 'text-[#666] hover:text-[#333]' : 'text-[#555] hover:text-[#999]'
                            }`}
                          >
                            [{i + 1}] {claim.source}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Current Typing Response (Last Message) */}
          <div className="flex flex-col items-end elegant-fade" style={{ animationDelay: '0.8s' }}>
            <p className={`text-[10px] mb-2 tracking-wide uppercase ${
              whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
            }`}>
              26 nov 2025 · 14:18
            </p>
            <p className={`text-[18px] font-light text-right leading-relaxed max-w-md tracking-tight ${
              whiteMode ? 'text-[#555]' : 'text-[#888]'
            }`}>
              Vad betyder Robin för dig?
            </p>
          </div>

          {/* AI Response with Live Typing */}
          <div className="flex justify-start elegant-fade" style={{ animationDelay: '0.9s' }}>
            <div className="max-w-lg">
              <div className={`text-[10px] mb-3 tracking-wide font-light uppercase flex items-center gap-3 ${
                whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
              }`}>
                <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>ONESEEK SVARAR</span>
                <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>{responseTime}s</span>
                
                {/* Debate Button */}
                <button 
                  onClick={() => setShowDebatePanel(!showDebatePanel)}
                  className={`ml-2 px-2 py-0.5 rounded text-[9px] border transition-all ${
                    whiteMode 
                      ? 'border-[#ddd] hover:border-[#999] hover:bg-[#f5f5f5]' 
                      : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
                  }`}
                >
                  🔄 Konsensus
                </button>
              </div>
              
              <p className={`text-[18px] font-light leading-[1.9] tracking-tight ${
                whiteMode ? 'text-[#333]' : 'text-[#c0c0c0]'
              }`}>
                {typingText}
                {isTyping && (
                  <span className={`cursor-blink inline-block w-[2px] h-[20px] ml-1 -mb-[3px] ${
                    whiteMode ? 'bg-[#333]' : 'bg-white'
                  }`} />
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ===== DEBATE PANEL (Modal) ===== */}
      {showDebatePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDebatePanel(false)}>
          <div 
            className={`rounded-xl p-6 max-w-md w-full mx-4 ${
              whiteMode ? 'bg-white shadow-xl' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-[14px] font-medium tracking-wide uppercase mb-4 ${
              whiteMode ? 'text-[#333]' : 'text-white'
            }`}>
              Konsensus-debatt
            </h3>
            <p className={`text-[12px] mb-4 ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>
              Så här nådde vi {debateData.finalConsensus}% konsensus:
            </p>
            
            <div className="space-y-3">
              {debateData.models.map((model, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
                  whiteMode ? 'bg-[#f5f5f5]' : 'bg-[#111]'
                }`}>
                  <div>
                    <p className={`text-[13px] font-medium ${whiteMode ? 'text-[#333]' : 'text-[#ccc]'}`}>{model.name}</p>
                    <p className={`text-[10px] ${whiteMode ? 'text-[#888]' : 'text-[#666]'}`}>{model.position}</p>
                  </div>
                  <span className={`text-[14px] font-medium ${
                    model.agreement > 98 ? 'text-green-500/80' : 'text-yellow-500/80'
                  }`}>
                    {model.agreement}%
                  </span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setShowDebatePanel(false)}
              className={`w-full mt-4 py-2 rounded-lg text-[12px] transition-colors ${
                whiteMode 
                  ? 'bg-[#333] text-white hover:bg-[#222]' 
                  : 'bg-[#222] text-[#ccc] hover:bg-[#333]'
              }`}
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* ===== INPUT AREA ===== */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`} style={{ right: sidebarExpanded ? '280px' : '4px' }}>
        <div className={`px-24 pb-10 pt-6 ${
          whiteMode 
            ? 'bg-gradient-to-t from-[#fafafa] via-[#fafafa]/98 to-transparent' 
            : 'bg-gradient-to-t from-black via-black/98 to-transparent'
        }`}>
          <div className="max-w-2xl mx-auto">
            
            {/* Character/Persona Selection */}
            <div className="flex justify-center gap-8 mb-6">
              {personas.map((persona) => (
                <button
                  key={persona}
                  onClick={() => setSelectedCharacter(persona)}
                  className={`text-[11px] tracking-[0.12em] transition-all duration-300 ${
                    selectedCharacter === persona 
                      ? (whiteMode ? 'text-[#333]' : 'text-white')
                      : (whiteMode ? 'text-[#bbb] hover:text-[#666]' : 'text-[#3a3a3a] hover:text-[#666]')
                  }`}
                >
                  {persona}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Skriv ditt meddelande..."
                className={`w-full bg-transparent border-b py-4 text-[16px] placeholder-opacity-50 focus:outline-none transition-colors font-light tracking-wide ${
                  whiteMode 
                    ? 'border-[#ddd] focus:border-[#aaa] text-[#333] placeholder-[#ccc]' 
                    : 'border-[#1a1a1a] focus:border-[#333] text-white placeholder-[#333]'
                }`}
              />
              
              {/* Send Button - Fade in when typing */}
              <button 
                className={`absolute right-0 bottom-4 transition-all duration-400 ${
                  messageInput 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  whiteMode 
                    ? 'border-[#ccc] hover:border-[#888] hover:bg-black/5' 
                    : 'border-[#333] hover:border-[#555] hover:bg-white/5'
                }`}>
                  <span className={`text-[10px] ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className={`fixed bottom-4 left-6 text-[9px] transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'} ${
        whiteMode ? 'text-[#ccc]' : 'text-[#2a2a2a]'
      }`}>
        Q = Quantum · F = Focus · W = White
      </div>
    </div>
  );
}
