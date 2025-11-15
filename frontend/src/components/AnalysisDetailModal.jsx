import { useState, useEffect } from 'react';

/**
 * AnalysisDetailModal Component
 * 
 * Displays comprehensive, transparent breakdown of analysis methods for a specific AI agent.
 * 
 * PURPOSE:
 * - Provide full transparency about how AI responses are analyzed
 * - Show calculation methods, algorithms, and logic used
 * - Highlight standout data that influences analysis most
 * - Enable users and developers to understand the analysis process
 * 
 * FEATURES:
 * - Expandable/collapsible detail sections
 * - Visual presentation of calculation methods
 * - Documentation of all analysis steps
 * - User-friendly explanations in Swedish
 */
export default function AnalysisDetailModal({ isOpen, onClose, agent, analysis, metaAnalysis }) {
  const [transparencyMethods, setTransparencyMethods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch transparency documentation on component mount
  useEffect(() => {
    if (isOpen) {
      fetchTransparencyMethods();
    }
  }, [isOpen]);

  const fetchTransparencyMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analysis-transparency/methods');
      const data = await response.json();
      setTransparencyMethods(data);
    } catch (error) {
      console.error('Error fetching transparency methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Agent theme mapping
  const agentThemes = {
    'gpt-3.5': { icon: '🤖', color: '#3b82f6', name: 'GPT-3.5' },
    'gemini': { icon: '✨', color: '#a855f7', name: 'Gemini' },
    'deepseek': { icon: '🧠', color: '#06b6d4', name: 'DeepSeek' },
    'grok': { icon: '⚡', color: '#f97316', name: 'Grok' },
    'qwen': { icon: '🌟', color: '#22c55e', name: 'Qwen' },
  };

  const theme = agentThemes[agent] || { icon: '🤖', color: '#6b7280', name: agent };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Modal Container - More Compact */}
      <div className="bg-civic-dark-800 border border-civic-dark-600 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header - Compact */}
        <div 
          className="px-4 py-3 border-b border-civic-dark-600 flex items-center justify-between"
          style={{ borderTopColor: theme.color, borderTopWidth: '2px' }}
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-md flex items-center justify-center text-lg"
              style={{ 
                backgroundColor: `${theme.color}20`,
                border: `1px solid ${theme.color}60`,
              }}
            >
              {theme.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                Analysgenomgång: {theme.name}
              </h2>
              <p className="text-xs text-gray-400">
                Transparent dokumentation av analysmetoder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-civic-dark-700 rounded"
            aria-label="Stäng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation - Compact */}
        <div className="px-4 py-2 border-b border-civic-dark-600 bg-civic-dark-750">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-civic-dark-700'
              }`}
            >
              📊 Översikt
            </button>
            <button
              onClick={() => setActiveTab('tone')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'tone'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-civic-dark-700'
              }`}
            >
              💬 Tonanalys
            </button>
            <button
              onClick={() => setActiveTab('bias')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'bias'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-civic-dark-700'
              }`}
            >
              ⚖️ Bias
            </button>
            <button
              onClick={() => setActiveTab('facts')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'facts'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-civic-dark-700'
              }`}
            >
              🔍 Fakta
            </button>
            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'methodology'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-civic-dark-700'
              }`}
            >
              📚 Metod
            </button>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Laddar transparensdata...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                    <h3 className="text-base font-bold text-cyan-300 mb-2 flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      Analysresultat för {theme.name}
                    </h3>
                    <p className="text-sm text-gray-300">
                      De viktigaste resultaten från analysen. Data som påverkar analysen mest markeras.
                    </p>
                  </div>

                  {/* Tone Summary - Compact */}
                  {analysis?.tone && (
                    <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                        <span className="mr-1.5">💬</span>
                        Tonanalys
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Primär ton</p>
                          <p className="text-sm font-medium text-gray-200">
                            {analysis.tone.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Konfidensval</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-civic-dark-600 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.round(analysis.tone.confidence * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-cyan-300">
                              {Math.round(analysis.tone.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {analysis.tone.characteristics && analysis.tone.characteristics.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1.5">Sekundära</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.tone.characteristics.map((char, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 bg-civic-gray-500/20 text-gray-300 rounded text-xs border border-civic-gray-500/30"
                              >
                                {char}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bias Summary - Compact */}
                  {analysis?.bias && (
                    <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                        <span className="mr-1.5">⚖️</span>
                        Bias-detektion
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Bias-poäng</p>
                          <p className={`text-xl font-bold ${
                            analysis.bias.biasScore > 5 ? 'text-gray-400' :
                            analysis.bias.biasScore > 2 ? 'text-gray-400' :
                            'text-gray-400'
                          }`}>
                            {analysis.bias.biasScore}/10
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <p className={`text-sm font-medium ${
                            analysis.bias.overallBias === 'minimal' ? 'text-gray-400' : 'text-gray-400'
                          }`}>
                            {analysis.bias.overallBias === 'minimal' ? 'Minimal bias' : 'Bias detekterad'}
                          </p>
                        </div>
                      </div>
                      {analysis.bias.detectedBiases && analysis.bias.detectedBiases.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-1.5">Detekterade bias-typer</p>
                          <div className="space-y-1.5">
                            {analysis.bias.detectedBiases.map((bias, idx) => (
                              <div 
                                key={idx}
                                className={`p-2 rounded text-xs border ${
                                  bias.severity === 'high' ? 'bg-gray-500/10 border-gray-500/30' :
                                  bias.severity === 'medium' ? 'bg-gray-500/10 border-yellow-500/30' :
                                  'bg-civic-gray-500/10 border-civic-gray-500/30'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-200">
                                    {bias.description}
                                  </span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    bias.severity === 'high' ? 'bg-gray-500/20 text-gray-300' :
                                    bias.severity === 'medium' ? 'bg-gray-500/20 text-gray-300' :
                                    'bg-civic-gray-500/20 text-gray-300'
                                  }`}>
                                    {bias.severity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fact Check Summary - Compact */}
                  {analysis?.factCheck && (
                    <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                        <span className="mr-1.5">🔍</span>
                        Faktakoll
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Påståenden</p>
                          <p className="text-xl font-bold text-cyan-300">
                            {analysis.factCheck.claimsFound}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Verifiering</p>
                          <p className={`text-sm font-medium ${
                            analysis.factCheck.needsVerification ? 'text-gray-400' : 'text-gray-400'
                          }`}>
                            {analysis.factCheck.needsVerification ? 'Behövs' : 'Ej nödvändig'}
                          </p>
                        </div>
                      </div>
                      {analysis.factCheck.recommendation && (
                        <div className="mt-2 p-2 bg-gray-500/10 border border-yellow-500/30 rounded">
                          <p className="text-xs text-gray-300">
                            💡 {analysis.factCheck.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta-Analysis Summary - Compact */}
                  {metaAnalysis && (
                    <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                        <span className="mr-1.5">🧠</span>
                        Meta-analys
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {metaAnalysis.nlp && (
                          <>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Meningar</p>
                              <p className="text-base font-bold text-gray-200">
                                {metaAnalysis.nlp.sentences}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Ord</p>
                              <p className="text-base font-bold text-gray-200">
                                {metaAnalysis.nlp.words}
                              </p>
                            </div>
                          </>
                        )}
                        {metaAnalysis.sentiment && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Sentiment</p>
                            <p className={`text-base font-bold ${
                              metaAnalysis.sentiment.sentiment === 'positive' ? 'text-gray-400' :
                              metaAnalysis.sentiment.sentiment === 'negative' ? 'text-gray-400' :
                              'text-gray-400'
                            }`}>
                              {metaAnalysis.sentiment.sentiment === 'positive' ? 'Positiv' :
                               metaAnalysis.sentiment.sentiment === 'negative' ? 'Negativ' :
                               'Neutral'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tone Analysis Tab */}
              {activeTab === 'tone' && transparencyMethods && (
                <ToneAnalysisDetail 
                  methodology={transparencyMethods.methods.toneAnalysis}
                  analysis={analysis?.tone}
                />
              )}

              {/* Bias Detection Tab */}
              {activeTab === 'bias' && transparencyMethods && (
                <BiasDetectionDetail 
                  methodology={transparencyMethods.methods.biasDetection}
                  analysis={analysis?.bias}
                />
              )}

              {/* Fact Checking Tab */}
              {activeTab === 'facts' && transparencyMethods && (
                <FactCheckingDetail 
                  methodology={transparencyMethods.methods.factChecking}
                  analysis={analysis?.factCheck}
                />
              )}

              {/* Methodology Tab */}
              {activeTab === 'methodology' && transparencyMethods && (
                <MethodologyOverview 
                  methods={transparencyMethods.methods}
                  standoutData={transparencyMethods.standoutDataIdentification}
                  dataSync={transparencyMethods.dataSync}
                />
              )}
            </>
          )}
        </div>

        {/* Footer - Compact */}
        <div className="px-4 py-2 border-t border-civic-dark-600 bg-civic-dark-750 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            OneSeek.AI Transparency • Öppna analysmetoder
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-xs transition-colors border border-cyan-500/30"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}

/* Detail Components for Each Tab */

function ToneAnalysisDetail({ methodology }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-civic-gray-500/30 rounded-lg p-4">
        <h3 className="text-base font-bold text-gray-300 mb-1">{methodology.name}</h3>
        <p className="text-sm text-gray-300">{methodology.description}</p>
      </div>

      {/* Methodology Steps - Compact */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-cyan-300 mb-3">Beräkningsmetod</h4>
        <p className="text-sm text-gray-300 mb-3">
          <strong>Approach:</strong> {methodology.methodology.approach}
        </p>
        <div className="space-y-3">
          {methodology.methodology.steps.map((step, idx) => (
            <div key={idx} className="border-l-2 border-cyan-500/50 pl-3">
              <h5 className="font-semibold text-gray-200 text-sm mb-1">
                Steg {step.step}: {step.name}
              </h5>
              <p className="text-xs text-gray-400 mb-1">{step.description}</p>
              {step.formula && (
                <code className="text-xs bg-civic-dark-900 px-2 py-1 rounded text-cyan-300 block mt-1">
                  {step.formula}
                </code>
              )}
              {step.example && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Ex: {step.example}
                </p>
              )}
              {step.details && (
                <ul className="text-xs text-gray-400 list-disc list-inside mt-1">
                  {step.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tone Categories - Compact */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-cyan-300 mb-3">Ton-kategorier</h4>
        <div className="grid grid-cols-2 gap-2">
          {methodology.methodology.categories.map((cat, idx) => (
            <div key={idx} className="p-2 bg-civic-dark-800 rounded border border-civic-dark-600">
              <h5 className="font-medium text-gray-200 mb-1.5 capitalize text-xs">{cat.tone}</h5>
              <div className="flex flex-wrap gap-1">
                {cat.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-civic-gray-500/20 text-gray-300 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations - Compact */}
      <div className="bg-gray-900/20 border border-yellow-500/30 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">⚠️ Begränsningar</h4>
        <ul className="space-y-1">
          {methodology.limitations.map((limit, idx) => (
            <li key={idx} className="text-xs text-gray-300 flex items-start">
              <span className="mr-1.5">•</span>
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BiasDetectionDetail({ methodology }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-300 mb-2">{methodology.name}</h3>
        <p className="text-gray-300">{methodology.description}</p>
      </div>

      {/* Bias Types */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">Bias-typer som detekteras</h4>
        <div className="space-y-4">
          {methodology.methodology.biasTypes.map((biasType, idx) => (
            <div key={idx} className="p-4 bg-civic-dark-800 rounded border border-civic-dark-600">
              <h5 className="font-semibold text-gray-200 mb-2">{biasType.name}</h5>
              <p className="text-sm text-gray-400 mb-3">{biasType.description}</p>
              
              {biasType.leftKeywords && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Vänster-nyckelord:</p>
                  <div className="flex flex-wrap gap-1">
                    {biasType.leftKeywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {biasType.rightKeywords && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Höger-nyckelord:</p>
                  <div className="flex flex-wrap gap-1">
                    {biasType.rightKeywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-civic-gray-500/20 text-gray-300 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {biasType.keywords && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Nyckelord:</p>
                  <div className="flex flex-wrap gap-1">
                    {biasType.keywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 space-y-1">
                <code className="text-xs bg-civic-dark-900 px-2 py-1 rounded text-cyan-300 block">
                  {biasType.calculation}
                </code>
                <p className="text-xs text-gray-500 italic">
                  Tröskel: {biasType.threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Severity Calculation */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">Allvarlighetsbedömning</h4>
        <p className="text-gray-300 mb-4">{methodology.methodology.severityCalculation.description}</p>
        <div className="grid grid-cols-3 gap-3">
          {methodology.methodology.severityCalculation.levels.map((level, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded border ${
                level.severity === 'high' ? 'bg-gray-500/10 border-gray-500/30' :
                level.severity === 'medium' ? 'bg-gray-500/10 border-yellow-500/30' :
                'bg-civic-gray-500/10 border-civic-gray-500/30'
              }`}
            >
              <h5 className="font-medium text-gray-200 capitalize mb-1">{level.severity}</h5>
              <p className="text-xs text-gray-400 mb-1">{level.range}</p>
              <p className="text-xs font-bold text-gray-300">Poäng: {level.numericScore}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">Total bias-poäng</h4>
        <p className="text-gray-300 mb-3">{methodology.methodology.overallBiasScore.description}</p>
        <code className="text-sm bg-civic-dark-900 px-3 py-2 rounded text-cyan-300 block mb-4">
          {methodology.methodology.overallBiasScore.formula}
        </code>
        <p className="text-sm text-gray-400 mb-3">
          Maximum: {methodology.methodology.overallBiasScore.maximum}
        </p>
        <div className="space-y-2">
          {methodology.methodology.overallBiasScore.interpretation.map((interp, idx) => (
            <div key={idx} className="flex items-start space-x-3 text-sm">
              <span className="text-cyan-400 font-mono">{interp.range}</span>
              <span className="text-gray-400">→</span>
              <div>
                <span className="font-medium text-gray-200">{interp.level}:</span>
                <span className="text-gray-400 ml-2">{interp.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="bg-gray-900/20 border border-yellow-500/30 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">⚠️ Begränsningar</h4>
        <ul className="space-y-2">
          {methodology.limitations.map((limit, idx) => (
            <li key={idx} className="text-gray-300 flex items-start">
              <span className="mr-2">•</span>
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FactCheckingDetail({ methodology }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-civic-gray-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-300 mb-2">{methodology.name}</h3>
        <p className="text-gray-300">{methodology.description}</p>
      </div>

      {/* Claim Types */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">Påståendetyper som identifieras</h4>
        <div className="space-y-3">
          {methodology.methodology.claimTypes.map((claimType, idx) => (
            <div key={idx} className="p-4 bg-civic-dark-800 rounded border border-civic-dark-600">
              <h5 className="font-semibold text-gray-200 mb-2">{claimType.name}</h5>
              <p className="text-sm text-gray-400 mb-3">{claimType.description}</p>
              <div>
                <p className="text-xs text-gray-500 mb-1">Mönster:</p>
                <div className="flex flex-wrap gap-1">
                  {claimType.patterns.map((pattern, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-civic-gray-500/20 text-gray-300 rounded font-mono">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation Method */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">Beräkningsmetod</h4>
        <p className="text-gray-300 mb-3">{methodology.methodology.calculation.description}</p>
        <code className="text-sm bg-civic-dark-900 px-3 py-2 rounded text-cyan-300 block mb-3">
          {methodology.methodology.calculation.formula}
        </code>
        <p className="text-sm text-gray-400">
          <strong>Rekommendation:</strong> {methodology.methodology.calculation.recommendationThreshold}
        </p>
      </div>

      {/* External Verification */}
      <div className="bg-civic-gray-900/20 border border-civic-gray-500/30 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">🔍 Extern verifiering</h4>
        <p className="text-gray-300 mb-2">{methodology.externalVerification.description}</p>
        <p className="text-sm text-gray-400 italic">{methodology.externalVerification.note}</p>
      </div>

      {/* Limitations */}
      <div className="bg-gray-900/20 border border-yellow-500/30 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">⚠️ Begränsningar</h4>
        <ul className="space-y-2">
          {methodology.limitations.map((limit, idx) => (
            <li key={idx} className="text-gray-300 flex items-start">
              <span className="mr-2">•</span>
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MethodologyOverview({ standoutData, dataSync }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-300 mb-2">📚 Komplett metodologi</h3>
        <p className="text-gray-300">
          Denna sektion ger en övergripande förklaring av alla analysmetoder och hur data hålls synkroniserad.
        </p>
      </div>

      {/* Standout Data Identification */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">🎯 Identifiering av påverkande data</h4>
        <p className="text-gray-300 mb-4">{standoutData.description}</p>
        <div className="space-y-3">
          {standoutData.factors.map((factor, idx) => (
            <div key={idx} className="p-4 bg-civic-dark-800 rounded border border-civic-dark-600">
              <h5 className="font-semibold text-gray-200 mb-2">{factor.factor}</h5>
              <p className="text-sm text-gray-400 mb-2">
                <strong>Påverkan:</strong> {factor.impact}
              </p>
              <p className="text-sm text-cyan-300">
                <strong>Visualisering:</strong> {factor.visualization}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sync */}
      <div className="bg-civic-dark-700/50 border border-civic-dark-600 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-cyan-300 mb-4">🔄 Datasynkronisering</h4>
        <p className="text-gray-300 mb-4">{dataSync.description}</p>
        <div className="space-y-2">
          {dataSync.approach.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-cyan-400 mt-1">✓</span>
              <p className="text-gray-400">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-500/10 border border-yellow-500/30 rounded">
          <p className="text-sm text-gray-300">
            💡 <strong>Rekommendation:</strong> {dataSync.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
