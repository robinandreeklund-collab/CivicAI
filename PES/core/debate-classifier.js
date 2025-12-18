/**
 * PES Phase 3: Debate Classifier
 * 
 * Automatically classifies debates into main category and subcategory
 * Uses ONESEEK for classification
 */

import { generateWithOneseek } from '../services/oneseekService.js';

// Main categories
export const MAIN_CATEGORIES = [
  'ekonomi',
  'filosofi',
  'etik',
  'teknik',
  'samhälle',
  'miljö',
  'säkerhet',
  'politik'
];

// Subcategories per main category
export const SUBCATEGORIES = {
  ekonomi: ['välfärd', 'skatt', 'tillväxt', 'arbete', 'handel'],
  filosofi: ['medvetande', 'kunskap', 'existens', 'logik', 'mening'],
  etik: ['rättigheter', 'plikt', 'konsekvens', 'dygd', 'rättvisa'],
  teknik: ['AI', 'automation', 'digitalisering', 'innovation', 'infrastruktur'],
  samhälle: ['utbildning', 'kultur', 'integration', 'jämlikhet', 'familj'],
  miljö: ['klimat', 'energi', 'biodiversitet', 'föroreningar', 'resurser'],
  säkerhet: ['försvar', 'polis', 'integritet', 'cyber', 'terror'],
  politik: ['demokrati', 'ideologi', 'förvaltning', 'internationellt', 'representation']
};

/**
 * Classify a debate question into category and subcategory
 * @param {string} question - The debate question to classify
 * @returns {Promise<Object>} Classification result with main, sub, and confidence
 */
export async function classifyDebate(question) {
  if (!question || typeof question !== 'string') {
    console.warn('[Classifier] Invalid question, returning default classification');
    return getDefaultClassification();
  }

  const classificationPrompt = `
Klassificera följande debattfråga i huvudkategori och subkategori.

FRÅGA: "${question}"

HUVUDKATEGORIER:
- ekonomi: ekonomisk politik, välfärd, arbetsmarknad, tillväxt
- filosofi: existentiella frågor, medvetande, epistemologi, logik
- etik: moraliska dilemman, rättigheter, plikt, värden
- teknik: AI, automation, digitalisering, innovation
- samhälle: social struktur, kultur, utbildning, integration
- miljö: klimat, energi, hållbarhet, naturvård
- säkerhet: försvar, brottsbekämpning, integritet, cybersäkerhet
- politik: demokrati, maktfördelning, ideologier, förvaltning

SUBKATEGORIER (exempel):
ekonomi → välfärd, skatt, tillväxt, arbete, handel
filosofi → medvetande, kunskap, existens, logik, mening
etik → rättigheter, plikt, konsekvens, dygd, rättvisa
teknik → AI, automation, digitalisering, innovation, infrastruktur
samhälle → utbildning, kultur, integration, jämlikhet, familj
miljö → klimat, energi, biodiversitet, föroreningar, resurser
säkerhet → försvar, polis, integritet, cyber, terror
politik → demokrati, ideologi, förvaltning, internationellt, representation

Svara ENDAST med JSON (ingen annan text):
{
  "main": "huvudkategori",
  "sub": "subkategori",
  "confidence": 0.0-1.0
}
`;

  try {
    const response = await generateWithOneseek(classificationPrompt, {
      temperature: 0.3,
      max_tokens: 150,
      skip_sources: true,
      skip_context_enrichment: true
    });

    // Extract JSON from response
    const jsonMatch = response.response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn('[Classifier] No JSON found in ONESEEK response');
      return getDefaultClassification();
    }

    const classification = JSON.parse(jsonMatch[0]);

    // Validate
    if (!classification.main || !classification.sub) {
      console.warn('[Classifier] Invalid classification format');
      return getDefaultClassification();
    }

    // Normalize and validate main category
    const main = classification.main.toLowerCase();
    if (!MAIN_CATEGORIES.includes(main)) {
      console.warn(`[Classifier] Unknown main category: ${main}, using default`);
      return getDefaultClassification();
    }

    // Normalize confidence
    const confidence = typeof classification.confidence === 'number' ? 
      Math.max(0, Math.min(1, classification.confidence)) : 0.5;

    const result = {
      main: main,
      sub: classification.sub.toLowerCase(),
      confidence: confidence,
      classified_at: new Date().toISOString()
    };

    console.log(`[Classifier] ${question} → ${result.main}/${result.sub} (${result.confidence.toFixed(2)})`);
    
    return result;

  } catch (error) {
    console.error('[Classifier] Error classifying debate:', error.message);
    return getDefaultClassification();
  }
}

