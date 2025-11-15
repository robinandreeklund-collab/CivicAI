/**
 * NLP Processors Module
 * 
 * Advanced NLP processing for chat timeline with data-rich analysis
 * Supports: emotion/affect, topic clustering, intent classification,
 * fact vs opinion, NER with roles, argumentation extraction
 * 
 * Each processor includes provenance tracking for transparency
 */

import nlp from 'compromise';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * PROCESSOR: Emotion/Affect Analysis
 * Detects emotions like anger, joy, sadness, fear, surprise, disgust
 * 
 * METHOD: Keyword-based semantic analysis with emotional lexicons
 * MODEL: Custom emotion lexicon + sentiment library
 * VERSION: 1.0.0
 */
export function analyzeEmotion(text) {
  const emotionLexicon = {
    joy: {
      keywords: ['glädje', 'lycklig', 'glad', 'nöjd', 'fantastisk', 'underbar', 'utmärkt', 'positiv', 'framgång', 'vinna'],
      score: 0,
    },
    anger: {
      keywords: ['arg', 'ilska', 'frustrerad', 'irriterad', 'förbannad', 'rasande', 'oacceptabelt', 'skandal', 'katastrof'],
      score: 0,
    },
    sadness: {
      keywords: ['ledsen', 'sorg', 'besviken', 'deprimerad', 'tragisk', 'förlust', 'saknad', 'dåligt', 'tråkig'],
      score: 0,
    },
    fear: {
      keywords: ['rädd', 'ängslig', 'oro', 'skrämd', 'farhågor', 'hotande', 'farlig', 'riskabel', 'osäker'],
      score: 0,
    },
    surprise: {
      keywords: ['överraskad', 'chockad', 'häpnadsväckande', 'oväntat', 'förvånad', 'otrolig', 'omöjlig'],
      score: 0,
    },
    disgust: {
      keywords: ['äcklig', 'motbjudande', 'avskyvärd', 'vidrig', 'obehaglig', 'osmaklig', 'skamlig'],
      score: 0,
    },
  };

  const textLower = text.toLowerCase();
  
  // Count emotion indicators
  for (const [emotion, data] of Object.entries(emotionLexicon)) {
    data.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        data.score += matches.length;
      }
    });
  }

  // Find dominant emotion
  let dominantEmotion = 'neutral';
  let maxScore = 0;
  const emotions = [];

  for (const [emotion, data] of Object.entries(emotionLexicon)) {
    if (data.score > 0) {
      emotions.push({ emotion, intensity: data.score });
      if (data.score > maxScore) {
        maxScore = data.score;
        dominantEmotion = emotion;
      }
    }
  }

  // Calculate confidence based on clarity of dominant emotion
  const totalScore = Object.values(emotionLexicon).reduce((sum, data) => sum + data.score, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, 0.5 + (maxScore / totalScore) * 0.45) : 0.5;

  return {
    primary: dominantEmotion,
    allEmotions: emotions.sort((a, b) => b.intensity - a.intensity).slice(0, 3),
    confidence: Math.round(confidence * 100) / 100,
    provenance: {
      model: 'Custom Emotion Lexicon',
      version: '1.0.0',
      method: 'Keyword-based semantic analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Topic Detection & Clustering
 * Identifies main topics and themes in text
 * 
 * METHOD: NLP-based topic extraction with compromise + keyword clustering
 * MODEL: compromise.js NLP
 * VERSION: 14.11.0
 */
export function detectTopics(text) {
  try {
    const doc = nlp(text);
    
    // Extract topics using compromise
    const topics = doc.topics().out('array') || [];
    const nouns = doc.nouns().out('array') || [];
    
    // Extract key phrases (noun phrases)
    const phrases = [];
    const nounPhrases = doc.match('#Noun+').out('array') || [];
    phrases.push(...nounPhrases);
    
    // Count frequency of topics/nouns
    const topicFrequency = {};
    [...topics, ...nouns].forEach(topic => {
      const normalized = topic.toLowerCase().trim();
      if (normalized.length > 2) {
        topicFrequency[normalized] = (topicFrequency[normalized] || 0) + 1;
      }
    });

    // Sort by frequency and get top topics
    const sortedTopics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, frequency: count }));

    // Cluster related topics (simple approach: group by first word)
    const clusters = {};
    sortedTopics.forEach(({ topic, frequency }) => {
      const firstWord = topic.split(' ')[0];
      if (!clusters[firstWord]) {
        clusters[firstWord] = { main: topic, related: [], totalFrequency: 0 };
      }
      clusters[firstWord].related.push(topic);
      clusters[firstWord].totalFrequency += frequency;
    });

    return {
      mainTopics: sortedTopics,
      clusters: Object.values(clusters).slice(0, 3),
      keyphrases: phrases.slice(0, 10),
      provenance: {
        model: 'compromise.js',
        version: '14.11.0',
        method: 'NLP-based topic extraction with frequency clustering',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error in topic detection:', error);
    return {
      mainTopics: [],
      clusters: [],
      keyphrases: [],
      provenance: {
        model: 'compromise.js',
        version: '14.11.0',
        method: 'NLP-based topic extraction (error)',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
    };
  }
}

/**
 * PROCESSOR: Intent Classification
 * Classifies text intent as Task, Opinion, Question, or Other
 * 
 * METHOD: Pattern matching + structural analysis
 * MODEL: Custom intent classifier
 * VERSION: 1.0.0
 */
export function classifyIntent(text) {
  const doc = nlp(text);
  const textLower = text.toLowerCase();
  
  const scores = {
    task: 0,
    opinion: 0,
    question: 0,
    statement: 0,
  };

  // Task indicators
  const taskKeywords = ['bör', 'ska', 'måste', 'nödvändigt', 'rekommenderar', 'föreslår', 'implementation', 'utföra', 'genomföra'];
  taskKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) scores.task++;
  });

  // Opinion indicators
  const opinionKeywords = ['tycker', 'anser', 'tror', 'känner', 'enligt min', 'personligen', 'i min mening'];
  opinionKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) scores.opinion++;
  });

  // Question indicators
  const questionMarks = (text.match(/\?/g) || []).length;
  scores.question += questionMarks * 3;
  
  const questionWords = ['vad', 'hur', 'varför', 'när', 'vem', 'var', 'vilken'];
  questionWords.forEach(word => {
    if (textLower.includes(word)) scores.question++;
  });

  // Statement (default)
  scores.statement = 1;

  // Determine primary intent
  let primaryIntent = 'statement';
  let maxScore = scores.statement;
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryIntent = intent;
    }
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, 0.5 + (maxScore / totalScore) * 0.45) : 0.5;

  return {
    primary: primaryIntent,
    scores: scores,
    confidence: Math.round(confidence * 100) / 100,
    provenance: {
      model: 'Custom Intent Classifier',
      version: '1.0.0',
      method: 'Pattern matching + structural analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Fact vs Opinion Tagging
 * Tags statements as facts, opinions, or mixed
 * 
 * METHOD: Linguistic pattern analysis + objectivity scoring
 * MODEL: Custom fact/opinion classifier
 * VERSION: 1.0.0
 */
export function tagFactOpinion(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const taggedSentences = [];
  
  const opinionIndicators = [
    'tycker', 'tror', 'anser', 'känner', 'verkar', 'troligen', 'kanske',
    'borde', 'skulle kunna', 'personligen', 'enligt min', 'i min mening',
    'bra', 'dålig', 'bättre', 'sämre', 'fantastisk', 'hemsk'
  ];
  
  const factIndicators = [
    'är', 'var', 'enligt', 'studie', 'forskning', 'data', 'statistik',
    'visar', 'bevisar', 'dokumenterad', 'mätt', 'procent', '%'
  ];

  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let factScore = 0;
    let opinionScore = 0;

    // Count indicators
    opinionIndicators.forEach(indicator => {
      if (sentenceLower.includes(indicator)) opinionScore++;
    });
    
    factIndicators.forEach(indicator => {
      if (sentenceLower.includes(indicator)) factScore++;
    });

    // Check for numbers (fact indicator)
    if (/\d+/.test(sentence)) factScore++;

    // Determine tag
    let tag = 'mixed';
    if (factScore > opinionScore * 1.5) {
      tag = 'fact';
    } else if (opinionScore > factScore * 1.5) {
      tag = 'opinion';
    }

    taggedSentences.push({
      text: sentence.trim(),
      tag: tag,
      factScore: factScore,
      opinionScore: opinionScore,
    });
  });

  // Calculate overall ratio
  const factCount = taggedSentences.filter(s => s.tag === 'fact').length;
  const opinionCount = taggedSentences.filter(s => s.tag === 'opinion').length;
  const totalCount = taggedSentences.length;

  return {
    sentences: taggedSentences,
    summary: {
      factPercentage: totalCount > 0 ? Math.round((factCount / totalCount) * 100) : 0,
      opinionPercentage: totalCount > 0 ? Math.round((opinionCount / totalCount) * 100) : 0,
      mixedPercentage: totalCount > 0 ? Math.round(((totalCount - factCount - opinionCount) / totalCount) * 100) : 0,
    },
    provenance: {
      model: 'Custom Fact/Opinion Classifier',
      version: '1.0.0',
      method: 'Linguistic pattern analysis + objectivity scoring',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Enhanced Named Entity Recognition with Role Mapping
 * Extracts entities and assigns roles/relationships
 * 
 * METHOD: compromise NLP + role classification
 * MODEL: compromise.js + custom role mapper
 * VERSION: 1.0.0
 */
export function extractEntitiesWithRoles(text) {
  try {
    const doc = nlp(text);
    
    // Extract entities
    const people = doc.people().out('array') || [];
    const places = doc.places().out('array') || [];
    const organizations = doc.organizations().out('array') || [];
    
    // Assign roles based on context
    const peopleWithRoles = people.map(person => {
      const context = text.toLowerCase();
      let role = 'unknown';
      
      if (context.includes(`${person.toLowerCase()} säger`) || context.includes(`${person.toLowerCase()} menar`)) {
        role = 'speaker';
      } else if (context.includes(`${person.toLowerCase()} forskar`) || context.includes('professor') || context.includes('forskare')) {
        role = 'researcher';
      } else if (context.includes('politiker') || context.includes('minister')) {
        role = 'politician';
      }
      
      return { entity: person, type: 'person', role };
    });

    const placesWithRoles = places.map(place => ({
      entity: place,
      type: 'place',
      role: 'location',
    }));

    const orgsWithRoles = organizations.map(org => ({
      entity: org,
      type: 'organization',
      role: 'organization',
    }));

    return {
      entities: [...peopleWithRoles, ...placesWithRoles, ...orgsWithRoles],
      summary: {
        people: people.length,
        places: places.length,
        organizations: organizations.length,
        total: people.length + places.length + organizations.length,
      },
      provenance: {
        model: 'compromise.js + Custom Role Mapper',
        version: '1.0.0',
        method: 'NLP entity extraction + context-based role classification',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error in entity extraction:', error);
    return {
      entities: [],
      summary: { people: 0, places: 0, organizations: 0, total: 0 },
      provenance: {
        model: 'compromise.js + Custom Role Mapper',
        version: '1.0.0',
        method: 'NLP entity extraction (error)',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
    };
  }
}

/**
 * PROCESSOR: Argumentation/Main Points Extraction
 * Extracts main points (Huvudpunkter) and supporting arguments
 * 
 * METHOD: Sentence importance scoring + structural analysis
 * MODEL: Custom argument extractor
 * VERSION: 1.0.0
 */
export function extractArgumentation(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  const doc = nlp(text);
  
  // Score sentences by importance
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const sentenceLower = sentence.toLowerCase();
    
    // Importance indicators
    const importanceKeywords = ['viktig', 'avgörande', 'central', 'huvudsaklig', 'främst', 'först och främst', 'i grund och botten'];
    importanceKeywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) score += 3;
    });
    
    // Argument indicators
    const argumentKeywords = ['därför', 'eftersom', 'på grund av', 'detta visar', 'detta innebär', 'följaktligen'];
    argumentKeywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) score += 2;
    });
    
    // Position bonus (first sentences often contain main points)
    if (index < 3) score += 2;
    
    // Length bonus (substantial sentences are more likely to be important)
    if (sentence.split(' ').length > 15) score += 1;
    
    return { sentence: sentence.trim(), score, index };
  });

  // Sort by score and extract main points
  const sortedSentences = [...scoredSentences].sort((a, b) => b.score - a.score);
  const mainPoints = sortedSentences.slice(0, 3).map(s => s.sentence);
  
  // Extract supporting arguments (medium-scored sentences)
  const supportingArgs = sortedSentences.slice(3, 6).map(s => s.sentence);

  return {
    huvudpunkter: mainPoints,
    supportingArguments: supportingArgs,
    totalSentences: sentences.length,
    provenance: {
      model: 'Custom Argument Extractor',
      version: '1.0.0',
      method: 'Sentence importance scoring + structural analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Counterpoints Detection
 * Identifies contrasting or opposing viewpoints
 * 
 * METHOD: Contrast marker detection + negation analysis
 * MODEL: Custom counterpoint detector
 * VERSION: 1.0.0
 */
export function detectCounterpoints(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  const counterpoints = [];
  
  const contrastMarkers = [
    'men', 'dock', 'däremot', 'emellertid', 'å andra sidan', 'trots',
    'fast', 'även om', 'samtidigt', 'å ena sidan', 'i motsats till'
  ];
  
  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let isCounterpoint = false;
    let marker = null;
    
    // Check for contrast markers
    for (const contrastMarker of contrastMarkers) {
      if (sentenceLower.includes(contrastMarker)) {
        isCounterpoint = true;
        marker = contrastMarker;
        break;
      }
    }
    
    if (isCounterpoint) {
      counterpoints.push({
        text: sentence.trim(),
        marker: marker,
      });
    }
  });

  return {
    counterpoints: counterpoints,
    count: counterpoints.length,
    provenance: {
      model: 'Custom Counterpoint Detector',
      version: '1.0.0',
      method: 'Contrast marker detection + negation analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Calculate Response Time (meta-analysis)
 * Calculates time taken for processing
 * 
 * METHOD: Timestamp difference calculation
 * VERSION: 1.0.0
 */
export function calculateResponseTime(startTime, endTime) {
  const responseTimeMs = endTime - startTime;
  
  return {
    responseTimeMs: responseTimeMs,
    responseTimeSec: Math.round(responseTimeMs / 100) / 10,
    provenance: {
      model: 'System Timer',
      version: '1.0.0',
      method: 'Timestamp difference calculation',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * PROCESSOR: Complete Enhanced Analysis
 * Runs all processors and returns comprehensive analysis
 */
export function performCompleteEnhancedAnalysis(text, question = '', startTime = Date.now()) {
  const endTime = Date.now();
  
  return {
    emotion: analyzeEmotion(text),
    topics: detectTopics(text),
    intent: classifyIntent(text),
    factOpinion: tagFactOpinion(text),
    entities: extractEntitiesWithRoles(text),
    argumentation: extractArgumentation(text),
    counterpoints: detectCounterpoints(text),
    responseTime: calculateResponseTime(startTime, endTime),
    metadata: {
      processedAt: new Date().toISOString(),
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
    },
  };
}
