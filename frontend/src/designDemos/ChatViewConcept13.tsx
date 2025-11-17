import { useState, useEffect } from 'react';

/**
 * ChatViewConcept13: Timeline with Rich Model Perspectives
 * 
 * Based on Concept 2 with enhancements:
 * - Animated timeline with progress indicators
 * - Rich model perspective cards with full data
 * - Smooth scroll animations
 * - Always-visible search field at bottom
 * - Interactive timeline events
 */

export default function ChatViewConcept13() {
  const [mounted, setMounted] = useState(false);
  const [activeModel, setActiveModel] = useState('gpt-3.5');
  const [timelineProgress, setTimelineProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Animate timeline progress
    const interval = setInterval(() => {
      setTimelineProgress(prev => (prev < 100 ? prev + 1 : 100));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const models = [
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5',
      icon: '🤖',
      summary: {
        mainEmotion: 'optimistisk',
        primaryTone: 'informativ',
        wordCount: 234,
      },
      ratings: {
        biasScore: 2.1,
        confidence: 0.88,
        factualityScore: 92,
      },
      keyPoints: [
        'Elektrifiering av transport kritisk',
        'Utbyggnad förnybar energi måste accelerera',
        'Energilagring blir viktigare',
      ],
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '✨',
      summary: {
        mainEmotion: 'entusiastisk',
        primaryTone: 'övertygande',
        wordCount: 198,
      },
      ratings: {
        biasScore: 1.8,
        confidence: 0.92,
        factualityScore: 94,
      },
      keyPoints: [
        'Sol- och vindkraft behöver subventioner',
        'Infrastrukturinvesteringar avgörande',
        'Samhällsengagemang driver förändring',
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      summary: {
        mainEmotion: 'analytisk',
        primaryTone: 'teknisk',
        wordCount: 267,
      },
      ratings: {
        biasScore: 1.2,
        confidence: 0.85,
        factualityScore: 96,
      },
      keyPoints: [
        'Batteriteknologi är nyckel',
        'Smart elnät möjliggör effektiv distribution',
        'AI-optimering kan minska energianvändning 15-20%',
      ],
    },
  ];

  const timelineEvents = [
    { id: 1, time: '14:32:01', label: 'Fråga mottagen', status: 'complete', progress: 100 },
    { id: 2, time: '14:32:02', label: 'AI-modeller startar', status: 'complete', progress: 100 },
    { id: 3, time: '14:32:15', label: 'Svar genererade', status: 'complete', progress: 100 },
    { id: 4, time: '14:32:18', label: 'Analys pågår', status: 'active', progress: timelineProgress },
    { id: 5, time: '14:32:25', label: 'Färdigställer', status: 'pending', progress: 0 },
  ];

  const currentModel = models.find(m => m.id === activeModel);

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Left Sidebar - Timeline */}
      <div className={`w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col transition-all duration-700 ${
        mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}>
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
            OneSeek.AI
          </div>
        </div>

        {/* Model Selector */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="text-xs text-[#666] uppercase tracking-wider mb-3">AI-Modeller</div>
          <div className="space-y-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  activeModel === model.id
                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]'
                    : 'bg-[#151515] border border-transparent hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="text-2xl">{model.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm text-[#e7e7e7]">{model.name}</div>
                  <div className="text-xs text-[#666]">{model.summary.wordCount} ord</div>
                </div>
                {activeModel === model.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-[#666] uppercase tracking-wider mb-4">Tidslinje</div>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1a1a1a]" />
            
            <div className="space-y-6">
              {timelineEvents.map((event, idx) => (
                <div 
                  key={event.id} 
                  className={`relative pl-8 transition-all duration-500`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    event.status === 'complete' ? 'bg-green-500 border-green-400' :
                    event.status === 'active' ? 'bg-blue-500 border-blue-400 animate-pulse' :
                    'bg-[#1a1a1a] border-[#2a2a2a]'
                  }`}>
                    {event.status === 'complete' && <span className="text-white text-xs">✓</span>}
                    {event.status === 'active' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  
                  <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-3">
                    <div className="text-xs text-[#666] mb-1">{event.time}</div>
                    <div className="text-sm text-[#e7e7e7] mb-2">{event.label}</div>
                    {event.status === 'active' && (
                      <div className="w-full bg-[#1a1a1a] rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${event.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-32 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Question */}
            <div className={`bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 transition-all duration-700 delay-200 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Din fråga</div>
              <h2 className="text-xl text-[#e7e7e7]">
                Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
              </h2>
            </div>

            {/* Selected Model Perspective */}
            {currentModel && (
              <div className={`bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 transition-all duration-700 delay-300 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl">
                    {currentModel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl text-[#e7e7e7] font-medium">{currentModel.name}</div>
                    <div className="text-sm text-[#666]">
                      {currentModel.summary.wordCount} ord • {currentModel.summary.primaryTone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl text-green-500 font-bold">{currentModel.ratings.factualityScore}%</div>
                    <div className="text-xs text-[#666]">Faktahalt</div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#1a1a1a]/50 rounded-lg p-4">
                    <div className="text-xs text-[#666] mb-2">Emotion</div>
                    <div className="text-sm text-[#e7e7e7] capitalize font-medium">{currentModel.summary.mainEmotion}</div>
                  </div>
                  <div className="bg-[#1a1a1a]/50 rounded-lg p-4">
                    <div className="text-xs text-[#666] mb-2">Bias</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#151515] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                          style={{ width: `${currentModel.ratings.biasScore * 10}%` }}
                        />
                      </div>
                      <span className="text-sm text-[#e7e7e7] font-medium">{currentModel.ratings.biasScore}</span>
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a]/50 rounded-lg p-4">
                    <div className="text-xs text-[#666] mb-2">Säkerhet</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#151515] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${currentModel.ratings.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-[#e7e7e7] font-medium">{Math.round(currentModel.ratings.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="border-t border-[#2a2a2a] pt-6">
                  <div className="text-sm text-[#666] uppercase tracking-wider mb-4">Huvudpunkter</div>
                  <div className="space-y-3">
                    {currentModel.keyPoints.map((point, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 bg-[#1a1a1a]/30 rounded-lg p-4 hover:bg-[#1a1a1a]/50 transition-all duration-300"
                      >
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-sm font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-[#c0c0c0] leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Input */}
        <div className="fixed bottom-0 left-72 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-6 pb-6 px-8 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl p-3 flex gap-3">
              <input
                type="text"
                placeholder="Ställ en följdfråga eller välj annan modell..."
                className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium transition-all duration-300">
                Analysera
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
