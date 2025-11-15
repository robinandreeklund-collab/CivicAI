/**
 * Ideological Classification Module
 * 
 * METHODOLOGY:
 * This module provides ideological classification on a left-right-center spectrum
 * for political texts. It analyzes political language, policy positions, and
 * ideological markers to assign a political orientation score.
 * 
 * CLASSIFICATION APPROACH:
 * Uses a lexicon-based approach with Swedish political terminology to score
 * texts on multiple ideological dimensions. Similar to PoliticalBERT but
 * using keyword analysis instead of transformer models.
 * 
 * DIMENSIONS ANALYZED:
 * 1. Economic (left-right): Redistribution vs free market
 * 2. Social (progressive-conservative): Social values and cultural issues
 * 3. Authority (libertarian-authoritarian): Individual freedom vs state control
 * 
 * OUTPUT:
 * - Left-right-center score (-1 to 1, where -1 is left, 1 is right, 0 is center)
 * - Confidence score (0 to 1)
 * - Dimension scores for economic, social, and authority axes
 * - Detected political markers and their classifications
 */

/**
 * Classify text on ideological spectrum
 * @param {string} text - The text to analyze
 * @param {string} question - Optional context question
 * @returns {Object} Ideological classification result
 */
export function classifyIdeology(text, question = '') {
  if (!text || typeof text !== 'string') {
    return {
      overallScore: 0,
      classification: 'center',
      confidence: 0,
      dimensions: {
        economic: { score: 0, classification: 'center' },
        social: { score: 0, classification: 'center' },
        authority: { score: 0, classification: 'center' },
      },
      markers: [],
      provenance: {
        model: 'Ideological Classifier',
        version: '1.0.0',
        method: 'Lexicon-based political spectrum analysis',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const textLower = text.toLowerCase();
  const markers = [];

  // Economic dimension lexicons
  const economicLeft = {
    keywords: [
      'välfärd', 'omfördelning', 'skatt på rika', 'offentlig sektor', 'kollektivavtal',
      'arbetsrätt', 'fackförbund', 'socialism', 'jämlikhet', 'solidaritet',
      'vinster i välfärden', 'marknadshyror nej', 'allmännyttan', 'LAS',
      'höja skatten', 'progressiv beskattning', 'klasskamp',
    ],
    weight: 1,
  };

  const economicRight = {
    keywords: [
      'fri marknad', 'lägre skatter', 'företagande', 'privatisering', 'valfrihet',
      'konkurrens', 'avreglering', 'entreprenörskap', 'eget ansvar', 'incitament',
      'ROT-avdrag', 'RUT-avdrag', 'jobbskatteavdrag', 'vinstdrivande',
      'marknadsekonomi', 'kapitalism', 'ägande',
    ],
    weight: 1,
  };

  // Social dimension lexicons
  const socialProgressive = {
    keywords: [
      'jämställdhet', 'HBTQ', 'feminism', 'antirasism', 'mångkultur',
      'klimat', 'miljö', 'hållbarhet', 'inkludering', 'mänskliga rättigheter',
      'öppna gränser', 'flyktingmottagande', 'Pride', 'könsneutral',
      'intersektionalitet', 'regnbåge', 'diversitet',
    ],
    weight: 1,
  };

  const socialConservative = {
    keywords: [
      'tradition', 'kärnfamilj', 'svenska värderingar', 'nationell identitet',
      'begränsa invandring', 'assimilering', 'lag och ordning', 'trygghet',
      'svensk kultur', 'bevarande', 'kristna värderingar', 'svensk modell',
      'gränsskydd', 'återvandring', 'kulturarv', 'folkhem',
    ],
    weight: 1,
  };

  // Authority dimension lexicons
  const libertarian = {
    keywords: [
      'individuell frihet', 'personlig integritet', 'självbestämmande',
      'mindre stat', 'minska byråkrati', 'avskaffa', 'frivilligt',
      'decentralisering', 'lokalt självstyre', 'yttrandefrihet',
      'rättssäkerhet', 'begränsa staten', 'civilsamhälle',
    ],
    weight: 1,
  };

  const authoritarian = {
    keywords: [
      'ordning', 'disciplin', 'kontroll', 'övervakning', 'reglering',
      'förbud', 'tvång', 'statlig styrning', 'centralisering',
      'säkerhetspolitik', 'polismakt', 'hårdare straff', 'auktoritet',
      'nationell säkerhet', 'gränsvakter',
    ],
    weight: 1,
  };

  // Count markers for each dimension
  let economicScore = 0;
  let socialScore = 0;
  let authorityScore = 0;

  // Economic left markers
  economicLeft.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'economic', orientation: 'left' });
      economicScore -= economicLeft.weight;
    }
  });

  // Economic right markers
  economicRight.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'economic', orientation: 'right' });
      economicScore += economicRight.weight;
    }
  });

  // Social progressive markers
  socialProgressive.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'social', orientation: 'progressive' });
      socialScore -= socialProgressive.weight; // Progressive = left on social axis
    }
  });

  // Social conservative markers
  socialConservative.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'social', orientation: 'conservative' });
      socialScore += socialConservative.weight; // Conservative = right on social axis
    }
  });

  // Libertarian markers
  libertarian.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'authority', orientation: 'libertarian' });
      authorityScore -= libertarian.weight;
    }
  });

  // Authoritarian markers
  authoritarian.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      markers.push({ keyword, dimension: 'authority', orientation: 'authoritarian' });
      authorityScore += authoritarian.weight;
    }
  });

  // Normalize scores to -1 to 1 range
  const maxMarkers = Math.max(
    economicLeft.keywords.length,
    economicRight.keywords.length,
    socialProgressive.keywords.length,
    socialConservative.keywords.length,
    libertarian.keywords.length,
    authoritarian.keywords.length
  );

  const normalizedEconomic = economicScore / maxMarkers;
  const normalizedSocial = socialScore / maxMarkers;
  const normalizedAuthority = authorityScore / maxMarkers;

  // Calculate overall left-right score (weighted average)
  // Economic dimension has more weight in traditional left-right classification
  const overallScore = (normalizedEconomic * 0.5 + normalizedSocial * 0.35 + normalizedAuthority * 0.15);

  // Classify based on score
  const classifyScore = (score) => {
    if (score < -0.2) return 'left';
    if (score > 0.2) return 'right';
    return 'center';
  };

  const economicClassification = classifyScore(normalizedEconomic);
  const socialClassification = classifyScore(normalizedSocial);
  const authorityClassification = classifyScore(normalizedAuthority);
  const overallClassification = classifyScore(overallScore);

  // Calculate confidence based on number of markers and score clarity
  const totalMarkers = markers.length;
  const markerConfidence = Math.min(totalMarkers / 10, 1); // More markers = more confidence
  const scoreClarity = Math.abs(overallScore); // How far from center
  const confidence = (markerConfidence * 0.6 + scoreClarity * 0.4);

  // Generate detailed classification
  let detailedClassification = overallClassification;
  if (overallClassification === 'left') {
    if (normalizedEconomic < -0.5) detailedClassification = 'far_left';
    if (normalizedSocial < -0.3 && normalizedEconomic < -0.2) detailedClassification = 'progressive_left';
  } else if (overallClassification === 'right') {
    if (normalizedEconomic > 0.5) detailedClassification = 'far_right';
    if (normalizedSocial > 0.3 && normalizedEconomic > 0.2) detailedClassification = 'conservative_right';
  } else {
    if (Math.abs(normalizedEconomic) < 0.1 && Math.abs(normalizedSocial) < 0.1) {
      detailedClassification = 'center_moderate';
    }
  }

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    classification: overallClassification,
    detailedClassification,
    confidence: Math.round(confidence * 100) / 100,
    dimensions: {
      economic: {
        score: Math.round(normalizedEconomic * 100) / 100,
        classification: economicClassification,
        description: getEconomicDescription(economicClassification),
      },
      social: {
        score: Math.round(normalizedSocial * 100) / 100,
        classification: socialClassification === 'left' ? 'progressive' : socialClassification === 'right' ? 'conservative' : 'moderate',
        description: getSocialDescription(socialClassification),
      },
      authority: {
        score: Math.round(normalizedAuthority * 100) / 100,
        classification: authorityClassification === 'left' ? 'libertarian' : authorityClassification === 'right' ? 'authoritarian' : 'balanced',
        description: getAuthorityDescription(authorityClassification),
      },
    },
    markers: markers,
    markerCount: totalMarkers,
    markersByDimension: {
      economic: markers.filter(m => m.dimension === 'economic').length,
      social: markers.filter(m => m.dimension === 'social').length,
      authority: markers.filter(m => m.dimension === 'authority').length,
    },
    provenance: {
      model: 'Ideological Classifier (PoliticalBERT-like)',
      version: '1.0.0',
      method: 'Multi-dimensional lexicon-based political spectrum analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Get human-readable description for economic classification
 */
function getEconomicDescription(classification) {
  const descriptions = {
    left: 'Förespråkar välfärdsstat, omfördelning och offentlig sektor',
    right: 'Förespråkar fri marknad, lägre skatter och privatisering',
    center: 'Balanserad syn på marknad och välfärd',
  };
  return descriptions[classification] || 'Neutral ekonomisk position';
}

/**
 * Get human-readable description for social classification
 */
function getSocialDescription(classification) {
  const descriptions = {
    left: 'Progressiv syn på sociala frågor och mångkultur',
    right: 'Konservativ syn på traditioner och nationell identitet',
    center: 'Balanserad syn på sociala värderingar',
  };
  return descriptions[classification] || 'Neutral social position';
}

/**
 * Get human-readable description for authority classification
 */
function getAuthorityDescription(classification) {
  const descriptions = {
    left: 'Betonar individuell frihet och begränsad statsmakt',
    right: 'Betonar ordning, kontroll och statlig auktoritet',
    center: 'Balanserad syn på statens roll',
  };
  return descriptions[classification] || 'Neutral auktoritetssyn';
}

/**
 * Get Swedish party alignment suggestion based on ideological profile
 * This is for informational purposes only
 */
export function suggestPartyAlignment(ideologyResult) {
  const { overallScore, dimensions } = ideologyResult;

  // Simplified party mapping (approximate positions)
  const parties = [
    { name: 'Vänsterpartiet (V)', minScore: -1, maxScore: -0.6, description: 'Socialistisk vänsterparti' },
    { name: 'Socialdemokraterna (S)', minScore: -0.6, maxScore: -0.2, description: 'Socialdemokratiskt parti' },
    { name: 'Miljöpartiet (MP)', minScore: -0.5, maxScore: -0.1, description: 'Progressivt miljöparti' },
    { name: 'Centerpartiet (C)', minScore: -0.2, maxScore: 0.2, description: 'Liberalt centerparti' },
    { name: 'Liberalerna (L)', minScore: -0.1, maxScore: 0.3, description: 'Liberalt parti' },
    { name: 'Kristdemokraterna (KD)', minScore: 0.2, maxScore: 0.5, description: 'Konservativt värderingsparti' },
    { name: 'Moderaterna (M)', minScore: 0.2, maxScore: 0.6, description: 'Konservativt högerparti' },
    { name: 'Sverigedemokraterna (SD)', minScore: 0.3, maxScore: 1, description: 'Nationalkonservativt parti' },
  ];

  const matchingParties = parties.filter(party => 
    overallScore >= party.minScore && overallScore <= party.maxScore
  );

  return {
    suggestedParties: matchingParties,
    disclaimer: 'Detta är en ungefärlig bedömning baserad på politiska nyckelord och ska inte ses som en definitiv klassificering.',
    provenance: {
      model: 'Swedish Party Alignment Suggester',
      version: '1.0.0',
      method: 'Score-based party matching',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Perform complete ideological classification with party alignment
 */
export function performCompleteIdeologicalClassification(text, question = '') {
  const startTime = Date.now();

  const ideology = classifyIdeology(text, question);
  const partyAlignment = suggestPartyAlignment(ideology);

  const endTime = Date.now();

  return {
    ideology,
    partyAlignment,
    metadata: {
      processingTimeMs: endTime - startTime,
      textLength: text.length,
      processedAt: new Date().toISOString(),
    },
  };
}
