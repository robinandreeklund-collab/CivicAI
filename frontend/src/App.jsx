import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import PolicyQuestionBankPage from './pages/PolicyQuestionBankPage';
import AuditTrailPage from './pages/AuditTrailPage';

/**
 * Main CivicAI Application
 * Grok-inspired chat interface with sidebar and routing
 */
function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  const handleNewConversation = () => {
    setCurrentConversationId(Date.now().toString());
  };

  const handleSelectConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
  };

  const handleExportConversations = (format) => {
    // Export functionality handled in components
    console.log('Export', format);
  };

  return (
    <div className="flex h-screen bg-civic-dark-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onExportConversations={handleExportConversations}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div 
        className={`
          flex-1 flex flex-col relative overflow-hidden transition-all duration-300
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/policy-questions" element={<PolicyQuestionBankPage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
