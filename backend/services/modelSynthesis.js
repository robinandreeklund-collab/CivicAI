/**
 * Multi-Model Synthesis Service
 * 
 * Synthesizes and compares results from multiple AI models
 * Detects divergences, contradictions, and creates model perspective cards
 */

/**
 * Create model perspective card for a single AI response
 * Shows summary and ratings from that model's perspective
 */
export function createModelPerspectiveCard(response, analysis, enhancedAnalysis) {
  return {
    agent: response.agent,
    summary: {
      responseLength: response.response.length,
      wordCount: response.response.split(/\s+/).length,
      mainEmotion: enhancedAnalysis?.emotion?.primary || 'neutral',
      primaryTone: analysis?.tone?.primary || 'neutral',
      intentType: enhancedAnalysis?.intent?.primary || 'statement',
    },
    ratings: {
      confidence: analysis?.tone?.confidence || 0,
      emotionIntensity: enhancedAnalysis?.emotion?.confidence || 0,
      biasScore: analysis?.bias?.biasScore || 0,
      factualityScore: enhancedAnalysis?.factOpinion?.summary?.factPercentage || 0,
    },
    highlights: {
      mainTopics: enhancedAnalysis?.topics?.mainTopics?.slice(0, 3) || [],
      huvudpunkter: enhancedAnalysis?.argumentation?.huvudpunkter || [],
      keyEntities: enhancedAnalysis?.entities?.entities?.slice(0, 5) || [],
    },
    provenance: {
      model: response.agent,
      analyzedAt: new Date().toISOString(),
      method: 'Multi-model synthesis analysis',
    },
  };
}

/**
 * Detect divergences between model responses
 * Compares tone, emotion, topics, and factuality across models
 */
export function detectDivergences(modelCards) {
  const divergences = [];
  
  if (modelCards.length < 2) {
    return { divergences: [], hasDivergences: false };
  }

  // Compare emotions across models
  const emotions = modelCards.map(card => card.summary.mainEmotion);
  const uniqueEmotions = [...new Set(emotions)];
  if (uniqueEmotions.length > 1) {
    divergences.push({
      type: 'emotion',
      severity: 'medium',
      description: `Olika emotionella toner detekterade: ${uniqueEmotions.join(', ')}`,
      models: modelCards.map(card => ({
        agent: card.agent,
        value: card.summary.mainEmotion,
      })),
    });
  }

  // Compare tones
  const tones = modelCards.map(card => card.summary.primaryTone);
  const uniqueTones = [...new Set(tones)];
  if (uniqueTones.length > 1) {
    divergences.push({
      type: 'tone',
      severity: 'low',
      description: `Olika stilar detekterade: ${uniqueTones.join(', ')}`,
      models: modelCards.map(card => ({
        agent: card.agent,
        value: card.summary.primaryTone,
      })),
    });
  }

  // Compare bias scores
  const biasScores = modelCards.map(card => card.ratings.biasScore);
  const maxBias = Math.max(...biasScores);
  const minBias = Math.min(...biasScores);
  if (maxBias - minBias > 3) {
    divergences.push({
      type: 'bias',
      severity: 'high',
      description: `Stor skillnad i bias-poäng (${minBias} - ${maxBias})`,
      models: modelCards.map(card => ({
        agent: card.agent,
        value: card.ratings.biasScore,
      })),
    });
  }

  // Compare factuality
  const factScores = modelCards.map(card => card.ratings.factualityScore);
  const maxFact = Math.max(...factScores);
  const minFact = Math.min(...factScores);
  if (maxFact - minFact > 30) {
    divergences.push({
      type: 'factuality',
      severity: 'high',
      description: `Stor skillnad i faktahalt (${minFact}% - ${maxFact}%)`,
      models: modelCards.map(card => ({
        agent: card.agent,
        value: card.ratings.factualityScore,
      })),
    });
  }

  return {
    divergences: divergences,
    hasDivergences: divergences.length > 0,
    divergenceCount: divergences.length,
    severityCounts: {
      high: divergences.filter(d => d.severity === 'high').length,
      medium: divergences.filter(d => d.severity === 'medium').length,
      low: divergences.filter(d => d.severity === 'low').length,
    },
  };
}

/**
 * Detect contradictions in actual content between models
 * Looks for opposing statements on the same topic
 */
