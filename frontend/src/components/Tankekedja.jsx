/**
 * Tankekedja Component - Real-time Debate Transparency Sidebar
 * 
 * Displays a live stream of all debate processing steps including:
 * - User questions
 * - API calls (with timing)
 * - MTA-DO analyses
 * - OneSeek reasoning  
 * - Blockchain verification
 * - Timestamped logs
 * 
 * Features:
 * - Real-time WebSocket event streaming
 * - Collapsible sections
 * - Color-coded event types
 * - Auto-scroll to latest
 * - Blockchain verification indicators
 */

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader, Lock, Eye, MessageSquare, BarChart3, Vote, Trophy, Clock } from 'lucide-react';

/**
 * Get icon and color for event type
 */
function getEventStyle(eventType) {
  const styles = {
    // User & System
    'user_question': { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Användare' },
    'debate_start': { icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Debattstart' },
    'debate_init': { icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Debatt initierad' },
    'debate_intro': { icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Debatt intro' },
    'thinking': { icon: Loader, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Bearbetar', spin: true },
    
    // Round management
    'round_start': { icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Runda start' },
    'round_end': { icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Runda avslutad' },
    'round_summary': { icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Rundsammanfattning' },
    
    // AI Responses
    'ai_response': { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'AI-svar' },
    'oneseek_echo_start': { icon: Eye, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'OneSeek eko' },
    'oneseek_echo': { icon: Eye, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'OneSeek eko' },
    
    // Analysis
    'mta_analysis': { icon: BarChart3, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'MTA-DO Analys' },
    'oneseek_reasoning': { icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'OneSeek analys' },
    'live_insight': { icon: Eye, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Insikt' },
    
    // OneSeek's own answer
    'oneseek_own_answer_start': { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'OneSeek svarar' },
    'oneseek_own_answer': { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'OneSeek svar' },
    'oneseek_own_reasoning': { icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'OneSeek resonemang' },
    
    // Voting
    'voting_intro': { icon: Vote, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Röstning startar' },
    'vote_received': { icon: Vote, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Röst mottagen' },
    'winner': { icon: Trophy, color: 'text-gold-400', bg: 'bg-yellow-500/10', label: 'Vinnare' },
    
    // Completion
    'debate_complete': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Debatt avslutad' },
    
    // Blockchain (new)
    'blockchain_lock': { icon: Lock, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Blockchain lås' },
    'blockchain_verify': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Blockchain verifiering' },
    
    // Error
    'error': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Fel' },
  };
  
  return styles[eventType] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Event' };
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
}

/**
 * Calculate duration between two timestamps
 */
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const duration = new Date(endTime) - new Date(startTime);
  return duration > 0 ? `${duration}ms` : null;
}

/**
 * Individual event item
 */
function EventItem({ event, index, previousEvent }) {
  const [expanded, setExpanded] = useState(false);
  const style = getEventStyle(event.type);
  const Icon = style.icon;
  
  // Calculate duration from previous event
  const duration = previousEvent?.timestamp ? calculateDuration(previousEvent.timestamp, event.timestamp) : null;
  
  // Determine if event has expandable content
  const hasDetails = event.message || event.agent || event.round || event.analysis || event.motivation || event.text;
  
  return (
    <div className="border-b border-[#1a1a1a] last:border-0">
      <div 
        className={`flex items-start gap-2 p-2 hover:bg-[#111] transition-colors ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Icon */}
        <div className={`${style.bg} rounded p-1.5 mt-0.5 flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${style.color} ${style.spin ? 'animate-spin' : ''}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#ddd] truncate">
                {style.label}
                {event.agent && ` - ${event.agent.toUpperCase()}`}
                {event.round && ` (Runda ${event.round})`}
              </div>
              {event.text && !expanded && (
                <div className="text-xs text-[#888] truncate mt-0.5">
                  {event.text.substring(0, 50)}...
                </div>
              )}
              {event.message && !expanded && (
                <div className="text-xs text-[#888] truncate mt-0.5">
                  {event.message.substring(0, 50)}...
                </div>
              )}
            </div>
            
            {/* Timestamp & Duration */}
            <div className="flex flex-col items-end gap-0.5 text-[10px] text-[#666] whitespace-nowrap flex-shrink-0">
              <span>{formatTimestamp(event.timestamp)}</span>
              {duration && (
                <span className="text-[#555]">+{duration}</span>
              )}
            </div>
          </div>
          
          {/* Expanded details */}
          {expanded && hasDetails && (
            <div className="mt-2 text-xs text-[#aaa] space-y-1">
              {event.message && (
                <div className="text-[#888]">{event.message}</div>
              )}
              {event.text && event.type !== 'oneseek_echo' && (
                <div className="text-[#aaa] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {event.text}
                </div>
              )}
              {event.analysis && (
                <div className="bg-[#0a0a0a] rounded p-2 mt-1">
                  <div className="text-[#888] font-medium mb-1">MTA-DO Poäng:</div>
                  {event.analysis.summary && (
                    <div className="text-[#aaa]">
                      Score: {event.analysis.summary.weighted_score?.toFixed(1) || 'N/A'}/10
                    </div>
                  )}
                </div>
              )}
              {event.motivation && (
                <div className="text-[#aaa] italic">"{event.motivation}"</div>
              )}
              {event.voted_for && (
                <div className="text-[#aaa]">
                  Röstade på: <span className="text-[#ddd] font-medium">{event.voted_for.toUpperCase()}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Expand indicator */}
        {hasDetails && (
          <div className="text-[#555] text-xs mt-1 flex-shrink-0">
            {expanded ? '▼' : '▶'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Tankekedja Component
 */
export default function Tankekedja({ events = [], isVisible = true, onToggle }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventsEndRef = useRef(null);
  const containerRef = useRef(null);
  
  // Auto-scroll to latest event
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);
  
  // Check if user has scrolled up (disable auto-scroll)
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`fixed right-0 top-0 h-full bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col transition-all duration-300 z-40 ${isCollapsed ? 'w-12' : 'w-80'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a]">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#888]" />
              <span className="text-sm font-medium text-[#ddd]">Tankekedja</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Event count */}
              <span className="text-xs text-[#666]">
                {events.length}
              </span>
              {/* Collapse button */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded hover:bg-[#1a1a1a] transition-colors"
                title="Minimera sidebar"
              >
                <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded hover:bg-[#1a1a1a] transition-colors mx-auto"
            title="Expandera sidebar"
          >
            <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Events list */}
      {!isCollapsed && (
        <>
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {events.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#666]">
                Inga händelser ännu...
              </div>
            ) : (
              <div>
                {events.map((event, index) => (
                  <EventItem 
                    key={index} 
                    event={event} 
                    index={index}
                    previousEvent={index > 0 ? events[index - 1] : null}
                  />
                ))}
                <div ref={eventsEndRef} />
              </div>
            )}
          </div>
          
          {/* Auto-scroll indicator */}
          {!autoScroll && events.length > 0 && (
            <button
              onClick={() => {
                setAutoScroll(true);
                eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="absolute bottom-4 right-4 bg-[#1a1a1a] hover:bg-[#222] text-[#888] text-xs px-3 py-1.5 rounded-full border border-[#333] shadow-lg transition-colors"
            >
              ↓ Scrolla till senaste
            </button>
          )}
        </>
      )}
    </div>
  );
}
