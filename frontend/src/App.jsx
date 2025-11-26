import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ChatV2Page from './pages/ChatV2Page';
import PolicyQuestionBankPage from './pages/PolicyQuestionBankPage';
import AuditTrailPage from './pages/AuditTrailPage';
import AboutPage from './pages/AboutPage';
import PolicyPage from './pages/PolicyPage';
import ZeroTrackingPage from './pages/ZeroTrackingPage';
import ContactPage from './pages/ContactPage';
import PipelinePage from './pages/PipelinePage';
import FeaturesPage from './pages/FeaturesPage';
import LanguageModelPage from './pages/LanguageModelPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import OQTDashboardPage from './pages/OQTDashboardPage';
import DashboardPage from './pages/DashboardPage';
import ApiDocumentationPage from './pages/ApiDocumentationPage';
import LedgerPage from './pages/LedgerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DemoIndex from './designDemos';
import OQIDemo1 from './pages/OQIDemo1';
import OQIDemo2 from './pages/OQIDemo2';
import OQIDemo3 from './pages/OQIDemo3';
import OQIDemo4 from './pages/OQIDemo4';
import OQIDemo5 from './pages/OQIDemo5';
import OQIDemo6 from './pages/OQIDemo6';
import OQIDemo7 from './pages/OQIDemo7';
import OQIDemo8 from './pages/OQIDemo8';
import OQIDemo9 from './pages/OQIDemo9';
import OQIDemo10 from './pages/OQIDemo10';
import OQIDemo10v1 from './pages/OQIDemo10v1';
import OQIDemo10v2 from './pages/OQIDemo10v2';
import OQIDemo10v3 from './pages/OQIDemo10v3';
import OQIDemo10v4 from './pages/OQIDemo10v4';
import OQIDemo10v5 from './pages/OQIDemo10v5';
import OQIDemosIndex from './pages/OQIDemosIndex';

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
  // Sidebar should only show on /chat, /policy-questions, and /audit-trail
  const showSidebar = ['/chat', '/policy-questions', '/audit-trail'].includes(location.pathname);

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
          <Route path="/sprakmodell" element={<LanguageModelPage />} />
          <Route path="/oqt-dashboard" element={<OQTDashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/skapa-konto" element={<SignupPage />} />
          <Route path="/logga-in" element={<LoginPage />} />
          <Route path="/api-docs" element={<ApiDocumentationPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/design-demos" element={<DemoIndex />} />
          <Route path="/chat-v2" element={<ChatV2Page />} />
          <Route path="/oqi-demo-1" element={<OQIDemo1 />} />
          <Route path="/oqi-demo-2" element={<OQIDemo2 />} />
          <Route path="/oqi-demo-3" element={<OQIDemo3 />} />
          <Route path="/oqi-demo-4" element={<OQIDemo4 />} />
          <Route path="/oqi-demo-5" element={<OQIDemo5 />} />
          <Route path="/oqi-demo-6" element={<OQIDemo6 />} />
          <Route path="/oqi-demo-7" element={<OQIDemo7 />} />
          <Route path="/oqi-demo-8" element={<OQIDemo8 />} />
          <Route path="/oqi-demo-9" element={<OQIDemo9 />} />
          <Route path="/oqi-demo-10" element={<OQIDemo10 />} />
          <Route path="/oqi-demo-10-v1" element={<OQIDemo10v1 />} />
          <Route path="/oqi-demo-10-v2" element={<OQIDemo10v2 />} />
          <Route path="/oqi-demo-10-v3" element={<OQIDemo10v3 />} />
          <Route path="/oqi-demo-10-v4" element={<OQIDemo10v4 />} />
          <Route path="/oqi-demo-10-v5" element={<OQIDemo10v5 />} />
          <Route path="/oqi-demos" element={<OQIDemosIndex />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
