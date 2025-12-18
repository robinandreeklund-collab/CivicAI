import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, TrendingUp, Trophy, BarChart3 } from 'lucide-react';

/**
 * PES Evolution Results Page
 * Displays detailed results from a completed evolution loop
 */
const PESEvolutionResultsPage = () => {
  const { evolutionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, [evolutionId]);

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/pes/evolution/${evolutionId}/results`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load results');
      }
    } catch (err) {
      console.error('Error loading results:', err);
      setError('Failed to load results: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/pes/evolution')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const winner = results.winner;
  const improvement = results.improvement_percentage;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button onClick={() => navigate('/pes/evolution')} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2">Evolution Results</h1>
        <p className="text-gray-600 font-mono text-sm">{results.evolution_id}</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{results.status}</div>
            <div className="text-sm text-gray-600">Status</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {improvement > 0 ? '+' : ''}{improvement?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600">Improvement</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{results.debates_analyzed || 0}</div>
            <div className="text-sm text-gray-600">Debates Analyzed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{results.variants?.length || 0}</div>
            <div className="text-sm text-gray-600">Variants Tested</div>
          </CardContent>
        </Card>
      </div>

      {/* Winner Card */}
      {winner && (
        <Card className="mb-6 border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <CardTitle>Winner: {winner.version}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600">Average Votes</div>
                <div className="text-2xl font-bold text-blue-600">
                  {winner.avg_votes_per_debate?.toFixed(1) || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {((winner.win_rate || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Mentions</div>
                <div className="text-2xl font-bold text-purple-600">
                  {winner.avg_mentions_per_debate?.toFixed(1) || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Debates Won</div>
                <div className="text-2xl font-bold">
                  {winner.wins || 0}/{winner.debates_simulated || 0}
                </div>
              </div>
            </div>

            {winner.votes_by_category && Object.keys(winner.votes_by_category).length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Votes by Category</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(winner.votes_by_category).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 capitalize">{category}</div>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Variants Comparison */}
      {results.variants && results.variants.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              All Variants Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.variants.map((variant, index) => {
                const isWinner = variant.version === winner?.version;
                return (
                  <div
                    key={variant.version}
                    className={`p-4 rounded-lg border ${
                      isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{variant.version}</span>
                          {isWinner && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              WINNER
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{variant.hypothesis}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      Expected: {variant.expected_improvement}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {results.insights && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.insights.successful_patterns && results.insights.successful_patterns.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">✓ Successful Patterns</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {results.insights.successful_patterns.slice(0, 5).map((pattern, i) => (
                      <li key={i}>{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.weaknesses && results.insights.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">⚠ Areas for Improvement</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {results.insights.weaknesses.slice(0, 5).map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.winning_styles && results.insights.winning_styles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">🎯 Winning Styles</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {results.insights.winning_styles.slice(0, 5).map((style, i) => (
                      <li key={i}>{style}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.strategic_recommendations && results.insights.strategic_recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">💡 Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {results.insights.strategic_recommendations.slice(0, 5).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baseline Comparison */}
      {results.baseline && (
        <Card>
          <CardHeader>
            <CardTitle>Baseline Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Baseline ({results.baseline.version})</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Votes:</span>
                    <span className="font-mono">{results.baseline.metrics?.avg_votes_per_debate?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-mono">{((results.baseline.metrics?.win_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mentions:</span>
                    <span className="font-mono">{results.baseline.metrics?.avg_mentions_per_debate?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Winner ({winner?.version || 'N/A'})</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Votes:</span>
                    <span className="font-mono font-bold text-green-600">
                      {winner?.avg_votes_per_debate?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-mono font-bold text-green-600">
                      {((winner?.win_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mentions:</span>
                    <span className="font-mono font-bold text-green-600">
                      {winner?.avg_mentions_per_debate?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PESEvolutionResultsPage;
