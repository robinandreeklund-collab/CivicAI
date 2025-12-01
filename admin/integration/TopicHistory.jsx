/**
 * TopicHistory Component for ONESEEK Δ+
 * 
 * Visar topic-grupperad historik med:
 * - Samma fråga med olika formuleringar i samma tråd
 * - AI:n minns vad ni pratade om
 * - 100% anonymt - ingen persondata sparas
 * 
 * @author ONESEEK Team
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Helper to try multiple endpoints (proxy and direct)
const fetchWithFallback = async (path, options = {}) => {
  const endpoints = [
    `/api/ml${path}`,                    // Vite proxy
    `http://localhost:5000/api/ml${path}` // Direct ML service
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) {
        return response;
      }
    } catch (err) {
      console.log(`Failed to fetch from ${endpoint}:`, err.message);
    }
  }
  throw new Error('All endpoints failed');
};

// Create context before usage (React best practice)
const TopicContext = createContext(null);

/**
 * TopicHistory - Visar grupperad konversationshistorik
 */
export default function TopicHistory({ userId = 'anonymous', onSelectTopic }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicMessages, setTopicMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hämta alla topics för användaren
  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithFallback(`/memory/topics/${userId}?limit=20`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTopics(data.topics || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Hämta meddelanden för en topic
  const fetchTopicMessages = useCallback(async (topicHash) => {
    try {
      const response = await fetchWithFallback(`/memory/context/${topicHash}?limit=20`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching topic messages:', data.error);
      } else {
        setTopicMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching topic messages:', err);
    }
  }, []);

  // Ladda topics vid mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Ladda meddelanden när topic väljs
  useEffect(() => {
    if (selectedTopic) {
      fetchTopicMessages(selectedTopic.topic_hash);
    }
  }, [selectedTopic, fetchTopicMessages]);

  // Hantera klick på topic
  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    if (onSelectTopic) {
      onSelectTopic(topic);
    }
  };

  // Formatera datum
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Intent ikoner
  const getIntentIcon = (intent) => {
    const icons = {
      befolkning: '👥',
      väder: '🌤️',
      nyheter: '📰',
      politik: '🏛️',
      trafik: '🚗',
      hälsa: '🏥',
      ekonomi: '💰',
      general: '💬'
    };
    return icons[intent] || icons.general;
  };

  if (loading) {
    return (
      <div className="topic-history loading">
        <div className="spinner">⏳</div>
        <p>Laddar historik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topic-history error">
        <p>❌ {error}</p>
        <button onClick={fetchTopics}>Försök igen</button>
      </div>
    );
  }

  return (
    <div className="topic-history">
      <div className="topic-list">
        <h3>📚 Dina ämnen</h3>
        
        {topics.length === 0 ? (
          <p className="no-topics">Inga konversationer ännu</p>
        ) : (
          <ul>
            {topics.map((topic) => (
              <li 
                key={topic.topic_hash}
                className={`topic-item ${selectedTopic?.topic_hash === topic.topic_hash ? 'selected' : ''}`}
                onClick={() => handleTopicClick(topic)}
              >
                <span className="topic-icon">
                  {getIntentIcon(topic.intent)}
                </span>
                <div className="topic-info">
                  <span className="topic-label">{topic.label}</span>
                  <span className="topic-meta">
                    {topic.message_count} meddelanden
                    {topic.last_message && ` • ${formatDate(topic.last_message)}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTopic && (
        <div className="topic-detail">
          <h3>
            {getIntentIcon(selectedTopic.intent)} {selectedTopic.label}
          </h3>
          
          <div className="topic-messages">
            {topicMessages.map((msg, index) => (
              <div 
                key={index}
                className={`message ${msg.role}`}
              >
                <span className="message-role">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </span>
                <span className="message-content">
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .topic-history {
          display: flex;
          gap: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .topic-list {
          width: 300px;
          border-right: 1px solid #e0e0e0;
          padding-right: 20px;
        }
        
        .topic-list h3 {
          margin: 0 0 15px 0;
          color: #333;
        }
        
        .topic-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .topic-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .topic-item:hover {
          background: #f5f5f5;
        }
        
        .topic-item.selected {
          background: #e3f2fd;
        }
        
        .topic-icon {
          font-size: 24px;
        }
        
        .topic-info {
          display: flex;
          flex-direction: column;
        }
        
        .topic-label {
          font-weight: 500;
          color: #333;
        }
        
        .topic-meta {
          font-size: 12px;
          color: #666;
        }
        
        .topic-detail {
          flex: 1;
        }
        
        .topic-detail h3 {
          margin: 0 0 15px 0;
          color: #333;
        }
        
        .topic-messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .message {
          display: flex;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
        }
        
        .message.user {
          background: #e3f2fd;
        }
        
        .message.assistant {
          background: #f5f5f5;
        }
        
        .message-role {
          font-size: 20px;
        }
        
        .message-content {
          flex: 1;
          line-height: 1.5;
        }
        
        .no-topics {
          color: #666;
          text-align: center;
          padding: 20px;
        }
        
        .loading, .error {
          text-align: center;
          padding: 40px;
        }
        
        .spinner {
          font-size: 32px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .error button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/**
 * TopicContext - Context provider för topic-baserad konversation
 */
export function TopicContextProvider({ children }) {
  const [currentTopic, setCurrentTopic] = useState(null);
  const [contextMessages, setContextMessages] = useState([]);

  // Detektera topic från text
  const detectTopic = useCallback(async (text) => {
    try {
      const response = await fetch(`${API_BASE}/memory/detect-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      
      if (!data.error) {
        setCurrentTopic({
          topic_hash: data.topic_hash,
          intent: data.intent,
          entity: data.entity,
          label: data.topic_label
        });
        
        // Hämta kontext för denna topic
        const contextResponse = await fetch(`${API_BASE}/memory/context/${data.topic_hash}?limit=8`);
        const contextData = await contextResponse.json();
        setContextMessages(contextData.messages || []);
      }
      
      return data;
    } catch (err) {
      console.error('Error detecting topic:', err);
      return null;
    }
  }, []);

  // Spara meddelande
  const saveMessage = useCallback(async (question, answer, metadata = {}) => {
    if (!currentTopic) return;
    
    try {
      await fetch(`${API_BASE}/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'anonymous',
          question,
          answer,
          intent: currentTopic.intent,
          entity: currentTopic.entity,
          metadata
        })
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }, [currentTopic]);

  const value = {
    currentTopic,
    contextMessages,
    detectTopic,
    saveMessage,
    setCurrentTopic
  };

  return (
    <TopicContext.Provider value={value}>
      {children}
    </TopicContext.Provider>
  );
}

// Hook för att använda topic context
export function useTopicContext() {
  const context = useContext(TopicContext);
  if (!context) {
    throw new Error('useTopicContext must be used within TopicContextProvider');
  }
  return context;
}
