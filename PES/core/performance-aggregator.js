/**
 * PES Phase 2: Performance Aggregator
 * 
 * Aggregates simulation results and compares variants
 * to identify the best performing prompt
 * 
 * Phase 3: Enhanced with vector analysis and category-aware scoring
 */

import { 
  aggregateVectorMetrics, 
  calculateWeightedVectorScore,
  identifyVectorInsights 
} from '../services/vectorAnalysisService.js';

/**
 * Aggregate performance across all simulations
 * @param {Array} simulationResults - Array of simulation results with voting
 * @returns {Object} Aggregated metrics by variant
 */
export function aggregatePerformance(simulationResults, categoryWeights = null) {
  console.log(`[Performance Aggregator] Aggregating ${simulationResults.length} simulation results...`);
  
  if (!simulationResults || simulationResults.length === 0) {
    throw new Error('No simulation results to aggregate');
  }
  
  const variantMetrics = {};
  
  // PHASE 3: Aggregate vector metrics
  const vectorMetrics = aggregateVectorMetrics(simulationResults);
  
  // Group by variant and calculate metrics
  for (const result of simulationResults) {
    const version = result.variant_version;
    
    if (!version) {
      console.warn('[Performance Aggregator] Result missing variant_version, skipping');
      continue;
    }
    
    // Initialize variant metrics if not exists
    if (!variantMetrics[version]) {
      variantMetrics[version] = {
        version: version,
        debates_simulated: 0,
        successful_simulations: 0,
        total_votes: 0,
        wins: 0,
        total_mentions: 0,
        votes_by_category: {},
        performance_by_question_type: {},
        debate_results: [],
        // PHASE 3: Vector metrics
        vector_metrics: null
      };
    }
    
    const metrics = variantMetrics[version];
    metrics.debates_simulated++;
    
    // Skip if voting failed
    if (!result.voting || result.voting.error) {
      console.warn(`[Performance Aggregator] Voting failed for debate ${result.debate_id}, skipping`);
      continue;
    }
    
    metrics.successful_simulations++;
    
    // Aggregate vote data
    const voting = result.voting;
    metrics.total_votes += voting.oneseek_votes || 0;
    metrics.wins += voting.oneseek_won ? 1 : 0;
    metrics.total_mentions += voting.oneseek_mentions || 0;
    
    // Category breakdown
    if (voting.oneseek_vote_categories) {
      for (const [category, count] of Object.entries(voting.oneseek_vote_categories)) {
        metrics.votes_by_category[category] = 
          (metrics.votes_by_category[category] || 0) + count;
      }
    }
    
    // Store individual debate result
    metrics.debate_results.push({
      debate_id: result.debate_id,
      votes: voting.oneseek_votes || 0,
      won: voting.oneseek_won || false,
      mentions: voting.oneseek_mentions || 0,
      total_votes_cast: voting.total_votes || 0
    });
  }
  
  // PHASE 3: Attach vector metrics to each variant
  for (const version in variantMetrics) {
    if (vectorMetrics['ONESEEK']) {
      variantMetrics[version].vector_metrics = vectorMetrics['ONESEEK'];
      variantMetrics[version].vector_insights = vectorMetrics['ONESEEK'].insights;
    }
  }
  
  // Calculate percentages and averages
  for (const version in variantMetrics) {
    const m = variantMetrics[version];
    
    if (m.successful_simulations > 0) {
      m.win_rate = m.wins / m.successful_simulations;
      m.avg_votes_per_debate = m.total_votes / m.successful_simulations;
      m.avg_mentions_per_debate = m.total_mentions / m.successful_simulations;
    } else {
      m.win_rate = 0;
      m.avg_votes_per_debate = 0;
      m.avg_mentions_per_debate = 0;
    }
    
    // Calculate consistency (standard deviation of votes)
    if (m.debate_results.length > 1) {
      const voteValues = m.debate_results.map(d => d.votes);
      m.vote_consistency = calculateStandardDeviation(voteValues);
    } else {
      m.vote_consistency = 0;
    }
  }
  
  console.log(`[Performance Aggregator] Aggregated metrics for ${Object.keys(variantMetrics).length} variants`);
  
  return variantMetrics;
}

/**
 * Select the winner among variants
 * @param {Object} variantMetrics - Aggregated metrics by variant
 * @param {string} baselineVersion - Version of baseline (optional)
 * @returns {Object} Winner selection result
 */
