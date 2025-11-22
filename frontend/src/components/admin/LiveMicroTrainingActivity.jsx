import { useState, useEffect } from 'react';
import LiveMicroTraining from '../LiveMicroTraining';

/**
 * LiveMicroTrainingActivity Component
 * Admin dashboard view for real-time micro-training activity
 * Shows statistics, recent training events, and language-specific metrics
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
    if (!timestamp) return 'Aldrig';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-civic-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-civic-gray-900">
          Micro-Training Activity
        </h2>
        <p className="text-sm text-civic-gray-600 mt-1">
          Real-time monitoring of language-specific model training
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-civic-gray-200 border-t-civic-gray-600 rounded-full mx-auto"></div>
          <p className="text-sm text-civic-gray-600 mt-2">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading statistics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : stats ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Runs */}
            <div className="bg-white border border-civic-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-civic-gray-600">Total Training Runs</p>
                  <p className="text-2xl font-bold text-civic-gray-900 mt-1">
                    {formatNumber(stats.totalRuns || 0)}
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            {/* Swedish Model */}
            <div className="bg-white border border-civic-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-civic-gray-600">Swedish Model (SV)</p>
                  <p className="text-2xl font-bold text-civic-gray-900 mt-1">
                    {formatNumber(stats.runsByLanguage?.sv || 0)}
                  </p>
                </div>
                <div className="text-4xl">🇸🇪</div>
              </div>
            </div>

            {/* English Model */}
            <div className="bg-white border border-civic-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-civic-gray-600">English Model (EN)</p>
                  <p className="text-2xl font-bold text-civic-gray-900 mt-1">
                    {formatNumber(stats.runsByLanguage?.en || 0)}
                  </p>
                </div>
                <div className="text-4xl">🇬🇧</div>
              </div>
            </div>
          </div>

          {/* Model Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Swedish Model Details */}
            {stats.models?.sv && (
              <div className="bg-white border border-civic-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-civic-gray-900 mb-4 flex items-center gap-2">
                  <span>🇸🇪</span>
                  <span>OneSeek-7B-Zero-sv</span>
                </h3>
                
                {stats.models.sv.error ? (
                  <p className="text-sm text-red-600">{stats.models.sv.error}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Stage 1 Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.sv.stage1Samples || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Stage 2 Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.sv.stage2Samples || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Total Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.sv.totalSamples || 0)}
                      </span>
                    </div>
                    {stats.models.sv.lastDNA && (
                      <>
                        <div className="pt-3 mt-3 border-t border-civic-gray-200">
                          <p className="text-sm font-medium text-civic-gray-700 mb-2">
                            🧬 Latest DNA Fingerprint
                          </p>
                          <div className="bg-civic-gray-50 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-civic-gray-600">Hash</span>
                              <span className="text-xs font-mono text-civic-gray-900">
                                {stats.models.sv.lastDNA.dna_hash?.substring(0, 16)}...
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-civic-gray-600">Updated</span>
                              <span className="text-xs text-civic-gray-900">
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

            {/* English Model Details */}
            {stats.models?.en && (
              <div className="bg-white border border-civic-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-civic-gray-900 mb-4 flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span>OneSeek-7B-Zero-en</span>
                </h3>
                
                {stats.models.en.error ? (
                  <p className="text-sm text-red-600">{stats.models.en.error}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Stage 1 Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.en.stage1Samples || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Stage 2 Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.en.stage2Samples || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-civic-gray-100">
                      <span className="text-sm text-civic-gray-600">Total Samples</span>
                      <span className="text-sm font-medium text-civic-gray-900">
                        {formatNumber(stats.models.en.totalSamples || 0)}
                      </span>
                    </div>
                    {stats.models.en.lastDNA && (
                      <>
                        <div className="pt-3 mt-3 border-t border-civic-gray-200">
                          <p className="text-sm font-medium text-civic-gray-700 mb-2">
                            🧬 Latest DNA Fingerprint
                          </p>
                          <div className="bg-civic-gray-50 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-civic-gray-600">Hash</span>
                              <span className="text-xs font-mono text-civic-gray-900">
                                {stats.models.en.lastDNA.dna_hash?.substring(0, 16)}...
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-civic-gray-600">Updated</span>
                              <span className="text-xs text-civic-gray-900">
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
          </div>

          {/* Last Run Info */}
          {stats.lastRun && (
            <div className="bg-civic-gray-50 border border-civic-gray-200 rounded-lg p-4">
              <p className="text-sm text-civic-gray-600">
                <span className="font-medium">Senaste träning:</span>{' '}
                {formatTimestamp(stats.lastRun)}
              </p>
            </div>
          )}
        </>
      ) : null}

      {/* Live Training Events */}
      <div>
        <LiveMicroTraining />
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          ℹ️ How Micro-Training Works
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Automatic language detection on every question (Swedish/English)</li>
          <li>Two-stage training: Stage 1 (raw AI responses) + Stage 2 (analyzed data)</li>
          <li>DNA fingerprint updated every 50 questions for tamper-proof provenance</li>
          <li>Training runs automatically - no manual intervention needed</li>
          <li>Each language trains its own model: OneSeek-7B-Zero-sv & OneSeek-7B-Zero-en</li>
        </ul>
      </div>
    </div>
  );
}
