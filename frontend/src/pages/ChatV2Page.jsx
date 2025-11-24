import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ConsensusDebateCard from '../components/ConsensusDebateCard';
import NLPProcessingLoader from '../components/NLPProcessingLoader';
import ChangeDetectionPanel from '../components/ChangeDetectionPanel';
import ReplayTimeline from '../components/ReplayTimeline';
import CharacterSelector from '../components/CharacterSelector';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { useAuth } from '../contexts/AuthContext';
import { triggerMicroTrainingAsync } from '../utils/microTraining';

/**
 * ChatV2Page Component - Concept 31 Design
 * Hierarchical layout with complete platform data integration
 * - Premium input field (Concept 21 style)
 * - Sidebar menu navigation
 * - Centered view selector (Översikt | Modeller | Pipeline | Debatt)
 * - 4 view modes with real API integration
 * - OneSeek.AI grayscale brand identity
 */

// Debug flag - set via URL parameter: ?debug=true
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

// Helper function to format text with markdown-like formatting
const formatTextWithMarkdown = (text) => {
  if (!text) return '';
  
  // Fix common encoding issues (UTF-8 characters incorrectly decoded as Latin-1)
  let fixedText = text;
  try {
    // Fix common Swedish character encoding issues
    fixedText = fixedText
      .replace(/Ã¤/g, 'ä')
      .replace(/Ã¥/g, 'å')
      .replace(/Ã¶/g, 'ö')
      .replace(/Ã„/g, 'Ä')
      .replace(/Ã…/g, 'Å')
      .replace(/Ã–/g, 'Ö')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã¨/g, 'è')
      .replace(/Ã /g, 'à');
  } catch (e) {
    console.warn('[ChatV2] Failed to fix encoding:', e);
  }
  
  return fixedText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')  // Italic text
    .replace(/\n/g, '<br/>')  // Line breaks
    .replace(/^- (.+)$/gm, '<div class="ml-4">• $1</div>');  // List items
};

