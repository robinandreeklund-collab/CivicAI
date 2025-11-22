import { useState, useEffect } from 'react';
import LiveMicroTraining from '../LiveMicroTraining';

/**
 * LiveMicroTrainingActivity Component
 * Admin dashboard view for real-time micro-training activity
 * Shows statistics, recent training events, and language-specific metrics
 * Design follows API Documentation page style - clean, minimalist, no colors/icons
 */
export default function LiveMicroTrainingActivity() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch micro-training stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/training/micro/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        console.error('Error fetching micro-training stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

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

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-xs text-[#666] font-mono">LOADING STATISTICS...</p>
        </div>
      ) : error ? (
        <div className="border border-[#1a1a1a] rounded p-4">
          <p className="text-xs text-[#666] font-mono">ERROR LOADING STATISTICS</p>
          <p className="text-[10px] text-[#555] mt-1 font-mono">{error}</p>
        </div>
      ) : stats ? (
        <>
          {/* Overview Stats - Clean table format */}
          <div className="border border-[#1a1a1a] rounded">
            <div className="border-b border-[#1a1a1a] px-4 py-3">
              <h3 className="text-xs font-mono text-[#888]">TRAINING STATISTICS</h3>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Total Runs</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {formatNumber(stats.totalRuns || 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">Swedish (SV)</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {formatNumber(stats.runsByLanguage?.sv || 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                <span className="text-[10px] font-mono text-[#666]">English (EN)</span>
                <span className="text-[10px] font-mono text-[#888] text-right">
                  {formatNumber(stats.runsByLanguage?.en || 0)}
                </span>
              </div>
              {stats.lastRun && (
                <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                  <span className="text-[10px] font-mono text-[#666]">Last Run</span>
                  <span className="text-[10px] font-mono text-[#888] text-right">
                    {formatTimestamp(stats.lastRun)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model Details - Swedish */}
          {stats.models?.sv && (
            <div className="border border-[#1a1a1a] rounded">
              <div className="border-b border-[#1a1a1a] px-4 py-3">
                <h3 className="text-xs font-mono text-[#888]">ONESEEK-7B-ZERO-SV</h3>
              </div>
              
              {stats.models.sv.error ? (
                <div className="px-4 py-3">
                  <p className="text-[10px] text-[#555] font-mono">{stats.models.sv.error}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Stage 1 Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.sv.stage1Samples || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Stage 2 Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.sv.stage2Samples || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Total Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.sv.totalSamples || 0)}
                    </span>
                  </div>
                  {stats.models.sv.lastDNA && (
                    <>
                      <div className="px-4 py-3 bg-[#0d0d0d]">
                        <div className="text-[10px] font-mono text-[#666] mb-2">DNA FINGERPRINT</div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2">
                            <span className="text-[10px] text-[#555] font-mono">Hash</span>
                            <span className="text-[10px] text-[#888] font-mono text-right">
                              {stats.models.sv.lastDNA.dna_hash?.substring(0, 16)}...
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-[10px] text-[#555] font-mono">Updated</span>
                            <span className="text-[10px] text-[#888] font-mono text-right">
                              {formatTimestamp(stats.models.sv.lastDNA.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Details - English */}
          {stats.models?.en && (
            <div className="border border-[#1a1a1a] rounded">
              <div className="border-b border-[#1a1a1a] px-4 py-3">
                <h3 className="text-xs font-mono text-[#888]">ONESEEK-7B-ZERO-EN</h3>
              </div>
              
              {stats.models.en.error ? (
                <div className="px-4 py-3">
                  <p className="text-[10px] text-[#555] font-mono">{stats.models.en.error}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Stage 1 Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.en.stage1Samples || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Stage 2 Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.en.stage2Samples || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2 hover:bg-[#0d0d0d] transition-colors">
                    <span className="text-[10px] font-mono text-[#666]">Total Samples</span>
                    <span className="text-[10px] font-mono text-[#888] text-right">
                      {formatNumber(stats.models.en.totalSamples || 0)}
                    </span>
                  </div>
                  {stats.models.en.lastDNA && (
                    <>
                      <div className="px-4 py-3 bg-[#0d0d0d]">
                        <div className="text-[10px] font-mono text-[#666] mb-2">DNA FINGERPRINT</div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2">
                            <span className="text-[10px] text-[#555] font-mono">Hash</span>
                            <span className="text-[10px] text-[#888] font-mono text-right">
                              {stats.models.en.lastDNA.dna_hash?.substring(0, 16)}...
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-[10px] text-[#555] font-mono">Updated</span>
                            <span className="text-[10px] text-[#888] font-mono text-right">
                              {formatTimestamp(stats.models.en.lastDNA.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Live Training Events */}
      <div>
        <LiveMicroTraining />
      </div>

      {/* Information Footer */}
      <div className="border border-[#1a1a1a] rounded">
        <div className="border-b border-[#1a1a1a] px-4 py-3">
          <h3 className="text-xs font-mono text-[#888]">HOW IT WORKS</h3>
        </div>
        <div className="px-4 py-3">
          <div className="space-y-2 text-[10px] font-mono text-[#666] leading-relaxed">
            <p>→ Automatic language detection on every question</p>
            <p>→ Two-stage training: Stage 1 (raw responses) + Stage 2 (analyzed data)</p>
            <p>→ DNA fingerprint updated every 50 questions</p>
            <p>→ Training runs automatically - no manual intervention</p>
            <p>→ Each language trains its own model</p>
          </div>
        </div>
      </div>
    </div>
  );
}
