import { useState, useEffect } from 'react';

/**
 * ChatViewConcept14: Tabbed Interface with Animated Transitions
 * Based on Concept 7 with smooth animations and rich data
 */

export default function ChatViewConcept14() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tabs = [
    { id: 'overview', label: 'Översikt', icon: '📋', count: 1 },
    { id: 'models', label: 'Modeller', icon: '🤖', count: 3 },
    { id: 'analysis', label: 'Analys', icon: '📊', count: 5 },
    { id: 'sources', label: 'Källor', icon: '📚', count: 5 },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6">
        <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          OneSeek.AI
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#1a1a1a]">
        <div className="flex px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-[#e7e7e7]'
                  : 'border-transparent text-[#666] hover:text-[#888]'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
              <span className="px-1.5 py-0.5 bg-[#1a1a1a] rounded text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28 p-8">
        <div className={`max-w-6xl mx-auto transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-8">
                <h3 className="text-xl text-[#e7e7e7] mb-4">Sammanfattning</h3>
                <p className="text-[#c0c0c0] leading-relaxed">
                  Elektrifiering av transport och förnybar energi är konsensus. 92% överensstämmelse mellan modeller.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-6 pb-6 px-8 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-3 flex gap-3">
            <input
              type="text"
              placeholder="Ställ en fråga..."
              className="flex-1 bg-transparent px-4 py-3 text-[#e7e7e7] placeholder-[#666] focus:outline-none"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium">
              Skicka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
