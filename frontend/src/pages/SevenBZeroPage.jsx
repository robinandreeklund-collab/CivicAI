import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '../utils/formatMarkdown';
import ThinkingChain from '../components/ThinkingChain';
import FollowUpButtons from '../components/FollowUpButtons';
import { sendPersonalityMessageViaWebSocket, isWebSocketSupported } from '../services/personalityWebSocket';
import { handleFollowUpAction } from '../services/chat';
import DebateRoundDisplay from '../components/DebateRoundDisplay';
import Tankekedja from "../components/Tankekedja";
import MTA16Analysis from "../components/MTA16Analysis";

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

// Available personas (constant - doesn't change)
const AVAILABLE_PERSONAS = [
  { id: 'oneseek-medveten', name: 'Medveten', icon: '🧠' },
  { id: 'oneseek-bibliotekarie', name: 'Bibliotekarien', icon: '📚' },
  { id: 'oneseek-metrolog', name: 'Metrologen', icon: '🌤️' },
];

// External AI models used in compare mode
const EXTERNAL_AI_MODELS = ['GPT', 'Gemini', 'DeepSeek', 'Grok'];

// Message ID counter for unique IDs
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

// Emoji mapping for text emoticons
const emojiMap = {
  '*smiling*': '😊',
  '*smile*': '😊',
  '*happy*': '😊',
  '*laughing*': '😂',
  '*laugh*': '😂',
  '*lol*': '😂',
  '*chuckles*': '😄',
  '*chuckle*': '😄',
  '*giggles*': '🤭',
  '*giggle*': '🤭',
  '*winks*': '😉',
  '*wink*': '😉',
  '*sad*': '😢',
  '*crying*': '😢',
  '*cry*': '😢',
  '*love*': '❤️',
  '*heart*': '❤️',
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
  '*grin*': '😁',
  '*smirk*': '😏',
  '*blush*': '😊',
  '*nervous*': '😅',
  '*sweat*': '😅',
  '*relieved*': '😌',
  '*confused*': '😕',
  '*worried*': '😟',
  '*scared*': '😨',
  '*scream*': '😱',
  '*dizzy*': '😵',
  '*mindblown*': '🤯',
  '*nerd*': '🤓',
  '*clown*': '🤡',
  '*devil*': '😈',
  '*angel*': '😇',
  '*kiss*': '😘',
  '*tongue*': '😛',
  '*crazy*': '🤪',
  '*money*': '🤑',
  '*silence*': '🤫',
  '*whisper*': '🤫',
  '*secret*': '🤫',
  '*yawn*': '🥱',
  '*hot*': '🥵',
  '*cold*': '🥶',
  '*puke*': '🤮',
  '*mask*': '😷',
  '*robot*': '🤖',
  '*alien*': '👽',
  '*ghost*': '👻',
  '*skull*': '💀',
  '*poop*': '💩',
  '*100*': '💯',
  '*ok*': '👌',
  '*victory*': '✌️',
  '*peace*': '✌️',
  '*cross*': '🤞',
  '*fingers crossed*': '🤞',
  '*punch*': '👊',
  '*fist*': '✊',
  '*left*': '👈',
  '*right*': '👉',
  '*up*': '👆',
  '*down*': '👇',
};

// Pre-compile regex patterns for emoji conversion
const emojiPatterns = Object.entries(emojiMap).map(([pattern, emoji]) => ({
  regex: new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
  emoji
}));

// Convert text emoticons to emojis using pre-compiled regexes
const convertEmojis = (text) => {
  if (!text) return text;
  let result = text;
  emojiPatterns.forEach(({ regex, emoji }) => {
    result = result.replace(regex, emoji);
  });
  return result;
};

/**
 * Debate Completion Section Component
 * Displays voting results (collapsible), winner, and summary when debate is completed
 */
