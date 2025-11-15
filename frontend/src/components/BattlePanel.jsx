import { useState } from 'react';

/**
 * BattlePanel Component
 * Allows users to vote on the best AI answer
 */
export default function BattlePanel({ question, responses, onVote }) {
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteStats, setVoteStats] = useState(null);

  const agentThemes = {
    'gpt-3.5': {
      bg: 'bg-civic-gray-500',
      hoverBg: 'hover:bg-civic-gray-600',
      borderColor: 'border-civic-gray-500',
      icon: '🤖',
      name: 'GPT-3.5',
    },
    'gemini': {
      bg: 'bg-civic-gray-500',
      hoverBg: 'hover:bg-civic-gray-600',
      borderColor: 'border-purple-500',
      icon: '✨',
      name: 'Gemini',
    },
    'deepseek': {
      bg: 'bg-cyan-500',
      hoverBg: 'hover:bg-cyan-600',
      borderColor: 'border-cyan-500',
      icon: '🧠',
      name: 'DeepSeek',
    },
  };

  const handleSubmitVote = async () => {
    if (!selectedWinner) return;

    setIsSubmitting(true);

    try {
      // Generate a unique question ID based on timestamp and question content
      const questionId = `q-${Date.now()}-${question.substring(0, 20).replace(/\s/g, '-')}`;

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          winnerId: selectedWinner,
          reason: reason.trim(),
          userId: 'anonymous', // TODO: Replace with actual user ID when auth is implemented
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      // Fetch vote statistics
      const statsResponse = await fetch(`/api/votes/stats/${questionId}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setVoteStats(stats);
      }

      setHasVoted(true);
      if (onVote) {
        onVote(selectedWinner);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Kunde inte skicka röst. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in-up relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-2xl"></div>

      {/* Main content */}
      <div className="relative backdrop-blur-sm bg-civic-dark-800/50 rounded-2xl border border-orange-500/20 p-8 shadow-2xl">
        {/* Header with icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 animate-bounce-slow">
            🗳️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Battle Mode</h2>
            <p className="text-sm text-gray-400">Rösta på det bästa AI-svaret</p>
          </div>
        </div>

        {!hasVoted ? (
          <>
            {/* Description */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              Välj det AI-svar du tycker var mest relevant, korrekt och användbart för frågan.
            </p>

            {/* Agent selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {responses.map((resp) => {
                const theme = agentThemes[resp.agent] || agentThemes['gpt-3.5'];
                const isSelected = selectedWinner === resp.agent;

                return (
                  <button
                    key={resp.agent}
                    onClick={() => setSelectedWinner(resp.agent)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300
                      ${isSelected 
                        ? `${theme.borderColor} bg-civic-dark-700/70 scale-105` 
                        : 'border-civic-dark-600 bg-civic-dark-700/30 hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-4xl">{theme.icon}</span>
                      <span className="text-lg font-semibold text-gray-100">{theme.name}</span>
                      {isSelected && (
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Vald</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reason input (optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Motivering (valfritt)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Varför valde du detta svar?"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl bg-civic-dark-700/50 border-2 border-civic-dark-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none transition-all duration-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/500 tecken
              </p>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitVote}
              disabled={!selectedWinner || isSubmitting}
              className={`
                w-full px-6 py-4 font-semibold rounded-xl
                transition-all duration-300 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden group
                ${isSubmitting 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse' 
                  : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 hover:scale-105 active:scale-95'
                }
              `}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2 text-white">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Skickar röst...</span>
                  </>
                ) : (
                  <>
                    <span>🗳️</span>
                    <span>Rösta</span>
                  </>
                )}
              </span>

              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
              </div>
            </button>
          </>
        ) : (
          <>
            {/* Success message */}
            <div className="text-center py-6">
              <div className="text-6xl mb-4 animate-bounce-slow">✓</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">Tack för din röst!</h3>
              <p className="text-gray-300 mb-6">
                Du röstade på <span className="font-semibold text-orange-400">
                  {agentThemes[selectedWinner]?.name}
                </span>
              </p>

              {/* Vote statistics */}
              {voteStats && voteStats.total > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Röststatistik</h4>
                  <div className="space-y-2">
                    {Object.entries(voteStats.byAgent).map(([agent, count]) => {
                      const theme = agentThemes[agent];
                      const percentage = voteStats.total > 0 ? Math.round((count / voteStats.total) * 100) : 0;
                      
                      return (
                        <div key={agent} className="flex items-center space-x-3">
                          <span className="text-lg">{theme?.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">{theme?.name}</span>
                              <span className="text-sm text-gray-400">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-civic-dark-600 rounded-full h-2">
                              <div 
                                className={`${theme?.bg} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Totalt {voteStats.total} röster</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