export function detectContradictions(responses) {
  const contradictions = [];
  
  if (responses.length < 2) {
    return { contradictions: [], hasContradictions: false };
  }

  // Check for contradictory sentiment on shared topics
  const allTopics = responses.map(r => 
    r.enhancedAnalysis?.topics?.mainTopics || []
  );

  // Find common topics
  const topicSets = allTopics.map(topics => 
    new Set(topics.map(t => t.topic))
  );
  
  let commonTopics = [...topicSets[0]];
  for (let i = 1; i < topicSets.length; i++) {
    commonTopics = commonTopics.filter(topic => topicSets[i].has(topic));
  }

  // For each common topic, check if sentiments differ significantly
  commonTopics.forEach(topic => {
    const sentiments = responses.map(r => {
      const sentimentResult = r.analysis?.tone?.primary || 'neutral';
      return { agent: r.agent, sentiment: sentimentResult };
    });

    const uniqueSentiments = [...new Set(sentiments.map(s => s.sentiment))];
    if (uniqueSentiments.length > 1) {
      contradictions.push({
        topic: topic,
        type: 'sentiment',
        description: `Olika perspektiv på "${topic}"`,
        models: sentiments,
      });
    }
  });

  // Check for contradictory fact/opinion classifications
  const factOpinionRatios = responses.map(r => ({
    agent: r.agent,
    factRatio: r.enhancedAnalysis?.factOpinion?.summary?.factPercentage || 0,
  }));

  const maxFactRatio = Math.max(...factOpinionRatios.map(f => f.factRatio));
  const minFactRatio = Math.min(...factOpinionRatios.map(f => f.factRatio));
  
  if (maxFactRatio - minFactRatio > 40) {
    contradictions.push({
      topic: 'Faktahalt vs åsikter',
      type: 'classification',
      description: `Stor skillnad i hur fakta vs åsikter klassificeras`,
      models: factOpinionRatios,
    });
  }

  return {
    contradictions: contradictions,
    hasContradictions: contradictions.length > 0,
    contradictionCount: contradictions.length,
  };
}

/**
 * Synthesize all model responses into a comparative analysis
 */
export function synthesizeModelResponses(responses) {
  // Create model perspective cards for each response
  const modelCards = responses
    .filter(r => !r.metadata?.error)
    .map(r => createModelPerspectiveCard(r, r.analysis, r.enhancedAnalysis));

  // Detect divergences and contradictions
  const divergenceAnalysis = detectDivergences(modelCards);
  const contradictionAnalysis = detectContradictions(
    responses.filter(r => !r.metadata?.error)
  );

  // Calculate consensus metrics
  const consensusMetrics = calculateConsensusMetrics(modelCards);

  // Extract combined insights
  const combinedInsights = extractCombinedInsights(modelCards);

  return {
    modelCards: modelCards,
    divergences: divergenceAnalysis,
    contradictions: contradictionAnalysis,
    consensus: consensusMetrics,
    insights: combinedInsights,
    metadata: {
      totalModels: modelCards.length,
      synthesizedAt: new Date().toISOString(),
      method: 'Multi-model comparative synthesis',
    },
  };
}

/**
 * Calculate consensus metrics across models
 */
function calculateConsensusMetrics(modelCards) {
  if (modelCards.length === 0) {
    return { overallConsensus: 0, areas: [] };
  }

  const consensusAreas = [];

  // Emotion consensus
  const emotions = modelCards.map(card => card.summary.mainEmotion);
  const emotionConsensus = calculateArrayConsensus(emotions);
  consensusAreas.push({
    area: 'Emotion',
    consensus: emotionConsensus,
    dominant: getMostCommon(emotions),
  });

  // Tone consensus
  const tones = modelCards.map(card => card.summary.primaryTone);
  const toneConsensus = calculateArrayConsensus(tones);
  consensusAreas.push({
    area: 'Tone',
    consensus: toneConsensus,
    dominant: getMostCommon(tones),
  });

  // Intent consensus
  const intents = modelCards.map(card => card.summary.intentType);
  const intentConsensus = calculateArrayConsensus(intents);
  consensusAreas.push({
    area: 'Intent',
    consensus: intentConsensus,
    dominant: getMostCommon(intents),
  });

  // Overall consensus (average)
  const overallConsensus = Math.round(
    consensusAreas.reduce((sum, area) => sum + area.consensus, 0) / consensusAreas.length
  );

  return {
    overallConsensus: overallConsensus,
    areas: consensusAreas,
  };
}

/**
 * Calculate consensus percentage for an array of values
 */
function calculateArrayConsensus(values) {
  if (values.length === 0) return 0;
  
  const counts = {};
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(counts));
  return Math.round((maxCount / values.length) * 100);
}

/**
 * Get most common value in array
 */
function getMostCommon(arr) {
  if (arr.length === 0) return null;
  
  const counts = {};
  arr.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
  });
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Extract combined insights from all models
 */
function extractCombinedInsights(modelCards) {
  // Combine all topics
  const allTopics = [];
  modelCards.forEach(card => {
    if (card.highlights.mainTopics) {
      allTopics.push(...card.highlights.mainTopics);
    }
  });

  // Count topic frequency across models
  const topicCounts = {};
  allTopics.forEach(topicObj => {
    const topic = topicObj.topic;
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  // Get most frequently mentioned topics
  const consensusTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic: topic,
      modelCount: count,
      consensus: Math.round((count / modelCards.length) * 100),
    }));

  // Combine all huvudpunkter
  const allHuvudpunkter = [];
  modelCards.forEach(card => {
    if (card.highlights.huvudpunkter) {
      allHuvudpunkter.push(...card.highlights.huvudpunkter);
    }
  });

  // Get unique huvudpunkter
  const uniqueHuvudpunkter = [...new Set(allHuvudpunkter)].slice(0, 5);

  return {
    consensusTopics: consensusTopics,
    huvudpunkter: uniqueHuvudpunkter,
    totalModelsAnalyzed: modelCards.length,
  };
}
