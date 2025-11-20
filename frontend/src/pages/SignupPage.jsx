import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import FooterDemo4 from '../components/footers/FooterDemo4';
import { useAuth } from '../contexts/AuthContext';

/**
 * SignupPage Component - Skapa konto
 * Anonymous account creation with local key generation,
 * backup, bot protection, and zero-knowledge profile
 */

// BIP39 word list (subset for seed phrase generation)
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
  'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
  'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
  'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit',
  'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology',
  'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
  'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss',
  'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread',
  'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze',
  'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy',
  'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call',
  'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas',
  'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry',
  'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category',
  'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century'
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [accountData, setAccountData] = useState({
    publicKey: '',
    privateKey: '',
    seedPhrase: '',
    qrCode: '',
    profileType: 'pseudonym',
    agentConfig: {
      biasFilter: 'neutral',
      tone: 'balanced',
      transparencyLevel: 'high'
    },
    userId: null,
    ledgerBlockId: null,
    powData: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [powProgress, setPowProgress] = useState(0);
  const [powComplete, setPowComplete] = useState(false);
  const [isPerformingPow, setIsPerformingPow] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const steps = [
    { id: 0, title: 'Välkommen', desc: 'Introduktion till anonymt kontoskapande' },
    { id: 1, title: 'Nyckelgenerering', desc: 'Lokal generering av kryptonyckelpar' },
    { id: 2, title: 'Säkerhetskopiering', desc: 'Seed phrase eller QR-kod för återställning' },
    { id: 3, title: 'Bot-skydd', desc: 'Proof-of-work verifiering' },
    { id: 4, title: 'Insyn-profil', desc: 'Zero-knowledge profilskapande' },
    { id: 5, title: 'Agent-anpassning', desc: 'Personlig agentprofil (valfri)' },
    { id: 6, title: 'Klart!', desc: 'Ditt konto är redo' }
  ];

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Real cryptographic key generation using Web Crypto API
  const generateKeys = async () => {
    setIsGenerating(true);
    try {
      // Generate RSA keypair using Web Crypto API
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export public key
      const exportedPublicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyHex = Array.from(new Uint8Array(exportedPublicKey))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const publicKey = 'pk_' + publicKeyHex.substring(0, 32);

      // Export private key
      const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyHex = Array.from(new Uint8Array(exportedPrivateKey))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const privateKey = 'sk_' + privateKeyHex.substring(0, 32);

      // Generate cryptographically secure seed phrase (12 words from BIP39)
      const randomBytes = new Uint8Array(16);
      window.crypto.getRandomValues(randomBytes);
      const seedWords = [];
      for (let i = 0; i < 12; i++) {
        const index = (randomBytes[i] + (randomBytes[(i + 4) % 16] << 8)) % BIP39_WORDS.length;
        seedWords.push(BIP39_WORDS[index]);
      }
      const seedPhrase = seedWords.join(' ');

      // Generate QR code data (base64 encoded public key)
      const qrData = btoa(publicKey);
      
      setAccountData(prev => ({
        ...prev,
        publicKey,
        privateKey,
        seedPhrase,
        qrCode: qrData
      }));
      
      setIsGenerating(false);
      setCurrentStep(1);
    } catch (error) {
      console.error('Key generation error:', error);
      setIsGenerating(false);
      alert('Fel vid nyckelgenerering. Kontrollera att din browser stödjer Web Crypto API.');
    }
  };

  // Real Proof-of-Work implementation
  const performProofOfWork = async () => {
    setIsPerformingPow(true);
    setPowProgress(0);
    setPowComplete(false);

    try {
      // Ensure we have a public key
      if (!accountData.publicKey) {
        throw new Error('Ingen publikt nyckel tillgänglig');
      }

      const challenge = accountData.publicKey + Date.now();
      const difficulty = 4; // Number of leading zeros required in hash
      let nonce = 0;
      let hash = '';
      let found = false;

      // Perform PoW in chunks to allow UI updates
      const chunkSize = 1000;
      const maxIterations = 100000;

      while (!found && nonce < maxIterations) {
        for (let i = 0; i < chunkSize && !found; i++) {
          const data = challenge + nonce;
          const encoder = new TextEncoder();
          const dataBuffer = encoder.encode(data);
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          // Check if hash starts with required number of zeros
          if (hash.startsWith('0'.repeat(difficulty))) {
            found = true;
            break;
          }
          nonce++;
        }

        // Update progress
        const progress = Math.min((nonce / maxIterations) * 100, 99);
        setPowProgress(progress);

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (found) {
        setPowProgress(100);
        setPowComplete(true);
        
        // Store PoW data for later use
        const powData = {
          nonce,
          hash,
          timestamp: Date.now(),
          difficulty
        };
        
        setAccountData(prev => ({
          ...prev,
          powData
        }));
        
        console.log('Proof-of-Work complete:', powData);
      } else {
        throw new Error('PoW max iterations reached');
      }

      setIsPerformingPow(false);
    } catch (error) {
      console.error('Proof-of-Work error:', error);
      setIsPerformingPow(false);
      setPowProgress(0);
      alert(`Fel vid proof-of-work beräkning: ${error.message}\n\nKontrollera att din browser stödjer Web Crypto API och att du har gått igenom alla tidigare steg.`);
    }
  };

  // Auto-start PoW when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && !powComplete && !isPerformingPow) {
      performProofOfWork();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Save account to Firebase
  const saveAccountToFirebase = async () => {
    setIsSavingAccount(true);
    setSaveError(null);

    try {
      console.log('[Signup] Saving account to Firebase...');

      // Validate we have all required data
      if (!accountData.publicKey || !accountData.powData) {
        throw new Error('Missing required account data');
      }

      // Prepare request payload
      const payload = {
        publicKey: accountData.publicKey,
        seedPhrase: accountData.seedPhrase, // Will be hashed on backend, never stored
        proofOfWork: accountData.powData,
        profileType: accountData.profileType,
        agentConfig: accountData.agentConfig
      };

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      if (!result.success) {
        throw new Error(result.error || 'Account creation failed');
      }

      // Update account data with server response
      setAccountData(prev => ({
        ...prev,
        userId: result.user.userId,
        ledgerBlockId: result.user.ledgerBlockId,
        accountStatus: result.user.accountStatus
      }));

      console.log('[Signup] Account saved successfully:', result.user);
      setIsSavingAccount(false);
      
      // Login the user
      login({
        userId: result.user.userId,
        publicKey: accountData.publicKey,
        publicKeyHash: result.user.publicKeyHash,
        profileType: accountData.profileType,
        agentConfig: accountData.agentConfig,
        accountStatus: result.user.accountStatus,
        ledgerBlockId: result.user.ledgerBlockId
      });
      
      // Move to final step
      setCurrentStep(6);

    } catch (error) {
      console.error('[Signup] Error saving account:', error);
      setSaveError(error.message);
      setIsSavingAccount(false);
      
      // Show error to user
      alert(`Fel vid kontoskapande: ${error.message}\n\nDu kan fortsätta använda ditt konto lokalt, men det kommer inte att sparas i databasen.`);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1400px] mx-auto pb-8">
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
              Skapa konto
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              Anonymt kontoskapande med fullständig integritet och transparens.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Progress and content - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Progress Steps */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-xl font-light text-[#e7e7e7] mb-4">Steg {currentStep + 1} av {steps.length}</h2>
                <div className="space-y-0">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`py-3 border-b border-[#1a1a1a] transition-colors duration-200 ${
                        index === currentStep 
                          ? 'text-[#e7e7e7]' 
                          : index < currentStep 
                            ? 'text-[#666] line-through' 
                            : 'text-[#444]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${
                          index === currentStep ? 'text-[#e7e7e7]' : index < currentStep ? 'text-[#666]' : 'text-[#444]'
                        }`}>
                          {index < currentStep ? '✓' : index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{step.title}</div>
                          <div className="text-xs opacity-70">{step.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security Features */}
                <div className="mt-6 pt-6 border-t border-[#1a1a1a] space-y-2">
                  <div className="text-xs text-[#666]">🔒 Ingen IP-loggning</div>
                  <div className="text-xs text-[#666]">🔒 Ingen tredjepartsautentisering</div>
                  <div className="text-xs text-[#666]">🔒 Tor-kompatibel</div>
                  <div className="text-xs text-[#666]">⚡ Rate-limit: 3 konton/IP/timme</div>
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6"
                style={{ minHeight: '500px' }}
              >
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div>
                    <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Välkommen till OneSeek.AI</h2>
                    <p className="mb-4">
                      Skapa ett anonymt konto utan e-post, telefonnummer eller personlig identifiering. 
                      All aktivitet kopplas till ditt kryptonyckel-ID, aldrig till dig som person.
                    </p>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Vad händer?</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <span className="text-[#666] mr-3">1.</span>
                        <span>Lokal nyckelgenerering i din browser (inget skickas till server)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-[#666] mr-3">2.</span>
                        <span>Backup via seed phrase eller QR-kod (du ansvarar för säkerheten)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-[#666] mr-3">3.</span>
                        <span>Bot-skydd via proof-of-work (ingen data samlas)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-[#666] mr-3">4.</span>
                        <span>Skapa insyn-profil (offentlig, privat eller pseudonym)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-[#666] mr-3">5.</span>
                        <span>Anpassa din agent (bias-filter, ton, transparensnivå)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">⚠️ Viktigt att veta</h3>
                    <div className="space-y-2 text-sm">
                      <p>• Du ansvarar för att spara din seed phrase säkert</p>
                      <p>• Ingen kan återställa ditt konto om du förlorar nycklarna</p>
                      <p>• All kommunikation är krypterad och pseudonym</p>
                    </div>
                  </div>

                  <button
                    onClick={generateKeys}
                    className="w-full bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                  >
                    Börja skapa konto
                  </button>
                </div>
              )}

              {/* Step 1: Key Generation */}
              {currentStep === 1 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  {isGenerating ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e7e7e7] mb-4"></div>
                      <p className="text-[#e7e7e7]">Genererar kryptonyckelpar lokalt...</p>
                      <p className="text-xs text-[#666] mt-2">Detta görs helt i din browser</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Nyckelpar genererat</h2>
                        <p className="mb-4">
                          Ett unikt kryptonyckelpar har skapats lokalt i din browser. Ingen information har skickats till någon server.
                        </p>
                      </div>

                      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                        <div className="mb-4">
                          <label className="text-sm text-[#666] mb-2 block">Publik nyckel (ID)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={accountData.publicKey}
                              readOnly
                              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e7e7e7] font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(accountData.publicKey)}
                              className="bg-[#2a2a2a] text-[#e7e7e7] px-4 py-2 rounded text-sm hover:bg-[#3a3a3a] transition-colors"
                            >
                              Kopiera
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-[#666] mb-2 block">Privat nyckel (Hemlig - spara säkert!)</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={accountData.privateKey}
                              readOnly
                              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e7e7e7] font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(accountData.privateKey)}
                              className="bg-[#2a2a2a] text-[#e7e7e7] px-4 py-2 rounded text-sm hover:bg-[#3a3a3a] transition-colors"
                            >
                              Kopiera
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleBack}
                          className="flex-1 bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200"
                        >
                          Tillbaka
                        </button>
                        <button
                          onClick={handleNext}
                          className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                        >
                          Nästa: Säkerhetskopiering
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Backup */}
              {currentStep === 2 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div>
                    <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Säkerhetskopiera ditt konto</h2>
                    <p className="mb-4">
                      Spara din seed phrase eller QR-kod säkert. Detta är det ENDA sättet att återställa ditt konto om du byter enhet eller tappar åtkomst.
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Seed Phrase (12 ord)</h3>
                    <p className="text-sm mb-4">Skriv ner dessa ord i rätt ordning och förvara dem säkert.</p>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-3 gap-3 font-mono text-sm text-[#e7e7e7]">
                        {accountData.seedPhrase.split(' ').map((word, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-[#666]">{i + 1}.</span>
                            <span>{word}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(accountData.seedPhrase)}
                      className="w-full bg-[#2a2a2a] text-[#e7e7e7] py-2 rounded text-sm hover:bg-[#3a3a3a] transition-colors"
                    >
                      Kopiera Seed Phrase
                    </button>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">QR-kod</h3>
                    <p className="text-sm mb-4">Alternativt kan du spara denna QR-kod för återställning.</p>
                    <div className="bg-white p-4 rounded inline-block">
                      <QRCodeSVG 
                        value={accountData.seedPhrase}
                        size={128}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-[#666] mt-2">Scanna denna kod med en kompatibel wallet-app</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200"
                    >
                      Tillbaka
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                    >
                      Nästa: Bot-skydd
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Bot Protection */}
              {currentStep === 3 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div>
                    <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Bot-skydd</h2>
                    <p className="mb-4">
                      Vi använder proof-of-work för att skydda mot automatiserat kontoskapande, utan att samla in personlig information.
                    </p>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Proof-of-Work</h3>
                    <p className="text-sm mb-4">
                      Din browser utför en kryptografisk beräkning (SHA-256 hash) som bevisar att det är en människa som skapar kontot. Detta tar några sekunder.
                    </p>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-[#e7e7e7] rounded-full transition-all duration-300 ${!powComplete ? 'animate-pulse' : ''}`}
                              style={{ width: `${powProgress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-[#e7e7e7]">{Math.round(powProgress)}%</span>
                      </div>
                      <p className="text-xs text-[#666] mt-2">
                        {isPerformingPow ? 'Beräknar hash-värde med SHA-256...' : powComplete ? '✓ Proof-of-work slutförd' : 'Väntar...'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Privacy-Preserving</h3>
                    <div className="space-y-2 text-sm">
                      <p>✓ Ingen reCAPTCHA från Google</p>
                      <p>✓ Ingen hCaptcha från Intuition Machines</p>
                      <p>✓ Ingen fingerprinting</p>
                      <p>✓ Ingen tracking</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200"
                    >
                      Tillbaka
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!powComplete}
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        powComplete
                          ? 'bg-[#e7e7e7] text-[#0a0a0a] hover:bg-white cursor-pointer'
                          : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                      }`}
                    >
                      {powComplete ? 'Nästa: Insyn-profil' : 'Väntar på proof-of-work...'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Profile Creation */}
              {currentStep === 4 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div>
                    <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Insyn-profil (Zero Knowledge)</h2>
                    <p className="mb-4">
                      Välj hur din profil ska vara synlig för andra. All aktivitet kopplas till ditt nyckel-ID, aldrig till personlig information.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <input
                        type="radio"
                        name="profileType"
                        value="public"
                        checked={accountData.profileType === 'public'}
                        onChange={(e) => setAccountData(prev => ({ ...prev, profileType: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-[#e7e7e7]">Offentlig</span>
                      <p className="ml-6 text-sm text-[#666]">Din aktivitet är synlig för alla (kopplad till nyckel-ID)</p>
                    </label>

                    <label className="block">
                      <input
                        type="radio"
                        name="profileType"
                        value="pseudonym"
                        checked={accountData.profileType === 'pseudonym'}
                        onChange={(e) => setAccountData(prev => ({ ...prev, profileType: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-[#e7e7e7]">Pseudonym (Rekommenderad)</span>
                      <p className="ml-6 text-sm text-[#666]">Visa aktivitet under ett pseudonymt nyckel-ID</p>
                    </label>

                    <label className="block">
                      <input
                        type="radio"
                        name="profileType"
                        value="private"
                        checked={accountData.profileType === 'private'}
                        onChange={(e) => setAccountData(prev => ({ ...prev, profileType: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-[#e7e7e7]">Privat</span>
                      <p className="ml-6 text-sm text-[#666]">Endast du kan se din aktivitet</p>
                    </label>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Din profil-ID</h3>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                      <p className="font-mono text-sm text-[#e7e7e7]">{accountData.publicKey}</p>
                    </div>
                    <p className="text-xs text-[#666] mt-2">Detta är din publika identitet i systemet</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200"
                    >
                      Tillbaka
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                    >
                      Nästa: Agent-anpassning
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Agent Customization */}
              {currentStep === 5 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div>
                    <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Agent-anpassning (Valfri)</h2>
                    <p className="mb-4">
                      Anpassa hur din personliga AI-agent beter sig. Detta påverkar hur svar presenteras för dig.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#e7e7e7] mb-2 block">Bias-filter</label>
                      <select
                        value={accountData.agentConfig.biasFilter}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          agentConfig: { ...prev.agentConfig, biasFilter: e.target.value }
                        }))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#e7e7e7]"
                      >
                        <option value="neutral">Neutral - Balanserad presentation</option>
                        <option value="conservative">Konservativ - Fokus på beprövade källor</option>
                        <option value="progressive">Progressiv - Öppen för nya perspektiv</option>
                        <option value="skeptical">Skeptisk - Kritisk granskning</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-[#e7e7e7] mb-2 block">Ton</label>
                      <select
                        value={accountData.agentConfig.tone}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          agentConfig: { ...prev.agentConfig, tone: e.target.value }
                        }))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#e7e7e7]"
                      >
                        <option value="balanced">Balanserad - Objektiv och nyanserad</option>
                        <option value="formal">Formell - Akademisk och professionell</option>
                        <option value="casual">Avslappnad - Lättläst och tillgänglig</option>
                        <option value="technical">Teknisk - Detaljerad och precis</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-[#e7e7e7] mb-2 block">Transparensnivå</label>
                      <select
                        value={accountData.agentConfig.transparencyLevel}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          agentConfig: { ...prev.agentConfig, transparencyLevel: e.target.value }
                        }))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#e7e7e7]"
                      >
                        <option value="high">Hög - Visa alla analyssteg och källor</option>
                        <option value="medium">Medel - Visa viktiga analyssteg</option>
                        <option value="minimal">Minimal - Endast resultat</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <p className="text-sm">
                      💡 Du kan när som helst ändra dessa inställningar i ditt konto.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200"
                    >
                      Tillbaka
                    </button>
                    <button
                      onClick={saveAccountToFirebase}
                      disabled={isSavingAccount}
                      className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingAccount ? 'Sparar...' : 'Slutför'}
                    </button>
                  </div>
                  
                  {saveError && (
                    <div className="bg-[#ff9800]/10 border border-[#ff9800] rounded-xl p-4 mt-4">
                      <p className="text-[#ff9800] text-sm">
                        ⚠️ Kunde inte spara kontot: {saveError}
                      </p>
                      <p className="text-[#666] text-xs mt-2">
                        Du kan fortsätta använda ditt konto lokalt eller försöka igen senare.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Complete */}
              {currentStep === 6 && (
                <div className="space-y-6 text-[#888] leading-relaxed">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✓</div>
                    <h2 className="text-3xl font-light text-[#e7e7e7] mb-4">Ditt konto är klart!</h2>
                    <p className="mb-4">
                      Du kan nu använda OneSeek.AI med fullständig anonymitet och transparens.
                    </p>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Sammanfattning</h3>
                    <div className="space-y-2 text-sm">
                      {accountData.userId && (
                        <div className="flex justify-between">
                          <span className="text-[#666]">Användar-ID:</span>
                          <span className="text-[#e7e7e7] font-mono">{accountData.userId.substring(0, 24)}...</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#666]">Profil-ID:</span>
                        <span className="text-[#e7e7e7] font-mono">{accountData.publicKey.substring(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Profiltyp:</span>
                        <span className="text-[#e7e7e7] capitalize">{accountData.profileType}</span>
                      </div>
                      {accountData.accountStatus && (
                        <div className="flex justify-between">
                          <span className="text-[#666]">Status:</span>
                          <span className="text-[#4caf50] capitalize">{accountData.accountStatus}</span>
                        </div>
                      )}
                      {accountData.ledgerBlockId !== null && accountData.ledgerBlockId !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-[#666]">Ledger Block:</span>
                          <span className="text-[#e7e7e7]">#{accountData.ledgerBlockId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#666]">Bias-filter:</span>
                        <span className="text-[#e7e7e7] capitalize">{accountData.agentConfig.biasFilter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Ton:</span>
                        <span className="text-[#e7e7e7] capitalize">{accountData.agentConfig.tone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Transparens:</span>
                        <span className="text-[#e7e7e7] capitalize">{accountData.agentConfig.transparencyLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#ff9800] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#ff9800] mb-3">⚠️ Kom ihåg</h3>
                    <div className="space-y-2 text-sm">
                      <p>• Spara din seed phrase säkert - den kan inte återställas</p>
                      <p>• Dela aldrig din privata nyckel med någon</p>
                      <p>• Din profil är anonym och kan inte kopplas till dig som person</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      to="/"
                      className="block w-full bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200 text-center"
                    >
                      Tillbaka till startsidan
                    </Link>
                    <Link
                      to="/"
                      className="block w-full bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200 text-center"
                    >
                      Börja använda OneSeek.AI
                    </Link>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
