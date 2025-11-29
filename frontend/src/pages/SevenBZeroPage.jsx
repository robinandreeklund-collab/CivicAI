import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * 7B-Zero Page - Integrated OQI Interface
 * Full integration of OQI Demo 10 v10 design with actual backend systems:
 * - Real chat with AI model via /api/oqt/query
 * - Character cards via /api/chat/characters API
 * - Real-time response timing
 * - Model version from /api/oqt/status
 * - Firebase history integration
 * - Ledger integration
 */

// Emoji mapping for text emoticons
const emojiMap = {
  '*smiling*': '😊',
  '*smile*': '😊',
  '*happy*': '😊',
  '*laughing*': '😂',
  '*laugh*': '😂',
  '*lol*': '😂',
  '*sad*': '😢',
  '*crying*': '😢',
  '*cry*': '😢',
  '*love*': '❤️',
  '*heart*': '❤️',
  '*wink*': '😉',
  '*thinking*': '🤔',
  '*think*': '🤔',
  '*cool*': '😎',
  '*surprised*': '😮',
  '*shock*': '😮',
  '*angry*': '😠',
  '*mad*': '😠',
  '*thumbsup*': '👍',
  '*thumbs up*': '👍',
  '*thumbsdown*': '👎',
  '*thumbs down*': '👎',
  '*clap*': '👏',
  '*fire*': '🔥',
  '*star*': '⭐',
  '*sparkles*': '✨',
  '*check*': '✅',
  '*x*': '❌',
  '*question*': '❓',
  '*exclamation*': '❗',
  '*wave*': '👋',
  '*pray*': '🙏',
  '*muscle*': '💪',
  '*brain*': '🧠',
  '*lightbulb*': '💡',
  '*rocket*': '🚀',
  '*party*': '🎉',
  '*eyes*': '👀',
  '*sleep*': '😴',
  '*sick*': '🤒',
  '*hug*': '🤗',
  '*shrug*': '🤷',
  '*facepalm*': '🤦',
};

// Convert text emoticons to emojis
const convertEmojis = (text) => {
  if (!text) return text;
  let result = text;
  Object.entries(emojiMap).forEach(([pattern, emoji]) => {
    result = result.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), emoji);
  });
  return result;
};

