import { useState, useRef, useEffect } from 'react';
import ProcessingLoader from '../components/ProcessingLoader';
import AIServiceToggle from '../components/AIServiceToggle';
import CleanResponseCarousel from '../components/CleanResponseCarousel';
import AnalysisComparison from '../components/AnalysisComparison';
import ResponseSummary from '../components/ResponseSummary';
import BattlePanel from '../components/BattlePanel';
import QuestionInput from '../components/QuestionInput';

/**
 * HomePage Component
 * Main chat interface for OneSeek.AI
 */
export default function HomePage({ onAiMessageUpdate }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBattlePanel, setShowBattlePanel] = useState(false);
  const [currentBattleData, setCurrentBattleData] = useState(null);
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        question: userQuestion,
        responses: data.responses || [],
        synthesizedSummary: data.synthesizedSummary || null,
        synthesizedSummaryMetadata: data.synthesizedSummaryMetadata || null,
        metaReview: data.metaReview || null,
        factCheckComparison: data.factCheckComparison || null,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
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

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: '#1a1a1a' }}>
      {/* AI Service Toggle - Top Right as dropdown */}
      <div className="absolute top-6 right-6 z-20">
        <AIServiceToggle 
          services={aiServices}
          onServicesChange={setAiServices}
        />
      </div>

      {/* Battle Panel Modal */}
      {showBattlePanel && currentBattleData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-civic-dark-900 rounded-2xl border border-civic-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-civic-dark-900 border-b border-civic-dark-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-100">Battle Mode - Rösta på bästa AI-svar</h2>
              <button
                onClick={() => setShowBattlePanel(false)}
                className="p-2 rounded-lg hover:bg-civic-dark-800 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <BattlePanel
                question={currentBattleData.question}
                responses={currentBattleData.responses}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-4 py-6">
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
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )}
              
              {message.type === 'ai' && (
                <div className="space-y-4">
                  {/* Clean Response Carousel - Minimal, elegant interface */}
                  <CleanResponseCarousel
                    responses={message.responses}
                    question={message.question}
                  />

                  {/* Analysis Comparison */}
                  <AnalysisComparison 
                    responses={message.responses} 
                    metaReview={message.metaReview}
                    factCheckComparison={message.factCheckComparison}
                  />

                  {/* Neutral Summary */}
                  <ResponseSummary 
                    responses={message.responses} 
                    question={message.question}
                    synthesizedSummary={message.synthesizedSummary}
                    synthesizedSummaryMetadata={message.synthesizedSummaryMetadata}
                    factCheckComparison={message.factCheckComparison}
                  />
                </div>
              )}
              
              {message.type === 'error' && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-900/30 border border-red-500/40 text-red-300 rounded-2xl rounded-tl-sm px-5 py-3">
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

      {/* Loading indicator - centered in viewport under animated circles */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <ProcessingLoader />
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="relative flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* GitHub-inspired search box with stunning animations */}
          <QuestionInput
            onSubmit={handleSubmitQuestion}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
