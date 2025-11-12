import { useState } from 'react';
import QuestionInput from './components/QuestionInput';
import AgentBubble from './components/AgentBubble';
import ExportPanel from './components/ExportPanel';
import ModernLoader from './components/ModernLoader';

/**
 * Main CivicAI Application
 * Modern, Grok-inspired design with impressive animations
 */
function App() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitQuestion = async (userQuestion) => {
    setQuestion(userQuestion);
    setIsLoading(true);
    setError(null);
    setResponses([]);

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
      
      // Set responses from both AI models
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Error fetching AI responses:', err);
      setError(err.message || 'Ett fel uppstod vid hämtning av svar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-civic-dark-950 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-civic-dark-700/50 backdrop-blur-xl bg-civic-dark-800/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 animate-fade-in">
            {/* Logo */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                🧭
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
            </div>
            
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                CivicAI
              </h1>
              <p className="text-gray-400 mt-1 text-lg">Beslut med insyn. AI med ansvar.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Question Input */}
        <QuestionInput onSubmit={handleSubmitQuestion} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 animate-fade-in-up">
            <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-red-900/20 backdrop-blur-sm p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <p className="font-semibold text-red-300 mb-1">Ett fel uppstod</p>
                  <p className="text-red-200/80">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <ModernLoader />}

        {/* Response Display */}
        {!isLoading && responses.length > 0 && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Section header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h2 className="text-3xl font-bold text-gray-100">AI-svar</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-civic-dark-600 to-transparent"></div>
            </div>
            
            {/* Response cards */}
            <div className="space-y-6">
              {responses.map((resp, index) => (
                <AgentBubble
                  key={index}
                  agent={resp.agent}
                  response={resp.response}
                  metadata={resp.metadata}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Export Panel */}
        {!isLoading && responses.length > 0 && (
          <ExportPanel question={question} responses={responses} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-civic-dark-700/50 backdrop-blur-xl bg-civic-dark-800/30 mt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">CivicAI v0.1.0 - MVP</p>
              <p className="text-gray-500 text-xs mt-1">MIT License • Open Source</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Dokumentation</a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">GitHub</a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
