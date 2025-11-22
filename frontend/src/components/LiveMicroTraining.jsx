import { useState, useEffect, useRef } from 'react';

/**
 * LiveMicroTraining Component
 * Displays real-time micro-training activity
 * Shows language-specific training progress and DNA updates
 */
export default function LiveMicroTraining({ wsUrl = null }) {
  const [trainingEvents, setTrainingEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const maxEvents = 10; // Keep last 10 events

  useEffect(() => {
    // Connect to WebSocket for live updates
    // Use micro-training specific connection
    const url = wsUrl || `ws://localhost:3001/ws/training?runId=micro-training`;
    
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

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'stage1_complete':
        return '📥';
      case 'stage2_complete':
        return '🧠';
      case 'dna_updated':
        return '🧬';
      default:
        return '•';
    }
  };

  const getEventTitle = (event) => {
    switch (event.type) {
      case 'stage1_complete':
        return `Stage 1: Raw Data (${event.language?.toUpperCase() || 'EN'})`;
      case 'stage2_complete':
        return `Stage 2: Analysis (${event.language?.toUpperCase() || 'EN'})`;
      case 'dna_updated':
        return 'DNA Fingerprint Updated';
      default:
        return event.type;
    }
  };

  const getEventDescription = (event) => {
    switch (event.type) {
      case 'stage1_complete':
        return `Processed ${event.samples || 0} raw responses for ${event.model}`;
      case 'stage2_complete':
        return `Updated metrics for ${event.model}`;
      case 'dna_updated':
        return `Hash: ${event.dna_hash?.substring(0, 16)}... (${event.total_samples} samples)`;
      default:
        return JSON.stringify(event);
    }
  };

  return (
    <div className="bg-white border border-civic-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-civic-gray-900">
          Live Micro-Training
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-civic-gray-600">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Training Events */}
      <div className="space-y-2">
        {trainingEvents.length === 0 ? (
          <div className="text-center py-8 text-civic-gray-500">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm">Waiting for training activity...</p>
            <p className="text-xs mt-1">
              Training triggers automatically on each question
            </p>
          </div>
        ) : (
          trainingEvents.map((event, index) => (
            <div 
              key={`${event.timestamp}-${index}`}
              className="flex items-start gap-3 p-3 bg-civic-gray-50 rounded-lg hover:bg-civic-gray-100 transition-colors"
            >
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-civic-gray-900">
                    {getEventTitle(event)}
                  </h4>
                  <span className="text-xs text-civic-gray-500 flex-shrink-0 ml-2">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-civic-gray-600 break-words">
                  {getEventDescription(event)}
                </p>
                {event.question && (
                  <p className="text-xs text-civic-gray-500 mt-1 italic truncate">
                    "{event.question}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {trainingEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-civic-gray-200">
          <div className="text-xs text-civic-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Training Models:</span>
              <span>OneSeek-7B-Zero-sv (Swedish), OneSeek-7B-Zero-en (English)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">DNA Update:</span>
              <span>Every 50 questions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
