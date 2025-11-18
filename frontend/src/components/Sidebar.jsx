import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EnhancedExportPanel from './EnhancedExportPanel';

/**
 * Sidebar Component - Updated to match full-ui-demo.html
 * Contains logo with Variant 4: Glow Pulse, search, history, and navigation
 */
export default function Sidebar({ 
  conversations = [], 
  currentConversationId = null,
  onSelectConversation,
  onNewConversation,
  isCollapsed = false,
  onToggleCollapse,
  lastAiMessage = null
}) {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-[#151515] border-r border-[#1a1a1a]
        flex flex-col transition-all duration-300 ease-in-out z-30
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header with Logo - Variant 4: Glow Pulse */}
      <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <style>
                {`
                  @keyframes logoGradient {
                    0%, 100% {
                      background-position: 0% 50%;
                    }
                    50% {
                      background-position: 100% 50%;
                    }
                  }
                `}
              </style>
              <div
                className="text-xl font-bold"
                style={{
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'logoGradient 3s ease-in-out infinite',
                  whiteSpace: 'nowrap',
                }}
              >
                OneSeek.AI
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[#1a1a1a] transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-[#1a1a1a] transition-colors mx-auto"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* New Conversation Button */}
      {!isCollapsed && (
        <div className="p-4">
          <Link
            to="/"
            onClick={onNewConversation}
            className="w-full px-5 py-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] text-[#e7e7e7] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ny konversation</span>
          </Link>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        {!isCollapsed && (
          <>
            {/* History Section */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2 px-3">
                Historik
              </div>
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-sm text-[#666] italic px-3 py-4">
                    Inga tidigare konversationer
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                        ${currentConversationId === conv.id
                          ? 'bg-[#2a2a2a] text-[#e7e7e7]'
                          : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#e7e7e7]'
                        }
                      `}
                    >
                      <div className="truncate">{conv.title || 'Untitled conversation'}</div>
                      {conv.timestamp && (
                        <div className="text-xs text-[#666] mt-0.5">
                          {
                            !isNaN(new Date(conv.timestamp).getTime())
                              ? new Date(conv.timestamp).toLocaleDateString('sv-SE')
                              : 'Invalid date'
                          }
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Tools Section */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2 px-3">
                Verktyg
              </div>
              <div className="space-y-1">
                <Link
                  to="/oqt-dashboard"
                  className={`
                    w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                    ${location.pathname === '/oqt-dashboard'
                      ? 'bg-[#2a2a2a] text-[#e7e7e7]'
                      : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#e7e7e7]'
                    }
                  `}
                >
                  <span>🔍</span>
                  <span>OQT-1.0 Dashboard</span>
                </Link>

                <Link
                  to="/policy-questions"
                  className={`
                    w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                    ${location.pathname === '/policy-questions'
                      ? 'bg-[#2a2a2a] text-[#e7e7e7]'
                      : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#e7e7e7]'
                    }
                  `}
                >
                  <span>Policyfrågebank</span>
                </Link>

                <Link
                  to="/audit-trail"
                  className={`
                    w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                    ${location.pathname === '/audit-trail'
                      ? 'bg-[#2a2a2a] text-[#e7e7e7]'
                      : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#e7e7e7]'
                    }
                  `}
                >
                  <span>Audit Trail</span>
                </Link>

                {lastAiMessage && (
                  <button
                    onClick={() => setShowExportPanel(!showExportPanel)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-[#e7e7e7] transition-all duration-200 flex items-center gap-3"
                  >
                    <span>Exportera</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Export Panel Modal */}
      {showExportPanel && lastAiMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-[#151515] rounded-2xl border border-[#1a1a1a] shadow-2xl">
            <div className="sticky top-0 bg-[#151515] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#e7e7e7]">Exportera jämförelse</h2>
              <button
                onClick={() => setShowExportPanel(false)}
                className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#888] hover:text-[#e7e7e7] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EnhancedExportPanel
                question={lastAiMessage.question}
                responses={lastAiMessage.responses}
                synthesizedSummary={lastAiMessage.synthesizedSummary}
                synthesizedSummaryMetadata={lastAiMessage.synthesizedSummaryMetadata}
                timestamp={lastAiMessage.timestamp}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
