import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading evolutions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">PES Phase 2: Evolution Dashboard</h1>
        <p className="text-gray-600">
          AI-driven prompt evolution system for ONESEEK
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <Button
          onClick={() => setShowStartForm(!showStartForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Play className="w-4 h-4 mr-2" />
          Start New Evolution Loop
        </Button>
        <Button
          onClick={loadEvolutions}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Start Evolution Form */}
      {showStartForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start New Evolution Loop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Baseline Prompt
                </label>
                <textarea
                  value={config.baseline_prompt}
                  onChange={(e) => setConfig({ ...config, baseline_prompt: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={6}
                  placeholder="Enter the current baseline prompt..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Baseline Version
                  </label>
                  <input
                    type="text"
                    value={config.baseline_version}
                    onChange={(e) => setConfig({ ...config, baseline_version: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="v1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Debates
                  </label>
                  <input
                    type="number"
                    value={config.debate_count}
                    onChange={(e) => setConfig({ ...config, debate_count: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-md"
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Variants
                  </label>
                  <input
                    type="number"
                    value={config.variant_count}
                    onChange={(e) => setConfig({ ...config, variant_count: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-md"
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
                    <span className="text-sm font-medium">Auto-iterate if improved</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={startEvolution}
                  disabled={starting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {starting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Evolution
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowStartForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution List */}
      <Card>
        <CardHeader>
          <CardTitle>Evolution Runs</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <span className="font-mono text-sm font-semibold">
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
                          <div className="font-medium">{formatTimestamp(evolution.timestamp)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Duration</div>
                          <div className="font-medium">{formatDuration(evolution.duration_seconds)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Debates</div>
                          <div className="font-medium">{evolution.debates_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Winner</div>
                          <div className="font-medium">{evolution.winner_version || 'N/A'}</div>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/pes/evolution/${evolution.evolution_id}/progress`)}
                        >
                          View Progress
                        </Button>
                      )}
                      {evolution.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/pes/evolution/${evolution.evolution_id}/results`)}
                        >
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>System analyzes historical debate data using AI to identify success patterns</li>
            <li>Generates multiple prompt variants based on insights</li>
            <li>Simulates each variant on historical debates</li>
            <li>Uses AI to vote on simulated responses</li>
            <li>Aggregates performance metrics and selects the best variant</li>
            <li>Provides detailed comparison and improvement analysis</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
            <strong>Note:</strong> Evolution loops typically take 30-60 minutes depending on the number of debates and variants.
            Results are saved to Firebase and can be reviewed anytime.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PESEvolutionPage;
