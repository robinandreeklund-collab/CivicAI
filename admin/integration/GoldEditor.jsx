/**
 * Gold Editor for ONESEEK Δ+
 * Admin-gränssnitt för Gold Standard-svar (React)
 * 
 * Funktionalitet:
 * - Hantera Gold Standard-svar
 * - Kvalitetssäkrade svar för specifika frågor
 * - Admin-godkända svar som prioriteras
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/ml';

/**
 * GoldEditor Component
 * Admin-gränssnitt för att hantera Gold Standard-svar
 */
export default function GoldEditor() {
  const [goldItems, setGoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGold, setNewGold] = useState({
    query: '',
    response: '',
    category: 'general',
    confidence: 1.0,
    sources: ''
  });

  // Kategorier för Gold-svar
  const categories = [
    { id: 'general', name: 'Allmänt', icon: '📋' },
    { id: 'weather', name: 'Väder', icon: '🌤️' },
    { id: 'population', name: 'Befolkning', icon: '👥' },
    { id: 'politics', name: 'Politik', icon: '🏛️' },
    { id: 'identity', name: 'Identitet', icon: '🤖' },
    { id: 'crisis', name: 'Kris', icon: '⚠️' },
    { id: 'education', name: 'Utbildning', icon: '📚' },
    { id: 'health', name: 'Hälsa', icon: '🏥' }
  ];

  // Ladda Gold-items från backend
  const fetchGoldItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/gold`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setGoldItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(`Kunde inte ladda Gold-svar: ${err.message}`);
      console.error('Failed to fetch gold items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoldItems();
  }, [fetchGoldItems]);

  // Skapa nytt Gold-svar
  const createGoldItem = async () => {
    if (!newGold.query || !newGold.response) {
      setError('Fråga och svar krävs');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/gold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGold,
          sources: newGold.sources.split(',').map(s => s.trim()).filter(s => s),
          confidence: parseFloat(newGold.confidence),
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchGoldItems();
      setNewGold({
        query: '',
        response: '',
        category: 'general',
        confidence: 1.0,
        sources: ''
      });
      setShowAddForm(false);
    } catch (err) {
      setError(`Kunde inte skapa Gold-svar: ${err.message}`);
    }
  };

  // Uppdatera Gold-svar
  const updateGoldItem = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/gold/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchGoldItems();
      setSelectedItem(null);
    } catch (err) {
      setError(`Kunde inte uppdatera Gold-svar: ${err.message}`);
    }
  };

  // Ta bort Gold-svar
  const deleteGoldItem = async (id) => {
    if (!confirm('Ta bort detta Gold-svar?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/gold/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchGoldItems();
    } catch (err) {
      setError(`Kunde inte ta bort Gold-svar: ${err.message}`);
    }
  };

  // Confidence badge
  const ConfidenceBadge = ({ confidence }) => {
    const color = confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                  confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {Math.round(confidence * 100)}% förtroende
      </span>
    );
  };

  // Category badge
  const CategoryBadge = ({ categoryId }) => {
    const cat = categories.find(c => c.id === categoryId) || categories[0];
    return (
      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
        {cat.icon} {cat.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-2 text-gray-600">Laddar Gold-svar...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🏆 Gold Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            ➕ Nytt Gold-svar
          </button>
          <button
            onClick={fetchGoldItems}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            🔄
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

      {/* Lägg till ny */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">
            ➕ Skapa nytt Gold-svar
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fråga (exakt match)
              </label>
              <input
                type="text"
                value={newGold.query}
                onChange={(e) => setNewGold({ ...newGold, query: e.target.value })}
                placeholder="T.ex. 'Hur är vädret i Stockholm?'"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gold-svar
              </label>
              <textarea
                value={newGold.response}
                onChange={(e) => setNewGold({ ...newGold, response: e.target.value })}
                placeholder="Det kvalitetssäkrade svaret..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newGold.category}
                  onChange={(e) => setNewGold({ ...newGold, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Förtroende
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={newGold.confidence}
                  onChange={(e) => setNewGold({ ...newGold, confidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">
                  {Math.round(newGold.confidence * 100)}%
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Källor (kommaseparerade)
                </label>
                <input
                  type="text"
                  value={newGold.sources}
                  onChange={(e) => setNewGold({ ...newGold, sources: e.target.value })}
                  placeholder="SMHI, SCB"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createGoldItem}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                Skapa Gold-svar
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gold-lista */}
      <div className="space-y-4">
        {goldItems.map((item, index) => (
          <div
            key={item.id || index}
            className="p-4 border rounded-lg hover:border-amber-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge categoryId={item.category} />
                  <ConfidenceBadge confidence={item.confidence || 1.0} />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Q: {item.query}
                </h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  A: {item.response?.substring(0, 200)}
                  {item.response?.length > 200 && '...'}
                </p>
                {item.sources && item.sources.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Källor: {item.sources.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 ml-4">
                <button
                  onClick={() => setSelectedItem(selectedItem === index ? null : index)}
                  className="p-2 text-gray-400 hover:text-indigo-600 rounded transition"
                  title="Expandera"
                >
                  {selectedItem === index ? '➖' : '➕'}
                </button>
                <button
                  onClick={() => deleteGoldItem(item.id || index)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded transition"
                  title="Ta bort"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Expanderat innehåll */}
            {selectedItem === index && (
              <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                <h5 className="font-medium text-gray-700 mb-2">Fullständigt svar:</h5>
                <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-white p-3 rounded border">
                  {item.response}
                </pre>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.response);
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    📋 Kopiera
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Stäng
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {goldItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🏆</p>
          <p>Inga Gold-svar definierade</p>
          <p className="text-sm mt-1">Klicka på "Nytt Gold-svar" för att skapa det första</p>
        </div>
      )}

      {/* Statistik */}
      <div className="mt-6 pt-4 border-t flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Totalt: {goldItems.length} Gold-svar
        </p>
        <div className="flex gap-2">
          {categories.slice(0, 4).map(cat => {
            const count = goldItems.filter(i => i.category === cat.id).length;
            return count > 0 ? (
              <span key={cat.id} className="text-xs text-gray-400">
                {cat.icon} {count}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
