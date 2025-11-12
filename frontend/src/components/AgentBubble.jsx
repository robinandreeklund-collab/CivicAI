/**
 * AgentBubble Component
 * Displays an AI model's response with agent name, color coding, and metadata
 */
export default function AgentBubble({ agent, response, metadata }) {
  // Color schemes for different AI agents
  const agentColors = {
    'gpt-3.5': 'border-civic-accent-blue bg-civic-dark-800',
    'gemini': 'border-civic-accent-purple bg-civic-dark-800',
    'default': 'border-civic-dark-600 bg-civic-dark-800'
  };

  const agentNames = {
    'gpt-3.5': 'GPT-3.5',
    'gemini': 'Gemini',
  };

  const colorClass = agentColors[agent] || agentColors.default;
  const displayName = agentNames[agent] || agent;

  return (
    <div className={`agent-bubble ${colorClass} mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="text-lg font-semibold text-gray-100">{displayName}</h3>
        </div>
        {metadata?.timestamp && (
          <span className="text-xs text-gray-500">
            {new Date(metadata.timestamp).toLocaleTimeString('sv-SE')}
          </span>
        )}
      </div>
      
      <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
        {response || <span className="text-gray-500 italic">Hämtar svar...</span>}
      </div>

      {metadata?.model && (
        <div className="mt-3 pt-3 border-t border-civic-dark-600">
          <span className="text-xs text-gray-500">
            Modell: {metadata.model}
          </span>
        </div>
      )}
    </div>
  );
}
