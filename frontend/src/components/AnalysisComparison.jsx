/**
 * AnalysisComparison Component
 * Visual comparison of analysis across all AI responses
 */
export default function AnalysisComparison({ responses }) {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Filter responses that have analysis data
  const analyzedResponses = responses.filter(r => r.analysis);

  if (analyzedResponses.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-6 bg-civic-dark-800/50 backdrop-blur-sm border border-civic-dark-600 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-100">Analysjämförelse</h3>
      </div>

      <div className="space-y-6">
        {/* Tone Comparison */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <span>💬</span>
            <span>Ton och stil</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analyzedResponses.map((resp, idx) => (
              <div
                key={idx}
                className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600"
              >
                <div className="text-xs font-medium text-gray-400 mb-2">
                  {resp.agent === 'gpt-3.5' ? '🤖 GPT-3.5' : '✨ Gemini'}
                </div>
                {resp.analysis?.tone && (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-200">
                      {resp.analysis.tone.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      Konfidens: {Math.round(resp.analysis.tone.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bias Comparison */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <span>⚖️</span>
            <span>Bias-detektion</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analyzedResponses.map((resp, idx) => (
              <div
                key={idx}
                className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600"
              >
                <div className="text-xs font-medium text-gray-400 mb-2">
                  {resp.agent === 'gpt-3.5' ? '🤖 GPT-3.5' : '✨ Gemini'}
                </div>
                {resp.analysis?.bias && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Bias-poäng:</span>
                      <span className={`text-sm font-semibold ${
                        resp.analysis.bias.biasScore > 5 ? 'text-red-400' :
                        resp.analysis.bias.biasScore > 2 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {resp.analysis.bias.biasScore}/10
                      </span>
                    </div>
                    {resp.analysis.bias.detectedBiases.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {resp.analysis.bias.detectedBiases.length} bias{resp.analysis.bias.detectedBiases.length > 1 ? 'er' : ''} identifierad{resp.analysis.bias.detectedBiases.length > 1 ? 'e' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fact Check Comparison */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <span>🔍</span>
            <span>Faktakontroll</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analyzedResponses.map((resp, idx) => (
              <div
                key={idx}
                className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600"
              >
                <div className="text-xs font-medium text-gray-400 mb-2">
                  {resp.agent === 'gpt-3.5' ? '🤖 GPT-3.5' : '✨ Gemini'}
                </div>
                {resp.analysis?.factCheck && (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-200">
                      {resp.analysis.factCheck.claimsFound} verifierbar{resp.analysis.factCheck.claimsFound !== 1 ? 'a' : 't'} påstående{resp.analysis.factCheck.claimsFound !== 1 ? 'n' : ''}
                    </div>
                    {resp.analysis.factCheck.recommendVerification && (
                      <div className="text-xs text-orange-400">
                        ⚠️ Rekommenderar verifiering
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
