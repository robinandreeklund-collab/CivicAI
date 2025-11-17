import { useState } from 'react';

/**
 * ChatViewConcept1: Minimalist Header with Floating Insight Panel
 * 
 * Design Philosophy:
 * - Ultra-minimal header with logo, status indicator, and hamburger menu
 * - Floating insight module that can be dragged and positioned
 * - Main chat area takes center stage with clean, focused interface
 * - Real-time transparency indicators show processing status
 * - Contextual sidebar slides in from right for history and settings
 */

export default function ChatViewConcept1() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [insightPanelPosition, setInsightPanelPosition] = useState({ x: 20, y: 100 });
  const [showHistory, setShowHistory] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, complete

  // Mock data
  const mockConversations = [
    { id: 1, title: 'Klimatpolitiska åtgärder...', timestamp: '2024-01-15' },
    { id: 2, title: 'Ekonomisk politik och inflation...', timestamp: '2024-01-14' },
    { id: 3, title: 'Utbildningsreformer i Sverige...', timestamp: '2024-01-13' },
  ];

  const mockInsights = {
    confidence: 87,
    bias: 'Låg',
    sources: 5,
    factChecked: true,
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Minimalist Header */}
      <header className="h-14 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div 
            className="text-lg font-bold tracking-tight"
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
        </div>

        {/* Center - Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            processingStatus === 'processing' ? 'bg-blue-500 animate-pulse' :
            processingStatus === 'complete' ? 'bg-green-500' :
            'bg-gray-600'
          }`} />
          <span className="text-xs text-[#666] uppercase tracking-wider">
            {processingStatus === 'processing' ? 'Analyserar' :
             processingStatus === 'complete' ? 'Klar' : 'Redo'}
          </span>
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded hover:bg-[#1a1a1a] transition-colors"
        >
          <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* User Question */}
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Din fråga</div>
                <div className="text-[#e7e7e7] text-lg">
                  Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
                </div>
              </div>

              {/* AI Response */}
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🤖</span>
                  <span className="text-xs text-[#666] uppercase tracking-wider">Konsensussvar</span>
                </div>
                <div className="text-[#c0c0c0] leading-relaxed">
                  Baserat på analys från flera AI-modeller är de viktigaste klimatpolitiska åtgärderna:
                  <ul className="mt-3 space-y-2 ml-4">
                    <li>• Elektrifiering av transportsektorn</li>
                    <li>• Utbyggnad av förnybar energi</li>
                    <li>• Energieffektivisering i byggnader</li>
                    <li>• Hållbar industriomställning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-[#1a1a1a] p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ställ en fråga..."
                  className="flex-1 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none focus:border-[#2a2a2a]"
                />
                <button className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] rounded-lg text-[#e7e7e7] transition-colors">
                  Skicka
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Insight Panel */}
        <div
          className="absolute bg-[#151515] border border-[#2a2a2a] rounded-lg p-4 shadow-2xl"
          style={{
            left: `${insightPanelPosition.x}px`,
            top: `${insightPanelPosition.y}px`,
            width: '280px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#666] uppercase tracking-wider">Insyn</div>
            <button className="text-[#666] hover:text-[#888]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Tillförlitlighet</span>
              <span className="text-sm text-[#e7e7e7] font-medium">{mockInsights.confidence}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Bias-nivå</span>
              <span className="text-sm text-[#e7e7e7]">{mockInsights.bias}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Källor</span>
              <span className="text-sm text-[#e7e7e7]">{mockInsights.sources}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Faktakollad</span>
              <span className="text-sm text-green-500">✓</span>
            </div>
          </div>

          <button 
            onClick={() => setShowHistory(true)}
            className="w-full mt-4 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-xs text-[#e7e7e7] transition-colors"
          >
            Visa detaljer
          </button>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
              <span className="text-xs text-[#666] uppercase tracking-wider">Historik</span>
              <button onClick={() => setShowHistory(false)} className="text-[#666] hover:text-[#888]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mockConversations.map(conv => (
                <div key={conv.id} className="p-3 bg-[#151515] border border-[#1a1a1a] rounded-lg hover:border-[#2a2a2a] cursor-pointer transition-colors">
                  <div className="text-sm text-[#e7e7e7] mb-1 truncate">{conv.title}</div>
                  <div className="text-xs text-[#666]">{conv.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-14 right-6 bg-[#151515] border border-[#1a1a1a] rounded-lg shadow-2xl py-2 min-w-[200px] z-50">
          <button className="w-full px-4 py-2 text-left text-sm text-[#e7e7e7] hover:bg-[#1a1a1a] transition-colors">
            Ny konversation
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-[#e7e7e7] hover:bg-[#1a1a1a] transition-colors">
            Inställningar
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-[#e7e7e7] hover:bg-[#1a1a1a] transition-colors">
            Exportera
          </button>
          <div className="border-t border-[#1a1a1a] my-2" />
          <button className="w-full px-4 py-2 text-left text-sm text-[#e7e7e7] hover:bg-[#1a1a1a] transition-colors">
            Om OneSeek.AI
          </button>
        </div>
      )}
    </div>
  );
}
