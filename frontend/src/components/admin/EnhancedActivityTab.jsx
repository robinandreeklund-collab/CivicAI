import { useState, useEffect } from 'react';
import LiveMicroTrainingActivity from './LiveMicroTrainingActivity';

/**
 * Enhanced Activity Tab with Autonomy Engine Integration
 * Shows both micro-training activity and autonomy cycle information
 */
export default function EnhancedActivityTab() {
  const [autonomyState, setAutonomyState] = useState(null);
  const [loadingAutonomy, setLoadingAutonomy] = useState(true);

  // Fetch autonomy state
  useEffect(() => {
    const fetchAutonomyState = async () => {
      try {
        const response = await fetch('/api/autonomy/state');
        if (response.ok) {
          const data = await response.json();
          setAutonomyState(data.state);
        }
      } catch (err) {
        console.error('Error fetching autonomy state:', err);
      } finally {
        setLoadingAutonomy(false);
      }
    };

    fetchAutonomyState();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAutonomyState, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    if (!status) return '#555';
    if (status === 'running') return '#ffaa00';
    if (status === 'awaiting_checkpoint') return '#00aaff';
    if (status === 'approved') return '#00ff88';
    if (status === 'failed') return '#ff6b6b';
    return '#666';
  };

  const getStatusText = (status) => {
    if (!status) return 'INAKTIV';
    if (status === 'running') return 'KÖRS';
    if (status === 'awaiting_checkpoint') return 'VÄNTAR PÅ GODKÄNNANDE';
    if (status === 'approved') return 'GODKÄND';
    if (status === 'failed') return 'MISSLYCKADES';
    return status.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Autonomy Engine Status */}
      {!loadingAutonomy && autonomyState && (
        <div className="border border-[#1a1a1a] rounded">
          <div className="border-b border-[#1a1a1a] px-4 py-3">
            <h3 className="text-xs font-mono text-[#888]">AUTONOMY ENGINE STATUS</h3>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Status</span>
              <span className="text-[10px] font-mono text-right" style={{ color: getStatusColor(autonomyState.currentCycle?.status) }}>
                {getStatusText(autonomyState.currentCycle?.status || (autonomyState.running ? 'running' : null))}
              </span>
            </div>
            
            {autonomyState.running && autonomyState.currentCycle && (
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Aktuellt steg</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {autonomyState.currentCycle.stages ? Object.keys(autonomyState.currentCycle.stages).length : 0}/10
                </span>
              </div>
            )}
            
            {autonomyState.lastRun && (
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Senaste körning</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {formatTimestamp(autonomyState.lastRun)}
                </span>
              </div>
            )}
            
            {autonomyState.nextRun && (
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Nästa schemalagd körning</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {formatTimestamp(autonomyState.nextRun)}
                </span>
              </div>
            )}
            
            {autonomyState.cycleHistory && autonomyState.cycleHistory.length > 0 && (
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Totala cykler</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {autonomyState.cycleHistory.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Autonomy Cycles */}
      {!loadingAutonomy && autonomyState?.cycleHistory && autonomyState.cycleHistory.length > 0 && (
        <div className="border border-[#1a1a1a] rounded">
          <div className="border-b border-[#1a1a1a] px-4 py-3">
            <h3 className="text-xs font-mono text-[#888]">SENASTE AUTONOMA CYKLER</h3>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {autonomyState.cycleHistory.slice(-5).reverse().map((cycle, index) => (
              <div key={cycle.id || index} className="px-4 py-3 hover:bg-[#0d0d0d] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#666]">{cycle.id}</span>
                  <span className="text-[10px] font-mono" style={{ color: getStatusColor(cycle.status) }}>
                    {getStatusText(cycle.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#555]">
                    {formatTimestamp(cycle.startTime)}
                  </span>
                  {cycle.stages?.verification?.fidelityScore && (
                    <span className="text-[9px] font-mono text-[#888]">
                      Fidelity: {(cycle.stages.verification.fidelityScore * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Micro-Training Activity */}
      <LiveMicroTrainingActivity />
    </div>
  );
}
