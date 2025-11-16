/**
 * DebateVotingPanel Component
 * Displays voting results and winner from AI agent consensus debate
 */

export default function DebateVotingPanel({ votes, winner }) {
  if (!votes || votes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30 p-4 space-y-4">
      {/* Winner Announcement */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg mb-2">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h4 className="text-lg font-semibold text-green-300">Vinnande Svar</h4>
        </div>
        <div className="text-2xl font-bold text-green-400 mb-1">
          {winner.agent}
        </div>
        <div className="text-sm text-civic-gray-400">
          {winner.voteCount} {winner.voteCount === 1 ? 'röst' : 'röster'} av {votes.length}
        </div>
      </div>

      {/* Vote Breakdown */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-civic-gray-300">Röstfördelning</h5>
        
        {/* Vote bars */}
        {Object.entries(winner.voteCounts).map(([agent, count]) => {
          const percentage = (count / votes.length) * 100;
          return (
            <div key={agent} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-civic-gray-400">{agent}</span>
                <span className="text-civic-gray-300 font-medium">{count} röst{count !== 1 ? 'er' : ''}</span>
              </div>
              <div className="h-2 bg-civic-dark-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Votes */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-civic-gray-300">Individuella Röster</h5>
        <div className="space-y-2">
          {votes.map((vote, idx) => (
            <div 
              key={idx}
              className="bg-civic-dark-800/50 rounded-lg border border-civic-dark-600 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-civic-gray-400">{vote.voter}</span>
                  <span className="text-xs text-civic-gray-600">→</span>
                  <span className={`text-xs font-medium ${
                    vote.votedFor === winner.agent 
                      ? 'text-green-400' 
                      : 'text-civic-gray-300'
                  }`}>
                    {vote.votedFor || 'Ingen giltig röst'}
                  </span>
                </div>
                {vote.votedFor === winner.agent && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {vote.reasoning && (
                <p className="text-xs text-civic-gray-400 italic">
                  "{vote.reasoning}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consensus Info */}
      <div className="pt-3 border-t border-civic-dark-700">
        <div className="flex items-center gap-2 text-xs text-civic-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Röstning genomförd av AI-agenter baserat på noggrannhet, klarhet och användbarhet
          </span>
        </div>
      </div>
    </div>
  );
}
