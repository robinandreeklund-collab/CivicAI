import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * LoginPage Component - Logga in
 * Login with seed phrase or public key
 */
export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('seedphrase'); // 'seedphrase' or 'publickey'
  const [seedPhrase, setSeedPhrase] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      // Hash the input for lookup
      let lookupKey;
      if (loginMethod === 'seedphrase') {
        if (!seedPhrase.trim()) {
          throw new Error('Ange din seed phrase');
        }
        // Hash seed phrase to match stored hash
        const encoder = new TextEncoder();
        const data = encoder.encode(seedPhrase.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        lookupKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        if (!publicKey.trim()) {
          throw new Error('Ange din publika nyckel');
        }
        // Hash public key for lookup
        const encoder = new TextEncoder();
        const data = encoder.encode(publicKey.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        lookupKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Try to find user by public key hash
      const response = await fetch(`${API_BASE_URL}/api/users/by-key/${lookupKey}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Kontot hittades inte. Kontrollera dina uppgifter.');
      }

      // Login successful
      login({
        userId: result.user.userId,
        publicKey: result.user.publicKey,
        publicKeyHash: result.user.publicKeyHash,
        profileType: result.user.profileType,
        agentConfig: result.user.agentConfig,
        accountStatus: result.user.accountStatus,
        ledgerBlockId: result.user.ledgerBlockId,
        role: result.user.role // Include role for admin access
      });

      // Navigate to homepage
      navigate('/');

    } catch (error) {
      console.error('[Login] Error:', error);
      setError(error.message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[600px] mx-auto pb-8">
          {/* Header */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Logga in
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              Logga in med din seed phrase eller publika nyckel.
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Method Selector */}
              <div>
                <label className="text-sm text-[#666] mb-3 block">Inloggningsmetod</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('seedphrase')}
                    className={`py-3 px-4 rounded-lg border transition-all duration-200 ${
                      loginMethod === 'seedphrase'
                        ? 'bg-[#e7e7e7] text-[#0a0a0a] border-[#e7e7e7]'
                        : 'bg-[#0a0a0a] text-[#888] border-[#2a2a2a] hover:border-[#444]'
                    }`}
                  >
                    Seed Phrase
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('publickey')}
                    className={`py-3 px-4 rounded-lg border transition-all duration-200 ${
                      loginMethod === 'publickey'
                        ? 'bg-[#e7e7e7] text-[#0a0a0a] border-[#e7e7e7]'
                        : 'bg-[#0a0a0a] text-[#888] border-[#2a2a2a] hover:border-[#444]'
                    }`}
                  >
                    Publik Nyckel
                  </button>
                </div>
              </div>

              {/* Input Field */}
              <div>
                {loginMethod === 'seedphrase' ? (
                  <div>
                    <label className="text-sm text-[#666] mb-2 block">Seed Phrase (12 ord)</label>
                    <textarea
                      value={seedPhrase}
                      onChange={(e) => setSeedPhrase(e.target.value)}
                      placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#e7e7e7] font-mono text-sm h-24 resize-none focus:border-[#444] focus:outline-none"
                      required
                    />
                    <p className="text-xs text-[#666] mt-2">Ange dina 12 ord separerade med mellanslag</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-[#666] mb-2 block">Publik Nyckel</label>
                    <input
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="pk_30820122300d06092a864886..."
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#e7e7e7] font-mono text-sm focus:border-[#444] focus:outline-none"
                      required
                    />
                    <p className="text-xs text-[#666] mt-2">Ange din kompletta publika nyckel (börjar med pk_)</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[#ff9800]/10 border border-[#ff9800] rounded-lg p-4">
                  <p className="text-[#ff9800] text-sm">⚠️ {error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Loggar in...' : 'Logga in'}
              </button>

              {/* Link to Signup */}
              <div className="text-center pt-4">
                <p className="text-sm text-[#666]">
                  Inget konto?{' '}
                  <Link to="/skapa-konto" className="text-[#e7e7e7] hover:text-white transition-colors">
                    Skapa konto
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Security Note */}
          <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-lg font-light text-[#e7e7e7] mb-3">🔒 Säkerhet</h3>
            <div className="space-y-2 text-sm text-[#888]">
              <p>• Din seed phrase eller nyckel används bara för att hitta ditt konto</p>
              <p>• Vi lagrar aldrig din seed phrase i klartext</p>
              <p>• All verifiering sker lokalt i din browser</p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
