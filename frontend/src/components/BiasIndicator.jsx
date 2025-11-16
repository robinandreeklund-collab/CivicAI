import { useState } from 'react';

/**
 * BiasIndicator Component
 * Displays detected biases in AI responses
 */
export default function BiasIndicator({ biasAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!biasAnalysis || !biasAnalysis.detectedBiases || biasAnalysis.detectedBiases.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Minimal bias identifierad</span>
      </div>
    );
  }

  const severityColors = {
    low: 'text-gray-400 bg-gray-400/10',
    medium: 'text-orange-400 bg-orange-400/10',
    high: 'text-gray-400 bg-gray-400/10',
  };

  const severityIcons = {
    low: '⚠️',
    medium: '⚠️',
    high: '🚨',
  };

  const mostSevere = biasAnalysis.detectedBiases[0];
  const severityColor = severityColors[mostSevere.severity] || severityColors.low;

  return (
    <div className="space-y-2">
      {/* Summary */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${severityColor} transition-all hover:opacity-80`}
      >
        <div className="flex items-center space-x-2">
          <span>{severityIcons[mostSevere.severity]}</span>
          <span className="text-xs font-medium">
            {biasAnalysis.detectedBiases.length} bias{biasAnalysis.detectedBiases.length > 1 ? 'er' : ''} identifierad{biasAnalysis.detectedBiases.length > 1 ? 'e' : ''}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Details */}
      {isExpanded && (
        <div className="space-y-2 animate-fade-in">
          {biasAnalysis.detectedBiases.map((bias, index) => (
            <div
              key={index}
              className={`px-3 py-2 rounded-lg ${severityColors[bias.severity]} text-xs`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium mb-1">{bias.description}</div>
                  <div className="text-xs opacity-80 capitalize mb-2">
                    Typ: {bias.type} | Svårighetsgrad: {bias.severity}
                    {bias.direction && ` | Riktning: ${bias.direction}`}
                  </div>
                  {bias.words && bias.words.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-civic-dark-700/50">
                      <div className="text-xs opacity-70 mb-1">Identifierade ord:</div>
                      <div className="flex flex-wrap gap-1">
                        {bias.words.map((word, wordIdx) => (
                          <span 
                            key={wordIdx}
                            className="px-2 py-0.5 bg-civic-dark-900/50 rounded text-xs border border-civic-dark-700"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Bias score */}
          <div className="px-3 py-2 bg-civic-dark-700/30 rounded-lg text-xs text-gray-400">
            Bias-poäng: {biasAnalysis.biasScore}/10
          </div>
        </div>
      )}
    </div>
  );
}
