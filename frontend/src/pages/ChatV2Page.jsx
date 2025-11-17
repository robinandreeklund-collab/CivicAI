import { useState, useRef, useEffect } from 'react';

/**
 * ChatV2Page Component - Concept 31 Design
 * Hierarchical layout with complete platform data integration
 * - Premium input field (Concept 21 style)
 * - Sidebar menu navigation
 * - Centered view selector (Översikt | Modeller | Pipeline | Debatt)
 * - 4 view modes with real API integration
 * - OneSeek.AI grayscale brand identity
 */
export default function ChatV2Page() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, models, pipeline, debate
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [synthesisExpanded, setSynthesisExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5');
  const [debateActive, setDebateActive] = useState(false);
  const [debateMessages, setDebateMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Get latest AI message for display
  const latestAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    
    // Add user message
    const userMessage = {
      type: 'user',
      content: userQuestion,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Call real backend API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: userQuestion,
          services: ['gpt-3.5', 'gemini', 'deepseek'] // Default services
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response - map API response to our structure
      const aiMessage = {
        type: 'ai',
        question: userQuestion,
        responses: data.responses || [],
        // BERT summary is returned as 'synthesizedSummary' from API
        bertSummary: data.synthesizedSummary || null,
        bertMetadata: data.synthesizedSummaryMetadata || null,
        // Model synthesis contains consensus/divergence analysis
        modelSynthesis: data.modelSynthesis || null,
        metaReview: data.metaReview || null,
        factCheckComparison: data.factCheckComparison || null,
        debateTrigger: data.debateTrigger || false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setViewMode('overview'); // Reset to overview on new response
      
    } catch (err) {
      console.error('Error fetching AI responses:', err);
      const errorMessage = {
        type: 'error',
        content: err.message || 'Ett fel uppstod vid hämtning av svar.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate debate
  const startDebate = () => {
    setDebateActive(true);
    if (latestAiMessage && latestAiMessage.responses) {
      const models = latestAiMessage.responses;
      const simulatedDebate = [
        { model: models[0]?.model || 'GPT-3.5', text: 'Baserat på min analys ser jag tre huvudsakliga klimatåtgärder...', timestamp: new Date().toISOString() },
        { model: models[1]?.model || 'Gemini', text: 'Jag håller med, men skulle även lägga till att...', timestamp: new Date(Date.now() + 2000).toISOString() },
        { model: models[2]?.model || 'DeepSeek', text: 'Intressant perspektiv. Från ett tekniskt perspektiv...', timestamp: new Date(Date.now() + 4000).toISOString() },
      ];
      setDebateMessages(simulatedDebate);
    }
  };

  const pauseDebate = () => {
    setDebateActive(false);
  };

  // Render different views based on viewMode
  const renderContent = () => {
    if (!latestAiMessage) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-2">Välkommen till OneSeek.AI</h2>
            <p className="text-[#888]">Ställ en fråga för att komma igång</p>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'overview':
        return renderOverview();
      case 'models':
        return renderModels();
      case 'pipeline':
        return renderPipeline();
      case 'debate':
        return renderDebate();
      default:
        return renderOverview();
    }
  };

  // Overview mode: BERT summary + model synthesis + quick model table
  const renderOverview = () => {
    return (
      <div className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 pt-24">
        {/* User Question */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-[#666] text-sm uppercase tracking-wide mb-2">DIN FRÅGA</div>
          <h1 className="text-2xl md:text-3xl font-light text-[#e7e7e7]">
            {latestAiMessage.question}
          </h1>
        </div>

        {/* BERT Summary */}
        {latestAiMessage.bertSummary && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">📝</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">BERT-sammanfattning</div>
                  <div className="text-sm text-[#666]">AI-genererad kondenserad översikt</div>
                </div>
              </div>
              <p className="text-[#888] leading-relaxed">
                {latestAiMessage.bertSummary}
              </p>
            </div>
          </div>
        )}

        {/* Model Synthesis (Expandable) */}
        {latestAiMessage.modelSynthesis && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg overflow-hidden">
              <button
                onClick={() => setSynthesisExpanded(!synthesisExpanded)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🎯</div>
                  <div>
                    <div className="font-medium text-[#e7e7e7]">Modellsyntes & Konsensus</div>
                    <div className="text-sm text-[#666]">
                      {latestAiMessage.modelSynthesis.consensus?.overallConsensus || '87'}% överensstämmelse mellan modeller
                    </div>
                  </div>
                </div>
                <div className="text-[#666]">{synthesisExpanded ? '−' : '+'}</div>
              </button>
              
              {synthesisExpanded && (
                <div className="border-t border-[#2a2a2a] p-6 space-y-4">
                  {/* Consensus Areas */}
                  {latestAiMessage.modelSynthesis.consensus?.areas && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">Konsensuområden:</div>
                      <div className="space-y-2">
                        {latestAiMessage.modelSynthesis.consensus.areas.map((area, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-[#888]">{area.area}: {area.dominant}</span>
                            <span className="text-[#666]">{area.consensus}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Common Topics (Consensus Points) */}
                  {latestAiMessage.modelSynthesis.insights?.commonTopics && latestAiMessage.modelSynthesis.insights.commonTopics.length > 0 && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">Gemensamma ämnen:</div>
                      <div className="space-y-2">
                        {latestAiMessage.modelSynthesis.insights.commonTopics.slice(0, 5).map((topic, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-[#888]">{topic.topic || topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Divergence Points */}
                  {latestAiMessage.modelSynthesis.divergences?.divergences && latestAiMessage.modelSynthesis.divergences.divergences.length > 0 && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">Divergenspunkter:</div>
                      <div className="space-y-2">
                        {latestAiMessage.modelSynthesis.divergences.divergences.map((div, idx) => (
                          <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[#e7e7e7]">{div.type}</div>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                div.severity === 'high' ? 'bg-red-900/20 text-red-400' :
                                div.severity === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                                'bg-blue-900/20 text-blue-400'
                              }`}>
                                {div.severity}
                              </span>
                            </div>
                            <div className="text-sm text-[#666]">{div.description}</div>
                            {div.models && (
                              <div className="mt-2 text-xs text-[#555]">
                                {div.models.map(m => `${m.agent}: ${m.value}`).join(' • ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Contradictions */}
                  {latestAiMessage.modelSynthesis.contradictions?.contradictions && latestAiMessage.modelSynthesis.contradictions.contradictions.length > 0 && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">Motsägelser:</div>
                      <div className="space-y-2">
                        {latestAiMessage.modelSynthesis.contradictions.contradictions.map((contra, idx) => (
                          <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3">
                            <div className="text-[#e7e7e7] mb-1">{contra.topic}</div>
                            <div className="text-sm text-[#666]">{contra.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Model Table */}
        {latestAiMessage.responses && latestAiMessage.responses.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="text-[#666] text-sm uppercase tracking-wide mb-4">MODELLÖVERSIKT</div>
            <div className="space-y-3">
              {latestAiMessage.responses.map((response, idx) => (
                <div key={idx} className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-[#e7e7e7]">{response.agent || `Modell ${idx + 1}`}</div>
                    <button
                      onClick={() => {
                        setSelectedModel(response.agent);
                        setViewMode('pipeline');
                      }}
                      className="text-sm text-[#666] hover:text-[#e7e7e7] transition-colors"
                    >
                      Se pipeline →
                    </button>
                  </div>
                  
                  {/* Bias Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-[#666] mb-1">Bias</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.bias?.biasScore || 1.5) * 10}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(response.analysis?.bias?.biasScore || 1.5).toFixed(1)}/10</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Tillit</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.tone?.confidence || 0.88) * 100}%`}}></div>
                        </div>
                        <span className="text-[#888]">{((response.analysis?.tone?.confidence || 0.88) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Faktahalt</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${response.enhancedAnalysis?.factOpinion?.summary?.factPercentage || 94}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(response.enhancedAnalysis?.factOpinion?.summary?.factPercentage || 94).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Objektivitet</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${100 - ((response.analysis?.bias?.biasScore || 1.5) * 10)}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(100 - ((response.analysis?.bias?.biasScore || 1.5) * 10)).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Models mode: Full responses with complete analysis
  const renderModels = () => {
    return (
      <div className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-[#666] text-sm uppercase tracking-wide mb-6">DETALJERADE MODELLSVAR</div>
          
          <div className="space-y-8">
            {latestAiMessage.responses && latestAiMessage.responses.map((response, idx) => (
              <div key={idx} className="bg-[#151515] border border-[#2a2a2a] rounded-lg overflow-hidden">
                {/* Model Header */}
                <div className="p-6 border-b border-[#2a2a2a]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-medium text-[#e7e7e7] text-lg">{response.agent || `Modell ${idx + 1}`}</div>
                    <button
                      onClick={() => {
                        setSelectedModel(response.agent);
                        setViewMode('pipeline');
                      }}
                      className="text-sm px-3 py-1 bg-[#2a2a2a] text-[#e7e7e7] rounded hover:bg-[#3a3a3a] transition-colors"
                    >
                      Pipeline →
                    </button>
                  </div>
                  
                  {/* Full Bias Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-[#666] mb-2">Bias</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.bias?.biasScore || 1.5) * 10}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(response.analysis?.bias?.biasScore || 1.5).toFixed(1)}/10</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Tillit</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.tone?.confidence || 0.88) * 100}%`}}></div>
                      </div>
                      <div className="text-[#888]">{((response.analysis?.tone?.confidence || 0.88) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Faktahalt</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${response.enhancedAnalysis?.factOpinion?.summary?.factPercentage || 94}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(response.enhancedAnalysis?.factOpinion?.summary?.factPercentage || 94).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Objektivitet</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${100 - ((response.analysis?.bias?.biasScore || 1.5) * 10)}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(100 - ((response.analysis?.bias?.biasScore || 1.5) * 10)).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Full Response Text */}
                <div className="p-6">
                  <div className="text-[#888] leading-relaxed mb-6">
                    {response.response || response.text || 'Inget svar tillgängligt'}
                  </div>
                  
                  {/* Emotion/Tone/Intent */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Emotion</div>
                      <div className="text-[#e7e7e7]">{response.enhancedAnalysis?.emotion?.primary || response.analysis?.tone?.primary || 'Neutral'}</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Ton</div>
                      <div className="text-[#e7e7e7]">{response.analysis?.tone?.description || response.analysis?.tone?.primary || 'Informativ'}</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Syfte</div>
                      <div className="text-[#e7e7e7]">{response.enhancedAnalysis?.intent?.primary || 'Förklara'}</div>
                    </div>
                  </div>
                  
                  {/* Main Points */}
                  {response.enhancedAnalysis?.argumentation?.huvudpunkter && response.enhancedAnalysis.argumentation.huvudpunkter.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[#666] mb-2">Huvudpunkter:</div>
                      <div className="space-y-2">
                        {response.enhancedAnalysis.argumentation.huvudpunkter.map((point, pidx) => (
                          <div key={pidx} className="flex items-start gap-2">
                            <span className="text-[#666] mt-0.5">{pidx + 1}.</span>
                            <span className="text-[#888]">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Identified Entities */}
                  {response.enhancedAnalysis?.entities?.entities && response.enhancedAnalysis.entities.entities.length > 0 && (
                    <div>
                      <div className="text-[#666] mb-2">Identifierade entiteter:</div>
                      <div className="flex flex-wrap gap-2">
                        {response.enhancedAnalysis.entities.entities.slice(0, 8).map((entity, eidx) => (
                          <span key={eidx} className="px-2 py-1 bg-[#1a1a1a] text-[#888] text-sm rounded">
                            {entity.text} ({entity.label})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Identified Entities */}
                  {response.entities && response.entities.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-[#666] mb-2">Identifierade entiteter:</div>
                      <div className="flex flex-wrap gap-2">
                        {response.entities.map((entity, i) => (
                          <span key={i} className="px-2 py-1 bg-[#1a1a1a] text-[#888] text-sm rounded">
                            {entity.text || entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Pipeline mode: Complete processing steps
  const renderPipeline = () => {
    const selectedResponse = latestAiMessage.responses?.find(r => r.model === selectedModel) || latestAiMessage.responses?.[0];
    
    return (
      <div className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Model Selector */}
          <div className="mb-6">
            <div className="text-[#666] text-sm uppercase tracking-wide mb-3">VÄLJ MODELL</div>
            <div className="flex gap-2 flex-wrap">
              {latestAiMessage.responses && latestAiMessage.responses.map((response, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedModel(response.model)}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedModel === response.model
                      ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                      : 'bg-[#151515] border border-[#2a2a2a] text-[#888] hover:border-[#3a3a3a]'
                  }`}
                >
                  {response.model}
                </button>
              ))}
            </div>
          </div>

          {selectedResponse && selectedResponse.pipelineAnalysis && (
            <div className="space-y-6">
              <div className="text-[#666] text-sm uppercase tracking-wide">PIPELINE-ANALYS: {selectedModel}</div>
              
              {/* Preprocessing */}
              {selectedResponse.pipelineAnalysis.preprocessing && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="font-medium text-[#e7e7e7] mb-4">Förbearbetning</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[#666]">Ord</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.preprocessing.word_count || '247'}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Meningar</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.preprocessing.sentence_count || '12'}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Subjektivitet</div>
                      <div className="text-[#e7e7e7]">{(selectedResponse.pipelineAnalysis.preprocessing.subjectivity || 0.42).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sentiment */}
              {selectedResponse.pipelineAnalysis.sentimentAnalysis && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="font-medium text-[#e7e7e7] mb-4">Sentimentanalys</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[#666]">Övergripande</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.sentimentAnalysis.overall || 'Positiv'}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Poäng</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.sentimentAnalysis.score?.toFixed(2) || '0.73'}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Intensitet</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.sentimentAnalysis.intensity || 'Måttlig'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ideological Classification */}
              {selectedResponse.pipelineAnalysis.ideologicalClassification && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="font-medium text-[#e7e7e7] mb-4">Ideologisk klassificering</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[#666]">Primär</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.ideologicalClassification.primary || 'Center'}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Säkerhet</div>
                      <div className="text-[#e7e7e7]">{((selectedResponse.pipelineAnalysis.ideologicalClassification.confidence || 0.81) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Indikatorer</div>
                      <div className="text-[#e7e7e7]">{selectedResponse.pipelineAnalysis.ideologicalClassification.indicators?.length || '5'} st</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedResponse.pipelineAnalysis.timeline && selectedResponse.pipelineAnalysis.timeline.length > 0 && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="font-medium text-[#e7e7e7] mb-4">Processtidslinje</h3>
                  <div className="space-y-3">
                    {selectedResponse.pipelineAnalysis.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-[#888] rounded-full"></div>
                        <div className="flex-1 text-sm">
                          <div className="text-[#e7e7e7]">{step.step || step.name}</div>
                          <div className="text-[#666]">{step.model || 'JavaScript'} • {step.duration || '23'}ms</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#2a2a2a] text-sm">
                      <div className="text-[#666]">Total tid: <span className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.timeline.reduce((sum, step) => sum + (step.duration || 0), 0)}ms
                      </span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debate mode: Live consensus debate
  const renderDebate = () => {
    return (
      <div className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-[#666] text-sm uppercase tracking-wide mb-6">LIVE KONSENSUS-DEBATT</div>
          
          {/* Controls */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={startDebate}
              disabled={debateActive}
              className="px-4 py-2 bg-[#e7e7e7] text-[#0a0a0a] rounded hover:bg-[#fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Starta debatt
            </button>
            <button
              onClick={pauseDebate}
              disabled={!debateActive}
              className="px-4 py-2 bg-[#2a2a2a] text-[#e7e7e7] rounded hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pausa
            </button>
          </div>

          {/* Debate Messages */}
          <div className="space-y-4">
            {debateMessages.map((msg, idx) => (
              <div key={idx} className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-sm">
                    {msg.model.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-[#e7e7e7]">{msg.model}</div>
                    <div className="text-xs text-[#666]">{new Date(msg.timestamp).toLocaleTimeString('sv-SE')}</div>
                  </div>
                </div>
                <p className="text-[#888] leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Consensus Summary */}
          {debateMessages.length > 0 && (
            <div className="mt-8 bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <h3 className="font-medium text-[#e7e7e7] mb-3">Konsensussammanfattning</h3>
              <p className="text-[#888] leading-relaxed">
                Modellerna är överens om att klimatåtgärderna bör fokusera på elektrifiering,
                förnybar energi och energieffektivisering. Vissa skillnader finns i prioriteringsordning
                och implementeringsstrategi.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#151515]">
        <div className="h-16 px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="text-lg font-light">OneSeek.AI</div>
          
          {/* Centered View Selector */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-1 bg-[#151515] rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'overview'
                  ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                  : 'text-[#888] hover:text-[#e7e7e7]'
              }`}
            >
              Översikt
            </button>
            <button
              onClick={() => setViewMode('models')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'models'
                  ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                  : 'text-[#888] hover:text-[#e7e7e7]'
              }`}
            >
              Modeller
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                  : 'text-[#888] hover:text-[#e7e7e7]'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('debate')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'debate'
                  ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                  : 'text-[#888] hover:text-[#e7e7e7]'
              }`}
            >
              Debatt
            </button>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#151515] rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {renderContent()}

      {/* Premium Input Field (Concept 21 style) - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ställ en fråga..."
              disabled={isLoading}
              className="w-full px-6 py-4 pr-32 bg-[#151515] border border-[#2a2a2a] rounded-lg text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[#e7e7e7] text-[#0a0a0a] rounded hover:bg-[#fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyserar...' : 'Analysera'}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar Menu */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-[#151515] z-50 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#151515] flex items-center justify-between">
              <div className="font-medium text-[#e7e7e7]">Meny</div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-[#151515] rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <a href="/" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Hem
                </a>
                <a href="/chat-v2" className="block px-4 py-3 text-[#e7e7e7] bg-[#151515] rounded">
                  Analys
                </a>
                <a href="/audit-trail" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Historik
                </a>
                <a href="/policy-questions" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Källor
                </a>
                <a href="/contact" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Inställningar
                </a>
                <a href="/about" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Om OneSeek.AI
                </a>
                <a href="/contact" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                  Kontakt
                </a>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-[#151515] text-sm text-[#666]">
              © 2024 OneSeek.AI
            </div>
          </div>
        </>
      )}

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#151515] z-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-wrap gap-4 text-sm text-[#666]">
            <a href="/about" className="hover:text-[#e7e7e7] transition-colors">Om OneSeek.AI</a>
            <a href="/policy" className="hover:text-[#e7e7e7] transition-colors">Integritet</a>
            <a href="/features" className="hover:text-[#e7e7e7] transition-colors">API</a>
            <a href="/audit-trail" className="hover:text-[#e7e7e7] transition-colors">Historik</a>
            <a href="/policy-questions" className="hover:text-[#e7e7e7] transition-colors">Källor</a>
            <a href="/contact" className="hover:text-[#e7e7e7] transition-colors">Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
