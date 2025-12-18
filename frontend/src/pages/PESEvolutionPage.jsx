import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PES Evolution Dashboard
 * Main page for managing and monitoring PES Phase 2 evolution loops
 */
const PESEvolutionPage = () => {
  const navigate = useNavigate();
  const [evolutions, setEvolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showStartForm, setShowStartForm] = useState(false);
  
  // Form state
  const [config, setConfig] = useState({
    baseline_prompt: '',
    baseline_version: 'v1.0.0',
    debate_count: 15,
    variant_count: 5,
    auto_iterate: false
  });

  // Load evolutions on mount
  useEffect(() => {
    loadEvolutions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadEvolutions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadEvolutions = async () => {
    try {
      const response = await fetch('/api/pes/evolutions?limit=20');
      const data = await response.json();
      
      if (data.evolutions) {
        setEvolutions(data.evolutions);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading evolutions:', err);
      setError('Failed to load evolutions');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvolution = async (evolutionId) => {
    if (!confirm(`Are you sure you want to delete evolution ${evolutionId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pes/evolution/${evolutionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess(`Evolution ${evolutionId} deleted successfully`);
        setTimeout(() => setSuccess(null), 5000);
        loadEvolutions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete evolution');
      }
    } catch (err) {
      console.error('Error deleting evolution:', err);
      setError('Failed to delete evolution');
    }
  };

  const startEvolution = async () => {
    if (!config.baseline_prompt.trim()) {
      setError('Baseline prompt is required');
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/pes/evolution/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setShowStartForm(false);
        loadEvolutions();
        // Show success message
        setSuccess(`Evolution started! ID: ${data.evolution_id}. Estimated time: ${data.estimated_time_minutes} minutes`);
        setTimeout(() => setSuccess(null), 10000); // Clear after 10 seconds
      } else {
        setError(data.error || 'Failed to start evolution');
      }
    } catch (err) {
      console.error('Error starting evolution:', err);
      setError('Failed to start evolution: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⏳';
      default:
        return '⏱️';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading evolutions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">PES Phase 2: Evolution Dashboard</h1>
          <p className="text-gray-600">
            AI-driven prompt evolution system for ONESEEK
          </p>
        </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowStartForm(!showStartForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          ▶️ Start New Evolution Loop
        </button>
        <button
          onClick={loadEvolutions}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 bg-white"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Start Evolution Form */}
      {showStartForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Start New Evolution Loop</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Baseline Prompt
                </label>
                <textarea
                  value={config.baseline_prompt}
                  onChange={(e) => setConfig({ ...config, baseline_prompt: e.target.value })}
                  className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  rows={6}
                  placeholder="Enter the current baseline prompt..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Baseline Version
                  </label>
                  <input
                    type="text"
                    value={config.baseline_version}
                    onChange={(e) => setConfig({ ...config, baseline_version: e.target.value })}
                    className="w-full p-2 border rounded-md text-gray-900 bg-white"
                    placeholder="v1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Number of Debates
                  </label>
                  <input
                    type="number"
                    value={config.debate_count}
                    onChange={(e) => setConfig({ ...config, debate_count: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-md text-gray-900 bg-white"
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Number of Variants
                  </label>
                  <input
                    type="number"
                    value={config.variant_count}
                    onChange={(e) => setConfig({ ...config, variant_count: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-md text-gray-900 bg-white"
                    min="2"
                    max="10"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.auto_iterate}
                      onChange={(e) => setConfig({ ...config, auto_iterate: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-iterate if improved</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startEvolution}
                  disabled={starting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {starting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      ▶️ Start Evolution
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowStartForm(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolution List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Evolution Runs</h3>
        </div>
        <div className="p-6">
          {evolutions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No evolution runs yet. Start one above!
            </div>
          ) : (
            <div className="space-y-4">
              {evolutions.map((evolution) => (
                <div
                  key={evolution.evolution_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(evolution.status)}
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {evolution.evolution_id}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          evolution.status === 'completed' ? 'bg-green-100 text-green-700' :
                          evolution.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {evolution.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Started</div>
                          <div className="font-medium text-gray-900">{formatTimestamp(evolution.timestamp)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Duration</div>
                          <div className="font-medium text-gray-900">{formatDuration(evolution.duration_seconds)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Debates</div>
                          <div className="font-medium text-gray-900">{evolution.debates_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Winner</div>
                          <div className="font-medium text-gray-900">{evolution.winner_version || 'N/A'}</div>
                        </div>
                      </div>

                      {evolution.improvement !== undefined && (
                        <div className="mt-2">
                          <span className={`text-sm font-semibold ${
                            evolution.improvement > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {evolution.improvement > 0 ? '+' : ''}{evolution.improvement.toFixed(1)}% improvement
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {evolution.status === 'running' && (
                        <button
                          className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 rounded text-gray-700 bg-white"
                          onClick={() => navigate(`/pes/evolution/${evolution.evolution_id}/progress`)}
                        >
                          View Progress
                        </button>
                      )}
                      {evolution.status === 'completed' && (
                        <button
                          className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 rounded text-gray-700 bg-white"
                          onClick={() => navigate(`/pes/evolution/${evolution.evolution_id}/results`)}
                        >
                          View Results
                        </button>
                      )}
                      <button
                        className="px-3 py-1 text-sm border border-red-300 hover:bg-red-50 rounded text-red-700 bg-white"
                        onClick={() => deleteEvolution(evolution.evolution_id)}
                        title="Delete this evolution run"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">How It Works</h3>
        </div>
        <div className="p-6">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>System analyzes historical debate data using AI to identify success patterns</li>
            <li>Generates multiple prompt variants based on insights</li>
            <li>Simulates each variant on historical debates</li>
            <li>Uses AI to vote on simulated responses</li>
            <li>Aggregates performance metrics and selects the best variant</li>
            <li>Provides detailed comparison and improvement analysis</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-900">
            <strong>Note:</strong> Evolution loops typically take 30-60 minutes depending on the number of debates and variants.
            Results are saved to Firebase and can be reviewed anytime.
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PESEvolutionPage;
