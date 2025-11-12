import { useState } from 'react';
import AnimatedLogo from './AnimatedLogo';

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
  onToggleCollapse
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

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
                <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  CivicAI
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

      {/* New Conversation Button */}
      {!isCollapsed && (
        <div className="p-3">
          <button
            onClick={onNewConversation}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ny konversation</span>
          </button>
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
                        {new Date(conv.timestamp).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Menu at Bottom */}
      {!isCollapsed && conversations.length > 0 && (
        <div className="p-3 border-t border-civic-dark-700/50">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full px-4 py-2 rounded-lg bg-civic-dark-800 hover:bg-civic-dark-700 text-gray-300 text-sm font-medium transition-all duration-200 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportera</span>
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-civic-dark-800 rounded-lg shadow-xl border border-civic-dark-700 overflow-hidden animate-fade-in">
                <button
                  onClick={handleExportYAML}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-civic-dark-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportera som YAML</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-civic-dark-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Exportera som JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
