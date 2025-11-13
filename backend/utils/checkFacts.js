/**
 * Fact Checking Utility
 * Basic fact checking without external API dependencies
 * Identifies claims that should be verified
 */

/**
 * Check for factual claims in text that should be verified
 * @param {string} text - The response text to analyze
 * @returns {{claimsFound: number, verifiableClaims: Array<Object>, recommendVerification: boolean, summary: string}} 
 *   An object containing:
 *     - claimsFound: Number of unique claims found in the text.
 *     - verifiableClaims: Array of claim objects ({type, description, claim, context}).
 *     - recommendVerification: Whether verification is recommended (boolean).
 *     - summary: A summary string of the fact checking results.
 */
export function checkFacts(text) {
  if (!text || typeof text !== 'string') {
    return {
      claimsFound: 0,
      verifiableClaims: [],
      recommendVerification: false,
    };
  }

  const verifiableClaims = [];

  // Patterns that indicate factual claims
  const claimPatterns = [
    // Statistical claims
    {
      pattern: /(\d+%|\d+\s*procent)/gi,
      type: 'statistical',
      description: 'Statistiskt påstående',
    },
    // Date-based claims
    {
      pattern: /(\d{4}|senaste\s+\w+|förra\s+året|i\s+år)/gi,
      type: 'temporal',
      description: 'Tidsbundet påstående',
    },
    // Numerical facts
    {
      pattern: /(\d+\s+(miljoner|miljarder|tusen|hundra))/gi,
      type: 'numerical',
      description: 'Numeriskt påstående',
    },
    // Scientific claims
    {
      pattern: /(forskning\s+visar|studier\s+tyder\s+på|enligt\s+forskning)/gi,
      type: 'scientific',
      description: 'Vetenskapligt påstående',
    },
    // Historical claims
    {
      pattern: /(historiskt|ursprungligen|etablerad\s+\d{4})/gi,
      type: 'historical',
      description: 'Historiskt påstående',
    },
  ];

  // Check for each pattern
  claimPatterns.forEach(({ pattern, type, description }) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Get context around the match
      matches.forEach(match => {
        const index = text.indexOf(match);
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + match.length + 50);
        const context = text.substring(start, end).trim();

        verifiableClaims.push({
          type,
          description,
          claim: match,
          context: context.length > 100 ? context.substring(0, 100) + '...' : context,
        });
      });
    }
  });

  // Check for definitive statements that might need verification
  const definitivePatterns = [
    'är faktiskt',
    'bevisat att',
    'det är känt att',
    'alla experter',
    'vetenskapen säger',
  ];

  definitivePatterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) {
      const index = text.toLowerCase().indexOf(pattern);
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + pattern.length + 70);
      const context = text.substring(start, end).trim();

      verifiableClaims.push({
        type: 'definitive',
        description: 'Definitivt påstående',
        claim: pattern,
        context: context.length > 100 ? context.substring(0, 100) + '...' : context,
      });
    }
  });

  // Remove duplicates
  const uniqueClaims = verifiableClaims.filter((claim, index, self) =>
    index === self.findIndex(c => c.context === claim.context)
  );

  return {
    claimsFound: uniqueClaims.length,
    verifiableClaims: uniqueClaims.slice(0, 5), // Limit to 5 most relevant
    recommendVerification: uniqueClaims.length > 2,
    summary: generateSummary(uniqueClaims),
  };
}

/**
 * Generate a summary of fact checking results
 * @param {Array} claims - Array of claims
 * @returns {string} Summary text
 */
function generateSummary(claims) {
  if (claims.length === 0) {
    return 'Inga specifika verifierbara påståenden identifierade.';
  }

  const types = {};
  claims.forEach(claim => {
    types[claim.type] = (types[claim.type] || 0) + 1;
  });

  const typeDescriptions = {
    statistical: 'statistiska',
    temporal: 'tidsbundna',
    numerical: 'numeriska',
    scientific: 'vetenskapliga',
    historical: 'historiska',
    definitive: 'definitiva',
  };

  const parts = [];
  for (const [type, count] of Object.entries(types)) {
    parts.push(`${count} ${typeDescriptions[type] || type}`);
  }

  return `Identifierade ${claims.length} verifierbara påståenden: ${parts.join(', ')}.`;
}

/**
 * Get verification priority for a claim
 * @param {Object} claim - Claim object
 * @returns {string} Priority level
 */
export function getVerificationPriority(claim) {
  const highPriority = ['statistical', 'scientific', 'definitive'];
  const mediumPriority = ['numerical', 'historical'];
  
  if (highPriority.includes(claim.type)) return 'high';
  if (mediumPriority.includes(claim.type)) return 'medium';
  return 'low';
}
