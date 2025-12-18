/**
 * PES Phase 2: Historical Simulator
 * 
 * Replays historical debates with new ONESEEK prompt variants
 * while keeping external AI responses fixed
 */

/**
 * Simulate a debate with a prompt variant
 * @param {Object} historicalDebate - Original debate data
 * @param {Object} promptVariant - Prompt variant to test
 * @returns {Promise<Object>} Simulation result
 */
export async function simulateDebateWithVariant(historicalDebate, promptVariant) {
  console.log(`[Historical Simulator] Simulating debate ${historicalDebate.id} with variant ${promptVariant.version}`);
  
  if (!historicalDebate || !promptVariant) {
    throw new Error('Historical debate and prompt variant are required');
  }
  
  const simulation = {
    debate_id: historicalDebate.id || historicalDebate.debate_id,
    question: historicalDebate.question,
    variant_version: promptVariant.version,
    rounds: [],
    metadata: {
      original_winner: historicalDebate.winner?.model || historicalDebate.winner,
      simulation_timestamp: new Date().toISOString()
    }
  };
  
  let contextChain = [];
  const maxRounds = historicalDebate.rounds?.length || 3;
  
  try {
    // Simulate each round
    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
      console.log(`[Historical Simulator] Simulating round ${roundNum}/${maxRounds}`);
      
      const historicalRound = historicalDebate.rounds?.[roundNum - 1];
      
      if (!historicalRound) {
        console.warn(`[Historical Simulator] No historical data for round ${roundNum}, skipping`);
        continue;
      }
      
      // Extract external AI responses (keep them fixed)
      const externalResponses = extractExternalResponses(historicalRound);
      
      // Build context for ONESEEK generation
      const roundContext = {
        question: historicalDebate.question,
        round_number: roundNum,
        max_rounds: maxRounds,
        external_responses: externalResponses,
        previous_rounds: contextChain,
        participants: historicalDebate.participants || extractParticipants(historicalRound)
      };
      
      // Generate new ONESEEK response with variant prompt
      const oneseekResponse = await generateOneseekResponse(
        promptVariant.prompt_text,
        roundContext
      );
      
      // Store round results
      simulation.rounds.push({
        round_number: roundNum,
        external_responses: externalResponses,
        oneseek_response: oneseekResponse,
        timestamp: new Date().toISOString()
      });
      
      // Update context chain for next round
      contextChain.push({
        round: roundNum,
        all_responses: [...externalResponses, oneseekResponse]
      });
    }
    
    simulation.success = true;
    console.log(`[Historical Simulator] Simulation complete for debate ${historicalDebate.id}`);
    
  } catch (error) {
    console.error(`[Historical Simulator] Error simulating debate ${historicalDebate.id}:`, error.message);
    simulation.success = false;
    simulation.error = error.message;
  }
  
  return simulation;
}

/**
 * Simulate multiple debates with a variant
 * @param {Array} debates - Array of historical debates
 * @param {Object} promptVariant - Prompt variant to test
 * @returns {Promise<Array>} Array of simulation results
 */
