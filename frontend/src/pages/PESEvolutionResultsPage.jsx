import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
  const [expandedVariant, setExpandedVariant] = useState(null);
  const [copyingBaseline, setCopyingBaseline] = useState(false);

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

  const handleUseAsBaseline = async () => {
    if (!winner || !winner.prompt_text) {
      alert('Winner prompt text not available');
      return;
    }

    setCopyingBaseline(true);
    try {
      // Navigate to evolution page with winner prompt as baseline
      navigate('/pes/evolution', {
        state: {
          baselinePrompt: winner.prompt_text,
          baselineVersion: winner.version,
          fromEvolution: evolutionId
        }
      });
    } catch (err) {
      console.error('Error using as baseline:', err);
      alert('Failed to use as baseline');
    } finally {
      setCopyingBaseline(false);
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
        <button 
          onClick={() => navigate('/pes/evolution')} 
          className="mt-4 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const winner = results.winner;
  const improvement = results.improvement_percentage;

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto max-h-screen">
      <div className="max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/pes/evolution')} 
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Evolution Results</h1>
          <p className="text-gray-600 font-mono text-sm">{results.evolution_id}</p>
        </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="text-2xl font-bold text-blue-600">{results.status}</div>
            <div className="text-sm text-gray-600">Status</div>
          </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">
              {improvement > 0 ? '+' : ''}{improvement?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600">Improvement</div>
          </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="text-2xl font-bold">{results.debates_count || results.debates_analyzed || 0}</div>
            <div className="text-sm text-gray-600">Debates Analyzed</div>
          </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="text-2xl font-bold">{results.variants?.length || 0}</div>
            <div className="text-sm text-gray-600">Variants Tested</div>
          </div>
      </div>

      {/* Winner Card */}
      {winner && (
        <div className="mb-6 bg-white rounded-lg shadow-md border-2 border-green-500">
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h3 className="text-lg font-semibold text-gray-900">Winner: {winner.version}</h3>
              </div>
              <button
                onClick={handleUseAsBaseline}
                disabled={copyingBaseline}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copyingBaseline ? '...' : '🔄 Use as Baseline for Next Run'}
              </button>
            </div>
            {winner.hypothesis && (
              <p className="mt-2 text-sm text-gray-700">{winner.hypothesis}</p>
            )}
          </div>
          <div className="p-6">
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
                <div className="text-2xl font-bold text-gray-900">
                  {winner.wins || 0}/{winner.debates_simulated || 0}
                </div>
              </div>
            </div>

            {winner.votes_by_category && Object.keys(winner.votes_by_category).length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-gray-900">Votes by Category</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(winner.votes_by_category).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 capitalize">{category}</div>
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Variants Comparison */}
      {results.all_variant_metrics && Object.keys(results.all_variant_metrics).length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              📊 All Variants Comparison
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.values(results.all_variant_metrics).map((variant, index) => {
                const isWinner = variant.version === winner?.version;
                return (
                  <div
                    key={variant.version}
                    className={`p-4 rounded-lg border ${
                      isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900">{variant.version}</span>
                          {isWinner && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              WINNER
                            </span>
                          )}
                          <button
                            onClick={() => setExpandedVariant(expandedVariant === variant.version ? null : variant.version)}
                            className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            {expandedVariant === variant.version ? '▼ Hide Prompt' : '▶ View Prompt'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{variant.hypothesis || 'Testar promptvariant'}</p>
                        
                        {expandedVariant === variant.version && variant.prompt_text && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Prompt Text:</div>
                            <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                              {variant.prompt_text}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Avg Votes</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {variant.avg_votes_per_debate !== undefined ? variant.avg_votes_per_debate.toFixed(1) : '0.0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Win Rate</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {((variant.win_rate || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Mentions</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {variant.avg_mentions_per_debate !== undefined ? variant.avg_mentions_per_debate.toFixed(1) : '0.0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Score</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {((variant.composite_score || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>Förväntad förbättring:</strong> {variant.expected_improvement || 'Testar promptvariant med förändringar'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {results.insights && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              📈 Key Insights
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>🤖 AI-Generated:</strong> These insights are generated by ONESEEK analyzing {results.debates_analyzed || results.debates_count} debates. Not hardcoded.
              </div>

              {results.insights.successful_patterns && results.insights.successful_patterns.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">✓ Successful Patterns</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {results.insights.successful_patterns.slice(0, 5).map((pattern, i) => (
                      <li key={i} className="text-gray-700">{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.weaknesses && results.insights.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">⚠ Areas for Improvement</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {results.insights.weaknesses.slice(0, 5).map((weakness, i) => (
                      <li key={i} className="text-gray-700">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.winning_styles && results.insights.winning_styles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">🎯 Winning Styles</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {results.insights.winning_styles.slice(0, 5).map((style, i) => (
                      <li key={i} className="text-gray-700">{style}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.insights.strategic_recommendations && results.insights.strategic_recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">💡 Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {results.insights.strategic_recommendations.slice(0, 5).map((rec, i) => (
                      <li key={i} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Category Distribution Chart */}
      {results.category_distribution && results.category_distribution.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              📊 Category Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1">Debate topics analyzed in this evolution</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {results.category_distribution.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium text-gray-900">
                    {cat.main} → {cat.sub}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 flex items-center justify-end pr-2 text-xs text-white font-medium"
                        style={{ width: `${cat.percentage}%` }}
                      >
                        {cat.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {cat.count} debates
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Vector Radar Chart (Winner Analysis) */}
      {winner && winner.vector_metrics && winner.vector_metrics.avg_vector && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              🎯 Vector Analysis - Winner Profile
            </h3>
            <p className="text-sm text-gray-600 mt-1">8-dimensional analysis of what makes this prompt win</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(winner.vector_metrics.avg_vector).map(([dim, value]) => (
                <div key={dim} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2 capitalize">{dim.replace(/_/g, ' ')}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full ${
                          value >= 0.8 ? 'bg-green-500' : 
                          value >= 0.6 ? 'bg-blue-500' : 
                          value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                    <div className="text-sm font-bold text-gray-900 w-12 text-right">
                      {(value * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {winner.vector_insights && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {winner.vector_insights.strongest_dimensions && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">💪 Strongest Dimensions</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {winner.vector_insights.strongest_dimensions.map((dim, i) => (
                        <li key={i} className="capitalize">{dim.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {winner.vector_insights.improvement_targets && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">📈 Improvement Targets</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {winner.vector_insights.improvement_targets.map((dim, i) => (
                        <li key={i} className="capitalize">{dim.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Consistency Score:</strong> {((winner.vector_metrics.consistency_score || 0) * 100).toFixed(1)}% 
              (variance: {(winner.vector_metrics.variance || 0).toFixed(3)})
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Category Performance Breakdown */}
      {results.category_performance && Object.keys(results.category_performance).length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              📈 Category Performance Breakdown
            </h3>
            <p className="text-sm text-gray-600 mt-1">Performance per topic category</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(results.category_performance).map(([category, data]) => (
                <div key={category} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {data.main} → {data.sub}
                    <span className="text-sm text-gray-500 ml-2">({data.debates_count} debates)</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Avg Votes</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {data.avg_votes?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Win Rate</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {((data.win_rate || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Mentions</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {data.avg_mentions?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Real Voting Validation */}
      <RealVotingValidation evolutionId={evolutionId} results={results} onValidationComplete={loadResults} />

      {/* Baseline Comparison */}
      {results.baseline && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Baseline Comparison</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Baseline ({results.baseline.version})</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Avg Votes:</span>
                    <span className="font-mono text-gray-900">{results.baseline.metrics?.avg_votes_per_debate?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-mono text-gray-900">{((results.baseline.metrics?.win_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mentions:</span>
                    <span className="font-mono text-gray-900">{results.baseline.metrics?.avg_mentions_per_debate?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Winner ({winner?.version || 'N/A'})</h4>
                <div className="space-y-2 text-sm text-gray-700">
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
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

/**
 * PHASE 3: Real Voting Validation Component
 */
const RealVotingValidation = ({ evolutionId, results, onValidationComplete }) => {
  const [validating, setValidating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const validation = results.real_validation;

  const handleValidate = async () => {
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`/api/pes/evolution/${evolutionId}/validate`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Validation completed! Cost: $${data.cost?.toFixed(2)}`);
        onValidationComplete();
      } else {
        alert(`Validation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Validation failed: ' + error.message);
    } finally {
      setValidating(false);
      setShowWarning(false);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          🧪 Real-World Validation
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Test this winning prompt against real external AI voting to validate simulation accuracy
        </p>
      </div>
      <div className="p-6">
        {!validation ? (
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Validation calls real external APIs (GPT, Gemini, DeepSeek, Grok) to compare simulated vs actual votes.
              This helps calibrate the simulation model for better accuracy.
            </p>
            
            {showWarning && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Cost Warning</p>
                <p className="text-sm text-yellow-700">
                  This will call 4 external AI APIs with an estimated cost of <strong>~$0.50-1.00</strong>.
                  Are you sure you want to continue?
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={validating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Validating...
                  </>
                ) : showWarning ? (
                  '✓ Yes, Proceed with Validation'
                ) : (
                  '🧪 Validate with Real Voting (~$0.75)'
                )}
              </button>
              
              {showWarning && (
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              ✓ Validation completed on {new Date(validation.validated_at).toLocaleString()}
            </div>
            
            {validation.comparison && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Vote Accuracy</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(validation.comparison.vote_accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Overall Accuracy</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(validation.comparison.accuracy_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Cost</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {validation.cost_estimate || '$0.75'}
                    </div>
                  </div>
                </div>
                
                {validation.calibration_report && validation.calibration_report.recommendations && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Calibration Recommendations</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {validation.calibration_report.recommendations.map((rec, i) => (
                        <li key={i}>
                          <strong>{rec.dimension}:</strong> {rec.suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PESEvolutionResultsPage;
