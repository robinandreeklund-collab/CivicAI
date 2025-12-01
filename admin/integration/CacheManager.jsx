/**
 * Cache Manager for ONESEEK Δ+
 * Admin-verktyg för att hantera cache
 * 
 * Funktionalitet:
 * - Visa cache-statistik
 * - Rensa all cache
 * - Rensa specifik cache (weather, responses, etc.)
 * - Se cache-ålder och storlek
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
 * CacheManager Component
 * Admin-gränssnitt för att hantera cache
 */
export default function CacheManager() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Ladda cache-statistik från backend
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithFallback('/cache/stats');
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      // If endpoint doesn't exist, show default stats
      setStats({
        response_cache: { entries: 0, size_kb: 0, ttl_days: 7 },
        weather_cache: { entries: 0, size_kb: 0, ttl_minutes: 15, last_updated: null },
        topic_cache: { entries: 0, size_kb: 0 },
        total_size_kb: 0
      });
      setError(null); // Don't show error, just use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Rensa cache
  const clearCache = async (cacheType = 'all') => {
    if (!confirm(`Vill du rensa ${cacheType === 'all' ? 'ALL cache' : cacheType + ' cache'}? Detta kan inte ångras.`)) {
      return;
    }

    try {
      setClearingCache(true);
      setError(null);
      
      const response = await fetchWithFallback(`/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: cacheType })
      });

      const data = await response.json();
      setSuccessMessage(`✅ ${data.message || 'Cache rensad!'}`);
      
      // Uppdatera statistik
      await fetchStats();
      
      // Ta bort success-meddelande efter 3 sekunder
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Kunde inte rensa cache: ${err.message}`);
    } finally {
      setClearingCache(false);
    }
  };

  // Format bytes
  const formatSize = (kb) => {
    if (kb < 1) return '< 1 KB';
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Aldrig';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    
    if (diffMin < 1) return 'Just nu';
    if (diffMin < 60) return `${diffMin} min sedan`;
    if (diffHour < 24) return `${diffHour} tim sedan`;
    return date.toLocaleString('sv-SE');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Laddar cache-statistik...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          🗑️ Cache Manager
        </h2>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
        >
          🔄 Uppdatera
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 text-sm underline mt-1"
          >
            Stäng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg">
          <p className="text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Snabb-knappar för att rensa cache */}
      <div className="mb-6 p-4 bg-slate-700 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">
          ⚡ Snabb-rensning
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => clearCache('all')}
            disabled={clearingCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingCache ? '⏳ Rensar...' : '🗑️ Rensa ALL cache'}
          </button>
          <button
            onClick={() => clearCache('weather')}
            disabled={clearingCache}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            🌤️ Rensa väder-cache
          </button>
          <button
            onClick={() => clearCache('responses')}
            disabled={clearingCache}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            💬 Rensa svar-cache
          </button>
          <button
            onClick={() => clearCache('topics')}
            disabled={clearingCache}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            🏷️ Rensa topic-cache
          </button>
        </div>
      </div>

      {/* Cache-statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Response Cache */}
        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">💬 Svar-cache</h4>
            <span className="text-xs text-slate-400">{stats?.response_cache?.ttl_days || 7}d TTL</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.response_cache?.entries || 0}</p>
          <p className="text-sm text-slate-400">
            {formatSize(stats?.response_cache?.size_kb || 0)}
          </p>
        </div>

        {/* Weather Cache */}
        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">🌤️ Väder-cache</h4>
            <span className="text-xs text-slate-400">{stats?.weather_cache?.ttl_minutes || 15}min TTL</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.weather_cache?.entries || 0}</p>
          <p className="text-sm text-slate-400">
            Uppdaterad: {formatTimeAgo(stats?.weather_cache?.last_updated)}
          </p>
        </div>

        {/* Topic Cache */}
        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">🏷️ Topic-cache</h4>
            <span className="text-xs text-slate-400">Session</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.topic_cache?.entries || 0}</p>
          <p className="text-sm text-slate-400">
            {formatSize(stats?.topic_cache?.size_kb || 0)}
          </p>
        </div>

        {/* Total */}
        <div className="p-4 bg-indigo-900 rounded-lg border border-indigo-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-indigo-300">📊 Totalt</h4>
          </div>
          <p className="text-2xl font-bold text-white">{formatSize(stats?.total_size_kb || 0)}</p>
          <p className="text-sm text-indigo-300">
            {(stats?.response_cache?.entries || 0) + (stats?.weather_cache?.entries || 0) + (stats?.topic_cache?.entries || 0)} poster
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-slate-600">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">ℹ️ Information</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• <strong>Svar-cache:</strong> Cachear AI-svar i 7 dagar för snabbare respons</li>
          <li>• <strong>Väder-cache:</strong> Uppdateras var 15:e minut från SMHI</li>
          <li>• <strong>Topic-cache:</strong> Håller konversationshistorik per session</li>
          <li className="text-yellow-400">⚠️ Rensa cache för att få nya svar efter ändringar i Intent Engine</li>
        </ul>
      </div>
    </div>
  );
}
