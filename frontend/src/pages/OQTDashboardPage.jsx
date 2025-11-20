import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * OQT-1.0 Dashboard Page - Minimal Chat Interface
 * Direct conversation with OQT-1.0 (based on Mistral 7B + LLaMA-2)
 * No external AI - only our own model
 */
export default function OQTDashboardPage() {
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-[#e7e7e7] mb-1">
                OQT-1.0
              </h1>
              <p className="text-xs text-[#666]">
                {loading ? 'Laddar...' : `Version ${modelStatus?.model?.version || '1.2.0'} • Mistral 7B + LLaMA-2`}
              </p>
            </div>
            <div className="text-xs text-[#555]">
              Transparent AI • Full provenance
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-light text-[#e7e7e7] mb-2">
                Välkommen till OQT-1.0
              </h2>
              <p className="text-sm text-[#666] max-w-md mx-auto">
                Ställ dina frågor direkt till vår egen AI-modell. 
                OQT-1.0 är byggd på Mistral 7B och LLaMA-2 för transparent och rättvis analys.
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
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[#151515] bg-[#0a0a0a]">
        <div className="px-6 py-4">
          <form onSubmit={handleQuerySubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ställ en fråga till OQT-1.0..."
                className="flex-1 bg-[#151515] border border-[#2a2a2a] rounded-full px-6 py-3 text-[#e7e7e7] placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
                disabled={queryLoading}
              />
              <button
                type="submit"
                disabled={queryLoading || !queryInput.trim()}
                className="px-8 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-full font-medium hover:bg-[#fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {queryLoading ? 'Skickar...' : 'Skicka'}
              </button>
            </div>
            <p className="text-xs text-[#555] mt-2 text-center">
              OQT-1.0 tränas kontinuerligt för att förbättra transparens och rättvisa
            </p>
          </form>
        </div>
      </div>

      <FooterDemo4 />
    </div>
  );
}
