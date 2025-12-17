/**
 * Tankekedja Component - Interactive Tree Structure for Debate Flow
 * 
 * Displays the complete debate flow as a hierarchical tree structure:
 * - Question (root)
 * - Rounds with randomized agent order
 * - Individual responses with nested MTA-DO analysis, commentary, and insights
 * - Voting and final summary
 * 
 * Features:
 * - Real-time tree building as debate progresses
 * - Clickable/expandable nodes for detailed view
 * - Shows exact dependencies and process flow
 * - Better transparency and pedagogical value
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Eye, MessageSquare, BarChart3, Vote, Trophy, AlertCircle } from 'lucide-react';

/**
 * Build tree structure from flat events
 */
function buildTreeStructure(events) {
  const tree = {
    type: 'root',
    children: []
  };
  
  // Find question
  const questionEvent = events.find(e => e.type === 'user_question');
  if (!questionEvent) return tree;
  
  const questionNode = {
    id: 'question',
    type: 'question',
    label: 'Fråga (Input)',
    text: questionEvent.text,
    timestamp: questionEvent.timestamp,
    children: []
  };
  
  // Group events by round
  const rounds = {};
  const voting = { votes: [], winner: null };
  const final = [];
  
  events.forEach(event => {
    if (event.round) {
      if (!rounds[event.round]) {
        rounds[event.round] = {
          id: `round-${event.round}`,
          type: 'round',
          round: event.round,
          label: `Runda ${event.round}`,
          agents: {},
          children: []
        };
      }
      
      const round = rounds[event.round];
      
      // Handle agent responses
      if (event.type === 'ai_response' && event.agent) {
        if (!round.agents[event.agent]) {
          round.agents[event.agent] = {
            id: `r${event.round}-${event.agent}`,
            type: 'agent_response',
            agent: event.agent,
            label: `${event.agent.toUpperCase()} svar`,
            text: event.text,
            timestamp: event.timestamp,
            children: []
          };
        }
      }
      
      // Handle MTA-DO analysis
      if (event.type === 'mta_analysis' && event.agent) {
        const agentNode = round.agents[event.agent];
        if (agentNode) {
          agentNode.children.push({
            id: `mta-${event.agent}-${event.round}`,
            type: 'mta_analysis',
            label: 'MTA-DO Analys',
            analysis: event.analysis,
            timestamp: event.timestamp,
            children: []
          });
        }
      }
      
      // Handle OneSeek reasoning
      if (event.type === 'oneseek_reasoning' && event.agent) {
        const agentNode = round.agents[event.agent];
        if (agentNode) {
          agentNode.children.push({
            id: `reasoning-${event.agent}-${event.round}`,
            type: 'oneseek_reasoning',
            label: 'ONESEEK Commentary',
            text: event.text || event.message,
            timestamp: event.timestamp,
            children: []
          });
        }
      }
      
      // Handle insights
      if (event.type === 'live_insight' && event.agent) {
        const agentNode = round.agents[event.agent];
        if (agentNode) {
          agentNode.children.push({
            id: `insight-${event.agent}-${event.round}`,
            type: 'live_insight',
            label: 'Insight',
            text: event.text || event.message,
            timestamp: event.timestamp,
            children: []
          });
        }
      }
      
      // Handle OneSeek's own answer
      if (event.type === 'oneseek_own_answer' && event.round === event.round) {
        round.oneseek_answer = {
          id: `oneseek-answer-${event.round}`,
          type: 'oneseek_answer',
          label: 'ONESEEK Huvudbidrag (Syntes)',
          text: event.text,
          timestamp: event.timestamp,
          children: []
        };
      }
      
      // Handle round summary
      if (event.type === 'round_summary') {
        round.summary = {
          id: `summary-${event.round}`,
          type: 'round_summary',
          label: 'Rundsammanfattning',
          data: event.data,
          timestamp: event.timestamp,
          children: []
        };
      }
    }
    
    // Handle voting
    if (event.type === 'vote_received') {
      voting.votes.push({
        id: `vote-${event.voter || Date.now()}`,
        type: 'vote',
        label: `${(event.voter || event.agent || 'Unknown').toUpperCase()} röstar`,
        voted_for: event.voted_for,
        motivation: event.motivation,
        timestamp: event.timestamp,
        children: []
      });
    }
    
    if (event.type === 'winner') {
      voting.winner = {
        id: 'winner',
        type: 'winner',
        label: `🏆 Vinnare: ${event.winner?.toUpperCase() || 'N/A'}`,
        winner: event.winner,
        votes: event.winner_votes,
        timestamp: event.timestamp,
        children: []
      };
    }
    
    // Handle final summary
    if (event.type === 'debate_complete') {
      final.push({
        id: 'final',
        type: 'final_summary',
        label: 'Final Sammanfattning (ONESEEK)',
        data: event.data,
        timestamp: event.timestamp,
        children: []
      });
    }
  });
  
  // Build round children
  Object.values(rounds).forEach(round => {
    // Add agent nodes in order they appear
    Object.values(round.agents).forEach(agentNode => {
      round.children.push(agentNode);
    });
    
    // Add OneSeek's answer
    if (round.oneseek_answer) {
      round.children.push(round.oneseek_answer);
    }
    
    // Add round summary
    if (round.summary) {
      round.children.push(round.summary);
    }
    
    questionNode.children.push(round);
  });
  
  // Add voting section
  if (voting.votes.length > 0 || voting.winner) {
    const votingNode = {
      id: 'voting',
      type: 'voting_section',
      label: 'Röstning',
      children: [...voting.votes]
    };
    
    if (voting.winner) {
      votingNode.children.push(voting.winner);
    }
    
    questionNode.children.push(votingNode);
  }
  
  // Add final summary
  final.forEach(f => questionNode.children.push(f));
  
  tree.children.push(questionNode);
  return tree;
}

