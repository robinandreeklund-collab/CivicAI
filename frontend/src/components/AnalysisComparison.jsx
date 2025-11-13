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
    <div className="mt-6 p-6 bg-civic-dark-800/50 backdrop-blur-sm border border-civic-dark-600 rounded-2xl shadow-lg overflow-hidden animate-fade-in-up">
      {/* Animated header with glow effect */}
      <div className="flex items-center justify-between mb-6 animate-slide-in-right">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <svg className="w-6 h-6 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full animate-glow-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Analysjämförelse</h3>
          <span className="text-xs text-gray-500 ml-2 px-2 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 animate-fade-in-scale">
            {analyzedResponses.length} AI-tjänster
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 animate-fade-in-scale hover:bg-blue-500/20 transition-colors" style={{ animationDelay: '100ms' }}>
            <span className="animate-wiggle">🧠</span>
            <span className="text-gray-300">spaCy-NLP</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 animate-fade-in-scale hover:bg-purple-500/20 transition-colors" style={{ animationDelay: '200ms' }}>
            <span className="animate-wiggle" style={{ animationDelay: '0.2s' }}>💭</span>
            <span className="text-gray-300">TextBlob-Sentiment</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 animate-fade-in-scale hover:bg-cyan-500/20 transition-colors" style={{ animationDelay: '300ms' }}>
            <span className="animate-wiggle" style={{ animationDelay: '0.4s' }}>🤖</span>
            <span className="text-gray-300">GPT-3.5 Metagranskare</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20 animate-fade-in-scale hover:bg-orange-500/20 transition-colors" style={{ animationDelay: '400ms' }}>
            <span className="animate-wiggle" style={{ animationDelay: '0.6s' }}>🔍</span>
            <span className="text-gray-300">Tavily Search Faktakoll</span>
          </span>
        </div>
      </div>

      {/* Tavily Search Fact-Check Comparison */}
      {factCheckComparison && factCheckComparison.available && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl animate-fade-in-scale hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-start space-x-3">
            <div className="text-2xl animate-bounce-slow">🔍</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center flex-wrap gap-2">
                <span>Tavily Search Faktakoll</span>
                {factCheckComparison.bestAgent && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 animate-fade-in-scale hover:bg-blue-500/30 transition-colors">
                    🏆 Bäst: {factCheckComparison.bestAgent} ({factCheckComparison.bestScore}/10)
                  </span>
                )}
                {factCheckComparison.averageScore && (
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 animate-fade-in-scale hover:bg-cyan-500/30 transition-colors">
                    📊 Snitt: {factCheckComparison.averageScore}/10
                  </span>
                )}
              </h4>
              
              {factCheckComparison.summary && (
                <p className="text-sm text-gray-300 mb-2 animate-fade-in-up">{factCheckComparison.summary}</p>
              )}
              
              <div className="text-xs text-gray-400 animate-fade-in-up">
                <span className="font-medium text-green-300">
                  ✓ {factCheckComparison.totalVerified} av {factCheckComparison.totalClaims} påståenden verifierade
                </span>
                {' '}mot pålitliga webbkällor via Tavily Search API
              </div>
            </div>
          </div>
        </div>
      )}

      {!factCheckComparison?.available && factCheckComparison?.message && (
        <div className="mb-6 p-3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
          ⚠️ {factCheckComparison.message}
        </div>
      )}

      {/* GPT-3.5 Meta-Review Section */}
      {metaReview && metaReview.available && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl animate-fade-in-scale hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-start space-x-3">
            <div className="text-2xl animate-pulse">🤖</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center flex-wrap gap-2">
                <span>GPT-3.5 Meta-granskning</span>
                {metaReview.consistency && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 animate-fade-in-scale hover:bg-purple-500/30 transition-colors">
                    ⚖️ Konsistens: {metaReview.consistency}/10
                  </span>
                )}
                {metaReview.overallQuality && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 animate-fade-in-scale hover:bg-blue-500/30 transition-colors">
                    ⭐ Kvalitet: {metaReview.overallQuality}/10
                  </span>
                )}
              </h4>
              
              {metaReview.metaSummary && (
                <p className="text-sm text-gray-300 mb-3 animate-fade-in-up">{metaReview.metaSummary}</p>
              )}
              
              {metaReview.recommendedAgent && (
                <div className="text-xs text-green-300 mb-2 animate-fade-in-up">
                  <span className="font-medium">🎯 Rekommenderat svar:</span> {metaReview.recommendedAgent}
                  {metaReview.recommendationReason && (
                    <span className="text-gray-400"> - {metaReview.recommendationReason}</span>
                  )}
                </div>
              )}
              
              {metaReview.warnings && metaReview.warnings.length > 0 && (
                <div className="mt-2 text-xs animate-fade-in-up">
                  <span className="text-orange-300 font-medium">⚠️ Varningar:</span>
                  <ul className="list-disc list-inside text-gray-400 ml-4 mt-1">
                    {metaReview.warnings.map((warning, i) => (
                      <li key={i} className="animate-fade-in-scale" style={{ animationDelay: `${i * 100}ms` }}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {metaReview.biasPatterns && metaReview.biasPatterns.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-400">Bias-mönster:</span>
                  {metaReview.biasPatterns.map((pattern, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-fade-in-scale hover:bg-yellow-500/30 transition-colors" style={{ animationDelay: `${i * 100}ms` }}>
                      {pattern}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline List View */}
      <div className="space-y-3">
        {analyzedResponses.map((resp, idx) => {
          const theme = getAgentTheme(resp.agent);
          const timestamp = getTimestamp();
          
          return (
            <div
              key={idx}
              className="relative pl-12 pb-6 last:pb-0 group animate-fade-in-scale"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Timeline connector line */}
              {idx < analyzedResponses.length - 1 && (
                <div 
                  className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-civic-dark-600 to-transparent animate-fade-in"
                  style={{ 
                    backgroundImage: `linear-gradient(to bottom, ${theme.color}40, transparent)`,
                    animationDelay: `${idx * 100 + 50}ms`
                  }}
                />
              )}
              
              {/* Timeline dot/stamp */}
              <div 
                className="absolute left-0 top-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg transition-all duration-300 hover:scale-110 animate-scale-in"
                style={{ 
                  backgroundColor: `${theme.color}20`,
                  border: `2px solid ${theme.color}60`,
                  animationDelay: `${idx * 100 + 100}ms`
                }}
              >
                {theme.icon}
              </div>

              {/* Content card */}
              <div 
                className="bg-civic-dark-700/30 rounded-xl border border-civic-dark-600 p-4 hover:border-civic-dark-500 transition-all duration-300 hover:shadow-lg hover:shadow-current/10 animate-slide-in-right"
                style={{
                  borderLeftColor: theme.color,
                  borderLeftWidth: '3px',
                  animationDelay: `${idx * 100 + 150}ms`
                }}
              >
                  borderLeftColor: theme.color,
                  borderLeftWidth: '3px'
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-200 flex items-center space-x-2">
                      <span>{theme.name}</span>
                      {resp.analysis?.confidence && (
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${theme.color}20`,
                            color: theme.color
                          }}
                        >
                          {Math.round(resp.analysis.confidence * 100)}%
                        </span>
                      )}
                    </h4>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {resp.metadata?.model || resp.agent} • {timestamp}
                    </div>
                  </div>
                </div>

                {/* Analysis details in compact grid */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {/* Tone */}
                  {resp.analysis?.tone && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>💬</span>
                        <span>Ton</span>
                      </div>
                      <div className="text-sm text-gray-200">
                        {resp.analysis.tone.description}
                      </div>
                    </div>
                  )}

                  {/* Bias */}
                  {resp.analysis?.bias && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>⚖️</span>
                        <span>Bias</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${
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

                  {/* Fact Check - Use Tavily fact-check if available, otherwise original analysis */}
                  {(resp.bingFactCheck?.available || resp.analysis?.factCheck) && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-400 flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Fakta</span>
                      </div>
                      {resp.bingFactCheck?.available ? (
                        <div className="text-sm">
                          <span className={`font-medium ${
                            resp.bingFactCheck.verifiedCount === resp.bingFactCheck.totalClaims ? 'text-green-400' :
                            resp.bingFactCheck.verifiedCount > 0 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {resp.bingFactCheck.verifiedCount}/{resp.bingFactCheck.totalClaims} verifierade
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-200">
                          {resp.analysis.factCheck.claimsFound} påståenden
                          {resp.analysis.factCheck.recommendVerification && (
                            <span className="text-xs text-orange-400 ml-1">⚠️</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta-Analysis (spaCy NLP + TextBlob Sentiment) */}
                {resp.metaAnalysis && (
                  <div className="mt-3 pt-3 border-t border-civic-dark-600">
                    <div className="text-xs font-medium text-cyan-300 mb-2 flex items-center space-x-1">
                      <span>🧠</span>
                      <span>Avancerad analys (NLP + Sentiment)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {resp.metaAnalysis.nlp && (
                        <div className="space-y-1">
                          <div className="text-gray-400">
                            📝 {resp.metaAnalysis.nlp.sentences} meningar, {resp.metaAnalysis.nlp.words} ord
                          </div>
                          {resp.metaAnalysis.nlp.entities && (
                            <div className="text-gray-500">
                              {resp.metaAnalysis.nlp.entities.people.length > 0 && (
                                <span>👤 {resp.metaAnalysis.nlp.entities.people.length} personer</span>
                              )}
                              {resp.metaAnalysis.nlp.entities.organizations.length > 0 && (
                                <span className="ml-2">🏢 {resp.metaAnalysis.nlp.entities.organizations.length} org</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {resp.metaAnalysis.sentiment && (
                        <div className="space-y-1">
                          <div className={`font-medium ${
                            resp.metaAnalysis.sentiment.sentiment === 'positive' ? 'text-green-400' :
                            resp.metaAnalysis.sentiment.sentiment === 'negative' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            💭 Sentiment: {
                              resp.metaAnalysis.sentiment.sentiment === 'positive' ? 'Positiv' :
                              resp.metaAnalysis.sentiment.sentiment === 'negative' ? 'Negativ' :
                              'Neutral'
                            }
                          </div>
                          <div className="text-gray-500">
                            Polaritet: {Math.round(resp.metaAnalysis.sentiment.polarity * 100) / 100} 
                            {' • '}
                            Subjektivitet: {Math.round(resp.metaAnalysis.sentiment.subjectivity * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tavily Search Fact-Check Results */}
                {resp.bingFactCheck && resp.bingFactCheck.available && (
                  <div className="mt-3 pt-3 border-t border-civic-dark-600">
                    <div className="text-xs font-medium text-blue-300 mb-2 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Tavily Search Faktakoll</span>
                      </div>
                      {resp.bingFactCheck.overallScore !== null && (
                        <span className={`px-2 py-0.5 rounded ${
                          resp.bingFactCheck.overallScore >= 7 ? 'bg-green-500/20 text-green-300' :
                          resp.bingFactCheck.overallScore >= 4 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {resp.bingFactCheck.overallScore}/10
                        </span>
                      )}
                    </div>
                    
                    {resp.bingFactCheck.summary && (
                      <div className="text-xs text-gray-400 mb-2">{resp.bingFactCheck.summary}</div>
                    )}
                    
                    {resp.bingFactCheck.claims && resp.bingFactCheck.claims.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                          Visa {resp.bingFactCheck.claims.length} verifierade påståenden
                        </summary>
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-500/30">
                          {resp.bingFactCheck.claims.map((claim, claimIdx) => (
                            <div key={claimIdx} className="text-xs">
                              <div className={`font-medium mb-1 ${
                                claim.verified ? 'text-green-400' : 'text-orange-400'
                              }`}>
                                {claim.verified ? '✓' : '⚠️'} {claim.claim}
                              </div>
                              
                              {/* Claim metadata: type, confidence, source count */}
                              <div className="text-gray-500 text-xs ml-4 mb-1 flex items-center space-x-2">
                                {claim.claimType && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                    {claim.claimDescription || claim.claimType}
                                  </span>
                                )}
                                {claim.confidence !== undefined && (
                                  <span className={`px-1.5 py-0.5 rounded ${
                                    claim.confidence >= 6.7 ? 'bg-green-500/20 text-green-300' :
                                    claim.confidence >= 3.3 ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    Förtroende: {claim.confidence}/10
                                  </span>
                                )}
                                {claim.sourceCount !== undefined && (
                                  <span className="text-gray-400">
                                    {claim.sourceCount} {claim.sourceCount === 1 ? 'källa' : 'källor'}
                                  </span>
                                )}
                              </div>
                              
                              {claim.sources && claim.sources.length > 0 && (
                                <div className="text-gray-500 space-y-1 ml-4">
                                  {claim.sources.slice(0, 2).map((source, srcIdx) => (
                                    <div key={srcIdx} className="truncate">
                                      <a 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 underline"
                                      >
                                        {source.title}
                                      </a>
                                    </div>
                                  ))}
                                  {claim.sources.length > 2 && (
                                    <div className="text-gray-600">
                                      +{claim.sources.length - 2} fler källor
                                    </div>
                                  )}
                                </div>
                              )}
                              {claim.warning && (
                                <div className="text-orange-400 ml-4 mt-1">{claim.warning}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Sentiment tags (if available) */}
                {resp.analysis?.tone?.attributes && resp.analysis.tone.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-civic-dark-600">
                    {resp.analysis.tone.attributes.map((attr, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-civic-dark-600/50 text-gray-400"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-civic-dark-600">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>
              Totalt analyserat: <span className="text-gray-400 font-medium">{analyzedResponses.length} svar</span>
            </span>
            <span>•</span>
            <span>
              Genomsnittlig konfidens: <span className="text-gray-400 font-medium">
                {Math.round(analyzedResponses.reduce((acc, r) => acc + (r.analysis?.confidence || 0), 0) / analyzedResponses.length * 100)}%
              </span>
            </span>
          </div>
          <span className="text-cyan-400">Tidslinje</span>
        </div>
      </div>
    </div>
  );
}
