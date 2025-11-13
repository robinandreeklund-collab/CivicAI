/**
 * ResponseSummary Component
 * Creates a neutral summary from all AI responses
 * Enhanced with comprehensive fact-checking insights, transparency, and metadata
 * 
 * FÖRBÄTTRINGAR:
 * - Visar källor, antal, relevans och confidence med tydliga indikatorer
 * - Visualiserar osäkerhet/källtäthet med visuella indikatorer
 * - Transparens kring ej verifierade påståenden
 * - Typfördelning (statistiskt, vetenskapligt, osv)
 * - Bias-score aggregerat från alla svar
 * - Meta-data (tidsstämpel, AI-agent, claims distribution)
 * - Förslag till förbättrad formulering vid neutralbedömningar
 */
export default function ResponseSummary({ responses, question, synthesizedSummary, factCheckComparison }) {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Generate a neutral summary by identifying common themes
  const generateSummary = () => {
    const allResponses = responses.map(r => r.response).filter(Boolean);
    
    if (allResponses.length === 0) {
      return null;
    }

    // Extract common themes (simplified approach)
    const wordFrequency = {};
    const stopWords = new Set(['är', 'och', 'att', 'det', 'som', 'för', 'på', 'med', 'en', 'av', 'till', 'i', 'den', 'har', 'de', 'kan', 'inte', 'om', 'vara', 'eller', 'från', 'ett', 'vid', 'också']);
    
    allResponses.forEach(response => {
      const words = response.toLowerCase()
        .split(/[\s,;:.!?()[\]{}]+/)
        .filter(w => w.length > 3 && !stopWords.has(w));
      
      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    });

    // Get common keywords (mentioned by multiple models)
    const commonKeywords = Object.entries(wordFrequency)
      .filter(([, count]) => count >= Math.min(responses.length, 2))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return {
      responseCount: responses.length,
      commonKeywords,
      averageLength: Math.round(allResponses.reduce((sum, r) => sum + r.length, 0) / allResponses.length),
    };
  };

  const summary = generateSummary();

  if (!summary) {
    return null;
  }

  // Format synthesized summary for display
  const formatSynthesizedSummary = (text) => {
    if (!text) return null;
    
    // Split by markdown headers
    const parts = text.split(/\*\*(.*?)\*\*/g);
    const formatted = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Check if this is a header (odd indices after split)
      if (i % 2 === 1) {
        formatted.push({ type: 'header', text: part });
      } else {
        formatted.push({ type: 'text', text: part });
      }
    }
    
    return formatted;
  };

  const formattedSummary = formatSynthesizedSummary(synthesizedSummary);

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-lg">
          📊
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Neutral sammanställning</h3>
          <p className="text-xs text-gray-400">Aggregerad insikt från alla AI-svar</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Question */}
        <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600">
          <div className="text-xs font-medium text-gray-400 mb-1">Fråga</div>
          <div className="text-sm text-gray-200">{question}</div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600">
            <div className="text-xs text-gray-400 mb-1">AI-modeller</div>
            <div className="text-2xl font-bold text-indigo-400">{summary.responseCount}</div>
          </div>
          <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600">
            <div className="text-xs text-gray-400 mb-1">Genomsnittlig längd</div>
            <div className="text-2xl font-bold text-purple-400">{summary.averageLength}</div>
            <div className="text-xs text-gray-500">tecken</div>
          </div>
          <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600 col-span-2 md:col-span-1">
            <div className="text-xs text-gray-400 mb-1">Gemensamma nyckelord</div>
            <div className="text-lg font-bold text-cyan-400">{summary.commonKeywords.length}</div>
          </div>
        </div>

        {/* Common Keywords */}
        {summary.commonKeywords.length > 0 && (
          <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600">
            <div className="text-xs font-medium text-gray-400 mb-2">Återkommande teman</div>
            <div className="flex flex-wrap gap-2">
              {summary.commonKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Fact-Check Comparison Section */}
        {factCheckComparison && factCheckComparison.available && (
          <div className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-semibold text-blue-300">Faktakoll och verifierbarhet</div>
                <div className="text-xs text-gray-400">Aggregerad från {factCheckComparison.agentCount} AI-modeller</div>
              </div>
            </div>

            {/* Huvudstatistik */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {/* Total Claims */}
              <div className="p-2 bg-civic-dark-700/50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Påståenden</div>
                <div className="text-xl font-bold text-blue-300">{factCheckComparison.totalClaims}</div>
                <div className="text-xs text-gray-500">totalt analyserade</div>
              </div>

              {/* Verified Claims */}
              <div className="p-2 bg-civic-dark-700/50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Verifierade</div>
                <div className={`text-xl font-bold ${
                  factCheckComparison.totalVerified === factCheckComparison.totalClaims ? 'text-green-400' :
                  factCheckComparison.totalVerified > 0 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {factCheckComparison.totalVerified}
                </div>
                <div className="text-xs text-gray-500">
                  {factCheckComparison.totalClaims > 0 
                    ? `${Math.round((factCheckComparison.totalVerified / factCheckComparison.totalClaims) * 100)}%`
                    : '0%'}
                </div>
              </div>

              {/* Average Score */}
              <div className="p-2 bg-civic-dark-700/50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Genomsnitt</div>
                <div className={`text-xl font-bold ${
                  factCheckComparison.averageScore >= 7 ? 'text-green-400' :
                  factCheckComparison.averageScore >= 4 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {factCheckComparison.averageScore}
                </div>
                <div className="text-xs text-gray-500">av 10</div>
              </div>

              {/* Source Density */}
              <div className="p-2 bg-civic-dark-700/50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Källtäthet</div>
                <div className={`text-xl font-bold ${
                  factCheckComparison.averageSourcesPerClaim >= 2 ? 'text-green-400' :
                  factCheckComparison.averageSourcesPerClaim >= 1 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {factCheckComparison.averageSourcesPerClaim}
                </div>
                <div className="text-xs text-gray-500">källor/påstående</div>
              </div>
            </div>

            {/* Osäkerhetsvisualisering */}
            {factCheckComparison.totalClaims > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Osäkerhetsnivå: {factCheckComparison.uncertaintyLevel}</span>
                  <span>{factCheckComparison.uncertaintyRate}% ej verifierade</span>
                </div>
                <div className="w-full h-2 bg-civic-dark-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      factCheckComparison.uncertaintyRate < 25 ? 'bg-green-500' :
                      factCheckComparison.uncertaintyRate < 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${100 - factCheckComparison.uncertaintyRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Verifierade</span>
                  <span>Ej verifierade</span>
                </div>
              </div>
            )}

            {/* Confidence Distribution */}
            {factCheckComparison.confidenceDistribution && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-400 mb-2">Fördelning av konfidensgrad</div>
                <div className="space-y-2">
                  {factCheckComparison.confidenceDistribution.high > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 text-xs text-gray-400">Hög (≥67%)</div>
                      <div className="flex-1 h-4 bg-civic-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ 
                            width: `${(factCheckComparison.confidenceDistribution.high / factCheckComparison.totalClaims) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs text-green-400 text-right">
                        {factCheckComparison.confidenceDistribution.high}
                      </div>
                    </div>
                  )}
                  {factCheckComparison.confidenceDistribution.medium > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 text-xs text-gray-400">Medel (33-66%)</div>
                      <div className="flex-1 h-4 bg-civic-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500"
                          style={{ 
                            width: `${(factCheckComparison.confidenceDistribution.medium / factCheckComparison.totalClaims) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs text-yellow-400 text-right">
                        {factCheckComparison.confidenceDistribution.medium}
                      </div>
                    </div>
                  )}
                  {factCheckComparison.confidenceDistribution.low > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 text-xs text-gray-400">Låg (<33%)</div>
                      <div className="flex-1 h-4 bg-civic-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500"
                          style={{ 
                            width: `${(factCheckComparison.confidenceDistribution.low / factCheckComparison.totalClaims) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs text-red-400 text-right">
                        {factCheckComparison.confidenceDistribution.low}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Typfördelning (Claim Type Distribution) */}
            {factCheckComparison.claimTypeDistribution && Object.keys(factCheckComparison.claimTypeDistribution).length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-400 mb-2">Typfördelning av påståenden</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(factCheckComparison.claimTypeDistribution).map(([type, data]) => {
                    const typeNames = {
                      statistical: 'Statistiska',
                      scientific: 'Vetenskapliga',
                      temporal: 'Tidsbundna',
                      historical: 'Historiska',
                      definitive: 'Definitiva'
                    };
                    const typeIcons = {
                      statistical: '📊',
                      scientific: '🔬',
                      temporal: '⏰',
                      historical: '📜',
                      definitive: '✓'
                    };
                    const verificationRate = data.count > 0 ? Math.round((data.verified / data.count) * 100) : 0;
                    
                    return (
                      <div key={type} className="p-2 bg-civic-dark-700/50 rounded-lg border border-civic-dark-600">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-sm">{typeIcons[type] || '📌'}</span>
                          <span className="text-xs text-gray-300">{typeNames[type] || type}</span>
                        </div>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-bold text-blue-300">{data.count}</span>
                          <span className="text-xs text-gray-500">
                            ({verificationRate}% verif.)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Claims per Agent Distribution */}
            {factCheckComparison.claimsPerAgent && factCheckComparison.claimsPerAgent.length > 0 && (
              <details className="mb-3">
                <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 mb-2">
                  Visa fördelning per AI-modell ({factCheckComparison.claimsPerAgent.length} modeller)
                </summary>
                <div className="space-y-2 mt-2">
                  {factCheckComparison.claimsPerAgent.map((agentData, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-civic-dark-700/50 rounded-lg text-xs">
                      <span className="text-gray-300 font-medium">{agentData.agent}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">{agentData.claims} påståenden</span>
                        <span className={`font-medium ${
                          agentData.verified === agentData.claims ? 'text-green-400' :
                          agentData.verified > 0 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {agentData.verified} verif.
                        </span>
                        <span className={`font-bold ${
                          agentData.score >= 7 ? 'text-green-400' :
                          agentData.score >= 4 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {agentData.score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Neutral Assessment Reason */}
            {factCheckComparison.neutralAssessmentReason && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-xs font-medium text-indigo-300 mb-1">Motiv för neutral bedömning</div>
                    <div className="text-xs text-gray-300 leading-relaxed">
                      {factCheckComparison.neutralAssessmentReason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            {factCheckComparison.improvementSuggestions && factCheckComparison.improvementSuggestions.length > 0 && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-xs font-medium text-purple-300 mb-2">Förbättringsförslag</div>
                    <ul className="space-y-1">
                      {factCheckComparison.improvementSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs text-gray-300 leading-relaxed">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Aggregated Bias Score */}
            {factCheckComparison.aggregatedBiasScore !== null && (
              <div className="p-2 bg-civic-dark-700/50 rounded-lg flex items-center justify-between">
                <span className="text-xs text-gray-400">Aggregerad bias-score</span>
                <span className={`text-sm font-bold ${
                  factCheckComparison.aggregatedBiasScore < 3 ? 'text-green-400' :
                  factCheckComparison.aggregatedBiasScore < 6 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {factCheckComparison.aggregatedBiasScore}/10
                </span>
              </div>
            )}

            {/* Metadata */}
            {factCheckComparison.timestamp && (
              <div className="mt-3 pt-3 border-t border-blue-500/30">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Analyserad: {new Date(factCheckComparison.timestamp).toLocaleString('sv-SE')}</span>
                  <span>Transparens: {factCheckComparison.transparency?.claimsAnalyzed || 0} påståenden</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No fact-check available message */}
        {factCheckComparison && !factCheckComparison.available && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-xs text-yellow-300">
                <span className="font-medium">Faktakoll ej tillgänglig: </span>
                {factCheckComparison.message || 'Tavily API-nyckel saknas'}
              </div>
            </div>
          </div>
        )}

        {/* AI-Generated Synthesized Summary */}
        {synthesizedSummary && formattedSummary && (
          <div className="p-4 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-lg border border-emerald-500/30">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-sm font-semibold text-emerald-300">Syntetiserad sammanfattning</div>
            </div>
            <div className="text-sm text-gray-200 leading-relaxed space-y-2">
              {formattedSummary.map((part, idx) => {
                if (part.type === 'header') {
                  return (
                    <div key={idx} className="font-semibold text-emerald-300 mt-3 first:mt-0">
                      {part.text}
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="whitespace-pre-line">
                      {part.text}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}

        {/* Analysis Overview - only show if no synthesized summary */}
        {!synthesizedSummary && (
          <div className="p-3 bg-civic-dark-700/30 rounded-lg border border-civic-dark-600">
            <div className="text-xs font-medium text-gray-400 mb-2">Övergripande bedömning</div>
            <div className="text-sm text-gray-300 leading-relaxed">
              Alla {summary.responseCount} AI-modeller har svarat på frågan. 
              {summary.commonKeywords.length > 0 && ` Gemensamma teman inkluderar begrepp kring ${summary.commonKeywords.slice(0, 3).join(', ')}.`}
              {' '}För en djupare förståelse, utforska de individuella svaren och deras analyser ovan.
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-yellow-300">
            Detta är en automatiskt genererad sammanställning baserad på alla AI-svar. 
            Granska de individuella svaren för fullständig kontext och detaljer.
          </div>
        </div>
      </div>
    </div>
  );
}
