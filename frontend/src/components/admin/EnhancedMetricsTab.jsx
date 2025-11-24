import { useState, useEffect } from 'react';

/**
 * Enhanced Metrics Tab with Autonomy Engine Metrics
 * Shows fidelity scores, approval rates, and community voting
 */
export default function EnhancedMetricsTab() {
  const [autonomyConfig, setAutonomyConfig] = useState(null);
  const [recentCycles, setRecentCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch autonomy config and state
        const [configRes, stateRes] = await Promise.all([
          fetch('/api/autonomy/config'),
          fetch('/api/autonomy/state')
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          setAutonomyConfig(configData.config);
        }

        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setRecentCycles(stateData.state?.cycleHistory || []);
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculateAverageFidelity = () => {
    if (!recentCycles || recentCycles.length === 0) return null;
    
    const fidelityScores = recentCycles
      .filter(cycle => cycle.stages?.verification?.fidelityScore)
      .map(cycle => cycle.stages.verification.fidelityScore);
    
    if (fidelityScores.length === 0) return null;
    
    const avg = fidelityScores.reduce((a, b) => a + b, 0) / fidelityScores.length;
    return avg;
  };

  const calculateApprovalRate = () => {
    if (!recentCycles || recentCycles.length === 0) return null;
    
    const totalCycles = recentCycles.length;
    const approvedCycles = recentCycles.filter(
      cycle => cycle.status === 'approved' || cycle.status === 'awaiting_checkpoint'
    ).length;
    
    return approvedCycles / totalCycles;
  };

  const getLatestFidelity = () => {
    if (!recentCycles || recentCycles.length === 0) return null;
    
    const latest = [...recentCycles]
      .reverse()
      .find(cycle => cycle.stages?.verification?.fidelityScore);
    
    return latest?.stages?.verification?.fidelityScore;
  };

  const avgFidelity = calculateAverageFidelity();
  const approvalRate = calculateApprovalRate();
  const latestFidelity = getLatestFidelity();

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[#666] font-mono">LOADING METRICS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <div className="border border-[#1a1a1a] rounded">
        <div className="border-b border-[#1a1a1a] px-4 py-3">
          <h3 className="text-xs font-mono text-[#888]">KVALITETSMÅTT</h3>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {latestFidelity !== null && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Senaste Fidelity Score</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {(latestFidelity * 100).toFixed(1)}%
              </span>
            </div>
          )}
          
          {avgFidelity !== null && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Genomsnittlig Fidelity</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {(avgFidelity * 100).toFixed(1)}%
              </span>
            </div>
          )}
          
          {autonomyConfig?.minFidelityThreshold && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Minimum Threshold</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {(autonomyConfig.minFidelityThreshold * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Approval Metrics */}
      <div className="border border-[#1a1a1a] rounded">
        <div className="border-b border-[#1a1a1a] px-4 py-3">
          <h3 className="text-xs font-mono text-[#888]">GODKÄNNANDEMÅTT</h3>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {approvalRate !== null && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Godkännande-rate</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {(approvalRate * 100).toFixed(0)}%
              </span>
            </div>
          )}
          
          {autonomyConfig?.approvalThreshold && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Approval Threshold</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {autonomyConfig.approvalThreshold} av 4
              </span>
            </div>
          )}
          
          {autonomyConfig?.externalReviewers && (
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Externa Granskare</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {autonomyConfig.externalReviewers.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Metrics */}
      {autonomyConfig && (
        <div className="border border-[#1a1a1a] rounded">
          <div className="border-b border-[#1a1a1a] px-4 py-3">
            <h3 className="text-xs font-mono text-[#888]">DATASET-KONFIGURATION</h3>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Max Exempel per Natt</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {autonomyConfig.maxDatasetSize}
              </span>
            </div>
            
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Min Exempel per Natt</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {autonomyConfig.minDatasetSize}
              </span>
            </div>
            
            <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
              <span className="text-[10px] font-mono text-[#666]">Verifieringsfrågor</span>
              <span className="text-[10px] font-mono text-[#888] text-right">
                {autonomyConfig.verificationQuestions}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Fidelity Scores */}
      {recentCycles.length > 0 && (
        <div className="border border-[#1a1a1a] rounded">
          <div className="border-b border-[#1a1a1a] px-4 py-3">
            <h3 className="text-xs font-mono text-[#888]">SENASTE FIDELITY SCORES</h3>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {recentCycles
              .filter(cycle => cycle.stages?.verification?.fidelityScore)
              .slice(-10)
              .reverse()
              .map((cycle, index) => (
                <div key={cycle.id || index} className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                  <span className="text-[10px] font-mono text-[#666]">
                    {new Date(cycle.startTime).toLocaleDateString('sv-SE')}
                  </span>
                  <span className="text-[10px] font-mono text-[#888] text-right">
                    {(cycle.stages.verification.fidelityScore * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Community Voting Info */}
      <div className="border border-[#1a1a1a] rounded">
        <div className="border-b border-[#1a1a1a] px-4 py-3">
          <h3 className="text-xs font-mono text-[#888]">ANVÄNDARRÖSTNING</h3>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-mono text-[#666] mb-2">
            PoW-säkrad community voting är aktiverad
          </p>
          <p className="text-[9px] font-mono text-[#555]">
            SHA-256 Proof-of-Work med 4-zero svårighet (~15s per röst)
          </p>
        </div>
      </div>
    </div>
  );
}
