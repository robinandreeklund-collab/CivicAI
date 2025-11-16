/**
 * DebateRoundDisplay Component
 * Displays a single round of debate with agent responses
 */

export default function DebateRoundDisplay({ round }) {
  return (
    <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
          Runda {round.roundNumber}
        </div>
        <span className="text-xs text-civic-gray-500">
          {new Date(round.timestamp).toLocaleTimeString('sv-SE')}
        </span>
      </div>

      <div className="space-y-3">
        {round.responses.map((response, idx) => (
          <div 
            key={idx}
            className={`rounded-lg border p-3 ${
              response.error 
                ? 'border-red-500/30 bg-red-900/10' 
                : 'border-civic-dark-600 bg-civic-dark-800/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-civic-dark-700 text-civic-gray-300 rounded text-xs font-medium">
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
