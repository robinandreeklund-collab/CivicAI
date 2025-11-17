import { useState, useEffect } from 'react';

/**
 * ChatViewConcept11: Enhanced Floating Cards with Model Synthesis
 * 
 * Based on Concept 5 with enhancements:
 * - Rich model synthesis data from existing components
 * - Smooth animations and transitions
 * - Particle effects in background
 * - Proper viewport handling - search always visible
 * - More detailed insights panels
 */

export default function ChatViewConcept11() {
  const [isAnimating, setIsAnimating] = useState(true);
  const [particles, setParticles] = useState([]);

  // Initialize particles for background
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);
    
    setTimeout(() => setIsAnimating(false), 1000);
  }, []);

  // Rich model data
  const modelPerspectives = [
    {
      agent: 'gpt-3.5',
      name: 'GPT-3.5',
      icon: '🤖',
      summary: {
        mainEmotion: 'optimistisk',
        primaryTone: 'informativ',
        intentType: 'förklara',
        wordCount: 234,
      },
      ratings: {
        biasScore: 2.1,
        confidence: 0.88,
        factualityScore: 92,
      },
      highlights: {
        mainTopics: [
          { topic: 'Elektrifiering', relevance: 0.95 },
          { topic: 'Förnybar energi', relevance: 0.89 },
          { topic: 'Transport', relevance: 0.82 },
        ],
        huvudpunkter: [
          'Elektrifiering av transportsektorn är kritisk för klimatmålen',
          'Utbyggnad av förnybar energi måste accelerera',
          'Energilagring blir allt viktigare för stabilitet',
        ],
        keyEntities: [
          { entity: 'Sverige', type: 'LOCATION' },
          { entity: '2030', type: 'DATE' },
          { entity: 'Klimatmål', type: 'POLICY' },
        ],
      },
    },
    {
      agent: 'gemini',
      name: 'Gemini',
      icon: '✨',
      summary: {
        mainEmotion: 'entusiastisk',
        primaryTone: 'övertygande',
        intentType: 'uppmana',
        wordCount: 198,
      },
      ratings: {
        biasScore: 1.8,
        confidence: 0.92,
        factualityScore: 94,
      },
      highlights: {
        mainTopics: [
          { topic: 'Solenergi', relevance: 0.91 },
          { topic: 'Vindkraft', relevance: 0.87 },
          { topic: 'Hållbarhet', relevance: 0.85 },
        ],
        huvudpunkter: [
          'Sol- och vindkraft behöver kraftiga subventioner',
          'Infrastrukturinvesteringar är avgörande',
          'Samhällsengagemang driver förändring',
        ],
        keyEntities: [
          { entity: 'Energimyndigheten', type: 'ORGANIZATION' },
          { entity: 'Regeringen', type: 'ORGANIZATION' },
          { entity: 'EU', type: 'LOCATION' },
        ],
      },
    },
    {
      agent: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      summary: {
        mainEmotion: 'analytisk',
        primaryTone: 'teknisk',
        intentType: 'analysera',
        wordCount: 267,
      },
      ratings: {
        biasScore: 1.2,
        confidence: 0.85,
        factualityScore: 96,
      },
      highlights: {
        mainTopics: [
          { topic: 'Smart elnät', relevance: 0.93 },
          { topic: 'Energilagring', relevance: 0.90 },
          { topic: 'Innovation', relevance: 0.86 },
        ],
        huvudpunkter: [
          'Teknologisk innovation inom batterier är nyckel',
          'Smart elnät möjliggör effektiv distribution',
          'AI-optimering kan minska energianvändning med 15-20%',
        ],
        keyEntities: [
          { entity: 'Batteriteknologi', type: 'TECHNOLOGY' },
          { entity: 'AI-system', type: 'TECHNOLOGY' },
          { entity: 'Forskningsinstitut', type: 'ORGANIZATION' },
        ],
      },
    },
  ];

  const synthesisData = {
    consensus: 87,
    keyAgreements: [
      'Elektrifiering av transport',
      'Förnybar energi som huvudfokus',
      'Energieffektivisering i alla sektorer',
    ],
    divergences: [
      { topic: 'Kärnkraft', agreement: 45 },
      { topic: 'Tidslinjer', agreement: 67 },
    ],
    overallSentiment: 'Positiv',
    factualAlignment: 94,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-auto relative">
      {/* Animated Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-500/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s infinite ease-in-out`,
            }}
          />
        ))}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); opacity: 0.3; }
            50% { transform: translateY(-20px); opacity: 0.6; }
          }
        `}</style>
      </div>

      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Header */}
      <div className="sticky top-4 z-50 flex justify-center px-4">
        <div className={`bg-[#151515]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl transition-all duration-700 ${
          isAnimating ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'
        }`}>
          <div 
            className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient"
            style={{ backgroundSize: '200% 100%' }}
          >
            OneSeek.AI
          </div>
          <div className="w-px h-6 bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-[#888]">Analys klar</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Question Card */}
        <div className={`bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl transition-all duration-700 hover:border-[#3a3a3a] ${
          isAnimating ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl animate-bounce-subtle">
              💭
            </div>
            <div>
              <div className="text-xs text-[#666] uppercase tracking-wider">Din fråga</div>
              <div className="text-xs text-[#888]">Just nu • 3 modeller analyserade</div>
            </div>
          </div>
          <h2 className="text-2xl text-[#e7e7e7] font-light leading-relaxed">
            Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
          </h2>
        </div>

        {/* Synthesis Card */}
        <div className={`bg-gradient-to-br from-[#1a1a1a]/90 to-[#151515]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl transition-all duration-700 delay-100 ${
          isAnimating ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
              🎯
            </div>
            <div className="flex-1">
              <div className="text-lg text-[#e7e7e7] font-medium">Modellsyntes & Konsensus</div>
              <div className="text-xs text-[#666]">{synthesisData.consensus}% överensstämmelse mellan modeller</div>
            </div>
            <div className="text-right">
              <div className="text-2xl text-green-500 font-bold">{synthesisData.factualAlignment}%</div>
              <div className="text-xs text-[#666]">Faktisk överensstämmelse</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {synthesisData.keyAgreements.map((agreement, idx) => (
              <div 
                key={idx} 
                className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-xl p-4 hover:border-green-500/50 transition-all duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                  <span className="text-sm text-green-400 font-medium">Konsensus</span>
                </div>
                <p className="text-[#e7e7e7]">{agreement}</p>
              </div>
            ))}
          </div>

          {synthesisData.divergences.length > 0 && (
            <div className="border-t border-[#2a2a2a] pt-4">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Diskussionspunkter</div>
              <div className="space-y-2">
                {synthesisData.divergences.map((div, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-[#888]">{div.topic}</span>
                    <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${div.agreement}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#666] w-12 text-right">{div.agreement}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Model Perspectives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelPerspectives.map((model, idx) => (
            <div
              key={model.agent}
              className={`bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:border-[#3a3a3a] hover:transform hover:scale-105 transition-all duration-500 ${
                isAnimating ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
              }`}
              style={{ transitionDelay: `${200 + idx * 100}ms` }}
            >
              {/* Model Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{model.icon}</div>
                <div className="flex-1">
                  <div className="text-sm text-[#e7e7e7] font-semibold">{model.name}</div>
                  <div className="text-xs text-[#666]">{model.summary.wordCount} ord</div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#1a1a1a]/50 rounded-lg p-2">
                  <div className="text-xs text-[#666]">Emotion</div>
                  <div className="text-xs text-[#e7e7e7] capitalize font-medium">{model.summary.mainEmotion}</div>
                </div>
                <div className="bg-[#1a1a1a]/50 rounded-lg p-2">
                  <div className="text-xs text-[#666]">Ton</div>
                  <div className="text-xs text-[#e7e7e7] capitalize font-medium">{model.summary.primaryTone}</div>
                </div>
                <div className="bg-[#1a1a1a]/50 rounded-lg p-2">
                  <div className="text-xs text-[#666]">Syfte</div>
                  <div className="text-xs text-[#e7e7e7] capitalize font-medium">{model.summary.intentType}</div>
                </div>
                <div className="bg-[#1a1a1a]/50 rounded-lg p-2">
                  <div className="text-xs text-[#666]">Faktahalt</div>
                  <div className="text-xs text-green-400 font-bold">{model.ratings.factualityScore}%</div>
                </div>
              </div>

              {/* Ratings */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Bias</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-1000"
                        style={{ width: `${Math.min(model.ratings.biasScore * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#e7e7e7] w-8">{model.ratings.biasScore}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Säkerhet</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                        style={{ width: `${model.ratings.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#e7e7e7] w-8">{Math.round(model.ratings.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="mb-3">
                <div className="text-xs text-[#666] mb-2">Nyckelämnen:</div>
                <div className="flex flex-wrap gap-1">
                  {model.highlights.mainTopics.map((topic, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30"
                    >
                      {topic.topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Points */}
              <div className="border-t border-[#2a2a2a] pt-3">
                <div className="text-xs text-[#666] mb-2">Huvudpunkter:</div>
                <div className="space-y-1">
                  {model.highlights.huvudpunkter.slice(0, 2).map((point, idx) => (
                    <p key={idx} className="text-xs text-[#888] leading-relaxed line-clamp-2">
                      • {point}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Input - Always Visible */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-8 pb-6 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl p-3 flex gap-3">
            <input
              type="text"
              placeholder="Ställ en följdfråga eller förfina analysen..."
              className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
              <div className="flex items-center gap-2">
                <span>Analysera</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