/**
 * Get default classification (fallback)
 * @returns {Object} Default classification
 */
function getDefaultClassification() {
  return {
    main: 'samhälle',
    sub: 'allmänt',
    confidence: 0.5,
    classified_at: new Date().toISOString()
  };
}

/**
 * Classify multiple debates in batch
 * @param {Array} debates - Array of debate objects with question field
 * @returns {Promise<Array>} Array of debates with classification added
 */
export async function classifyDebatesBatch(debates) {
  console.log(`[Classifier] Classifying ${debates.length} debates in batch...`);
  
  const classified = [];
  
  for (const debate of debates) {
    // Skip if already classified
    if (debate.classification && debate.classification.main) {
      console.log(`[Classifier] Debate ${debate.debate_id} already classified, skipping`);
      classified.push(debate);
      continue;
    }

    try {
      const classification = await classifyDebate(debate.question);
      classified.push({
        ...debate,
        classification: classification
      });
    } catch (error) {
      console.error(`[Classifier] Error classifying debate ${debate.debate_id}:`, error.message);
      classified.push({
        ...debate,
        classification: getDefaultClassification()
      });
    }
  }

  console.log(`[Classifier] Batch classification complete: ${classified.length} debates`);
  
  return classified;
}

/**
 * Analyze category distribution in a set of debates
 * @param {Array} debates - Array of debates with classification
 * @returns {Array} Category distribution sorted by count
 */
export function analyzeCategoryDistribution(debates) {
  const distribution = {};
  
  for (const debate of debates) {
    if (!debate.classification || !debate.classification.main) continue;
    
    const categoryKey = `${debate.classification.main}-${debate.classification.sub}`;
    
    if (!distribution[categoryKey]) {
      distribution[categoryKey] = {
        category: categoryKey,
        main: debate.classification.main,
        sub: debate.classification.sub,
        count: 0
      };
    }
    
    distribution[categoryKey].count++;
  }
  
  // Convert to array and calculate percentages
  const total = debates.length;
  const distributionArray = Object.values(distribution).map(d => ({
    ...d,
    percentage: (d.count / total * 100).toFixed(1)
  }));
  
  // Sort by count descending
  distributionArray.sort((a, b) => b.count - a.count);
  
  return distributionArray;
}

/**
 * Get category-specific guidance for prompt generation
 * @param {string} category - Main category
 * @returns {string} Guidance text
 */
export function getCategorySpecificGuidance(category) {
  const guidance = {
    ekonomi: 'Betona konkreta förslag, data och bevis. Fokusera på praktisk genomförbarhet och ekonomiska effekter.',
    filosofi: 'Utmana grundantaganden. Var originell och djupgående. Abstrakta resonemang och begreppsanalys uppskattas.',
    etik: 'Balansera olika perspektiv. Var rättvis och nyanserad. Tydlig moralisk position med respekt för alternativa synsätt.',
    teknik: 'Teknisk precision och detaljer. Praktisk implementation. Faktabaserad argumentation med konkreta exempel.',
    samhälle: 'Bred förståelse för sociala sammanhang. Balansera olika gruppers intressen. Praktiska och empatiska lösningar.',
    miljö: 'Vetenskaplig grund och fakta. Långsiktigt perspektiv. Balans mellan miljö och andra intressen.',
    säkerhet: 'Konkreta riskanalyser. Balans mellan säkerhet och frihet. Praktiska lösningar med tydlig motivering.',
    politik: 'Tydlig position men rättvis mot andra åsikter. Förståelse för demokratiska processer. Praktisk genomförbarhet.'
  };
  
  return guidance[category] || 'Balansera alla dimensioner och fokusera på saklig argumentation.';
}

export default {
  classifyDebate,
  classifyDebatesBatch,
  analyzeCategoryDistribution,
  getCategorySpecificGuidance,
  MAIN_CATEGORIES,
  SUBCATEGORIES
};