export function selectWinner(variantMetrics, baselineVersion = null) {
  console.log('[Performance Aggregator] Selecting winner from variants...');
  
  const versions = Object.keys(variantMetrics);
  
  if (versions.length === 0) {
    throw new Error('No variants to compare');
  }
  
  // Calculate composite scores for ALL variants (including baseline)
  for (const version in variantMetrics) {
    const variant = variantMetrics[version];
    variant.composite_score = calculateCompositeScore(variant);
  }
  
  if (versions.length === 1) {
    return {
      winner: variantMetrics[versions[0]],
      improvement_percentage: 0,
      all_variants: variantMetrics,
      comparison_method: 'single_variant'
    };
  }
  
  const baseline = baselineVersion ? variantMetrics[baselineVersion] : null;
  let bestVariant = null;
  let bestScore = -Infinity;
  
  // Find best variant (can include baseline if it's actually the best)
  for (const version in variantMetrics) {
    const variant = variantMetrics[version];
    
    if (variant.composite_score > bestScore) {
      bestScore = variant.composite_score;
      bestVariant = variant;
    }
  }
  
  // Calculate improvement vs baseline
  let improvementPercentage = 0;
  if (baseline && bestVariant && bestVariant.version !== baselineVersion) {
    improvementPercentage = calculateImprovement(baseline, bestVariant);
  }
  
  return {
    winner: bestVariant,
    improvement_percentage: improvementPercentage,
    baseline: baseline,
    all_variants: variantMetrics,
    comparison_method: baseline ? 'vs_baseline' : 'relative'
  };
}

/**
 * Calculate composite score for a variant
 * @param {Object} variant - Variant metrics
 * @param {Object} categoryWeights - Optional category-specific weights for vector scoring
 * @returns {number} Composite score
 */
function calculateCompositeScore(variant, categoryWeights = null) {
  // PHASE 3: Enhanced scoring with vector analysis
  const useVectorScoring = variant.vector_metrics && variant.vector_metrics.avg_vector;
  
  if (useVectorScoring) {
    // Phase 3: Vector-based composite scoring
    const weights = {
      vector_score: 0.40,     // 40% - Vector-based quality
      win_rate: 0.25,         // 25% - Win rate
      avg_votes: 0.20,        // 20% - Vote count
      avg_mentions: 0.10,     // 10% - Mentions
      consistency: 0.05       // 5% - Stability
    };
    
    // Calculate vector score (use category weights if provided)
    const vectorScore = categoryWeights ? 
      calculateWeightedVectorScore(variant.vector_metrics.avg_vector, categoryWeights) :
      calculateAverageVectorValue(variant.vector_metrics.avg_vector);
    
    const voteScore = Math.min(variant.avg_votes_per_debate / 4, 1);
    const winScore = variant.win_rate;
    const mentionScore = Math.min(variant.avg_mentions_per_debate / 5, 1);
    const consistencyScore = variant.vector_metrics.consistency_score || 0.5;
    
    const compositeScore = 
      vectorScore * weights.vector_score +
      winScore * weights.win_rate +
      voteScore * weights.avg_votes +
      mentionScore * weights.avg_mentions +
      consistencyScore * weights.consistency;
    
    return compositeScore;
  } else {
    // Phase 2: Traditional scoring (backward compatible)
    const weights = {
      avg_votes: 0.35,        // 35% - Most important
      win_rate: 0.35,         // 35% - Also very important
      avg_mentions: 0.15,     // 15% - Good indicator
      consistency: 0.15       // 15% - Stability matters
    };
    
    const voteScore = Math.min(variant.avg_votes_per_debate / 4, 1);
    const winScore = variant.win_rate;
    const mentionScore = Math.min(variant.avg_mentions_per_debate / 5, 1);
    const consistencyScore = variant.vote_consistency ? 
      Math.max(0, 1 - (variant.vote_consistency / 3)) : 0.5;
    
    const compositeScore = 
      voteScore * weights.avg_votes +
      winScore * weights.win_rate +
      mentionScore * weights.avg_mentions +
      consistencyScore * weights.consistency;
    
    return compositeScore;
  }
}

/**
 * Calculate average value across all dimensions in a vector
 * @param {Object} vector - Vector object
 * @returns {number} Average value
 */
