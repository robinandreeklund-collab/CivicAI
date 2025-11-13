/**
 * Tone Analysis Utility
 * Analyzes the tone and style of AI responses
 */

/**
 * Analyze the tone of a text response
 * @param {string} text - The response text to analyze
 * @returns {Object} Tone analysis results
 */
export function analyzeTone(text) {
  if (!text || typeof text !== 'string') {
    return {
      primary: 'neutral',
      confidence: 0,
      characteristics: [],
    };
  }

  const toneIndicators = {
    formal: {
      keywords: ['således', 'emellertid', 'följaktligen', 'dessutom', 'däremot', 'härigenom'],
      score: 0,
    },
    informal: {
      keywords: ['typ', 'liksom', 'typ av', 'ganska', 'rätt så'],
      score: 0,
    },
    technical: {
      keywords: ['algoritm', 'system', 'process', 'struktur', 'implementation', 'parameter', 'funktion'],
      score: 0,
    },
    empathetic: {
      keywords: ['förstå', 'känner', 'upplevelse', 'viktigt att', 'respekt', 'hänsyn'],
      score: 0,
    },
    analytical: {
      keywords: ['analys', 'faktorer', 'påverkar', 'resultat', 'därför', 'eftersom', 'beror på'],
      score: 0,
    },
    persuasive: {
      keywords: ['bör', 'måste', 'nödvändigt', 'avgörande', 'essentiellt', 'rekommenderar'],
      score: 0,
    },
  };

  const textLower = text.toLowerCase();
  
  // Count keyword occurrences for each tone
  for (const [tone, data] of Object.entries(toneIndicators)) {
    data.keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        data.score++;
      }
    });
  }

  // Check for question marks (indicates informative/explanatory tone)
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks > 0) {
    toneIndicators.empathetic.score += questionMarks;
  }

  // Check for lists (indicates structured/analytical tone)
  const listItems = (text.match(/\n\s*[\d\-\*•]/g) || []).length;
  if (listItems > 2) {
    toneIndicators.analytical.score += 2;
  }

  // Find dominant tone
  let maxScore = 0;
  let primaryTone = 'neutral';
  const characteristics = [];

  for (const [tone, data] of Object.entries(toneIndicators)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      primaryTone = tone;
    }
    if (data.score > 0) {
      characteristics.push({
        tone,
        score: data.score,
      });
    }
  }

  // Calculate confidence based on word count
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(maxScore / Math.max(wordCount / 100, 1), 1);

  return {
    primary: primaryTone,
    confidence: Math.round(confidence * 100) / 100,
    characteristics: characteristics
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.tone),
    wordCount,
  };
}

/**
 * Get a human-readable description of the tone
 * @param {string} tone - The tone identifier
 * @returns {string} Description in Swedish
 */
export function getToneDescription(tone) {
  const descriptions = {
    formal: 'Formell och professionell',
    informal: 'Informell och vardaglig',
    technical: 'Teknisk och specifik',
    empathetic: 'Empatisk och inkluderande',
    analytical: 'Analytisk och strukturerad',
    persuasive: 'Övertygande och rådgivande',
    neutral: 'Neutral och balanserad',
  };

  return descriptions[tone] || 'Okänd ton';
}
