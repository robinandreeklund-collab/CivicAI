/**
 * ConsensusDebateCard Component
 * Displays live debate between AI agents when divergence is high
 */

import { useState, useEffect } from 'react';
import DebateRoundDisplay from './DebateRoundDisplay';
import DebateVotingPanel from './DebateVotingPanel';

export default function ConsensusDebateCard({ 
  questionId, 
  question, 
  modelSynthesis,
  responses,
  onDebateComplete 
}) {
  const [debate, setDebate] = useState(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isRunningRound, setIsRunningRound] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [winningAnalysis, setWinningAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Manual initiation only - no auto-start

  const initiateDebate = async () => {
    setIsInitiating(true);
    setError(null);

    try {
      // Validate required data
      if (!modelSynthesis || !modelSynthesis.consensus || !modelSynthesis.divergences) {
        throw new Error('Modellsyntes data saknas eller är ofullständig');
      }

      // Get list of agents that responded successfully
      const agents = responses
        .filter(r => !r.metadata?.error)
        .map(r => r.agent);

      if (agents.length === 0) {
        throw new Error('Inga tillgängliga agenter för debatt');
      }

      // Extract only necessary data from responses to reduce payload size
      const lightweightResponses = responses.map(r => ({
        agent: r.agent,
        response: r.response,
        metadata: {
          model: r.metadata?.model,
          timestamp: r.metadata?.timestamp,
          error: r.metadata?.error
        }
      }));

      const response = await fetch('http://localhost:3001/api/debate/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          question,
          agents,
          initialResponses: lightweightResponses,
          modelSynthesis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const debateData = await response.json();
      setDebate(debateData);
      console.log('✅ Debate initiated:', debateData.id);
    } catch (err) {
      console.error('Error initiating debate:', err);
      setError('Kunde inte starta debatt: ' + err.message);
    } finally {
      setIsInitiating(false);
    }
  };

  const runNextRound = async () => {
    if (!debate || debate.status === 'completed' || debate.status === 'voting') {
      return;
    }

    setIsRunningRound(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/debate/${debate.id}/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to run debate round');
      }

      const updatedDebate = await response.json();
      setDebate(updatedDebate);
      console.log(`✅ Round ${updatedDebate.currentRound} completed`);

      // If max rounds reached, automatically trigger voting
      if (updatedDebate.status === 'voting') {
        setTimeout(() => startVoting(), 1000);
      }
    } catch (err) {
      console.error('Error running debate round:', err);
      setError('Kunde inte genomföra debattrunda: ' + err.message);
    } finally {
      setIsRunningRound(false);
    }
  };

  const startVoting = async () => {
    if (!debate || debate.status !== 'voting') {
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/debate/${debate.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to conduct voting');
      }

      const updatedDebate = await response.json();
      setDebate(updatedDebate);
      console.log('✅ Voting completed, winner:', updatedDebate.winner?.agent);

      // Automatically trigger analysis of winning answer
      setTimeout(() => analyzeWinner(updatedDebate.id), 1000);

      if (onDebateComplete) {
        onDebateComplete(updatedDebate);
      }
    } catch (err) {
      console.error('Error conducting voting:', err);
      setError('Kunde inte genomföra röstning: ' + err.message);
    } finally {
      setIsVoting(false);
    }
  };

  const analyzeWinner = async (debateId) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/debate/${debateId}/analyze-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze winning answer');
      }

      const analysis = await response.json();
      setWinningAnalysis(analysis);
      console.log('✅ Winning answer analyzed');
    } catch (err) {
      console.error('Error analyzing winning answer:', err);
      setError('Kunde inte analysera vinnande svar: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isInitiating) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-civic-gray-100">
            Konsensus Live Debatt
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-sm text-civic-gray-400">Startar debatt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-civic-gray-100">Fel</h3>
        </div>
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={initiateDebate}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (!debate) {
    // Show button to start debate manually
    const consensus = modelSynthesis.consensus?.overallConsensus || 0;
    const shouldRecommend = consensus < 60;
    
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-civic-gray-100">
            Konsensus Live Debatt
          </h3>
        </div>
        
        {/* Recommendation banner when consensus is low */}
        {shouldRecommend && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-300 mb-1">
                Live debatt rekommenderas för att hitta konsensus
              </div>
              <div className="text-xs text-yellow-400/80">
                Låg konsensus ({consensus}%) detekterad mellan AI-modellernas svar. En debatt kan hjälpa till att klargöra skillnader och nå bättre överensstämmelse.
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center py-6">
          <p className="text-sm text-civic-gray-400 mb-6">
            Starta en live-debatt där AI-agenter presenterar sina perspektiv, 
            svarar på varandras argument och röstar på det bästa svaret.
          </p>
          
          <div className="mb-6 bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-civic-gray-500 mb-1">Konsensus:</div>
                <div className={`font-medium ${shouldRecommend ? 'text-yellow-400' : 'text-civic-gray-200'}`}>
                  {consensus}%
                </div>
              </div>
              <div>
                <div className="text-civic-gray-500 mb-1">Skillnader:</div>
                <div className="text-civic-gray-200 font-medium">{modelSynthesis.divergences?.divergenceCount || 0} st</div>
              </div>
              <div>
                <div className="text-civic-gray-500 mb-1">Max agenter:</div>
                <div className="text-civic-gray-200 font-medium">5 st</div>
              </div>
              <div>
                <div className="text-civic-gray-500 mb-1">Max rundor:</div>
                <div className="text-civic-gray-200 font-medium">5 rundor</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={initiateDebate}
            disabled={isInitiating}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Starta Live Debatt</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-lg font-semibold text-civic-gray-100">
              Konsensus Live Debatt
            </h3>
            <p className="text-xs text-civic-gray-500 mt-1">
              Hög divergens detekterad - AI-agenter debatterar för att nå konsensus
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium capitalize">
            {debate.status === 'initiated' && 'Initierad'}
            {debate.status === 'voting' && 'Röstning'}
            {debate.status === 'completed' && 'Avslutad'}
          </div>
          <div className="text-xs text-civic-gray-500">
            Runda {debate.currentRound} / 5
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
        <h4 className="text-sm font-medium text-civic-gray-300 mb-3">Deltagare</h4>
        <div className="flex flex-wrap gap-2">
          {debate.participants.map((agent, idx) => (
            <span 
              key={idx}
              className="px-3 py-1.5 bg-civic-dark-800/50 text-civic-gray-300 rounded-full text-xs font-medium border border-civic-dark-600"
            >
              {agent}
            </span>
          ))}
        </div>
      </div>

      {/* Divergences Summary */}
      <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-4">
        <h4 className="text-sm font-medium text-civic-gray-300 mb-3">Identifierade Skillnader</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-civic-gray-400">Konsensus:</span>
            <span className="font-medium text-civic-gray-200">{debate.consensus.overallConsensus}%</span>
          </div>
          {debate.divergences.severityCounts && (
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-civic-gray-400">Hög: {debate.divergences.severityCounts.high}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-civic-gray-400">Medel: {debate.divergences.severityCounts.medium}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-civic-gray-400">Låg: {debate.divergences.severityCounts.low}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debate Rounds */}
      {debate.rounds.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-civic-gray-300">Debattrundor</h4>
          {debate.rounds.map((round, idx) => (
            <DebateRoundDisplay key={idx} round={round} />
          ))}
        </div>
      )}

      {/* Voting Panel */}
      {debate.status === 'completed' && debate.winner && (
        <DebateVotingPanel votes={debate.votes} winner={debate.winner} />
      )}

      {/* Winning Answer Analysis */}
      {debate.status === 'completed' && (isAnalyzing || winningAnalysis) && (
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="text-sm font-medium text-civic-gray-300">Analys av Vinnande Svar</h4>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-xs text-civic-gray-400">Analyserar vinnande svar med komplett pipeline...</p>
              </div>
            </div>
          ) : winningAnalysis && (
            <div className="space-y-3">
              <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-3">
                <div className="text-xs text-civic-gray-500 mb-2">Agent:</div>
                <div className="text-sm font-medium text-civic-gray-200">{winningAnalysis.agent}</div>
              </div>

              <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-3">
                <div className="text-xs text-civic-gray-500 mb-2">Svar:</div>
                <div className="text-sm text-civic-gray-300 leading-relaxed">{winningAnalysis.response}</div>
              </div>

              {winningAnalysis.pipelineAnalysis && (
                <div className="bg-civic-dark-900/50 rounded-lg border border-civic-dark-700 p-3">
                  <div className="text-xs text-civic-gray-500 mb-3">Pipeline-analys:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-civic-gray-400">Steg:</span>
                      <span className="text-civic-gray-200">{winningAnalysis.pipelineAnalysis.timeline?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-civic-gray-400">Total tid:</span>
                      <span className="text-civic-gray-200">
                        {winningAnalysis.pipelineAnalysis.timeline?.reduce((sum, step) => sum + (step.durationMs || 0), 0) || 0}ms
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-civic-dark-700">
                    <div className="text-xs text-civic-gray-500">
                      ✅ Komplett analys genomförd med alla pipeline-steg
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-civic-gray-600 italic">
                Analyserat: {new Date(winningAnalysis.analyzedAt).toLocaleString('sv-SE')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {debate.status === 'initiated' && (
        <div className="flex justify-center">
          <button
            onClick={runNextRound}
            disabled={isRunningRound}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isRunningRound ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Genomför runda {debate.currentRound + 1}...</span>
              </>
            ) : (
              <>
                <span>Kör nästa runda</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {debate.status === 'voting' && !debate.winner && (
        <div className="flex justify-center">
          <button
            onClick={startVoting}
            disabled={isVoting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isVoting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Genomför röstning...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Starta AI-röstning</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
