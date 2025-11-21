import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

/**
 * OQT-1.0 Dashboard Page - Minimal Chat Interface
 * Direct conversation with OQT-1.0 (based on Mistral 7B + LLaMA-2)
 * No external AI - only our own model
 */
export default function OQTDashboardPage() {
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch model status from backend
  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        const response = await fetch('/api/oqt/status');
        if (response.ok) {
          const data = await response.json();
          setModelStatus(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching model status:', err);
        setLoading(false);
      }
    };

    fetchModelStatus();
  }, []);

  // Handle query submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!queryInput.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: queryInput,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = queryInput;
    setQueryInput('');
    setQueryLoading(true);

    try {
      const response = await fetch('/api/oqt/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add agent message
        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          text: data.response,
          confidence: data.confidence,
          version: data.version,
          timestamp: data.timestamp,
          provenance: data.provenance,
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          type: 'agent',
          text: 'Kunde inte bearbeta frågan. Försök igen.',
          error: true,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('Query error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        text: 'Nätverksfel - kunde inte ansluta till servern.',
        error: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setQueryLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#151515]">
        <div className="px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[#666] text-sm mb-4 transition-colors duration-200 hover:text-[#e7e7e7] group"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
            <span>Tillbaka</span>
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-[#e7e7e7] mb-1">
                OneSeek-7B-Zero
              </h1>
              <p className="text-xs text-[#666]">
                {loading ? 'Laddar...' : (
                  <>
                    <span className="text-[#888]">v1.0 (Base)</span>
                    <span className="mx-2">→</span>
                    <span className="text-[#aaffaa]">v1.1 (Current) ✓</span>
                    <span className="mx-2">•</span>
                    <span>Routing to v1.1</span>
                  </>
                )}
              </p>
            </div>
            <div className="text-xs text-[#555]">
              Transparent AI • Full provenance
            </div>
          </div>

          {/* Navigation Tabs in Header */}
          <div className="flex gap-6 border-t border-[#151515] pt-3 -mb-4">
            {[
              { id: 'overview', label: 'Chat' },
              { id: 'activity', label: 'Aktivitet' },
              { id: 'metrics', label: 'Mätvärden' },
              { id: 'ledger', label: 'Ledger' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  pb-3 text-xs font-light transition-colors duration-200
                  ${selectedTab === tab.id
                    ? 'text-[#e7e7e7] border-b-2 border-[#e7e7e7]'
                    : 'text-[#666] hover:text-[#888]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {selectedTab === 'overview' && (
            <>
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h2 className="text-xl font-light text-[#e7e7e7] mb-2">
                    Välkommen till OneSeek-7B-Zero.v1.1
                  </h2>
                  <p className="text-sm text-[#666] max-w-md mx-auto">
                    Ställ dina frågor direkt till vår egen AI-modell. 
                    OneSeek-7B-Zero.v1.1 ger transparenta och rättvisa svar baserat på kontinuerlig träning.
                  </p>
                  <p className="text-xs text-[#555] mt-4">
                    Alla frågor routas till OneSeek-7B-Zero.v1.1
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.type === 'user'
                        ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                        : message.error
                        ? 'bg-[#2a1a1a] text-[#ff6b6b] border border-[#ff6b6b]/20'
                        : 'bg-[#151515] text-[#e7e7e7] border border-[#2a2a2a]'
                    } rounded-2xl px-5 py-3`}
                  >
                    {message.type === 'agent' && !message.error && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#2a2a2a]">
                        <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs">
                          🤖
                        </div>
                        <span className="text-xs text-[#666]">OQT-1.0</span>
                        {message.confidence && (
                          <span className="text-xs text-[#555]">
                            • {(message.confidence * 100).toFixed(0)}% förtroende
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-[#666]' : 'text-[#555]'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {queryLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs">
                        🤖
                      </div>
                      <span className="text-xs text-[#666]">OQT-1.0</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}

          {selectedTab === 'activity' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-light text-[#e7e7e7] mb-2">Träningsaktivitet</h3>
              <p className="text-sm text-[#666]">Visar real-time träningsaktivitet och modelluppdateringar</p>
            </div>
          )}

          {selectedTab === 'metrics' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-light text-[#e7e7e7] mb-2">Mätvärden</h3>
              <p className="text-sm text-[#666]">Prestanda och kvalitetsmått för OQT-1.0</p>
            </div>
          )}

          {selectedTab === 'ledger' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-light text-[#e7e7e7] mb-2">Ledger</h3>
              <p className="text-sm text-[#666]">Blockchain-baserad provenance och spårbarhet</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Input Field (ChatV2 style) - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-6">
          <form onSubmit={handleQuerySubmit} className="relative">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ställ en fråga till OQT-1.0..."
              disabled={queryLoading}
              className="w-full px-6 py-4 pr-32 bg-[#151515] border border-[#2a2a2a] rounded-lg text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={queryLoading || !queryInput.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[#e7e7e7] text-[#0a0a0a] rounded hover:bg-[#fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {queryLoading ? 'Skickar...' : 'Skicka'}
            </button>
          </form>
          <p className="text-xs text-[#555] mt-2 text-center">
            OQT-1.0 tränas kontinuerligt för att förbättra transparens och rättvisa
          </p>
        </div>
      </div>
    </div>
  );
}
