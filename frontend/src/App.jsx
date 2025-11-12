import { useState, useRef, useEffect } from 'react';
import AgentBubble from './components/AgentBubble';
import ModernLoader from './components/ModernLoader';
import ExportButtons from './components/ExportButtons';

/**
 * Main CivicAI Application
 * Chat-like interface similar to Copilot and Grok
 */
function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: userQuestion,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion }),
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
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuestion(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-civic-dark-950 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-civic-dark-700/50 backdrop-blur-xl bg-civic-dark-800/50 flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🧭
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                CivicAI
              </h1>
              <p className="text-xs text-gray-500">Beslut med insyn. AI med ansvar.</p>
            </div>
          </div>
          
          {/* Export buttons in header */}
          {messages.some(m => m.type === 'ai') && (
            <ExportButtons messages={messages.filter(m => m.type === 'ai')} />
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-4xl mb-6 animate-bounce-slow">
                💬
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Välkommen till CivicAI</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                Ställ dina frågor och få svar från flera AI-modeller samtidigt. Jämför perspektiv och fatta bättre beslut.
              </p>
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Vad är demokrati?',
                  'Förklara hållbar utveckling',
                  'AI och etik - vad behöver jag veta?'
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(suggestion)}
                    className="px-4 py-2 text-sm rounded-full bg-civic-dark-700/50 hover:bg-civic-dark-600 text-gray-400 hover:text-gray-200 transition-all duration-300 hover:scale-105 border border-civic-dark-600 hover:border-blue-500/30"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                  {message.responses.map((resp, idx) => (
                    <AgentBubble
                      key={idx}
                      agent={resp.agent}
                      response={resp.response}
                      metadata={resp.metadata}
                      index={idx}
                    />
                  ))}
                </div>
              )}
              
              {message.type === 'error' && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-red-900/30 border border-red-500/40 text-red-300 rounded-2xl rounded-tl-sm px-5 py-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">⚠️</span>
                      <p>{message.content}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && <ModernLoader />}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom like Copilot/Grok */}
      <div className="relative border-t border-civic-dark-700/50 backdrop-blur-xl bg-civic-dark-800/50 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmitQuestion} className="relative">
            <div className="relative flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ställ din fråga här..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-2xl bg-civic-dark-700/50 border border-civic-dark-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    minHeight: '48px',
                    maxHeight: '200px',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
                
                {/* Send button inside input */}
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-civic-dark-600 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  title="Skicka (Enter)"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tryck Enter för att skicka, Shift+Enter för ny rad
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
