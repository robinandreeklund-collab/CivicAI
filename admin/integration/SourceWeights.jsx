/**
 * Source Weights Editor for ONESEEK Δ+
 * Admin-gränssnitt för källviktning (React)
 * 
 * Funktionalitet:
 * - Hantera källviktning
 * - Justera förtroende per källa
 * - Se källstatistik
 */

import React, { useState, useEffect, useCallback } from 'react';

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

/**
 * SourceWeights Component
 * Admin-gränssnitt för att hantera källviktning
 */
export default function SourceWeights() {
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSource, setEditingSource] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    id: '',
    name: '',
    weight: 0.8,
    reliability: 'medium',
    description: ''
  });

  // Reliability-nivåer
  const reliabilityLevels = [
    { id: 'official', name: 'Officiell', icon: '🏛️', description: 'Svensk myndighet' },
    { id: 'high', name: 'Hög', icon: '⭐', description: 'Public service / etablerad' },
    { id: 'medium', name: 'Medel', icon: '📊', description: 'Verifierad källa' },
    { id: 'low', name: 'Låg', icon: '⚠️', description: 'Overifierad källa' }
  ];

  // Ladda källor från backend
  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithFallback('/sources');
      
      const data = await response.json();
      setSources(data.sources || {});
      setError(null);
    } catch (err) {
      setError(`Kunde inte ladda källor: ${err.message}`);
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Uppdatera källa
  const updateSource = async (id, updates) => {
    try {
      const response = await fetchWithFallback(`/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      await fetchSources();
      setEditingSource(null);
    } catch (err) {
      setError(`Kunde inte uppdatera källa: ${err.message}`);
    }
  };

  // Skapa ny källa
  const createSource = async () => {
    if (!newSource.id || !newSource.name) {
      setError('ID och namn krävs');
      return;
    }

    try {
      const response = await fetchWithFallback('/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });

      await fetchSources();
      setNewSource({
        id: '',
        name: '',
        weight: 0.8,
        reliability: 'medium',
        description: ''
      });
      setShowAddForm(false);
    } catch (err) {
      setError(`Kunde inte skapa källa: ${err.message}`);
    }
  };

  // Ta bort källa
  const deleteSource = async (id) => {
    if (!confirm(`Ta bort källa "${id}"?`)) {
      return;
    }

    try {
      const response = await fetchWithFallback(`/sources/${id}`, {
        method: 'DELETE'
      });

      await fetchSources();
    } catch (err) {
      setError(`Kunde inte ta bort källa: ${err.message}`);
    }
  };

  // Weight slider component
  const WeightSlider = ({ value, onChange, disabled }) => {
    const color = value >= 0.9 ? 'bg-green-500' :
                  value >= 0.7 ? 'bg-blue-500' :
                  value >= 0.5 ? 'bg-yellow-500' :
                  'bg-red-500';
    
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-32"
        />
        <div className={`px-2 py-1 ${color} text-white rounded text-sm font-medium min-w-[3rem] text-center`}>
          {Math.round(value * 100)}%
        </div>
      </div>
    );
  };

  // Reliability badge
  const ReliabilityBadge = ({ level }) => {
    const info = reliabilityLevels.find(l => l.id === level) || reliabilityLevels[2];
    const colors = {
      official: 'bg-purple-100 text-purple-800',
      high: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level] || colors.medium}`}>
        {info.icon} {info.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Laddar källor...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          ⚖️ Källviktning
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            ➕ Ny källa
          </button>
          <button
            onClick={fetchSources}
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

      {/* Lägg till ny källa */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <h3 className="text-lg font-semibold text-teal-800 mb-3">
            ➕ Lägg till ny källa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID (unikt)
              </label>
              <input
                type="text"
                value={newSource.id}
                onChange={(e) => setNewSource({ ...newSource, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="t.ex. smhi"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn
              </label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="t.ex. SMHI"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reliability
              </label>
              <select
                value={newSource.reliability}
                onChange={(e) => setNewSource({ ...newSource, reliability: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {reliabilityLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.icon} {level.name} - {level.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viktning: {Math.round(newSource.weight * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={newSource.weight}
                onChange={(e) => setNewSource({ ...newSource, weight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivning
              </label>
              <input
                type="text"
                value={newSource.description}
                onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                placeholder="Kort beskrivning av källan"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={createSource}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Skapa källa
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Käll-lista */}
      <div className="space-y-3">
        {Object.entries(sources).map(([id, source]) => (
          <div
            key={id}
            className={`p-4 border rounded-lg transition ${
              editingSource === id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {source.name || id}
                  </h4>
                  <ReliabilityBadge level={source.reliability} />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {source.description || `ID: ${id}`}
                </p>
                
                {editingSource === id ? (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-600 w-20">Viktning:</label>
                      <WeightSlider
                        value={source.weight || 0.5}
                        onChange={(value) => {
                          setSources({
                            ...sources,
                            [id]: { ...source, weight: value }
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-600 w-20">Reliability:</label>
                      <select
                        value={source.reliability}
                        onChange={(e) => {
                          setSources({
                            ...sources,
                            [id]: { ...source, reliability: e.target.value }
                          });
                        }}
                        className="px-3 py-1 border rounded"
                      >
                        {reliabilityLevels.map(level => (
                          <option key={level.id} value={level.id}>
                            {level.icon} {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSource(id, {
                          weight: source.weight,
                          reliability: source.reliability
                        })}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        Spara
                      </button>
                      <button
                        onClick={() => {
                          setEditingSource(null);
                          fetchSources();
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Viktning:</span>
                    <WeightSlider value={source.weight || 0.5} disabled />
                  </div>
                )}
              </div>

              {editingSource !== id && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingSource(id)}
                    className="p-2 text-gray-400 hover:text-teal-600 rounded transition"
                    title="Redigera"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteSource(id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded transition"
                    title="Ta bort"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(sources).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">⚖️</p>
          <p>Inga källor definierade</p>
          <p className="text-sm mt-1">Klicka på "Ny källa" för att lägga till</p>
        </div>
      )}

      {/* Sammanfattning */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium text-gray-700 mb-2">Sammanfattning</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {reliabilityLevels.map(level => {
            const count = Object.values(sources).filter(s => s.reliability === level.id).length;
            return (
              <div key={level.id} className="flex items-center gap-2">
                <span>{level.icon}</span>
                <span className="text-gray-600">{level.name}:</span>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
