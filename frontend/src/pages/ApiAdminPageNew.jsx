import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * API Admin Page v2.0
 * Scalable admin panel for managing 100+ modular API integrations
 * 
 * Features:
 * - Sidebar-based navigation with categories
 * - Module-based API structure (/api/smhi.py, /api/scb.py, etc.)
 * - API catalog JSON management with $ref support
 * - Live testing and monitoring
 * - Horizontal scalability for large API catalogs
 */

export default function ApiAdminPageNew() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Sidebar navigation
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // API catalog state
  const [apiCatalog, setApiCatalog] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Selected API module
  const [selectedModule, setSelectedModule] = useState(null);
  
  // Module details
  const [moduleInfo, setModuleInfo] = useState(null);
  
  // Test state
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadApiCatalog();
  }, []);

  const loadApiCatalog = async () => {
    setLoading(true);
    try {
      // Load main catalog from public folder
      const response = await fetch('/api_catalog.json');
      if (!response.ok) throw new Error('Failed to load API catalog');
      
      const catalog = await response.json();
      setApiCatalog(catalog);
      
      // Extract categories from catalog
      const cats = Object.keys(catalog.api_catalog || {});
      setCategories(cats);
      
      setLoading(false);
    } catch (e) {
      setError('Kunde inte ladda API-katalog: ' + e.message);
      setLoading(false);
    }
  };

  const loadModuleDetails = async (categoryName) => {
    try {
      const category = apiCatalog?.api_catalog?.[categoryName];
      
      if (!category) {
        setModuleInfo(null);
        return;
      }
      
      // Check if it's a $ref to another file
      if (category.$ref) {
        const refFile = category.$ref;
        const refResponse = await fetch(`/${refFile}`);
        if (refResponse.ok) {
          const refData = await refResponse.json();
          setModuleInfo({
            name: categoryName,
            isReference: true,
            referenceFile: refFile,
            ...refData
          });
        } else {
          setModuleInfo({
            name: categoryName,
            isReference: true,
            referenceFile: refFile,
            error: 'Kunde inte ladda refererad fil'
          });
        }
      } else {
        // Direct inline definition
        setModuleInfo({
          name: categoryName,
          isReference: false,
          ...category
        });
      }
      
      setSelectedModule(categoryName);
    } catch (e) {
      setError('Kunde inte ladda modul: ' + e.message);
    }
  };

  const testApiModule = async () => {
    if (!selectedModule) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      // Call backend test endpoint for the module
      const response = await fetch(`/api/test-module/${selectedModule}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Test query',
          entity: 'Stockholm'
        })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({
        success: false,
        error: e.message
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2 animate-pulse">🔌</div>
          <p className="text-xs font-mono text-[#555]">Laddar API-katalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col transition-all duration-200`}>
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-sm font-mono text-[#e7e7e7]">API Modules</h2>
              <p className="text-[10px] text-[#555]">v{apiCatalog?.version}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[#666] hover:text-[#888] text-xs"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {/* Category list */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* All categories option */}
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedModule(null);
              setModuleInfo(null);
            }}
            className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#aaa]'
            }`}
          >
            {sidebarCollapsed ? '📁' : '📁 Alla moduler'}
          </button>
          
          {/* Individual categories */}
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                loadModuleDetails(cat);
              }}
              className={`w-full text-left px-3 py-2 rounded text-xs font-mono mt-1 transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30'
                  : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#aaa]'
              }`}
            >
              {sidebarCollapsed ? '🔌' : `🔌 ${cat}`}
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#1a1a1a]">
          <Link 
            to="/admin"
            className="block text-center px-3 py-2 text-[10px] font-mono text-[#666] hover:text-[#888] border border-[#2a2a2a] rounded"
          >
            {sidebarCollapsed ? '←' : '← Tillbaka'}
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-light tracking-wide text-[#e7e7e7]">
              API Moduler
            </h1>
            <p className="text-xs text-[#666] mt-1 font-mono">
              Skalbar modulär API-hantering med $ref-stöd
            </p>
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
          
          {/* Overview when no module selected */}
          {selectedCategory === 'all' && !selectedModule && (
            <div className="space-y-4">
              <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-lg p-6">
                <h3 className="text-sm font-mono text-[#e7e7e7] mb-4">📊 Översikt</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-mono text-blue-400">{categories.length}</div>
                    <div className="text-[10px] text-[#555] mt-1">Moduler</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-mono text-purple-400">{apiCatalog?.version}</div>
                    <div className="text-[10px] text-[#555] mt-1">Version</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-mono text-green-400">
                      {apiCatalog?.active_features?.modular_api_catalog ? '✓' : '✗'}
                    </div>
                    <div className="text-[10px] text-[#555] mt-1">Modulär</div>
                  </div>
                </div>
              </div>
              
              <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-lg p-6">
                <h3 className="text-sm font-mono text-[#e7e7e7] mb-4">ℹ️ Information</h3>
                <p className="text-xs text-[#888] leading-relaxed mb-4">
                  {apiCatalog?.description}
                </p>
                <div className="text-[10px] text-[#555]">
                  Uppdaterad: {apiCatalog?.updated}
                </div>
              </div>
              
              <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-lg p-6">
                <h3 className="text-sm font-mono text-[#e7e7e7] mb-4">🚀 Kom igång</h3>
                <p className="text-xs text-[#888] mb-3">
                  Välj en modul i sidomenyn för att se detaljer och testa API:et.
                </p>
                <div className="text-[10px] text-[#555] space-y-1">
                  <div>• Varje modul kan använda $ref för att länka till externa filer</div>
                  <div>• Moduler har egen Python-implementation i /api/</div>
                  <div>• Stöd för 100+ API:er med skalbar struktur</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Module details */}
          {selectedModule && moduleInfo && (
            <div className="space-y-6">
              {/* Module header */}
              <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-mono text-purple-300">{moduleInfo.name}</h2>
                    {moduleInfo.isReference && (
                      <div className="text-[10px] text-purple-400 mt-1">
                        📄 Referens: {moduleInfo.referenceFile}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={testApiModule}
                    disabled={testing}
                    className={`px-4 py-2 border text-xs font-mono rounded transition-all ${
                      testing
                        ? 'border-yellow-500/50 text-yellow-400 animate-pulse'
                        : 'border-green-500/50 text-green-400 hover:bg-green-900/20'
                    }`}
                  >
                    {testing ? '⏳ TESTAR...' : '▶ TESTA API'}
                  </button>
                </div>
                
                {moduleInfo.description && (
                  <p className="text-sm text-[#aaa]">{moduleInfo.description}</p>
                )}
              </div>
              
              {/* Provider info */}
              {moduleInfo.provider && (
                <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-lg p-6">
                  <h3 className="text-sm font-mono text-[#e7e7e7] mb-4">🏢 Leverantör</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-[#555] mb-1">Namn</div>
                      <div className="text-[#e7e7e7]">{moduleInfo.provider.name}</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-1">Licens</div>
                      <div className="text-[#e7e7e7]">{moduleInfo.provider.license}</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-1">Website</div>
                      <a 
                        href={moduleInfo.provider.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {moduleInfo.provider.url}
                      </a>
                    </div>
                    <div>
                      <div className="text-[#555] mb-1">Kräver API-nyckel</div>
                      <div className={moduleInfo.provider.requires_api_key ? 'text-orange-400' : 'text-green-400'}>
                        {moduleInfo.provider.requires_api_key ? '✓ Ja' : '✗ Nej'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* APIs list */}
              {moduleInfo.apis && moduleInfo.apis.length > 0 && (
                <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-lg p-6">
                  <h3 className="text-sm font-mono text-[#e7e7e7] mb-4">🔌 API Endpoints ({moduleInfo.apis.length})</h3>
                  <div className="space-y-3">
                    {moduleInfo.apis.map((api, idx) => (
                      <div key={idx} className="border border-[#1a1a1a] rounded p-4 hover:border-[#2a2a2a] transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-mono text-[#e7e7e7]">{api.name}</div>
                            {api.source && (
                              <div className="text-[10px] text-[#555] mt-1">
                                📡 {api.source}
                                {api.url_template && <span className="ml-2 text-orange-400">🔗 Template URL</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <div className={`text-[10px] px-2 py-1 rounded ${
                              api.priority === 0 ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                              api.priority === 1 ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' :
                              'bg-purple-900/20 text-purple-400'
                            }`}>
                              Priority: {api.priority}
                            </div>
                            <div className="text-[10px] px-2 py-1 bg-green-900/20 text-green-400 rounded">
                              {api.method || 'GET'}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-[#888] mb-3">{api.description}</p>
                        <div className="text-[10px] text-[#555] space-y-1 mb-3">
                          <div className="flex items-start gap-2">
                            <span className="text-[#777]">📍 URL:</span>
                            <span className="text-blue-300 font-mono break-all">{api.url}</span>
                          </div>
                          {api.frequency && (
                            <div className="flex items-start gap-2">
                              <span className="text-[#777]">🔄 Uppdatering:</span>
                              <span>{api.frequency}</span>
                            </div>
                          )}
                          {api.coverage && (
                            <div className="flex items-start gap-2">
                              <span className="text-[#777]">🌍 Täckning:</span>
                              <span>{api.coverage}</span>
                            </div>
                          )}
                          {api.data_format && (
                            <div className="flex items-start gap-2">
                              <span className="text-[#777]">📄 Format:</span>
                              <span>{api.data_format}</span>
                            </div>
                          )}
                          {api.keywords && api.keywords.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-[#777]">🏷️ Keywords:</span>
                              <span className="flex-1">
                                {api.keywords.map((kw, i) => (
                                  <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-[#1a1a1a] text-[#888] rounded text-[9px]">
                                    {kw}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                          {api.parameters && Object.keys(api.parameters).length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-[#777]">⚙️ Parameters:</span>
                              <span className="flex-1">
                                {Object.entries(api.parameters).map(([key, val]) => (
                                  <div key={key} className="text-[9px] bg-[#1a1a1a] rounded px-2 py-1 mb-1">
                                    <span className="text-cyan-400">{key}</span>
                                    <span className="text-[#666]">: {val.type}</span>
                                    {val.required && <span className="text-orange-400 ml-1">*required</span>}
                                    {val.description && <span className="text-[#777] ml-2">// {val.description}</span>}
                                  </div>
                                ))}
                              </span>
                            </div>
                          )}
                          {api.notes && (
                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#1a1a1a]">
                              <span className="text-[#777]">💡 Info:</span>
                              <span className="text-[#888] italic">{api.notes}</span>
                            </div>
                          )}
                        </div>
                        {api.example_url && (
                          <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                            <div className="text-[10px] text-[#555] mb-1">📝 Example:</div>
                            <a 
                              href={api.example_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-blue-400 hover:text-blue-300 font-mono break-all"
                            >
                              {api.example_url}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Test result */}
              {testResult && (
                <div className={`border rounded-lg p-6 ${
                  testResult.success
                    ? 'border-green-900/50 bg-green-900/10'
                    : 'border-red-900/50 bg-red-900/10'
                }`}>
                  <h3 className={`text-sm font-mono mb-4 ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? '✓ Test lyckades' : '✗ Test misslyckades'}
                  </h3>
                  <pre className="text-[10px] font-mono text-[#888] overflow-x-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
