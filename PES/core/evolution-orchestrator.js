/**
 * PES Phase 2: Evolution Orchestrator
 * 
 * Main orchestrator for the full evolution loop
 * Coordinates debate analysis, variant generation, simulation, and winner selection
 */

import { analyzeDebatePatterns } from './debate-analyzer.js';
import { generatePromptVariants } from './prompt-generator.js';
import { simulateMultipleDebates } from './historical-simulator.js';
import { simulateVotingForMultiple } from './voting-simulator.js';
import { aggregatePerformance, selectWinner, generateComparisonReport } from './performance-aggregator.js';
import { getDebates } from '../services/pesFirebaseService.js';

/**
 * Run a complete evolution loop
 * @param {Object} config - Evolution configuration
 * @param {string} config.baseline_prompt - Current baseline prompt text
 * @param {string} config.baseline_version - Version of baseline
 * @param {number} config.debate_count - Number of debates to analyze (default: 15)
 * @param {number} config.variant_count - Number of variants to generate (default: 5)
 * @param {boolean} config.auto_iterate - Whether to auto-iterate if improvement found
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Evolution results
 */
export async function runEvolutionLoop(config, progressCallback = null) {
  // Use provided evolution_id or generate new one
  const evolutionId = config.evolution_id || generateEvolutionId();
  
  console.log(`[Evolution Orchestrator] Starting evolution loop ${evolutionId}`);
  
  const progress = {
    evolution_id: evolutionId,
    status: 'running',
    current_step: 'initialization',
    steps_completed: 0,
    total_steps: 6,
    start_time: new Date().toISOString()
  };
  
  const results = {
    evolution_id: evolutionId,
    config: config,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Step 1: Fetch historical debates
    updateProgress(progress, 'fetching_debates', 'Fetching historical debates...', progressCallback);
    
    const debateCount = config.debate_count || 15;
    const debates = await fetchHistoricalDebates(debateCount);
    
    if (debates.length === 0) {
      throw new Error('No historical debates available for analysis');
    }
    
    results.debates_used = debates.map(d => d.id || d.debate_id);
    results.debates_count = debates.length;
    
    console.log(`[Evolution Orchestrator] Fetched ${debates.length} debates`);
    
    // Step 2: Analyze debate patterns
    updateProgress(progress, 'analyzing_patterns', 'Analyzing debate patterns with AI...', progressCallback);
    
    const insights = await analyzeDebatePatterns(debates);
    results.insights = insights;
    
    console.log(`[Evolution Orchestrator] Analysis complete. Win rate: ${(insights.overall_metrics.win_rate * 100).toFixed(1)}%`);
    
    // Step 3: Generate prompt variants
    updateProgress(progress, 'generating_variants', 'Generating prompt variants...', progressCallback);
    
    const variantCount = config.variant_count || 5;
    const variants = await generatePromptVariants(
      config.baseline_prompt,
      insights,
      variantCount
    );
    
    results.variants_generated = variants.length;
    results.variants = variants.map(v => ({
      version: v.version,
      hypothesis: v.hypothesis,
      expected_improvement: v.expected_improvement,
      prompt_text: v.prompt_text  // Include full prompt text for display
    }));
    
    console.log(`[Evolution Orchestrator] Generated ${variants.length} variants`);
    
    // Step 4: Simulate all variants on all debates
    updateProgress(progress, 'running_simulations', 'Running simulations...', progressCallback);
    
    const allSimulations = [];
    
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      updateProgress(
        progress,
        'running_simulations',
        `Simulating variant ${i + 1}/${variants.length} (${variant.version})...`,
        progressCallback,
        {
          simulations_completed: i * debates.length,
          simulations_total: variants.length * debates.length
        }
      );
      
      const simulations = await simulateMultipleDebates(debates, variant);
      allSimulations.push(...simulations);
    }
    
    results.simulations_run = allSimulations.length;
    
    console.log(`[Evolution Orchestrator] Completed ${allSimulations.length} simulations`);
    
    // Step 5: Simulate voting for all simulations
    updateProgress(progress, 'simulating_votes', 'Simulating AI voting...', progressCallback);
    
    const votingResults = await simulateVotingForMultiple(allSimulations);
    results.voting_simulations = votingResults.length;
    
    console.log(`[Evolution Orchestrator] Completed voting for ${votingResults.length} debates`);
    
    // Step 6: Aggregate performance and select winner
    updateProgress(progress, 'analyzing_results', 'Analyzing results and selecting winner...', progressCallback);
    
    const aggregatedMetrics = aggregatePerformance(votingResults);
    const winnerResult = selectWinner(aggregatedMetrics, config.baseline_version);
    
    // Add prompt_text and hypothesis from variants to aggregated metrics
    for (const variant of variants) {
      if (aggregatedMetrics[variant.version]) {
        aggregatedMetrics[variant.version].prompt_text = variant.prompt_text;
        aggregatedMetrics[variant.version].hypothesis = variant.hypothesis;
        aggregatedMetrics[variant.version].expected_improvement = variant.expected_improvement;
      }
    }
    
    results.all_variant_metrics = aggregatedMetrics;
    results.winner = winnerResult.winner;
    results.improvement_percentage = winnerResult.improvement_percentage;
    results.baseline_metrics = winnerResult.baseline;
    
    // Generate comparison report
    const report = generateComparisonReport(aggregatedMetrics, winnerResult);
    results.report = report;
    
    console.log(`[Evolution Orchestrator] Winner: ${winnerResult.winner?.version || 'None'}`);
    console.log(`[Evolution Orchestrator] Improvement: ${winnerResult.improvement_percentage?.toFixed(1) || 0}%`);
    
    // Step 7: Complete
    updateProgress(progress, 'completed', 'Evolution loop completed', progressCallback);
    
    results.status = 'completed';
    results.duration_seconds = calculateDuration(progress.start_time);
    
    // Optional: Auto-iterate if significant improvement found
    if (config.auto_iterate && winnerResult.improvement_percentage > 20) {
      console.log(`[Evolution Orchestrator] Significant improvement found (${winnerResult.improvement_percentage.toFixed(1)}%), considering iteration...`);
      results.iteration_recommended = true;
    }
    
    return results;
    
  } catch (error) {
    console.error('[Evolution Orchestrator] Error in evolution loop:', error);
    
    updateProgress(progress, 'failed', `Error: ${error.message}`, progressCallback);
    
    results.status = 'failed';
    results.error = error.message;
    results.duration_seconds = calculateDuration(progress.start_time);
    
    throw error;
  }
}

