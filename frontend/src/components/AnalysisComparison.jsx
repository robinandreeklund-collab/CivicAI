/**
 * AnalysisComparison Component
 * Timeline-based visual comparison of analysis across all AI responses
 * Includes spaCy-like NLP, TextBlob-like sentiment, GPT-3.5 meta-review, and Tavily Search fact-checking
 * Clean, modern list view with timestamps
 */
export default function AnalysisComparison({ responses, metaReview, factCheckComparison }) {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Filter responses that have analysis data
  const analyzedResponses = responses.filter(r => r.analysis);

  if (analyzedResponses.length === 0) {
    return null;
  }

  // Agent theme mapping
  const agentThemes = {
    'gpt-3.5': { icon: '🤖', color: '#3b82f6', name: 'GPT-3.5' },
    'gemini': { icon: '✨', color: '#a855f7', name: 'Gemini' },
    'deepseek': { icon: '🧠', color: '#06b6d4', name: 'DeepSeek' },
    'claude': { icon: '🎭', color: '#f97316', name: 'Claude' },
    'llama': { icon: '🦙', color: '#22c55e', name: 'Llama' },
    'mistral': { icon: '🌪️', color: '#6366f1', name: 'Mistral' },
    'palm': { icon: '🌴', color: '#10b981', name: 'PaLM' },
    'cohere': { icon: '🔮', color: '#ec4899', name: 'Cohere' },
    'anthropic': { icon: '🔬', color: '#14b8a6', name: 'Anthropic' },
    'openai': { icon: '⚡', color: '#eab308', name: 'OpenAI' },
  };

  const getAgentTheme = (agentId) => {
    return agentThemes[agentId] || { icon: '🤖', color: '#6b7280', name: agentId };
  };

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-4 p-4 bg-civic-dark-800/50 backdrop-blur-sm border border-civic-dark-600 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-3 animate-slide-in-right">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-base font-semibold text-gray-100">Analysjämförelse</h3>
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            {analyzedResponses.length} AI
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
            <span>🧠</span>
            <span className="text-gray-400">NLP</span>
          </span>
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">
            <span>💭</span>
            <span className="text-gray-400">Sentiment</span>
          </span>
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-orange-500/10 rounded border border-orange-500/20">
            <span>🔍</span>
            <span className="text-gray-400">Faktakoll</span>
          </span>
        </div>
      </div>

      {/* Tavily Search Fact-Check Comparison - Compact */}
      {factCheckComparison && factCheckComparison.available && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-lg">🔍</div>
            <div className="flex-1 text-xs">
              <h4 className="font-semibold text-blue-300 mb-1 flex items-center flex-wrap gap-1.5">
                <span>Tavily Search Faktakoll</span>
                {factCheckComparison.bestAgent && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
                    🏆 {factCheckComparison.bestAgent} ({factCheckComparison.bestScore}/10)
                  </span>
                )}
                {factCheckComparison.averageScore && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                    📊 {factCheckComparison.averageScore}/10
                  </span>
                )}
              </h4>
              
              {factCheckComparison.summary && (
                <p className="text-gray-300 mb-1">{factCheckComparison.summary}</p>
              )}
              
              <div className="text-gray-400">
                <span className="font-medium text-green-300">
                  ✓ {factCheckComparison.totalVerified} av {factCheckComparison.totalClaims} verifierade
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!factCheckComparison?.available && factCheckComparison?.message && (
        <div className="mb-3 p-2 bg-yellow-900/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
          ⚠️ {factCheckComparison.message}
        </div>
      )}

      {/* GPT-3.5 Meta-Review Section - Compact */}
      {metaReview && metaReview.available && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-lg">🤖</div>
            <div className="flex-1 text-xs">
              <h4 className="font-semibold text-purple-300 mb-1 flex items-center flex-wrap gap-1.5">
                <span>GPT-3.5 Meta-granskning</span>
                {metaReview.consistency && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    ⚖️ {metaReview.consistency}/10
                  </span>
                )}
                {metaReview.overallQuality && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
                    ⭐ {metaReview.overallQuality}/10
                  </span>
                )}
              </h4>
              
              {metaReview.metaSummary && (
                <p className="text-gray-300 mb-2">{metaReview.metaSummary}</p>
              )}
              
              {metaReview.recommendedAgent && (
                <div className="text-green-300 mb-1">
                  <span className="font-medium">🎯 Rekommenderat:</span> {metaReview.recommendedAgent}
                  {metaReview.recommendationReason && (
                    <span className="text-gray-400"> - {metaReview.recommendationReason}</span>
                  )}
                </div>
              )}
              
              {metaReview.warnings && metaReview.warnings.length > 0 && (
                <div className="mt-1">
                  <span className="text-orange-300 font-medium">⚠️ Varningar:</span>
                  <ul className="list-disc list-inside text-gray-400 ml-3 mt-0.5">
                    {metaReview.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {metaReview.biasPatterns && metaReview.biasPatterns.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-gray-400">Bias:</span>
                  {metaReview.biasPatterns.map((pattern, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {pattern}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Timeline List View - Two Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {analyzedResponses.map((resp, idx) => {
          const theme = getAgentTheme(resp.agent);
          const timestamp = getTimestamp();
          
          return (
            <div
              key={idx}
              className="relative group animate-fade-in-scale"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Compact content card */}
              <div 
                className="bg-civic-dark-700/30 rounded-lg border border-civic-dark-600 p-3 hover:border-civic-dark-500 transition-all duration-300 h-full"
                style={{
                  borderLeftColor: theme.color,
                  borderLeftWidth: '2px',
                }}
              >
                {/* Compact header with icon */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ 
                        backgroundColor: `${theme.color}20`,
                        border: `1px solid ${theme.color}60`,
                      }}
                    >
                      {theme.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-200 flex items-center space-x-1.5 flex-wrap">
                        <span>{theme.name}</span>
                        {resp.analysis?.confidence && (
                          <span 
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${theme.color}20`,
                              color: theme.color
                            }}
                          >
                            {Math.round(resp.analysis.confidence * 100)}%
                          </span>
                        )}
                      </h4>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {resp.metadata?.model || resp.agent}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact analysis details in grid */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {/* Tone */}
                  {resp.analysis?.tone && (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>💬</span>
                        <span>Ton</span>
                      </div>
                      <div className="text-xs text-gray-200 truncate">
                        {resp.analysis.tone.description}
                      </div>
                    </div>
                  )}

                  {/* Bias */}
                  {resp.analysis?.bias && (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>⚖️</span>
                        <span>Bias</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-semibold ${
                          resp.analysis.bias.biasScore > 5 ? 'text-red-400' :
                          resp.analysis.bias.biasScore > 2 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {resp.analysis.bias.biasScore}/10
                        </span>
                        {resp.analysis.bias.detectedBiases.length > 0 && (
                          <span className="text-xs text-gray-500">
                            ({resp.analysis.bias.detectedBiases.length})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fact Check */}
                  {(resp.bingFactCheck?.available || resp.analysis?.factCheck) && (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Fakta</span>
                      </div>
                      {resp.bingFactCheck?.available ? (
                        <div className="text-xs">
                          <span className={`font-medium ${
                            resp.bingFactCheck.verifiedCount === resp.bingFactCheck.totalClaims ? 'text-green-400' :
                            resp.bingFactCheck.verifiedCount > 0 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {resp.bingFactCheck.verifiedCount}/{resp.bingFactCheck.totalClaims}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-200">
                          {resp.analysis.factCheck.claimsFound} påståenden
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Compact Meta-Analysis */}
                {resp.metaAnalysis && (
                  <div className="mt-2 pt-2 border-t border-civic-dark-600">
                    <div className="text-xs font-medium text-cyan-300 mb-1 flex items-center space-x-1">
                      <span>🧠</span>
                      <span>NLP + Sentiment</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {resp.metaAnalysis.nlp && (
                        <div className="text-gray-400 truncate">
                          📝 {resp.metaAnalysis.nlp.sentences} m, {resp.metaAnalysis.nlp.words} ord
                        </div>
                      )}
                      {resp.metaAnalysis.sentiment && (
                        <div className={`truncate ${
                          resp.metaAnalysis.sentiment.sentiment === 'positive' ? 'text-green-400' :
                          resp.metaAnalysis.sentiment.sentiment === 'negative' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          💭 {
                            resp.metaAnalysis.sentiment.sentiment === 'positive' ? 'Positiv' :
                            resp.metaAnalysis.sentiment.sentiment === 'negative' ? 'Negativ' :
                            'Neutral'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compact Tavily Search Fact-Check Results */}
                {resp.bingFactCheck && resp.bingFactCheck.available && resp.bingFactCheck.overallScore !== null && (
                  <div className="mt-2 pt-2 border-t border-civic-dark-600">
                    <div className="text-xs font-medium text-blue-300 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Tavily</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded ${
                        resp.bingFactCheck.overallScore >= 7 ? 'bg-green-500/20 text-green-300' :
                        resp.bingFactCheck.overallScore >= 4 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {resp.bingFactCheck.overallScore}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact footer */}
      <div className="mt-3 pt-2 border-t border-civic-dark-600">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {analyzedResponses.length} svar • Snitt {Math.round(analyzedResponses.reduce((acc, r) => acc + (r.analysis?.confidence || 0), 0) / analyzedResponses.length * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
