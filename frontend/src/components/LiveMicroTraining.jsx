import { useState, useEffect, useRef } from 'react';

/**
 * LiveMicroTraining Component
 * Displays real-time micro-training activity
 * Shows language-specific training progress and DNA updates
 * Design follows API Documentation page style - clean, minimalist, no colors/icons
 */
export default function LiveMicroTraining({ wsUrl = null }) {
  const [trainingEvents, setTrainingEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const maxEvents = 10; // Keep last 10 events

  useEffect(() => {
    // Connect to WebSocket for live updates
    // Use micro-training specific connection
    // Support both custom URL and default (use window.location for protocol/host)
    const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/training?runId=micro-training`;
    const url = wsUrl || defaultWsUrl;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[LiveMicroTraining] WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different event types
          if (data.type === 'stage1_complete' || 
              data.type === 'stage2_complete' || 
              data.type === 'dna_updated') {
            setTrainingEvents(prev => {
              const newEvents = [data, ...prev];
              return newEvents.slice(0, maxEvents);
            });
          }
        } catch (err) {
          console.error('[LiveMicroTraining] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[LiveMicroTraining] WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[LiveMicroTraining] WebSocket disconnected');
        setIsConnected(false);
      };

      // Cleanup on unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (err) {
      console.error('[LiveMicroTraining] Failed to create WebSocket:', err);
    }
  }, [wsUrl]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getEventLabel = (event) => {
    switch (event.type) {
      case 'stage1_complete':
        return `STAGE 1 (${event.language?.toUpperCase() || 'EN'})`;
      case 'stage2_complete':
        return `STAGE 2 (${event.language?.toUpperCase() || 'EN'})`;
      case 'dna_updated':
        return 'DNA UPDATE';
      default:
        return event.type.toUpperCase();
    }
  };
  const getEventDescription = (event) => {
    switch (event.type) {
      case 'stage1_complete':
        return `${event.samples || 0} samples → ${event.model}`;
      case 'stage2_complete':
        return `Metrics updated → ${event.model}`;
      case 'dna_updated':
        return `${event.dna_hash?.substring(0, 16)}... (${event.total_samples} samples)`;
      default:
        return JSON.stringify(event);
    }
  };

  return (
    <div className="border border-[#1a1a1a] rounded">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-[#888]">LIVE ACTIVITY</h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${isConnected ? 'text-[#888]' : 'text-[#555]'}`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Training Events */}
      <div className="divide-y divide-[#1a1a1a]">
        {trainingEvents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[10px] text-[#666] font-mono">WAITING FOR TRAINING ACTIVITY</p>
            <p className="text-[10px] text-[#555] mt-1 font-mono">
              Training triggers automatically on each question
            </p>
          </div>
        ) : (
          trainingEvents.map((event, index) => (
            <div 
              key={`${event.timestamp}-${index}`}
              className="px-4 py-2 hover:bg-[#0d0d0d] transition-colors"
            >
              {/* Event Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#888]">
                  {getEventLabel(event)}
                </span>
                <span className="text-[10px] text-[#555] font-mono">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              
              {/* Event Details */}
              <p className="text-[10px] text-[#666] font-mono">
                {getEventDescription(event)}
              </p>
              
              {/* Question (if available) */}
              {event.question && (
                <p className="text-[10px] text-[#555] mt-1 font-mono truncate">
                  &quot;{event.question}&quot;
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