/**
 * Fetch historical debates for analysis
 * @param {number} count - Number of debates to fetch
 * @returns {Promise<Array>} Array of debates
 */
async function fetchHistoricalDebates(count) {
  console.log(`[Evolution Orchestrator] Fetching ${count} historical debates...`);
  
  try {
    // Fetch completed debates from Firebase
    const debates = await getDebates({
      limit: count,
      status: 'completed',
      orderBy: 'timestamp',
      orderDirection: 'desc'
    });
    
    // Filter debates that have valid structure with responses
    // ONESEEK participates in debates - filter for debates where ONESEEK is a participant
    const validDebates = debates.filter(debate => {
      // Debug: Log debate structure
      console.log(`[DEBUG] Checking debate ${debate.debate_id}:`);
      console.log(`  - status: ${debate.status}`);
      console.log(`  - participants: ${JSON.stringify(debate.participants)}`);
      console.log(`  - has rounds: ${debate.rounds ? true : false}, count: ${debate.rounds ? debate.rounds.length : 0}`);
      console.log(`  - has vote_results: ${debate.vote_results ? true : false}, count: ${debate.vote_results ? debate.vote_results.length : 0}`);
      console.log(`  - has votes: ${debate.votes ? true : false}, votes: ${JSON.stringify(debate.votes)}`);
      console.log(`  - has winner: ${debate.winner ? true : false}, winner: ${typeof debate.winner === 'string' ? debate.winner : JSON.stringify(debate.winner)}`);
      
      // Must have completed status
      if (debate.status !== 'completed') {
        console.log(`  - REJECTED: status is not completed`);
        return false;
      }
      
      // Must have ONESEEK as participant
      const hasOneseek = debate.participants && 
                         Array.isArray(debate.participants) && 
                         debate.participants.some(p => p && p.toLowerCase() === 'oneseek');
      
      if (!hasOneseek) {
        console.log(`  - REJECTED: no oneseek participant`);
        return false;
      }
      
      // Must have rounds with responses
      const hasRounds = debate.rounds && Array.isArray(debate.rounds) && debate.rounds.length > 0;
      
      if (!hasRounds) {
        console.log(`  - REJECTED: no rounds`);
        return false;
      }
      
      // Must have voting data to analyze
      // Firebase structure has:
      // - vote_results: array of {voter, voted_for, motivation}
      // - votes: object/map like {deepseek: 3, gemini: 1, gpt: 1}
      // - winner: string like "deepseek" OR object like {agent: "deepseek"}
      const hasVoteResults = debate.vote_results && Array.isArray(debate.vote_results) && debate.vote_results.length > 0;
      const hasVotes = debate.votes && typeof debate.votes === 'object' && Object.keys(debate.votes).length > 0;
      
      // Check winner - can be string OR object with agent property
      let hasWinner = false;
      if (debate.winner) {
        if (typeof debate.winner === 'string') {
          hasWinner = debate.winner.length > 0;
        } else if (typeof debate.winner === 'object' && debate.winner.agent) {
          hasWinner = true;
        }
      }
      
      if ((!hasVoteResults && !hasVotes) || !hasWinner) {
        console.log(`  - REJECTED: no voting data (vote_results=${hasVoteResults}, votes=${hasVotes}) or winner=${hasWinner}`);
        return false;
      }
      
      console.log(`  - ACCEPTED!`);
      return true;
    });
    
    console.log(`[Evolution Orchestrator] Found ${validDebates.length} valid debates with ONESEEK participation`);
    
    return validDebates;
  } catch (error) {
    console.error('[Evolution Orchestrator] Error fetching debates:', error);
    throw error;
  }
}

