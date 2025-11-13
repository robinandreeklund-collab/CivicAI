/**
 * Meta-Analysis Service
 * Uses spaCy-like NLP (compromise), TextBlob-like sentiment analysis, and GPT-3.5 meta-reviewer
 * to provide advanced analysis of AI responses
 */

import nlp from 'compromise';
import Sentiment from 'sentiment';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI client:', error.message);
  }
}

const sentiment = new Sentiment();

/**
 * Perform spaCy-like NLP analysis using compromise
 * @param {string} text - Text to analyze
 * @returns {Object} NLP analysis results
 */
export function performNLPAnalysis(text) {
  try {
    const doc = nlp(text);
    
    // Extract dates using compromise's date matching
    let dates = [];
    try {
      // Try to match date patterns
      const dateMatches = doc.match('#Date+');
      if (dateMatches && dateMatches.found) {
        dates = dateMatches.out('array');
      }
    } catch (e) {
      // If date matching fails, just use empty array
      dates = [];
    }
    
    return {
      sentences: doc.sentences().length,
      words: doc.terms().length,
      entities: {
        people: doc.people().out('array') || [],
        places: doc.places().out('array') || [],
        organizations: doc.organizations().out('array') || [],
        dates: dates,
      },
      topics: doc.topics().out('array') || [],
      verbs: doc.verbs().out('array').slice(0, 10) || [], // Top 10 verbs
      nouns: doc.nouns().out('array').slice(0, 15) || [], // Top 15 nouns
      adjectives: doc.adjectives().out('array').slice(0, 10) || [], // Top 10 adjectives
      questions: doc.questions().length || 0,
      hasNegation: doc.has('#Negative') || false,
      hasComparison: doc.has('#Comparative') || false,
    };
  } catch (error) {
    console.error('Error in NLP analysis:', error);
    // Return minimal structure on error
    return {
      sentences: 0,
      words: 0,
      entities: { people: [], places: [], organizations: [], dates: [] },
      topics: [],
      verbs: [],
      nouns: [],
      adjectives: [],
      questions: 0,
      hasNegation: false,
      hasComparison: false,
    };
  }
}

/**
 * Perform TextBlob-like sentiment analysis
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis results
 */
export function performSentimentAnalysis(text) {
  try {
    const result = sentiment.analyze(text);
    
    // Normalize score to -1 to 1 range for polarity
    const polarity = Math.max(-1, Math.min(1, result.score / 10));
    
    // Calculate subjectivity based on comparative and superlative words
    let subjectivity = 0.3; // default
    try {
      const doc = nlp(text);
      const comparatives = doc.match('#Comparative').length || 0;
      const superlatives = doc.match('#Superlative').length || 0;
      const adjectives = doc.adjectives().length || 0;
      const totalTerms = doc.terms().length || 1;
      subjectivity = adjectives > 0 ? 
        Math.min(1, (comparatives + superlatives + adjectives * 0.5) / totalTerms * 5) : 
        0.3;
    } catch (e) {
      console.warn('Error calculating subjectivity:', e.message);
    }
    
    return {
      polarity,  // -1 (negative) to 1 (positive)
      score: result.score || 0,
      comparative: result.comparative || 0,
      subjectivity, // 0 (objective) to 1 (subjective)
      positiveWords: result.positive || [],
      negativeWords: result.negative || [],
      sentiment: polarity > 0.1 ? 'positive' : polarity < -0.1 ? 'negative' : 'neutral',
    };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    // Return neutral sentiment on error
    return {
      polarity: 0,
      score: 0,
      comparative: 0,
      subjectivity: 0.5,
      positiveWords: [],
      negativeWords: [],
      sentiment: 'neutral',
    };
  }
}

/**
 * Use GPT-3.5 as a meta-reviewer to analyze AI responses
 * @param {Array} responses - Array of AI responses to analyze
 * @param {string} question - Original question
 * @returns {Promise<Object>} Meta-analysis from GPT-3.5
 */
