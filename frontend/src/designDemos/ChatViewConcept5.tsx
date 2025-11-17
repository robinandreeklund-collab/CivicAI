import { useState } from 'react';

/**
 * ChatViewConcept5: Floating Cards Interface with Status Indicators
 * 
 * Design Philosophy:
 * - Floating card-based UI with draggable/repositionable elements
 * - Real-time status indicators for each processing step
 * - Minimal chrome, maximum content visibility
 * - Ambient background with subtle animations
 * - Quick-access action buttons float with cards
 */

export default function ChatViewConcept5() {
  const [cards, setCards] = useState([
    { id: 'question', type: 'question', visible: true },
    { id: 'processing', type: 'processing', visible: true },
    { id: 'response', type: 'response', visible: true },
    { id: 'insights', type: 'insights', visible: true },
  ]);

  const [processingSteps, setProcessingSteps] = useState([
    { id: 1, label: 'AI-modeller', status: 'complete', progress: 100 },
    { id: 2, label: 'Sentimentanalys', status: 'complete', progress: 100 },
    { id: 3, label: 'Bias-detektion', status: 'active', progress: 65 },
    { id: 4, label: 'Faktakoll', status: 'pending', progress: 0 },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'active': return 'text-blue-500';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return '✓';
      case 'active': return '⟳';
      case 'pending': return '○';
      default: return '○';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-hidden relative">
      {/* Ambient Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
          <div 
            className="text-lg font-bold"
            style={{
              background: 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OneSeek.AI
          </div>
          <div className="w-px h-6 bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-[#888]">Analyserar</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-full flex items-center justify-center p-8 relative z-10">
        <div className="max-w-6xl w-full space-y-6">
          {/* Question Card */}
          {cards.find(c => c.id === 'question')?.visible && (
            <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl transform transition-all hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                    💭
                  </div>
                  <div>
                    <div className="text-xs text-[#666] uppercase tracking-wider">Din fråga</div>
                    <div className="text-xs text-[#888]">2024-01-15 14:32</div>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#666] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl text-[#e7e7e7] font-light leading-relaxed">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </h2>
            </div>
          )}

          {/* Processing Status Card */}
          {cards.find(c => c.id === 'processing')?.visible && (
            <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <div className="text-sm text-[#e7e7e7] font-medium">Analyserar svar</div>
                  <div className="text-xs text-[#666]">Pipeline aktiv</div>
                </div>
              </div>

              <div className="space-y-3">
                {processingSteps.map(step => (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className={`w-6 h-6 flex items-center justify-center ${getStatusColor(step.status)}`}>
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#e7e7e7]">{step.label}</span>
                        {step.status === 'active' && (
                          <span className="text-xs text-[#666]">{step.progress}%</span>
                        )}
                      </div>
                      {step.status === 'active' && (
                        <div className="w-full bg-[#1a1a1a] rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Card */}
          {cards.find(c => c.id === 'response')?.visible && (
            <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl border-2 border-[#151515]">🤖</div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-xl border-2 border-[#151515]">✨</div>
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-xl border-2 border-[#151515]">🧠</div>
                </div>
                <div>
                  <div className="text-sm text-[#e7e7e7] font-medium">Konsensussvar</div>
                  <div className="text-xs text-[#666]">Från 5 AI-modeller</div>
                </div>
              </div>

              <div className="text-[#c0c0c0] leading-relaxed space-y-4">
                <p>
                  Baserat på omfattande analys från flera AI-modeller har vi identifierat följande prioriterade klimatpolitiska åtgärder för Sverige fram till 2030:
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-xl p-4">
                    <div className="text-2xl mb-2">⚡</div>
                    <h4 className="text-[#e7e7e7] font-medium mb-1">Elektrifiering</h4>
                    <p className="text-xs text-[#888]">Transport och industri</p>
                  </div>
                  <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-xl p-4">
                    <div className="text-2xl mb-2">🌱</div>
                    <h4 className="text-[#e7e7e7] font-medium mb-1">Förnybar energi</h4>
                    <p className="text-xs text-[#888]">Sol och vindkraft</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Card */}
          {cards.find(c => c.id === 'insights')?.visible && (
            <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">
                  📊
                </div>
                <div className="text-sm text-[#e7e7e7] font-medium">Insyn & Kvalitet</div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl text-[#e7e7e7] font-bold mb-1">92%</div>
                  <div className="text-xs text-[#666]">Tillförlitlighet</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-green-500 font-bold mb-1">Låg</div>
                  <div className="text-xs text-[#666]">Bias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-[#e7e7e7] font-bold mb-1">5</div>
                  <div className="text-xs text-[#666]">Källor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-green-500 font-bold mb-1">✓</div>
                  <div className="text-xs text-[#666]">Verifierad</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-full p-2 flex items-center gap-2 shadow-2xl">
          <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full text-xs text-[#e7e7e7] transition-colors">
            Ny fråga
          </button>
          <button className="p-2 rounded-full hover:bg-[#2a2a2a] text-[#666] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-[#2a2a2a] text-[#666] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating Menu Toggle */}
      <button className="absolute top-6 right-6 w-12 h-12 bg-[#151515]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-full flex items-center justify-center text-[#666] hover:text-[#888] shadow-2xl z-50 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
