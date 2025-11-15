import { useState } from 'react';

/**
 * TimelineNavigator Component
 * Card Stack Navigator from chat-timeline-concept-3
 * Elegant sidebar for navigating through all analysis steps and AI responses
 */
export default function TimelineNavigator({ 
  sections,
  activeSection, 
  onSectionChange,
  exploredCount,
  aiServices,
  onServiceToggle
}) {
  const [expandedGroups, setExpandedGroups] = useState({
    processing: true,
    aiResponses: true,
    analysis: true,
    aiServices: false
  });

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const totalSections = sections.reduce((sum, group) => sum + group.items.length, 0);
  const progressPercent = totalSections > 0 ? Math.round((exploredCount / totalSections) * 100) : 0;

  // Icon mapping for different section types
  const iconMap = {
    'Bästa svar': '⭐',
    'BERT-sammanfattning': '📝',
    'GPT-3.5': '🤖',
    'Gemini': '✨',
    'DeepSeek': '🧠',
    'Grok': '⚡',
    'Qwen': '🌟',
    'Tonanalys': '🎭',
    'Bias-detektion': '⚖️',
    'GPT Metagranskning': '🔍',
    'Tavily Faktakoll': '✓',
    'BERT Summering': '📋',
  };

  const getIcon = (title) => {
    return iconMap[title] || '📄';
  };

  return (
    <div className="w-[280px] bg-civic-dark-900 border-l border-civic-dark-700 flex flex-col h-screen">
      {/* Header */}
      <div className="px-5 py-8">
        <div className="text-xs font-medium text-civic-gray-500 uppercase tracking-wider mb-1.5">
          Dataflöde
        </div>
        <div className="text-[11px] text-civic-gray-600">
          Navigera genom analysen
        </div>
      </div>

      {/* Navigator */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        {/* AI Services Section (Collapsible) */}
        {aiServices && aiServices.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => toggleGroup('aiServices')}
              className="w-full flex items-center justify-between px-2 mb-3 text-[11px] font-medium text-civic-gray-600 uppercase tracking-wide hover:text-civic-gray-500 transition-colors"
            >
              <span>AI-tjänster ({aiServices.filter(s => s.enabled).length}/{aiServices.length})</span>
              <svg 
                className={`w-3 h-3 transition-transform ${expandedGroups.aiServices ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedGroups.aiServices && (
              <div className="space-y-2">
                {aiServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-civic-dark-800 border border-civic-dark-700 rounded-lg p-3 hover:bg-civic-dark-750 hover:border-civic-dark-600 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{service.icon}</span>
                        <span className="text-xs font-medium text-civic-gray-300">{service.name}</span>
                      </div>
                      <button
                        onClick={() => onServiceToggle?.(service.id)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          service.enabled ? 'bg-civic-gray-500' : 'bg-civic-dark-700'
                        }`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          service.enabled ? 'translate-x-5' : ''
                        }`}></div>
                      </button>
                    </div>
                    <div className="text-[10px] text-civic-gray-600">{service.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline Sections */}
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-2">
            <button
              onClick={() => toggleGroup(section.group)}
              className="w-full flex items-center justify-between px-2 text-[11px] font-medium text-civic-gray-600 uppercase tracking-wide hover:text-civic-gray-500 transition-colors"
            >
              <span>{section.title} ({section.items.length})</span>
              <svg 
                className={`w-3 h-3 transition-transform ${expandedGroups[section.group] ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedGroups[section.group] && (
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`
                        w-full bg-civic-dark-800 border rounded-lg p-2.5 text-left transition-all relative
                        ${isActive 
                          ? 'bg-civic-dark-750 border-civic-dark-500 translate-x-1' 
                          : 'border-civic-dark-700 hover:bg-civic-dark-750 hover:border-civic-dark-600 hover:translate-x-1'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      <div className={`
                        absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg transition-all
                        ${isActive ? 'bg-gradient-to-b from-civic-gray-400 to-civic-gray-600' : 'bg-transparent'}
                      `}></div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{getIcon(item.title)}</span>
                        <div className={`
                          w-1.5 h-1.5 rounded-full transition-all
                          ${isActive 
                            ? 'bg-civic-gray-400 shadow-[0_0_8px_rgba(200,200,200,0.3)]' 
                            : 'bg-civic-dark-600'
                          }
                        `}></div>
                      </div>

                      <div className={`text-[12px] font-medium mb-0.5 transition-colors ${
                        isActive ? 'text-civic-gray-200' : 'text-civic-gray-300'
                      }`}>
                        {item.title}
                      </div>

                      {item.meta && (
                        <div className="text-[10px] text-civic-gray-600">
                          {item.meta}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Footer */}
      <div className="px-5 py-6 border-t border-civic-dark-800">
        <div className="flex justify-between items-center mb-3 text-[11px]">
          <span className="text-civic-gray-500">Utforskat</span>
          <span className="text-civic-gray-300 font-medium">{exploredCount} / {totalSections} ({progressPercent}%)</span>
        </div>
        <div className="h-1.5 bg-civic-dark-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-civic-gray-500 to-civic-gray-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