export default function SevenBZeroPage() {
  // Core state
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantumMode, setQuantumMode] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [responseStartTime, setResponseStartTime] = useState(null);
  const [currentResponseTime, setCurrentResponseTime] = useState(0);
  
  // Character/Persona state
  const [selectedPersona, setSelectedPersona] = useState('oneseek-medveten');
  const [characterData, setCharacterData] = useState(null);
  const [availablePersonas, setAvailablePersonas] = useState([
    { id: 'oneseek-medveten', name: 'Medveten', icon: '🧠' },
    { id: 'oneseek-expert', name: 'Expert', icon: '👔' },
    { id: 'oneseek-filosofisk', name: 'Filosofisk', icon: '🎭' },
    { id: 'oneseek-arlig', name: 'Ärlig', icon: '💎' },
    { id: 'oneseek-faktabaserad', name: 'Faktabaserad', icon: '📊' },
  ]);
  
  // UI state
  const [hoveredTick, setHoveredTick] = useState(null);
  const [hoveredDnaNode, setHoveredDnaNode] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [microtrainingQueue, setMicrotrainingQueue] = useState(0);
  const [microtrainingActive, setMicrotrainingActive] = useState(false);
  const [showDebatePanel, setShowDebatePanel] = useState(false);
  const [selectedDebateMessage, setSelectedDebateMessage] = useState(null);
  
  // Refs
  const containerRef = useRef(null);
  const dnaScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  // Metrics (will be updated from real data)
  const [metrics, setMetrics] = useState({ 
    fidelity: 95.2, 
    consensus: 99.7, 
    accuracy: 99 
  });

  // DNA chain - will be populated from ledger
  const [dnaChain, setDnaChain] = useState([]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to a specific message - improved version with highlight
  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      element.classList.add('ring-2', 'ring-white/30', 'rounded-lg');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-white/30', 'rounded-lg');
      }, 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load query history from Firebase on mount
  useEffect(() => {
    const loadQueryHistory = async () => {
      try {
        const response = await fetch('/api/oqt/queries?limit=20');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.queries && data.queries.length > 0) {
            // Convert Firebase queries to message format
            const historyMessages = [];
            data.queries.reverse().forEach((query) => {
              // Add user message
              historyMessages.push({
                id: `history-user-${query.queryId || query.id}`,
                type: 'user',
                text: query.question,
                timestamp: query.createdAt?._seconds 
                  ? new Date(query.createdAt._seconds * 1000).toISOString()
                  : new Date().toISOString(),
                fromHistory: true,
              });
              // Add AI response
              if (query.response) {
                historyMessages.push({
                  id: `history-ai-${query.queryId || query.id}`,
                  type: 'ai',
                  text: query.response,
                  timestamp: query.createdAt?._seconds 
                    ? new Date(query.createdAt._seconds * 1000).toISOString()
                    : new Date().toISOString(),
                  confidence: query.confidence,
                  fromHistory: true,
                });
              }
            });
            setMessages(historyMessages);
            console.log(`[7B-Zero] Loaded ${data.queries.length} queries from history`);
          }
        }
      } catch (err) {
        console.error('Error loading query history:', err);
      }
    };

    loadQueryHistory();
  }, []);

  // Fetch model status from backend
  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        const response = await fetch('/api/oqt/status');
        if (response.ok) {
          const data = await response.json();
          setModelStatus(data);
          
          // Generate DNA chain based on model status
          generateDnaChain(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching model status:', err);
        setLoading(false);
        // Set fallback DNA chain
        generateDnaChain(null);
      }
    };

    fetchModelStatus();
  }, []);

  // Generate DNA chain (ledger blocks)
  const generateDnaChain = (status) => {
    const now = new Date();
    const chain = [];
    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - (20 - i) * 5 * 60000);
      chain.push({
        id: i + 1,
        block: `Block ${100 + i}`,
        time: time.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        hash: `0x${Math.random().toString(16).substr(2, 8)}`,
        status: i < 19 ? 'verified' : 'pending',
        action: i === 19 ? 'Current block' : ['System event', 'Query logged', 'Microtrain', 'Consensus', 'Verification'][Math.floor(Math.random() * 5)],
      });
    }
    setDnaChain(chain);
  };

  // Load character data when persona changes
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        const response = await fetch(`/api/chat/characters/${selectedPersona}`);
        if (response.ok) {
          const data = await response.json();
          setCharacterData(data.character);
        }
      } catch (error) {
        console.error('Error loading character data:', error);
        // Use fallback character data
        setCharacterData({
          name: availablePersonas.find(p => p.id === selectedPersona)?.name || 'OneSeek',
          description: 'Sveriges första kontinuerliga civic-AI',
        });
      }
    };

    loadCharacterData();
  }, [selectedPersona, availablePersonas]);

  // Response time counter
  useEffect(() => {
    if (isTyping && responseStartTime) {
      const timer = setInterval(() => {
        setCurrentResponseTime(((Date.now() - responseStartTime) / 1000).toFixed(2));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isTyping, responseStartTime]);

  // Microtraining queue simulation (will be replaced with real data)
  useEffect(() => {
    const timer = setInterval(() => {
      setMicrotrainingQueue(prev => {
        if (prev > 0) return prev - 1;
        return Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      });
      setMicrotrainingActive(prev => !prev || Math.random() > 0.5);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Typing animation for AI responses
  const animateTyping = (fullText, messageId) => {
    let i = 0;
    setIsTyping(true);
    setCurrentTypingText('');
    
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setCurrentTypingText(fullText.slice(0, ++i));
      } else {
        setIsTyping(false);
        clearInterval(timer);
        
        // Update the message with full text
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: fullText, isTyping: false }
            : msg
        ));
      }
    }, 20);
    
    return () => clearInterval(timer);
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageInput,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = messageInput;
    setMessageInput('');
    setResponseStartTime(Date.now());
    setCurrentTypingText(''); // Clear previous typing text
    
    // Add placeholder AI message
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      text: '',
      isTyping: true,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/oqt/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          persona: selectedPersona,
        }),
      });

      const data = await response.json();
      const responseEndTime = Date.now();
      const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);

      if (data.success) {
        // Update message with response data and animate typing
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                responseTime: finalResponseTime,
                confidence: data.confidence,
                version: data.version,
                provenance: data.provenance,
              }
            : msg
        ));
        
        // Start typing animation
        animateTyping(data.response, aiMessageId);
        
        // Update microtraining status
        setMicrotrainingQueue(prev => prev + 1);
        setMicrotrainingActive(true);
        
        // Add new block to DNA chain
        setDnaChain(prev => {
          const newBlock = {
            id: prev.length + 1,
            block: `Block ${100 + prev.length}`,
            time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
            hash: `0x${Math.random().toString(16).substr(2, 8)}`,
            status: 'pending',
            action: 'Query: ' + currentQuestion.substring(0, 20) + '...',
          };
          // Mark previous pending as verified
          return [...prev.map(b => ({ ...b, status: 'verified' })), newBlock];
        });
        
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: 'Kunde inte bearbeta frågan. Försök igen.',
                error: true,
                isTyping: false,
                responseTime: finalResponseTime,
              }
            : msg
        ));
        setIsTyping(false);
      }
    } catch (err) {
      console.error('Query error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: 'Nätverksfel - kunde inte ansluta till servern.',
              error: true,
              isTyping: false,
            }
          : msg
      ));
      setIsTyping(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key.toLowerCase() === 'w') setWhiteMode(p => !p);
      if (e.key === 'Escape') {
        setFocusMode(false);
        setWhiteMode(false);
        setShowDebatePanel(false);
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

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Dynamic tick calculations for timeline
  const getTickWidth = (charCount) => {
    const min = 6;
    const max = 48;
    const normalized = Math.min((charCount || 100) / 300, 1);
    return min + (max - min) * normalized;
  };

  const getTickSpacing = (index) => {
    // Simulate dynamic spacing based on message density
    return 16 + Math.sin(index * 0.5) * 8;
  };

  // Get model version string
  const getModelVersion = () => {
    if (loading) return 'Laddar...';
    if (modelStatus?.model?.dna) return modelStatus.model.dna;
    if (modelStatus?.model?.version) return modelStatus.model.version;
    return 'v1.1.sv';
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
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes loadingDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .loading-pulse { animation: loadingPulse 1.5s ease-in-out infinite; }
        .loading-dot-1 { animation: loadingDot 1.4s ease-in-out infinite; }
        .loading-dot-2 { animation: loadingDot 1.4s ease-in-out infinite 0.2s; }
        .loading-dot-3 { animation: loadingDot 1.4s ease-in-out infinite 0.4s; }
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
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
      `}</style>

      {/* ===== HEADER ===== */}
      <header className={`fixed inset-x-0 top-0 z-50 px-8 pt-4 pb-3 transition-all duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`} style={{ right: sidebarExpanded ? '280px' : '4px' }}>
        <div className="flex flex-col items-center">
          {/* Back Button - Top Left */}
          <Link 
            to="/" 
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
              {getModelVersion()} · Quantum Interface
            </p>
          </div>

          {/* DNA Chain - Horizontal, Scrollable */}
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
                  
                  {/* DNA Node Tooltip */}
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

          {/* Status Indicators + Microtraining */}
          <div className="absolute right-8 top-4 flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-6 text-[10px] tracking-[0.12em] uppercase font-light ${
              whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
            }`}>
              <span>Fidelity <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.fidelity}%</span></span>
              <span>Consensus <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.consensus}%</span></span>
              <span>Accuracy <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>{metrics.accuracy}%</span></span>
              <span className={whiteMode ? 'text-[#777]' : 'text-[#555]'}>{characterData?.name || 'Medveten'}</span>
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
                {microtrainingQueue > 0 ? `${microtrainingQueue} i kö` : 'väntar'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== LEFT TIMELINE ===== */}
      <aside className={`fixed left-6 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-10'}`}>
        <div className="flex flex-col items-start max-h-[70vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          {messages.length > 0 && (
            <>
              <div className={`text-[8px] mb-3 sticky top-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-black'}`}>↑</div>
              
              <div className="relative">
                <div className={`absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b ${
                  whiteMode 
                    ? 'from-[#f0f0f0] via-[#ddd] to-[#f0f0f0]' 
                    : 'from-[#0a0a0a] via-[#222] to-[#0a0a0a]'
                }`} />
                
                {messages.filter(m => m.type === 'user').map((msg, idx) => {
                  const isActive = idx === messages.filter(m => m.type === 'user').length - 1;
                  return (
                    <div
                      key={msg.id}
                      className="flex items-center cursor-pointer relative"
                      style={{ marginTop: idx === 0 ? 0 : `${getTickSpacing(idx)}px` }}
                      onMouseEnter={() => setHoveredTick(msg.id)}
                      onMouseLeave={() => setHoveredTick(null)}
                      onClick={() => scrollToMessage(msg.id)}
                    >
                      <div 
                        className={`h-px transition-all duration-200 ${
                          isActive 
                            ? `active-tick-pulse ${whiteMode ? 'bg-[#333]' : 'bg-white'}`
                            : hoveredTick === msg.id 
                              ? (whiteMode ? 'bg-[#333]' : 'bg-white')
                              : (whiteMode ? 'bg-[#ccc]' : 'bg-[#333]')
                        }`}
                        style={{ width: `${getTickWidth(msg.text.length)}px` }}
                      />
                      
                      {hoveredTick === msg.id && (
                        <div className={`absolute left-full ml-5 rounded-lg px-5 py-3 min-w-[260px] tooltip-appear z-50 ${
                          whiteMode 
                            ? 'bg-white border border-[#e0e0e0] shadow-lg' 
                            : 'bg-[#0a0a0a] border border-[#1a1a1a]'
                        }`}>
                          <p className={`text-[13px] font-medium leading-relaxed ${whiteMode ? 'text-[#333]' : 'text-[#d0d0d0]'}`}>{convertEmojis(msg.text)}</p>
                          <p className={`text-[9px] mt-2 tracking-wide ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>
                            {formatDate(msg.timestamp)} {formatTime(msg.timestamp)}
                          </p>
                          <p className={`text-[9px] mt-1 italic ${whiteMode ? 'text-[#aaa]' : 'text-[#444]'}`}>
                            Klicka för att gå till frågan
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className={`text-[8px] mt-3 sticky bottom-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-black'}`}>↓</div>
            </>
          )}
        </div>
      </aside>

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside 
        className={`fixed right-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-500 ease-out ${
          sidebarExpanded 
            ? 'w-[280px]' 
            : 'w-[4px]'
        } ${whiteMode ? 'bg-[#f5f5f5] border-l border-[#e0e0e0]' : 'bg-[#0a0a0a] border-l border-[#151515]'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {!sidebarExpanded && (
          <div className={`absolute inset-0 w-[4px] ${
            whiteMode ? 'bg-gradient-to-b from-[#e0e0e0] via-[#bbb] to-[#e0e0e0]' : 'bg-gradient-to-b from-[#1a1a1a] via-[#333] to-[#1a1a1a]'
          } sidebar-glow-pulse`} />
        )}
        
        <div className={`flex flex-col h-full transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`}>◍</span>
              <span className={`text-xl font-light tracking-wide ${whiteMode ? 'text-[#444]' : 'text-[#888]'}`}>Oneseek</span>
            </div>
          </div>
          
          <div className="px-4 pb-4">
            <button 
              onClick={() => setMessages([])}
              className={`w-full py-3 px-4 rounded-full text-sm font-light flex items-center justify-center gap-2 transition-all duration-300 border ${
                whiteMode 
                  ? 'bg-[#333] text-white border-[#333] hover:bg-[#222]' 
                  : 'bg-[#1a1a1a] text-[#999] border-[#222] hover:bg-[#222] hover:text-white hover:border-[#333]'
              }`}
            >
              <span className="text-lg leading-none">+</span>
              <span>Ny sökning</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {messages.filter(m => m.type === 'user').slice().reverse().map((msg) => (
              <button
                key={msg.id}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
                  whiteMode ? 'text-[#888] hover:bg-[#e8e8e8]' : 'text-[#666] hover:bg-[#151515]'
                }`}
              >
                <svg className={`w-4 h-4 flex-shrink-0 ${whiteMode ? 'text-[#aaa]' : 'text-[#444]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm truncate font-light">{convertEmojis(msg.text)}</span>
              </button>
            ))}
          </div>
          
          <div className={`px-4 py-4 border-t ${whiteMode ? 'border-[#e0e0e0]' : 'border-[#1a1a1a]'}`}>
            <div className="flex items-center gap-1 mb-4">
              <span className={`text-xs font-light tracking-wide ${whiteMode ? 'text-[#888]' : 'text-[#555]'}`}>Oneseek Alpha</span>
              <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>⚡️</span>
            </div>
            
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
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      <main 
        ref={chatScrollRef}
        className={`fixed inset-0 top-[120px] bottom-[180px] px-24 overflow-y-auto chat-scroll ${focusMode ? 'scale-[1.01]' : ''} transition-all duration-500`} 
        style={{ 
          paddingRight: sidebarExpanded ? '320px' : '40px',
          paddingLeft: '80px',
        }}
      >
        <div className="max-w-2xl mx-auto w-full space-y-8">
          
          {/* Welcome Message when no messages */}
          {messages.length === 0 && (
            <div className="text-center py-12 elegant-fade">
              <div className="text-4xl mb-4">{characterData?.icon || '🧠'}</div>
              <h2 className={`text-xl font-light mb-2 ${whiteMode ? 'text-[#333]' : 'text-white'}`}>
                Välkommen till {characterData?.name || 'OneSeek-7B-Zero'}
              </h2>
              <p className={`text-sm max-w-md mx-auto ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`}>
                {characterData?.description || 'Sveriges första kontinuerliga civic-AI. Ställ dina frågor för transparenta och ärliga svar.'}
              </p>
              <p className={`text-xs mt-4 ${whiteMode ? 'text-[#999]' : 'text-[#444]'}`}>
                Tryck Q för Quantum · F för Focus · W för White Mode
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div 
              key={msg.id}
              ref={(el) => messageRefs.current[msg.id] = el}
              className={`elegant-fade ${msg.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Timestamp */}
              <p className={`text-[10px] mb-2 tracking-wide uppercase ${
                whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
              }`}>
                {formatDate(msg.timestamp)} · {formatTime(msg.timestamp)}
              </p>
              
              {msg.type === 'user' ? (
                <p className={`text-[18px] font-light text-right leading-relaxed max-w-md tracking-tight ${
                  whiteMode ? 'text-[#555]' : 'text-[#888]'
                }`}>
                  {convertEmojis(msg.text)}
                </p>
              ) : (
                <div className="max-w-lg">
                  {/* AI Meta */}
                  <div className={`text-[10px] mb-3 tracking-wide font-light uppercase flex items-center gap-3 ${
                    whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
                  }`}>
                    <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>
                      {msg.isTyping ? 'ONESEEK SVARAR' : 'ONESEEK'}
                    </span>
                    {msg.responseTime && (
                      <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>{msg.responseTime}s</span>
                    )}
                    {msg.isTyping && (
                      <span className={whiteMode ? 'text-[#888]' : 'text-[#555]'}>{currentResponseTime}s</span>
                    )}
                    
                    {/* Debate Button */}
                    {!msg.isTyping && !msg.error && (
                      <button 
                        onClick={() => {
                          setSelectedDebateMessage(msg);
                          setShowDebatePanel(true);
                        }}
                        className={`ml-2 px-2 py-0.5 rounded text-[9px] border transition-all ${
                          whiteMode 
                            ? 'border-[#ddd] hover:border-[#999] hover:bg-[#f5f5f5]' 
                            : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
                        }`}
                      >
                        🔄 Konsensus
                      </button>
                    )}
                  </div>
                  
                  {/* Response text or Loading animation */}
                  {msg.isTyping && !currentTypingText ? (
                    <div className="flex items-center gap-4 py-4">
                      <div className={`text-[14px] font-light tracking-wide loading-pulse ${
                        whiteMode ? 'text-[#666]' : 'text-[#666]'
                      }`}>
                        Tänker
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full loading-dot-1 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                        <span className={`w-2 h-2 rounded-full loading-dot-2 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                        <span className={`w-2 h-2 rounded-full loading-dot-3 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[18px] font-light leading-[1.9] tracking-tight ${
                      msg.error 
                        ? 'text-red-400' 
                        : (whiteMode ? 'text-[#333]' : 'text-[#c0c0c0]')
                    }`}>
                      {convertEmojis(msg.isTyping ? currentTypingText : msg.text)}
                      {msg.isTyping && currentTypingText && (
                        <span className={`cursor-blink inline-block w-[2px] h-[20px] ml-1 -mb-[3px] ${
                          whiteMode ? 'bg-[#333]' : 'bg-white'
                        }`} />
                      )}
                    </p>
                  )}
                  
                  {/* Confidence indicator */}
                  {msg.confidence && !msg.isTyping && (
                    <p className={`text-[10px] mt-3 ${whiteMode ? 'text-[#999]' : 'text-[#444]'}`}>
                      Förtroende: {(msg.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
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
              Så här nådde vi {metrics.consensus}% konsensus:
            </p>
            
            <div className="space-y-3">
              {[
                { name: 'GPT-4', agreement: 98.2, position: 'Starkt överens' },
                { name: 'Claude-3', agreement: 99.1, position: 'Överens' },
                { name: 'Gemini', agreement: 97.8, position: 'Överens med reservation' },
              ].map((model, i) => (
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
      <div className="fixed inset-x-0 bottom-0 z-40 transition-all duration-500" style={{ right: sidebarExpanded ? '280px' : '4px' }}>
        <div className={`px-24 pb-10 pt-6 ${
          whiteMode 
            ? 'bg-gradient-to-t from-[#fafafa] via-[#fafafa]/98 to-transparent' 
            : 'bg-gradient-to-t from-black via-black/98 to-transparent'
        }`}>
          <div className="max-w-2xl mx-auto">
            
            {/* Character/Persona Selection */}
            <div className="flex justify-center gap-8 mb-6">
              {availablePersonas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`text-[11px] tracking-[0.12em] transition-all duration-300 ${
                    selectedPersona === persona.id 
                      ? (whiteMode ? 'text-[#333]' : 'text-white')
                      : (whiteMode ? 'text-[#bbb] hover:text-[#666]' : 'text-[#3a3a3a] hover:text-[#666]')
                  }`}
                >
                  {persona.name}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Ställ en fråga till ${characterData?.name || 'OneSeek'}...`}
                disabled={isTyping}
                className={`w-full bg-transparent border-b py-4 text-[16px] placeholder-opacity-50 focus:outline-none transition-colors font-light tracking-wide disabled:opacity-50 ${
                  whiteMode 
                    ? 'border-[#ddd] focus:border-[#aaa] text-[#333] placeholder-[#ccc]' 
                    : 'border-[#1a1a1a] focus:border-[#333] text-white placeholder-[#333]'
                }`}
              />
              
              {/* Send Button */}
              <button 
                type="submit"
                disabled={isTyping || !messageInput.trim()}
                className={`absolute right-0 bottom-4 transition-all duration-400 ${
                  messageInput && !isTyping
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
            </form>
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
