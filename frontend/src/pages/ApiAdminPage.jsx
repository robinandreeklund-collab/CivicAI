import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * API Admin Page
 * Standalone fullscreen admin panel for managing API integrations
 * 
 * Same design style as MessageBuilderPage (/admin/builder)
 * 
 * Features:
 * - List all API integrations from registry
 * - Show status (on/off), configuration, stats
 * - Enable/disable APIs
 * - Run test requests
 * - View and edit api_catalog.json
 */

// Helper to try multiple endpoints
const fetchWithFallback = async (path, options = {}) => {
  const endpoints = [
    `/api/ml${path}`,
    `http://localhost:5000/api/ml${path}`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) {
        return response;
      }
    } catch (err) {
      console.log(`Failed: ${endpoint}`);
    }
  }
  throw new Error('All endpoints failed');
};

export default function ApiAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // API registry data
  const [integrations, setIntegrations] = useState([]);
  const [stats, setStats] = useState({});
  const [summary, setSummary] = useState(null);
  
  // API Catalog editor
  const [catalogJson, setCatalogJson] = useState('');
  const [catalogEditing, setCatalogEditing] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  
  // Test results
  const [testResults, setTestResults] = useState({});
  const [testingApi, setTestingApi] = useState(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadIntegrations();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetchWithFallback('/admin/integrations');
      const data = await res.json();
      
      setIntegrations(data.integrations || []);
      setStats(data.stats || {});
      setSummary(data.summary || null);
      setCatalogJson(JSON.stringify(data.catalog || {}, null, 2));
    } catch (e) {
      setError('Kunde inte ladda API-integrationer: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleApi = async (apiId, currentEnabled) => {
    try {
      const res = await fetchWithFallback(`/admin/integrations/${apiId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setIntegrations(prev => 
          prev.map(api => 
            api.api_id === apiId 
              ? { ...api, enabled: data.enabled }
              : api
          )
        );
        setSuccess(`${apiId} är nu ${data.enabled ? 'aktiverad' : 'avaktiverad'}`);
      }
    } catch (e) {
      setError('Kunde inte toggla API: ' + e.message);
    }
  };

  const testApi = async (apiId) => {
    setTestingApi(apiId);
    try {
      const res = await fetchWithFallback(`/admin/integrations/${apiId}/test`, {
        method: 'POST'
      });
      
      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [apiId]: data
      }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [apiId]: { success: false, error: e.message }
      }));
    } finally {
      setTestingApi(null);
    }
  };

  const saveCatalog = async () => {
    setCatalogSaving(true);
    try {
      const catalogData = JSON.parse(catalogJson);
      
      const res = await fetchWithFallback('/admin/integrations/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalogData)
      });
      
      if (res.ok) {
        setSuccess('API Catalog sparad!');
        setCatalogEditing(false);
        loadIntegrations(); // Reload to get updated data
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('Ogiltig JSON: ' + e.message);
      } else {
        setError('Kunde inte spara: ' + e.message);
      }
    } finally {
      setCatalogSaving(false);
    }
  };

  // Filter integrations
  const filteredIntegrations = integrations.filter(api => {
    if (categoryFilter !== 'all' && api.category !== categoryFilter) return false;
    if (statusFilter === 'enabled' && !api.enabled) return false;
    if (statusFilter === 'disabled' && api.enabled) return false;
    if (searchQuery && !api.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !api.api_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get unique categories
  const categories = [...new Set(integrations.map(api => api.category))].sort();

  // Stats helpers
  const getApiStats = (apiId) => stats[apiId] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2 animate-pulse">🔌</div>
          <p className="text-xs font-mono text-[#555]">Laddar API-integrationer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] overflow-x-auto overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/admin" 
            className="inline-flex items-center gap-2 text-[#666] text-xs mb-4 hover:text-[#888] font-mono group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            ADMIN
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-[#e7e7e7]">
                API Integrations
              </h1>
              <p className="text-xs text-[#666] mt-1 font-mono">
                Hantera externa API:er • Statistik • Testning • Konfiguration
              </p>
            </div>
            {summary && (
              <div className="flex gap-4 text-[10px] font-mono">
                <div className="border border-[#2a2a2a] px-3 py-1 rounded">
                  TOTAL: <span className="text-[#888]">{summary.total_apis}</span>
                </div>
                <div className="border border-green-800/50 px-3 py-1 rounded text-green-500">
                  AKTIVA: <span>{summary.enabled_apis}</span>
                </div>
                <div className="border border-[#2a2a2a] px-3 py-1 rounded">
                  ANROP: <span className="text-blue-400">{summary.total_requests}</span>
                </div>
                <div className="border border-[#2a2a2a] px-3 py-1 rounded">
                  OK: <span className="text-green-500">{summary.success_rate}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 border border-red-900/50 bg-red-900/10 rounded text-xs font-mono text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-400">×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 border border-green-900/50 bg-green-900/10 rounded text-xs font-mono text-green-400">
            {success}
            <button onClick={() => setSuccess(null)} className="ml-4 text-green-500 hover:text-green-400">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="text-[10px] font-mono text-[#555] block mb-1">SÖK</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="API namn..."
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-[#3a3a3a] w-48"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#555] block mb-1">KATEGORI</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-[#3a3a3a]"
            >
              <option value="all">Alla kategorier</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#555] block mb-1">STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-[#3a3a3a]"
            >
              <option value="all">Alla</option>
              <option value="enabled">Aktiverade</option>
              <option value="disabled">Avaktiverade</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={loadIntegrations}
              className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-xs font-mono rounded hover:border-[#3a3a3a] hover:text-[#aaa] transition-all"
            >
              ↻ UPPDATERA
            </button>
            <button
              onClick={() => setCatalogEditing(!catalogEditing)}
              className={`px-4 py-2 border text-xs font-mono rounded transition-all ${
                catalogEditing 
                  ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                  : 'border-[#2a2a2a] text-[#888] hover:border-purple-500/50 hover:text-purple-400'
              }`}
            >
              📝 {catalogEditing ? 'STÄNG EDITOR' : 'REDIGERA CATALOG'}
            </button>
          </div>
        </div>

        {/* API Catalog Editor */}
        {catalogEditing && (
          <div className="mb-8 border border-purple-500/30 bg-purple-900/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-mono text-purple-300">📝 API Catalog Editor</h3>
                <p className="text-[10px] text-[#555] mt-1">
                  Redigera config/api_catalog.json direkt. Ändringar aktiveras direkt.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveCatalog}
                  disabled={catalogSaving}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-mono rounded hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {catalogSaving ? 'SPARAR...' : '💾 SPARA'}
                </button>
                <button
                  onClick={() => setCatalogEditing(false)}
                  className="px-4 py-2 border border-[#3a3a3a] text-[#666] text-xs font-mono rounded hover:text-[#888]"
                >
                  AVBRYT
                </button>
              </div>
            </div>
            <textarea
              value={catalogJson}
              onChange={(e) => setCatalogJson(e.target.value)}
              className="w-full h-96 bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono p-4 rounded focus:outline-none focus:border-purple-500/50 resize-y"
              spellCheck={false}
            />
          </div>
        )}

        {/* API List */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-[#555] mb-2">
            VISAR {filteredIntegrations.length} AV {integrations.length} API:ER
          </div>
          
          {filteredIntegrations.map(api => {
            const apiStats = getApiStats(api.api_id);
            const testResult = testResults[api.api_id];
            const isTesting = testingApi === api.api_id;
            
            return (
              <div 
                key={api.api_id}
                className={`border rounded-lg p-4 transition-all ${
                  api.enabled 
                    ? 'border-[#2a2a2a] bg-[#0d0d0d]' 
                    : 'border-[#1a1a1a] bg-[#080808] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left: API info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleApi(api.api_id, api.enabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          api.enabled ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                          api.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                      
                      <div>
                        <h4 className="text-sm font-mono text-[#e7e7e7]">{api.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#555]">{api.api_id}</span>
                          <span className="text-[10px] text-[#444]">•</span>
                          <span className="text-[10px] font-mono text-purple-400">{api.category}</span>
                          {api.source && (
                            <>
                              <span className="text-[10px] text-[#444]">•</span>
                              <span className="text-[10px] font-mono text-blue-400">{api.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-[#666] mt-2">{api.description}</p>
                    
                    {/* Triggers */}
                    {api.triggers && api.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {api.triggers.slice(0, 5).map((trigger, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 bg-[#1a1a1a] text-[#888] text-[10px] font-mono rounded"
                          >
                            {trigger}
                          </span>
                        ))}
                        {api.triggers.length > 5 && (
                          <span className="text-[10px] text-[#555]">+{api.triggers.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Stats and actions */}
                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-[10px] font-mono text-[#555]">ANROP</div>
                        <div className="text-sm font-mono text-[#888]">
                          {apiStats.total_requests || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#555]">OK</div>
                        <div className="text-sm font-mono text-green-500">
                          {apiStats.successful_requests || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#555]">AVG MS</div>
                        <div className="text-sm font-mono text-blue-400">
                          {apiStats.avg_response_time_ms ? Math.round(apiStats.avg_response_time_ms) : '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Test button */}
                    <button
                      onClick={() => testApi(api.api_id)}
                      disabled={isTesting || !api.enabled}
                      className={`px-4 py-2 border text-xs font-mono rounded transition-all ${
                        isTesting
                          ? 'border-yellow-500/50 text-yellow-400 animate-pulse'
                          : api.enabled
                            ? 'border-[#3a3a3a] text-[#888] hover:border-green-500/50 hover:text-green-400'
                            : 'border-[#1a1a1a] text-[#444] cursor-not-allowed'
                      }`}
                    >
                      {isTesting ? '⏳ TESTAR...' : '▶ TESTA'}
                    </button>
                  </div>
                </div>
                
                {/* Test result */}
                {testResult && (
                  <div className={`mt-3 p-3 rounded border ${
                    testResult.success 
                      ? 'border-green-900/50 bg-green-900/10'
                      : 'border-red-900/50 bg-red-900/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono ${
                        testResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {testResult.success ? '✓ TEST OK' : '✗ TEST MISSLYCKADES'}
                      </span>
                      <span className="text-[10px] font-mono text-[#555]">
                        {testResult.response_time_ms}ms • {testResult.timestamp}
                      </span>
                    </div>
                    {testResult.response_preview && (
                      <div className="mt-2 text-[10px] font-mono text-[#888] max-h-20 overflow-y-auto">
                        {testResult.response_preview}...
                      </div>
                    )}
                    {testResult.error && (
                      <div className="mt-2 text-[10px] font-mono text-red-400">
                        {testResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#2a2a2a] rounded-lg">
            <div className="text-2xl mb-2 opacity-20">🔌</div>
            <p className="text-xs font-mono text-[#555]">
              Inga API:er matchar filtreringen
            </p>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-10 border-t border-[#1a1a1a] pt-6">
          <p className="text-[10px] font-mono text-[#555] max-w-2xl">
            API Integrations visar alla registrerade externa API:er. 
            Använd toggle för att aktivera/avaktivera, TESTA för att köra en testförfrågan, 
            och REDIGERA CATALOG för att ändra api_catalog.json direkt.
          </p>
        </div>
      </div>
    </div>
  );
}
