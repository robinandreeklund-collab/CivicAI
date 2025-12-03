import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * API Admin Page
 * Standalone fullscreen admin panel for managing API integrations
 * 
 * Same design style as MessageBuilderPage (/admin/builder)
 * 
 * Features:
 * - Collapsible API cards (compact by default, expand on click)
 * - Show API endpoint URL
 * - Edit triggers/keywords
 * - Custom test queries with markdown-formatted results
 * - Request statistics with live updates
 * - Toggle enable/disable
 * - API Catalog JSON editor
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

// Helper to format response text with markdown-like styling
const formatResponseText = (text) => {
  if (!text) return null;
  
  // Split by code blocks (```...```)
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        return (
          <pre key={index} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 my-2 overflow-x-auto">
            <code className="text-[10px] font-mono text-[#888]">{match[2]}</code>
          </pre>
        );
      }
    }
    
    // Handle bold (**text**)
    const formattedPart = part.split(/(\*\*[^*]+\*\*)/g).map((segment, i) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={i} className="text-[#e7e7e7]">{segment.slice(2, -2)}</strong>;
      }
      return segment;
    });
    
    return <span key={index}>{formattedPart}</span>;
  });
};

export default function ApiAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // API registry data
  const [integrations, setIntegrations] = useState([]);
  const [stats, setStats] = useState({});
  const [summary, setSummary] = useState(null);
  
  // Expanded API card
  const [expandedApiId, setExpandedApiId] = useState(null);
  
  // API Catalog editor
  const [catalogJson, setCatalogJson] = useState('');
  const [catalogEditing, setCatalogEditing] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  
  // Test state
  const [testResults, setTestResults] = useState({});
  const [testingApi, setTestingApi] = useState(null);
  const [testQuery, setTestQuery] = useState({});
  const [testEntity, setTestEntity] = useState({});
  
  // Edit triggers state
  const [editingTriggers, setEditingTriggers] = useState({});
  
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

  const toggleApi = async (apiId, currentEnabled, e) => {
    e.stopPropagation();
    try {
      const res = await fetchWithFallback(`/admin/integrations/${apiId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      
      if (res.ok) {
        const data = await res.json();
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

  const testApi = async (apiId, e) => {
    e?.stopPropagation();
    setTestingApi(apiId);
    try {
      const res = await fetchWithFallback(`/admin/integrations/${apiId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery[apiId] || null,
          entity: testEntity[apiId] || null
        })
      });
      
      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [apiId]: data
      }));
      
      // Update stats from test result (no need to reload all integrations)
      if (data.stats) {
        setStats(prev => ({
          ...prev,
          [apiId]: data.stats
        }));
        // Also update summary totals
        setSummary(prev => prev ? {
          ...prev,
          total_requests: (prev.total_requests || 0) + 1,
          successful_requests: data.success ? (prev.successful_requests || 0) + 1 : prev.successful_requests,
          success_rate: prev.total_requests > 0 
            ? Math.round(((data.success ? (prev.successful_requests || 0) + 1 : prev.successful_requests) / ((prev.total_requests || 0) + 1)) * 100 * 10) / 10
            : (data.success ? 100 : 0)
        } : prev);
      }
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [apiId]: { success: false, error: e.message }
      }));
    } finally {
      setTestingApi(null);
    }
  };

  const saveTriggers = async (apiId) => {
    try {
      const newTriggers = editingTriggers[apiId]?.split(',').map(t => t.trim()).filter(t => t);
      
      const res = await fetchWithFallback(`/admin/integrations/${apiId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggers: newTriggers })
      });
      
      if (res.ok) {
        setSuccess(`Sökord uppdaterade för ${apiId}`);
        loadIntegrations();
        setEditingTriggers(prev => ({ ...prev, [apiId]: undefined }));
      }
    } catch (e) {
      setError('Kunde inte spara sökord: ' + e.message);
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
        loadIntegrations();
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
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-[#555] mb-2">
            VISAR {filteredIntegrations.length} AV {integrations.length} API:ER • Klicka för att expandera
          </div>
          
          {filteredIntegrations.map(api => {
            const apiStats = getApiStats(api.api_id);
            const testResult = testResults[api.api_id];
            const isTesting = testingApi === api.api_id;
            const isExpanded = expandedApiId === api.api_id;
            const isEditingTriggers = editingTriggers[api.api_id] !== undefined;
            
            return (
              <div 
                key={api.api_id}
                className={`border rounded-lg transition-all ${
                  api.enabled 
                    ? 'border-[#2a2a2a] bg-[#0d0d0d]' 
                    : 'border-[#1a1a1a] bg-[#080808] opacity-60'
                } ${isExpanded ? 'ring-1 ring-blue-500/30' : ''}`}
              >
                {/* Compact Header - Always visible */}
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#111]"
                  onClick={() => setExpandedApiId(isExpanded ? null : api.api_id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle Switch - Improved design */}
                    <div 
                      onClick={(e) => toggleApi(api.api_id, api.enabled, e)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        api.enabled ? 'bg-green-600' : 'bg-[#333]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          api.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${api.enabled ? 'text-[#e7e7e7]' : 'text-[#666]'}`}>
                        {api.name}
                      </span>
                      <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.5 bg-purple-900/20 rounded">
                        {api.category}
                      </span>
                      {api.source && (
                        <span className="text-[10px] font-mono text-blue-400">
                          {api.source}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Mini stats */}
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span className="text-[#555]">
                        ANROP: <span className="text-[#888]">{apiStats.total_requests || 0}</span>
                      </span>
                      <span className="text-[#555]">
                        AVG: <span className="text-blue-400">{apiStats.avg_response_time_ms ? Math.round(apiStats.avg_response_time_ms) + 'ms' : '-'}</span>
                      </span>
                    </div>
                    
                    {/* Expand indicator */}
                    <span className={`text-[#555] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-4">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column - API Info */}
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <label className="text-[10px] font-mono text-[#555] block mb-1">BESKRIVNING</label>
                          <p className="text-xs text-[#888]">{api.description}</p>
                        </div>
                        
                        {/* API Endpoint URL */}
                        {api.url && (
                          <div>
                            <label className="text-[10px] font-mono text-[#555] block mb-1">ENDPOINT</label>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-blue-400 bg-[#0a0a0a] px-2 py-1 rounded border border-[#2a2a2a]">
                                {api.url}
                              </code>
                              <a 
                                href={api.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#555] hover:text-blue-400"
                              >
                                ↗
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {/* API ID */}
                        <div>
                          <label className="text-[10px] font-mono text-[#555] block mb-1">API ID</label>
                          <code className="text-xs font-mono text-[#666]">{api.api_id}</code>
                        </div>
                        
                        {/* Triggers/Keywords - Editable */}
                        <div>
                          <label className="text-[10px] font-mono text-[#555] block mb-1">
                            SÖKORD (triggers)
                            {!isEditingTriggers && (
                              <button 
                                onClick={() => setEditingTriggers(prev => ({ 
                                  ...prev, 
                                  [api.api_id]: (api.triggers || []).join(', ') 
                                }))}
                                className="ml-2 text-blue-400 hover:text-blue-300"
                              >
                                ✏️ Redigera
                              </button>
                            )}
                          </label>
                          {isEditingTriggers ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingTriggers[api.api_id]}
                                onChange={(e) => setEditingTriggers(prev => ({ 
                                  ...prev, 
                                  [api.api_id]: e.target.value 
                                }))}
                                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-2 py-1 rounded focus:outline-none focus:border-blue-500/50"
                                placeholder="ord1, ord2, ord3..."
                              />
                              <button
                                onClick={() => saveTriggers(api.api_id)}
                                className="px-2 py-1 bg-blue-600 text-white text-[10px] font-mono rounded hover:bg-blue-700"
                              >
                                Spara
                              </button>
                              <button
                                onClick={() => setEditingTriggers(prev => ({ ...prev, [api.api_id]: undefined }))}
                                className="px-2 py-1 border border-[#3a3a3a] text-[#666] text-[10px] font-mono rounded hover:text-[#888]"
                              >
                                Avbryt
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(api.triggers || []).map((trigger, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-0.5 bg-[#1a1a1a] text-[#888] text-[10px] font-mono rounded"
                                >
                                  {trigger}
                                </span>
                              ))}
                              {(!api.triggers || api.triggers.length === 0) && (
                                <span className="text-[10px] text-[#555]">Inga sökord definierade</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Statistics */}
                        <div>
                          <label className="text-[10px] font-mono text-[#555] block mb-2">STATISTIK</label>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-center">
                              <div className="text-[10px] font-mono text-[#555]">ANROP</div>
                              <div className="text-lg font-mono text-[#888]">{apiStats.total_requests || 0}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-center">
                              <div className="text-[10px] font-mono text-[#555]">OK</div>
                              <div className="text-lg font-mono text-green-500">{apiStats.successful_requests || 0}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-center">
                              <div className="text-[10px] font-mono text-[#555]">FEL</div>
                              <div className="text-lg font-mono text-red-500">{apiStats.failed_requests || 0}</div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 text-center">
                              <div className="text-[10px] font-mono text-[#555]">AVG MS</div>
                              <div className="text-lg font-mono text-blue-400">
                                {apiStats.avg_response_time_ms ? Math.round(apiStats.avg_response_time_ms) : '-'}
                              </div>
                            </div>
                          </div>
                          {apiStats.last_call && (
                            <div className="mt-2 text-[10px] font-mono text-[#555]">
                              Senaste anrop: {new Date(apiStats.last_call).toLocaleString('sv-SE')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column - Test */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-mono text-[#555] block mb-2">TESTA API</label>
                          
                          {/* Custom query input */}
                          <div className="space-y-2 mb-3">
                            <input
                              type="text"
                              value={testQuery[api.api_id] || ''}
                              onChange={(e) => setTestQuery(prev => ({ ...prev, [api.api_id]: e.target.value }))}
                              placeholder="Egen sökfråga (valfritt)"
                              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-blue-500/50"
                            />
                            <input
                              type="text"
                              value={testEntity[api.api_id] || ''}
                              onChange={(e) => setTestEntity(prev => ({ ...prev, [api.api_id]: e.target.value }))}
                              placeholder="Entity (t.ex. stad, namn)"
                              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          
                          <button
                            onClick={(e) => testApi(api.api_id, e)}
                            disabled={isTesting || !api.enabled}
                            className={`w-full px-4 py-2 border text-xs font-mono rounded transition-all ${
                              isTesting
                                ? 'border-yellow-500/50 text-yellow-400 animate-pulse'
                                : api.enabled
                                  ? 'border-green-500/50 text-green-400 hover:bg-green-900/20'
                                  : 'border-[#1a1a1a] text-[#444] cursor-not-allowed'
                            }`}
                          >
                            {isTesting ? '⏳ TESTAR...' : '▶ KÖR TEST'}
                          </button>
                        </div>
                        
                        {/* Test Result - RAW DATA style */}
                        {testResult && (
                          <div className="space-y-3">
                            <div className={`p-3 rounded border ${
                              testResult.success 
                                ? 'border-green-900/50 bg-green-900/10'
                                : 'border-red-900/50 bg-red-900/10'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-mono ${
                                  testResult.success ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {testResult.success ? '✓ TEST OK' : '✗ TEST MISSLYCKADES'}
                                </span>
                                <span className="text-[10px] font-mono text-[#555]">
                                  {testResult.response_time_ms}ms
                                </span>
                              </div>
                              {testResult.error && (
                                <div className="text-[10px] font-mono text-red-400">
                                  {testResult.error}
                                </div>
                              )}
                            </div>
                            
                            {/* Formatted Response */}
                            {testResult.response && (
                              <div>
                                <label className="text-[10px] font-mono text-[#555] block mb-1">SVAR (Formaterat)</label>
                                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3 max-h-64 overflow-y-auto">
                                  <div className="text-xs text-[#e7e7e7] leading-relaxed whitespace-pre-wrap">
                                    {formatResponseText(testResult.response)}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* RAW DATA */}
                            {testResult.response && (
                              <div>
                                <label className="text-[10px] font-mono text-[#666] mb-1 block">RAW DATA</label>
                                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3 max-h-48 overflow-y-auto">
                                  <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap">
                                    {testResult.response}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!testResult && (
                          <div className="flex items-center justify-center h-32 border border-dashed border-[#2a2a2a] rounded bg-[#0a0a0a]">
                            <div className="text-center">
                              <div className="text-xl mb-1 opacity-20">▶</div>
                              <p className="text-[10px] font-mono text-[#555]">Klicka KÖR TEST</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
            Klicka på ett API för att expandera och se detaljer, redigera sökord, 
            eller köra anpassade testförfrågningar. Statistiken uppdateras i realtid.
          </p>
        </div>
      </div>
    </div>
  );
}
