/**
 * Tankekedja Component V2 - Minimalist Deep Transparency Tree
 * 
 * Shows complete debate flow from raw input to final summary:
 * - Raw user question and processing
 * - Randomized agent order per round
 * - Full API call details (URL, model, prompt, params)
 * - Sent payloads and received responses (clickable)
 * - MTA-DO analysis with all 6 dimensions
 * - OneSeek internal thinking steps
 * - Context building across rounds
 * 
 * Design: Minimal, clean, focused on depth over decoration
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toISOString().substring(11, 19); // HH:MM:SS
  } catch {
    return '';
  }
}

/**
 * Calculate duration between two timestamps
 */
function calculateDuration(start, end) {
  if (!start || !end) return null;
  try {
    const duration = (new Date(end) - new Date(start)) / 1000;
    return duration > 0 ? duration.toFixed(1) + 's' : null;
  } catch {
    return null;
  }
}

/**
 * Modal for displaying raw JSON/text data
 */
function DataModal({ isOpen, onClose, title, data, type = 'json' }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#333] rounded max-w-4xl max-h-[80vh] w-full flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-[#333]">
          <div className="text-sm font-medium text-[#ddd]">{title}</div>
          <button onClick={onClose} className="text-[#888] hover:text-[#ddd]">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-[10px] font-mono text-[#0a0] whitespace-pre-wrap">
            {type === 'json' ? JSON.stringify(data, null, 2) : data}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * MTA-DO Longitudinal Visualization Component
 * Shows trends across rounds with sparklines and tables
 */
function MTALongitudinalView({ mtaData }) {
  console.log('[MTALongitudinalView] Received mtaData:', mtaData);
  
  if (!mtaData || mtaData.length === 0) {
    console.log('[MTALongitudinalView] No data available');
    return (
      <div className="mt-2 p-2 bg-[#0a0a0a] border border-[#222] rounded text-[10px] text-[#666]">
        MTA-DO Longitudinal Analysis: Ingen data tillgänglig
      </div>
    );
  }
  
  const dimensions = ['relevance', 'argument_depth', 'factual_anchoring', 'clarity', 'logical_coherence', 'risk_hallucination'];
  const dimensionLabels = {
    relevance: 'Relevans',
    argument_depth: 'Argumentdjup',
    factual_anchoring: 'Faktaförankring',
    clarity: 'Klarhet',
    logical_coherence: 'Logisk koherens',
    risk_hallucination: 'Risk/Hallucination'
  };
  
  // Calculate sparkline data for each dimension
  const getSparklineData = (dimension) => {
    return mtaData.map(round => {
      const agents = Object.keys(round).filter(k => k !== 'round');
      const scores = agents.map(agent => {
        const analysis = round[agent]?.analysis;
        return analysis?.[dimension]?.score || 0;
      });
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });
  };
  
  // Simple sparkline component
  const Sparkline = ({ data, color = '#0a0' }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 10);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 15;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="60" height="20" className="inline-block">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1"
          points={points}
        />
      </svg>
    );
  };
  
  return (
    <div className="bg-[#0a0a0a] rounded border border-[#1a1a1a] p-3 mt-2">
      <div className="text-xs text-[#888] mb-2">MTA-DO Longitudinal Analysis</div>
      <div className="space-y-2">
        {dimensions.map(dim => {
          const sparkData = getSparklineData(dim);
          const avgScore = sparkData.length > 0 
            ? (sparkData.reduce((a, b) => a + b, 0) / sparkData.length).toFixed(1)
            : 'N/A';
          
          return (
            <div key={dim} className="flex items-center gap-3 text-[10px]">
              <div className="w-32 text-[#777]">{dimensionLabels[dim]}</div>
              <Sparkline data={sparkData} />
              <div className="text-[#0a0]">{avgScore}/10</div>
            </div>
          );
        })}
      </div>
      
      {/* Longitudinal table */}
      <div className="mt-3 border-t border-[#1a1a1a] pt-2">
        <div className="text-[9px] text-[#666] mb-1">Trend per runda</div>
        <div className="grid grid-cols-4 gap-2 text-[9px]">
          <div className="text-[#555]">Runda</div>
          <div className="text-[#555]">Avg Score</div>
          <div className="text-[#555]">Best Dim</div>
          <div className="text-[#555]">Weak Dim</div>
          
          {mtaData.map((round, idx) => {
            const agents = Object.keys(round).filter(k => k !== 'round');
            const allScores = {};
            
            agents.forEach(agent => {
              const analysis = round[agent]?.analysis;
              dimensions.forEach(dim => {
                if (!allScores[dim]) allScores[dim] = [];
                allScores[dim].push(analysis?.[dim]?.score || 0);
              });
            });
            
            const avgScores = {};
            Object.keys(allScores).forEach(dim => {
              const scores = allScores[dim];
              avgScores[dim] = scores.reduce((a, b) => a + b, 0) / scores.length;
            });
            
            const totalAvg = Object.values(avgScores).reduce((a, b) => a + b, 0) / dimensions.length;
            const bestDim = Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0];
            const weakDim = Object.entries(avgScores).sort((a, b) => a[1] - b[1])[0];
            
            return (
              <React.Fragment key={idx}>
                <div className="text-[#777]">{idx + 1}</div>
                <div className="text-[#0a0]">{totalAvg.toFixed(1)}</div>
                <div className="text-[#6a6]">{dimensionLabels[bestDim[0]].substring(0, 8)}</div>
                <div className="text-[#a66]">{dimensionLabels[weakDim[0]].substring(0, 8)}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Build tree structure with deep API details
 */
function buildTreeStructure(events) {
  const tree = {
    type: 'root',
    children: []
  };
  
  // Find question
  const questionEvent = events.find(e => e.type === 'user_question');
  if (!questionEvent) return tree;
  
  // Input section
  const inputNode = {
    id: 'input',
    type: 'input_section',
    label: 'Input (start av debatt)',
    children: [
      {
        id: 'raw-question',
        type: 'raw_question',
        label: 'Användarfråga',
        text: questionEvent.text,
        timestamp: questionEvent.timestamp
      },
      {
        id: 'processing',
        type: 'processing',
        label: 'Bearbetning',
        details: `Rengör frågan → clean_question = "${questionEvent.text}"`,
        timestamp: questionEvent.timestamp
      }
    ]
  };
  
  // Add agent order initialization if available
  const debateInit = events.find(e => e.type === 'debate_init');
  if (debateInit && debateInit.data?.agents) {
    inputNode.children.push({
      id: 'agent-order',
      type: 'agent_order',
      label: 'Initiera runda 1',
      agents: debateInit.data.agents,
      details: `Slumpa ordning: ${debateInit.data.agents.map(a => a.toUpperCase()).join(' → ')}`
    });
  }
  
  // Group events by round
  const rounds = {};
  const voting = [];
  const final = [];
  const mtaDataByRound = {}; // For longitudinal analysis
  
  events.forEach(event => {
    if (event.round) {
      if (!rounds[event.round]) {
        rounds[event.round] = {
          id: `round-${event.round}`,
          type: 'round',
          round: event.round,
          label: `Runda ${event.round}`,
          apiCalls: [],
          oneseekSynthesis: null
        };
      }
      
      const round = rounds[event.round];
      
      // Handle agent responses as API calls
      if (event.type === 'ai_response' && event.agent) {
        const apiCall = {
          id: `api-${event.round}-${event.agent}`,
          type: 'api_call',
          agent: event.agent,
          label: `API-anrop till ${event.agent.toUpperCase()}`,
          timestamp: event.timestamp,
          tokens_in: event.tokens_in || event.tokens || 0,
          tokens_out: event.tokens_out || 0,
          duration: event.duration || null,
          children: []
        };
        
        // Add payload info
        apiCall.children.push({
          id: `payload-${event.round}-${event.agent}`,
          type: 'payload',
          label: 'Skickad payload',
          clickable: true,
          timestamp: event.timestamp,
          tokens_out: event.tokens_out || 0,
          data: {
            url: event.api_url || `https://api.${event.agent}.com/v1/chat/completions`,
            model: event.model || `${event.agent}-model`,
            prompt: event.prompt || event.full_prompt || '[Full prompt from agent]',
            temperature: event.temperature || 0.7,
            max_tokens: event.max_tokens || 500,
            context: event.context || event.previous_context || (event.round > 1 ? { note: `Includes context from previous ${event.round - 1} rounds` } : {}),
            tokens_out: event.tokens_out || 0,
            full_payload: event.payload || event
          }
        });
        
        // Add response
        apiCall.children.push({
          id: `response-${event.round}-${event.agent}`,
          type: 'response',
          label: 'Mottaget svar',
          text: event.text || event.message || '[Response text]',
          clickable: true,
          timestamp: event.timestamp,
          tokens_in: event.tokens_in || event.tokens || 0,
          data: {
            response_text: event.text || event.message,
            full_response: event.response || event
          }
        });
        
        round.apiCalls.push(apiCall);
      }
      
      // Handle MTA-DO analysis
      if (event.type === 'mta_analysis' && event.agent) {
        const lastApiCall = round.apiCalls.find(a => a.agent === event.agent);
        if (lastApiCall) {
          lastApiCall.children.push({
            id: `mta-${event.round}-${event.agent}`,
            type: 'mta_analysis',
            label: 'MTA-DO analys',
            analysis: event.analysis,
            clickable: true,
            timestamp: event.timestamp,
            tokens: event.tokens || 0
          });
          
          // Track MTA data for longitudinal analysis
          if (!mtaDataByRound[event.round]) {
            mtaDataByRound[event.round] = { round: event.round };
          }
          mtaDataByRound[event.round][event.agent] = {
            analysis: event.analysis,
            timestamp: event.timestamp
          };
        }
      }
      
      // Handle OneSeek reasoning/commentary
      if (event.type === 'oneseek_reasoning' && event.agent) {
        const lastApiCall = round.apiCalls.find(a => a.agent === event.agent);
        if (lastApiCall) {
          lastApiCall.children.push({
            id: `commentary-${event.round}-${event.agent}`,
            type: 'commentary',
            label: 'ONESEEK commentary',
            text: event.text || event.message,
            timestamp: event.timestamp,
            tokens: event.tokens || 0
          });
        }
      }
      
      // Handle insights
      if (event.type === 'live_insight' && event.agent) {
        const lastApiCall = round.apiCalls.find(a => a.agent === event.agent);
        if (lastApiCall) {
          lastApiCall.children.push({
            id: `insight-${event.round}-${event.agent}`,
            type: 'insight',
            label: 'Insight',
            text: event.text || event.message,
            timestamp: event.timestamp,
            tokens: event.tokens || 0
          });
        }
      }
      
      // Handle OneSeek's own synthesis
      if (event.type === 'oneseek_own_answer') {
        round.oneseekSynthesis = {
          id: `synthesis-${event.round}`,
          type: 'synthesis',
          label: 'ONESEEK huvudbidrag (slut av runda)',
          text: event.text,
          timestamp: event.timestamp,
          children: [
            {
              id: `thinking-${event.round}`,
              type: 'thinking_steps',
              label: 'Tankekedja interna steg',
              clickable: true,
              steps: [
                'Steg 1: Analysera externa svar + MTA-DO',
                'Steg 2: Identifiera bias',
                'Steg 3: Egen syntes'
              ]
            }
          ]
        };
      }
    }
    
    // Handle voting
    if (event.type === 'vote_received') {
      voting.push({
        id: `vote-${event.voter || event.agent}`,
        type: 'vote_call',
        label: `API-anrop till ${(event.voter || event.agent || 'Unknown').toUpperCase()} röstning`,
        timestamp: event.timestamp,
        tokens_in: event.tokens_in || 0,
        tokens_out: event.tokens_out || 0,
        children: [
          {
            id: `vote-payload-${event.voter}`,
            type: 'vote_payload',
            label: 'Skickad payload',
            clickable: true,
            timestamp: event.timestamp,
            tokens_out: event.tokens_out || 0,
            data: {
              voter: event.voter || event.agent,
              prompt: event.prompt || '[Voting prompt]',
              candidates: event.candidates || [],
              context: event.context || {},
              full_payload: event.payload || event
            }
          },
          {
            id: `vote-response-${event.voter}`,
            type: 'vote_response',
            label: 'Mottaget svar',
            text: `Röstar på: ${event.voted_for?.toUpperCase() || 'N/A'}\n\nMotivering: ${event.motivation || 'N/A'}`,
            clickable: true,
            timestamp: event.timestamp,
            tokens_in: event.tokens_in || 0,
            data: {
              voted_for: event.voted_for,
              motivation: event.motivation,
              full_response: event
            }
          }
        ]
      });
    }
    
    // Handle final summary
    if (event.type === 'debate_complete' || event.type === 'final' || event.type === 'summary') {
      final.push({
        id: 'final-summary',
        type: 'final_summary',
        label: 'Final sammanfattning',
        text: event.summary || event.text || event.message || 'Sammanfattning med röster + MTA-DO-trender',
        timestamp: event.timestamp,
        tokens: event.tokens || 0,
        clickable: true,
        data: event,
        mtaData: Object.values(mtaDataByRound) // Include MTA longitudinal data
      });
    }
  });
  
  // Build round nodes
  Object.values(rounds).forEach(round => {
    const roundNode = {
      ...round,
      children: [
        ...round.apiCalls,
        ...(round.oneseekSynthesis ? [round.oneseekSynthesis] : [])
      ]
    };
    inputNode.children.push(roundNode);
  });
  
  // Add ending section
  if (voting.length > 0 || final.length > 0) {
    inputNode.children.push({
      id: 'ending',
      type: 'ending_section',
      label: 'Avslut (efter runda 3)',
      children: [
        ...(voting.length > 0 ? [{
          id: 'voting-section',
          type: 'voting_section',
          label: 'Röstning',
          children: voting
        }] : []),
        ...final
      ]
    });
  }
  
  tree.children.push(inputNode);
  return tree;
}

/**
 * Tree Node Component - Minimalist Design with Metadata
 */
function TreeNode({ node, depth = 0, isLast = false, previousNode = null, activeRound = null }) {
  // Auto-minimize rounds when not active
  const [isExpanded, setIsExpanded] = useState(
    node.type === 'round' ? (activeRound === null || node.round === activeRound) : true
  );
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  
  // Update expansion when active round changes
  useEffect(() => {
    if (node.type === 'round' && activeRound !== null) {
      setIsExpanded(node.round === activeRound);
    }
  }, [activeRound, node.type, node.round]);
  
  const hasChildren = node.children && node.children.length > 0;
  const indent = depth * 16;
  
  // Calculate duration from previous node
  const duration = previousNode?.timestamp && node.timestamp 
    ? calculateDuration(previousNode.timestamp, node.timestamp)
    : null;
  
  const handleClick = () => {
    if (node.clickable) {
      // Determine if we should show JSON or text
      let dataToShow, dataType;
      
      if (node.type === 'response' || node.type === 'vote_response' || node.type === 'final_summary') {
        // For responses, show the text first
        dataToShow = node.text || node.data || {};
        dataType = 'text';
      } else if (node.type === 'payload' || node.type === 'vote_payload' || node.type === 'mta_analysis') {
        // For payloads and analysis, show JSON
        dataToShow = node.data || node.analysis || {};
        dataType = 'json';
      } else if (node.type === 'commentary' || node.type === 'insight') {
        // For commentary and insights, show text
        dataToShow = node.text || node.data || {};
        dataType = 'text';
      } else {
        // Default behavior
        dataToShow = node.data || node.text || node.analysis || {};
        dataType = typeof dataToShow === 'string' ? 'text' : 'json';
      }
      
      setModalData({
        title: node.label,
        data: dataToShow,
        type: dataType
      });
      setShowModal(true);
    }
  };
  
  return (
    <>
      <div className="relative">
        {/* Tree line */}
        {depth > 0 && (
          <div 
            className="absolute left-0 top-0 w-px bg-[#222] h-full"
            style={{ left: `${indent - 8}px` }}
          />
        )}
        
        {/* Node */}
        <div 
          className="flex items-start gap-2 py-1.5 hover:bg-[#0a0a0a] transition-colors"
          style={{ paddingLeft: `${indent}px` }}
        >
          {/* Branch line */}
          {depth > 0 && (
            <div className="relative" style={{ width: '8px', height: '24px', marginLeft: '-8px' }}>
              <div className="absolute left-0 top-3 w-full h-px bg-[#222]" />
            </div>
          )}
          
          {/* Expand button */}
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 w-3 h-3 text-[#555] hover:text-[#888] mt-1"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-3" />
          )}
          
          {/* Label */}
          <div className="flex-1 min-w-0 text-[11px]">
            <div className="flex items-baseline gap-2">
              <span className="text-[#aaa]">
                {node.label}
                {node.agent && ` (${node.agent.toUpperCase()})`}
              </span>
              
              {/* Timestamp, duration, tokens */}
              <span className="text-[9px] text-[#555] flex items-center gap-2">
                {node.timestamp && (
                  <span>{formatTimestamp(node.timestamp)}</span>
                )}
                {duration && (
                  <span className="text-[#666]">+{duration}</span>
                )}
                {(node.tokens || node.tokens_in || node.tokens_out) && (
                  <span className="text-[#777]">
                    {node.tokens_out ? `↑${node.tokens_out}` : ''}
                    {node.tokens_in ? ` ↓${node.tokens_in}` : ''}
                    {node.tokens && !node.tokens_in && !node.tokens_out ? `${node.tokens}t` : ''}
                  </span>
                )}
              </span>
            </div>
            
            {/* Details inline */}
            {node.details && (
              <div className="text-[#666] text-[10px] mt-0.5">
                {node.details}
              </div>
            )}
            
            {/* Short text preview */}
            {node.text && !node.details && node.type !== 'final_summary' && (
              <div className="text-[#777] text-[10px] mt-0.5 truncate">
                {node.text.substring(0, 80)}...
              </div>
            )}
            
            {/* Full text for final summary */}
            {node.type === 'final_summary' && node.text && (
              <div className="text-[#888] text-[10px] mt-1 mb-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {node.text}
              </div>
            )}
            
            {/* Clickable indicator */}
            {node.clickable && (
              <button
                onClick={handleClick}
                className="text-[#559] hover:text-[#77b] text-[9px] underline mt-0.5"
              >
                [Klicka för {node.type === 'payload' ? 'rå JSON' : node.type === 'mta_analysis' ? 'JSON med 6 dimensioner' : 'rådata'}]
              </button>
            )}
            
            {/* MTA-DO summary inline */}
            {node.analysis?.summary && (
              <div className="text-[10px] text-[#888] mt-1">
                Vägt poäng: {node.analysis.summary.weighted_score?.toFixed(1) || 'N/A'}/10
              </div>
            )}
            
            {/* MTA Longitudinal View for final summary */}
            {node.type === 'final_summary' && node.mtaData && (
              <MTALongitudinalView mtaData={node.mtaData} />
            )}
            
            {/* Thinking steps */}
            {node.steps && (
              <div className="text-[10px] text-[#666] mt-1 space-y-0.5">
                {node.steps.map((step, i) => (
                  <div key={i}>- {step}</div>
                ))}
              </div>
            )}
          </div>
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
                previousNode={index > 0 ? node.children[index - 1] : node}
                activeRound={activeRound}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && modalData && (
        <DataModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalData.title}
          data={modalData.data}
          type={modalData.type}
        />
      )}
    </>
  );
}

/**
 * Main Tankekedja Component - Minimalist
 */
export default function Tankekedja({ events = [], isVisible = true }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const treeEndRef = useRef(null);
  const containerRef = useRef(null);
  
  const tree = buildTreeStructure(events);
  
  // Determine active round (most recent round with activity)
  const activeRound = events
    .filter(e => e.round)
    .map(e => e.round)
    .reduce((max, r) => Math.max(max, r), 0) || null;
  
  useEffect(() => {
    if (autoScroll && treeEndRef.current) {
      treeEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);
  
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#050505] border-l border-[#1a1a1a] flex flex-col z-40">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1a1a1a]">
        <div className="text-xs text-[#888]">Tankekedja</div>
      </div>
      
      {/* Tree */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-2"
      >
        {tree.children.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#555]">
            Väntar på debatt...
          </div>
        ) : (
          <div>
            {tree.children.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} activeRound={activeRound} />
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
          className="absolute bottom-3 right-3 bg-[#1a1a1a] hover:bg-[#222] text-[#777] text-[10px] px-2 py-1 rounded border border-[#333]"
        >
          ↓ Scrolla
        </button>
      )}
    </div>
  );
}