/**
 * Format UTC timestamp
 */
function formatUTCTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return timestamp;
  }
}

/**
 * Calculate duration in seconds
 */
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  try {
    const duration = (new Date(endTime) - new Date(startTime)) / 1000;
    return duration > 0 ? duration.toFixed(1) + ' sek' : null;
  } catch {
    return null;
  }
}

/**
 * Tree Node Component with Detailed Information Display
 */
function TreeNode({ node, depth = 0, isLast = false, parentPath = '', previousNode = null }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showRawJSON, setShowRawJSON] = useState(false);
  
  const hasChildren = node.children && node.children.length > 0;
  const indent = depth * 20;
  const duration = previousNode?.timestamp ? calculateDuration(previousNode.timestamp, node.timestamp) : null;
  
  // Get icon and color based on node type
  const getNodeStyle = () => {
    switch (node.type) {
      case 'question':
        return { icon: MessageSquare, color: 'text-blue-400', label: node.label };
      case 'round':
        return { icon: Eye, color: 'text-cyan-400', label: node.label };
      case 'agent_response':
        return { icon: MessageSquare, color: 'text-emerald-400', label: node.label };
      case 'mta_analysis':
        return { icon: BarChart3, color: 'text-orange-400', label: node.label };
      case 'oneseek_reasoning':
        return { icon: BarChart3, color: 'text-pink-400', label: node.label };
      case 'live_insight':
        return { icon: Eye, color: 'text-violet-400', label: '💡 ' + node.label };
      case 'oneseek_answer':
        return { icon: MessageSquare, color: 'text-blue-400', label: node.label };
      case 'voting_section':
        return { icon: Vote, color: 'text-amber-400', label: node.label };
      case 'vote':
        return { icon: Vote, color: 'text-amber-300', label: node.label };
      case 'winner':
        return { icon: Trophy, color: 'text-yellow-400', label: node.label };
      case 'final_summary':
        return { icon: BarChart3, color: 'text-green-400', label: node.label };
      default:
        return { icon: Eye, color: 'text-gray-400', label: node.label || 'Node' };
    }
  };
  
  const style = getNodeStyle();
  const Icon = style.icon;
  
  // Determine if node has details to show
  const hasDetails = node.text || node.analysis || node.motivation || node.data;
  
  return (
    <div className="relative">
      {/* Tree line */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 w-px bg-[#333] h-6"
          style={{ left: `${indent - 10}px` }}
        />
      )}
      
      {/* Node */}
      <div 
        className="flex items-start gap-2 py-1 hover:bg-[#111] transition-colors group"
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Branch line */}
        {depth > 0 && (
          <div className="relative" style={{ width: '10px', height: '24px', marginLeft: '-10px' }}>
            <div className="absolute left-0 top-3 w-full h-px bg-[#333]" />
            {!isLast && (
              <div className="absolute left-0 top-3 w-px h-full bg-[#333]" />
            )}
          </div>
        )}
        
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-4 h-4 text-[#666] hover:text-[#888] transition-colors mt-1"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-3.5 h-3.5 ${style.color}`} />
        </div>
        
        {/* Label */}
        <div className="flex-1 min-w-0">
          <div 
            className={`text-xs font-medium text-[#ddd] ${hasDetails ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetails && setShowDetails(!showDetails)}
          >
            {style.label}
            {node.voted_for && (
              <span className="text-[#aaa] ml-1">→ {node.voted_for.toUpperCase()}</span>
            )}
          </div>
          
          {/* Detailed Information Panel */}
          {showDetails && hasDetails && (
            <div className="mt-2 text-[11px] space-y-2 bg-[#0a0a0a] rounded p-3 border border-[#1a1a1a]">
              {/* Timestamp Information */}
              {node.timestamp && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">⏰ Tidsinformation</div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">Starttid:</span> {formatUTCTimestamp(node.timestamp)}
                  </div>
                  {duration && (
                    <div className="text-[#aaa]">
                      <span className="text-[#888]">Tid från föregående:</span> {duration}
                    </div>
                  )}
                </div>
              )}

              {/* Agent Response Details */}
              {node.type === 'agent_response' && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">📡 API-anrop</div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">API:</span> {node.agent?.toUpperCase()} API
                  </div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">Tokens ut:</span> {node.tokens_out || 'N/A'}
                  </div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">Tokens in:</span> {node.tokens_in || 'N/A'}
                  </div>
                  <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-[#66a] hover:text-[#88c] underline text-[10px] mt-1"
                  >
                    [Klicka för skickad payload (råJSON)]
                  </button>
                </div>
              )}

              {/* Response Text */}
              {node.text && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">💬 Svar</div>
                  <div className="text-[#aaa] whitespace-pre-wrap max-h-40 overflow-y-auto bg-[#050505] rounded p-2">
                    {node.text}
                  </div>
                  <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-[#66a] hover:text-[#88c] underline text-[10px]"
                  >
                    [Klicka för råsvar]
                  </button>
                </div>
              )}
              
              {/* MTA-DO Analysis with 6 Dimensions */}
              {node.analysis && (
                <div className="space-y-2 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">📊 MTA-DO Analys (6 dimensioner)</div>
                  
                  {/* Overall Score */}
                  {node.analysis.summary && (
                    <div className="bg-[#050505] rounded p-2 space-y-1">
                      <div className="text-[#aaa]">
                        <span className="text-[#888]">Vägt poäng:</span>{' '}
                        <span className="text-[#0a0] font-bold">
                          {node.analysis.summary.weighted_score?.toFixed(1) || 'N/A'}/10
                        </span>
                      </div>
                      {node.analysis.summary.overall_score !== undefined && (
                        <div className="text-[#aaa]">
                          <span className="text-[#888]">Övergripande poäng:</span>{' '}
                          {node.analysis.summary.overall_score.toFixed(1)}/10
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 6 Dimensions */}
                  {node.analysis && (
                    <div className="space-y-1.5 bg-[#050505] rounded p-2">
                      {['relevance', 'argument_depth', 'factual_anchoring', 'clarity', 'logical_coherence', 'risk_hallucination'].map((dim, idx) => {
                        const dimData = node.analysis[dim];
                        if (!dimData) return null;
                        
                        const labels = {
                          relevance: '1. Relevans',
                          argument_depth: '2. Argumentdjup',
                          factual_anchoring: '3. Faktaförankring',
                          clarity: '4. Klarhet',
                          logical_coherence: '5. Logisk koherens',
                          risk_hallucination: '6. Risk/Hallucination'
                        };
                        
                        return (
                          <div key={dim} className="text-[10px]">
                            <div className="text-[#888]">{labels[dim]}:</div>
                            <div className="text-[#aaa] ml-2">
                              Poäng: <span className="text-[#0a0]">{dimData.score?.toFixed(1) || 'N/A'}/10</span>
                            </div>
                            {dimData.reasoning && (
                              <div className="text-[#777] ml-2 italic text-[9px]">
                                {dimData.reasoning}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Strengths & Weaknesses */}
                  {node.analysis.summary && (
                    <div className="space-y-1">
                      {node.analysis.summary.strengths && node.analysis.summary.strengths.length > 0 && (
                        <div className="text-[10px]">
                          <div className="text-[#6a6]">✓ Styrkor:</div>
                          <ul className="ml-3 text-[#888] list-disc">
                            {node.analysis.summary.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {node.analysis.summary.weaknesses && node.analysis.summary.weaknesses.length > 0 && (
                        <div className="text-[10px]">
                          <div className="text-[#a66]">✗ Svagheter:</div>
                          <ul className="ml-3 text-[#888] list-disc">
                            {node.analysis.summary.weaknesses.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-[#66a] hover:text-[#88c] underline text-[10px]"
                  >
                    [Klicka för MTA-DO JSON med alla dimensioner]
                  </button>
                </div>
              )}
              
              {/* OneSeek Commentary */}
              {node.type === 'oneseek_reasoning' && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">🧠 ONESEEK Commentary</div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">Tokens:</span> {node.tokens || 'N/A'}
                  </div>
                  {node.text && (
                    <div className="text-[#aaa] bg-[#050505] rounded p-2 whitespace-pre-wrap">
                      {node.text}
                    </div>
                  )}
                  <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-[#66a] hover:text-[#88c] underline text-[10px]"
                  >
                    [Visa prompt + klicka för rådata]
                  </button>
                </div>
              )}
              
              {/* Insight */}
              {node.type === 'live_insight' && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">💡 ONESEEK Insight</div>
                  <div className="text-[#aaa]">
                    <span className="text-[#888]">Tokens:</span> {node.tokens || 'N/A'}
                  </div>
                  {node.text && (
                    <div className="text-[#aaa] bg-[#050505] rounded p-2 whitespace-pre-wrap">
                      {node.text}
                    </div>
                  )}
                  <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-[#66a] hover:text-[#88c] underline text-[10px]"
                  >
                    [Klicka för rådata]
                  </button>
                </div>
              )}
              
              {/* Vote Motivation */}
              {node.motivation && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">🗳️ Röstmotivering</div>
                  <div className="text-[#aaa] italic bg-[#050505] rounded p-2">
                    "{node.motivation}"
                  </div>
                  {node.tokens && (
                    <div className="text-[#888]">Tokens: {node.tokens}</div>
                  )}
                </div>
              )}
              
              {/* Blockchain Lock */}
              {node.blockchain_hash && (
                <div className="space-y-1 pb-2 border-b border-[#1a1a1a]">
                  <div className="text-[#666]">🔒 Blockchain Lock</div>
                  <div className="text-[#aaa] text-[9px] font-mono bg-[#050505] rounded p-1 break-all">
                    Hash: {node.blockchain_hash}
                  </div>
                  <div className="text-[#888]">
                    Låst: {node.blockchain_locked_at ? formatUTCTimestamp(node.blockchain_locked_at) : 'N/A'}
                  </div>
                </div>
              )}
              
              {/* Raw JSON Toggle */}
              {showRawJSON && (
                <div className="mt-2 pt-2 border-t border-[#1a1a1a]">
                  <div className="text-[#666] mb-1">📄 Rådata (JSON)</div>
                  <div className="bg-[#000] rounded p-2 text-[9px] font-mono text-[#0a0] max-h-60 overflow-auto">
                    {JSON.stringify({
                      ...node,
                      children: node.children?.length || 0
                    }, null, 2)}
                  </div>
                </div>
              )}
              
              {/* General Data */}
              {node.data && (
                <div className="space-y-1">
                  <div className="text-[#666]">📋 Data</div>
                  <div className="text-[#888] text-[9px] font-mono bg-[#050505] rounded p-2 max-h-32 overflow-auto">
                    {JSON.stringify(node.data, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Details indicator */}
        {hasDetails && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-shrink-0 text-[#555] hover:text-[#777] text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={index === node.children.length - 1}
              parentPath={`${parentPath}/${node.id}`}
              previousNode={index > 0 ? node.children[index - 1] : node}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main Tankekedja Component with Tree Structure
 */
export default function Tankekedja({ events = [], isVisible = true, onToggle }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const treeEndRef = useRef(null);
  const containerRef = useRef(null);
  
  // Build tree structure from events
  const tree = buildTreeStructure(events);
  
  // Auto-scroll to latest
  useEffect(() => {
    if (autoScroll && treeEndRef.current) {
      treeEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    <div className={`fixed right-0 top-0 h-full bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col transition-all duration-300 z-40 ${isCollapsed ? 'w-12' : 'w-96'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a]">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#888]" />
              <span className="text-sm font-medium text-[#ddd]">Tankekedja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#555]">Tree View</span>
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
      
      {/* Tree view */}
      {!isCollapsed && (
        <>
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-2"
          >
            {tree.children.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#666]">
                Inga händelser ännu...
              </div>
            ) : (
              <div className="space-y-0">
                {tree.children.map((node, index) => (
                  <TreeNode 
                    key={node.id} 
                    node={node} 
                    depth={0}
                    isLast={index === tree.children.length - 1}
                  />
                ))}
                <div ref={treeEndRef} />
              </div>
            )}
          </div>
          
          {/* Auto-scroll indicator */}
          {!autoScroll && events.length > 0 && (
            <button
              onClick={() => {
                setAutoScroll(true);
                treeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
