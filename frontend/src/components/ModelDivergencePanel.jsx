/**
 * ModelDivergencePanel Component
 * Displays divergences and contradictions between AI model responses
 */
export default function ModelDivergencePanel({ modelSynthesis }) {
  if (!modelSynthesis || (!modelSynthesis.divergences?.hasDivergences && !modelSynthesis.contradictions?.hasContradictions)) {
    return (
      <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Hög konsensus mellan modeller</span>
        </div>
        <p className="text-xs text-civic-gray-500 mt-2">
          Inga signifikanta skillnader eller motsägelser detekterade.
        </p>
      </div>
    );
  }

  const severityColors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    medium: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };

  const severityIcons = {
    high: '🔴',
    medium: '🟠',
    low: '🟡',
  };

  return (
    <div className="space-y-4">
      {/* Header with consensus score */}
      {modelSynthesis.consensus && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-civic-gray-300">Konsensus mellan modeller</h3>
            <div className="text-2xl font-bold text-civic-gray-400">
              {modelSynthesis.consensus.overallConsensus}%
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            {modelSynthesis.consensus.areas?.map((area, idx) => (
              <div key={idx} className="bg-civic-dark-800/50 rounded p-2">
                <div className="text-civic-gray-500 mb-1">{area.area}</div>
                <div className="flex items-center justify-between">
                  <span className="text-civic-gray-300 font-medium">{area.consensus}%</span>
                  <span className="text-civic-gray-600 text-[10px] capitalize">{area.dominant}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divergences */}
      {modelSynthesis.divergences?.hasDivergences && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-sm font-medium text-civic-gray-300">
              Skillnader ({modelSynthesis.divergences.divergenceCount})
            </h3>
          </div>

          <div className="space-y-2">
            {modelSynthesis.divergences.divergences?.map((div, idx) => (
              <div key={idx} className={`rounded-lg border p-3 ${severityColors[div.severity]}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base">{severityIcons[div.severity]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize">{div.type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded capitalize">
                        {div.severity}
                      </span>
                    </div>
                    <p className="text-xs mb-2">{div.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {div.models?.map((model, midx) => (
                        <span 
                          key={midx}
                          className="text-[10px] px-2 py-1 bg-black/20 rounded"
                        >
                          {model.agent}: {typeof model.value === 'number' ? model.value : model.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {modelSynthesis.divergences.severityCounts && (
            <div className="mt-3 pt-3 border-t border-civic-dark-700 flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-red-400">●</span>
                <span className="text-civic-gray-500">Hög: {modelSynthesis.divergences.severityCounts.high}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-400">●</span>
                <span className="text-civic-gray-500">Medel: {modelSynthesis.divergences.severityCounts.medium}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">●</span>
                <span className="text-civic-gray-500">Låg: {modelSynthesis.divergences.severityCounts.low}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contradictions */}
      {modelSynthesis.contradictions?.hasContradictions && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-red-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-medium text-red-300">
              Motsägelser ({modelSynthesis.contradictions.contradictionCount})
            </h3>
          </div>

          <div className="space-y-2">
            {modelSynthesis.contradictions.contradictions?.map((contr, idx) => (
              <div key={idx} className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-red-300">{contr.topic}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded text-red-400 capitalize">
                        {contr.type}
                      </span>
                    </div>
                    <p className="text-xs text-red-200 mb-2">{contr.description}</p>
                    
                    {contr.models && (
                      <div className="flex flex-wrap gap-1.5">
                        {contr.models.map((model, midx) => (
                          <span 
                            key={midx}
                            className="text-[10px] px-2 py-1 bg-black/20 rounded text-red-200"
                          >
                            {model.agent}: {model.sentiment || model.factRatio}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combined Insights */}
      {modelSynthesis.insights && modelSynthesis.insights.consensusTopics?.length > 0 && (
        <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
          <h3 className="text-sm font-medium text-civic-gray-300 mb-3">Gemensamma Insikter</h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-civic-gray-500 mb-2">Konsensus-ämnen:</div>
              <div className="flex flex-wrap gap-1.5">
                {modelSynthesis.insights.consensusTopics.map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 bg-civic-gray-500/20 text-civic-gray-300 text-xs rounded-full border border-civic-gray-500/30"
                  >
                    {topic.topic}
                    <span className="ml-1 text-[10px] text-civic-gray-500">
                      {topic.consensus}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {modelSynthesis.insights.huvudpunkter?.length > 0 && (
              <div>
                <div className="text-xs text-civic-gray-500 mb-2">Kombinerade huvudpunkter:</div>
                <div className="space-y-1.5">
                  {modelSynthesis.insights.huvudpunkter.map((point, idx) => (
                    <p key={idx} className="text-xs text-civic-gray-300 leading-relaxed">
                      {idx + 1}. {point}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
