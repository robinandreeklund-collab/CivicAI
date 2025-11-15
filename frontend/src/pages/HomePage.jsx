import { useState, useRef, useEffect } from 'react';
import TimelineNavigator from '../components/TimelineNavigator';
import RichContentCard from '../components/RichContentCard';
import QuestionInput from '../components/QuestionInput';
import ModelDivergencePanel from '../components/ModelDivergencePanel';
import ModelPerspectiveCard from '../components/ModelPerspectiveCard';
import PipelineAnalysisPanel from '../components/PipelineAnalysisPanel';

/**
 * HomePage Component
 * Main chat interface for OneSeek.AI with Timeline Navigator (Concept 3)
 * Clean, minimalist design with card stack navigation
 */
export default function HomePage({ onAiMessageUpdate }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [exploredSections, setExploredSections] = useState(new Set());
  const chatEndRef = useRef(null);

  // AI Services configuration
  const [aiServices, setAiServices] = useState([
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5',
      description: 'Fast and efficient',
      icon: '🤖',
      iconBg: 'bg-civic-gray-600/20',
      enabled: true,
    },
    {
      id: 'gemini',
      name: 'Gemini',
      description: 'Google\'s AI model',
      icon: '✨',
      iconBg: 'bg-civic-gray-700/20',
      enabled: true,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Technical precision',
      icon: '🧠',
      iconBg: 'bg-civic-gray-500/20',
      enabled: true,
    },
    {
      id: 'grok',
      name: 'Grok',
      description: 'Witty and insightful',
      icon: '⚡',
      iconBg: 'bg-civic-gray-600/20',
      enabled: true,
    },
    {
      id: 'qwen',
      name: 'Qwen',
      description: 'Balanced and comprehensive',
      icon: '🌟',
      iconBg: 'bg-civic-gray-700/20',
      enabled: true,
    },
  ]);

  // Track section exploration
  useEffect(() => {
    if (activeSection) {
      setExploredSections(prev => new Set([...prev, activeSection]));
    }
  }, [activeSection]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    scrollToSection(sectionId);
  };

  const handleServiceToggle = (serviceId) => {
    setAiServices(services => 
      services.map(s => 
        s.id === serviceId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleSubmitQuestion = async (questionText) => {
    // If called from form (old way), extract from state
    // If called from QuestionInput (new way), use parameter
    const userQuestion = typeof questionText === 'string' ? questionText : question;
    
    if (!userQuestion.trim() || isLoading) return;

    const enabledServices = aiServices.filter(s => s.enabled);
    if (enabledServices.length === 0) {
      alert('Vänligen aktivera minst en AI-tjänst');
      return;
    }

    const trimmedQuestion = userQuestion.trim();
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: trimmedQuestion,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuestion(''); // Clear old state if used
    setIsLoading(true);

    try {
      // Call backend API with enabled services
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: trimmedQuestion,
          services: enabledServices.map(s => s.id)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI responses to chat
      const aiMessage = {
        type: 'ai',
        question: trimmedQuestion,
        responses: data.responses || [],
        synthesizedSummary: data.synthesizedSummary || null,
        synthesizedSummaryMetadata: data.synthesizedSummaryMetadata || null,
        metaReview: data.metaReview || null,
        factCheckComparison: data.factCheckComparison || null,
        modelSynthesis: data.modelSynthesis || null,
        toneAnalysis: data.toneAnalysis || null,
        biasDetection: data.biasDetection || null,
        bertSummary: data.bertSummary || null,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Set first section as active
      if (data.responses && data.responses.length > 0) {
        setActiveSection('best-answer');
      }
      
      // Update parent with last AI message for export panel
      if (onAiMessageUpdate) {
        onAiMessageUpdate(aiMessage);
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

  // Build timeline sections from latest AI message
  const buildTimelineSections = (aiMessage) => {
    if (!aiMessage || aiMessage.type !== 'ai') return [];

    const sections = [];

    // Processing Section
    sections.push({
      title: 'Processering',
      group: 'processing',
      items: [
        {
          id: 'best-answer',
          title: 'Bästa svar',
          meta: 'Utvald rekommendation'
        },
        {
          id: 'bert-summary',
          title: 'BERT-sammanfattning',
          meta: 'AI-genererad sammanfattning'
        }
      ]
    });

    // AI Responses Section
    if (aiMessage.responses && aiMessage.responses.length > 0) {
      sections.push({
        title: 'AI-svar',
        group: 'aiResponses',
        items: aiMessage.responses.map((resp, idx) => ({
          id: `ai-${resp.agent || idx}`,
          title: resp.metadata?.model || resp.agent || `AI ${idx + 1}`,
          meta: resp.pipelineAnalysis 
            ? 'Med pipeline-analys' 
            : (resp.analysis?.confidence 
                ? `${Math.round(resp.analysis.confidence * 100)}% säkerhet` 
                : 'Fullständigt svar')
        }))
      });
    }

    // Analysis Section
    const analysisItems = [];
    if (aiMessage.toneAnalysis) {
      analysisItems.push({
        id: 'tone-analysis',
        title: 'Tonanalys',
        meta: 'Sentiment & språkton'
      });
    }
    if (aiMessage.biasDetection) {
      analysisItems.push({
        id: 'bias-detection',
        title: 'Bias-detektion',
        meta: 'Förutfattade meningar'
      });
    }
    if (aiMessage.metaReview) {
      analysisItems.push({
        id: 'meta-review',
        title: 'GPT Metagranskning',
        meta: 'Kvalitetskontroll'
      });
    }
    if (aiMessage.factCheckComparison) {
      analysisItems.push({
        id: 'fact-check',
        title: 'Tavily Faktakoll',
        meta: 'Verifiering av fakta'
      });
    }
    if (aiMessage.modelSynthesis) {
      analysisItems.push({
        id: 'model-synthesis',
        title: 'Modellsyntes',
        meta: 'Jämförelse mellan AI-modeller'
      });
    }

    if (analysisItems.length > 0) {
      sections.push({
        title: 'Analyser',
        group: 'analysis',
        items: analysisItems
      });
    }

    return sections;
  };

  const latestAiMessage = messages.filter(m => m.type === 'ai').pop();
  const timelineSections = buildTimelineSections(latestAiMessage);

  // Render content based on active section
  const renderContent = (aiMessage, sectionId) => {
    if (!aiMessage) return null;

    switch (sectionId) {
      case 'best-answer':
        const bestResponse = aiMessage.responses?.[0];
        return bestResponse ? (
          <RichContentCard
            badge={{ text: 'Bästa svar', icon: '⭐', primary: true }}
            title={`${bestResponse.metadata?.model || bestResponse.agent} Rekommendation`}
            content={
              <div className="space-y-3">
                {bestResponse.response || bestResponse.content || 'Inget svar tillgängligt'}
              </div>
            }
            metadata={[
              { label: 'Modell', value: bestResponse.metadata?.model || bestResponse.agent || 'N/A' },
              { label: 'Svarstid', value: `${bestResponse.metadata?.responseTime || 0}ms` },
              { label: 'Tokens', value: bestResponse.metadata?.tokens || 'N/A' },
              { label: 'Säkerhet', value: bestResponse.analysis?.confidence ? `${Math.round(bestResponse.analysis.confidence * 100)}%` : 'N/A' },
              { label: 'Tonalitet', value: bestResponse.analysis?.toneSummary || 'Neutral' },
              { label: 'Bias-poäng', value: bestResponse.analysis?.biasScore ? `${bestResponse.analysis.biasScore}/10` : 'N/A' },
              { label: 'Faktakollad', value: bestResponse.analysis?.factCheck ? '✓ Ja' : '- Nej' },
              { label: 'Kvalitetspoäng', value: bestResponse.metadata?.quality ? `${bestResponse.metadata.quality}/100` : 'N/A' }
            ]}
            actions={[
              { icon: '📋', title: 'Kopiera', onClick: () => navigator.clipboard.writeText(bestResponse.response || bestResponse.content || '') },
              { icon: '🔗', title: 'Dela', onClick: () => {} },
              { icon: '⭐', title: 'Favorit', onClick: () => {} }
            ]}
          />
        ) : null;

      case 'bert-summary':
        const bertText = aiMessage.synthesizedSummary || aiMessage.bertSummary || 'Ingen sammanfattning tillgänglig';
        // Format BERT summary with proper paragraphs and line breaks
        const formattedBert = bertText.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="mb-3 last:mb-0">
            {paragraph.split('\n').map((line, lineIdx) => (
              <span key={lineIdx}>
                {line}
                {lineIdx < paragraph.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        ));

        return (
          <RichContentCard
            badge={{ text: 'BERT-sammanfattning', icon: '📝' }}
            title="AI-genererad sammanfattning"
            content={<div className="space-y-3">{formattedBert}</div>}
            metadata={aiMessage.synthesizedSummaryMetadata ? [
              { label: 'Typ', value: aiMessage.synthesizedSummaryMetadata.type || 'Automatisk' },
              { label: 'Källor', value: `${aiMessage.synthesizedSummaryMetadata.sourcesCount || aiMessage.responses?.length || 0} AI-modeller` },
              { label: 'Längd', value: `${bertText.length} tecken` },
              { label: 'Genererad', value: new Date().toLocaleTimeString('sv-SE') }
            ] : [
              { label: 'Källor', value: `${aiMessage.responses?.length || 0} AI-modeller` },
              { label: 'Längd', value: `${bertText.length} tecken` }
            ]}
            actions={[
              { icon: '📋', title: 'Kopiera', onClick: () => navigator.clipboard.writeText(bertText) },
              { icon: '🔗', title: 'Dela', onClick: () => {} }
            ]}
          />
        );

      case 'tone-analysis':
        return aiMessage.toneAnalysis ? (
          <RichContentCard
            badge={{ text: 'Tonanalys', icon: '🎭' }}
            title="Sentiment & Språkton"
            content={
              <div className="space-y-4">
                <p>{aiMessage.toneAnalysis.summary || 'Tonanalys genomförd på samtliga AI-svar för att identifiera språklig ton, sentiment och kommunikationsstil.'}</p>
                {aiMessage.toneAnalysis.details && (
                  <div className="bg-civic-dark-900/50 rounded-lg p-4 space-y-2">
                    <div className="text-sm text-civic-gray-400">
                      {aiMessage.toneAnalysis.details}
                    </div>
                  </div>
                )}
              </div>
            }
            metadata={[
              { label: 'Dominant ton', value: aiMessage.toneAnalysis.dominantTone || 'Neutral' },
              { label: 'Sentiment', value: aiMessage.toneAnalysis.sentiment || 'Neutral' },
              { label: 'Formalitet', value: aiMessage.toneAnalysis.formality || 'Medel' },
              { label: 'Emotionalitet', value: aiMessage.toneAnalysis.emotionality || 'Låg' },
              { label: 'Objektivitet', value: aiMessage.toneAnalysis.objectivity || 'Hög' },
              { label: 'Analyserade svar', value: `${aiMessage.responses?.length || 0} st` }
            ]}
          />
        ) : null;

      case 'bias-detection':
        return aiMessage.biasDetection ? (
          <RichContentCard
            badge={{ text: 'Bias-detektion', icon: '⚖️' }}
            title="Analys av förutfattade meningar"
            content={
              <div className="space-y-4">
                <p>{aiMessage.biasDetection.summary || 'Systematisk genomgång av AI-svaren för att identifiera potentiella bias-mönster, politisk lutning, eller förutfattade meningar.'}</p>
                {aiMessage.biasDetection.patterns && aiMessage.biasDetection.patterns.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-civic-gray-500 uppercase tracking-wide">Identifierade mönster:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-civic-gray-400">
                      {aiMessage.biasDetection.patterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            metadata={[
              { label: 'Bias-nivå', value: aiMessage.biasDetection.level || 'Låg' },
              { label: 'Poäng', value: `${aiMessage.biasDetection.score || 0}/10` },
              { label: 'Typ', value: aiMessage.biasDetection.types?.join(', ') || 'Ingen' },
              { label: 'Politisk lutning', value: aiMessage.biasDetection.political || 'Neutral' },
              { label: 'Mönster', value: `${aiMessage.biasDetection.patterns?.length || 0} st` },
              { label: 'Säkerhet', value: aiMessage.biasDetection.confidence ? `${Math.round(aiMessage.biasDetection.confidence * 100)}%` : 'N/A' }
            ]}
          />
        ) : null;

      case 'meta-review':
        const metaContent = typeof aiMessage.metaReview === 'string' 
          ? aiMessage.metaReview 
          : aiMessage.metaReview?.summary || 'GPT-3.5 har granskat kvaliteten på alla AI-svar och bedömt deras innehåll, konsekvens och användbarhet.';
        
        return aiMessage.metaReview ? (
          <RichContentCard
            badge={{ text: 'GPT Metagranskning', icon: '🔍' }}
            title="Kvalitetskontroll av AI-svar"
            content={
              <div className="space-y-4">
                <p>{metaContent}</p>
                {aiMessage.metaReview.recommendations && aiMessage.metaReview.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-civic-gray-500 uppercase tracking-wide">Rekommendationer:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-civic-gray-400">
                      {aiMessage.metaReview.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            metadata={[
              { label: 'Kvalitet', value: typeof aiMessage.metaReview === 'object' ? (aiMessage.metaReview.quality || 'Hög') : 'Hög' },
              { label: 'Konsekvens', value: typeof aiMessage.metaReview === 'object' ? (aiMessage.metaReview.consistency || 'God') : 'God' },
              { label: 'Fullständighet', value: typeof aiMessage.metaReview === 'object' ? (aiMessage.metaReview.completeness || 'Fullständig') : 'Fullständig' },
              { label: 'Relevans', value: typeof aiMessage.metaReview === 'object' ? (aiMessage.metaReview.relevance || 'Hög') : 'Hög' },
              { label: 'Granskare', value: 'GPT-3.5 Turbo' },
              { label: 'Svar granskade', value: `${aiMessage.responses?.length || 0} st` }
            ]}
          />
        ) : null;

      case 'fact-check':
        return aiMessage.factCheckComparison ? (
          <RichContentCard
            badge={{ text: 'Tavily Faktakoll', icon: '✓' }}
            title="Verifiering av fakta och påståenden"
            content={
              <div className="space-y-4">
                <p>{aiMessage.factCheckComparison.summary || 'Tavily Search har verifierat fakta och påståenden i AI-svaren mot pålitliga källor på internet.'}</p>
                {aiMessage.factCheckComparison.findings && aiMessage.factCheckComparison.findings.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-civic-gray-500 uppercase tracking-wide">Verifierade påståenden:</div>
                    {aiMessage.factCheckComparison.findings.map((finding, idx) => (
                      <div key={idx} className="bg-civic-dark-900/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-base">{finding.verified ? '✓' : '⚠️'}</span>
                          <div className="flex-1 text-sm text-civic-gray-400">
                            <div className="font-medium text-civic-gray-300 mb-1">{finding.claim}</div>
                            {finding.source && (
                              <div className="text-xs text-civic-gray-500">
                                Källa: {finding.source}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
            metadata={[
              { label: 'Verifierade', value: `${aiMessage.factCheckComparison.verified || 0} påståenden` },
              { label: 'Källor', value: `${aiMessage.factCheckComparison.sources || 0} st` },
              { label: 'Säkerhet', value: aiMessage.factCheckComparison.confidence || 'Hög' },
              { label: 'Icke-verifierade', value: `${aiMessage.factCheckComparison.unverified || 0} st` },
              { label: 'Sökmotor', value: 'Tavily Search API' },
              { label: 'Söktid', value: `${aiMessage.factCheckComparison.searchTime || 0}ms` }
            ]}
          />
        ) : null;

      case 'model-synthesis':
        return aiMessage.modelSynthesis ? (
          <RichContentCard
            badge={{ text: 'Modellsyntes', icon: '🔬' }}
            title="Jämförelse mellan AI-modeller"
            content={
              <div className="space-y-6">
                <p className="text-civic-gray-400">
                  Syntetiserad analys som jämför och kontrasterar svar från olika AI-modeller för att identifiera 
                  konsensus, skillnader och motsägelser.
                </p>
                
                {/* Model Perspective Cards */}
                {aiMessage.modelSynthesis.modelCards && aiMessage.modelSynthesis.modelCards.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-civic-gray-400 mb-3">Modellperspektiv</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aiMessage.modelSynthesis.modelCards.map((card, idx) => (
                        <ModelPerspectiveCard key={idx} card={card} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divergences and Contradictions */}
                <div>
                  <h4 className="text-sm font-medium text-civic-gray-400 mb-3">Skillnader & Konsensus</h4>
                  <ModelDivergencePanel modelSynthesis={aiMessage.modelSynthesis} />
                </div>
              </div>
            }
            metadata={[
              { label: 'Modeller analyserade', value: `${aiMessage.modelSynthesis.modelCards?.length || 0} st` },
              { label: 'Konsensus', value: `${aiMessage.modelSynthesis.consensus?.overallConsensus || 0}%` },
              { label: 'Skillnader', value: `${aiMessage.modelSynthesis.divergences?.divergenceCount || 0} st` },
              { label: 'Motsägelser', value: `${aiMessage.modelSynthesis.contradictions?.contradictionCount || 0} st` },
              { label: 'Gemensamma ämnen', value: `${aiMessage.modelSynthesis.insights?.consensusTopics?.length || 0} st` },
              { label: 'Tidsstämpel', value: aiMessage.modelSynthesis.metadata?.synthesizedAt ? new Date(aiMessage.modelSynthesis.metadata.synthesizedAt).toLocaleTimeString('sv-SE') : 'N/A' }
            ]}
          />
        ) : null;

      default:
        // AI response
        if (sectionId.startsWith('ai-')) {
          const agent = sectionId.replace('ai-', '');
          const response = aiMessage.responses?.find(r => r.agent === agent);
          return response ? (
            <div className="space-y-4">
              <RichContentCard
                badge={{ text: response.metadata?.model || response.agent, icon: getAgentIcon(response.agent) }}
                title={`${response.metadata?.model || response.agent} Svar`}
                content={
                  <div className="space-y-3">
                    {response.response || response.content || 'Inget svar tillgängligt'}
                  </div>
                }
                metadata={[
                  { label: 'Modell', value: response.metadata?.model || response.agent || 'N/A' },
                  { label: 'Svarstid', value: `${response.metadata?.responseTime || 0}ms` },
                  { label: 'Tokens', value: response.metadata?.tokens || 'N/A' },
                  { label: 'Säkerhet', value: response.analysis?.confidence ? `${Math.round(response.analysis.confidence * 100)}%` : 'N/A' },
                  { label: 'Tonalitet', value: response.analysis?.toneSummary || 'Neutral' },
                  { label: 'Bias-poäng', value: response.analysis?.biasScore !== undefined ? `${response.analysis.biasScore}/10` : 'N/A' },
                  { label: 'Provider', value: response.metadata?.provider || 'N/A' },
                  { label: 'Temperatur', value: response.metadata?.temperature !== undefined ? response.metadata.temperature : 'N/A' }
                ]}
                actions={[
                  { icon: '📋', title: 'Kopiera', onClick: () => navigator.clipboard.writeText(response.response || response.content || '') },
                  { icon: '🔗', title: 'Dela', onClick: () => {} }
                ]}
              />
              
              {/* Pipeline Analysis Panel */}
              {response.pipelineAnalysis && (
                <div className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span>🔬</span>
                      Komplett Pipeline-analys
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Djupgående analys av detta AI-svar med förbearbetning, sentiment, ideologi och transparens
                    </p>
                  </div>
                  <PipelineAnalysisPanel pipelineAnalysis={response.pipelineAnalysis} />
                </div>
              )}
            </div>
          ) : null;
        }
        return null;
    }
  };

  const getAgentIcon = (agent) => {
    const icons = {
      'gpt-3.5': '🤖',
      'gemini': '✨',
      'deepseek': '🧠',
      'grok': '⚡',
      'qwen': '🌟'
    };
    return icons[agent] || '🤖';
  };

  return (
    <div className="flex h-screen" style={{ background: '#1a1a1a' }}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-10">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                {/* Typing Effect Logo */}
                <div className="mb-6">
                  <style>
                    {`
                      @keyframes typing {
                        0%, 100% {
                          width: 0;
                        }
                        50%, 90% {
                          width: 100%;
                        }
                      }
                      @keyframes blink {
                        50% {
                          border-color: transparent;
                        }
                      }
                    `}
                  </style>
                  <div
                    style={{
                      fontSize: '72px',
                      fontWeight: 700,
                      color: '#f5f5f5',
                      letterSpacing: '-2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      borderRight: '3px solid #888',
                      animation: 'typing 4s steps(11) infinite, blink 0.75s step-end infinite',
                      display: 'inline-block',
                      maxWidth: '100%',
                    }}
                  >
                    OneSeek.AI
                  </div>
                </div>
                
                {/* Tagline */}
                <p className="text-lg text-gray-400 font-light mb-2" style={{ letterSpacing: '1px' }}>
                  Beslut med insyn. AI med ansvar.
                </p>
                
                {/* Description */}
                <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
                  Jämför hur olika AI-modeller svarar på samma fråga. 
                  Transparent analys av ton, bias och fakta. 
                  Minimalistisk design, maximalt fokus på innehåll.
                </p>
              </div>
            )}

            {/* Message history */}
            {messages.map((message, index) => (
              <div key={index} className="mb-6 animate-fade-in-up">
                {message.type === 'user' && (
                  <div className="mb-8">
                    <div className="text-xl font-light text-civic-gray-100 leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
                
                {message.type === 'ai' && (
                  <div className="space-y-6">
                    {/* Always show BERT summary first */}
                    <div id="section-bert-summary">
                      {renderContent(message, 'bert-summary')}
                    </div>
                    
                    {/* Always show Model synthesis second if available */}
                    {message.modelSynthesis && (
                      <div id="section-model-synthesis">
                        {renderContent(message, 'model-synthesis')}
                      </div>
                    )}
                  </div>
                )}
                
                {message.type === 'error' && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-civic-dark-900/30 border border-red-500/40 text-red-300 rounded-xl px-5 py-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-xl">⚠️</span>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-civic-dark-800">
          <div className="px-10 py-4">
            {/* Clean search box with collapse/expand animation */}
            <QuestionInput
              onSubmit={handleSubmitQuestion}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Timeline Navigator - Right Sidebar */}
      {latestAiMessage && (
        <TimelineNavigator
          sections={timelineSections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          exploredCount={exploredSections.size}
          aiServices={aiServices}
          onServiceToggle={handleServiceToggle}
        />
      )}
    </div>
  );
}
