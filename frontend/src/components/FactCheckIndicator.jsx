import { useState } from 'react';

/**
 * FactCheckIndicator Component
 * Displays fact checking information for AI responses
 */
export default function FactCheckIndicator({ factCheck }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!factCheck || factCheck.claimsFound === 0) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Inga specifika påståenden att verifiera</span>
      </div>
    );
  }

  const priorityColors = {
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    low: 'text-blue-400 bg-blue-400/10',
  };

  return (
    <div className="space-y-2">
      {/* Summary */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs font-medium">
            {factCheck.claimsFound} verifierbart{factCheck.claimsFound > 1 ? 'a' : ''} påstående{factCheck.claimsFound > 1 ? 'n' : ''}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Details */}
      {isExpanded && (
        <div className="space-y-2 animate-fade-in">
          {/* Summary text */}
          {factCheck.summary && (
            <div className="px-3 py-2 bg-civic-dark-700/30 rounded-lg text-xs text-gray-300">
              {factCheck.summary}
            </div>
          )}

          {/* Individual claims */}
          {factCheck.verifiableClaims && factCheck.verifiableClaims.length > 0 && (
            <div className="space-y-2">
              {factCheck.verifiableClaims.map((claim, index) => {
                const priority = getClaimPriority(claim.type);
                const colorClass = priorityColors[priority] || priorityColors.low;
                
                return (
                  <div
                    key={index}
                    className={`px-3 py-2 rounded-lg ${colorClass}`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <div className="text-xs font-medium mb-1">
                          {claim.description}
                        </div>
                        <div className="text-xs opacity-80 break-words">
                          {claim.context}
                        </div>
                        <div className="text-xs opacity-60 mt-1 capitalize">
                          Typ: {claim.type}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendation */}
          {factCheck.recommendVerification && (
            <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs text-orange-300">
              <div className="flex items-center space-x-2">
                <span>💡</span>
                <span>Rekommenderar verifiering av påståenden via externa källor</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Determine claim priority based on type
 * @param {string} type - Claim type
 * @returns {string} Priority level
 */
function getClaimPriority(type) {
  const highPriority = ['statistical', 'scientific', 'definitive'];
  const mediumPriority = ['numerical', 'historical'];
  
  if (highPriority.includes(type)) return 'high';
  if (mediumPriority.includes(type)) return 'medium';
  return 'low';
}
