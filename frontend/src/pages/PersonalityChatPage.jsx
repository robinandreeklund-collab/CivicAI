/**
 * PersonalityChatPage - ONESEEK Δ+ v6.2
 * 
 * Demonstration page for personality-based inference with automatic API routing.
 * Shows live thinking process and personality selection.
 */

import { useState } from 'react';
import { Send, Loader } from 'lucide-react';
import ThinkingChain, { LiveThinkingIndicator } from '../components/ThinkingChain';
import PersonalitySelector from '../components/PersonalitySelector';
import { sendPersonalityMessageViaWebSocket, isWebSocketSupported } from '../services/personalityWebSocket';
import { sendPersonalityChatMessage } from '../services/chat';

export default function PersonalityChatPage() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThinkingStep, setCurrentThinkingStep] = useState(null);
  const [liveThinkingChain, setLiveThinkingChain] = useState([]);

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
    setCurrentThinkingStep('[tänker...] Analyserar frågan...');
    setLiveThinkingChain([]);

    try {
      // Use WebSocket if supported, otherwise fall back to REST API
      if (isWebSocketSupported()) {
        await sendPersonalityMessageViaWebSocket(userQuestion, {
          onThinking: (thinkingStep) => {
            // Update current thinking step display
            setCurrentThinkingStep(thinkingStep.message);
            
            // Add to live thinking chain
            setLiveThinkingChain(prev => [...prev, thinkingStep]);
          },
          onFinal: (response) => {
            // Add AI response
            const aiMessage = {
              type: 'ai',
              content: response.response,
              timestamp: new Date().toISOString(),
              personality: response.personality,
              thinkingChain: response.thinking_chain || [],
              apiData: response.api_data || [],
              tokens: response.tokens,
              latency_ms: response.latency_ms,
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setCurrentThinkingStep(null);
            setLiveThinkingChain([]);
            setIsLoading(false);
          },
          onError: (errorMessage) => {
            const errorMsg = {
              type: 'error',
              content: `Fel: ${errorMessage}`,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, errorMsg]);
            setCurrentThinkingStep(null);
            setLiveThinkingChain([]);
            setIsLoading(false);
          }
        });
      } else {
        // Fallback to REST API
        const response = await sendPersonalityChatMessage(userQuestion, {
          streamThinking: true,
        });

        // Add AI response
        const aiMessage = {
          type: 'ai',
          content: response.response,
          timestamp: new Date().toISOString(),
          personality: response.personality,
          thinkingChain: response.thinking_chain || [],
          apiData: response.api_data || [],
          tokens: response.tokens,
          latency_ms: response.latency_ms,
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setCurrentThinkingStep(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      
      const errorMessage = {
        type: 'error',
        content: `Fel: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setCurrentThinkingStep(null);
      setLiveThinkingChain([]);
      setIsLoading(false);
    }
  };

  const handlePersonalityChange = (personalityId) => {
    console.log('Personality changed to:', personalityId);
    // Could add a message to the chat showing the change
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ONESEEK Δ+ v6.2
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Intelligent personlighetsbaserad AI med automatisk API-routing
              </p>
            </div>
            <PersonalitySelector onPersonalityChange={handlePersonalityChange} />
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Ställ en fråga för att komma igång
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                AI:n väljer automatiskt rätt personlighet och hämtar realtidsdata
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Message content */}
                <div className={message.type === 'ai' ? 'prose dark:prose-invert max-w-none' : ''}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Personality info for AI messages */}
                {message.type === 'ai' && message.personality && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Personlighet:</span>
                      <span>{message.personality.name}</span>
                      <span className="text-gray-400">•</span>
                      <span>Förtroende: {(message.personality.confidence * 100).toFixed(0)}%</span>
                      {message.tokens && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{message.tokens} tokens</span>
                        </>
                      )}
                      {message.latency_ms && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{Math.round(message.latency_ms)}ms</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Thinking chain */}
                {message.type === 'ai' && message.thinkingChain && message.thinkingChain.length > 0 && (
                  <ThinkingChain thinkingChain={message.thinkingChain} />
                )}

                {/* API data info */}
                {message.type === 'ai' && message.apiData && message.apiData.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      API-källor:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.apiData.map((api, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            api.success
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {api.source || api.api}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live thinking indicator */}
          {isLoading && currentThinkingStep && (
            <div className="flex justify-start">
              <LiveThinkingIndicator currentStep={currentThinkingStep} />
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ställ en fråga..."
              aria-label="Skriv din fråga här"
              aria-describedby="chat-input-hint"
              className="flex-1 resize-none bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