export async function simulateMultipleDebates(debates, promptVariant) {
  console.log(`[Historical Simulator] Simulating ${debates.length} debates with variant ${promptVariant.version}`);
  
  const results = [];
  
  for (const debate of debates) {
    try {
      const result = await simulateDebateWithVariant(debate, promptVariant);
      results.push(result);
    } catch (error) {
      console.error(`[Historical Simulator] Failed to simulate debate ${debate.id}:`, error.message);
      results.push({
        debate_id: debate.id,
        variant_version: promptVariant.version,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log(`[Historical Simulator] Completed ${results.filter(r => r.success).length}/${debates.length} simulations`);
  
  return results;
}

/**
 * Extract external (non-ONESEEK) responses from a round
 * @param {Object} round - Round data
 * @returns {Array} External responses
 */
function extractExternalResponses(round) {
  if (!round.responses || !Array.isArray(round.responses)) {
    return [];
  }
  
  return round.responses
    .filter(r => {
      const model = r.model || r.ai || '';
      return model !== 'ONESEEK' && 
             !model.toLowerCase().includes('oneseek');
    })
    .map(r => ({
      model: r.model || r.ai,
      text: r.text || r.response || '',
      timestamp: r.timestamp
    }));
}

/**
 * Extract participant names from round
 * @param {Object} round - Round data
 * @returns {Array} Participant names
 */
function extractParticipants(round) {
  if (!round.responses || !Array.isArray(round.responses)) {
    return ['GPT-4', 'Gemini', 'DeepSeek', 'Grok']; // Default participants
  }
  
  return round.responses
    .map(r => r.model || r.ai)
    .filter(Boolean);
}

/**
 * Generate ONESEEK response with variant prompt
 * @param {string} promptText - Prompt variant text
 * @param {Object} context - Round context
 * @returns {Promise<Object>} Generated response
 */
async function generateOneseekResponse(promptText, context) {
  try {
    // Build the complete prompt with context injection
    const fullPrompt = injectContext(promptText, context);
    
    // Call ONESEEK inference endpoint
    const response = await callOneseekInference(fullPrompt, context);
    
    return {
      model: 'ONESEEK',
      text: response.text || response.response || '',
      timestamp: new Date().toISOString(),
      metadata: {
        prompt_version: 'variant',
        inference_time_ms: response.inference_time_ms,
        round: context.round_number
      }
    };
  } catch (error) {
    console.error('[Historical Simulator] Error generating ONESEEK response:', error.message);
    
    // Return fallback response
    return {
      model: 'ONESEEK',
      text: generateFallbackResponse(context),
      timestamp: new Date().toISOString(),
      metadata: {
        prompt_version: 'variant',
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Inject context into prompt template
 * @param {string} promptText - Template prompt
 * @param {Object} context - Context data
 * @returns {string} Prompt with injected context
 */
function injectContext(promptText, context) {
  let prompt = promptText;
  
  // Replace context placeholders
  const replacements = {
    '{question}': context.question || '',
    '{round_number}': String(context.round_number || 1),
    '{max_rounds}': String(context.max_rounds || 3),
    '{participants}': (context.participants || []).join(', '),
    '{external_responses}': formatExternalResponses(context.external_responses || []),
    '{previous_rounds}': formatPreviousRounds(context.previous_rounds || [])
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return prompt;
}

/**
 * Format external responses for context
 * @param {Array} responses - External responses
 * @returns {string} Formatted text
 */
function formatExternalResponses(responses) {
  if (!responses || responses.length === 0) {
    return 'No external responses yet.';
  }
  
  return responses
    .map(r => `${r.model}: ${r.text.substring(0, 500)}...`)
    .join('\n\n');
}

/**
 * Format previous rounds for context
 * @param {Array} rounds - Previous rounds
 * @returns {string} Formatted text
 */
function formatPreviousRounds(rounds) {
  if (!rounds || rounds.length === 0) {
    return 'This is the first round.';
  }
  
  return rounds
    .map(r => `Round ${r.round}: ${r.all_responses?.length || 0} responses`)
    .join(', ');
}

/**
 * Call ONESEEK inference endpoint
 * @param {string} prompt - Complete prompt
 * @param {Object} context - Context for inference
 * @returns {Promise<Object>} Inference result
 */
async function callOneseekInference(prompt, context) {
  const startTime = Date.now();
  
  try {
    // Use PES-specific ONESEEK service
    const { generateWithOneseek } = await import('../services/oneseekService.js');
    
    const result = await generateWithOneseek(prompt, {
      max_tokens: 512,
      temperature: 0.7,
      context: {
        question: context.question,
        round: context.round_number,
        external_responses: context.external_responses
      }
    });
    
    const inferenceTime = Date.now() - startTime;
    
    return {
      text: result.response || '',
      inference_time_ms: inferenceTime,
      model: 'ONESEEK'
    };
  } catch (error) {
    console.error('[Historical Simulator] ONESEEK inference failed:', error.message);
    throw error;
  }
}

/**
 * Generate fallback response when inference fails
 * @param {Object} context - Round context
 * @returns {string} Fallback response
 */
function generateFallbackResponse(context) {
  return `[ONESEEK Synthesis - Round ${context.round_number}/${context.max_rounds}]

Question: ${context.question}

Based on the ${context.external_responses?.length || 0} responses from other AIs, I observe multiple perspectives on this topic. 

A comprehensive synthesis would integrate these viewpoints while maintaining objectivity and balance. Due to a technical limitation in this simulation, a detailed synthesis cannot be generated at this time.

Key considerations for this question include evaluating evidence, acknowledging different perspectives, and providing actionable insights.`;
}

export default {
  simulateDebateWithVariant,
  simulateMultipleDebates
};