/**
 * Generate unique evolution ID
 * @returns {string} Evolution ID
 */
function generateEvolutionId() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const random = Math.random().toString(36).substring(2, 6); // Random suffix
  
  return `evo_${dateStr}_${timeStr}_${random}`;
}

/**
 * Update progress and call callback if provided
 * @param {Object} progress - Progress object
 * @param {string} status - Current status
 * @param {string} message - Progress message
 * @param {Function} callback - Callback function
 * @param {Object} extraData - Additional data
 */
function updateProgress(progress, status, message, callback, extraData = {}) {
  progress.status = status;
  progress.current_step = message;
  progress.steps_completed = getStepNumber(status);
  progress.last_update = new Date().toISOString();
  
  // Merge extra data
  Object.assign(progress, extraData);
  
  // Calculate progress percentage
  if (progress.simulations_total) {
    progress.simulation_percentage = Math.round(
      (progress.simulations_completed / progress.simulations_total) * 100
    );
  }
  
  console.log(`[Evolution Orchestrator] Progress: ${message} (${progress.steps_completed}/${progress.total_steps})`);
  
  if (callback && typeof callback === 'function') {
    callback({ ...progress });
  }
}

/**
 * Get step number from status
 * @param {string} status - Status string
 * @returns {number} Step number
 */
function getStepNumber(status) {
  const steps = {
    'initialization': 0,
    'fetching_debates': 1,
    'analyzing_patterns': 2,
    'generating_variants': 3,
    'running_simulations': 4,
    'simulating_votes': 5,
    'analyzing_results': 6,
    'completed': 6,
    'failed': 0
  };
  
  return steps[status] || 0;
}

/**
 * Calculate duration in seconds
 * @param {string} startTime - ISO timestamp
 * @returns {number} Duration in seconds
 */
function calculateDuration(startTime) {
  const start = new Date(startTime);
  const end = new Date();
  return Math.round((end - start) / 1000);
}

/**
 * Resume an evolution loop from saved state
 * @param {string} evolutionId - Evolution ID to resume
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<Object>} Evolution results
 */
export async function resumeEvolutionLoop(evolutionId, progressCallback = null) {
  console.log(`[Evolution Orchestrator] Resuming evolution loop ${evolutionId}`);
  
  // TODO: Implement resume functionality by loading state from Firebase
  // For now, throw error as this is advanced functionality
  throw new Error('Resume functionality not yet implemented');
}

/**
 * Cancel a running evolution loop
 * @param {string} evolutionId - Evolution ID to cancel
 * @returns {Promise<boolean>} Success status
 */
export async function cancelEvolutionLoop(evolutionId) {
  console.log(`[Evolution Orchestrator] Canceling evolution loop ${evolutionId}`);
  
  // TODO: Implement cancellation by setting flag in Firebase
  // For now, just log
  console.warn('[Evolution Orchestrator] Cancellation not yet implemented');
  return false;
}

/**
 * Get status of a running evolution loop
 * @param {string} evolutionId - Evolution ID
 * @returns {Promise<Object>} Status object
 */
export async function getEvolutionStatus(evolutionId) {
  console.log(`[Evolution Orchestrator] Getting status for evolution ${evolutionId}`);
  
  // TODO: Load status from Firebase or memory
  // For now, return placeholder
  return {
    evolution_id: evolutionId,
    status: 'unknown',
    message: 'Status tracking not yet implemented'
  };
}

export default {
  runEvolutionLoop,
  resumeEvolutionLoop,
  cancelEvolutionLoop,
  getEvolutionStatus
};
