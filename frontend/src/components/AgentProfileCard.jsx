/**
 * AgentProfileCard Component
 * Displays AI model profile and characteristics
 */
export default function AgentProfileCard({ agent, metadata }) {
  const agentProfiles = {
    'gpt-3.5': {
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      icon: '🤖',
      color: 'blue',
      description: 'Snabb och effektiv språkmodell från OpenAI',
      strengths: [
        'Snabba svar',
        'Bred allmänkunskap',
        'Bra på strukturerade svar',
        'Konversationell stil',
      ],
      characteristics: {
        'Kreativitet': 70,
        'Precision': 80,
        'Kontextförståelse': 85,
        'Språkhantering': 90,
      },
    },
    'gemini': {
      name: 'Gemini',
      provider: 'Google',
      icon: '✨',
      color: 'purple',
      description: 'Googles avancerade multimodala AI-modell',
      strengths: [
        'Uppdaterad information',
        'Långt kontext-minne',
        'Analytisk stil',
        'Faktabaserad',
      ],
      characteristics: {
        'Kreativitet': 75,
        'Precision': 85,
        'Kontextförståelse': 90,
        'Språkhantering': 85,
      },
    },
    'deepseek': {
      name: 'DeepSeek',
      provider: 'DeepSeek AI',
      icon: '🧠',
      color: 'cyan',
      description: 'Kraftfull AI-modell med fokus på teknisk precision och datadriven analys',
      strengths: [
        'Teknisk noggrannhet',
        'Kvantitativa analyser',
        'Systematisk struktur',
        'Evidensbaserad',
      ],
      characteristics: {
        'Kreativitet': 65,
        'Precision': 95,
        'Kontextförståelse': 88,
        'Språkhantering': 82,
      },
    },
  };

  const profile = agentProfiles[agent] || {
    name: agent,
    provider: 'Unknown',
    icon: '🔮',
    color: 'gray',
    description: 'AI-modell',
    strengths: [],
    characteristics: {},
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      progress: 'bg-blue-500',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-300',
      progress: 'bg-purple-500',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-300',
      progress: 'bg-cyan-500',
    },
    gray: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      text: 'text-gray-300',
      progress: 'bg-gray-500',
    },
  };

  const colors = colorClasses[profile.color] || colorClasses.gray;

  return (
    <div className={`border ${colors.border} ${colors.bg} rounded-xl p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{profile.icon}</div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{profile.name}</h3>
            <p className="text-xs text-gray-500">{profile.provider}</p>
          </div>
        </div>
        {metadata?.model && (
          <div className="text-xs text-gray-500 bg-civic-dark-700/50 px-2 py-1 rounded">
            {metadata.model}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300">{profile.description}</p>

      {/* Strengths */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Styrkor</h4>
        <div className="flex flex-wrap gap-2">
          {profile.strengths.map((strength, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
            >
              {strength}
            </span>
          ))}
        </div>
      </div>

      {/* Characteristics */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 mb-3">Egenskaper</h4>
        <div className="space-y-2">
          {Object.entries(profile.characteristics).map(([characteristic, value]) => (
            <div key={characteristic}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{characteristic}</span>
                <span>{value}%</span>
              </div>
              <div className="w-full bg-civic-dark-700/50 rounded-full h-1.5">
                <div
                  className={`${colors.progress} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
