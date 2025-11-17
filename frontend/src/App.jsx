import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import PolicyQuestionBankPage from './pages/PolicyQuestionBankPage';
import AuditTrailPage from './pages/AuditTrailPage';
import AboutPage from './pages/AboutPage';
import PolicyPage from './pages/PolicyPage';
import ZeroTrackingPage from './pages/ZeroTrackingPage';
import ContactPage from './pages/ContactPage';
import PipelinePage from './pages/PipelinePage';
import FeaturesPage from './pages/FeaturesPage';

/**
 * Main OneSeek.AI Application
 * Split layout landing page with chat interface and routing
 */
function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [lastAiMessage, setLastAiMessage] = useState(null);
  const location = useLocation();

  // Check if we're on a route that should show the sidebar
  const showSidebar = location.pathname !== '/';

  const handleNewConversation = () => {
    const newConvId = Date.now().toString();
    setCurrentConversationId(newConvId);
    // Clear any existing conversation data when starting new
    setLastAiMessage(null);
  };

  const handleSelectConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
  };

  const handleExportConversations = (format) => {
    // Export functionality handled in components
    console.log('Export', format);
  };

  const handleAiMessageUpdate = (message) => {
    setLastAiMessage(message);
    
    // Add conversation to history if it has a question
    if (message && message.question && currentConversationId) {
      setConversations(prev => {
        // Check if conversation already exists
        const existingIndex = prev.findIndex(c => c.id === currentConversationId);
        
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            title: message.question.substring(0, 50) + (message.question.length > 50 ? '...' : ''),
            timestamp: new Date().toISOString(),
          };
          return updated;
        } else {
          // Add new conversation
          return [{
            id: currentConversationId,
            title: message.question.substring(0, 50) + (message.question.length > 50 ? '...' : ''),
            timestamp: new Date().toISOString(),
          }, ...prev];
        }
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar - only shown on non-landing and non-chat pages */}
      {showSidebar && location.pathname !== '/chat' && (
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          lastAiMessage={location.pathname === '/chat' ? lastAiMessage : null}
        />
      )}

      {/* Main Content Area */}
      <div 
        className={`
          flex-1 flex flex-col relative overflow-hidden transition-all duration-300
          ${showSidebar && location.pathname !== '/chat' ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''}
        `}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/chat" 
            element={
              <HomePage 
                onAiMessageUpdate={handleAiMessageUpdate} 
                conversationId={currentConversationId}
              />
            } 
          />
          <Route path="/policy-questions" element={<PolicyQuestionBankPage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/zero-tracking" element={<ZeroTrackingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/features" element={<FeaturesPage />} />
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
