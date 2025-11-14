/**
 * Tone Analysis Utility
 * 
 * METHODOLOGY:
 * This module analyzes the tone and style of AI responses using a keyword-based semantic approach.
 * The analysis identifies linguistic patterns and vocabulary choices to classify text into
 * tone categories like formal, informal, technical, empathetic, analytical, or persuasive.
 * 
 * CALCULATION METHOD:
 * 1. Keyword Identification: Scans text for tone-specific keywords in each category
 * 2. Scoring: Each matched keyword increases the score for its tone category
 * 3. Structure Analysis: Examines text features (questions, lists) for additional signals
 * 4. Dominant Tone Selection: Chooses the category with the highest score
 * 5. Confidence Calculation: Computes confidence based on score dominance and text length
 * 
 * CONFIDENCE FORMULA:
 * confidence = 0.5 + ((max_score / total_scores) * min(word_count / 200, 1) * 0.45)
 * - Base confidence starts at 50%
 * - Score dominance (how much one tone stands out) contributes up to 45%
 * - Text length factor ensures longer texts give more reliable results
 * - Final range: 50% - 95% to reflect realistic uncertainty
 * 
 * STANDOUT DATA INFLUENCERS:
 * - High keyword density in specific category = stronger signal
 * - Structural features (many lists = analytical, many questions = empathetic)
 * - Text length (short texts have inherently lower confidence)
 */

/**
 * Analyze the tone of a text response
 * @param {string} text - The response text to analyze
 * @returns {{primary: string, confidence: number, characteristics: string[], wordCount?: number}} 
 * An object containing:
 *   - primary: The primary detected tone (e.g., 'formal', 'analytical')
 *   - confidence: Confidence score for the detected tone (0.5-0.95)
 *   - characteristics: List of top 3 detected tone characteristics with scores
 *   - wordCount: Number of words in the input text
 */
export function analyzeTone(text) {
  if (!text || typeof text !== 'string') {
    return {
      primary: 'neutral',
      confidence: 0,
      characteristics: [],
    };
  }

  // Tone indicators with keywords for each category
  // Each matched keyword increases the score for that tone
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
  
  // STEP 1: Count keyword occurrences for each tone category
  // Each keyword match increments the score for that tone
  for (const [, data] of Object.entries(toneIndicators)) {
    data.keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        data.score++;
      }
    });
  }

  // STEP 2: Structural analysis - Question marks indicate empathetic/explanatory tone
  // Questions suggest the text is engaging with the reader
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks > 0) {
    toneIndicators.empathetic.score += questionMarks;
  }

  // STEP 3: List detection - Lists indicate structured/analytical presentation
  // Multiple list items (>2) strongly suggest analytical tone
  const listItems = (text.match(/\n\s*[\d\-\*•]/g) || []).length;
  if (listItems > 2) {
    toneIndicators.analytical.score += 2; // Bonus for structured content
  }

  // STEP 4: Find dominant tone (highest score = primary tone)
  let maxScore = 0;
  let primaryTone = 'neutral';
  const characteristics = [];

  for (const [tone, data] of Object.entries(toneIndicators)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      primaryTone = tone;
    }
    // Track all tones with non-zero scores for characteristics array
    if (data.score > 0) {
      characteristics.push({
        tone,
        score: data.score,
      });
    }
  }

  // STEP 5: Calculate confidence based on score dominance and text length
  const wordCount = text.split(/\s+/).length;
  const totalScores = Object.values(toneIndicators).reduce((sum, data) => sum + data.score, 0);
  
  // Score ratio: How dominant is the top tone compared to all detected tones?
  // Higher ratio = more confident classification
  const scoreRatio = totalScores > 0 ? maxScore / totalScores : 0;
  
  // Length factor: Longer texts provide more data points for reliable analysis
  // Caps at 200 words for maximum confidence contribution
  const lengthFactor = Math.min(wordCount / 200, 1);
  
  // Final confidence calculation: Base 50% + (dominance * length * 45%)
  // Range: 0.5 to 0.95 to reflect realistic uncertainty levels
  const rawConfidence = scoreRatio * lengthFactor;
  const confidence = Math.max(0.5, Math.min(0.95, 0.5 + (rawConfidence * 0.45)));

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
