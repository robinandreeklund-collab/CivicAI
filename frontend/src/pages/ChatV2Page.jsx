import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ConsensusDebateCard from '../components/ConsensusDebateCard';
import NLPProcessingLoader from '../components/NLPProcessingLoader';
import ChangeDetectionPanel from '../components/ChangeDetectionPanel';
import ReplayTimeline from '../components/ReplayTimeline';

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
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, models, pipeline, debate
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [synthesisExpanded, setSynthesisExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5');
  const [showReplay, setShowReplay] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [expandedPipelineStep, setExpandedPipelineStep] = useState(null);
  
  // Prevent duplicate submissions in React StrictMode (development)
  const hasSubmittedInitialQuestion = useRef(false);

  // Get latest AI message for display
  const latestAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];

  // Handle initial question from LandingPage navigation
  useEffect(() => {
    if (location.state?.initialQuestion && !hasSubmittedInitialQuestion.current) {
      hasSubmittedInitialQuestion.current = true;
      setQuestion(location.state.initialQuestion);
      // Auto-submit the question
      const submitInitialQuestion = async () => {
        const userQuestion = location.state.initialQuestion.trim();
        
        // Add user message
        const userMessage = {
          type: 'user',
          content: userQuestion,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([userMessage]);
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
            // Change detection data from backend
            changeDetection: data.change_detection || null,
            timestamp: new Date().toISOString(),
          };
          
          setMessages([userMessage, aiMessage]);
          setViewMode('overview');
          
          // Initialize selectedModel with first response's agent name
          if (aiMessage.responses && aiMessage.responses.length > 0) {
            setSelectedModel(aiMessage.responses[0].agent);
          }
          
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

      submitInitialQuestion();
      
      // Clear the location state to prevent re-submission on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Reset the ref when location changes (navigating to new question)
    return () => {
      if (location.state?.initialQuestion) {
        hasSubmittedInitialQuestion.current = false;
      }
    };
  }, [location.state]);

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
        // Change detection data from backend
        changeDetection: data.change_detection || null,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setViewMode('overview'); // Reset to overview on new response
      
      // Initialize selectedModel with first response's agent name
      if (aiMessage.responses && aiMessage.responses.length > 0) {
        setSelectedModel(aiMessage.responses[0].agent);
      }
      
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

  // Render different views based on viewMode
  const renderContent = () => {
    // Show loader when loading
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <NLPProcessingLoader />
        </div>
      );
    }

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
      <div className="flex-1 overflow-y-auto pb-40 px-4 md:px-8 pt-24">
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
                      {latestAiMessage.modelSynthesis.consensus?.overallConsensus}% överensstämmelse mellan modeller
                    </div>
                  </div>
                </div>
                <div className="text-[#666]">{synthesisExpanded ? '−' : '+'}</div>
              </button>
              
              {synthesisExpanded && (
                <div className="border-t border-[#2a2a2a] p-6 space-y-6">
                  {/* Enhanced Synthesis Metrics */}
                  {(latestAiMessage.modelSynthesis.consensusIndex !== undefined || 
                    latestAiMessage.modelSynthesis.weightedSentiment ||
                    latestAiMessage.modelSynthesis.ideologicalLeaning) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {latestAiMessage.modelSynthesis.consensusIndex !== undefined && (
                        <div className="bg-[#1a1a1a] rounded p-4">
                          <div className="text-[#666] text-sm mb-2">Konsensusindex</div>
                          <div className="text-2xl font-medium text-[#e7e7e7]">
                            {(latestAiMessage.modelSynthesis.consensusIndex * 100).toFixed(0)}%
                          </div>
                          <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden mt-2">
                            <div 
                              className="bg-green-500 h-full" 
                              style={{width: `${latestAiMessage.modelSynthesis.consensusIndex * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {latestAiMessage.modelSynthesis.divergenceMeasure !== undefined && (
                        <div className="bg-[#1a1a1a] rounded p-4">
                          <div className="text-[#666] text-sm mb-2">Divergensmått</div>
                          <div className="text-2xl font-medium text-[#e7e7e7]">
                            {(latestAiMessage.modelSynthesis.divergenceMeasure * 100).toFixed(0)}%
                          </div>
                          <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden mt-2">
                            <div 
                              className="bg-yellow-500 h-full" 
                              style={{width: `${latestAiMessage.modelSynthesis.divergenceMeasure * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {latestAiMessage.modelSynthesis.weightedSentiment && (
                        <div className="bg-[#1a1a1a] rounded p-4">
                          <div className="text-[#666] text-sm mb-2">Viktat Sentiment</div>
                          <div className="text-2xl font-medium text-[#e7e7e7] capitalize">
                            {latestAiMessage.modelSynthesis.weightedSentiment.classification}
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                            <div className="text-green-400">
                              +{(latestAiMessage.modelSynthesis.weightedSentiment.positive * 100).toFixed(0)}%
                            </div>
                            <div className="text-[#666]">
                              ={(latestAiMessage.modelSynthesis.weightedSentiment.neutral * 100).toFixed(0)}%
                            </div>
                            <div className="text-red-400">
                              -{(latestAiMessage.modelSynthesis.weightedSentiment.negative * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Ideological Leaning & Dominant Themes */}
                  {(latestAiMessage.modelSynthesis.ideologicalLeaning || 
                    latestAiMessage.modelSynthesis.dominantThemes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestAiMessage.modelSynthesis.ideologicalLeaning && (
                        <div className="bg-[#1a1a1a] rounded p-4">
                          <div className="text-[#666] text-sm mb-2">Ideologisk lutning</div>
                          <div className="text-lg font-medium text-[#e7e7e7] capitalize mb-2">
                            {latestAiMessage.modelSynthesis.ideologicalLeaning.dominant}
                          </div>
                          <div className="text-xs text-[#666]">
                            Säkerhet: {(latestAiMessage.modelSynthesis.ideologicalLeaning.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      )}
                      
                      {latestAiMessage.modelSynthesis.dominantThemes && 
                       latestAiMessage.modelSynthesis.dominantThemes.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded p-4">
                          <div className="text-[#666] text-sm mb-2">Dominanta teman</div>
                          <div className="space-y-1">
                            {latestAiMessage.modelSynthesis.dominantThemes.slice(0, 3).map((theme, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-[#e7e7e7]">{theme.topic}</span>
                                <span className="text-[#666]">{theme.percentage.toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
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
                          <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.bias?.biasScore ?? 0) * 10}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(response.analysis?.bias?.biasScore ?? 0).toFixed(1)}/10</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Tillit</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.tone?.confidence ?? 0) * 100}%`}}></div>
                        </div>
                        <span className="text-[#888]">{((response.analysis?.tone?.confidence ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Faktahalt</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${response.enhancedAnalysis?.factOpinion?.summary?.factPercentage ?? 0}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(response.enhancedAnalysis?.factOpinion?.summary?.factPercentage ?? 0).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Objektivitet</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#888] h-full" style={{width: `${100 - ((response.analysis?.bias?.biasScore ?? 0) * 10)}%`}}></div>
                        </div>
                        <span className="text-[#888]">{(100 - ((response.analysis?.bias?.biasScore ?? 0) * 10)).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Detection Panel */}
        {latestAiMessage.changeDetection && (
          <div className="max-w-4xl mx-auto mb-8">
            <ChangeDetectionPanel 
              changeData={latestAiMessage.changeDetection}
              onOpenLedger={(blockId) => {
                // Navigate to ledger view - could be implemented later
                console.log('Open ledger block:', blockId);
              }}
              onOpenReplay={(data) => {
                setReplayData(data);
                setShowReplay(true);
              }}
            />
          </div>
        )}

        {/* Explainability Panel (SHAP/LIME) */}
        {(latestAiMessage.responses?.some(r => r.explainability) || latestAiMessage.explainability) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🔍</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Explainability & Feature Importance</div>
                  <div className="text-sm text-[#666]">SHAP and LIME model explanations</div>
                </div>
              </div>
              {/* TODO: Backend should provide explainability data in response.explainability */}
              {latestAiMessage.explainability ? (
                <div className="space-y-4">
                  {latestAiMessage.explainability.shap && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">SHAP Values (Top Features):</div>
                      <div className="space-y-2">
                        {latestAiMessage.explainability.shap.topFeatures?.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[#e7e7e7] text-sm">{feat.token}</span>
                                <span className={`text-xs ${feat.direction === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                  {feat.contribution > 0 ? '+' : ''}{feat.contribution.toFixed(3)}
                                </span>
                              </div>
                              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${feat.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{width: `${Math.abs(feat.contribution) * 100}%`}}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )) || <p className="text-[#666] text-sm">No SHAP data available</p>}
                      </div>
                    </div>
                  )}
                  {latestAiMessage.explainability.lime && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">LIME Explanation:</div>
                      <p className="text-[#888] text-sm mb-3">{latestAiMessage.explainability.lime.explanation}</p>
                      <div className="space-y-1">
                        {latestAiMessage.explainability.lime.weights?.slice(0, 5).map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-[#e7e7e7]">{w.word}</span>
                            <span className="text-[#666]">{w.weight.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Explainability data kommer vara tillgänglig när backend är implementerat</p>
                  <p className="text-[#555] text-xs mt-1">TODO: Implementera /ml/shap och /ml/lime endpoints</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toxicity Analysis Panel (Detoxify) */}
        {(latestAiMessage.responses?.some(r => r.toxicity) || latestAiMessage.toxicity) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🛡️</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Toxicity Analysis</div>
                  <div className="text-sm text-[#666]">Multi-dimensional toxicity detection using Detoxify</div>
                </div>
              </div>
              {/* TODO: Backend should provide toxicity data in response.toxicity */}
              {latestAiMessage.toxicity ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      {label: 'Toxicity', value: latestAiMessage.toxicity.toxicity, key: 'toxicity'},
                      {label: 'Threat', value: latestAiMessage.toxicity.threat, key: 'threat'},
                      {label: 'Insult', value: latestAiMessage.toxicity.insult, key: 'insult'},
                      {label: 'Identity Attack', value: latestAiMessage.toxicity.identity_attack, key: 'identity_attack'},
                      {label: 'Obscene', value: latestAiMessage.toxicity.obscene, key: 'obscene'},
                      {label: 'Severe Toxicity', value: latestAiMessage.toxicity.severe_toxicity, key: 'severe_toxicity'},
                    ].map((metric) => (
                      <div key={metric.key} className="bg-[#1a1a1a] rounded p-3">
                        <div className="text-[#666] text-xs mb-2">{metric.label}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#0a0a0a] h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                (metric.value || 0) > 0.5 ? 'bg-red-500' :
                                (metric.value || 0) > 0.3 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{width: `${(metric.value || 0) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-[#e7e7e7] text-sm font-medium">
                            {((metric.value || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {latestAiMessage.toxicity.overall_toxic !== undefined && (
                    <div className={`p-3 rounded ${latestAiMessage.toxicity.overall_toxic ? 'bg-red-900/20 border border-red-900/30' : 'bg-green-900/20 border border-green-900/30'}`}>
                      <div className="text-sm">
                        <span className="font-medium">Overall Assessment: </span>
                        <span className={latestAiMessage.toxicity.overall_toxic ? 'text-red-400' : 'text-green-400'}>
                          {latestAiMessage.toxicity.overall_toxic ? 'Toxic content detected' : 'Content appears safe'}
                        </span>
                        {latestAiMessage.toxicity.risk_level && (
                          <span className="text-[#666] ml-2">
                            (Risk Level: {latestAiMessage.toxicity.risk_level})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Toxicitetsanalys kommer vara tillgänglig när backend är implementerat</p>
                  <p className="text-[#555] text-xs mt-1">TODO: Implementera /ml/toxicity endpoint</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Topic Modeling Panel (BERTopic) */}
        {(latestAiMessage.responses?.some(r => r.topics) || latestAiMessage.topics) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🧠</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Topic Modeling</div>
                  <div className="text-sm text-[#666]">BERTopic cluster analysis and dominant themes</div>
                </div>
              </div>
              {/* TODO: Backend should provide topics data in response.topics */}
              {latestAiMessage.topics ? (
                <div className="space-y-4">
                  {latestAiMessage.topics.topics?.map((topic, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[#e7e7e7] font-medium">{topic.label}</div>
                          <div className="text-[#666] text-xs">Topic {topic.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#e7e7e7] text-lg font-medium">
                            {(topic.probability * 100).toFixed(1)}%
                          </div>
                          {topic.coherence && (
                            <div className="text-[#666] text-xs">
                              Coherence: {topic.coherence.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topic.terms?.map((term, tidx) => (
                          <span key={tidx} className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-xs rounded">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )) || <p className="text-[#666] text-sm">No topics identified</p>}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Topic modeling kommer vara tillgänglig när backend är implementerat</p>
                  <p className="text-[#555] text-xs mt-1">TODO: Implementera /ml/topics endpoint med BERTopic</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bias & Fairness Panel (Fairlearn) */}
        {(latestAiMessage.responses?.some(r => r.fairness) || latestAiMessage.fairness) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">⚖️</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Bias & Fairness Analysis</div>
                  <div className="text-sm text-[#666]">Fairlearn metrics and bias detection</div>
                </div>
              </div>
              {/* TODO: Backend should provide fairness data in response.fairness */}
              {latestAiMessage.fairness ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {latestAiMessage.fairness.demographicParity !== undefined && (
                      <div className="bg-[#1a1a1a] rounded p-3">
                        <div className="text-[#666] text-sm mb-2">Demographic Parity</div>
                        <div className="text-2xl font-medium text-[#e7e7e7]">
                          {(latestAiMessage.fairness.demographicParity * 100).toFixed(0)}%
                        </div>
                        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-blue-500 h-full" 
                            style={{width: `${latestAiMessage.fairness.demographicParity * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                    {latestAiMessage.fairness.equalizedOdds !== undefined && (
                      <div className="bg-[#1a1a1a] rounded p-3">
                        <div className="text-[#666] text-sm mb-2">Equalized Odds</div>
                        <div className="text-2xl font-medium text-[#e7e7e7]">
                          {(latestAiMessage.fairness.equalizedOdds * 100).toFixed(0)}%
                        </div>
                        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-purple-500 h-full" 
                            style={{width: `${latestAiMessage.fairness.equalizedOdds * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                    {latestAiMessage.fairness.disparateImpact !== undefined && (
                      <div className="bg-[#1a1a1a] rounded p-3">
                        <div className="text-[#666] text-sm mb-2">Disparate Impact</div>
                        <div className="text-2xl font-medium text-[#e7e7e7]">
                          {(latestAiMessage.fairness.disparateImpact * 100).toFixed(0)}%
                        </div>
                        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-cyan-500 h-full" 
                            style={{width: `${latestAiMessage.fairness.disparateImpact * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {latestAiMessage.fairness.fairnessViolations && latestAiMessage.fairness.fairnessViolations.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-900/30 rounded p-3">
                      <div className="text-sm text-yellow-400 mb-2">⚠ Fairness Violations Detected:</div>
                      <ul className="space-y-1">
                        {latestAiMessage.fairness.fairnessViolations.map((violation, idx) => (
                          <li key={idx} className="text-[#888] text-sm">• {violation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {latestAiMessage.fairness.recommendations && latestAiMessage.fairness.recommendations.length > 0 && (
                    <div>
                      <div className="text-[#666] text-sm mb-2">Recommendations:</div>
                      <ul className="space-y-1">
                        {latestAiMessage.fairness.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-[#888] text-sm">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Fairness-analys kommer vara tillgänglig när backend är implementerat</p>
                  <p className="text-[#555] text-xs mt-1">TODO: Implementera /ml/fairness endpoint med Fairlearn</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fact Checking Panel (Tavily) */}
        {(latestAiMessage.factCheck || latestAiMessage.factCheckComparison) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">✅</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Fact Checking</div>
                  <div className="text-sm text-[#666]">Source verification using Tavily API</div>
                </div>
              </div>
              {/* TODO: Backend should provide fact checking data in response.factCheck */}
              {latestAiMessage.factCheck ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded">
                    <div>
                      <div className="text-sm text-[#666]">Verification Status</div>
                      <div className={`text-lg font-medium capitalize ${
                        latestAiMessage.factCheck.verificationStatus === 'true' ? 'text-green-400' :
                        latestAiMessage.factCheck.verificationStatus === 'false' ? 'text-red-400' :
                        latestAiMessage.factCheck.verificationStatus === 'partially_true' ? 'text-yellow-400' :
                        'text-[#888]'
                      }`}>
                        {latestAiMessage.factCheck.verificationStatus?.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#666]">Confidence</div>
                      <div className="text-lg font-medium text-[#e7e7e7]">
                        {(latestAiMessage.factCheck.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  {latestAiMessage.factCheck.verdict && (
                    <div className="p-3 bg-[#1a1a1a] rounded">
                      <div className="text-sm text-[#666] mb-2">Verdict:</div>
                      <p className="text-[#888] text-sm">{latestAiMessage.factCheck.verdict}</p>
                    </div>
                  )}
                  {latestAiMessage.factCheck.sources && latestAiMessage.factCheck.sources.length > 0 && (
                    <div>
                      <div className="text-sm text-[#666] mb-2">
                        Sources ({latestAiMessage.factCheck.supportingEvidence || 0} supporting, {latestAiMessage.factCheck.contradictingEvidence || 0} contradicting):
                      </div>
                      <div className="space-y-2">
                        {latestAiMessage.factCheck.sources.map((source, idx) => (
                          <div key={idx} className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#e7e7e7] hover:text-white text-sm font-medium flex-1">
                                {source.title}
                              </a>
                              {source.credibility && (
                                <span className="text-xs px-2 py-1 bg-[#2a2a2a] text-[#888] rounded ml-2">
                                  {(source.credibility * 100).toFixed(0)}% credible
                                </span>
                              )}
                            </div>
                            {source.snippet && (
                              <p className="text-[#666] text-xs mb-1">{source.snippet}</p>
                            )}
                            {source.date && (
                              <div className="text-[#555] text-xs">{source.date}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Fact checking kommer vara tillgänglig när backend är implementerat</p>
                  <p className="text-[#555] text-xs mt-1">TODO: Implementera /fact-check/verify endpoint med Tavily API</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Models mode: Full responses with complete analysis
  const renderModels = () => {
    return (
      <div className="flex-1 overflow-y-auto pb-40 px-4 md:px-8 pt-24">
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
                  
                  {/* Enhanced Metadata Display */}
                  {response.metadata && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-xs">
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="text-[#666] mb-1">Modell</div>
                        <div className="text-[#e7e7e7]">{response.metadata.model || response.metadata.version || 'N/A'}</div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="text-[#666] mb-1">Svarstid</div>
                        <div className="text-[#e7e7e7]">{response.metadata.responseTimeMs || 0}ms</div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="text-[#666] mb-1">Tokens</div>
                        <div className="text-[#e7e7e7]">{response.metadata.tokenCount || 0}</div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="text-[#666] mb-1">Språk</div>
                        <div className="text-[#e7e7e7]">
                          {response.metadata.language?.detected || 'N/A'} 
                          {response.metadata.language?.confidence && 
                            ` (${(response.metadata.language.confidence * 100).toFixed(0)}%)`}
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="text-[#666] mb-1">Confidence</div>
                        <div className="text-[#e7e7e7]">
                          {response.metadata.confidence ? `${(response.metadata.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Full Bias Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-[#666] mb-2">Bias</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.bias?.biasScore ?? 0) * 10}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(response.analysis?.bias?.biasScore ?? 0).toFixed(1)}/10</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Tillit</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.tone?.confidence ?? 0) * 100}%`}}></div>
                      </div>
                      <div className="text-[#888]">{((response.analysis?.tone?.confidence ?? 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Faktahalt</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${response.enhancedAnalysis?.factOpinion?.summary?.factPercentage ?? 0}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(response.enhancedAnalysis?.factOpinion?.summary?.factPercentage ?? 0).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Objektivitet</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${100 - ((response.analysis?.bias?.biasScore ?? 0) * 10)}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(100 - ((response.analysis?.bias?.biasScore ?? 0) * 10)).toFixed(0)}%</div>
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
                      <div className="text-[#e7e7e7]">
                        {response.enhancedAnalysis?.emotion?.primary || response.analysis?.tone?.primary || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Ton</div>
                      <div className="text-[#e7e7e7]">
                        {response.analysis?.tone?.description || response.analysis?.tone?.primary || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Syfte</div>
                      <div className="text-[#e7e7e7]">{response.enhancedAnalysis?.intent?.primary || 'N/A'}</div>
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
    const selectedResponse = latestAiMessage.responses?.find(r => r.agent === selectedModel) || latestAiMessage.responses?.[0];
    
    return (
      <div className="flex-1 overflow-y-auto pb-40 px-4 md:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Model Selector */}
          <div className="mb-6">
            <div className="text-[#666] text-sm uppercase tracking-wide mb-3">VÄLJ MODELL</div>
            <div className="flex gap-2 flex-wrap">
              {latestAiMessage.responses && latestAiMessage.responses.map((response, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedModel(response.agent)}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedModel === response.agent
                      ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                      : 'bg-[#151515] border border-[#2a2a2a] text-[#888] hover:border-[#3a3a3a]'
                  }`}
                >
                  {response.agent}
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
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.preprocessing.tokenization?.wordCount ?? 
                         selectedResponse.pipelineAnalysis.preprocessing.word_count ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Meningar</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.preprocessing.tokenization?.sentenceCount ?? 
                         selectedResponse.pipelineAnalysis.preprocessing.sentence_count ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Subjektivitet</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.preprocessing.subjectivityAnalysis?.subjectivityScore != null 
                          ? selectedResponse.pipelineAnalysis.preprocessing.subjectivityAnalysis.subjectivityScore.toFixed(2)
                          : (selectedResponse.pipelineAnalysis.preprocessing.subjectivity != null 
                            ? selectedResponse.pipelineAnalysis.preprocessing.subjectivity.toFixed(2)
                            : 'N/A')}
                      </div>
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
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.sentimentAnalysis.overallTone ?? 
                         selectedResponse.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.classification ?? 
                         selectedResponse.pipelineAnalysis.sentimentAnalysis.overall ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Poäng</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.score != null
                          ? selectedResponse.pipelineAnalysis.sentimentAnalysis.vaderSentiment.score.toFixed(2)
                          : (selectedResponse.pipelineAnalysis.sentimentAnalysis.score != null
                            ? selectedResponse.pipelineAnalysis.sentimentAnalysis.score.toFixed(2)
                            : 'N/A')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Intensitet</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.comparative != null
                          ? Math.abs(selectedResponse.pipelineAnalysis.sentimentAnalysis.vaderSentiment.comparative).toFixed(2)
                          : (selectedResponse.pipelineAnalysis.sentimentAnalysis.intensity ?? 'N/A')}
                      </div>
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
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.ideologicalClassification.ideology?.classification ?? 
                         selectedResponse.pipelineAnalysis.ideologicalClassification.primary ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Säkerhet</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.ideologicalClassification.ideology?.confidence != null
                          ? `${(selectedResponse.pipelineAnalysis.ideologicalClassification.ideology.confidence * 100).toFixed(0)}%`
                          : (selectedResponse.pipelineAnalysis.ideologicalClassification.confidence != null
                            ? `${(selectedResponse.pipelineAnalysis.ideologicalClassification.confidence * 100).toFixed(0)}%`
                            : 'N/A')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666]">Indikatorer</div>
                      <div className="text-[#e7e7e7]">
                        {selectedResponse.pipelineAnalysis.ideologicalClassification.ideology?.markers?.length ?? 
                         selectedResponse.pipelineAnalysis.ideologicalClassification.indicators?.length ?? 0} st
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline Process Timeline with all NLP services */}
              {selectedResponse.pipelineAnalysis.timeline && selectedResponse.pipelineAnalysis.timeline.length > 0 && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="font-medium text-[#e7e7e7] mb-4">Pipeline Processtidslinje</h3>
                  <div className="space-y-3">
                    {selectedResponse.pipelineAnalysis.timeline.map((step, idx) => {
                      const isExpanded = expandedPipelineStep === idx;
                      const stepDuration = step.durationMs ?? step.duration ?? 0;
                      
                      // Get step icon
                      const getStepIcon = (stepName) => {
                        const icons = {
                          'spacy_preprocessing': '📝',
                          'textblob_sentiment': '💭',
                          'langdetect': '🌍',
                          'detoxify_toxicity': '🛡️',
                          'swedish_bert_ideology': '🏛️',
                          'shap_explainability': '🔍',
                          'gensim_topics': '📊',
                          'bertopic_modeling': '🧠',
                          'lime_explanation': '💡',
                          'fairlearn_fairness': '⚖️',
                          'lux_viz': '📈',
                          'sweetviz_eda': '📉',
                          'preprocessing': '📝',
                          'bias_detection': '🎯',
                          'sentiment_analysis': '💭',
                          'ideology_classification': '🏛️',
                          'tone_analysis': '🎵',
                          'fact_checking': '✅',
                        };
                        return icons[stepName] || '⚙️';
                      };
                      
                      return (
                        <div key={idx} className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedPipelineStep(isExpanded ? null : idx)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition-colors"
                          >
                            <div className="text-xl">{getStepIcon(step.step)}</div>
                            <div className="flex-1 text-left text-sm">
                              <div className="text-[#e7e7e7] font-medium">{step.step || step.name || 'Unknown'}</div>
                              <div className="text-[#666] flex items-center gap-2">
                                <span>{step.model ?? 'N/A'}</span>
                                {step.version && <span className="text-[#555]">v{step.version}</span>}
                                <span>•</span>
                                <span>{stepDuration}ms</span>
                                {step.usingPython && <span className="text-[#4a9eff] text-xs ml-2">🐍 Python ML</span>}
                                {step.fallback && <span className="text-[#ff9f4a] text-xs ml-2">⚠ Fallback</span>}
                              </div>
                            </div>
                            <div className="text-[#666]">
                              {isExpanded ? '▼' : '▶'}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-[#2a2a2a] bg-[#0f0f0f]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                <div>
                                  <div className="text-[#666] mb-1">Metod</div>
                                  <div className="text-[#e7e7e7]">{step.method || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-[#666] mb-1">Starttid</div>
                                  <div className="text-[#e7e7e7]">{step.startTime ? new Date(step.startTime).toLocaleTimeString('sv-SE') : 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-[#666] mb-1">Sluttid</div>
                                  <div className="text-[#e7e7e7]">{step.endTime ? new Date(step.endTime).toLocaleTimeString('sv-SE') : 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-[#666] mb-1">Varaktighet</div>
                                  <div className="text-[#e7e7e7] font-medium">{stepDuration}ms</div>
                                </div>
                              </div>
                              
                              {step.details && (
                                <div className="mt-4">
                                  <div className="text-[#666] mb-2">Detaljer</div>
                                  <pre className="text-xs text-[#999] bg-[#0a0a0a] p-3 rounded overflow-auto max-h-48">
                                    {JSON.stringify(step.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t border-[#2a2a2a] text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-[#666]">
                          Total tid: <span className="text-[#e7e7e7] font-medium">
                            {selectedResponse.pipelineAnalysis.metadata?.totalProcessingTimeMs ?? 
                             selectedResponse.pipelineAnalysis.timeline.reduce((sum, step) => sum + (step.durationMs || step.duration || 0), 0)}ms
                          </span>
                        </div>
                        {selectedResponse.pipelineAnalysis.pythonMLStats && (
                          <div className="text-[#4a9eff] text-xs">
                            🐍 Python ML: {selectedResponse.pipelineAnalysis.pythonMLStats.pythonSteps}/{selectedResponse.pipelineAnalysis.pythonMLStats.totalSteps} steg
                          </div>
                        )}
                      </div>
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

  // Debate mode: Live consensus debate using ConsensusDebateCard
  const renderDebate = () => {
    // Generate a unique question ID from the message timestamp or use a simple hash
    const questionId = latestAiMessage?.timestamp 
      ? `q-${new Date(latestAiMessage.timestamp).getTime()}` 
      : `q-${Date.now()}`;

    return (
      <div className="flex-1 overflow-y-auto pb-40 px-4 md:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-[#666] text-sm uppercase tracking-wide mb-6">LIVE KONSENSUS-DEBATT</div>
          
          {latestAiMessage && latestAiMessage.modelSynthesis && latestAiMessage.responses ? (
            <ConsensusDebateCard
              questionId={questionId}
              question={latestAiMessage.question}
              modelSynthesis={latestAiMessage.modelSynthesis}
              responses={latestAiMessage.responses}
              onDebateComplete={(debate) => {
                console.log('Debate completed:', debate);
              }}
            />
          ) : (
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <p className="text-[#888] text-center">
                Ingen modellsyntes tillgänglig för debatt. Ställ en fråga först.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 300ms ease-out;
        }
        
        .animate-fade-in {
          animation: fadeIn 300ms ease-in-out;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-in-right,
          .animate-fade-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
      
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
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-[#151515] z-50 flex flex-col animate-slide-in-right">
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
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#151515] z-20">
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

      {/* Replay Timeline Modal */}
      {showReplay && replayData && (
        <ReplayTimeline 
          question={replayData.question}
          model={replayData.model}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
}
