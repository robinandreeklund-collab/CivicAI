import { useState } from 'react';
import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * SignupPage Component - Skapa konto
 * Anonymous account creation with local key generation,
 * backup, bot protection, and zero-knowledge profile
 * Module: signup_module v1.0 (Beta)
 */
export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountData, setAccountData] = useState({
    publicKey: '',
    privateKey: '',
    seedPhrase: '',
    qrCode: '',
    profileType: 'pseudonym', // public, private, pseudonym
    agentConfig: {
      biasFilter: 'neutral',
      tone: 'balanced',
      transparencyLevel: 'high'
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { id: 0, title: 'Välkommen', desc: 'Introduktion till anonymt kontoskapande' },
    { id: 1, title: 'Nyckelgenerering', desc: 'Lokal generering av kryptonyckelpar' },
    { id: 2, title: 'Säkerhetskopiering', desc: 'Seed phrase eller QR-kod för återställning' },
    { id: 3, title: 'Bot-skydd', desc: 'Proof-of-work verifiering' },
    { id: 4, title: 'Insyn-profil', desc: 'Zero-knowledge profilskapande' },
    { id: 5, title: 'Agent-anpassning', desc: 'Personlig agentprofil (valfri)' },
    { id: 6, title: 'Klart!', desc: 'Ditt konto är redo' }
  ];

  // Simulate local key generation
  const generateKeys = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate key generation (in production, use Web Crypto API)
      const publicKey = 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const privateKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Generate seed phrase (12 words)
      const words = ['ocean', 'liberty', 'forest', 'truth', 'wisdom', 'justice', 'freedom', 'insight', 'harmony', 'balance', 'clarity', 'purpose'];
      const seedPhrase = words.map(w => w + Math.floor(Math.random() * 100)).join(' ');
      
      setAccountData(prev => ({
        ...prev,
        publicKey,
        privateKey,
        seedPhrase,
        qrCode: 'QR:' + publicKey // Simplified QR representation
      }));
      setIsGenerating(false);
      setCurrentStep(1);
    }, 1500);
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding & Progress */}
          <div className="md:pr-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-4 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Skapa konto
            </h1>
            <p className="text-lg text-[#888] mb-4 font-light leading-relaxed">
              Anonymt kontoskapande med fullständig integritet och transparens.
            </p>
            
            {/* Beta Badge */}
            <div className="inline-block bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1 mb-10">
              <span className="text-xs text-[#888]">🧪 Beta v1.0 - signup_module</span>
            </div>

            {/* Progress Steps */}
            <div className="space-y-0">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`py-4 border-b border-[#151515] transition-colors duration-200 ${
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
            <div className="mt-10 space-y-2">
              <div className="text-xs text-[#666]">🔒 Ingen IP-loggning</div>
              <div className="text-xs text-[#666]">🔒 Ingen tredjepartsautentisering</div>
              <div className="text-xs text-[#666]">🔒 Tor-kompatibel</div>
              <div className="text-xs text-[#666]">⚡ Rate-limit: 3 konton/IP/timme</div>
            </div>
          </div>

          {/* Right Side - Step Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6">
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
                      <div className="w-32 h-32 bg-[#0a0a0a] flex items-center justify-center text-white text-xs text-center">
                        QR Code<br/>Placeholder<br/>{accountData.qrCode.substring(0, 15)}...
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
                      Din browser utför en enkel beräkning som bevisar att det är en människa som skapar kontot. Detta tar några sekunder.
                    </p>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div className="h-full bg-[#e7e7e7] rounded-full animate-pulse" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <span className="text-sm text-[#e7e7e7]">75%</span>
                      </div>
                      <p className="text-xs text-[#666] mt-2">Beräknar hash-värde...</p>
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
                      className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                    >
                      Nästa: Insyn-profil
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
                      onClick={handleNext}
                      className="flex-1 bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                    >
                      Slutför
                    </button>
                  </div>
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
                      <div className="flex justify-between">
                        <span className="text-[#666]">Profil-ID:</span>
                        <span className="text-[#e7e7e7] font-mono">{accountData.publicKey.substring(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Profiltyp:</span>
                        <span className="text-[#e7e7e7] capitalize">{accountData.profileType}</span>
                      </div>
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
                      to="/chat"
                      className="block w-full bg-[#e7e7e7] text-[#0a0a0a] py-3 rounded-lg font-medium hover:bg-white transition-colors duration-200 text-center"
                    >
                      Börja använda OneSeek.AI
                    </Link>
                    <Link
                      to="/"
                      className="block w-full bg-[#1a1a1a] text-[#e7e7e7] py-3 rounded-lg font-medium border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors duration-200 text-center"
                    >
                      Tillbaka till startsidan
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
