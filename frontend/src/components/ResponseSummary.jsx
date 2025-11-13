/**
 * ResponseSummary Component
 * Creates a neutral summary from all AI responses
 */
export default function ResponseSummary({ responses, question, synthesizedSummary }) {
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