export async function performGPTMetaReview(responses, question) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured for meta-review');
    return {
      available: false,
      message: 'GPT-3.5 meta-reviewer inte tillgänglig (API-nyckel saknas)',
    };
  }

  try {
    // Prepare responses summary for meta-review
    const responseSummaries = responses.map((r, idx) => ({
      agent: r.agent,
      responsePreview: r.response.substring(0, 500) + (r.response.length > 500 ? '...' : ''),
      toneDetected: r.analysis?.tone?.primary || 'unknown',
      biasScore: r.analysis?.bias?.biasScore || 0,
      sentimentPolarity: r.metaAnalysis?.sentiment?.polarity || 0,
    }));

    const metaPrompt = `Du är en expert-metagranskare som analyserar AI-svar. Analysera följande svar på frågan: "${question}"

Svar från olika AI-tjänster:
${JSON.stringify(responseSummaries, null, 2)}

Ge en meta-analys som inkluderar:
1. **Konsistens**: Hur konsekventa är svaren mellan tjänster? (0-10)
2. **Kvalitet**: Genomsnittlig svarkvalitet (0-10)
3. **Bias-mönster**: Finns det gemensamma bias-mönster?
4. **Rekommendation**: Vilket svar är mest balanserat och informativt?
5. **Varningar**: Några varningar eller observationer?
6. **Förbättringsområden**: Vad kan förbättras?

Svara ENDAST med valid JSON i detta format:
{
  "consistency": <number 0-10>,
  "overallQuality": <number 0-10>,
  "biasPatterns": [<lista med identifierade mönster>],
  "recommendedAgent": "<agent-id>",
  "recommendationReason": "<kort förklaring>",
  "warnings": [<lista med varningar>],
  "improvements": [<lista med förbättringsförslag>],
  "metaSummary": "<kort sammanfattning av metaanalysen>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Du är en expert på att analysera och jämföra AI-svar. Svara alltid med valid JSON.',
        },
        {
          role: 'user',
          content: metaPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Try to parse JSON response
    try {
      const metaAnalysis = JSON.parse(responseText);
      return {
        available: true,
        reviewer: 'GPT-3.5',
        ...metaAnalysis,
        timestamp: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error('Failed to parse GPT-3.5 meta-review JSON:', parseError);
      return {
        available: true,
        reviewer: 'GPT-3.5',
        rawResponse: responseText,
        parseError: 'Kunde inte tolka svar som JSON',
      };
    }
  } catch (error) {
    console.error('Error in GPT-3.5 meta-review:', error);
    return {
      available: false,
      error: error.message,
      message: 'GPT-3.5 meta-granskare misslyckades',
    };
  }
}

/**
 * Perform complete meta-analysis on a response
 * @param {string} text - Response text
 * @param {string} question - Original question
 * @returns {Object} Complete meta-analysis
 */
export function performCompleteMetaAnalysis(text, question) {
  const nlpAnalysis = performNLPAnalysis(text);
  const sentimentAnalysis = performSentimentAnalysis(text);
  
  return {
    nlp: nlpAnalysis,
    sentiment: sentimentAnalysis,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate meta-analysis summary for UI display
 * @param {Object} metaAnalysis - Meta-analysis object
 * @returns {string} Human-readable summary
 */
export function generateMetaAnalysisSummary(metaAnalysis) {
  if (!metaAnalysis) return 'Ingen meta-analys tillgänglig';
  
  const parts = [];
  
  if (metaAnalysis.nlp) {
    parts.push(`${metaAnalysis.nlp.sentences} meningar, ${metaAnalysis.nlp.words} ord`);
  }
  
  if (metaAnalysis.sentiment) {
    const sentLabel = {
      positive: 'positiv',
      negative: 'negativ',
      neutral: 'neutral',
    }[metaAnalysis.sentiment.sentiment] || 'okänd';
    parts.push(`Sentiment: ${sentLabel} (${Math.round(metaAnalysis.sentiment.polarity * 100) / 100})`);
  }
  
  return parts.join(' • ');
}
