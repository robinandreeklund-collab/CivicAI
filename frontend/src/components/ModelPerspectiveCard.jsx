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
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] p-5 hover:border-[#3a3a3a] hover:transform hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agentIcons[card.agent] || '🔮'}</span>
          <div>
            <h4 className="text-[14px] font-semibold text-[#e7e7e7]">
              {agentNames[card.agent] || card.agent}
            </h4>
            <p className="text-[10px] text-[#666]">
              {card.summary?.wordCount || 0} ord
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#151515] rounded-md p-2.5">
          <div className="text-[9px] text-[#666] uppercase tracking-wide mb-1">Emotion</div>
          <div className="text-xs text-[#c0c0c0] capitalize font-medium">
            {card.summary?.mainEmotion || 'N/A'}
          </div>
        </div>
        <div className="bg-[#151515] rounded-md p-2.5">
          <div className="text-[9px] text-[#666] uppercase tracking-wide mb-1">Ton</div>
          <div className="text-xs text-[#c0c0c0] capitalize font-medium">
            {card.summary?.primaryTone || 'N/A'}
          </div>
        </div>
        <div className="bg-[#151515] rounded-md p-2.5">
          <div className="text-[9px] text-[#666] uppercase tracking-wide mb-1">Syfte</div>
          <div className="text-xs text-[#c0c0c0] capitalize font-medium">
            {card.summary?.intentType || 'N/A'}
          </div>
        </div>
        <div className="bg-[#151515] rounded-md p-2.5">
          <div className="text-[9px] text-[#666] uppercase tracking-wide mb-1">Faktahalt</div>
          <div className="text-xs text-[#c0c0c0] font-medium">
            {card.ratings?.factualityScore || 0}%
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#666]">Bias-poäng</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[#151515] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#888] transition-all"
                style={{ width: `${Math.min(card.ratings?.biasScore || 0, 10) * 10}%` }}
              />
            </div>
            <span className="text-[#c0c0c0] w-8 text-right font-medium">
              {card.ratings?.biasScore || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#666]">Säkerhet</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[#151515] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#a0a0a0] transition-all"
                style={{ width: `${(card.ratings?.confidence || 0) * 100}%` }}
              />
            </div>
            <span className="text-[#c0c0c0] w-8 text-right font-medium">
              {Math.round((card.ratings?.confidence || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Highlights */}
      {card.highlights && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          {/* Main Topics */}
          {card.highlights.mainTopics && card.highlights.mainTopics.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-[#666] mb-1.5 uppercase tracking-wide">Nyckelämnen:</div>
              <div className="flex flex-wrap gap-1">
                {card.highlights.mainTopics.slice(0, 3).map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-1.5 py-0.5 bg-[#151515] text-[#a0a0a0] text-[10px] rounded"
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
              <div className="text-[10px] text-[#666] mb-1.5 uppercase tracking-wide">Huvudpunkter:</div>
              <div className="space-y-1">
                {card.highlights.huvudpunkter.slice(0, 2).map((point, idx) => (
                  <p key={idx} className="text-[10px] text-[#a0a0a0] leading-relaxed line-clamp-2">
                    {idx + 1}. {point}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {card.highlights.keyEntities && card.highlights.keyEntities.length > 0 && (
            <div>
              <div className="text-[10px] text-[#666] mb-1.5 uppercase tracking-wide">Entiteter:</div>
              <div className="flex flex-wrap gap-1">
                {card.highlights.keyEntities.slice(0, 3).map((entity, idx) => (
                  <span 
                    key={idx}
                    className="px-1.5 py-0.5 bg-[#151515] text-[#a0a0a0] text-[10px] rounded"
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
        <div className="mt-4 pt-4 border-t border-[#2a2a2a] text-[10px] text-[#666]">
          Analyserad: {new Date(card.provenance.analyzedAt).toLocaleString('sv-SE')}
        </div>
      )}
    </div>
  );
}
