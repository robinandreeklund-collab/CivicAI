/**
 * ToneIndicator Component
 * Displays tone analysis for AI responses
 */
export default function ToneIndicator({ toneAnalysis }) {
  if (!toneAnalysis || !toneAnalysis.primary) {
    return null;
  }

  const toneColors = {
    formal: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    informal: 'bg-green-500/20 text-green-300 border-green-500/30',
    technical: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    empathetic: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    analytical: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    persuasive: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    neutral: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const toneIcons = {
    formal: '👔',
    informal: '💬',
    technical: '⚙️',
    empathetic: '❤️',
    analytical: '📊',
    persuasive: '🎯',
    neutral: '⚖️',
  };

  const primaryColor = toneColors[toneAnalysis.primary] || toneColors.neutral;
  const primaryIcon = toneIcons[toneAnalysis.primary] || toneIcons.neutral;

  return (
    <div className="flex items-center space-x-2">
      {/* Primary tone badge */}
      <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${primaryColor}`}>
        <span>{primaryIcon}</span>
        <span>{toneAnalysis.description}</span>
      </div>

      {/* Additional characteristics */}
      {toneAnalysis.characteristics && toneAnalysis.characteristics.length > 1 && (
        <div className="flex items-center space-x-1">
          {toneAnalysis.characteristics.slice(1, 3).map((char, index) => (
            <div
              key={index}
              className={`px-2 py-0.5 rounded-full border text-xs ${toneColors[char] || toneColors.neutral}`}
              title={char}
            >
              {toneIcons[char]}
            </div>
          ))}
        </div>
      )}

      {/* Confidence indicator */}
      {toneAnalysis.confidence !== undefined && (
        <div className="text-xs text-gray-500" title="Konfidensgrad">
          {Math.round(toneAnalysis.confidence * 100)}%
        </div>
      )}
    </div>
  );
}
