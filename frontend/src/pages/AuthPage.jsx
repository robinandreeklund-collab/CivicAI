import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FooterDemo4 from '../components/footers/FooterDemo4';
import SignupFlow from '../components/auth/SignupFlow';
import LoginFlow from '../components/auth/LoginFlow';

/**
 * AuthPage Component - Authentication with animated tab switcher
 * Combines signup and login with smooth transitions
 */
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signup'); // 'signup' or 'login'
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  const handleSignupSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1400px] mx-auto pb-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            
            {/* Animated Tab Switcher */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-1 inline-flex">
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'signup'
                      ? 'bg-[#e7e7e7] text-[#0a0a0a] shadow-lg'
                      : 'text-[#666] hover:text-[#e7e7e7]'
                  }`}
                >
                  Skapa konto
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'login'
                      ? 'bg-[#e7e7e7] text-[#0a0a0a] shadow-lg'
                      : 'text-[#666] hover:text-[#e7e7e7]'
                  }`}
                >
                  Logga in
                </button>
              </div>
            </div>

            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7] text-center">
              {activeTab === 'signup' ? 'Skapa konto' : 'Logga in'}
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed text-center mx-auto">
              {activeTab === 'signup' 
                ? 'Anonymt kontoskapande med fullständig integritet och transparens.'
                : 'Logga in med din seed phrase eller publika nyckel.'
              }
            </p>
          </div>

          {/* Animated Content */}
          <div className="relative min-h-[600px]">
            <div 
              className={`absolute inset-0 transition-all duration-500 ${
                activeTab === 'signup' 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-8 pointer-events-none'
              }`}
            >
              <SignupFlow onSuccess={handleSignupSuccess} />
            </div>
            
            <div 
              className={`absolute inset-0 transition-all duration-500 ${
                activeTab === 'login' 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-8 pointer-events-none'
              }`}
            >
              <LoginFlow onSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
