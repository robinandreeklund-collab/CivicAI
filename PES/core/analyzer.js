/**
 * PES Analyzer
 * 
 * Analyzes simulation results and compares prompt version performance
 */

import { getSimulationsByPromptVersion, getPromptVersions } from '../services/pesFirebaseService.js';
import { PES_CONFIG } from '../config/pesConfig.js';

/**
 * Analyze performance of a prompt version based on its simulations
 * @param {string} promptVersionId - The prompt version ID
 * @returns {Promise<Object>} Performance analysis
 */
export async function analyzePromptPerformance(promptVersionId) {
  console.log(`[PES Analyzer] Analyzing performance for prompt version: ${promptVersionId}`);
  
  try {
    // Get all simulations for this prompt version
    const simulations = await getSimulationsByPromptVersion(promptVersionId);
    
    if (simulations.length === 0) {
      return {
        promptVersionId,
        error: 'No simulations found',
        hasData: false,
      };
    }
    
    // Calculate aggregate performance metrics
    const metrics = calculatePromptMetrics(simulations);
    
    // Determine trends if we have multiple simulations
    const trends = simulations.length > 1 ? calculateTrends(simulations) : null;
    
    // Generate insights
    const insights = generateInsights(metrics, trends, simulations.length);
    
    return {
      promptVersionId,
      hasData: true,
      simulationCount: simulations.length,
      metrics,
      trends,
      insights,
      lastSimulation: simulations[0]?.created_at,
      analyzed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PES Analyzer] Error analyzing prompt performance:', error);
    throw error;
  }
}

/**
 * Compare two prompt versions
 * @param {string} versionId1 - First prompt version ID
 * @param {string} versionId2 - Second prompt version ID
 * @returns {Promise<Object>} Comparison results
 */
export async function comparePromptVersions(versionId1, versionId2) {
  console.log(`[PES Analyzer] Comparing prompt versions: ${versionId1} vs ${versionId2}`);
  
  try {
    // Analyze both versions
    const analysis1 = await analyzePromptPerformance(versionId1);
    const analysis2 = await analyzePromptPerformance(versionId2);
    
    if (!analysis1.hasData || !analysis2.hasData) {
      return {
        error: 'Insufficient data for comparison',
        version1: analysis1,
        version2: analysis2,
      };
    }
    
    // Calculate differences
    const differences = calculateDifferences(analysis1.metrics, analysis2.metrics);
    
    // Determine which is better
    const winner = determineWinner(differences, analysis1, analysis2);
    
    return {
      version1: {
        id: versionId1,
        metrics: analysis1.metrics,
        simulationCount: analysis1.simulationCount,
      },
      version2: {
        id: versionId2,
        metrics: analysis2.metrics,
        simulationCount: analysis2.simulationCount,
      },
      differences,
      winner,
      recommendation: generateComparisonRecommendation(winner, differences),
      compared_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PES Analyzer] Error comparing prompt versions:', error);
    throw error;
  }
}

/**
 * Find the best performing prompt version for a topic
 * @param {string} topic - Topic to filter by (optional)
 * @returns {Promise<Object>} Best prompt version analysis
 */
export async function findBestPromptVersion(topic = null) {
  console.log(`[PES Analyzer] Finding best prompt version${topic ? ` for topic: ${topic}` : ''}`);
  
  try {
    // Get all prompt versions (filtered by topic if specified)
    const promptVersions = await getPromptVersions({
      topic: topic || undefined,
      status: PES_CONFIG.promptVersions.status.ACTIVE,
    });
    
    if (promptVersions.length === 0) {
      return {
        error: 'No prompt versions found',
        topic,
      };
    }
    
    // Analyze each version
    const analyses = [];
    for (const version of promptVersions) {
      try {
        const analysis = await analyzePromptPerformance(version.id);
        if (analysis.hasData) {
          analyses.push({
            version,
            analysis,
          });
        }
      } catch (error) {
        console.error(`[PES Analyzer] Error analyzing version ${version.id}:`, error);
      }
    }
    
    if (analyses.length === 0) {
      return {
        error: 'No prompt versions with simulation data',
        topic,
      };
    }
    
    // Sort by average score (descending)
    analyses.sort((a, b) => 
      b.analysis.metrics.averageScore - a.analysis.metrics.averageScore
    );
    
    const best = analyses[0];
    
    return {
      topic,
      bestVersion: {
        id: best.version.id,
        version: best.version.version,
        topic: best.version.topic,
      },
      metrics: best.analysis.metrics,
      simulationCount: best.analysis.simulationCount,
      alternatives: analyses.slice(1, 3).map(a => ({
        id: a.version.id,
        version: a.version.version,
        averageScore: a.analysis.metrics.averageScore,
      })),
      analyzed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PES Analyzer] Error finding best prompt version:', error);
    throw error;
  }
}

/**
 * Calculate aggregate metrics from simulations
 * @param {Array} simulations - Array of simulation documents
 * @returns {Object} Aggregate metrics
 */
function calculatePromptMetrics(simulations) {
  const allMetrics = simulations
    .map(sim => sim.performance_metrics)
    .filter(m => m && m.averageScore !== undefined);
  
  if (allMetrics.length === 0) {
    return {
      averageScore: 0,
      successRate: 0,
      averageInferenceTime: 0,
    };
  }
  
  const totalScore = allMetrics.reduce((sum, m) => sum + (m.averageScore || 0), 0);
  const totalSuccessRate = allMetrics.reduce((sum, m) => sum + (m.successRate || 0), 0);
  const totalInferenceTime = allMetrics.reduce((sum, m) => sum + (m.averageInferenceTime || 0), 0);
  
  return {
    averageScore: totalScore / allMetrics.length,
    successRate: totalSuccessRate / allMetrics.length,
    averageInferenceTime: totalInferenceTime / allMetrics.length,
    minScore: Math.min(...allMetrics.map(m => m.averageScore || 0)),
    maxScore: Math.max(...allMetrics.map(m => m.averageScore || 0)),
    stdDeviation: calculateStdDev(allMetrics.map(m => m.averageScore || 0)),
  };
}

