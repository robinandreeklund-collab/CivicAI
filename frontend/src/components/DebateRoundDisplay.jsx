/**
 * DebateRoundDisplay Component
 * Displays a single round of debate with agent responses - live chat style
 */

export default function DebateRoundDisplay({ round, isLatest = false }) {
  return (
    <div className={`bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-3 ${isLatest ? 'animate-fadeIn' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="px-2 py-0.5 bg-civic-dark-800 text-civic-gray-400 rounded text-xs font-medium border border-civic-dark-600">
          Runda {round.roundNumber}
        </div>
        <span className="text-xs text-civic-gray-600">
          {new Date(round.timestamp).toLocaleTimeString('sv-SE')}
        </span>
      </div>

      <div className="space-y-2">
        {round.responses.map((response, idx) => (
          <div 
            key={idx}
            className={`rounded-lg border p-2.5 transition-all duration-300 ${
              response.error 
                ? 'border-red-500/30 bg-red-900/10' 
                : 'border-civic-dark-600 bg-civic-dark-800/30 hover:bg-civic-dark-800/50'
            } ${isLatest ? 'animate-slideIn' : ''}`}
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="px-2 py-0.5 bg-civic-dark-700/50 text-civic-gray-400 rounded text-xs font-medium">
                {response.agent}
              </div>
              {response.error && (
                <span className="text-xs text-red-400">Fel</span>
              )}
            </div>
            <p className="text-sm text-civic-gray-300 leading-relaxed whitespace-pre-wrap">
              {response.response}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
