/**
 * ModelPerspectiveCard Component
 * Displays a single model's perspective and key metrics
 */
export default function ModelPerspectiveCard({ card }) {
  if (!card) {
    return null;
  }

  const agentIcons = {
    'gpt-3.5': '🤖',
    'gemini': '✨',
    'deepseek': '🧠',
    'grok': '⚡',
    'qwen': '🌟',
  };

  const agentNames = {
    'gpt-3.5': 'GPT-3.5',
    'gemini': 'Gemini',
    'deepseek': 'DeepSeek',
    'grok': 'Grok',
    'qwen': 'Qwen',
  };

  return (
    <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4 hover:border-civic-dark-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agentIcons[card.agent] || '🔮'}</span>
          <div>
            <h4 className="text-sm font-medium text-civic-gray-300">
              {agentNames[card.agent] || card.agent}
            </h4>
            <p className="text-[10px] text-civic-gray-600">
              {card.summary?.wordCount || 0} ord
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-civic-dark-800/50 rounded p-2">
          <div className="text-[10px] text-civic-gray-500 mb-0.5">Emotion</div>
          <div className="text-xs text-civic-gray-300 capitalize">
            {card.summary?.mainEmotion || 'N/A'}
          </div>
        </div>
        <div className="bg-civic-dark-800/50 rounded p-2">
          <div className="text-[10px] text-civic-gray-500 mb-0.5">Ton</div>
          <div className="text-xs text-civic-gray-300 capitalize">
            {card.summary?.primaryTone || 'N/A'}
          </div>
        </div>
        <div className="bg-civic-dark-800/50 rounded p-2">
          <div className="text-[10px] text-civic-gray-500 mb-0.5">Syfte</div>
          <div className="text-xs text-civic-gray-300 capitalize">
            {card.summary?.intentType || 'N/A'}
          </div>
        </div>
        <div className="bg-civic-dark-800/50 rounded p-2">
          <div className="text-[10px] text-civic-gray-500 mb-0.5">Faktahalt</div>
          <div className="text-xs text-civic-gray-300">
            {card.ratings?.factualityScore || 0}%
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-civic-gray-500">Bias-poäng</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-civic-dark-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-civic-gray-500 transition-all"
                style={{ width: `${Math.min(card.ratings?.biasScore || 0, 10) * 10}%` }}
              />
            </div>
            <span className="text-civic-gray-300 w-8 text-right">
              {card.ratings?.biasScore || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-civic-gray-500">Säkerhet</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-civic-dark-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-civic-gray-400 transition-all"
                style={{ width: `${(card.ratings?.confidence || 0) * 100}%` }}
              />
            </div>
            <span className="text-civic-gray-300 w-8 text-right">
              {Math.round((card.ratings?.confidence || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Highlights */}
      {card.highlights && (
        <div className="mt-3 pt-3 border-t border-civic-dark-700">
          {/* Main Topics */}
          {card.highlights.mainTopics && card.highlights.mainTopics.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-civic-gray-500 mb-1">Nyckelämnen:</div>
              <div className="flex flex-wrap gap-1">
                {card.highlights.mainTopics.slice(0, 3).map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-1.5 py-0.5 bg-civic-dark-800 text-civic-gray-400 text-[10px] rounded"
                  >
                    {topic.topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Huvudpunkter */}
          {card.highlights.huvudpunkter && card.highlights.huvudpunkter.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-civic-gray-500 mb-1">Huvudpunkter:</div>
              <div className="space-y-1">
                {card.highlights.huvudpunkter.slice(0, 2).map((point, idx) => (
                  <p key={idx} className="text-[10px] text-civic-gray-400 leading-relaxed line-clamp-2">
                    {idx + 1}. {point}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {card.highlights.keyEntities && card.highlights.keyEntities.length > 0 && (
            <div>
              <div className="text-[10px] text-civic-gray-500 mb-1">Entiteter:</div>
              <div className="flex flex-wrap gap-1">
                {card.highlights.keyEntities.slice(0, 3).map((entity, idx) => (
                  <span 
                    key={idx}
                    className="px-1.5 py-0.5 bg-civic-dark-800 text-civic-gray-400 text-[10px] rounded"
                  >
                    {entity.entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provenance */}
      {card.provenance && (
        <div className="mt-3 pt-3 border-t border-civic-dark-700 text-[10px] text-civic-gray-600">
          Analyserad: {new Date(card.provenance.analyzedAt).toLocaleString('sv-SE')}
        </div>
      )}
    </div>
  );
}
