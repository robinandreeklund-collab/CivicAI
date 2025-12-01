/**
 * Gold Queue for ONESEEK Δ+
 * Admin-gränssnitt för godkännande av svar (React)
 * 
 * Funktionalitet:
 * - Kö av svar som väntar på admin-godkännande
 * - Godkänn eller avslå svar för Gold Standard
 * - Feedback-loop för förbättring
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/ml';

/**
 * GoldQueue Component
 * Admin-gränssnitt för att granska och godkänna svar
 */
export default function GoldQueue() {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [expandedItem, setExpandedItem] = useState(null);

  // Ladda kö från backend
  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/gold/queue?status=${filter}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setQueueItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(`Kunde inte ladda kön: ${err.message}`);
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Godkänn svar
  const approveItem = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/gold/queue/${item.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchQueue();
    } catch (err) {
      setError(`Kunde inte godkänna svar: ${err.message}`);
    }
  };

  // Avslå svar
  const rejectItem = async (item, reason = '') => {
    try {
      const response = await fetch(`${API_BASE}/gold/queue/${item.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejected_at: new Date().toISOString(),
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchQueue();
    } catch (err) {
      setError(`Kunde inte avslå svar: ${err.message}`);
    }
  };

  // Redigera och godkänn
  const editAndApprove = async (item, editedResponse) => {
    try {
      const response = await fetch(`${API_BASE}/gold/queue/${item.id}/edit-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: editedResponse,
          edited_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchQueue();
      setExpandedItem(null);
    } catch (err) {
      setError(`Kunde inte redigera svar: ${err.message}`);
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      pending: '⏳ Väntar',
      approved: '✅ Godkänd',
      rejected: '❌ Avslagen'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Confidence indicator
  const ConfidenceBar = ({ confidence }) => {
    const width = Math.round(confidence * 100);
    const color = confidence >= 0.8 ? 'bg-green-500' :
                  confidence >= 0.6 ? 'bg-yellow-500' :
                  'bg-red-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{width}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Laddar kö...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          📋 Gold Queue
        </h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="pending">⏳ Väntar</option>
            <option value="approved">✅ Godkända</option>
            <option value="rejected">❌ Avslagna</option>
            <option value="all">Alla</option>
          </select>
          <button
            onClick={fetchQueue}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            🔄 Uppdatera
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 text-sm underline mt-1"
          >
            Stäng
          </button>
        </div>
      )}

      {/* Statistik */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {['pending', 'approved', 'rejected'].map(status => {
          const count = queueItems.filter(i => i.status === status).length;
          const icon = status === 'pending' ? '⏳' : status === 'approved' ? '✅' : '❌';
          const bg = status === 'pending' ? 'bg-yellow-50' : 
                     status === 'approved' ? 'bg-green-50' : 'bg-red-50';
          
          return (
            <div key={status} className={`p-4 rounded-lg ${bg}`}>
              <div className="text-2xl">{icon}</div>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{status}</div>
            </div>
          );
        })}
      </div>

      {/* Kö-lista */}
      <div className="space-y-4">
        {queueItems.map((item, index) => (
          <div
            key={item.id || index}
            className={`border rounded-lg overflow-hidden transition ${
              item.status === 'pending' ? 'border-yellow-300' :
              item.status === 'approved' ? 'border-green-300' :
              'border-red-300'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={item.status || 'pending'} />
                    <ConfidenceBar confidence={item.confidence || 0.7} />
                  </div>
                  
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Q: {item.query}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    A: {item.response?.substring(0, 150)}
                    {item.response?.length > 150 && '...'}
                  </p>
                  
                  {item.source && (
                    <p className="text-xs text-gray-400 mt-2">
                      Källa: {item.source} | {item.timestamp || 'Okänd tid'}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                {item.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => approveItem(item)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                    >
                      ✅ Godkänn
                    </button>
                    <button
                      onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                    >
                      ✏️ Redigera
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Anledning till avslag (valfritt):');
                        if (reason !== null) {
                          rejectItem(item, reason);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                    >
                      ❌ Avslå
                    </button>
                  </div>
                )}
              </div>

              {/* Redigera-formulär */}
              {expandedItem === index && item.status === 'pending' && (
                <div className="mt-4 pt-4 border-t bg-blue-50 -mx-4 -mb-4 p-4">
                  <h5 className="font-medium text-blue-800 mb-2">
                    ✏️ Redigera svar
                  </h5>
                  <textarea
                    id={`edit-${index}`}
                    defaultValue={item.response}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Redigera svaret..."
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        const textarea = document.getElementById(`edit-${index}`);
                        editAndApprove(item, textarea.value);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Spara & Godkänn
                    </button>
                    <button
                      onClick={() => setExpandedItem(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              {/* Avslag-anledning */}
              {item.status === 'rejected' && item.rejection_reason && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                  <strong>Anledning:</strong> {item.rejection_reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {queueItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📋</p>
          <p>Ingen i kön med status "{filter}"</p>
          <p className="text-sm mt-1">
            {filter === 'pending' 
              ? 'Alla svar har granskats!'
              : 'Byt filter för att se andra poster'
            }
          </p>
        </div>
      )}

      {/* Batch-operationer */}
      {filter === 'pending' && queueItems.length > 0 && (
        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {queueItems.filter(i => i.status === 'pending').length} väntar på granskning
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm(`Godkänn alla ${queueItems.filter(i => i.status === 'pending').length} väntande?`)) {
                  queueItems
                    .filter(i => i.status === 'pending')
                    .forEach(i => approveItem(i));
                }
              }}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
            >
              ✅ Godkänn alla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