// Helper function to generate block hash (mock implementation for display)
const generateBlockHash = (blockId) => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt((blockId * 7 + i * 13) % chars.length);
  }
  return hash;
};

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
  const [expandedModelDetails, setExpandedModelDetails] = useState({});
  const [selectedPersona, setSelectedPersona] = useState('oneseek-medveten'); // Default persona
  const [characterData, setCharacterData] = useState(null);
  const { isAuthenticated, user } = useAuth();
  
  // Firebase Firestore integration - Track current question's document ID
  const [firebaseDocId, setFirebaseDocId] = useState(null);
  
  // Prevent duplicate submissions in React StrictMode (development)
  // Use location.state?.initialQuestion as the key to track what we've submitted
  const hasSubmittedInitialQuestion = useRef(null);

  // Listen to Firestore document in real-time
  const { data: firestoreData, loading: firestoreLoading, error: firestoreError } = useFirestoreDocument(
    'ai_interactions',
    firebaseDocId
  );

  // Get latest AI message for display
  const latestAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];

  // Handle initial question from LandingPage navigation
  useEffect(() => {
    const currentQuestion = location.state?.initialQuestion;
    
    // Only submit if we have a question and haven't submitted THIS specific question yet
    if (currentQuestion && hasSubmittedInitialQuestion.current !== currentQuestion) {
      hasSubmittedInitialQuestion.current = currentQuestion;
      setQuestion(currentQuestion);
      // Auto-submit the question
      const submitInitialQuestion = async () => {
        const userQuestion = currentQuestion.trim();
        
        // Add user message
        const userMessage = {
          type: 'user',
          content: userQuestion,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([userMessage]);
        setIsLoading(true);

        try {
          // Store question in Firebase and get document ID
          const firebaseResponse = await fetch('/api/firebase/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: userQuestion,
              userId: user?.userId || 'anonymous',
              sessionId: `session-${Date.now()}`
            })
          });
          
          if (firebaseResponse.ok) {
            const firebaseData = await firebaseResponse.json();
            if (firebaseData.success) {
              const docId = firebaseData.docId;
              console.log('[ChatV2] ✅ Question stored in Firebase:', docId);
              
              // Set the document ID to start listening via Firestore hook
              setFirebaseDocId(docId);
              
              // Firebase Functions will trigger and process the question
              // We'll receive updates via the Firestore listener
            } else {
              throw new Error('Failed to store question in Firebase');
            }
          } else {
            throw new Error(`Firebase API error: ${firebaseResponse.status}`);
          }
          
        } catch (err) {
          console.error('[ChatV2] ❌ Error storing question:', err);
          const errorMessage = {
            type: 'error',
            content: err.message || 'Ett fel uppstod vid lagring av frågan.',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        }
      };

      submitInitialQuestion();
      
      // Clear the location state to prevent re-submission on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.initialQuestion]); // Only re-run if the actual question changes

  // Effect to handle Firestore data updates
  useEffect(() => {
    if (!firestoreData) return;

    if (DEBUG_MODE) {
      console.log('[ChatV2] Firestore data updated:', {
        status: firestoreData.status,
        hasRawResponses: !!firestoreData.raw_responses,
        hasProcessedData: !!firestoreData.processed_data,
        processedDataKeys: firestoreData.processed_data ? Object.keys(firestoreData.processed_data) : [],
        rawResponsesLength: firestoreData.raw_responses?.length || 0
      });
    }

    // Process data when:
    // 1. Status is completed or ledger_verified, OR
    // 2. Status is processing BUT we have both raw_responses and processed_data (backend completed but status not updated yet)
    const hasData = firestoreData.raw_responses?.length > 0 && 
                    firestoreData.processed_data && 
                    Object.keys(firestoreData.processed_data).length > 0;
    
    const shouldProcess = firestoreData.status === 'completed' || 
                         firestoreData.status === 'ledger_verified' ||
                         (firestoreData.status === 'processing' && hasData);
    
    if (shouldProcess) {
      if (DEBUG_MODE) {
        console.log('[ChatV2] ✅ Processing Firestore data (status:', firestoreData.status, ', hasData:', hasData, ')');
      }
      // Map Firestore data to AI message format
      const aiMessage = {
        type: 'ai',
        question: firestoreData.question,
        firebaseDocId: firestoreData.id,
        
        // Raw responses from Firestore (stored as array in Firestore)
        responses: Array.isArray(firestoreData.raw_responses) 
          ? firestoreData.raw_responses.map((r, idx) => {
              // Helper function to parse JSON strings
              const parseJsonField = (field, fieldName) => {
                if (!field) return null;
                if (typeof field === 'string' && (field.startsWith('{') || field.startsWith('['))) {
                  try {
                    return JSON.parse(field);
                  } catch (e) {
                    console.warn(`[ChatV2] Failed to parse ${fieldName}:`, e);
                    return null;
                  }
                }
                return field;
              };
              
              // Parse all JSON-stringified fields
              const pipelineAnalysis = parseJsonField(r.pipelineAnalysis, 'pipelineAnalysis');
              const analysis = parseJsonField(r.analysis, 'analysis');
              const enhancedAnalysis = parseJsonField(r.enhancedAnalysis, 'enhancedAnalysis');
              
              // Try multiple sources for agent/service name
              // Debug logging (only when ?debug=true in URL)
              if (DEBUG_MODE) {
                console.log(`[ChatV2] Response ${idx} - Checking agent name sources:`, {
                  'r.service': r.service,
                  'r.service type': typeof r.service,
                  'r.service truthy': !!r.service,
                  'r.service JSON': JSON.stringify(r.service),
                  'r.agent': r.agent,
                  'r.metadata?.model': r.metadata?.model,
                  'r.model_version': r.model_version,
                  'Full r keys': Object.keys(r),
                  'r has service': r.hasOwnProperty('service'),
                  'r.service === undefined': r.service === undefined,
                  'r.service === null': r.service === null,
                  'r.service === ""': r.service === ''
                });
              }
              
              const agentName = r.service || r.agent || r.metadata?.model || r.model_version || 'unknown';
              
              if (DEBUG_MODE) {
                console.log(`[ChatV2] Response ${idx} - Selected agent name: "${agentName}"`);
              }
              
              // Comprehensive debug logging for the first response (only in debug mode)
              if (DEBUG_MODE && idx === 0) {
                console.log('[ChatV2] First raw_response from Firebase:', {
                  service: r.service,
                  agent: r.agent,
                  model_version: r.model_version,
                  has_response_text: !!r.response_text,
                  response_text_length: r.response_text?.length || 0,
                  has_metadata: !!r.metadata,
                  metadata_keys: r.metadata ? Object.keys(r.metadata) : [],
                  metadata_model: r.metadata?.model,
                  has_analysis: !!analysis,
                  has_enhancedAnalysis: !!enhancedAnalysis,
                  has_pipelineAnalysis: !!pipelineAnalysis,
                  all_keys: Object.keys(r)
                });
                console.log('[ChatV2] First raw_response FULL OBJECT:', r);
                console.log('[ChatV2] First raw_response JSON.stringify:', JSON.stringify(r).substring(0, 500));
              }
              
              // Debug log if we're getting unknown (only in debug mode)
              if (DEBUG_MODE && agentName === 'unknown') {
                console.error('[ChatV2] ❌ Unknown agent detected at index', idx, '!');
                console.error('[ChatV2] Full raw_response object:', r);
                console.error('[ChatV2] Field values:', {
                  service: r.service,
                  service_type: typeof r.service,
                  service_stringified: JSON.stringify(r.service),
                  agent: r.agent,
                  model: r.metadata?.model,
                  model_version: r.model_version,
                  availableKeys: Object.keys(r)
                });
              }
              
              return {
                agent: agentName,
                response: r.response_text || r.response || '',
                metadata: r.metadata || {},
                analysis: analysis || {},
                enhancedAnalysis: enhancedAnalysis || null,
                pipelineAnalysis: pipelineAnalysis
              };
            })
          : [],
        
        // Analysis data from Firestore (stored in 'analysis' field)
        modelSynthesis: firestoreData.analysis?.modelSynthesis || null,
        factCheckComparison: firestoreData.analysis?.factCheckComparison || null,
        changeDetection: firestoreData.analysis?.changeDetection || null,
        
        // BERT Summary from Firestore (saved via saveSynthesisData)
        bertSummary: firestoreData.synthesized_summary || null,
        bertMetadata: firestoreData.synthesized_summary_metadata || null,
        metaReview: firestoreData.meta_review || null,
        
        // Processed pipeline data from Firestore
        // Parse JSON strings back to objects (backend serializes complex objects to avoid Firestore nesting limits)
        pipelineData: (() => {
          if (!firestoreData.processed_data) return {};
          
          const parsedData = {};
          Object.entries(firestoreData.processed_data).forEach(([key, value]) => {
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
              try {
                parsedData[key] = JSON.parse(value);
              } catch (e) {
                console.warn(`[ChatV2] Failed to parse ${key}:`, e);
                parsedData[key] = value;
              }
            } else {
              parsedData[key] = value;
            }
          });
          
          return parsedData;
        })(),
        
        // Extract specific fields from parsed pipeline data for direct access
        topics: (() => {
          if (!firestoreData.processed_data?.topics) return null;
          try {
            const topicsData = typeof firestoreData.processed_data.topics === 'string' 
              ? JSON.parse(firestoreData.processed_data.topics)
              : firestoreData.processed_data.topics;
            if (DEBUG_MODE) {
              console.log('[ChatV2] Topics data loaded from Firestore:', topicsData);
            }
            return topicsData;
          } catch (e) {
            console.warn('[ChatV2] Failed to parse topics from Firestore:', e);
            return null;
          }
        })(),
        
        explainability: (() => {
          if (!firestoreData.processed_data?.explainability) return null;
          try {
            return typeof firestoreData.processed_data.explainability === 'string'
              ? JSON.parse(firestoreData.processed_data.explainability)
              : firestoreData.processed_data.explainability;
          } catch (e) {
            console.warn('[ChatV2] Failed to parse explainability from Firestore:', e);
            return null;
          }
        })(),
        
        // Toxicity from biasAnalysis.detoxify
        toxicity: (() => {
          if (!firestoreData.processed_data?.biasAnalysis) return null;
          try {
            const biasData = typeof firestoreData.processed_data.biasAnalysis === 'string'
              ? JSON.parse(firestoreData.processed_data.biasAnalysis)
              : firestoreData.processed_data.biasAnalysis;
            if (DEBUG_MODE) {
              console.log('[ChatV2] Toxicity data loaded from Firestore:', biasData?.detoxify);
            }
            return biasData?.detoxify || null;
          } catch (e) {
            console.warn('[ChatV2] Failed to parse toxicity from Firestore:', e);
            return null;
          }
        })(),
        
        fairness: (() => {
          if (!firestoreData.processed_data?.fairnessAnalysis) return null;
          try {
            return typeof firestoreData.processed_data.fairnessAnalysis === 'string'
              ? JSON.parse(firestoreData.processed_data.fairnessAnalysis)
              : firestoreData.processed_data.fairnessAnalysis;
          } catch (e) {
            console.warn('[ChatV2] Failed to parse fairness from Firestore:', e);
            return null;
          }
        })(),
        
        // Quality metrics from Firestore
        qualityMetrics: firestoreData.quality_metrics || null,
        
        // Ledger blocks
        ledgerBlocks: firestoreData.ledger_blocks || [],
        
        // Pipeline metadata
        pipelineMetadata: firestoreData.pipeline_metadata || null,
        
        timestamp: firestoreData.timestamp?.toDate?.() || new Date(),
      };
      
      // CRITICAL FIX: If responses don't have pipelineAnalysis, populate from processed_data
      // This is the main fix for the "unknown" values in Pipeline view
      if (aiMessage.responses && aiMessage.responses.length > 0) {
        const hasAnyPipeline = aiMessage.responses.some(r => r.pipelineAnalysis);
        
        // Debug logging for agent names (only in debug mode)
        if (DEBUG_MODE) {
          console.log('[ChatV2] Response agents:', aiMessage.responses.map(r => r.agent));
        }
        
        if (!hasAnyPipeline && aiMessage.pipelineData && Object.keys(aiMessage.pipelineData).length > 0) {
          if (DEBUG_MODE) {
            console.log('[ChatV2] Populating pipelineAnalysis from processed_data for all responses');
          }
          
          // Create a complete pipeline analysis object from processed_data
          const sharedPipelineAnalysis = {
            preprocessing: aiMessage.pipelineData.preprocessing || {},
            biasAnalysis: aiMessage.pipelineData.biasAnalysis || {},
            sentenceBiasAnalysis: aiMessage.pipelineData.sentenceBiasAnalysis || {},
            sentimentAnalysis: aiMessage.pipelineData.sentimentAnalysis || {},
            ideologicalClassification: aiMessage.pipelineData.ideologicalClassification || {},
            toneAnalysis: aiMessage.pipelineData.toneAnalysis || {},
            factCheck: aiMessage.pipelineData.factCheck || {},
            enhancedNLP: aiMessage.pipelineData.enhancedNLP || {},
            explainability: aiMessage.pipelineData.explainability || null,
            topics: aiMessage.pipelineData.topics || null,
            fairnessAnalysis: aiMessage.pipelineData.fairnessAnalysis || null,
            fairnessMetrics: aiMessage.pipelineData.fairnessMetrics || null,
            shapExplanations: aiMessage.pipelineData.shapExplanations || null,
            limeExplanations: aiMessage.pipelineData.limeExplanations || null,
            insights: aiMessage.pipelineData.insights || {},
            summary: aiMessage.pipelineData.summary || {},
            timeline: aiMessage.pipelineData.timeline || [],
            pythonMLStats: aiMessage.pipelineData.pythonMLStats || {},
            pipelineConfig: aiMessage.pipelineData.pipelineConfig || {},
            metadata: aiMessage.pipelineData.metadata || {
              totalProcessingTimeMs: firestoreData.pipeline_metadata?.totalProcessingTimeMs || 
                                     firestoreData.processing_times?.total || 0
            }
          };
          
          // Apply this to all responses
          aiMessage.responses = aiMessage.responses.map(r => ({
            ...r,
            pipelineAnalysis: sharedPipelineAnalysis
          }));
          
          if (DEBUG_MODE) {
            console.log('[ChatV2] ✅ Pipeline analysis populated for', aiMessage.responses.length, 'responses');
          }
        } else if (hasAnyPipeline) {
          if (DEBUG_MODE) {
            console.log('[ChatV2] ✅ Pipeline analysis already present in responses');
          }
        } else {
          console.warn('[ChatV2] ⚠️ No pipeline data available - responses will show N/A values');
        }
      }

      // Update messages - replace any existing AI message or add new one
      setMessages(prev => {
        const userMsg = prev.find(m => m.type === 'user');
        return userMsg ? [userMsg, aiMessage] : [aiMessage];
      });
      
      // Trigger micro-training in background (non-blocking)
      if (aiMessage.responses && aiMessage.responses.length > 0) {
        triggerMicroTrainingAsync(
          aiMessage.question,
          aiMessage.responses,
          {
            consensus: aiMessage.metaReview?.consensus,
            bias: aiMessage.pipelineData?.biasAnalysis?.aggregatedScore,
            fairness: aiMessage.fairness?.score,
          }
        );
      }
      
      // Initialize selectedModel with first response's agent name
      if (aiMessage.responses && aiMessage.responses.length > 0) {
        setSelectedModel(aiMessage.responses[0].agent);
      }
      
      setIsLoading(false);
      setViewMode('overview');
      
      console.log('[ChatV2] ✅ AI message updated from Firestore');
    } else if (firestoreData.status === 'error') {
      // Handle error status
      const errorMessage = {
        type: 'error',
        content: firestoreData.errors?.[0]?.message || 'Ett fel uppstod vid bearbetning av frågan.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      
      console.error('[ChatV2] ❌ Error status from Firestore:', firestoreData.errors);
    } else {
      // Still processing without complete data
      console.log('[ChatV2] ⏳ Status:', firestoreData.status, '- waiting for data to complete');
    }
  }, [firestoreData]);

  // Load character data when persona changes
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        const response = await fetch(`/api/chat/characters/${selectedPersona}`);
        if (response.ok) {
          const data = await response.json();
          setCharacterData(data.character);
        }
      } catch (error) {
        console.error('Error loading character data:', error);
      }
    };

    loadCharacterData();
  }, [selectedPersona]);

  const handlePersonaChange = (personaId) => {
    setSelectedPersona(personaId);
  };

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
      // Store question in Firebase and get document ID
      const firebaseResponse = await fetch('/api/firebase/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          userId: user?.userId || 'anonymous',
          sessionId: `session-${Date.now()}`
        })
      });
      
      if (firebaseResponse.ok) {
        const firebaseData = await firebaseResponse.json();
        if (firebaseData.success) {
          const docId = firebaseData.docId;
          console.log('[ChatV2] ✅ Question stored in Firebase:', docId);
          
          // Set the document ID to start listening via Firestore hook
          setFirebaseDocId(docId);
          
          // Firebase Functions will trigger and process the question
          // We'll receive updates via the Firestore listener in the useEffect above
          // NO direct /api/query call - all data comes from Firestore!
        } else {
          throw new Error('Failed to store question in Firebase');
        }
      } else {
        throw new Error(`Firebase API error: ${firebaseResponse.status}`);
      }
      
    } catch (err) {
      console.error('[ChatV2] ❌ Error storing question:', err);
      const errorMessage = {
        type: 'error',
        content: err.message || 'Ett fel uppstod vid lagring av frågan.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Välkommen till OneSeek.AI</h2>
            {characterData && characterData.greeting && (
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6 mb-4 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">
                    {selectedPersona === 'oneseek-expert' ? '👔' : selectedPersona === 'oneseek-vanlig' ? '🎓' : '🧠'}
                  </div>
                  <div className="font-medium text-[#e7e7e7]">{characterData.name}</div>
                </div>
                <p className="text-[#888] whitespace-pre-wrap">{characterData.greeting}</p>
              </div>
            )}
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
              <div className="text-sm text-[#666] leading-relaxed whitespace-pre-wrap" 
                   dangerouslySetInnerHTML={{ 
                     __html: formatTextWithMarkdown(latestAiMessage.bertSummary)
                   }}>
              </div>
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

        {/* Meta-Review Panel (GPT-3.5 Quality Check) */}
        {latestAiMessage.metaReview && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🔍</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Meta-analys (GPT-3.5)</div>
                  <div className="text-sm text-[#666]">Kvalitetskontroll av AI-svar och modellsyntes</div>
                </div>
              </div>
              
              {/* Meta Review Content */}
              <div className="mb-4">
                <div className="text-sm text-[#888] leading-relaxed"
                     dangerouslySetInnerHTML={{
                       __html: formatTextWithMarkdown(
                         typeof latestAiMessage.metaReview === 'string' 
                           ? latestAiMessage.metaReview 
                           : latestAiMessage.metaReview?.summary || 'GPT-3.5 har granskat kvaliteten på alla AI-svar och bedömt deras innehåll, konsekvens och användbarhet.'
                       )
                     }}>
                </div>
              </div>
              
              {/* Recommendations */}
              {latestAiMessage.metaReview.recommendations && latestAiMessage.metaReview.recommendations.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-[#666] uppercase tracking-wide mb-2">Rekommendationer:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#888]">
                    {latestAiMessage.metaReview.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Quality Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-[#1a1a1a] rounded p-3">
                  <div className="text-[#666] mb-1">Kvalitet</div>
                  <div className="text-[#e7e7e7]">
                    {typeof latestAiMessage.metaReview === 'object' ? (latestAiMessage.metaReview.quality || 'Hög') : 'Hög'}
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded p-3">
                  <div className="text-[#666] mb-1">Konsekvens</div>
                  <div className="text-[#e7e7e7]">
                    {typeof latestAiMessage.metaReview === 'object' ? (latestAiMessage.metaReview.consistency || 'God') : 'God'}
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded p-3">
                  <div className="text-[#666] mb-1">Fullständighet</div>
                  <div className="text-[#e7e7e7]">
                    {typeof latestAiMessage.metaReview === 'object' ? (latestAiMessage.metaReview.completeness || 'Fullständig') : 'Fullständig'}
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded p-3">
                  <div className="text-[#666] mb-1">Relevans</div>
                  <div className="text-[#e7e7e7]">
                    {typeof latestAiMessage.metaReview === 'object' ? (latestAiMessage.metaReview.relevance || 'Hög') : 'Hög'}
                  </div>
                </div>
              </div>
              
              {/* Footer Info */}
              <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-[#666]">
                <div>Granskare: GPT-3.5 Turbo</div>
                <div>{latestAiMessage.responses?.length || 0} svar granskade</div>
              </div>
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
              firebaseDocId={latestAiMessage.firebaseDocId}
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

        {/* Explainability Panel (SHAP/LIME) - Always visible in Overview mode */}
        {viewMode === 'overview' && (
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
                      <div className="text-sm text-[#666] mb-2">SHAP Values (Word Importance):</div>
                      {latestAiMessage.explainability.shap.base_sentiment !== undefined && (
                        <div className="mb-3 p-2 bg-[#1a1a1a] rounded text-sm">
                          <span className="text-[#888]">Base Sentiment: </span>
                          <span className="text-[#e7e7e7]">{latestAiMessage.explainability.shap.base_sentiment.toFixed(3)}</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {latestAiMessage.explainability.shap.feature_importance?.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[#e7e7e7] text-sm">{feat.word}</span>
                                <span className={`text-xs ${feat.impact === 'positive' ? 'text-green-400' : feat.impact === 'negative' ? 'text-red-400' : 'text-[#666]'}`}>
                                  {feat.importance > 0 ? '+' : ''}{feat.importance.toFixed(3)}
                                </span>
                              </div>
                              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${feat.impact === 'positive' ? 'bg-green-500' : feat.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'}`}
                                  style={{width: `${Math.min(Math.abs(feat.importance) * 100, 100)}%`}}
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
                      <div className="text-sm text-[#666] mb-2">LIME Explanation (Sentence Contributions):</div>
                      {latestAiMessage.explainability.lime.prediction && (
                        <div className="mb-3 p-2 bg-[#1a1a1a] rounded">
                          <span className="text-[#888] text-sm">Overall Sentiment: </span>
                          <span className={`text-sm font-medium ${
                            latestAiMessage.explainability.lime.prediction.predicted_class === 'positive' ? 'text-green-400' :
                            latestAiMessage.explainability.lime.prediction.predicted_class === 'negative' ? 'text-red-400' :
                            'text-[#e7e7e7]'
                          }`}>
                            {latestAiMessage.explainability.lime.prediction.predicted_class}
                          </span>
                          <span className="text-[#666] text-xs ml-2">
                            ({latestAiMessage.explainability.lime.prediction.sentiment_polarity.toFixed(2)})
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {latestAiMessage.explainability.lime.explanation?.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="bg-[#1a1a1a] rounded p-2">
                            <div className="text-[#e7e7e7] text-sm mb-1">{item.sentence}</div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-[#666]">
                                Contribution: <span className={item.contribution_to_overall > 0 ? 'text-green-400' : 'text-red-400'}>
                                  {item.contribution_to_overall > 0 ? '+' : ''}{item.contribution_to_overall.toFixed(3)}
                                </span>
                              </span>
                              <span className="text-[#666]">
                                Polarity: {item.sentiment_polarity.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )) || <p className="text-[#666] text-sm">No LIME explanation available</p>}
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

        {/* Toxicity Analysis Panel (Detoxify) - Always visible in Overview mode */}
        {viewMode === 'overview' && (
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
                              style={{width: `${Math.min((metric.value || 0) * 100, 100)}%`}}
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

        {/* Topic Modeling Panel (BERTopic/Gensim) - Always visible in Overview mode */}
        {viewMode === 'overview' && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🧠</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Topic Modeling</div>
                  <div className="text-sm text-[#666]">BERTopic & Gensim cluster analysis and dominant themes</div>
                </div>
              </div>
              {/* Display topics from BERTopic, Gensim, or both */}
              {latestAiMessage.topics ? (
                <div className="space-y-6">
                  {/* BERTopic Results */}
                  {latestAiMessage.topics.bertopic && latestAiMessage.topics.bertopic.topics && latestAiMessage.topics.bertopic.topics.length > 0 && (
                    <div>
                      {latestAiMessage.topics.method === 'both' && (
                        <div className="text-[#888] text-sm font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          BERTopic Analysis
                        </div>
                      )}
                      <div className="space-y-3">
                        {latestAiMessage.topics.bertopic.topics.map((topic, idx) => (
                          <div key={`bert-${idx}`} className="bg-[#1a1a1a] rounded p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[#e7e7e7] font-medium">{topic.name || `Topic ${topic.topic_id ?? idx}`}</div>
                                <div className="text-[#666] text-xs">ID: {topic.topic_id ?? idx}</div>
                              </div>
                              {topic.count && (
                                <div className="text-right">
                                  <div className="text-[#888] text-sm">
                                    {topic.count} documents
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gensim Results - from method="both" */}
                  {latestAiMessage.topics.gensim && latestAiMessage.topics.gensim.topics && latestAiMessage.topics.gensim.topics.length > 0 && (
                    <div>
                      {latestAiMessage.topics.method === 'both' && (
                        <div className="text-[#888] text-sm font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Gensim LDA Analysis
                        </div>
                      )}
                      <div className="space-y-3">
                        {latestAiMessage.topics.gensim.topics.map((topic, idx) => (
                          <div key={`gensim-${idx}`} className="bg-[#1a1a1a] rounded p-4">
                            <div className="mb-3">
                              <div className="text-[#e7e7e7] font-medium mb-1">{topic.label || `Topic ${idx}`}</div>
                              <div className="text-[#666] text-xs">ID: {topic.topic_id ?? idx}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {topic.terms?.map((term, tidx) => {
                                // Gensim terms are objects with {word, weight}
                                if (!term) return null;
                                const termText = typeof term === 'string' ? term : term.word;
                                const termWeight = typeof term === 'object' && term !== null ? term.weight : null;
                                return (
                                  <span 
                                    key={tidx} 
                                    className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-xs rounded flex items-center gap-1"
                                    title={termWeight ? `Weight: ${termWeight.toFixed(3)}` : undefined}
                                  >
                                    {termText}
                                    {termWeight && (
                                      <span className="text-[#555] text-[10px]">
                                        {(termWeight * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Legacy Gensim Results - flat structure (for backward compatibility) */}
                  {!latestAiMessage.topics.gensim && !latestAiMessage.topics.bertopic && latestAiMessage.topics.topics && latestAiMessage.topics.topics.length > 0 && (
                    <div>
                      <div className="text-[#888] text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Gensim LDA Analysis
                      </div>
                      <div className="space-y-3">
                        {latestAiMessage.topics.topics.map((topic, idx) => (
                          <div key={`gensim-legacy-${idx}`} className="bg-[#1a1a1a] rounded p-4">
                            <div className="mb-3">
                              <div className="text-[#e7e7e7] font-medium mb-1">{topic.label || `Topic ${idx}`}</div>
                              <div className="text-[#666] text-xs">ID: {topic.topic_id ?? idx}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {topic.terms?.map((term, tidx) => {
                                // Gensim terms are objects with {word, weight}
                                if (!term) return null;
                                const termText = typeof term === 'string' ? term : term.word;
                                const termWeight = typeof term === 'object' && term !== null ? term.weight : null;
                                return (
                                  <span 
                                    key={tidx} 
                                    className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-xs rounded flex items-center gap-1"
                                    title={termWeight ? `Weight: ${termWeight.toFixed(3)}` : undefined}
                                  >
                                    {termText}
                                    {termWeight && (
                                      <span className="text-[#555] text-[10px]">
                                        {(termWeight * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No results message */}
                  {(!latestAiMessage.topics.bertopic || !latestAiMessage.topics.bertopic.topics || latestAiMessage.topics.bertopic.topics.length === 0) &&
                   (!latestAiMessage.topics.gensim || !latestAiMessage.topics.gensim.topics || latestAiMessage.topics.gensim.topics.length === 0) &&
                   (!latestAiMessage.topics.topics || latestAiMessage.topics.topics.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-[#666] text-sm">No topics identified</p>
                      <p className="text-[#555] text-xs mt-1">Text may be too short for topic modeling</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Väntar på topic modeling resultat från backend...</p>
                  <p className="text-[#555] text-xs mt-1">BERTopic och Gensim LDA kör parallellt när Python NLP service är tillgänglig</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bias & Fairness Panel (Fairlearn) - Always visible in Overview mode */}
        {viewMode === 'overview' && (
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
                            style={{width: `${Math.min(latestAiMessage.fairness.demographicParity * 100, 100)}%`}}
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
                            style={{width: `${Math.min(latestAiMessage.fairness.equalizedOdds * 100, 100)}%`}}
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
                            style={{width: `${Math.min(latestAiMessage.fairness.disparateImpact * 100, 100)}%`}}
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
                  <p className="text-[#666] text-sm">Väntar på fairness-analys från backend...</p>
                  <p className="text-[#555] text-xs mt-1">Fairlearn bias metrics körs i ML pipeline när tillgängligt</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fact Checking Panel (Google Fact Check) - Always visible in Overview mode */}
        {viewMode === 'overview' && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">✅</div>
                <div>
                  <div className="font-medium text-[#e7e7e7]">Fact Checking</div>
                  <div className="text-sm text-[#666]">Source verification using Google Fact Check API</div>
                </div>
              </div>
              {/* Use factCheckComparison or bertMetadata for fact checking data */}
              {(latestAiMessage.factCheck || latestAiMessage.factCheckComparison || latestAiMessage.bertMetadata?.factCheck) ? (
                <div className="space-y-4">
                  {/* Show fact check summary from BERT metadata if available */}
                  {latestAiMessage.bertMetadata?.factCheck && (
                    <div className="p-3 bg-[#1a1a1a] rounded mb-4">
                      <div className="text-sm text-[#666] mb-2">Faktakoll-sammanfattning:</div>
                      <div className="text-[#888] text-sm whitespace-pre-wrap" 
                           dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(latestAiMessage.bertMetadata.factCheck) }}>
                      </div>
                    </div>
                  )}
                  
                  {/* Show factCheckComparison data if available */}
                  {latestAiMessage.factCheckComparison && (
                    <div className="space-y-3">
                      {latestAiMessage.factCheckComparison.claims && latestAiMessage.factCheckComparison.claims.length > 0 && (
                        <div>
                          <div className="text-sm text-[#666] mb-2">Verifierade påståenden:</div>
                          <div className="space-y-2">
                            {latestAiMessage.factCheckComparison.claims.map((claim, idx) => (
                              <div key={idx} className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]">
                                <div className="text-[#e7e7e7] text-sm mb-2">{claim.text}</div>
                                {claim.sources && claim.sources.length > 0 && (
                                  <div className="text-xs text-[#666]">
                                    Källor: {claim.sources.map((s, si) => (
                                      <a key={si} href={s.url} target="_blank" rel="noopener noreferrer" 
                                         className="text-[#4a9eff] hover:underline ml-1">
                                        [{si + 1}]
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show factCheck data if available (from new ML endpoints) */}
                  {latestAiMessage.factCheck && (
                    <>
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
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#666] text-sm">Fact checking data is available from backend API</p>
                  <p className="text-[#555] text-xs mt-1">✅ Google Fact Check API is being queried - check bertMetadata for fact check summary</p>
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
    const toggleModelDetails = (idx, section) => {
      setExpandedModelDetails(prev => ({
        ...prev,
        [`${idx}-${section}`]: !prev[`${idx}-${section}`]
      }));
    };

    const isExpanded = (idx, section) => expandedModelDetails[`${idx}-${section}`] || false;

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
                    <div>
                      <div className="font-medium text-[#e7e7e7] text-lg">{response.agent || `Modell ${idx + 1}`}</div>
                      <div className="text-xs text-[#666] mt-1">
                        Version: {response.metadata?.model || response.metadata?.version || 'N/A'}
                      </div>
                    </div>
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

                  {/* Provenance Information */}
                  <div className="mt-4 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                    <div className="text-xs text-[#666] mb-2 font-medium">Provenance & Traceability</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[#666]">Endpoint:</span>
                        <div className="text-[#888] truncate" title={response.metadata?.endpoint || 'N/A'}>
                          {response.metadata?.endpoint || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#666]">Request ID:</span>
                        <div className="text-[#888] font-mono truncate" title={response.metadata?.request_id || 'N/A'}>
                          {response.metadata?.request_id || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#666]">Timestamp:</span>
                        <div className="text-[#888]">
                          {response.metadata?.timestamp ? new Date(response.metadata.timestamp).toLocaleString('sv-SE') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ledger Status */}
                  {latestAiMessage.ledgerBlocks && latestAiMessage.ledgerBlocks.length > 0 && (
                    <div className="mt-3 p-3 bg-green-900/10 rounded border border-green-900/30">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400">🔒</span>
                        <span className="text-green-400 font-medium">Ledger Verified</span>
                        <span className="text-[#666]">•</span>
                        <span className="text-[#888]">
                          {latestAiMessage.ledgerBlocks.length} block{latestAiMessage.ledgerBlocks.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Comprehensive Metrics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                    <div>
                      <div className="text-[#666] mb-2">Bias</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-[#888] h-full" style={{width: `${(response.analysis?.bias?.biasScore ?? 0) * 10}%`}}></div>
                      </div>
                      <div className="text-[#888]">{(response.analysis?.bias?.biasScore ?? 0).toFixed(1)}/10</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-2">Sentiment</div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                        <div className="bg-green-500 h-full" style={{width: `${(response.pipelineAnalysis?.sentimentAnalysis?.vaderSentiment?.positive ?? 0) * 100}%`}}></div>
                      </div>
                      <div className="text-[#888]">
                        {response.pipelineAnalysis?.sentimentAnalysis?.overallTone || 
                         response.pipelineAnalysis?.sentimentAnalysis?.vaderSentiment?.classification || 'N/A'}
                      </div>
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

                {/* Expandable: Raw Response Data */}
                <div className="border-b border-[#2a2a2a]">
                  <button
                    onClick={() => toggleModelDetails(idx, 'raw')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div>
                        <div className="text-[#e7e7e7] font-medium">Raw Model Response</div>
                        <div className="text-xs text-[#666]">Original unprocessed response from the AI model</div>
                      </div>
                    </div>
                    <span className="text-[#666]">{isExpanded(idx, 'raw') ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded(idx, 'raw') && (
                    <div className="px-6 pb-6 bg-[#0f0f0f]">
                      <div className="text-[#888] leading-relaxed whitespace-pre-wrap p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a] max-h-96 overflow-y-auto" 
                           dangerouslySetInnerHTML={{ 
                             __html: formatTextWithMarkdown(response.response || response.text || 'Inget svar tillgängligt')
                           }}>
                      </div>
                      <div className="mt-3 text-xs text-[#666]">
                        Length: {(response.response || response.text || '').length} characters
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable: Comprehensive Metrics */}
                <div className="border-b border-[#2a2a2a]">
                  <button
                    onClick={() => toggleModelDetails(idx, 'metrics')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="text-[#e7e7e7] font-medium">Comprehensive Metrics</div>
                        <div className="text-xs text-[#666]">Sentiment, Toxicity, Fairness, Consensus, and Explainability</div>
                      </div>
                    </div>
                    <span className="text-[#666]">{isExpanded(idx, 'metrics') ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded(idx, 'metrics') && (
                    <div className="px-6 pb-6 bg-[#0f0f0f] space-y-6">
                      {/* Sentiment Analysis */}
                      {response.pipelineAnalysis?.sentimentAnalysis && (
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <div className="text-sm text-[#e7e7e7] font-medium mb-3">Sentiment Analysis</div>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <div className="text-[#666] mb-1">Overall Tone</div>
                              <div className="text-[#e7e7e7] capitalize">
                                {response.pipelineAnalysis.sentimentAnalysis.overallTone || 
                                 response.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.classification || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#666] mb-1">Polarity Score</div>
                              <div className="text-[#e7e7e7]">
                                {response.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.score?.toFixed(2) || 
                                 response.pipelineAnalysis.sentimentAnalysis.score?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#666] mb-1">Intensity</div>
                              <div className="text-[#e7e7e7]">
                                {response.pipelineAnalysis.sentimentAnalysis.vaderSentiment?.comparative?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Toxicity Analysis */}
                      {(latestAiMessage.toxicity || response.pipelineAnalysis?.biasAnalysis?.detoxify) && (
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <div className="text-sm text-[#e7e7e7] font-medium mb-3">Toxicity Analysis (Detoxify)</div>
                          <div className="space-y-2">
                            {(() => {
                              const toxicityData = latestAiMessage.toxicity || response.pipelineAnalysis?.biasAnalysis?.detoxify || {};
                              return ['toxicity', 'severe_toxicity', 'obscene', 'threat', 'insult', 'identity_attack'].map(metric => (
                                <div key={metric} className="flex items-center gap-3">
                                  <span className="text-[#666] text-xs w-32 capitalize">{metric.replace('_', ' ')}</span>
                                  <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        (toxicityData[metric] || 0) > 0.7 ? 'bg-red-500' :
                                        (toxicityData[metric] || 0) > 0.4 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{width: `${Math.min((toxicityData[metric] || 0) * 100, 100)}%`}}
                                    ></div>
                                  </div>
                                  <span className="text-[#888] text-xs w-12 text-right">
                                    {((toxicityData[metric] || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Fairness Metrics */}
                      {latestAiMessage.fairness && (
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <div className="text-sm text-[#e7e7e7] font-medium mb-3">Fairness Analysis</div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {latestAiMessage.fairness.demographicParity !== undefined && (
                              <div>
                                <div className="text-[#666] mb-1">Demographic Parity</div>
                                <div className="text-[#e7e7e7]">
                                  {(latestAiMessage.fairness.demographicParity * 100).toFixed(1)}%
                                </div>
                              </div>
                            )}
                            {latestAiMessage.fairness.equalizedOdds !== undefined && (
                              <div>
                                <div className="text-[#666] mb-1">Equalized Odds</div>
                                <div className="text-[#e7e7e7]">
                                  {(latestAiMessage.fairness.equalizedOdds * 100).toFixed(1)}%
                                </div>
                              </div>
                            )}
                            {latestAiMessage.fairness.disparateImpact !== undefined && (
                              <div>
                                <div className="text-[#666] mb-1">Disparate Impact</div>
                                <div className="text-[#e7e7e7]">
                                  {latestAiMessage.fairness.disparateImpact.toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Consensus Contribution */}
                      {latestAiMessage.modelSynthesis?.consensusIndex !== undefined && (
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <div className="text-sm text-[#e7e7e7] font-medium mb-3">Consensus Metrics</div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="text-[#666] mb-1">Consensus Index</div>
                              <div className="text-[#e7e7e7]">
                                {(latestAiMessage.modelSynthesis.consensusIndex * 100).toFixed(0)}%
                              </div>
                            </div>
                            {latestAiMessage.modelSynthesis.divergenceMeasure !== undefined && (
                              <div>
                                <div className="text-[#666] mb-1">Divergence</div>
                                <div className="text-[#e7e7e7]">
                                  {(latestAiMessage.modelSynthesis.divergenceMeasure * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Explainability */}
                      {latestAiMessage.explainability && (
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <div className="text-sm text-[#e7e7e7] font-medium mb-3">Explainability (SHAP/LIME)</div>
                          {latestAiMessage.explainability.shap?.feature_importance && (
                            <div className="space-y-2">
                              <div className="text-xs text-[#666] mb-2">Top Contributing Features:</div>
                              {latestAiMessage.explainability.shap.feature_importance.slice(0, 5).map((feat, fidx) => (
                                <div key={fidx} className="flex items-center gap-3">
                                  <span className="text-[#888] text-xs w-24 truncate">{feat.word}</span>
                                  <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${feat.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                                      style={{width: `${Math.min(Math.abs(feat.importance) * 100, 100)}%`}}
                                    ></div>
                                  </div>
                                  <span className="text-[#888] text-xs w-12 text-right">
                                    {feat.importance > 0 ? '+' : ''}{feat.importance.toFixed(3)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expandable: Processed Analysis Details */}
                <div className="border-b border-[#2a2a2a]">
                  <button
                    onClick={() => toggleModelDetails(idx, 'analysis')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🔬</span>
                      <div>
                        <div className="text-[#e7e7e7] font-medium">Processed Analysis Details</div>
                        <div className="text-xs text-[#666]">Tone, emotion, intent, entities, and main points</div>
                      </div>
                    </div>
                    <span className="text-[#666]">{isExpanded(idx, 'analysis') ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded(idx, 'analysis') && (
                    <div className="px-6 pb-6 bg-[#0f0f0f]">
                      {/* Emotion/Tone/Intent */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                        <div className="bg-[#0a0a0a] rounded p-3 border border-[#2a2a2a]">
                          <div className="text-[#666] mb-1">Emotion</div>
                          <div className="text-[#e7e7e7]">
                            {response.enhancedAnalysis?.emotion?.primary || response.analysis?.tone?.primary || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-[#0a0a0a] rounded p-3 border border-[#2a2a2a]">
                          <div className="text-[#666] mb-1">Ton</div>
                          <div className="text-[#e7e7e7]">
                            {response.analysis?.tone?.description || response.analysis?.tone?.primary || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-[#0a0a0a] rounded p-3 border border-[#2a2a2a]">
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
                              <div key={pidx} className="flex items-start gap-2 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                                <span className="text-[#666] mt-0.5">{pidx + 1}.</span>
                                <span className="text-[#888] whitespace-pre-wrap" 
                                      dangerouslySetInnerHTML={{ __html: formatTextWithMarkdown(point) }}>
                                </span>
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
                            {response.enhancedAnalysis.entities.entities.slice(0, 12).map((entity, eidx) => {
                              const text = entity.text || entity.word || entity.entity || entity;
                              const label = entity.label || entity.entity_group || entity.type || '';
                              return (
                                <span key={eidx} className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-sm rounded border border-[#2a2a2a]">
                                  {typeof text === 'string' ? text : JSON.stringify(text)}
                                  {label && ` (${label})`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Identified Entities - Alternative structure */}
                      {response.entities && response.entities.length > 0 && !response.enhancedAnalysis?.entities?.entities && (
                        <div className="mt-4">
                          <div className="text-sm text-[#666] mb-2">Identifierade entiteter:</div>
                          <div className="flex flex-wrap gap-2">
                            {response.entities.map((entity, i) => {
                              const text = typeof entity === 'object' ? (entity.text || entity.word || entity.entity) : entity;
                              const label = typeof entity === 'object' ? (entity.label || entity.entity_group || entity.type) : '';
                              return (
                                <span key={i} className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-sm rounded border border-[#2a2a2a]">
                                  {text || 'N/A'}
                                  {label && ` (${label})`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expandable: Processing Time Breakdown */}
                <div className="border-b border-[#2a2a2a]">
                  <button
                    onClick={() => toggleModelDetails(idx, 'processing')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⏱️</span>
                      <div>
                        <div className="text-[#e7e7e7] font-medium">Processing Time Breakdown</div>
                        <div className="text-xs text-[#666]">
                          Total: {response.metadata?.responseTimeMs || 0}ms
                        </div>
                      </div>
                    </div>
                    <span className="text-[#666]">{isExpanded(idx, 'processing') ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded(idx, 'processing') && (
                    <div className="px-6 pb-6 bg-[#0f0f0f]">
                      {response.pipelineAnalysis?.timeline && response.pipelineAnalysis.timeline.length > 0 ? (
                        <div className="space-y-2">
                          {response.pipelineAnalysis.timeline.map((step, sidx) => (
                            <div key={sidx} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                              <div className="flex-1">
                                <div className="text-[#e7e7e7] text-sm">{step.step || step.name || 'Unknown'}</div>
                                <div className="text-xs text-[#666]">{step.model || 'N/A'}</div>
                              </div>
                              <div className="text-[#888] text-sm font-mono">
                                {step.durationMs || step.duration || 0}ms
                              </div>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-sm">
                            <span className="text-[#666]">Total Processing Time:</span>
                            <span className="text-[#e7e7e7] font-medium">
                              {response.pipelineAnalysis.metadata?.totalProcessingTimeMs || 
                               response.metadata?.responseTimeMs || 0}ms
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[#666]">
                          No detailed processing timeline available
                        </div>
                      )}
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
              
              {/* Pipeline Metadata & Overview */}
              {selectedResponse.pipelineAnalysis.metadata && (
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">⚙️</div>
                    <div>
                      <div className="font-medium text-[#e7e7e7]">Pipeline Metadata</div>
                      <div className="text-sm text-[#666]">Processing information and provenance</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Total Processing Time</div>
                      <div className="text-[#e7e7e7] font-medium">
                        {selectedResponse.pipelineAnalysis.metadata.totalProcessingTimeMs 
                          ? `${selectedResponse.pipelineAnalysis.metadata.totalProcessingTimeMs}ms`
                          : (latestAiMessage.pipelineMetadata?.totalProcessingTimeMs 
                            ? `${latestAiMessage.pipelineMetadata.totalProcessingTimeMs}ms`
                            : 'N/A')}
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Pipeline Version</div>
                      <div className="text-[#e7e7e7] font-medium">
                        {selectedResponse.pipelineAnalysis.pipelineConfig?.version || 
                         latestAiMessage.pipelineMetadata?.pipeline_version || '1.0.0'}
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Analysis Steps</div>
                      <div className="text-[#e7e7e7] font-medium">
                        {selectedResponse.pipelineAnalysis.timeline?.length || 0} steps
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-3">
                      <div className="text-[#666] mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          latestAiMessage.pipelineMetadata?.status === 'completed' || 
                          latestAiMessage.pipelineMetadata?.status === 'ledger_verified'
                            ? 'bg-green-500'
                            : latestAiMessage.pipelineMetadata?.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-[#e7e7e7] font-medium capitalize">
                          {latestAiMessage.pipelineMetadata?.status || 'completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Python ML Stats */}
                  {selectedResponse.pipelineAnalysis.pythonMLStats && Object.keys(selectedResponse.pipelineAnalysis.pythonMLStats).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="text-sm text-[#666] mb-3">Python ML Services</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-[#666] mb-1">Python Steps</div>
                          <div className="text-[#e7e7e7]">
                            {selectedResponse.pipelineAnalysis.pythonMLStats.pythonSteps || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#666] mb-1">JavaScript Steps</div>
                          <div className="text-[#e7e7e7]">
                            {selectedResponse.pipelineAnalysis.pythonMLStats.javascriptSteps || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#666] mb-1">Total Steps</div>
                          <div className="text-[#e7e7e7]">
                            {selectedResponse.pipelineAnalysis.pythonMLStats.totalSteps || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#666] mb-1">Tools Used</div>
                          <div className="text-[#e7e7e7]">
                            {selectedResponse.pipelineAnalysis.pythonMLStats.toolsUsed?.length || 0}
                          </div>
                        </div>
                      </div>
                      {selectedResponse.pipelineAnalysis.pythonMLStats.toolsUsed && 
                       selectedResponse.pipelineAnalysis.pythonMLStats.toolsUsed.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedResponse.pipelineAnalysis.pythonMLStats.toolsUsed.map((tool, idx) => (
                            <span key={idx} className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-xs rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Quality Metrics */}
                  {latestAiMessage.qualityMetrics && Object.keys(latestAiMessage.qualityMetrics).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="text-sm text-[#666] mb-3">Quality Metrics</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {Object.entries(latestAiMessage.qualityMetrics).map(([key, value]) => {
                          // Handle different value types
                          let displayValue;
                          if (typeof value === 'number') {
                            displayValue = value.toFixed(2);
                          } else if (typeof value === 'object' && value !== null) {
                            // Handle consensus object which has overallConsensus
                            if (key === 'consensus' && value.overallConsensus !== undefined) {
                              displayValue = `${value.overallConsensus}%`;
                            } else if (value.overallConsensus !== undefined) {
                              displayValue = `${value.overallConsensus}%`;
                            } else {
                              // For other objects, try to stringify them nicely
                              displayValue = JSON.stringify(value);
                            }
                          } else {
                            displayValue = String(value);
                          }
                          
                          return (
                            <div key={key}>
                              <div className="text-[#666] mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                              <div className="text-[#e7e7e7]">
                                {displayValue}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Ledger Verification */}
                  {latestAiMessage.ledgerBlocks && latestAiMessage.ledgerBlocks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="text-sm text-[#666] mb-3 flex items-center gap-2">
                        <span>🔒</span>
                        <span>Ledger Verification</span>
                      </div>
                      
                      {/* Live Animation - Verification in Progress */}
                      <div className="mb-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative w-8 h-8">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                            <div className="relative w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                              <span className="text-green-400 text-lg">✓</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-green-400 font-medium">
                              Verifierad med {latestAiMessage.ledgerBlocks.length} ledger block{latestAiMessage.ledgerBlocks.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-[#666] mt-1">
                              All data är kryptografiskt säkrad och immutabel
                            </div>
                          </div>
                        </div>
                        
                        {/* Block Verification Steps */}
                        <div className="space-y-2">
                          {latestAiMessage.ledgerBlocks.map((blockId, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 p-2 bg-[#151515] rounded border border-[#2a2a2a] animate-fade-in"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              <span className="text-green-400 text-sm">✓</span>
                              <div className="flex-1">
                                <div className="text-sm text-[#e7e7e7]">Block #{blockId}</div>
                                <div className="text-xs text-[#666]">
                                  Hash: {generateBlockHash(blockId).substring(0, 16)}...
                                </div>
                              </div>
                              <div className="text-xs text-[#888] px-2 py-1 bg-[#0a0a0a] rounded">
                                Verified
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* View in Ledger Button */}
                        <button
                          onClick={() => {
                            const firebaseDocId = latestAiMessage.firebaseDocId;
                            if (firebaseDocId) {
                              window.location.href = `/ledger?doc=${firebaseDocId}`;
                            }
                          }}
                          className="mt-4 w-full px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <span>🔗</span>
                          <span>Visa fullständig ledger</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
                              
                              {/* Enhanced visualization for specific services */}
                              {(step.step === 'gensim_topics' || step.step === 'bertopic_modeling') && step.output && (
                                <div className="mt-4 p-4 bg-[#0a0a0a] rounded">
                                  <div className="text-[#666] mb-3 font-medium">📊 Topic Analysis Results</div>
                                  {step.output.topics && step.output.topics.length > 0 ? (
                                    <div className="space-y-3">
                                      {step.output.topics.slice(0, 5).map((topic, tidx) => (
                                        <div key={tidx} className="border border-[#2a2a2a] rounded p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[#e7e7e7] font-medium">
                                              {topic.label || topic.topic || `Topic ${tidx + 1}`}
                                            </span>
                                            {topic.probability && (
                                              <span className="text-[#888] text-xs">
                                                {(topic.probability * 100).toFixed(1)}%
                                              </span>
                                            )}
                                          </div>
                                          {topic.terms && topic.terms.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {topic.terms.slice(0, 8).map((term, termIdx) => (
                                                <span key={termIdx} className="px-2 py-1 bg-[#1a1a1a] text-[#888] text-xs rounded">
                                                  {typeof term === 'string' ? term : term.word || term.term}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          {topic.coherence && (
                                            <div className="mt-2 text-xs text-[#666]">
                                              Coherence: {topic.coherence.toFixed(3)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {step.output.topics.length > 5 && (
                                        <div className="text-center text-xs text-[#666]">
                                          +{step.output.topics.length - 5} fler topics
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[#666] text-sm">No topics extracted</div>
                                  )}
                                  {step.output.method && (
                                    <div className="mt-3 text-xs text-[#666]">
                                      Method: {step.output.method} {step.output.model && `(${step.output.model})`}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced visualization for SHAP/LIME explainability */}
                              {(step.step === 'shap_explainability' || step.step === 'lime_explanation') && step.output && (
                                <div className="mt-4 p-4 bg-[#0a0a0a] rounded">
                                  <div className="text-[#666] mb-3 font-medium">🔍 Feature Importance</div>
                                  {step.output.topFeatures && step.output.topFeatures.length > 0 ? (
                                    <div className="space-y-2">
                                      {step.output.topFeatures.slice(0, 10).map((feat, fidx) => (
                                        <div key={fidx} className="flex items-center gap-3">
                                          <span className="text-[#888] text-xs w-32 truncate">{feat.feature || feat.word}</span>
                                          <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${feat.contribution > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                              style={{width: `${Math.min(Math.abs(feat.contribution || feat.weight || 0) * 100, 100)}%`}}
                                            ></div>
                                          </div>
                                          <span className="text-[#888] text-xs w-16 text-right">
                                            {(feat.contribution || feat.weight || 0).toFixed(3)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[#666] text-sm">No feature importance data</div>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced visualization for toxicity */}
                              {step.step === 'detoxify_toxicity' && step.output && (
                                <div className="mt-4 p-4 bg-[#0a0a0a] rounded">
                                  <div className="text-[#666] mb-3 font-medium">🛡️ Toxicity Scores</div>
                                  <div className="space-y-2">
                                    {Object.entries(step.output).filter(([key]) => 
                                      !['timestamp', 'model', 'version'].includes(key)
                                    ).map(([metric, value]) => (
                                      <div key={metric} className="flex items-center gap-3">
                                        <span className="text-[#888] text-xs w-32 capitalize">
                                          {metric.replace('_', ' ')}
                                        </span>
                                        <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full ${
                                              value > 0.7 ? 'bg-red-500' :
                                              value > 0.4 ? 'bg-yellow-500' :
                                              'bg-green-500'
                                            }`}
                                            style={{width: `${Math.min((value || 0) * 100, 100)}%`}}
                                          ></div>
                                        </div>
                                        <span className="text-[#888] text-xs w-16 text-right">
                                          {((value || 0) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {step.details && (
                                <div className="mt-4">
                                  <div className="text-[#666] mb-2">Rådata (JSON)</div>
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
                            {(() => {
                              // Try multiple sources for total processing time
                              const metadataTime = selectedResponse.pipelineAnalysis.metadata?.totalProcessingTimeMs;
                              const timelineSum = selectedResponse.pipelineAnalysis.timeline?.reduce((sum, step) => sum + (step.durationMs || step.duration || 0), 0);
                              const pipelineMetadataTime = latestAiMessage.pipelineMetadata?.totalProcessingTimeMs;
                              const processingTimesTotal = latestAiMessage.pipelineData?.metadata?.totalDurationMs;
                              
                              const totalTime = metadataTime || timelineSum || pipelineMetadataTime || processingTimesTotal || 0;
                              return `${totalTime}ms`;
                            })()}
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
          
          {/* No Pipeline Data Available */}
          {selectedResponse && !selectedResponse.pipelineAnalysis && (
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-3xl mx-auto mb-4">
                  ⚠️
                </div>
                <h3 className="text-lg font-medium text-[#e7e7e7] mb-2">Pipeline Data Not Available</h3>
                <p className="text-[#888] mb-4">
                  Pipeline analysis data is not available for this response. This may occur if:
                </p>
                <ul className="text-left text-[#888] text-sm space-y-2 max-w-md mx-auto mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#666] mt-1">•</span>
                    <span>The question was processed before pipeline analysis was implemented</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#666] mt-1">•</span>
                    <span>The backend analysis pipeline encountered an error</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#666] mt-1">•</span>
                    <span>Firebase data was not fully synced</span>
                  </li>
                </ul>
                <div className="text-sm text-[#666]">
                  Firebase Doc ID: <code className="px-2 py-1 bg-[#0a0a0a] rounded">{latestAiMessage.firebaseDocId || 'N/A'}</code>
                </div>
                <div className="text-sm text-[#666] mt-2">
                  Status: <code className="px-2 py-1 bg-[#0a0a0a] rounded">{latestAiMessage.pipelineMetadata?.status || 'unknown'}</code>
                </div>
                {latestAiMessage.pipelineData && Object.keys(latestAiMessage.pipelineData).length > 0 && (
                  <div className="mt-4 p-3 bg-[#1a1a1a] rounded text-left">
                    <div className="text-sm text-[#888] mb-2">Available pipeline data keys:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(latestAiMessage.pipelineData).map((key, idx) => (
                        <span key={idx} className="px-2 py-1 bg-[#0a0a0a] text-[#666] text-xs rounded">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6 space-y-4">
          {/* Character Selector */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <CharacterSelector 
                selectedPersona={selectedPersona}
                onPersonaChange={handlePersonaChange}
              />
            </div>
            {characterData && (
              <div className="ml-4 text-sm text-[#666]">
                {characterData.description}
              </div>
            )}
          </div>
          
          {/* Question Input */}
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
                {isAuthenticated && (
                  <a href="/dashboard" className="block px-4 py-3 text-[#888] hover:bg-[#151515] hover:text-[#e7e7e7] rounded transition-colors">
                    📊 Dashboard
                  </a>
                )}
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
