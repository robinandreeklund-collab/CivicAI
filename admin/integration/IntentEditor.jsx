/**
 * Intent Editor for ONESEEK Δ+
 * Admin-styrbar Intent Editor (React)
 * 
 * Funktionalitet:
 * - Hantera intent-regler
 * - Redigera triggers och prioriteter
 * - Live-uppdatering utan server restart
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/ml';

/**
 * IntentEditor Component
 * Admin-gränssnitt för att hantera Intent Engine-regler
 */
export default function IntentEditor() {
  const [intents, setIntents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newIntent, setNewIntent] = useState({ name: '', triggers: '', priority: 5 });

  // Ladda intents från backend
  const fetchIntents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/intents`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setIntents(data.intents || {});
      setError(null);
    } catch (err) {
      setError(`Kunde inte ladda intents: ${err.message}`);
      console.error('Failed to fetch intents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntents();
  }, [fetchIntents]);

  // Uppdatera en intent
  const updateIntent = async (name, triggers, priority) => {
    try {
      const response = await fetch(`${API_BASE}/intents/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggers: triggers.split(',').map(t => t.trim()).filter(t => t),
          priority: parseInt(priority, 10)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchIntents();
      setEditMode(false);
      setSelectedIntent(null);
    } catch (err) {
      setError(`Kunde inte uppdatera intent: ${err.message}`);
    }
  };

  // Skapa ny intent
  const createIntent = async () => {
    if (!newIntent.name || !newIntent.triggers) {
      setError('Namn och triggers krävs');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIntent.name.toLowerCase().replace(/\s+/g, '_'),
          triggers: newIntent.triggers.split(',').map(t => t.trim()).filter(t => t),
          priority: parseInt(newIntent.priority, 10)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchIntents();
      setNewIntent({ name: '', triggers: '', priority: 5 });
    } catch (err) {
      setError(`Kunde inte skapa intent: ${err.message}`);
    }
  };

  // Ta bort intent
  const deleteIntent = async (name) => {
    if (!confirm(`Ta bort intent "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/intents/${name}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchIntents();
    } catch (err) {
      setError(`Kunde inte ta bort intent: ${err.message}`);
    }
  };

  // Prioritets-nivå badge
  const PriorityBadge = ({ priority }) => {
    const colors = {
      0: 'bg-red-100 text-red-800',
      1: 'bg-orange-100 text-orange-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-gray-100 text-gray-800'
    };
    
    const color = colors[Math.min(priority, 5)] || colors[5];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        Prioritet: {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Laddar intents...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🎯 Intent Editor
        </h2>
        <button
          onClick={fetchIntents}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
        >
          🔄 Uppdatera
        </button>
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

      {/* Skapa ny intent */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          ➕ Skapa ny intent
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Intent-namn"
            value={newIntent.name}
            onChange={(e) => setNewIntent({ ...newIntent, name: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Triggers (kommaseparerade)"
            value={newIntent.triggers}
            onChange={(e) => setNewIntent({ ...newIntent, triggers: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 md:col-span-2"
          />
          <div className="flex gap-2">
            <select
              value={newIntent.priority}
              onChange={(e) => setNewIntent({ ...newIntent, priority: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {[0, 1, 2, 3, 4, 5].map(p => (
                <option key={p} value={p}>Prio {p}</option>
              ))}
            </select>
            <button
              onClick={createIntent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Skapa
            </button>
          </div>
        </div>
      </div>

      {/* Intent-lista */}
      <div className="space-y-3">
        {Object.entries(intents).map(([name, config]) => (
          <div
            key={name}
            className={`p-4 border rounded-lg transition ${
              selectedIntent === name ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {name}
                  </h4>
                  <PriorityBadge priority={config.priority || 5} />
                </div>
                
                {selectedIntent === name && editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Triggers (kommaseparerade)
                      </label>
                      <input
                        type="text"
                        defaultValue={(config.triggers || []).join(', ')}
                        id={`triggers-${name}`}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Prioritet (0 = högst)
                      </label>
                      <select
                        defaultValue={config.priority || 5}
                        id={`priority-${name}`}
                        className="px-3 py-2 border rounded-lg"
                      >
                        {[0, 1, 2, 3, 4, 5].map(p => (
                          <option key={p} value={p}>Prioritet {p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const triggers = document.getElementById(`triggers-${name}`).value;
                          const priority = document.getElementById(`priority-${name}`).value;
                          updateIntent(name, triggers, priority);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Spara
                      </button>
                      <button
                        onClick={() => { setEditMode(false); setSelectedIntent(null); }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Triggers:</span>{' '}
                      {(config.triggers || []).slice(0, 5).join(', ')}
                      {(config.triggers || []).length > 5 && ` +${config.triggers.length - 5} till...`}
                    </p>
                    {config.entities && config.entities.length > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        Entities: {config.entities.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!(selectedIntent === name && editMode) && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => { setSelectedIntent(name); setEditMode(true); }}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Redigera"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteIntent(name)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

      {Object.keys(intents).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Inga intents definierade</p>
          <p className="text-sm mt-1">Skapa din första intent ovan</p>
        </div>
      )}

      {/* Statistik */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-500">
          Totalt: {Object.keys(intents).length} intents |{' '}
          {Object.values(intents).reduce((sum, i) => sum + (i.triggers?.length || 0), 0)} triggers
        </p>
      </div>
    </div>
  );
}
