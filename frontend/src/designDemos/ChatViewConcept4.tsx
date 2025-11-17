import { useState } from 'react';

/**
 * ChatViewConcept4: Collapsible Contextual Sidebar with Sources
 * 
 * Design Philosophy:
 * - Dynamic sidebar that adapts to current context (history, sources, settings)
 * - Header with integrated search and quick actions
 * - Source cards with expandable details
 * - Context-aware panels that change based on user flow
 * - Smooth transitions between different sidebar modes
 */

export default function ChatViewConcept4() {
  const [sidebarMode, setSidebarMode] = useState('sources'); // sources, history, settings
  const [expandedSource, setExpandedSource] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock data
  const sources = [
    {
      id: 1,
      title: 'Naturvårdsverket - Klimatmål 2030',
      url: 'naturvardsverket.se',
      reliability: 95,
      verified: true,
      summary: 'Officiell källa för Sveriges klimatmål och åtgärdsplaner.',
    },
    {
      id: 2,
      title: 'Energimyndigheten - Förnybar energi',
      url: 'energimyndigheten.se',
      reliability: 92,
      verified: true,
      summary: 'Statistik och prognoser för förnybar energiutveckling.',
    },
    {
      id: 3,
      title: 'IEA - Sweden Energy Policy Review',
      url: 'iea.org',
      reliability: 88,
      verified: true,
      summary: 'Internationell granskning av svensk energipolitik.',
    },
  ];

  const history = [
    { id: 1, title: 'Klimatpolitiska åtgärder...', date: '2024-01-15', status: 'complete' },
    { id: 2, title: 'Ekonomisk politik och inflation...', date: '2024-01-14', status: 'complete' },
    { id: 3, title: 'Utbildningsreformer...', date: '2024-01-13', status: 'complete' },
  ];

  const settings = [
    { id: 'agents', label: 'Aktiva AI-agenter', value: '5/6' },
    { id: 'detail', label: 'Detaljnivå', value: 'Hög' },
    { id: 'language', label: 'Språk', value: 'Svenska' },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div 
            className="text-xl font-bold"
            style={{
              background: 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OneSeek.AI
          </div>
          
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Sök..."
              className="w-64 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-2 pl-10 text-sm text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
            />
            <svg className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-[#151515] border border-[#1a1a1a] text-[#666] hover:text-[#888] hover:border-[#2a2a2a] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="p-2 rounded-lg bg-[#151515] border border-[#1a1a1a] text-[#666] hover:text-[#888] hover:border-[#2a2a2a] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Din fråga</div>
                <h2 className="text-xl text-[#e7e7e7]">
                  Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
                </h2>
              </div>

              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎯</span>
                  <span className="text-xs text-[#666] uppercase tracking-wider">Konsensusanalys</span>
                </div>
                <div className="text-[#c0c0c0] leading-relaxed space-y-4">
                  <p>
                    Baserat på omfattande analys från flera AI-modeller och verifierade källor identifieras följande prioriterade åtgärder:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚡</span>
                        <h4 className="text-[#e7e7e7] font-medium">Transport</h4>
                      </div>
                      <p className="text-sm text-[#888]">
                        Elektrifiering och utbyggnad av laddinfrastruktur
                      </p>
                      <div className="mt-2">
                        <button 
                          onClick={() => setSidebarMode('sources')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          3 källor →
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🌱</span>
                        <h4 className="text-[#e7e7e7] font-medium">Energi</h4>
                      </div>
                      <p className="text-sm text-[#888]">
                        Utbyggnad av sol- och vindkraft
                      </p>
                      <div className="mt-2">
                        <button 
                          onClick={() => setSidebarMode('sources')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          2 källor →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[#1a1a1a] p-6">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                placeholder="Ställ en följdfråga..."
                className="flex-1 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
              />
              <button className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-[#e7e7e7] transition-colors">
                Skicka
              </button>
            </div>
          </div>
        </div>

        {/* Contextual Sidebar */}
        <div className={`bg-[#0a0a0a] border-l border-[#1a1a1a] transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-80'
        } overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-4">
            <div className="flex gap-1">
              <button
                onClick={() => setSidebarMode('sources')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  sidebarMode === 'sources' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
                }`}
              >
                Källor
              </button>
              <button
                onClick={() => setSidebarMode('history')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  sidebarMode === 'history' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
                }`}
              >
                Historik
              </button>
              <button
                onClick={() => setSidebarMode('settings')}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  sidebarMode === 'settings' ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'text-[#666] hover:text-[#888]'
                }`}
              >
                Inställningar
              </button>
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-[#1a1a1a] text-[#666]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Sources Mode */}
            {sidebarMode === 'sources' && (
              <div className="space-y-3">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-4">
                  Verifierade Källor ({sources.length})
                </div>
                {sources.map(source => (
                  <div key={source.id} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm text-[#e7e7e7] font-medium pr-2">{source.title}</h4>
                      {source.verified && (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-[#666] mb-2">{source.url}</div>
                    
                    {expandedSource === source.id && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                        <p className="text-xs text-[#888] leading-relaxed mb-3">{source.summary}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#666]">Tillförlitlighet</span>
                          <span className="text-xs text-[#e7e7e7] font-medium">{source.reliability}%</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      {expandedSource === source.id ? 'Dölj detaljer' : 'Visa detaljer'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* History Mode */}
            {sidebarMode === 'history' && (
              <div className="space-y-3">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-4">
                  Senaste konversationer
                </div>
                {history.map(item => (
                  <div key={item.id} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] cursor-pointer transition-colors">
                    <div className="text-sm text-[#e7e7e7] mb-1">{item.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#666]">{item.date}</span>
                      <span className="text-xs text-green-500">✓ Klar</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Settings Mode */}
            {sidebarMode === 'settings' && (
              <div className="space-y-4">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-4">
                  Agentinställningar
                </div>
                {settings.map(setting => (
                  <div key={setting.id} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#888]">{setting.label}</span>
                      <span className="text-sm text-[#e7e7e7] font-medium">{setting.value}</span>
                    </div>
                    <button className="text-xs text-blue-400 hover:text-blue-300">
                      Ändra
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapsed Sidebar Toggle */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-1/2 right-0 -translate-y-1/2 bg-[#151515] border border-[#1a1a1a] rounded-l-lg p-2 text-[#666] hover:text-[#888]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
