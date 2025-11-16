/**
 * Utility for highlighting keywords in text
 * Used to visually mark words that were identified during analysis
 */

/**
 * Highlight specific words in text
 * @param {string} text - The text to highlight words in
 * @param {Array<string>} words - Array of words to highlight
 * @param {string} color - Color class for highlighting (default: 'bg-yellow-200')
 * @returns {JSX.Element} - Text with highlighted words
 */
export function highlightWords(text, words = [], color = 'bg-civic-gray-600/30') {
  if (!text || !words || words.length === 0) {
    return text;
  }

  // Create a case-insensitive regex pattern for all words
  const pattern = words
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');
  
  if (!pattern) return text;

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlighted = words.some(word => 
      part.toLowerCase() === word.toLowerCase()
    );

    if (isHighlighted) {
      return (
        <mark
          key={index}
          className={`${color} px-1 rounded text-civic-gray-100 font-medium border border-civic-gray-600/50`}
          title="Identifierat nyckelord i analysen"
        >
          {part}
        </mark>
      );
    }

    return part;
  });
}

/**
 * Get all highlighted words from analysis data
 * @param {Object} analysisData - Analysis data containing various analysis results
 * @returns {Array<string>} - Array of all words to highlight
 */
export function extractHighlightWords(analysisData) {
  const words = new Set();

  if (!analysisData) return [];

  // Extract from bias detection
  if (analysisData.biasAnalysis?.detectedBiases) {
    analysisData.biasAnalysis.detectedBiases.forEach(bias => {
      if (bias.words) {
        bias.words.forEach(word => words.add(word));
      }
    });
  }

  // Extract from sentiment analysis
  if (analysisData.sentimentAnalysis?.keywords) {
    analysisData.sentimentAnalysis.keywords.forEach(word => words.add(word));
  }

  // Extract from ideological classification
  if (analysisData.ideologicalClassification?.keywords) {
    analysisData.ideologicalClassification.keywords.forEach(word => words.add(word));
  }

  // Extract from preprocessing (loaded expressions)
  if (analysisData.preprocessing?.loadedExpressions?.loadedExpressions) {
    analysisData.preprocessing.loadedExpressions.loadedExpressions.forEach(expr => {
      words.add(expr.expression);
    });
  }

  return Array.from(words);
}
