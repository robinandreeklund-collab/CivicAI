import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Live Leaderboard Component
 * 
 * Displays real-time training metrics with adaptive weights visualization:
 * - Model rankings based on validation loss
 * - Weight multipliers with visual progress bars
 * - Current epoch and auto-stop countdown
 * - Live updates via WebSocket connection
 */
export default function LiveLeaderboard({ runId, onClose }) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!runId) return;

    // Connect to WebSocket for live updates
    connectWebSocket();
    
    // Fallback: Poll live_metrics.json directly every 2 seconds
    // This provides real-time updates even if WebSocket is unavailable
    // Note: 2 second interval chosen for responsive UX during training
    // Could be increased to 5-10s if server load becomes a concern
    pollIntervalRef.current = setInterval(async () => {
      try {
        // First try: Direct fetch from live_metrics.json with cache-busting
        const metricsUrl = `/models/oneseek-certified/${runId}/live_metrics.json?t=${Date.now()}`;
        const metricsResponse = await fetch(metricsUrl);
        
        if (metricsResponse.ok) {
          const data = await metricsResponse.json();
          console.log('[LiveLeaderboard] Fetched live_metrics.json:', data);
          
          // Update from live metrics if WebSocket isn't working
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            updateLeaderboard(data);
          }
        } else {
          // Fallback: Poll training status API
          const response = await fetch('/api/admin/training/status');
          if (response.ok) {
            const status = await response.json();
            if (status && status.status === 'training') {
              // Update from status if WebSocket isn't working
              if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                updateFromTrainingStatus(status);
              }
            }
          }
        }
      } catch (err) {
        console.error('[LiveLeaderboard] Error polling metrics:', err);
      }
    }, 2000); // Poll every 2 seconds for more responsive updates

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [runId]); // Only depend on runId

  const connectWebSocket = () => {
    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = import.meta.env.VITE_BACKEND_PORT || '3001';
      const wsUrl = `${protocol}//${host}:${port}/ws/training?runId=${runId}`;

      console.log('[LiveLeaderboard] Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[LiveLeaderboard] WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[LiveLeaderboard] Received:', data.type);

          if (data.type === 'initial_state' || data.type === 'epoch_end') {
            updateLeaderboard(data);
          } else if (data.type === 'training_complete') {
            updateLeaderboard(data);
            // Optionally close connection after training completes
            setTimeout(() => disconnectWebSocket(), 5000);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('[LiveLeaderboard] Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[LiveLeaderboard] WebSocket error:', error);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[LiveLeaderboard] WebSocket closed');
        setIsConnected(false);
        
        // Don't auto-reconnect - rely on polling instead to avoid spam
        // The polling fallback will handle updates when WebSocket is unavailable
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[LiveLeaderboard] Error connecting to WebSocket:', err);
      setError('Failed to connect');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const updateLeaderboard = (data) => {
    const { val_losses, weights, lr_multipliers, current_epoch, total_epochs, auto_stop_info, progress_percent, validation_accuracy } = data;

    // Build leaderboard entries
    const entries = Object.entries(weights || {}).map(([modelName, weight]) => ({
      modelName,
      weight: weight || 1.0,
      valLoss: val_losses?.[modelName] || null,
      lrMultiplier: lr_multipliers?.[modelName] || null,
    }));

    // Sort by validation loss (lower is better)
    entries.sort((a, b) => {
      if (a.valLoss === null) return 1;
      if (b.valLoss === null) return -1;
      return a.valLoss - b.valLoss;
    });

    setLeaderboardData({
      entries,
      currentEpoch: current_epoch || data.epoch || 0,
      totalEpochs: total_epochs || 0,
      autoStopInfo: auto_stop_info,
      progressPercent: progress_percent || 0,
      validationAccuracy: validation_accuracy,  // Add validation accuracy
    });
  };

  const updateFromTrainingStatus = (status) => {
    // Fallback update from training status API
    const currentEpoch = status.currentEpoch || 0;
    const totalEpochs = status.totalEpochs || 3;
    const progress = status.progress || 0;
    
    // Create basic entries from base models
    const baseModels = status.baseModels || [];
    const entries = baseModels.map((modelName, index) => ({
      modelName,
      weight: 1.0,
      valLoss: status.loss || null,
      lrMultiplier: 1.0,
    }));
    
    setLeaderboardData({
      entries: entries.length > 0 ? entries : [{ modelName: 'Training...', weight: 1.0, valLoss: status.loss, lrMultiplier: 1.0 }],
      currentEpoch,
      totalEpochs,
      autoStopInfo: null,
      progressPercent: progress,
      validationAccuracy: status.accuracy || null,
    });
  };

  const formatModelName = (name) => {
    // Convert model names to display format
    // e.g., "mistral-7b-instruct" -> "Mistral 7B Instruct"
    return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getWeightBarWidth = (weight) => {
    // Normalize weight to percentage (assuming weights range from 0.5 to 1.5)
    const minWeight = 0.5;
    const maxWeight = 1.5;
    const normalized = ((weight - minWeight) / (maxWeight - minWeight)) * 100;
    return Math.max(0, Math.min(100, normalized));
  };

  const getWeightBarColor = (rank) => {
    // Color coding based on rank
    if (rank === 0) return '#22c55e'; // Green for best
    if (rank === 1) return '#eab308'; // Yellow for second
    return '#ef4444'; // Red for worst
  };

  if (error) {
    return (
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#eee] font-mono text-lg">Live Leaderboard</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#666] hover:text-[#888] font-mono text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-[#ef4444] font-mono text-sm">{error}</div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#eee] font-mono text-lg">Live Leaderboard</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#666] hover:text-[#888] font-mono text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-[#666] font-mono text-sm">
          {isConnected ? 'Waiting for training data...' : 'Connecting...'}
        </div>
      </div>
    );
  }

  const { entries, currentEpoch, totalEpochs, autoStopInfo, progressPercent, validationAccuracy } = leaderboardData;

  return (
    <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-[#eee] font-mono text-lg">Live Leaderboard</h3>
          <div className="text-[#666] font-mono text-xs mt-1">
            Epoch {currentEpoch}/{totalEpochs} • {progressPercent.toFixed(0)}% Complete
            {validationAccuracy != null && (
              <span className="ml-2">• Acc: {(validationAccuracy * 100).toFixed(1)}%</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-[#666]'}`} />
            <span className="text-[#666] font-mono text-xs">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#666] hover:text-[#888] font-mono text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Auto-stop Info */}
      {autoStopInfo && (
        <div className="mb-4 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
          <div className="text-[#888] font-mono text-xs">
            Auto-stop: {autoStopInfo.remaining > 0 
              ? `${autoStopInfo.remaining} epochs remaining` 
              : 'Triggered! Training will stop soon.'
            }
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.modelName}
            className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded hover:border-[#444] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                  index === 0 ? 'bg-[#22c55e] text-black' :
                  index === 1 ? 'bg-[#eab308] text-black' :
                  'bg-[#666] text-white'
                }`}>
                  {index + 1}
                </div>
                
                {/* Model Name */}
                <div>
                  <div className="text-[#eee] font-mono text-sm font-semibold">
                    {formatModelName(entry.modelName)}
                  </div>
                  {entry.valLoss !== null && (
                    <div className="text-[#666] font-mono text-xs">
                      Loss: {entry.valLoss.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Weight Multiplier */}
              <div className="text-right">
                <div className="text-[#eee] font-mono text-sm font-semibold">
                  {entry.weight.toFixed(2)}x
                </div>
                {entry.lrMultiplier !== null && (
                  <div className="text-[#666] font-mono text-xs">
                    LR: {entry.lrMultiplier.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Weight Visualization Bar */}
            <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getWeightBarWidth(entry.weight)}%`,
                  backgroundColor: getWeightBarColor(index),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center text-[#666] font-mono text-sm py-8">
          No models in training
        </div>
      )}
    </div>
  );
}

LiveLeaderboard.propTypes = {
  runId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};