function calculateAverageVectorValue(vector) {
  const values = Object.values(vector);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate improvement percentage
 * @param {Object} baseline - Baseline metrics
 * @param {Object} variant - Variant metrics
 * @returns {number} Improvement percentage
 */
function calculateImprovement(baseline, variant) {
  // Calculate weighted improvement across metrics
  const voteImprovement = baseline.avg_votes_per_debate > 0 ?
    ((variant.avg_votes_per_debate - baseline.avg_votes_per_debate) / baseline.avg_votes_per_debate) : 0;
  
  const winImprovement = baseline.win_rate > 0 ?
    ((variant.win_rate - baseline.win_rate) / baseline.win_rate) : 0;
  
  const mentionImprovement = baseline.avg_mentions_per_debate > 0 ?
    ((variant.avg_mentions_per_debate - baseline.avg_mentions_per_debate) / baseline.avg_mentions_per_debate) : 0;
  
  // Weighted average improvement
  const totalImprovement = 
    voteImprovement * 0.4 +
    winImprovement * 0.4 +
    mentionImprovement * 0.2;
  
  return totalImprovement * 100; // Convert to percentage
}

/**
 * Calculate standard deviation
 * @param {Array} values - Array of numbers
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
  if (!values || values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Generate comparison report
 * @param {Object} variantMetrics - Aggregated metrics
 * @param {Object} winnerResult - Winner selection result
 * @returns {Object} Comparison report
 */
export function generateComparisonReport(variantMetrics, winnerResult) {
  const variants = Object.values(variantMetrics);
  
  // Rank variants by composite score
  const ranked = variants
    .filter(v => v.composite_score !== undefined)
    .sort((a, b) => b.composite_score - a.composite_score);
  
  // Generate insights
  const insights = [];
  
  if (winnerResult.winner) {
    insights.push(`Winner: ${winnerResult.winner.version}`);
    insights.push(`Composite Score: ${(winnerResult.winner.composite_score * 100).toFixed(1)}%`);
    
    if (winnerResult.improvement_percentage) {
      insights.push(`Improvement vs baseline: ${winnerResult.improvement_percentage > 0 ? '+' : ''}${winnerResult.improvement_percentage.toFixed(1)}%`);
    }
    
    // Highlight best performing category
    const categories = winnerResult.winner.votes_by_category;
    if (categories && Object.keys(categories).length > 0) {
      const topCategory = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0];
      insights.push(`Strongest category: ${topCategory[0]} (${topCategory[1]} votes)`);
    }
  }
  
  return {
    summary: {
      total_variants: variants.length,
      total_debates: variants[0]?.debates_simulated || 0,
      winner: winnerResult.winner?.version || 'None'
    },
    ranked_variants: ranked.map(v => ({
      version: v.version,
      composite_score: v.composite_score,
      avg_votes: v.avg_votes_per_debate,
      win_rate: v.win_rate,
      avg_mentions: v.avg_mentions_per_debate
    })),
    insights: insights,
    detailed_metrics: variantMetrics
  };
}

/**
 * Compare two specific variants
 * @param {Object} variant1 - First variant metrics
 * @param {Object} variant2 - Second variant metrics
 * @returns {Object} Comparison result
 */
export function compareVariants(variant1, variant2) {
  if (!variant1 || !variant2) {
    throw new Error('Both variants required for comparison');
  }
  
  const comparison = {
    variant1: variant1.version,
    variant2: variant2.version,
    differences: {}
  };
  
  // Compare key metrics
  comparison.differences.avg_votes = {
    variant1: variant1.avg_votes_per_debate,
    variant2: variant2.avg_votes_per_debate,
    difference: variant2.avg_votes_per_debate - variant1.avg_votes_per_debate,
    percentage: variant1.avg_votes_per_debate > 0 ?
      ((variant2.avg_votes_per_debate - variant1.avg_votes_per_debate) / variant1.avg_votes_per_debate * 100) : 0
  };
  
  comparison.differences.win_rate = {
    variant1: variant1.win_rate,
    variant2: variant2.win_rate,
    difference: variant2.win_rate - variant1.win_rate,
    percentage: variant1.win_rate > 0 ?
      ((variant2.win_rate - variant1.win_rate) / variant1.win_rate * 100) : 0
  };
  
  comparison.differences.avg_mentions = {
    variant1: variant1.avg_mentions_per_debate,
    variant2: variant2.avg_mentions_per_debate,
    difference: variant2.avg_mentions_per_debate - variant1.avg_mentions_per_debate,
    percentage: variant1.avg_mentions_per_debate > 0 ?
      ((variant2.avg_mentions_per_debate - variant1.avg_mentions_per_debate) / variant1.avg_mentions_per_debate * 100) : 0
  };
  
  // Determine which is better overall
  const score1 = calculateCompositeScore(variant1);
  const score2 = calculateCompositeScore(variant2);
  
  comparison.better_variant = score2 > score1 ? variant2.version : variant1.version;
  comparison.score_difference = score2 - score1;
  
  return comparison;
}

export default {
  aggregatePerformance,
  selectWinner,
  generateComparisonReport,
  compareVariants,
  calculateCompositeScore
};
