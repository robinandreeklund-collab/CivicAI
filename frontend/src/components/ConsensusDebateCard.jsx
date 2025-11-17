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

  // Auto-progress through rounds after debate starts
  useEffect(() => {
    if (debate && debate.status === 'initiated' && !isRunningRound && debate.currentRound < 3) {
      // Auto-run next round after a brief delay for smooth UX
      const timer = setTimeout(() => {
        runNextRound();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [debate, isRunningRound]);

  // Auto-trigger voting when max rounds reached
  useEffect(() => {
    if (debate && debate.status === 'voting' && !isVoting && !debate.winner) {
      const timer = setTimeout(() => {
        startVoting();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [debate, isVoting]);

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
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">💬</div>
          <div>
            <div className="font-medium text-[#e7e7e7]">Konsensus Live Debatt</div>
            <div className="text-sm text-[#666]">Startar debatt...</div>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#888] mx-auto mb-4"></div>
            <p className="text-sm text-[#888]">Initierar AI-agenter...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">⚠️</div>
          <div>
            <div className="font-medium text-[#e7e7e7]">Fel uppstod</div>
            <div className="text-sm text-[#666]">Kunde inte starta debatt</div>
          </div>
        </div>
        <p className="text-[#888] leading-relaxed mb-4">{error}</p>
        <button
          onClick={initiateDebate}
          className="px-4 py-2 bg-[#2a2a2a] text-[#e7e7e7] rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm"
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
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">💬</div>
          <div>
            <div className="font-medium text-[#e7e7e7]">Konsensus Live Debatt</div>
            <div className="text-sm text-[#666]">AI-agenter debatterar och når konsensus</div>
          </div>
        </div>
        
        {/* Recommendation banner when consensus is low */}
        {shouldRecommend && (
          <div className="mb-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-[#e7e7e7] mb-1">
                  Live debatt rekommenderas
                </div>
                <div className="text-sm text-[#888]">
                  Låg konsensus ({consensus}%) detekterad. En debatt kan hjälpa till att klargöra skillnader.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div>
            <div className="text-[#666] text-sm mb-1">Konsensus</div>
            <div className="text-[#e7e7e7] font-medium">{consensus}%</div>
          </div>
          <div>
            <div className="text-[#666] text-sm mb-1">Skillnader</div>
            <div className="text-[#e7e7e7] font-medium">{modelSynthesis.divergences?.divergenceCount || 0} st</div>
          </div>
          <div>
            <div className="text-[#666] text-sm mb-1">Max agenter</div>
            <div className="text-[#e7e7e7] font-medium">5 st</div>
          </div>
          <div>
            <div className="text-[#666] text-sm mb-1">Max rundor</div>
            <div className="text-[#e7e7e7] font-medium">3 rundor</div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-[#888] leading-relaxed mb-6">
          Starta en live-debatt där AI-agenter presenterar sina perspektiv, 
          svarar på varandras argument och röstar på det bästa svaret.
        </p>
        
        {/* Action Button */}
        <button
          onClick={initiateDebate}
          disabled={isInitiating}
          className="w-full px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:opacity-50 text-[#e7e7e7] rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Starta Konsensus Live Debatt</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">💬</div>
        <div className="flex-1">
          <div className="font-medium text-[#e7e7e7]">Konsensus Live Debatt</div>
          <div className="text-sm text-[#666]">
            {debate.status === 'initiated' && 'Pågående debatt...'}
            {debate.status === 'voting' && 'Röstning pågår...'}
            {debate.status === 'completed' && 'Debatt avslutad'}
          </div>
        </div>
        <div className="text-sm text-[#666]">
          Runda {debate.currentRound} / 3
        </div>
      </div>

      {/* Participants */}
      <div className="mb-6">
        <div className="text-sm text-[#666] mb-2">Deltagare</div>
        <div className="flex flex-wrap gap-2">
          {debate.participants.map((agent, idx) => (
            <span 
              key={idx}
              className="px-3 py-1 bg-[#1a1a1a] text-[#888] rounded text-sm border border-[#2a2a2a]"
            >
              {agent}
            </span>
          ))}
        </div>
      </div>

      {/* Debate Rounds */}
      {debate.rounds.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-[#666] mb-3">Debattrundor</div>
          <div className="space-y-3">
            {debate.rounds.map((round, idx) => (
              <DebateRoundDisplay key={idx} round={round} isLatest={idx === debate.rounds.length - 1} />
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator when running round */}
      {isRunningRound && (
        <div className="flex items-center gap-2 text-sm text-[#888] py-3">
          <div className="w-1.5 h-1.5 bg-[#888] rounded-full animate-pulse"></div>
          <span>Agenter formulerar svar...</span>
        </div>
      )}

      {/* Voting indicator */}
      {isVoting && (
        <div className="flex items-center gap-2 text-sm text-[#888] py-3">
          <div className="w-1.5 h-1.5 bg-[#888] rounded-full animate-pulse"></div>
          <span>Agenter röstar...</span>
        </div>
      )}

      {/* Voting Panel */}
      {debate.status === 'completed' && debate.winner && (
        <DebateVotingPanel votes={debate.votes} winner={debate.winner} />
      )}

      {/* Winning Answer Analysis */}
      {debate.status === 'completed' && (isAnalyzing || winningAnalysis) && (
        <div className="mt-6 border-t border-[#2a2a2a] pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🏆</div>
            <div>
              <div className="font-medium text-[#e7e7e7]">Analys av Vinnande Svar</div>
              <div className="text-sm text-[#666]">Komplett pipeline-analys</div>
            </div>
          </div>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="text-sm font-medium text-civic-gray-300">Analys av Vinnande Svar</h4>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#888] mx-auto mb-3"></div>
                <p className="text-sm text-[#888]">Analyserar vinnande svar...</p>
              </div>
            </div>
          ) : winningAnalysis && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[#666] mb-1">Agent</div>
                <div className="text-[#e7e7e7]">{winningAnalysis.agent}</div>
              </div>

              <div>
                <div className="text-sm text-[#666] mb-2">Svar</div>
                <div className="text-[#888] leading-relaxed">{winningAnalysis.response}</div>
              </div>

              {winningAnalysis.pipelineAnalysis && (
                <div>
                  <div className="text-sm text-[#666] mb-2">Pipeline-analys</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[#666] mb-1">Steg</div>
                      <div className="text-[#e7e7e7]">{winningAnalysis.pipelineAnalysis.timeline?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-[#666] mb-1">Total tid</div>
                      <div className="text-[#e7e7e7]">
                        {winningAnalysis.pipelineAnalysis.timeline?.reduce((sum, step) => sum + (step.durationMs || 0), 0) || 0}ms
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                    <div className="text-sm text-[#888]">
                      ✅ Komplett analys genomförd med alla pipeline-steg
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-[#666] italic">
                Analyserat: {new Date(winningAnalysis.analyzedAt).toLocaleString('sv-SE')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
