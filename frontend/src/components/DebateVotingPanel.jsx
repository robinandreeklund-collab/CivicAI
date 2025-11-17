/**
 * DebateVotingPanel Component
 * Displays voting results and winner from AI agent consensus debate with animated voting
 */

import { useState, useEffect } from 'react';

export default function DebateVotingPanel({ votes, winner }) {
  const [revealedVotes, setRevealedVotes] = useState(0);
  const [animatedCounts, setAnimatedCounts] = useState({});

  useEffect(() => {
    if (!votes || votes.length === 0) return;

    // Animate votes one by one
    votes.forEach((vote, index) => {
      setTimeout(() => {
        setRevealedVotes(index + 1);
        
        // Update vote counts with animation
        setAnimatedCounts(prev => {
          const newCounts = { ...prev };
          const votedFor = vote.votedFor;
          if (votedFor) {
            newCounts[votedFor] = (newCounts[votedFor] || 0) + 1;
          }
          return newCounts;
        });
      }, index * 800); // 800ms delay between each vote reveal
    });
  }, [votes]);

  if (!votes || votes.length === 0) {
    return null;
  }

  const allVotesRevealed = revealedVotes === votes.length;

  return (
    <div className="border-t border-[#2a2a2a] pt-6 mt-6">
      {/* Winner Announcement - only show when all votes revealed */}
      {allVotesRevealed && winner && (
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🏆</div>
            <div>
              <div className="font-medium text-[#e7e7e7]">Vinnande Svar</div>
              <div className="text-sm text-[#666]">
                {winner.voteCount} {winner.voteCount === 1 ? 'röst' : 'röster'} av {votes.length}
              </div>
            </div>
          </div>
          <div className="text-lg text-[#e7e7e7] font-medium">
            {winner.agent}
          </div>
        </div>
      )}

      {/* Voting Progress - show during animation */}
      {!allVotesRevealed && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-[#888] mb-2">
            <div className="w-1.5 h-1.5 bg-[#888] rounded-full animate-pulse"></div>
            <span>Röstning pågår...</span>
          </div>
          <div className="text-sm text-[#666]">
            {revealedVotes} av {votes.length} röster avslöjade
          </div>
        </div>
      )}

      {/* Vote Breakdown with Animation */}
      {Object.keys(animatedCounts).length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-[#666]">Röstfördelning</div>
          
          {/* Vote bars */}
          {Object.entries(animatedCounts).map(([agent, count]) => {
            const percentage = (count / votes.length) * 100;
            const isWinner = allVotesRevealed && winner && agent === winner.agent;
            
            return (
              <div key={agent} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`${isWinner ? 'text-[#e7e7e7] font-medium' : 'text-[#888]'}`}>
                    {agent}
                  </span>
                  <span className="text-[#888]">
                    {count} röst{count !== 1 ? 'er' : ''}
                  </span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isWinner 
                        ? 'bg-[#888]' 
                        : 'bg-[#2a2a2a]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual Votes - reveal one by one */}
      <div className="space-y-3">
        <div className="text-sm text-[#666]">Individuella Röster</div>
        <div className="space-y-2">
          {votes.slice(0, revealedVotes).map((vote, idx) => (
            <div 
              key={idx}
              className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-3 animate-slideIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#888]">{vote.voter}</span>
                  <span className="text-sm text-[#666]">→</span>
                  <span className={`text-sm font-medium ${
                    allVotesRevealed && winner && vote.votedFor === winner.agent 
                      ? 'text-[#e7e7e7]' 
                      : 'text-[#888]'
                  }`}>
                    {vote.votedFor || 'Ingen giltig röst'}
                  </span>
                </div>
                {allVotesRevealed && winner && vote.votedFor === winner.agent && (
                  <svg className="w-4 h-4 text-[#888]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {vote.reasoning && (
                <p className="text-sm text-[#888] italic">
                  "{vote.reasoning}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consensus Info */}
      {allVotesRevealed && (
        <div className="pt-4 border-t border-[#2a2a2a] animate-fadeIn">
          <div className="flex items-center gap-2 text-sm text-[#888]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Röstning genomförd av AI-agenter baserat på noggrannhet, klarhet och användbarhet
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