/**
 * Calculate trends from multiple simulations
 * @param {Array} simulations - Array of simulation documents (ordered by date desc)
 * @returns {Object} Trend analysis
 */
function calculateTrends(simulations) {
  const recentSimulations = simulations.slice(0, 5); // Last 5 simulations
  const scores = recentSimulations.map(s => s.performance_metrics?.averageScore || 0);
  
  // Calculate simple trend (improving/stable/declining)
  let trend = 'stable';
  if (scores.length >= 2) {
    const recentAvg = (scores[0] + scores[1]) / 2;
    const olderAvg = scores.slice(-2).reduce((a, b) => a + b, 0) / 2;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > PES_CONFIG.analysis.improvementThreshold) {
      trend = 'improving';
    } else if (difference < -PES_CONFIG.analysis.improvementThreshold) {
      trend = 'declining';
    }
  }
  
  return {
    trend,
    recentScores: scores,
    averageRecentScore: scores.reduce((a, b) => a + b, 0) / scores.length,
  };
}

/**
 * Generate insights from analysis
 * @param {Object} metrics - Performance metrics
 * @param {Object} trends - Trend analysis
 * @param {number} simulationCount - Number of simulations
 * @returns {Array<Object>} Array of insights
 */
function generateInsights(metrics, trends, simulationCount) {
  const insights = [];
  
  // Performance insights
  if (metrics.averageScore >= PES_CONFIG.metrics.thresholds.excellentScore) {
    insights.push({
      type: 'performance',
      level: 'positive',
      message: `Excellent average score: ${metrics.averageScore.toFixed(3)}`,
    });
  } else if (metrics.averageScore < PES_CONFIG.metrics.thresholds.goodScore) {
    insights.push({
      type: 'performance',
      level: 'warning',
      message: `Below-average score: ${metrics.averageScore.toFixed(3)}`,
    });
  }
  
  // Consistency insights
  const STD_DEV_LOW_THRESHOLD = 0.1;
  const STD_DEV_HIGH_THRESHOLD = 0.2;
  
  if (metrics.stdDeviation < STD_DEV_LOW_THRESHOLD) {
    insights.push({
      type: 'consistency',
      level: 'positive',
      message: 'High consistency across simulations',
    });
  } else if (metrics.stdDeviation > STD_DEV_HIGH_THRESHOLD) {
    insights.push({
      type: 'consistency',
      level: 'warning',
      message: 'High variability in performance',
    });
  }
  
  // Trend insights
  if (trends && trends.trend === 'improving') {
    insights.push({
      type: 'trend',
      level: 'positive',
      message: 'Performance improving over recent simulations',
    });
  } else if (trends && trends.trend === 'declining') {
    insights.push({
      type: 'trend',
      level: 'warning',
      message: 'Performance declining over recent simulations',
    });
  }
  
  // Data quality insights
  if (simulationCount < PES_CONFIG.analysis.minDataPoints) {
    insights.push({
      type: 'data',
      level: 'info',
      message: `Limited data (${simulationCount} simulations). More data needed for reliable analysis.`,
    });
  }
  
  return insights;
}

/**
 * Calculate differences between two metric sets
 * @param {Object} metrics1 - First metric set
 * @param {Object} metrics2 - Second metric set
 * @returns {Object} Differences
 */
function calculateDifferences(metrics1, metrics2) {
  return {
    averageScore: metrics1.averageScore - metrics2.averageScore,
    successRate: metrics1.successRate - metrics2.successRate,
    averageInferenceTime: metrics1.averageInferenceTime - metrics2.averageInferenceTime,
    percentageScoreDiff: ((metrics1.averageScore - metrics2.averageScore) / metrics2.averageScore) * 100,
  };
}

/**
 * Determine winner between two prompt versions
 * @param {Object} differences - Calculated differences
 * @param {Object} analysis1 - First analysis
 * @param {Object} analysis2 - Second analysis
 * @returns {string} Winner ID ('version1', 'version2', or 'tie')
 */
function determineWinner(differences, analysis1, analysis2) {
  const scoreDiff = Math.abs(differences.averageScore);
  
  // If difference is below improvement threshold, it's a tie
  if (scoreDiff < PES_CONFIG.analysis.improvementThreshold) {
    return 'tie';
  }
  
  // Winner is the one with higher average score
  return differences.averageScore > 0 ? 'version1' : 'version2';
}

/**
 * Generate comparison recommendation
 * @param {string} winner - Winner ID
 * @param {Object} differences - Calculated differences
 * @returns {string} Recommendation text
 */
function generateComparisonRecommendation(winner, differences) {
  if (winner === 'tie') {
    return 'Both versions perform similarly. Consider other factors like inference time or consistency when choosing.';
  }
  
  const scoreDiffPercent = Math.abs(differences.percentageScoreDiff).toFixed(1);
  
  if (winner === 'version1') {
    return `Version 1 performs ${scoreDiffPercent}% better than Version 2. Consider using Version 1 for production.`;
  } else {
    return `Version 2 performs ${scoreDiffPercent}% better than Version 1. Consider using Version 2 for production.`;
  }
}

/**
 * Calculate standard deviation
 * @param {Array<number>} values - Array of numbers
 * @returns {number} Standard deviation
 */
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  
  return Math.sqrt(avgSquareDiff);
}

export default {
  analyzePromptPerformance,
  comparePromptVersions,
  findBestPromptVersion,
};
