import { useState } from 'react';

/**
 * ChatViewConcept6: Split-Screen Comparison View
 * 
 * Design Philosophy:
 * - Split-screen layout for comparing different AI perspectives
 * - Top control bar for selecting which models to compare
 * - Synchronized scrolling between comparison panes
 * - Highlight differences and agreements
 * - Minimal header with model selector
 */

export default function ChatViewConcept6() {
  const [leftModel, setLeftModel] = useState('gpt-3.5');
  const [rightModel, setRightModel] = useState('gemini');
  const [showDifferences, setShowDifferences] = useState(true);

  const models = [
    { id: 'gpt-3.5', name: 'GPT-3.5', icon: '🤖', color: 'blue' },
    { id: 'gemini', name: 'Gemini', icon: '✨', color: 'purple' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🧠', color: 'cyan' },
    { id: 'grok', name: 'Grok', icon: '⚡', color: 'yellow' },
    { id: 'qwen', name: 'Qwen', icon: '🌟', color: 'green' },
  ];

  const responses = {
    'gpt-3.5': {
      text: 'De viktigaste klimatpolitiska åtgärderna inkluderar elektrifiering av transportsektorn, utbyggnad av förnybar energi, och energieffektivisering i byggnader.',
      keyPoints: ['Elektrifiering av transport', 'Förnybar energi', 'Energieffektivisering'],
      tone: 'Neutral',
      confidence: 88,
    },
    'gemini': {
      text: 'Sverige bör prioritera en snabb omställning till förnybara energikällor, särskilt sol- och vindkraft, samt elektrifiering av alla transportsektorer.',
      keyPoints: ['Förnybar energi', 'Elektrifiering av transport', 'Solenergi'],
      tone: 'Positiv',
      confidence: 92,
    },
    'deepseek': {
      text: 'Teknisk innovation inom energilagring och smart elnät är kritiskt, tillsammans med elektrifiering av transport och industri.',
      keyPoints: ['Energilagring', 'Smart elnät', 'Elektrifiering'],
      tone: 'Teknisk',
      confidence: 85,
    },
    'grok': {
      text: 'En realistisk plan måste inkludera kärnkraft för basproduktion, tillsammans med förnybar energi och elektrifiering.',
      keyPoints: ['Kärnkraft', 'Förnybar energi', 'Elektrifiering'],
      tone: 'Pragmatisk',
      confidence: 78,
    },
    'qwen': {
      text: 'En balanserad approach med kombination av alla förnybara källor, energieffektivisering och elektrifiering ger bäst resultat.',
      keyPoints: ['Förnybar energi', 'Energieffektivisering', 'Elektrifiering'],
      tone: 'Balanserad',
      confidence: 90,
    },
  };

  const getModel = (id) => models.find(m => m.id === id);
  const getResponse = (id) => responses[id];

  const findCommonPoints = () => {
    const left = getResponse(leftModel)?.keyPoints || [];
    const right = getResponse(rightModel)?.keyPoints || [];
    return left.filter(point => right.includes(point));
  };

  const findDifferences = () => {
    const left = getResponse(leftModel)?.keyPoints || [];
    const right = getResponse(rightModel)?.keyPoints || [];
    return {
      leftOnly: left.filter(point => !right.includes(point)),
      rightOnly: right.filter(point => !left.includes(point)),
    };
  };

  const commonPoints = findCommonPoints();
  const differences = findDifferences();

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        <div 
          className="text-xl font-bold"
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

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#666] uppercase tracking-wider">Jämför modeller</span>
          <button
            onClick={() => setShowDifferences(!showDifferences)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showDifferences ? 'bg-[#2a2a2a] text-[#e7e7e7]' : 'bg-[#151515] border border-[#1a1a1a] text-[#666]'
            }`}
          >
            Visa skillnader
          </button>
        </div>
      </header>

      {/* Question Banner */}
      <div className="bg-[#151515] border-b border-[#1a1a1a] px-6 py-4">
        <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Din fråga</div>
        <div className="text-lg text-[#e7e7e7]">
          Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane */}
        <div className="flex-1 flex flex-col border-r border-[#1a1a1a]">
          {/* Model Selector */}
          <div className="bg-[#151515] border-b border-[#1a1a1a] p-4">
            <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Vänster panel</div>
            <div className="flex gap-2 flex-wrap">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => setLeftModel(model.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    leftModel === model.id
                      ? 'bg-[#2a2a2a] text-[#e7e7e7] border border-[#3a3a3a]'
                      : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a] border border-transparent'
                  }`}
                >
                  <span>{model.icon}</span>
                  <span>{model.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl">
                    {getModel(leftModel)?.icon}
                  </div>
                  <div>
                    <div className="text-sm text-[#e7e7e7] font-medium">{getModel(leftModel)?.name}</div>
                    <div className="text-xs text-[#666]">
                      Tillförlitlighet: {getResponse(leftModel)?.confidence}%
                    </div>
                  </div>
                </div>
                
                <p className="text-[#c0c0c0] leading-relaxed mb-4">
                  {getResponse(leftModel)?.text}
                </p>

                <div className="pt-4 border-t border-[#1a1a1a]">
                  <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Nyckelpunkter</div>
                  <div className="space-y-2">
                    {getResponse(leftModel)?.keyPoints.map((point, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2 text-sm ${
                          commonPoints.includes(point) 
                            ? 'text-green-400' 
                            : differences.leftOnly.includes(point) && showDifferences
                            ? 'text-yellow-400'
                            : 'text-[#888]'
                        }`}
                      >
                        <span>
                          {commonPoints.includes(point) ? '✓' : 
                           differences.leftOnly.includes(point) && showDifferences ? '◆' : '•'}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-[#666]">Ton:</span>
                  <span className="text-xs text-[#888]">{getResponse(leftModel)?.tone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="flex-1 flex flex-col">
          {/* Model Selector */}
          <div className="bg-[#151515] border-b border-[#1a1a1a] p-4">
            <div className="text-xs text-[#666] uppercase tracking-wider mb-3">Höger panel</div>
            <div className="flex gap-2 flex-wrap">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => setRightModel(model.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    rightModel === model.id
                      ? 'bg-[#2a2a2a] text-[#e7e7e7] border border-[#3a3a3a]'
                      : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a] border border-transparent'
                  }`}
                >
                  <span>{model.icon}</span>
                  <span>{model.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-xl">
                    {getModel(rightModel)?.icon}
                  </div>
                  <div>
                    <div className="text-sm text-[#e7e7e7] font-medium">{getModel(rightModel)?.name}</div>
                    <div className="text-xs text-[#666]">
                      Tillförlitlighet: {getResponse(rightModel)?.confidence}%
                    </div>
                  </div>
                </div>
                
                <p className="text-[#c0c0c0] leading-relaxed mb-4">
                  {getResponse(rightModel)?.text}
                </p>

                <div className="pt-4 border-t border-[#1a1a1a]">
                  <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Nyckelpunkter</div>
                  <div className="space-y-2">
                    {getResponse(rightModel)?.keyPoints.map((point, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2 text-sm ${
                          commonPoints.includes(point) 
                            ? 'text-green-400' 
                            : differences.rightOnly.includes(point) && showDifferences
                            ? 'text-yellow-400'
                            : 'text-[#888]'
                        }`}
                      >
                        <span>
                          {commonPoints.includes(point) ? '✓' : 
                           differences.rightOnly.includes(point) && showDifferences ? '◆' : '•'}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-[#666]">Ton:</span>
                  <span className="text-xs text-[#888]">{getResponse(rightModel)?.tone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary Bar */}
      {showDifferences && (
        <div className="bg-[#151515] border-t border-[#1a1a1a] px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-[#888]">{commonPoints.length} gemensamma punkter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">◆</span>
              <span className="text-[#888]">
                {differences.leftOnly.length + differences.rightOnly.length} skillnader
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
