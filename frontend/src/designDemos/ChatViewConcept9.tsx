import { useState } from 'react';

/**
 * ChatViewConcept9: Kanban-Style Workflow View
 * 
 * Design Philosophy:
 * - Kanban board layout showing processing stages
 * - Cards move through columns: Question → Processing → Analysis → Complete
 * - Visual workflow representation for transparency
 * - Drag-and-drop interaction (simulated)
 * - Status indicators for each stage
 */

export default function ChatViewConcept9() {
  const [selectedCard, setSelectedCard] = useState(null);
  
  const columns = [
    {
      id: 'question',
      title: 'Frågor',
      icon: '💭',
      color: 'blue',
      cards: [
        {
          id: 1,
          title: 'Klimatpolitiska åtgärder',
          timestamp: '14:32',
          status: 'active',
        },
      ],
    },
    {
      id: 'processing',
      title: 'Bearbetning',
      icon: '⚙️',
      color: 'yellow',
      cards: [
        {
          id: 2,
          title: 'AI-analys',
          progress: 75,
          steps: ['GPT-3.5', 'Gemini', 'DeepSeek'],
        },
        {
          id: 3,
          title: 'Sentimentanalys',
          progress: 45,
          steps: ['TextBlob', 'VADER'],
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Analys',
      icon: '📊',
      color: 'purple',
      cards: [
        {
          id: 4,
          title: 'Bias-detektion',
          status: 'complete',
          result: 'Låg bias',
        },
        {
          id: 5,
          title: 'Faktakoll',
          status: 'processing',
          progress: 60,
        },
      ],
    },
    {
      id: 'complete',
      title: 'Klart',
      icon: '✓',
      color: 'green',
      cards: [
        {
          id: 6,
          title: 'Konsensussvar',
          status: 'ready',
          confidence: 92,
        },
      ],
    },
  ];

  const getColumnColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
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
          <div className="text-xs text-[#666] uppercase tracking-wider">Pipeline-vy</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#151515] border border-[#1a1a1a] rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-[#888]">4 aktiva steg</span>
          </div>
          <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-[#e7e7e7] transition-colors">
            Ny fråga
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-4 p-6 min-w-max">
          {columns.map(column => (
            <div 
              key={column.id}
              className="w-80 flex flex-col bg-[#0a0a0a] rounded-xl"
            >
              {/* Column Header */}
              <div className={`bg-gradient-to-r ${getColumnColor(column.color)} rounded-t-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{column.icon}</span>
                    <h3 className="text-white font-medium">{column.title}</h3>
                  </div>
                  <div className="bg-white/20 rounded-full px-2 py-1 text-xs text-white">
                    {column.cards.length}
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-[#151515] border border-[#1a1a1a] border-t-0 rounded-b-xl p-3 space-y-3 overflow-y-auto">
                {column.cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`bg-[#0a0a0a] border rounded-lg p-4 cursor-pointer transition-all hover:border-[#2a2a2a] hover:shadow-lg ${
                      selectedCard?.id === card.id ? 'border-[#3a3a3a] shadow-lg' : 'border-[#1a1a1a]'
                    }`}
                  >
                    <div className="text-sm text-[#e7e7e7] font-medium mb-2">
                      {card.title}
                    </div>

                    {/* Card Content based on type */}
                    {card.timestamp && (
                      <div className="text-xs text-[#666]">{card.timestamp}</div>
                    )}

                    {card.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#888]">Framsteg</span>
                          <span className="text-xs text-[#e7e7e7]">{card.progress}%</span>
                        </div>
                        <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${getColumnColor(column.color)} h-2 rounded-full transition-all`}
                            style={{ width: `${card.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {card.steps && (
                      <div className="mt-2 space-y-1">
                        {card.steps.map((step, idx) => (
                          <div key={idx} className="text-xs text-[#888] flex items-center gap-2">
                            <div className="w-1 h-1 bg-[#666] rounded-full" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {card.result && (
                      <div className="mt-2 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                        {card.result}
                      </div>
                    )}

                    {card.confidence && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[#666]">Tillförlitlighet:</span>
                        <span className="text-xs text-[#e7e7e7] font-medium">{card.confidence}%</span>
                      </div>
                    )}

                    {card.status && (
                      <div className="mt-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          card.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          card.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                          card.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          card.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {card.status === 'active' && '⟳'}
                          {card.status === 'complete' && '✓'}
                          {card.status === 'processing' && '⟳'}
                          {card.status === 'ready' && '✓'}
                          <span className="ml-1 capitalize">{card.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Card Button */}
                {column.id === 'question' && (
                  <button className="w-full border-2 border-dashed border-[#1a1a1a] rounded-lg p-4 text-[#666] hover:border-[#2a2a2a] hover:text-[#888] transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm">Ny fråga</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCard && (
        <div className="absolute top-0 right-0 w-96 h-full bg-[#0a0a0a] border-l border-[#1a1a1a] shadow-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-[#e7e7e7] font-medium">Detaljer</h3>
            <button 
              onClick={() => setSelectedCard(null)}
              className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#666]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Titel</div>
              <div className="text-[#e7e7e7]">{selectedCard.title}</div>
            </div>

            {selectedCard.timestamp && (
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Tid</div>
                <div className="text-[#e7e7e7]">{selectedCard.timestamp}</div>
              </div>
            )}

            {selectedCard.progress !== undefined && (
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Framsteg</div>
                <div className="text-2xl text-[#e7e7e7] font-bold">{selectedCard.progress}%</div>
              </div>
            )}

            {selectedCard.confidence && (
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Tillförlitlighet</div>
                <div className="text-2xl text-green-500 font-bold">{selectedCard.confidence}%</div>
              </div>
            )}

            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Åtgärder</div>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs text-[#e7e7e7] transition-colors">
                  Visa fullständig info
                </button>
                <button className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-xs text-[#888] transition-colors">
                  Exportera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
