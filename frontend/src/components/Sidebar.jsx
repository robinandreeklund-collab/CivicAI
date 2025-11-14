import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AnimatedLogo from './AnimatedLogo';
import EnhancedExportPanel from './EnhancedExportPanel';

/**
 * Sidebar Component - Grok-inspired
 * Contains logo, history, and navigation
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const location = useLocation();

  const handleExportYAML = () => {
    onExportConversations('yaml');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    onExportConversations('json');
    setShowExportMenu(false);
  };

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-civic-dark-900 border-r border-civic-dark-700/50
        flex flex-col transition-all duration-300 ease-in-out z-30
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-civic-dark-700/50">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-3">
              <AnimatedLogo size={32} animated={true} />
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-gray-400 via-gray-100 to-gray-400 bg-clip-text text-transparent">
                  OneSeek.AI
                </h1>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-civic-dark-800 transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-civic-dark-800 transition-colors mx-auto"
            title="Expand sidebar"
          >
            <AnimatedLogo size={24} animated={true} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          <Link
            to="/"
            onClick={onNewConversation}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ny konversation</span>
          </Link>

          <Link
            to="/policy-questions"
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              location.pathname === '/policy-questions'
                ? 'bg-teal-600 text-white'
                : 'bg-civic-dark-800 hover:bg-civic-dark-700 text-gray-300'
            }`}
          >
            <span className="text-lg">📋</span>
            <span>Policyfrågebank</span>
          </Link>

          <Link
            to="/audit-trail"
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              location.pathname === '/audit-trail'
                ? 'bg-indigo-600 text-white'
                : 'bg-civic-dark-800 hover:bg-civic-dark-700 text-gray-300'
            }`}
          >
            <span className="text-lg">📚</span>
            <span>Audit Trail</span>
          </Link>
        </div>
      )}

      {/* History Section */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Historik
            </h2>
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-600 italic px-2 py-4">
                  Inga tidigare konversationer
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${currentConversationId === conv.id
                        ? 'bg-civic-dark-700 text-gray-100'
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
        )}
      </div>

      {/* Export Panel at Bottom */}
      {!isCollapsed && lastAiMessage && (
        <div className="p-3 border-t border-civic-dark-700/50">
          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span className="text-lg">📦</span>
            <span>Exportera jämförelse</span>
          </button>
        </div>
      )}

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
