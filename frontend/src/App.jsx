import { useState } from 'react';
import QuestionInput from './components/QuestionInput';
import AgentBubble from './components/AgentBubble';
import ExportPanel from './components/ExportPanel';

/**
 * Main CivicAI Application
 * MVP implementation with question input, AI responses, and YAML export
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
    <div className="min-h-screen bg-civic-dark-900">
      {/* Header */}
      <header className="border-b border-civic-dark-700 bg-civic-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-100">🧭 CivicAI</h1>
          <p className="text-gray-400 mt-2">Beslut med insyn. AI med ansvar.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Question Input */}
        <QuestionInput onSubmit={handleSubmitQuestion} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            <p className="font-semibold">Fel:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-4xl mx-auto text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-civic-accent-blue"></div>
            <p className="mt-4 text-gray-400">Hämtar svar från AI-modeller...</p>
          </div>
        )}

        {/* Response Display */}
        {!isLoading && responses.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-100 mb-6">AI-svar</h2>
            <div className="space-y-4">
              {responses.map((resp, index) => (
                <AgentBubble
                  key={index}
                  agent={resp.agent}
                  response={resp.response}
                  metadata={resp.metadata}
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
      <footer className="border-t border-civic-dark-700 bg-civic-dark-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>CivicAI v0.1.0 - MVP | MIT License</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