function DebateCompletionSection({ completion }) {
  const [votingExpanded, setVotingExpanded] = useState(false);

  // Parse structured closing statement if it contains section headers
  const parseClosingStatement = (summary) => {
    if (!summary) return null;
    
    // Check if it has structured format with **headers**
    const hasStructure = summary.includes('**Tack till alla deltagare**') || 
                        summary.includes('**Debattens utveckling**') ||
                        summary.includes('**Varför');
    
    if (!hasStructure) {
      // Return plain text if no structure
      return { isStructured: false, text: summary };
    }
    
    // Parse structured sections - split by headers
    const sections = {};
    
    // Split by section headers while keeping the headers
    const parts = summary.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    
    let currentHeader = null;
    let currentContent = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      // Check if this is a header
      if (part.startsWith('**') && part.endsWith('**')) {
        // Save previous section if exists
        if (currentHeader && currentContent.length > 0) {
          sections[currentHeader] = currentContent.join(' ').trim();
          currentContent = [];
        }
        // Start new section
        currentHeader = part.replace(/\*\*/g, '').trim();
      } else if (currentHeader && part) {
        // Add content to current section
        currentContent.push(part);
      }
    }
    
    // Save last section
    if (currentHeader && currentContent.length > 0) {
      sections[currentHeader] = currentContent.join(' ').trim();
    }
    
    return { isStructured: true, sections };
  };

  const closingData = parseClosingStatement(completion.summary);

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4 mb-3">
      <div className="text-sm font-medium text-[#888] mb-3">✅ Debatt avslutad</div>
      
      {/* Voting Results - Collapsible */}
      <div className="mb-3 pb-3 border-b border-[#1a1a1a]">
        <button 
          onClick={() => setVotingExpanded(!votingExpanded)}
          className="flex items-center justify-between w-full text-xs text-[#666] hover:text-[#888] transition-colors mb-2"
        >
          <span>🗳️ Röstning avslutad</span>
          <span className="text-[#444]">{votingExpanded ? '▼' : '▶'}</span>
        </button>
        {votingExpanded && (
          <div className="space-y-3 mt-2">
            {completion.voteResults?.map((vote, idx) => (
              <div key={idx} className="text-xs">
                <div className="text-[#888] font-medium mb-1">
                  {vote.voter.toUpperCase()} → {vote.voted_for.toUpperCase()}
                </div>
                {vote.motivation && (
                  <div className="text-[#666] mt-1 italic">
                    "{vote.motivation}"
                  </div>
                )}
                {vote.huvudpunkter && vote.huvudpunkter.length > 0 && (
                  <div className="mt-2 pl-2 border-l-2 border-[#333]">
                    <div className="text-[#555] text-[10px] mb-1">Huvudpunkter:</div>
                    <ol className="list-decimal list-inside space-y-1">
                      {vote.huvudpunkter.map((punkt, pidx) => (
                        <li key={pidx} className="text-[#777] text-[11px]">
                          {punkt}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Winner */}
      <div className="mb-3 pb-3 border-b border-[#1a1a1a]">
        <div className="text-xs text-[#666] mb-1">🏆 Vinnare</div>
        <div className="text-sm text-[#aaa]">
          {completion.winner?.toUpperCase()}
          <span className="text-xs text-[#666] ml-2">
            ({completion.winnerVotes}/{completion.totalVotes} röster)
          </span>
        </div>
      </div>
      
      {/* Summary - Structured or Plain */}
      <div>
        <div className="text-xs text-[#666] mb-2">📋 Sammanfattning</div>
        {closingData?.isStructured ? (
          <div className="space-y-3">
            {Object.entries(closingData.sections).map(([header, content], idx) => (
              <div key={idx}>
                <div className="text-[#aaa] text-xs font-medium mb-1">{header}</div>
                <div className="text-[#888] text-xs leading-relaxed pl-2">
                  {content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[#888] leading-relaxed">
            {closingData?.text || completion.summary}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SevenBZeroPage() {
  // Core state
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantumMode, setQuantumMode] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  
  // Compare Mode state - new Zero compare flow
  const [compareMode, setCompareMode] = useState(false);
  const [chunkedMode, setChunkedMode] = useState(false); // Analyze responses one by one
  const [externalResponses, setExternalResponses] = useState([]);
  const [showExternalResponses, setShowExternalResponses] = useState(false);
  const [showMTA16Analysis, setShowMTA16Analysis] = useState(true); // Show MTA-16 analysis by default in compare mode
  const [compareThinkingEvents, setCompareThinkingEvents] = useState([]); // Thinking chain events for compare mode
  
  // Debate Mode state - live AI debate
  const [debateMode, setDebateMode] = useState(false);
  const [debateData, setDebateData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState(new Set([1])); // Track which rounds are expanded
  const [debateRounds, setDebateRounds] = useState({}); // Structured data: { 1: { gpt: {text, isStreaming, reasoning, insights}, ... }, 2: {...} }
  const [currentRound, setCurrentRound] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [responseStartTime, setResponseStartTime] = useState(null);
  const [currentResponseTime, setCurrentResponseTime] = useState(0);
  
  // Conversation history for multi-turn support
  // Format: [{"role": "user"|"assistant", "content": "..."}]
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Streaming state - SSE token-by-token streaming from backend
  // This replaces the fake typing animation with real-time tokens
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortRef = useRef(null);
  const wsRef = useRef(null); // WebSocket reference for debate
  
  // ONESEEK Δ+ Typo suggestion state
  const [typoSuggestion, setTypoSuggestion] = useState(null);
  const typoCheckTimeoutRef = useRef(null);
  const [typoCheckEnabled, setTypoCheckEnabled] = useState(true); // Toggle for typo checking (loaded from admin settings)
  
  // Character/Persona state
  const [selectedPersona, setSelectedPersona] = useState('oneseek-medveten');
  const [characterData, setCharacterData] = useState(null);
  
  // ONESEEK Δ+ v6.2: AI-selected personality (real-time display)
  const [aiSelectedPersonality, setAiSelectedPersonality] = useState(null);
  
  // Thinking chain state for personality routing
  const [thinkingChain, setThinkingChain] = useState(null);
  
  // Progressive thinking step display
  const [thinkingStep, setThinkingStep] = useState(null);
  
  // Tankekedja Sidebar state - Real-time transparency tracking
  const [tankekedjaEvents, setTankekedjaEvents] = useState([]);
  const [showTankekedja, setShowTankekedja] = useState(false);
  
  // Load typo check setting from admin
  useEffect(() => {
    const loadTypoCheckSetting = async () => {
      try {
        const response = await fetch('/api/settings/typo-check');
        if (response.ok) {
          const data = await response.json();
          setTypoCheckEnabled(data.enabled !== false); // Default to true if not set
        }
      } catch (err) {
        console.log('Using default typo check setting');
      }
    };
    loadTypoCheckSetting();
  }, []);
  
  // ONESEEK Δ+ v6.5 (PR#101): Use unified personality state endpoint for polling
  // This is the single source of truth for both header and /7B-Zero selector
  const [personalitySource, setPersonalitySource] = useState('ai'); // "admin" | "ai" | "override"
  const [overridePending, setOverridePending] = useState({ active: false, personality_id: null });
  // Track if we have a local pending override (to avoid server state overwriting it before it's processed)
  const [localOverridePending, setLocalOverridePending] = useState(false);
  
  useEffect(() => {
    const loadUnifiedPersonalityState = async () => {
      try {
        // Use the new unified state endpoint (PR#101)
        const response = await fetch('/api/personality/state');
        if (response.ok) {
          const data = await response.json();
          const personalityId = data.active_personality_id || 'oneseek-medveten';
          
          // Always update from server state, UNLESS we have a local override pending
          // that hasn't been sent to server yet (localOverridePending)
          // Once server confirms the override (data.source === 'override'), we sync
          if (!localOverridePending) {
            setSelectedPersona(personalityId);
            setAiSelectedPersonality({
              id: personalityId,
              description: data.description || '',
              categories: data.categories || [],
              is_default: data.is_default || personalityId === 'oneseek-medveten'
            });
            setPersonalitySource(data.source || 'ai');
            
            // Update override status from server
            if (data.override_pending) {
              setOverridePending(data.override_pending);
            } else {
              setOverridePending({ active: false, personality_id: null });
            }
          } else if (data.source === 'override') {
            // Server confirmed our override, clear local pending flag
            setLocalOverridePending(false);
            setSelectedPersona(personalityId);
            setAiSelectedPersonality({
              id: personalityId,
              description: data.description || '',
              categories: data.categories || [],
              is_default: data.is_default || personalityId === 'oneseek-medveten'
            });
            setPersonalitySource('override');
          }
        }
      } catch (err) {
        // Fallback to legacy endpoint if new one not available
        try {
          const response = await fetch('/api/personality/active/current');
          if (response.ok) {
            const data = await response.json();
            const personalityId = data.personality_id || data.id || 'oneseek-medveten';
            setSelectedPersona(personalityId);
            setAiSelectedPersonality({
              id: personalityId,
              description: data.description || '',
              categories: data.categories || [],
              is_default: data.is_default || personalityId === 'oneseek-medveten'
            });
          }
        } catch {
          console.log('Using default personality');
        }
      }
    };
    
    // Load immediately
    loadUnifiedPersonalityState();
    
    // Poll every 2 seconds to stay in sync (PR#101: unified state)
    const pollInterval = setInterval(loadUnifiedPersonalityState, 2000);
    
    return () => clearInterval(pollInterval);
  }, [localOverridePending]);
  
  // UI state
  const [hoveredTick, setHoveredTick] = useState(null);
  const [hoveredDnaNode, setHoveredDnaNode] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [microtrainingQueue, setMicrotrainingQueue] = useState(0);
  const [microtrainingActive, setMicrotrainingActive] = useState(false);
  const [showDebatePanel, setShowDebatePanel] = useState(false);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  
  // Refs
  const containerRef = useRef(null);
  const dnaScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  // === ONESEEK Δ+ TYPO CHECKING ===
  // Common Swedish typos (frontend-side for instant suggestions)
  const COMMON_TYPOS = {
    'invåndare': 'invånare',
    'innvånare': 'invånare',
    'invonare': 'invånare',
    'invnare': 'invånare',
    'beflkning': 'befolkning',
    'befolking': 'befolkning',
    'väddret': 'vädret',
    'stockhlom': 'stockholm',
    'stokholm': 'stockholm',
    'götborg': 'göteborg',
    'malmø': 'malmö',
    'uppsal': 'uppsala',
    'nhyeter': 'nyheter',
    'temprratur': 'temperatur',
    'igar': 'igår',
    'imorrn': 'imorgon',
    'imorron': 'imorgon',
  };

  // Friendly AI responses for typo suggestions
  const TYPO_RESPONSES = [
    (original, suggestion) => `Menade du "${suggestion}"? 😊`,
    (original, suggestion) => `Tänkte du på "${suggestion}"?`,
    (original, suggestion) => `Jag gissar att du menade "${suggestion}" – stämmer det?`,
    (original, suggestion) => `Kanske "${suggestion}"? 🤔`,
    (original, suggestion) => `Är det "${suggestion}" du söker?`,
  ];

  // Check for typos in text and return suggestion if found
  const checkForTypos = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      if (COMMON_TYPOS[cleanWord]) {
        const original = cleanWord;
        const suggestion = COMMON_TYPOS[cleanWord];
        const responseIndex = original.length % TYPO_RESPONSES.length;
        return {
          original,
          suggestion,
          message: TYPO_RESPONSES[responseIndex](original, suggestion),
          correctedText: text.replace(new RegExp(original, 'gi'), suggestion),
        };
      }
    }
    return null;
  };

  // Handle input change with typo checking
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessageInput(newValue);
    
    // Skip typo check if disabled
    if (!typoCheckEnabled) {
      setTypoSuggestion(null);
      return;
    }
    
    // Clear previous timeout
    if (typoCheckTimeoutRef.current) {
      clearTimeout(typoCheckTimeoutRef.current);
    }
    
    // Debounce typo check (500ms after user stops typing)
    typoCheckTimeoutRef.current = setTimeout(() => {
      const suggestion = checkForTypos(newValue);
      setTypoSuggestion(suggestion);
    }, 500);
  };

  // Accept typo suggestion (inline)
  const acceptTypoSuggestion = () => {
    if (typoSuggestion) {
      setMessageInput(typoSuggestion.correctedText);
      setTypoSuggestion(null);
    }
  };

  // Dismiss typo suggestion (inline)
  const dismissTypoSuggestion = () => {
    setTypoSuggestion(null);
  };

  // === ONESEEK Δ+ TYPO CORRECTION BUTTON HANDLERS ===
  // Accept typo correction from AI response - send corrected question directly
  const acceptTypoCorrection = async (messageId, correctedText) => {
    // Find the AI typo message to get the original user message info
    const typoMsg = messages.find(m => m.id === messageId);
    const originalUserText = typoMsg?.typoCorrection?.original || '';
    
    // Remove BOTH the typo AI message AND the original user message
    // Replace original user message with corrected version
    setMessages(prev => {
      // Filter out the AI typo message
      const filtered = prev.filter(msg => msg.id !== messageId);
      // Update the original user message text to the corrected text
      return filtered.map(msg => {
        if (msg.type === 'user' && msg.text === originalUserText) {
          return { ...msg, text: correctedText };
        }
        return msg;
      });
    });
    
    // Add placeholder AI message for the response
    const aiMessageId = generateMessageId();
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      text: '',
      isTyping: true,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(true);
    setResponseStartTime(Date.now());
    
    try {
      // Send with skip_typo_check=true to avoid re-checking
      const response = await fetch('/api/inference/oneseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: correctedText,
          max_length: 512,
          temperature: 0.7,
          top_p: 0.9,
          skip_typo_check: true,  // IMPORTANT: Skip typo check for corrected text
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const responseEndTime = Date.now();
      const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
      const responseText = data.response || data.text;
      
      if (responseText) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                responseTime: finalResponseTime,
                confidence: data.confidence || data.delta_plus?.confidence_score || data.delta_plus?.intent_confidence || 0.85,
                version: data.version || 'OneSeek-Δ+',
                deltaPlus: data.delta_plus || null,
              }
            : msg
        ));
        animateTyping(responseText, aiMessageId);
      } else {
        throw new Error('No response text');
      }
    } catch (err) {
      console.error('Query error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Ett fel uppstod.', error: true, isTyping: false } : msg
      ));
      setIsTyping(false);
    }
  };

  // Reject typo correction - send original question as-is
  const sendOriginalQuestion = async (messageId, originalText) => {
    // Remove the typo message
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Send the original question by calling the API directly (skipping typo check)
    const userMessage = {
      id: generateMessageId(),
      type: 'user',
      text: originalText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setResponseStartTime(Date.now());
    
    // Add placeholder AI message
    const aiMessageId = generateMessageId();
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
      // Send with skip_typo_check=true to send original without re-checking
      const response = await fetch('/api/inference/oneseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          max_length: 512,
          temperature: 0.7,
          top_p: 0.9,
          skip_typo_check: true,  // IMPORTANT: Skip typo check - user chose original
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const responseEndTime = Date.now();
      const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
      const responseText = data.response || data.text;
      
      if (responseText) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                responseTime: finalResponseTime,
                confidence: data.confidence || data.delta_plus?.confidence_score || data.delta_plus?.intent_confidence || 0.85,
                version: data.version || 'OneSeek-Δ+',
                deltaPlus: data.delta_plus || null,
              }
            : msg
        ));
        animateTyping(responseText, aiMessageId);
      } else {
        throw new Error('No response text');
      }
    } catch (err) {
      console.error('Query error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Ett fel uppstod.', error: true, isTyping: false } : msg
      ));
      setIsTyping(false);
    }
  };

  // Metrics (static for now)
  const metrics = { 
    fidelity: 95.2, 
    consensus: 99.7, 
    accuracy: 99 
  };

  // DNA chain - will be populated from ledger
  const [dnaChain, setDnaChain] = useState([]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to a specific message - using React state for highlight
  const scrollToMessage = (messageId) => {
    // Small delay to ensure refs are set
    setTimeout(() => {
      const element = messageRefs.current[messageId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Use React state for highlight effect
        setHighlightedMessage(messageId);
        setTimeout(() => setHighlightedMessage(null), 2000);
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll while AI is typing (for long responses)
  useEffect(() => {
    if (currentTypingText && isTyping) {
      scrollToBottom();
    }
  }, [currentTypingText, isTyping]);

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

  // Fetch model status from backend - check BOTH Python ML service AND Node.js OQT
  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        // First, check Python ML service for current active model
        // This is the authoritative source after model switching
        let mlServiceModel = null;
        try {
          const mlResponse = await fetch('/api/models/current-active');
          if (mlResponse.ok) {
            mlServiceModel = await mlResponse.json();
            console.log('[7B-Zero] ML Service active model:', mlServiceModel);
          }
        } catch (mlErr) {
          console.log('[7B-Zero] ML Service not available, using OQT status');
        }
        
        // Then get OQT status for DNA chain and other metadata
        const response = await fetch('/api/oqt/status');
        if (response.ok) {
          const data = await response.json();
          
          // If ML service has a different model active, use that
          if (mlServiceModel && mlServiceModel.model_name) {
            data.activeModel = mlServiceModel;
            // Update the model version display
            if (data.model) {
              data.model.dna = mlServiceModel.model_name;
              data.model.version = mlServiceModel.model_name;
              data.model.is_dynamic = mlServiceModel.is_dynamic;
            }
          }
          
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
  const generateDnaChain = (_status) => {
    const now = new Date();
    const chain = [];
    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - (20 - i) * 5 * 60000);
      chain.push({
        id: i + 1,
        block: `Block ${100 + i}`,
        time: time.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        hash: `0x${Math.random().toString(16).slice(2, 10)}`,
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
          name: AVAILABLE_PERSONAS.find(p => p.id === selectedPersona)?.name || 'OneSeek',
          description: 'Sveriges första kontinuerliga civic-AI',
        });
      }
    };

    loadCharacterData();
  }, [selectedPersona]);

  // ONESEEK Δ+ v6.5 (PR#101): Handle persona selection for manual override
  // The "Override Next Question" mode sets a one-shot override for the next question only
  const [overrideMode, setOverrideMode] = useState(false); // false = permanent, true = next question only
  
  const handlePersonaSelect = async (personaId, forNextQuestionOnly = false) => {
    // Update local state immediately for responsive UI
    setSelectedPersona(personaId);
    setAiSelectedPersonality({
      id: personaId,
      description: '',
      categories: [],
      is_default: personaId === 'oneseek-medveten'
    });
    
    console.log('[PR#101] handlePersonaSelect called:', { personaId, forNextQuestionOnly });
    
    try {
      if (forNextQuestionOnly) {
        // PR#101: Set one-shot override for next question
        // Set local pending flag to prevent polling from overwriting our selection
        setLocalOverridePending(true);
        setOverridePending({ active: true, personality_id: personaId });
        setPersonalitySource('override');
        
        console.log('[PR#101] Setting one-shot override via POST /api/personality/override/next');
        
        const response = await fetch('/api/personality/override/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personality_id: personaId })
        });
        
        console.log('[PR#101] Override response:', response.status, response.statusText);
        // Server will confirm, then localOverridePending is cleared by polling
      } else {
        // Regular permanent selection - admin source
        setLocalOverridePending(false); // Clear any pending override
        setPersonalitySource('admin');
        
        console.log('[PR#101] Setting permanent personality via POST /api/personality/active/set');
        
        const response = await fetch('/api/personality/active/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personality_id: personaId, source: 'admin' })
        });
        
        console.log('[PR#101] Active/set response:', response.status, response.statusText);
        const data = await response.json();
        console.log('[PR#101] Active/set response data:', data);
      }
    } catch (err) {
      console.error('[PR#101] Error setting personality:', err);
      // On error, clear the pending flag
      setLocalOverridePending(false);
    }
  };
  
  // Toggle override mode
  const toggleOverrideMode = () => {
    setOverrideMode(prev => !prev);
  };

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

  // Typing animation for AI responses (fallback when streaming is disabled)
  const animateTyping = (fullText, messageId) => {
    // Format the AI response before displaying
    const formattedText = formatAIResponse(fullText);
    let i = 0;
    setIsTyping(true);
    setCurrentTypingText('');
    
    const timer = setInterval(() => {
      if (i < formattedText.length) {
        setCurrentTypingText(formattedText.slice(0, ++i));
      } else {
        setIsTyping(false);
        clearInterval(timer);
        
        // Update the message with full formatted text
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: formattedText, isTyping: false }
            : msg
        ));
      }
    }, 20);
  };

  /**
   * SSE Streaming function - Real token-by-token streaming from backend
   * 
   * Uses Server-Sent Events to receive tokens as they are generated.
   * Token delay is controlled from Admin Dashboard.
   * 
   * Features:
   * - Real-time token display
   * - Progressive thinking steps with "[tänker...]" prefix
   * - Error handling with fallback
   * - Stream abort capability
   */
  const streamResponse = async (question, aiMessageId) => {
    setIsStreaming(true);
    setIsTyping(true);
    setCurrentTypingText('');
    
    // Create abort controller for stream cancellation
    const abortController = new AbortController();
    streamAbortRef.current = abortController;
    
    let accumulatedText = '';
    let tokenCount = 0;
    let metadata = null;
    
    // Buffering for smooth rendering (requestAnimationFrame pattern)
    // This prevents DOM updates on every single token, making it smooth like ChatGPT/Claude
    let pendingUpdate = false;
    let rafId = null;
    
    const scheduleUpdate = () => {
      if (!pendingUpdate) {
        pendingUpdate = true;
        rafId = requestAnimationFrame(() => {
          setCurrentTypingText(formatAIResponse(accumulatedText));
          pendingUpdate = false;
        });
      }
    };
    
    try {
      // Use fetch with ReadableStream for SSE (POST method not supported by EventSource)
      const response = await fetch('/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          text: question,
          max_length: 512,
          temperature: 0.7,
          top_p: 0.9,
          history: conversationHistory,  // Send conversation history for context
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamActive = true;
      
      console.log('[7B-Zero Stream] Starting SSE stream...');
      
      while (streamActive) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[7B-Zero Stream] Stream complete');
          streamActive = false;
          break;
        }
        
        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events from buffer
        // SSE format: "event: type\ndata: json\n\n"
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        let currentEventType = 'message'; // Default SSE event type
        
        for (const line of lines) {
          // Track event type from event: lines
          if (line.startsWith('event:')) {
            currentEventType = line.substring(6).trim();
            continue;
          }
          
          // Skip SSE comment lines (start with :)
          if (line.startsWith(':')) {
            continue;
          }
          
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5).trim());
              
              // Handle different event types properly
              switch (currentEventType) {
                case 'thinking':
                  // Handle thinking step events (personality selection, API fetching, etc.)
                  console.log('[7B-Zero Stream] Thinking:', data.message);
                  
                  // Update AI message with current thinking step (live display)
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          currentThinkingStep: data.message,
                          thinkingChain: [...(msg.thinkingChain || []), data],
                        }
                      : msg
                  ));
                  
                  if (data.step === 'personality' && data.personality) {
                    // Personality selected - update UI
                    const personalityName = typeof data.personality === 'string' ? data.personality : data.personality.name;
                    const personalityId = data.personality_id || (typeof data.personality === 'object' ? data.personality.id : null);
                    console.log(`[7B-Zero Stream] AI selected personality: ${personalityName} (ID: ${personalityId})`);
                    setAiSelectedPersonality(personalityName);
                    if (personalityId) {
                      setSelectedPersona(personalityId);
                    }
                  }
                  break;
                  
                case 'token':
                  // Handle token event - accumulate and schedule batched update
                  if (data.token !== undefined) {
                    accumulatedText += data.token;
                    tokenCount++;
                    // Schedule UI update (batched via requestAnimationFrame)
                    scheduleUpdate();
                  }
                  break;
                  
                case 'metadata':
                  // Handle metadata event
                  metadata = data;
                  console.log('[7B-Zero Stream] Metadata:', metadata);
                  // Update personality if provided
                  if (metadata.personality) {
                    const personalityName = typeof metadata.personality === 'string' ? metadata.personality : metadata.personality.name;
                    const personalityId = typeof metadata.personality === 'object' ? metadata.personality.id : null;
                    setAiSelectedPersonality(personalityName);
                    if (personalityId) {
                      setSelectedPersona(personalityId);
                    }
                  }
                  // Also check for selected_persona_id directly (for model-based selection)
                  if (metadata.selected_persona_id) {
                    setSelectedPersona(metadata.selected_persona_id);
                  }
                  // Store thinking steps if provided
                  if (metadata.thinking_steps && metadata.thinking_steps.length > 0) {
                    setThinkingChain(metadata.thinking_steps);
                  }
                  break;
                  
                case 'done':
                  // Handle done event
                  console.log('[7B-Zero Stream] Done event received');
                  streamActive = false;
                  break;
                  
                case 'error':
                  // Handle error event
                  throw new Error(data.error || 'Unknown streaming error');
                  
                default:
                  // Fallback: determine type from data content (backwards compatibility)
                  if (data.token !== undefined) {
                    accumulatedText += data.token;
                    tokenCount++;
                    scheduleUpdate(); // Use batched update
                  } else if (data.latency_ms !== undefined) {
                    metadata = data;
                    console.log('[7B-Zero Stream] Metadata (fallback):', metadata);
                    if (metadata.personality) {
                      setAiSelectedPersonality(metadata.personality);
                      if (metadata.personality.id) {
                        setSelectedPersona(metadata.personality.id);
                      }
                    }
                  } else if (data.status === 'complete') {
                    console.log('[7B-Zero Stream] Done (fallback)');
                    streamActive = false;
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
              }
              
              // Reset event type after processing data
              currentEventType = 'message';
              
            } catch (parseErr) {
              // Ignore parse errors for non-JSON data lines
              if (line.trim()) {
                console.warn('[7B-Zero Stream] Parse error:', parseErr.message);
              }
            }
          }
        }
      }
      
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Finalize the message
      const finalResponseTime = ((Date.now() - responseStartTime) / 1000).toFixed(2);
      const formattedFinalText = formatAIResponse(accumulatedText);
      
      // Check if we actually received any content
      if (!accumulatedText || accumulatedText.trim() === '') {
        console.warn('[7B-Zero Stream] No content received from stream');
        throw new Error('Ingen text mottagen från strömning. Modellen kan fortfarande laddas.');
      }
      
      console.log('🔔 [FRONTEND STREAM] Finalizing message with metadata:', {
        hasFollowUpOptions: !!metadata?.follow_up_options,
        followUpOptions: metadata?.follow_up_options
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: formattedFinalText,
              isTyping: false,
              currentThinkingStep: null, // Clear thinking step when complete
              responseTime: finalResponseTime,
              confidence: metadata?.confidence_score || 0.85,
              version: metadata?.model || 'OneSeek-Δ+ (Streaming)',
              tokens: metadata?.output_tokens || tokenCount,
              tokensPerSecond: metadata?.tokens_per_second || null,
              promptTokens: metadata?.prompt_tokens || null,
              outputTokens: metadata?.output_tokens || tokenCount,
              contextWindow: metadata?.context_window || 16384,  // Use actual context window from llama-server (default to 16384 if not provided)
              thinkingChain: metadata?.thinking_steps || metadata?.thinking_chain || msg.thinkingChain || null,
              personality: metadata?.personality || null,
              followUpOptions: metadata?.follow_up_options || null,  // Add follow-up options from WebSocket stream
            }
          : msg
      ));
      
      console.log(`[7B-Zero Stream] Complete: ${tokenCount} tokens in ${finalResponseTime}s`);
      
      // Update conversation history for multi-turn support
      // Add the user's question and the assistant's response
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: formattedFinalText }
      ]);
      
      console.log('[7B-Zero] Conversation history updated:', conversationHistory.length + 2, 'messages');
      
      // Update microtraining status
      setMicrotrainingQueue(prev => prev + 1);
      setMicrotrainingActive(true);
      
      // Add new block to DNA chain
      setDnaChain(prev => {
        const newBlock = {
          id: prev.length + 1,
          block: `Block ${100 + prev.length}`,
          time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
          hash: `0x${Math.random().toString(16).slice(2, 10)}`,
          status: 'pending',
          action: 'Query: ' + question.substring(0, 20) + '...',
        };
        return [...prev.map(b => ({ ...b, status: 'verified' })), newBlock];
      });
      
    } catch (err) {
      // Handle abort
      if (err.name === 'AbortError') {
        console.log('[7B-Zero Stream] Stream aborted by user');
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: accumulatedText || 'Avbruten.',
                isTyping: false,
                aborted: true,
              }
            : msg
        ));
      } else {
        console.error('[7B-Zero Stream] Error:', err);
        
        // Fallback to non-streaming if stream fails
        console.log('[7B-Zero Stream] Falling back to non-streaming...');
        setStreamingEnabled(false);
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: `Streaming misslyckades: ${err.message}. Använder fallback.`,
                error: true,
                isTyping: false,
              }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
      setIsTyping(false);
      streamAbortRef.current = null;
    }
  };

  /**
   * Abort current streaming response
   * Called when user wants to stop receiving tokens
   */
  const abortStream = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      console.log('[7B-Zero Stream] Abort requested');
    }
  };

  // Handle follow-up option selection (e.g., "Ja" for case law search)
  const handleFollowUpSelection = async (option, messageId) => {
    console.log('[Follow-Up] Option selected:', option);
    
    // Remove the follow-up options from the original message
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, followUpOptions: null } : msg
    ));
    
    // If user declined, just acknowledge
    if (option.action === 'decline_followup') {
      const ackMessage = {
        id: generateMessageId(),
        type: 'ai',
        text: 'Okej! Du kan ställa en ny fråga om du vill ha mer information.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, ackMessage]);
      return;
    }
    
    // If user accepted (search_prejudikat), show loading and fetch
    const aiMessageId = generateMessageId();
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
      // Call backend to handle the follow-up action
      const result = await handleFollowUpAction(option);
      
      const responseEndTime = Date.now();
      
      // Update the AI message with the result
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          text: result.response || result.text,
          isTyping: false,
          thinkingChain: result.thinking_chain,
          followUpOptions: result.follow_up_options,
          timestamp: new Date().toISOString(),
        } : msg
      ));
      
      setIsTyping(false);
    } catch (error) {
      console.error('[Follow-Up] Error:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          text: `Ett fel uppstod vid sökning av prejudikat: ${error.message}`,
          isTyping: false,
          error: true,
          timestamp: new Date().toISOString(),
        } : msg
      ));
      
      setIsTyping(false);
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isTyping) return;

    const userMessage = {
      id: generateMessageId(),
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
    const aiMessageId = generateMessageId();
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      text: '',
      isTyping: true,
      timestamp: new Date().toISOString(),
      debateMode: debateMode,  // Set debate mode flag from the start
    };
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(true);
    setThinkingStep('[tänker...] Analyserar frågan');

    try {
      let response;
      let data;
      
      // Use Live Debate Flow when debateMode is enabled
      if (debateMode) {
        console.log('[7B-Zero] Starting Live Debate Flow...');
        await startLiveDebate(currentQuestion, aiMessageId);
        return;
      }
      
      // Use Zero Compare Flow when compareMode is enabled
      if (compareMode) {
        console.log('[7B-Zero] Using Zero Compare Flow...');
        console.log(`[7B-Zero] Chunked mode: ${chunkedMode}`);
        
        // Clear previous thinking events for new compare analysis
        setCompareThinkingEvents([]);
        
        // Add initial thinking event
        const addThinkingEvent = (message, type = 'thinking') => {
          const event = {
            type,
            message,
            timestamp: new Date().toISOString(),
          };
          setCompareThinkingEvents(prev => [...prev, event]);
        };
        
        addThinkingEvent('Samlar in externa AI-svar...', 'compare_start');
        
        response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: currentQuestion,
            preferredModel: 'openseek-7b-zero',
            profileId: 'zero',
            characterCard: 'Medveten',
            compare: true,
            chunked: chunkedMode, // Enable chunked analysis mode
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
        const responseEndTime = Date.now();
        const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
        
        // Track external responses collection
        addThinkingEvent(`Mottog ${data.externalResponses?.length || 0} externa svar`, 'external_collected');
        
        // Store external responses for display (with pipeline analysis)
        if (data.externalResponses) {
          setExternalResponses(data.externalResponses);
          
          // Log MTA-16 analysis availability
          const withAnalysis = data.externalResponses.filter(r => r.pipelineAnalysis).length;
          console.log(`[7B-Zero Compare] ${withAnalysis}/${data.externalResponses.length} responses have pipeline analysis`);
          
          if (withAnalysis > 0) {
            addThinkingEvent(`MTA-16 analys tillgänglig för ${withAnalysis} svar`, 'mta16_available');
          }
        }
        
        // Track Zero's analysis
        addThinkingEvent('Zero analyserar externa svar...', 'zero_analyzing');
        
        // Extract Zero's response
        const responseText = data.zero?.response || data.response || '';
        
        if (responseText) {
          addThinkingEvent('Analys klar', 'compare_complete');
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  responseTime: finalResponseTime,
                  confidence: data.zero?.delta_plus?.confidence_score || 0.85,
                  version: data.zero?.model || 'OpenSeek-7B-Zero',
                  compareMode: true,
                  externalCount: data.externalResponses?.length || 0,
                  compression: data.compression,
                  thinkingChain: compareThinkingEvents, // Attach thinking events
                }
              : msg
          ));
          animateTyping(responseText, aiMessageId);
        } else {
          throw new Error('No response from Zero');
        }
        return;
      }
      
      // === SSE STREAMING MODE ===
      // Use real token-by-token streaming when enabled (default)
      // Falls back to standard API if streaming is disabled or fails
      if (streamingEnabled && !compareMode) {
        console.log('[7B-Zero] Using SSE streaming mode...');
        await streamResponse(currentQuestion, aiMessageId);
        return;
      }
      
      // Standard flow - use ONESEEK Δ+ inference endpoint (fallback when streaming disabled)
      console.log('[7B-Zero] Using standard (non-streaming) mode...');
      let useOQTFallback = false;
      let usePersonalityEndpoint = true; // Enable personality-based API routing
      
      // Try personality-based endpoint first (with thinking chain and automatic API routing)
      if (usePersonalityEndpoint) {
        try {
          let wsSuccess = false;
          
          // Use WebSocket for real-time progressive updates if supported
          if (isWebSocketSupported()) {
            console.log('[7B-Zero] Attempting WebSocket for personality inference...');
            
            try {
              const wsResult = await sendPersonalityMessageViaWebSocket(currentQuestion, {
                history: conversationHistory,  // Pass conversation history for context
                onThinking: (step) => {
                  // Update global thinking step for loading indicator
                  setThinkingStep(`[tänker...] ${step.message}`);
                  
                  // Update AI message with current thinking step
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          currentThinkingStep: step.message,
                          thinkingChain: [...(msg.thinkingChain || []), step],
                        }
                      : msg
                  ));
                },
                onFinal: (data) => {
                  const responseEndTime = Date.now();
                  const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
                  
                  // Clear thinking step
                  setThinkingStep(null);
                  
                  // Update AI-selected personality from response
                  if (data.personality) {
                    setAiSelectedPersonality({
                      id: data.personality.id,
                      name: data.personality.name || data.personality.id,
                      description: '',
                      categories: [],
                      is_default: false
                    });
                    setSelectedPersona(data.personality.id);
                  }
                  
                  const responseText = data.response;
                  console.log('🔔 [FRONTEND] onFinal received:', {
                    hasFollowUpOptions: !!data.follow_up_options,
                    followUpOptionsType: typeof data.follow_up_options,
                    followUpOptions: data.follow_up_options,
                    responseLength: responseText?.length
                  });
                  if (responseText) {
                    setMessages(prev => prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { 
                            ...msg, 
                            responseTime: finalResponseTime,
                            confidence: data.personality?.confidence || 0.85,
                            version: data.model || 'OneSeek-7B-Zero',
                            thinkingChain: data.thinking_chain || msg.thinkingChain || null,
                            apiData: data.api_data || null,
                            tokens: data.tokens,
                            personality: data.personality,
                            currentThinkingStep: null, // Clear thinking step
                            followUpOptions: data.follow_up_options || null, // Add follow-up options from WebSocket
                          }
                        : msg
                    ));
                    console.log('🔔 [FRONTEND] Message updated with followUpOptions');
                    animateTyping(responseText, aiMessageId);
                  }
                },
                onError: (errorMessage) => {
                  console.log('[7B-Zero] WebSocket not available:', errorMessage);
                  // Will fall back to REST below
                },
                maxTokens: 1600,  // Increased for Socionomen and other personalities that need longer responses
                temperature: 0.7,
              });
              
              // Check if WebSocket succeeded (result will be null if error occurred)
              if (wsResult !== null) {
                return; // Success - exit early
              } else {
                console.log('[7B-Zero] WebSocket did not complete successfully, falling back to REST');
              }
            } catch (wsError) {
              console.log('[7B-Zero] WebSocket failed, falling back to REST:', wsError.message);
            }
          }
          
          // Fallback to REST API if WebSocket not supported or failed
          console.log('[7B-Zero] Using REST API for personality inference...');
          response = await fetch('/api/inference/personality', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: currentQuestion,
              max_length: 1600,  // Increased for Socionomen and other personalities that need longer responses
              temperature: 0.7,
              stream_thinking: true,
            }),
          });
          
          if (response.ok) {
            data = await response.json();
            const responseEndTime = Date.now();
            const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
            
            // Update AI-selected personality from response
            if (data.personality) {
              setAiSelectedPersonality({
                id: data.personality.id,
                name: data.personality.name || data.personality.id,
                description: '',
                categories: [],
                is_default: false
              });
              setSelectedPersona(data.personality.id);
            }
            
            const responseText = data.response;
            console.log('🔔 [FRONTEND REST] Received response:', {
              hasFollowUpOptions: !!data.follow_up_options,
              followUpOptions: data.follow_up_options,
              responseLength: responseText?.length
            });
            if (responseText) {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      responseTime: finalResponseTime,
                      confidence: data.personality?.confidence || 0.85,
                      version: data.model || 'OneSeek-7B-Zero',
                      thinkingChain: data.thinking_chain || null,
                      apiData: data.api_data || null,
                      tokens: data.tokens,
                      personality: data.personality,
                      followUpOptions: data.follow_up_options || null, // Add follow-up options from REST API
                    }
                  : msg
              ));
              console.log('🔔 [FRONTEND REST] Message updated with followUpOptions');
              animateTyping(responseText, aiMessageId);
              return;
            }
          } else {
            // Fall through to legacy endpoint
            usePersonalityEndpoint = false;
          }
        } catch (err) {
          console.log('[7B-Zero] Personality endpoint failed, falling back...', err);
          usePersonalityEndpoint = false;
        }
      }
      
      // Fallback to standard ONESEEK Δ+ inference endpoint
      if (!usePersonalityEndpoint) {
        try {
          response = await fetch('/api/inference/oneseek', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: currentQuestion,
              max_length: 512,
              temperature: 0.7,
              top_p: 0.9,
              skip_typo_check: !typoCheckEnabled, // Skip typo check if disabled
            }),
          });
          
          if (!response.ok) {
            useOQTFallback = true;
          }
        } catch {
          useOQTFallback = true;
        }
      } else {
        // Already handled by personality endpoint
        return;
      }
      
      // Fallback to OQT endpoint if Δ+ fails
      if (useOQTFallback) {
        response = await fetch('/api/oqt/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: currentQuestion,
            persona: selectedPersona,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      data = await response.json();
      const responseEndTime = Date.now();
      const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);

      // === ONESEEK Δ+ TYPO CORRECTION HANDLING ===
      // If typo was detected, show AI's personalized response with correction buttons
      if (data.typo_correction?.detected && data.typo_correction?.show_buttons) {
        const typoData = data.typo_correction;
        
        // Update message with typo response and correction buttons
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: data.response,
                isTyping: false,
                responseTime: finalResponseTime,
                // Store typo correction data
                typoCorrection: typoData,
                showTypoButtons: true,
              }
            : msg
        ));
        setIsTyping(false);
        return; // Exit early - wait for user to click button
      }

      // Handle both Δ+ endpoint (response) and OQT endpoint (data.success/data.response) formats
      const responseText = data.response || data.text;
      const isSuccess = data.success !== false && responseText;
      
      if (isSuccess) {
        // ONESEEK Δ+ v6.4: Update AI-selected personality for real-time display
        if (data.personality) {
          setAiSelectedPersonality(data.personality);
          // Also update the persona selector to show the AI's choice
          if (data.personality.id) {
            setSelectedPersona(data.personality.id);
          }
        }
        
        // Update message with response data and animate typing
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                responseTime: finalResponseTime,
                confidence: data.confidence || data.delta_plus?.confidence_score || data.delta_plus?.intent_confidence || 0.85,
                version: data.version || 'OneSeek-Δ+',
                provenance: data.provenance,
                // ONESEEK Δ+ metadata
                deltaPlus: data.delta_plus || null,
                topicHash: data.delta_plus?.topic_hash || null,
                intent: data.delta_plus?.intent || null,
                entity: data.delta_plus?.entity || null,
                // ONESEEK Δ+ v6.2: Personality
                personality: data.personality || null,
              }
            : msg
        ));
        
        // Start typing animation
        animateTyping(responseText, aiMessageId);
        
        // Update microtraining status
        setMicrotrainingQueue(prev => prev + 1);
        setMicrotrainingActive(true);
        
        // Add new block to DNA chain
        setDnaChain(prev => {
          const newBlock = {
            id: prev.length + 1,
            block: `Block ${100 + prev.length}`,
            time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
            hash: `0x${Math.random().toString(16).slice(2, 10)}`,
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
        setThinkingStep(null);
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
      setThinkingStep(null);
    }
  };

  // Toggle round expansion in debate
  const toggleDebateRound = (messageId, roundIndex) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.debateData) {
        const updatedDebateData = { ...msg.debateData };
        if (updatedDebateData.rounds[roundIndex]) {
          updatedDebateData.rounds[roundIndex].expanded = !updatedDebateData.rounds[roundIndex].expanded;
        }
        
        return {
          ...msg,
          debateData: updatedDebateData
        };
      }
      return msg;
    }));
  };

  // Update counter to force React re-renders
  const debateUpdateCounter = useRef(0);
  
  // Helper function to update debate message in real-time
  const updateDebateMessage = (aiMessageId, debateState, isFinal) => {
    debateUpdateCounter.current++;
    const counter = debateUpdateCounter.current;
    
    console.log('[Debate-Update] Updating message', { 
      counter,
      rounds: debateState.rounds?.length, 
      isFinal,
      hasVotes: !!debateState.voteResults,
      hasWinner: !!debateState.winner 
    });
    
    // Update the message with fresh debateData - this is what the UI renders!
    // CRITICAL: Use JSON deep copy + counter to ensure React detects changes
    setMessages(prev => prev.map(msg => 
      msg.id === aiMessageId 
        ? { 
            ...msg, 
            debateMode: true,  // Always ensure debateMode is set
            isTyping: !isFinal,  // Keep typing indicator while debate is in progress
            debateData: {
              ...JSON.parse(JSON.stringify(debateState)),  // DEEP copy
              _updateCounter: counter,  // Force React to see change
              _timestamp: Date.now()  // Unique timestamp
            },
            thinkingChain: null,  // Clear to prevent ThinkingChain rendering
          }
        : msg
    ));
  };

  // Helper: Create Tankekedja event with timestamp and properly extract data
  const createTankekedjaEvent = (message) => {
    const event = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    // Extract and structure data based on event type
    switch (message.type) {
      case 'ai_response':
        // Extract full AI response data
        event.text = message.text || message.message || message.data?.response || `${(message.agent || 'AI').toUpperCase()} response`;
        event.prompt = message.data?.prompt || message.prompt || message.data?.full_prompt;
        event.model = message.data?.model || message.model || `${message.agent}-model`;
        event.api_url = message.data?.api_url || message.api_url || `https://api.${message.agent}.com/v1/chat/completions`;
        event.context = message.data?.context || message.context;
        event.temperature = message.data?.temperature || message.temperature || 0.7;
        event.max_tokens = message.data?.max_tokens || message.max_tokens || 500;
        event.tokens_in = message.data?.tokens_in || message.tokens_in || message.tokens || 0;
        event.tokens_out = message.data?.tokens_out || message.tokens_out || 0;
        event.payload = message.data?.payload || message.payload || message.data;
        event.response = message.data?.full_response || message.response || message;
        break;
        
        
      case 'oneseek_reasoning':
        // Extract OneSeek commentary/reasoning
        event.text = message.message || message.text || message.data?.commentary || message.data?.reasoning;
        event.tokens = message.data?.tokens || message.tokens || 0;
        break;
        
      case 'live_insight':
        // Extract insight data
        event.text = message.message || message.text || message.data?.insight;
        event.tokens = message.data?.tokens || message.tokens || 0;
        break;
        
      case 'oneseek_own_answer':
        // Extract OneSeek's own synthesis answer
        event.text = message.text || message.message || message.data?.answer;
        event.thinking_steps = message.data?.thinking_steps || message.data?.internal_reasoning || message.thinking_steps;
        event.internal_reasoning = message.data?.internal_reasoning;
        break;
        
      case 'vote_received':
        // Extract complete voting data
        event.voted_for = message.data?.voted_for || message.voted_for;
        event.motivation = message.data?.motivation || message.motivation;
        // Check multiple possible locations for huvudpunkter
        event.huvudpunkter = message.data?.huvudpunkter || 
                            message.huvudpunkter || 
                            message.data?.payload?.huvudpunkter ||
                            message.full_payload?.huvudpunkter ||
                            [];
        console.log('[Vote Data] Extracted huvudpunkter:', event.huvudpunkter, 'from message:', message);
        event.voter = message.data?.voter || message.voter || message.agent;
        event.candidates = message.data?.candidates || message.candidates || [];
        event.voting_prompt = message.data?.prompt || message.prompt || message.data?.voting_prompt;
        event.voting_context = message.data?.context || message.context;
        event.tokens_in = message.data?.tokens_in || message.tokens_in || 0;
        event.tokens_out = message.data?.tokens_out || message.tokens_out || 0;
        event.payload = message.data?.payload || message.payload || message.data;
        break;
        
      case 'debate_complete':
      case 'final':
      case 'summary':
        // Extract final summary data
        event.summary = message.data?.summary || message.summary || message.text || message.message;
        event.winner = message.data?.winner || message.winner;
        event.vote_analysis = message.data?.vote_analysis || message.vote_analysis;
        event.debate_stats = message.data?.stats || message.stats;
        break;
    }
    
    return event;
  };

  // Live Debate Flow via WebSocket
  const startLiveDebate = async (question, aiMessageId) => {
    console.log('[Debate] Starting live AI debate...');
    
    // Clear previous debate events and add initial user question event
    setTankekedjaEvents([createTankekedjaEvent({
      type: 'user_question',
      text: question
    })]);
    
    // Ensure the AI message doesn't have thinkingChain to prevent ThinkingChain component rendering
    setMessages(prev => prev.map(msg =>
      msg.id === aiMessageId
        ? { ...msg, thinkingChain: null, debateMode: true }
        : msg
    ));
    
    setThinkingStep('[tänker...] Startar debattarena...');
    setDebateData(null);
    setShowConfetti(false);
    
    try {
      const ws = new WebSocket(`ws://localhost:5000/ws/debate`);
      wsRef.current = ws; // Store WebSocket reference
      
      const debateState = {
        question,
        rounds: [],
        votes: {},
        winner: null,
        summary: null
      };
      
      ws.onopen = () => {
        console.log('[Debate] WebSocket connected');
        // Send debate request
        ws.send(JSON.stringify({
          question: `[debatt] ${question}`
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('[Debate] Message received:', message.type);
        
        // Track event in Tankekedja sidebar
        setTankekedjaEvents(prev => [...prev, createTankekedjaEvent(message)]);
        
        // Auto-show sidebar when debate starts
        if (message.type === 'debate_init' || message.type === 'debate_start') {
          setShowTankekedja(true);
        }
        
        switch (message.type) {
          case 'thinking':
            setThinkingStep(message.message);
            break;
            
          case 'debate_init':
            setThinkingStep('🎯 Debattarena initierad!');
            debateState.agents = message.data.agents;
            debateState.maxRounds = message.data.rounds;
            setDebateData({...debateState});
            break;
            
          case 'debate_intro':
            // OneSeek introduces the topic
            setThinkingStep(null);
            const introMsg = {
              id: `debate-intro-${Date.now()}`,
              type: 'assistant',
              text: message.message,
              timestamp: new Date().toISOString(),
              isDebateIntro: true
            };
            setMessages(prev => [...prev, introMsg]);
            setConversationHistory(prev => [...prev, {
              role: 'assistant',
              content: message.message,
              timestamp: introMsg.timestamp
            }]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'round_start':
            const turnOrder = message.data?.turn_order || [];
            const turnOrderText = turnOrder.length > 0 
              ? ` (tur-ordning: ${turnOrder.map(a => a.toUpperCase()).join(' → ')})` 
              : '';
            setThinkingStep(`🎤 Runda ${message.round} startar...${turnOrderText}`);
            setCurrentRound(message.round);
            
            // Add debate marker message at round 1 start for chronological positioning
            if (message.round === 1) {
              const debateMarker = {
                id: `debate-marker-${Date.now()}`,
                type: 'assistant',
                text: 'Debatten startar nu...',
                timestamp: new Date().toISOString(),
                isDebateMarker: true
              };
              
              setMessages(prev => [...prev, debateMarker]);
              setConversationHistory(prev => [...prev, {
                role: 'assistant',
                content: 'Debatten startar nu...',
                timestamp: debateMarker.timestamp,
                isDebateMarker: true
              }]);
            }
            
            // Initialize round data structure with turn order
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                turnOrder: turnOrder
              }
            }));
            break;
            
          case 'ai_response':
            // External AI response arrived and queued
            console.log(`[Debate] ${message.agent} response queued`);
            setThinkingStep(`✅ ${message.agent.toUpperCase()} har svarat`);
            break;
            
          case 'oneseek_echo_start':
            // OneSeek starts echoing an answer
            console.log(`[Debate] OneSeek echoing ${message.agent}'s answer`);
            setThinkingStep(`🔄 OneSeek ekar ${message.agent.toUpperCase()}s svar...`);
            
            // Initialize AI data in round and track arrival order
            setDebateRounds(prev => {
              const currentRoundData = prev[message.round] || {};
              const arrivalOrder = currentRoundData.arrivalOrder || [];
              
              // Add agent to arrival order if not already there
              if (!arrivalOrder.includes(message.agent)) {
                arrivalOrder.push(message.agent);
              }
              
              return {
                ...prev,
                [message.round]: {
                  ...currentRoundData,
                  arrivalOrder: arrivalOrder,
                  [message.agent]: {
                    text: '',
                    isStreaming: true,
                    reasoning: null,
                    insights: [],
                    model: null
                  }
                }
              };
            });
            break;
            
          case 'oneseek_echo':
            // Token stream from OneSeek's echo
            const echoText = message.text || '';
            const isEchoComplete = message.complete || false;
            
            // Update AI data with streaming text
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                ...(prev[message.round] || {}),
                [message.agent]: {
                  ...(prev[message.round]?.[message.agent] || {}),
                  text: echoText,
                  isStreaming: !isEchoComplete
                }
              }
            }));
            
            if (isEchoComplete) {
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
            break;
            
          case 'oneseek_reasoning':
            // OneSeek's focused reasoning for specific answer
            console.log(`[Debate] OneSeek reasoning for ${message.agent}`);
            
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                ...(prev[message.round] || {}),
                [message.agent]: {
                  ...(prev[message.round]?.[message.agent] || {}),
                  reasoning: message.message
                }
              }
            }));
            
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'live_insight':
            // Live one-liner insight
            console.log(`[Debate] Live insight: ${message.message}`);
            
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                ...(prev[message.round] || {}),
                [message.agent]: {
                  ...(prev[message.round]?.[message.agent] || {}),
                  insights: [
                    ...(prev[message.round]?.[message.agent]?.insights || []),
                    message.message
                  ]
                }
              }
            }));
            
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'oneseek_own_answer_start':
            // OneSeek starts its own comprehensive answer
            console.log(`[Debate] OneSeek generating own answer for round ${message.round}`);
            setThinkingStep(`🤖 ONESEEK ger sitt debattsvar...`);
            
            setDebateRounds(prev => {
              const currentRoundData = prev[message.round] || {};
              const arrivalOrder = currentRoundData.arrivalOrder || [];
              
              // Add oneseek to arrival order if not already there
              if (!arrivalOrder.includes('oneseek')) {
                arrivalOrder.push('oneseek');
              }
              
              return {
                ...prev,
                [message.round]: {
                  ...currentRoundData,
                  arrivalOrder: arrivalOrder,
                  oneseek: {
                    text: '',
                    isStreaming: true,
                    reasoning: null,
                    insights: [],
                    model: 'OneSeek-7B-Zero'
                  }
                }
              };
            });
            break;
            
          case 'oneseek_own_answer':
            // Token stream from OneSeek's own answer
            const answerText = message.text || '';
            const isAnswerComplete = message.complete || false;
            
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                ...(prev[message.round] || {}),
                oneseek: {
                  ...(prev[message.round]?.oneseek || {}),
                  text: answerText,
                  isStreaming: !isAnswerComplete,
                  model: 'OneSeek-7B-Zero'
                }
              }
            }));
            
            if (isAnswerComplete) {
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
            break;
            
          case 'oneseek_own_reasoning':
            // OneSeek's reasoning for its own answer
            console.log(`[Debate] OneSeek reasoning for own answer`);
            
            setDebateRounds(prev => ({
              ...prev,
              [message.round]: {
                ...(prev[message.round] || {}),
                oneseek: {
                  ...(prev[message.round]?.oneseek || {}),
                  reasoning: message.message
                }
              }
            }));
            
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'round_summary':
            // Round compression/summary
            console.log(`[Debate] Round ${message.round} summary received`);
            
            // Ensure round number is valid
            if (message.round && !isNaN(parseInt(message.round))) {
              const summaryText = message.data?.summary || message.message;
              const consensus = message.data?.consensus || 50;
              setDebateRounds(prev => ({
                ...prev,
                [message.round]: {
                  ...(prev[message.round] || {}),
                  summary: summaryText,
                  consensus: consensus
                }
              }));
            } else {
              console.warn('[Debate] round_summary received with invalid round number:', message.round);
            }
            
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'round_end':
            setThinkingStep(`✅ Runda ${message.round} avslutad`);
            
            // Mark round as complete (no longer active) to trigger auto-minimize
            if (parseInt(message.round) === currentRound) {
              setCurrentRound(0); // No active round
            }
            break;
            
          case 'round_complete':
            // Legacy support - deprecated in new architecture
            console.log(`[Debate] Legacy round_complete event received`);
            break;
            
          case 'voting_intro':
            // OneSeek introduces voting phase - add to debate state, not general messages
            setThinkingStep(null);
            setDebateRounds(prev => ({
              ...prev,
              voting: {
                ...(prev.voting || {}),
                intro: message.message
              }
            }));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'vote_received':
            // Individual vote with motivation - add to debate state
            console.log(`[Debate] Vote from ${message.voter} for ${message.voted_for}`);
            console.log('[Debate] Vote huvudpunkter:', message.huvudpunkter, 'Full message:', message);
            setDebateRounds(prev => ({
              ...prev,
              voting: {
                ...(prev.voting || {}),
                votes: [
                  ...(prev.voting?.votes || []),
                  {
                    voter: message.voter,
                    votedFor: message.voted_for,
                    message: message.message,
                    motivation: message.motivation,
                    huvudpunkter: message.huvudpunkter || message.data?.huvudpunkter || []
                  }
                ]
              }
            }));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'winner':
            // Winner announcement - add to debate state
            setThinkingStep(null);
            setDebateRounds(prev => ({
              ...prev,
              voting: {
                ...(prev.voting || {}),
                winner: message.data.winner,
                winnerVotes: message.data.votes,
                winnerMessage: message.message
              }
            }));
            
            // Show confetti for winner!
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
          case 'debate_complete':
            // Combined final message with voting, winner, summary, completion
            setThinkingStep(null);
            setIsTyping(false);
            
            const responseEndTime = Date.now();
            const finalResponseTime = ((responseEndTime - responseStartTime) / 1000).toFixed(2);
            
            debateState.winner = message.data.winner;
            debateState.winnerVotes = message.data.winner_votes;
            debateState.voteResults = message.data.vote_results;
            debateState.summary = message.data.summary;
            
            // Add debate completion data to debateRounds state
            setDebateRounds(prev => ({
              ...prev,
              completion: {
                winner: message.data.winner,
                winnerVotes: message.data.winner_votes,
                totalVotes: message.data.total_votes,
                voteResults: message.data.vote_results,
                summary: message.data.summary,
                time: finalResponseTime
              }
            }));
            
            // Mark all rounds as complete
            setCurrentRound(0);
            
            // Show confetti for winner!
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            
            // Note: No auto-toggle - user controls debate mode with button
            // Debate and analysis happen in whatever view user has selected
            
            // Add debate summary to conversationHistory for context
            const debateSummary = `Debatt slutförd: ${debateState.question}. Deltagare: GPT, GEMINI, DEEPSEEK, GROK, ONESEEK. Rundor: ${max_rounds}. Vinnare: ${message.data.winner} med ${message.data.winner_votes} röster. Röstfördelning: ${Object.entries(message.data.vote_results || {}).map(([ai, votes]) => `${ai}: ${votes}`).join(', ')}.`;
            setConversationHistory(prev => [
              ...prev,
              { role: 'assistant', content: debateSummary }
            ]);
            
            break;
            
          case 'message':
            // Handle regular messages
            if (message.thinking || message.isThinking) {
              // Analysis progress message - add as message with isThinking flag for grouped display
              const thinkingMsgId = generateMessageId();
              setMessages(prev => [...prev, {
                id: thinkingMsgId,
                role: 'ai',
                text: message.message,
                agent: message.agent || 'oneseek',
                timestamp: new Date(),
                isThinking: true,
                isTyping: false
              }]);
            } else {
              // Regular message
              const msgId = generateMessageId();
              setMessages(prev => [...prev, {
                id: msgId,
                role: 'ai',
                text: message.message,
                agent: message.agent || 'oneseek',
                timestamp: new Date(),
                isTyping: false
              }]);
            }
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;
            
            
          // Legacy events - kept for backward compatibility
          case 'voting':
          case 'summary':
          case 'final':
            // These are now combined in debate_complete event
            // Note: 'winner' is handled above at line 2297
            break;
            
          case 'error':
            console.error('[Debate] Error:', message.message);
            setThinkingStep(null);
            setIsTyping(false);
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    text: `Debattfel: ${message.message}`,
                    error: true,
                    isTyping: false,
                  }
                : msg
            ));
            ws.close();
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error('[Debate] WebSocket error:', error);
        setThinkingStep(null);
        setIsTyping(false);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: 'Kunde inte ansluta till debattarenan. WebSocket-fel.',
                error: true,
                isTyping: false,
              }
            : msg
        ));
      };
      
      ws.onclose = () => {
        console.log('[Debate] WebSocket closed');
      };
      
    } catch (error) {
      console.error('[Debate] Error starting debate:', error);
      setThinkingStep(null);
      setIsTyping(false);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: 'Debattfel: ' + error.message,
              error: true,
              isTyping: false,
            }
          : msg
      ));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ignore shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key.toLowerCase() === 'q') setQuantumMode(p => !p);
      if (e.key.toLowerCase() === 'f') setFocusMode(p => !p);
      if (e.key.toLowerCase() === 'w') setWhiteMode(p => !p);
      if (e.key.toLowerCase() === 't') setShowTankekedja(p => !p);
      if (e.key === 'Escape') {
        setFocusMode(false);
        setWhiteMode(false);
        setShowDebatePanel(false);
        setShowTankekedja(false);
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

  // Get model version string - prioritize Python ML service's active model
  const getModelVersion = () => {
    if (loading) return 'Laddar...';
    // Check for dynamically switched model from ML service first
    if (modelStatus?.activeModel?.model_name) return modelStatus.activeModel.model_name;
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
          : 'bg-[#0a0a0a] text-white'
      } ${quantumMode ? 'opacity-50' : ''}`}
    >
      {/* ===== CONFETTI OVERLAY ===== */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'][Math.floor(Math.random() * 5)],
                }}
              />
            ))}
          </div>
        </div>
      )}
      
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
        
        /* Confetti animation */
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
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
              {/* ONESEEK Δ+ v6.5 (PR#101): AI-selected personality display with source indicator */}
              <span className={`transition-all duration-300 flex items-center gap-1 ${
                aiSelectedPersonality 
                  ? (personalitySource === 'override' 
                      ? (whiteMode ? 'text-orange-600' : 'text-orange-400')
                      : personalitySource === 'admin'
                        ? (whiteMode ? 'text-blue-600' : 'text-blue-400')
                        : (whiteMode ? 'text-purple-600' : 'text-purple-400'))
                  : (whiteMode ? 'text-[#777]' : 'text-[#555]')
              }`}>
                🎭 {aiSelectedPersonality?.id?.replace('oneseek-', '') || characterData?.name || 'Medveten'}
                {/* Source indicator (PR#101) */}
                <span className={`text-[8px] px-1 rounded ${
                  personalitySource === 'override' 
                    ? 'bg-orange-500/20' 
                    : personalitySource === 'admin'
                      ? 'bg-blue-500/20'
                      : 'bg-purple-500/20'
                }`}>
                  {personalitySource === 'override' ? '⏳' : personalitySource === 'admin' ? '👤' : '🤖'}
                </span>
              </span>
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
              <div className={`text-[8px] mb-3 sticky top-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-[#0a0a0a]'}`}>↑</div>
              
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
              
              <div className={`text-[8px] mt-3 sticky bottom-0 ${whiteMode ? 'text-[#ccc] bg-[#fafafa]' : 'text-[#333] bg-[#0a0a0a]'}`}>↓</div>
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
              aria-label="Starta ny sökning"
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
        {/* Wider max-width for 4K screens - was max-w-2xl (672px), now max-w-5xl (1024px) */}
        <div className="max-w-5xl mx-auto w-full space-y-8">
          
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

          {/* Debate Rounds Display moved to message timeline - rendered at debate marker position */}
          {false && Object.keys(debateRounds).length > 0 && (
            <div className="mb-6">
              {Object.keys(debateRounds).filter(k => k !== 'completion' && k !== 'voting' && !isNaN(parseInt(k))).sort((a, b) => parseInt(a) - parseInt(b)).map(roundNum => (
                <DebateRoundDisplay
                  key={roundNum}
                  round={parseInt(roundNum)}
                  aiData={debateRounds[roundNum]}
                  isActive={parseInt(roundNum) === currentRound}
                />
              ))}
              
              {/* Live Voting Display - Show votes as they come in, hide when completed */}
              {debateRounds.voting && debateRounds.voting.votes && debateRounds.voting.votes.length > 0 && !debateRounds.completion && (
                <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4 mb-3">
                  <div className="text-sm font-medium text-[#888] mb-3">🗳️ Röstning pågår...</div>
                  <div className="space-y-3">
                    {debateRounds.voting.votes.map((vote, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="text-[#888] font-medium mb-1">
                          {vote.voter.toUpperCase()} → {vote.votedFor.toUpperCase()}
                        </div>
                        {vote.message && (
                          <div className="text-[#666] mt-1 italic">
                            "{vote.message}"
                          </div>
                        )}
                        {vote.huvudpunkter && vote.huvudpunkter.length > 0 && (
                          <div className="mt-2 pl-2 border-l-2 border-[#333]">
                            <div className="text-[#555] text-[10px] mb-1">Huvudpunkter:</div>
                            <ol className="list-decimal list-inside space-y-1">
                              {vote.huvudpunkter.map((punkt, pidx) => (
                                <li key={pidx} className="text-[#777] text-[11px]">
                                  {punkt}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Debate Completion - Integrated into flow */}
              {debateRounds.completion && (
                <DebateCompletionSection completion={debateRounds.completion} />
              )}
            </div>
          )}

          {/* Messages Timeline */}
          {messages.map((msg, idx) => {
            const distanceFromEnd = messages.length - idx - 1;
            const opacityValue = distanceFromEnd > 6 ? 0.4 : distanceFromEnd > 3 ? 0.6 : distanceFromEnd > 1 ? 0.8 : 1;
            const isRecent = distanceFromEnd <= 1;
            const isHighlighted = highlightedMessage === msg.id;
            
            // Handle thinking group
            if (msg.isThinkingGroup) {
              return (
                <div 
                  key={msg.id}
                  className="elegant-fade transition-all duration-500 flex flex-col items-start"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Timestamp */}
                  <p className={`text-[10px] mb-2 tracking-wide uppercase ${
                    whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
                  }`}>
                    {formatDate(msg.timestamp)} · {formatTime(msg.timestamp)}
                  </p>
                  
                  <div className="max-w-4xl relative group">
                    {/* AI Meta */}
                    <div className={`text-[10px] mb-2 tracking-wide font-light uppercase flex items-center gap-3 ${
                      whiteMode ? 'text-[#999]' : 'text-[#4a4a4a]'
                    }`}>
                      <span className={whiteMode ? 'text-[#666]' : 'text-[#666]'}>ONESEEK</span>
                      <button 
                        className={`ml-2 px-2 py-0.5 rounded text-[9px] border transition-all ${
                          whiteMode 
                            ? 'border-[#ddd] hover:border-[#999] hover:bg-[#f5f5f5]' 
                            : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
                        }`}
                      >
                        🔄 Konsensus
                      </button>
                    </div>
                    
                    {/* Grouped thinking messages */}
                    <div className={`rounded-lg border p-4 ${
                      whiteMode 
                        ? 'bg-[#f5f5f5] border-[#e0e0e0]' 
                        : 'bg-[#0d0d0d] border-[#1a1a1a]'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-[14px] font-light ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>
                          🔬 MTA-16 Analys pågår
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full loading-dot-1 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                          <span className={`w-2 h-2 rounded-full loading-dot-2 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                          <span className={`w-2 h-2 rounded-full loading-dot-3 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                        </div>
                      </div>
                      
                      {/* All thinking messages grouped */}
                      <div className="space-y-1.5">
                        {msg.messages.map((thinkMsg, thinkIdx) => (
                          <div 
                            key={thinkMsg.id}
                            className={`text-xs ${whiteMode ? 'text-[#888]' : 'text-[#666]'}`}
                          >
                            {thinkMsg.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Handle debate marker - render debate rounds at this position
            if (msg.isDebateMarker && Object.keys(debateRounds).length > 0) {
              return (
                <div 
                  key={msg.id}
                  className="elegant-fade transition-all duration-500 w-full"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Timestamp */}
                  <p className={`text-[10px] mb-2 tracking-wide uppercase ${
                    whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
                  }`}>
                    {formatDate(msg.timestamp)} · {formatTime(msg.timestamp)}
                  </p>
                  
                  {/* Debate rounds display - now in chronological position */}
                  <div className="mb-6">
                    {Object.keys(debateRounds).filter(k => k !== 'completion' && k !== 'voting' && !isNaN(parseInt(k))).sort((a, b) => parseInt(a) - parseInt(b)).map(roundNum => (
                      <DebateRoundDisplay
                        key={roundNum}
                        round={parseInt(roundNum)}
                        aiData={debateRounds[roundNum]}
                        isActive={parseInt(roundNum) === currentRound}
                      />
                    ))}
                    
                    {/* Live Voting Display - Show votes as they come in, hide when completed */}
                    {debateRounds.voting && debateRounds.voting.votes && debateRounds.voting.votes.length > 0 && !debateRounds.completion && (
                      <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4 mb-3">
                        <div className="text-sm font-medium text-[#888] mb-3">🗳️ Röstning pågår...</div>
                        <div className="space-y-3">
                          {debateRounds.voting.votes.map((vote, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="text-[#888] font-medium mb-1">
                                {vote.voter.toUpperCase()} → {vote.votedFor.toUpperCase()}
                              </div>
                              {vote.message && (
                                <div className="text-[#666] mt-1 italic">
                                  "{vote.message}"
                                </div>
                              )}
                              {vote.huvudpunkter && vote.huvudpunkter.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-[#333]">
                                  <div className="text-[#555] text-[10px] mb-1">Huvudpunkter:</div>
                                  <ol className="list-decimal list-inside space-y-1">
                                    {vote.huvudpunkter.map((punkt, pidx) => (
                                      <li key={pidx} className="text-[#777] text-[11px]">
                                        {punkt}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Debate Completion */}
                    {debateRounds.completion && (
                      <DebateCompletionSection completion={debateRounds.completion} />
                    )}
                  </div>
                </div>
              );
            }
            
            // Regular message rendering
            return (
            <div 
              key={msg.debateMode && msg.debateData?._updateCounter ? `${msg.id}-debate-${msg.debateData._updateCounter}` : msg.id}
              ref={(el) => { if (el) messageRefs.current[msg.id] = el; }}
              className={`elegant-fade transition-all duration-500 ${msg.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'} ${isRecent ? '' : 'hover:opacity-100'} ${isHighlighted ? 'ring-2 ring-white/30 rounded-lg' : ''}`}
              style={{ 
                animationDelay: `${idx * 0.05}s`,
                opacity: isHighlighted ? 1 : opacityValue,
              }}
            >
              {/* Timestamp */}
              <p className={`text-[10px] mb-2 tracking-wide uppercase ${
                whiteMode ? 'text-[#bbb]' : 'text-[#3a3a3a]'
              }`}>
                {formatDate(msg.timestamp)} · {formatTime(msg.timestamp)}
                {msg.fromHistory && <span className="ml-2">(historik)</span>}
              </p>
              
              {msg.type === 'user' ? (
                <p className={`text-[18px] font-light text-right leading-relaxed max-w-2xl tracking-tight ${
                  whiteMode ? 'text-[#555]' : 'text-[#888]'
                }`}>
                  {convertEmojis(msg.text)}
                </p>
              ) : (
                <div className="max-w-4xl relative group">
                  {/* AI Meta */}
                  <div className={`text-[10px] mb-2 tracking-wide font-light uppercase flex items-center gap-3 ${
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
                          setShowDebatePanel(true);
                        }}
                        aria-label="Visa konsensus-debatt för detta svar"
                        className={`ml-2 px-2 py-0.5 rounded text-[9px] border transition-all ${
                          whiteMode 
                            ? 'border-[#ddd] hover:border-[#999] hover:bg-[#f5f5f5]' 
                            : 'border-[#333] hover:border-[#555] hover:bg-[#111]'
                        }`}
                      >
                        🔄 Konsensus
                      </button>
                    )}
                    
                    {/* Copy/Export dropdown - appears on hover */}
                    {!msg.isTyping && !msg.error && msg.text && (
                      <div className="relative ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            // Optional: show a brief "Kopierat!" feedback
                          }}
                          title="Kopiera svar"
                          className={`p-1.5 rounded transition-all ${
                            whiteMode 
                              ? 'text-[#888] hover:text-[#333] hover:bg-[#f0f0f0]' 
                              : 'text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Response text or Loading animation */}
                  {msg.isTyping && !currentTypingText ? (
                    <div className="flex items-center gap-4 py-4">
                      <div className={`text-[14px] font-light tracking-wide loading-pulse ${
                        whiteMode ? 'text-[#666]' : 'text-[#666]'
                      }`}>
                        {thinkingStep || (isStreaming ? '[tänker...] Genererar svar' : '[tänker...] Analyserar')}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full loading-dot-1 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                        <span className={`w-2 h-2 rounded-full loading-dot-2 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                        <span className={`w-2 h-2 rounded-full loading-dot-3 ${whiteMode ? 'bg-[#333]' : 'bg-white'}`} />
                      </div>
                      {/* Abort button when streaming */}
                      {isStreaming && (
                        <button
                          onClick={abortStream}
                          className={`ml-2 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
                            whiteMode 
                              ? 'text-red-600 hover:bg-red-100 border border-red-200' 
                              : 'text-red-400 hover:bg-red-900/30 border border-red-800/50'
                          }`}
                        >
                          Avbryt
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`max-w-none normalized-text ${msg.isTyping ? 'streaming-text' : ''}
                      ${whiteMode 
                        ? 'text-[#333]' 
                        : 'text-[#d0d0d0]'
                    } ${msg.error ? 'text-red-400' : ''}`}
                    style={{ 
                      fontSize: '15px', 
                      fontWeight: 400, 
                      lineHeight: 1.65, 
                      letterSpacing: '0.01em'
                    }}
                    >
                      <style>{`
                        .normalized-text h1, .normalized-text h2, .normalized-text h3, 
                        .normalized-text h4, .normalized-text h5, .normalized-text h6 {
                          font-size: inherit !important;
                          font-weight: inherit !important;
                          margin: 0.5em 0 !important;
                        }
                        .normalized-text strong, .normalized-text b {
                          font-weight: 500 !important;
                        }
                        .normalized-text em, .normalized-text i {
                          font-style: italic;
                        }
                        .normalized-text p {
                          margin: 0.4em 0 !important;
                        }
                        .normalized-text ul, .normalized-text ol {
                          margin: 0.4em 0 !important;
                          padding-left: 1.5em !important;
                        }
                        .normalized-text li {
                          margin: 0.15em 0 !important;
                        }
                        .normalized-text blockquote {
                          margin: 0.5em 0 !important;
                          padding-left: 1em !important;
                          border-left: 2px solid #666 !important;
                          font-style: inherit !important;
                        }
                        .normalized-text code {
                          font-family: inherit !important;
                          background: transparent !important;
                          padding: 0 !important;
                        }
                        .normalized-text pre {
                          margin: 0.5em 0 !important;
                          padding: 0.5em !important;
                          background: rgba(0,0,0,0.1) !important;
                          border-radius: 4px !important;
                          overflow-x: auto !important;
                        }
                        /* Typewriter cursor effect for streaming */
                        .streaming-text::after {
                          content: '▋';
                          display: inline;
                          color: #646cff;
                          animation: blink 1s step-end infinite;
                          margin-left: 2px;
                        }
                        @keyframes blink {
                          50% { opacity: 0; }
                        }
                      `}</style>
                      {/* Render debate with interactive rounds */}
                      {msg.debateMode && msg.debateData ? (
                        <div 
                          key={`debate-${msg.id}-${msg.debateData._updateCounter || 0}`}
                          className="debate-container"
                        >
                          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px'}}>
                            🎤 Live AI-Debatt
                          </h3>
                          <p style={{marginBottom: '20px'}}>
                            <strong>Fråga:</strong> {msg.debateData.question}
                          </p>
                          
                          {/* Interactive rounds */}
                          {msg.debateData.rounds && msg.debateData.rounds.map((round, idx) => (
                            round && (
                              <div key={idx} style={{marginBottom: '16px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden'}}>
                                <button
                                  onClick={() => toggleDebateRound(msg.id, idx)}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: whiteMode ? '#f5f5f5' : '#1a1a1a',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <span style={{fontSize: '20px'}}>
                                    {round.expanded !== false ? '▼' : '▶'}
                                  </span>
                                  <span>Runda {round.round}</span>
                                </button>
                                
                                {round.expanded !== false && (
                                  <div style={{padding: '16px', background: whiteMode ? '#fafafa' : '#0d0d0d'}}>
                                    {round.responses && round.responses.length > 0 ? (
                                      round.responses.map((resp, ridx) => (
                                        <div key={ridx} style={{marginBottom: '16px', paddingBottom: '16px', borderBottom: ridx < round.responses.length - 1 ? '1px solid #333' : 'none'}}>
                                          <div style={{fontWeight: 'bold', marginBottom: '8px', color: '#646cff'}}>
                                            {resp.agent.toUpperCase()} {resp.model && `(${resp.model})`}
                                          </div>
                                          <div style={{lineHeight: '1.6'}}>
                                            {resp.response}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div style={{fontStyle: 'italic', color: '#888'}}>
                                        Väntar på svar...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          ))}
                          
                          {/* Voting results */}
                          {msg.debateData.voteResults && msg.debateData.voteResults.length > 0 && (
                            <div style={{marginTop: '24px', marginBottom: '20px'}}>
                              <h4 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '12px'}}>
                                🗳️ Röstning
                              </h4>
                              {msg.debateData.voteResults.map((vote, idx) => (
                                <div key={idx} style={{marginBottom: '16px', paddingBottom: '12px', borderBottom: idx < msg.debateData.voteResults.length - 1 ? '1px solid #333' : 'none'}}>
                                  <div style={{marginBottom: '6px'}}>
                                    • <strong>{vote.voter.toUpperCase()}</strong> röstade på: <strong>{vote.voted_for.toUpperCase()}</strong>
                                  </div>
                                  {vote.motivation && (
                                    <div style={{fontSize: '13px', color: '#aaa', fontStyle: 'italic', marginLeft: '12px', marginTop: '4px'}}>
                                      "{vote.motivation}"
                                    </div>
                                  )}
                                  {vote.huvudpunkter && vote.huvudpunkter.length > 0 && (
                                    <div style={{marginLeft: '12px', marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #444'}}>
                                      <div style={{fontSize: '11px', color: '#666', marginBottom: '4px'}}>Huvudpunkter:</div>
                                      <ol style={{paddingLeft: '20px', margin: 0}}>
                                        {vote.huvudpunkter.map((punkt, pidx) => (
                                          <li key={pidx} style={{fontSize: '12px', color: '#888', marginBottom: '2px'}}>
                                            {punkt}
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Winner */}
                          {msg.debateData.winner && (
                            <div style={{marginTop: '24px', padding: '16px', background: whiteMode ? '#f0f9ff' : '#1a2332', borderRadius: '8px', marginBottom: '20px'}}>
                              <h4 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                                🏆 Vinnare: {msg.debateData.winner.toUpperCase()}
                              </h4>
                              <p>
                                <strong>Röster:</strong> {msg.debateData.winnerVotes}/{msg.debateData.voteResults?.length || 5}
                              </p>
                            </div>
                          )}
                          
                          {/* Summary - Parse structured or plain */}
                          {msg.debateData.summary && (() => {
                            const summary = msg.debateData.summary;
                            const hasStructure = summary.includes('**Tack till alla deltagare**') || 
                                                summary.includes('**Debattens utveckling**') ||
                                                summary.includes('**Varför');
                            
                            if (!hasStructure) {
                              // Plain summary
                              return (
                                <div style={{marginTop: '24px'}}>
                                  <h4 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '12px'}}>
                                    📋 Sammanfattning från Debattledaren
                                  </h4>
                                  <div style={{lineHeight: '1.6'}}>
                                    {summary}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Structured summary - parse sections
                            const sections = {};
                            const sectionMatches = summary.match(/\*\*([^*]+)\*\*\s*([^*]+?)(?=\*\*|$)/gs);
                            
                            if (sectionMatches) {
                              sectionMatches.forEach(match => {
                                const headerMatch = match.match(/\*\*([^*]+)\*\*/);
                                if (headerMatch) {
                                  const header = headerMatch[1].trim();
                                  const content = match.replace(/\*\*[^*]+\*\*/, '').trim();
                                  sections[header] = content;
                                }
                              });
                            }
                            
                            return (
                              <div style={{marginTop: '24px'}}>
                                <h4 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '16px'}}>
                                  📋 Sammanfattning från Debattledaren
                                </h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                                  {Object.entries(sections).map(([header, content], idx) => (
                                    <div key={idx} style={{paddingBottom: '12px', borderBottom: idx < Object.entries(sections).length - 1 ? '1px solid #333' : 'none'}}>
                                      <div style={{fontSize: '14px', fontWeight: '600', color: '#aaa', marginBottom: '6px'}}>
                                        {header}
                                      </div>
                                      <div style={{fontSize: '13px', lineHeight: '1.6', color: '#ccc'}}>
                                        {content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          
                        </div>
                      ) : msg.isRoundComplete ? (
                        /* Collapsible round message */
                        <details open={expandedRounds.has(msg.roundNumber)}>
                          <summary 
                            style={{
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              padding: '8px 0',
                              listStyle: 'none'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              const newExpanded = new Set(expandedRounds);
                              if (newExpanded.has(msg.roundNumber)) {
                                newExpanded.delete(msg.roundNumber);
                              } else {
                                newExpanded.add(msg.roundNumber);
                              }
                              setExpandedRounds(newExpanded);
                            }}
                          >
                            {expandedRounds.has(msg.roundNumber) ? '▼' : '▶'} 🎤 Runda {msg.roundNumber}
                          </summary>
                          <div style={{paddingLeft: '20px', marginTop: '12px'}}>
                            <ReactMarkdown>
                              {convertEmojis(msg.text)}
                            </ReactMarkdown>
                            
                            {/* Render ONESEEK reasoning as proper React component */}
                            {msg.oneseekReasoning && (
                              <details style={{marginTop: '16px', padding: '12px', borderLeft: '3px solid #4a90e2'}}>
                                <summary style={{cursor: 'pointer', fontWeight: '500', color: '#4a90e2'}}>
                                  📋 Tankekedja
                                </summary>
                                <div style={{fontSize: '0.9em', color: '#666', fontStyle: 'italic', padding: '10px 0', marginTop: '8px'}}>
                                  {msg.oneseekReasoning}
                                </div>
                              </details>
                            )}
                          </div>
                        </details>
                      ) : (
                        <ReactMarkdown>
                          {convertEmojis(msg.debateMode ? msg.text : (msg.isTyping ? currentTypingText : msg.text))}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  
                  {/* Live Thinking Step - Show current thinking while processing */}
                  {msg.isTyping && msg.currentThinkingStep && (
                    <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
                      whiteMode ? 'bg-blue-50' : 'bg-blue-900/20'
                    }`}>
                      <div className="animate-spin">⚙️</div>
                      <span className={`text-sm ${whiteMode ? 'text-blue-700' : 'text-blue-300'}`}>
                        {msg.currentThinkingStep}
                      </span>
                    </div>
                  )}
                  
                  {/* Thinking Chain - Using ThinkingChain component (NOT in debate mode!) */}
                  {!msg.debateMode && msg.thinkingChain && Array.isArray(msg.thinkingChain) && msg.thinkingChain.length > 0 && (
                    <div className="mt-4">
                      <ThinkingChain 
                        thinkingChain={msg.thinkingChain} 
                        isExpanded={false} // Always start collapsed (minimized)
                      />
                    </div>
                  )}
                  
                  {/* Follow-Up Buttons - Interactive yes/no for case law etc. */}
                  {!msg.debateMode && !msg.isTyping && msg.followUpOptions && Array.isArray(msg.followUpOptions) && msg.followUpOptions.length > 0 && (
                    <div className="mt-4">
                      <FollowUpButtons
                        options={msg.followUpOptions}
                        onOptionSelected={(option) => handleFollowUpSelection(option, msg.id)}
                        disabled={isTyping}
                      />
                    </div>
                  )}
                  
                  {/* Debug: Show follow-up status */}
                  {!msg.debateMode && !msg.isTyping && (
                    <div className="mt-2 text-[10px] text-[#444] font-mono">
                      {msg.followUpOptions ? 
                        `[DEBUG] followUpOptions: ${JSON.stringify(msg.followUpOptions).substring(0, 100)}...` : 
                        '[DEBUG] No followUpOptions'}
                    </div>
                  )}
                  
                  {/* Legacy text-based thinking chain (fallback, NOT in debate mode!) */}
                  {!msg.debateMode && msg.thinkingChain && !msg.isTyping && typeof msg.thinkingChain === 'string' && (
                    <details className={`mt-4 ${whiteMode ? 'bg-[#f8f8f8]' : 'bg-[#0a0a0a]'} rounded-lg overflow-hidden`}>
                      <summary className={`px-4 py-2 cursor-pointer text-[11px] font-medium uppercase tracking-wider flex items-center gap-2 ${
                        whiteMode ? 'text-[#666] hover:bg-[#f0f0f0]' : 'text-[#888] hover:bg-[#151515]'
                      } transition-colors`}>
                        <span>🧠</span>
                        <span>Tankekedja</span>
                        <span className={`ml-auto text-[10px] ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>
                          ({msg.thinkingChain.length} tecken)
                        </span>
                      </summary>
                      <div className={`px-4 py-3 text-[13px] font-light leading-relaxed border-t ${
                        whiteMode ? 'text-[#555] border-[#e0e0e0]' : 'text-[#999] border-[#222]'
                      }`}>
                        <pre className={`whitespace-pre-wrap font-mono text-[12px] ${
                          whiteMode ? 'text-[#444]' : 'text-[#aaa]'
                        }`}>{msg.thinkingChain}</pre>
                      </div>
                    </details>
                  )}
                  
                  {/* API Data Sources - Show which APIs were used */}
                  {msg.apiData && !msg.isTyping && Array.isArray(msg.apiData) && msg.apiData.length > 0 && (
                    <div className={`mt-3 flex flex-wrap items-center gap-2`}>
                      <span className={`text-[10px] uppercase tracking-wider ${
                        whiteMode ? 'text-[#999]' : 'text-[#555]'
                      }`}>
                        Källor:
                      </span>
                      {msg.apiData.map((api, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-[10px] rounded ${
                            api.success
                              ? whiteMode
                                ? 'bg-green-100 text-green-800'
                                : 'bg-green-900/30 text-green-300'
                              : whiteMode
                              ? 'bg-red-100 text-red-800'
                              : 'bg-red-900/30 text-red-300'
                          }`}
                        >
                          {api.source || api.api}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Token Metrics - Minimalist view matching llama frontend */}
                  {(msg.tokens || msg.tokensPerSecond || msg.promptTokens) && !msg.isTyping && (
                    <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] ${
                      whiteMode ? 'text-[#999]' : 'text-[#555]'
                    }`}>
                      {/* First row: tokens and tokens/s */}
                      <div className="flex items-center gap-4">
                        {msg.tokens && (
                          <span className="flex items-center gap-1">
                            <span className="opacity-60">tokens:</span>
                            <span className="font-medium">{msg.tokens}</span>
                          </span>
                        )}
                        {msg.tokensPerSecond && (
                          <span className="flex items-center gap-1">
                            <span className="opacity-60">tokens/s:</span>
                            <span className="font-medium">{msg.tokensPerSecond}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Second row: Context and Output (if available) */}
                      {(msg.promptTokens || msg.outputTokens) && (
                        <div className="flex items-center gap-4">
                          {msg.promptTokens && (
                            <span className="flex items-center gap-1">
                              <span className="opacity-60">Context:</span>
                              <span className="font-medium">
                                {msg.promptTokens}/{msg.contextWindow || 16384} ({Math.round((msg.promptTokens / (msg.contextWindow || 16384)) * 100)}%)
                              </span>
                            </span>
                          )}
                          {msg.outputTokens && (
                            <span className="flex items-center gap-1">
                              <span className="opacity-60">Output:</span>
                              <span className="font-medium">{msg.outputTokens}/∞</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons - Copy, Edit, Regenerate, Continue, Delete */}
                  {!msg.isTyping && !msg.error && msg.text && (
                    <div className={`mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                      {/* Copy */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          // Optional: show brief feedback
                        }}
                        title="Kopiera svar"
                        className={`p-1.5 rounded transition-all ${
                          whiteMode 
                            ? 'text-[#888] hover:text-[#333] hover:bg-[#f0f0f0]' 
                            : 'text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* Edit */}
                      <button
                        onClick={() => {
                          // Set the message text as input for editing
                          setMessageInput(msg.text);
                          // Optional: scroll to input
                        }}
                        title="Redigera och skicka igen"
                        className={`p-1.5 rounded transition-all ${
                          whiteMode 
                            ? 'text-[#888] hover:text-[#333] hover:bg-[#f0f0f0]' 
                            : 'text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {/* Regenerate */}
                      <button
                        onClick={() => {
                          // Find the user message that triggered this response
                          const msgIndex = messages.findIndex(m => m.id === msg.id);
                          if (msgIndex > 0) {
                            const userMsg = messages[msgIndex - 1];
                            if (userMsg && userMsg.type === 'user') {
                              // Resend the user's question
                              setMessageInput(userMsg.text);
                              // Trigger send
                              setTimeout(() => {
                                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                document.querySelector('form')?.dispatchEvent(submitEvent);
                              }, 100);
                            }
                          }
                        }}
                        title="Regenerera svar"
                        className={`p-1.5 rounded transition-all ${
                          whiteMode 
                            ? 'text-[#888] hover:text-[#333] hover:bg-[#f0f0f0]' 
                            : 'text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      
                      {/* Continue */}
                      <button
                        onClick={() => {
                          // Add the current response text to input and let user continue
                          setMessageInput(`Fortsätt från: "${msg.text.slice(-50)}..."`);
                        }}
                        title="Fortsätt svaret"
                        className={`p-1.5 rounded transition-all ${
                          whiteMode 
                            ? 'text-[#888] hover:text-[#333] hover:bg-[#f0f0f0]' 
                            : 'text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => {
                          // Remove this message and potentially the user message before it
                          const msgIndex = messages.findIndex(m => m.id === msg.id);
                          setMessages(prev => {
                            const updated = [...prev];
                            // Remove AI message
                            updated.splice(msgIndex, 1);
                            // Also remove the user message if it's right before
                            if (msgIndex > 0 && updated[msgIndex - 1]?.type === 'user') {
                              updated.splice(msgIndex - 1, 1);
                            }
                            return updated;
                          });
                        }}
                        title="Ta bort meddelande"
                        className={`p-1.5 rounded transition-all ${
                          whiteMode 
                            ? 'text-[#888] hover:text-red-600 hover:bg-[#f0f0f0]' 
                            : 'text-[#555] hover:text-red-400 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* ONESEEK Δ+ Typo Correction Buttons */}
                  {msg.showTypoButtons && msg.typoCorrection && (
                    <div className={`mt-4 flex gap-3 ${whiteMode ? '' : ''}`}>
                      <button
                        onClick={() => acceptTypoCorrection(msg.id, msg.typoCorrection.corrected)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          whiteMode
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-green-600 text-white hover:bg-green-500'
                        }`}
                      >
                        Ja, korrigera ✓
                      </button>
                      <button
                        onClick={() => sendOriginalQuestion(msg.id, msg.typoCorrection.original)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                          whiteMode
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Nej, skicka som det är
                      </button>
                    </div>
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
          );
          })}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ===== DEBATE PANEL (Modal) ===== */}
      {showDebatePanel && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" 
          onClick={() => setShowDebatePanel(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="debate-panel-title"
        >
          <div 
            className={`rounded-xl p-6 max-w-md w-full mx-4 ${
              whiteMode ? 'bg-white shadow-xl' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 
              id="debate-panel-title"
              className={`text-[14px] font-medium tracking-wide uppercase mb-4 ${
              whiteMode ? 'text-[#333]' : 'text-white'
            }`}>
              Konsensus-debatt
            </h3>
            <p className={`text-[12px] mb-4 ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>
              Så här nådde vi {metrics.consensus}% konsensus:
            </p>
            
            {/* Coming soon notice */}
            <div className={`text-[10px] uppercase tracking-wide mb-3 px-2 py-1 rounded inline-block ${
              whiteMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-900/30 text-amber-400'
            }`}>
              🔜 Kommer snart - mockdata visas
            </div>
            
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
              aria-label="Stäng konsensus-debatt"
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

      {/* ===== EXTERNAL RESPONSES PANEL (Compare Mode) ===== */}
      {compareMode && externalResponses.length > 0 && (
        <div 
          className={`fixed right-0 top-[120px] bottom-[200px] z-35 w-[400px] transition-all duration-500 ease-out ${
            showExternalResponses ? 'translate-x-0' : 'translate-x-[390px]'
          } ${whiteMode ? 'bg-[#f5f5f5] border-l border-[#e0e0e0]' : 'bg-[#0c0c0c] border-l border-[#1a1a1a]'}`}
          style={{ right: sidebarExpanded ? '280px' : '4px' }}
        >
          {/* Toggle tab */}
          <button
            onClick={() => setShowExternalResponses(prev => !prev)}
            className={`absolute left-0 top-4 -translate-x-full px-2 py-4 rounded-l-lg text-[10px] uppercase tracking-wider transition-all ${
              whiteMode 
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
            }`}
          >
            {showExternalResponses ? '→' : '← Externa'}
          </button>
          
          <div className="p-4 h-full overflow-y-auto">
            <h3 className={`text-[12px] uppercase tracking-wider font-medium mb-4 ${
              whiteMode ? 'text-[#333]' : 'text-[#888]'
            }`}>
              Externa AI-svar ({externalResponses.length})
            </h3>
            
            {/* MTA-16 Analysis Section */}
            {showMTA16Analysis && (
              <div className="mb-4">
                <button
                  onClick={() => setShowMTA16Analysis(prev => !prev)}
                  className={`mb-3 px-3 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                    whiteMode 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                  }`}
                >
                  {showMTA16Analysis ? '✓' : '○'} MTA-16 Analys
                </button>
                <MTA16Analysis externalResponses={externalResponses} whiteMode={whiteMode} />
              </div>
            )}
            
            {/* External Responses List */}
            <div className="space-y-4 mt-4">
              {externalResponses.map((ext, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg ${
                    whiteMode ? 'bg-white border border-[#e0e0e0]' : 'bg-[#111] border border-[#1a1a1a]'
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-wide font-medium mb-2 ${
                    whiteMode ? 'text-purple-600' : 'text-purple-400'
                  }`}>
                    {ext.agent}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${
                    whiteMode ? 'text-[#555]' : 'text-[#888]'
                  }`}>
                    {ext.response}
                  </p>
                  {ext.pipelineAnalysis && (
                    <div className={`mt-2 pt-2 border-t ${
                      whiteMode ? 'border-[#e0e0e0]' : 'border-[#1a1a1a]'
                    }`}>
                      <span className={`text-[9px] uppercase tracking-wider ${
                        whiteMode ? 'text-[#999]' : 'text-[#666]'
                      }`}>
                        ✓ Pipeline-analys tillgänglig
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== INPUT AREA ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 transition-all duration-500" style={{ right: sidebarExpanded ? '280px' : '4px' }}>
        <div className={`px-24 pb-10 pt-6 ${
          whiteMode 
            ? 'bg-gradient-to-t from-[#fafafa] via-[#fafafa]/98 to-transparent' 
            : 'bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/98 to-transparent'
        }`}>
          {/* Wider max-width for 4K screens - matches chat area */}
          <div className="max-w-5xl mx-auto">
            
            {/* Character/Persona Selection */}
            {/* ONESEEK Δ+ v6.5 (PR#101): Character/Persona Selection with Override Mode Toggle */}
            <div className="flex flex-col items-center gap-3 mb-6">
              {/* Override mode toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleOverrideMode}
                  className={`text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded transition-all duration-300 ${
                    overrideMode
                      ? (whiteMode ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-orange-900/30 text-orange-400 border border-orange-700/50')
                      : (whiteMode ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]')
                  }`}
                >
                  {overrideMode ? '⏳ Nästa fråga' : '📌 Permanent'}
                </button>
                <span className={`text-[9px] ${whiteMode ? 'text-[#999]' : 'text-[#555]'}`}>
                  {overrideMode ? 'Val gäller endast nästa fråga' : 'Val gäller tills det ändras'}
                </span>
                
                {/* Streaming Mode toggle */}
                <button
                  type="button"
                  onClick={() => setStreamingEnabled(prev => !prev)}
                  title={streamingEnabled ? 'Använder äkta SSE token-streaming (realtid)' : 'Använder standard API + animerad text'}
                  className={`ml-4 text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded transition-all duration-300 ${
                    streamingEnabled
                      ? (whiteMode ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-900/30 text-green-400 border border-green-700/50')
                      : (whiteMode ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]')
                  }`}
                >
                  {streamingEnabled ? '🌊 Streaming ON' : '📝 Streaming OFF'}
                </button>
                
                {/* Compare Mode toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setCompareMode(prev => {
                      const newMode = !prev;
                      // Auto-show Tankekedja when compare mode is enabled
                      if (newMode) {
                        setShowTankekedja(true);
                        setShowExternalResponses(true); // Also show external responses panel
                      }
                      return newMode;
                    });
                    if (debateMode) setDebateMode(false); // Turn off debate when compare is on
                  }}
                  className={`ml-4 text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded transition-all duration-300 ${
                    compareMode
                      ? (whiteMode ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-purple-900/30 text-purple-400 border border-purple-700/50')
                      : (whiteMode ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]')
                  }`}
                >
                  {compareMode ? '🔬 Compare ON' : '🔬 Compare OFF'}
                </button>
                
                {/* Debate Mode toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setDebateMode(prev => !prev);
                    if (compareMode) setCompareMode(false); // Turn off compare when debate is on
                  }}
                  className={`ml-2 text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded transition-all duration-300 ${
                    debateMode
                      ? (whiteMode ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-900/30 text-green-400 border border-green-700/50')
                      : (whiteMode ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]')
                  }`}
                >
                  {debateMode ? '🎤 Debatt ON' : '🎤 Debatt OFF'}
                </button>
                {compareMode && (
                  <>
                    {/* Chunked Mode toggle */}
                    <button
                      type="button"
                      onClick={() => setChunkedMode(prev => !prev)}
                      title={chunkedMode ? 'Analyserar en AI åt gången (långsammare men mer pålitligt)' : 'Analyserar alla samtidigt (snabbare)'}
                      className={`text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded transition-all duration-300 ${
                        chunkedMode
                          ? (whiteMode ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-orange-900/30 text-orange-400 border border-orange-700/50')
                          : (whiteMode ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]')
                      }`}
                    >
                      {chunkedMode ? '🔄 Stegvis ON' : '⚡ Stegvis OFF'}
                    </button>
                    <span className={`text-[9px] ${whiteMode ? 'text-purple-600' : 'text-purple-400'}`}>
                      {chunkedMode ? 'Analyserar en i taget' : `Syntetiserar från ${EXTERNAL_AI_MODELS.join(', ')}`}
                    </span>
                  </>
                )}
              </div>
              
              {/* Persona buttons */}
              <div className="flex justify-center gap-8" role="radiogroup" aria-label="Välj AI-persona">
                {AVAILABLE_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona.id, overrideMode)}
                    aria-label={`Välj ${persona.name} persona`}
                    aria-pressed={selectedPersona === persona.id}
                    role="radio"
                    aria-checked={selectedPersona === persona.id}
                    className={`text-[11px] tracking-[0.12em] transition-all duration-300 flex items-center gap-1 ${
                      selectedPersona === persona.id 
                        ? (whiteMode ? 'text-[#333]' : 'text-white')
                        : (whiteMode ? 'text-[#bbb] hover:text-[#666]' : 'text-[#3a3a3a] hover:text-[#666]')
                    }`}
                  >
                    <span>{persona.icon}</span>
                    <span>{persona.name}</span>
                    {/* Show override indicator */}
                    {selectedPersona === persona.id && overridePending.active && overridePending.personality_id === persona.id && (
                      <span className="text-[8px] ml-1 text-orange-400">⏳</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ONESEEK Δ+ Typo Suggestion */}
            {typoSuggestion && (
              <div className={`mb-3 px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-300 ${
                whiteMode 
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-amber-900/30 border border-amber-700/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">✏️</span>
                  <span className="text-sm">{typoSuggestion.message}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptTypoSuggestion}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      whiteMode
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
                  >
                    Ja ✓
                  </button>
                  <button
                    type="button"
                    onClick={dismissTypoSuggestion}
                    className={`px-3 py-1 rounded-lg text-xs transition-all ${
                      whiteMode
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Nej
                  </button>
                </div>
              </div>
            )}

            {/* Conversation History Indicator */}
            {conversationHistory.length > 0 && (
              <div className={`mb-3 flex items-center justify-between px-2 ${
                whiteMode ? 'text-[#666]' : 'text-[#888]'
              }`}>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="opacity-60">💬</span>
                  <span>{conversationHistory.length / 2} {conversationHistory.length / 2 === 1 ? 'tidigare meddelande' : 'tidigare meddelanden'} i kontext</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConversationHistory([]);
                    console.log('[7B-Zero] Conversation history cleared');
                  }}
                  className={`text-[10px] px-2 py-1 rounded transition-all ${
                    whiteMode
                      ? 'hover:bg-[#f0f0f0] text-[#999] hover:text-[#666]'
                      : 'hover:bg-[#1a1a1a] text-[#666] hover:text-[#aaa]'
                  }`}
                  title="Rensa konversationshistorik"
                >
                  Rensa historik
                </button>
              </div>
            )}

            {/* Input Field */}
            <form onSubmit={handleSubmit} className="relative">
              <label htmlFor="chat-input" className="sr-only">Ställ en fråga</label>
              <input
                id="chat-input"
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={`Ställ en fråga till ${characterData?.name || 'OneSeek'}...`}
                disabled={isTyping}
                aria-label={`Ställ en fråga till ${characterData?.name || 'OneSeek'}`}
                className={`w-full rounded-xl px-6 py-5 text-[16px] placeholder-opacity-60 focus:outline-none transition-all duration-300 font-light tracking-wide disabled:opacity-50 ${
                  whiteMode 
                    ? 'bg-white border border-[#e0e0e0] focus:border-[#999] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] text-[#333] placeholder-[#999]' 
                    : 'bg-[#151515] border border-[#2a2a2a] focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)] text-white placeholder-[#555]'
                }`}
              />
              
              {/* Send Button */}
              <button 
                type="submit"
                disabled={isTyping || !messageInput.trim()}
                aria-label="Skicka fråga"
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  messageInput && !isTyping
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  whiteMode 
                    ? 'bg-[#333] hover:bg-[#222] text-white' 
                    : 'bg-white hover:bg-[#e7e7e7] text-[#0a0a0a]'
                }`}>
                  <span className="text-[14px] font-medium">→</span>
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
        Q = Quantum · F = Focus · W = White · T = Tankekedja
      </div>

      {/* Tankekedja Sidebar - Real-time Transparency */}
      {(debateMode || compareMode) && (
        <Tankekedja 
          events={debateMode ? tankekedjaEvents : compareThinkingEvents} 
          isVisible={showTankekedja}
          onToggle={() => setShowTankekedja(!showTankekedja)}
        />
      )}
    </div>
  );
}
