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
  onExportConversations,
  isCollapsed = false,
  onToggleCollapse,
  lastAiMessage = null
}) {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-civic-dark-900 border-r border-civic-dark-700/50
        flex flex-col transition-all duration-300 ease-in-out z-30
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header with Logo - Variant 4: Glow Pulse */}
      <div className="flex items-center justify-between p-5 border-b border-civic-dark-700/50">
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
              className="p-1 rounded hover:bg-civic-dark-800 transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-civic-dark-800 transition-colors mx-auto"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full px-5 py-3 rounded-lg bg-gradient-to-br from-civic-gray-700 to-civic-gray-800 hover:from-civic-gray-600 hover:to-civic-gray-700 border border-civic-gray-600 text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg"
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
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
                Historik
              </div>
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-600 italic px-3 py-4">
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
                          ? 'bg-civic-gray-800 text-gray-100'
                          : 'text-gray-400 hover:bg-civic-dark-800 hover:text-gray-200'
                        }
                      `}
                    >
                      <div className="truncate">{conv.title || 'Untitled conversation'}</div>
                      {conv.timestamp && (
                        <div className="text-xs text-gray-600 mt-0.5">
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
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
                Verktyg
              </div>
              <div className="space-y-1">
                <Link
                  to="/policy-questions"
                  className={`
                    w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3
                    ${location.pathname === '/policy-questions'
                      ? 'bg-civic-gray-800 text-gray-100'
                      : 'text-gray-400 hover:bg-civic-dark-800 hover:text-gray-200'
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
                      ? 'bg-civic-gray-800 text-gray-100'
                      : 'text-gray-400 hover:bg-civic-dark-800 hover:text-gray-200'
                    }
                  `}
                >
                  <span>Audit Trail</span>
                </Link>

                {lastAiMessage && (
                  <button
                    onClick={() => setShowExportPanel(!showExportPanel)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-civic-dark-800 hover:text-gray-200 transition-all duration-200 flex items-center gap-3"
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
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-civic-dark-900 rounded-2xl border border-civic-dark-700 shadow-2xl">
            <div className="sticky top-0 bg-civic-dark-900 border-b border-civic-dark-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-100">Exportera jämförelse</h2>
              <button
                onClick={() => setShowExportPanel(false)}
                className="p-2 rounded-lg hover:bg-civic-dark-800 text-gray-400 hover:text-gray-200 transition-colors"
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
