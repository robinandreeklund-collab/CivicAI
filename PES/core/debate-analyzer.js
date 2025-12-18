/**
 * PES Phase 2: Debate Analyzer
 * 
 * Analyzes historical debates to identify success patterns
 * Based on actual voting data, motivations, and mentions from database
 */

import { generateWithOneseek } from '../services/oneseekService.js';

/**
 * Analyze debate patterns from historical debates
 * @param {Array} debates - Array of historical debate objects
 * @returns {Promise<Object>} Aggregated insights
 */
export async function analyzeDebatePatterns(debates) {
  console.log(`[Debate Analyzer] Analyzing ${debates.length} debates...`);
  
  if (!debates || debates.length === 0) {
    throw new Error('No debates provided for analysis');
  }
  
  const patterns = [];
  
  // Analyze each debate individually
  for (const debate of debates) {
    try {
      const pattern = await analyzeSingleDebate(debate);
      patterns.push(pattern);
    } catch (error) {
      console.error(`[Debate Analyzer] Error analyzing debate ${debate.id}:`, error.message);
      // Continue with other debates even if one fails
    }
  }
  
  if (patterns.length === 0) {
    throw new Error('Failed to analyze any debates');
  }
  
  // Aggregate insights across all debates
  const aggregatedInsights = await aggregateInsights(patterns);
  
  console.log(`[Debate Analyzer] Analysis complete. ${patterns.length}/${debates.length} debates analyzed.`);
  
  return aggregatedInsights;
}

/**
 * Analyze a single debate for ONESEEK performance
 * @param {Object} debate - Single debate object
 * @returns {Promise<Object>} Analysis pattern
 */
async function analyzeSingleDebate(debate) {
  // Extract ONESEEK-related data
  const oneseekResponses = extractOneseekResponses(debate);
  const votesReceived = extractVotesForOneseek(debate);
  const mentions = countOneseekMentions(debate);
  const questionType = classifyQuestion(debate.question);
  
  // Build analysis prompt for LLM
  const analysisPrompt = `You are analyzing an AI debate to understand what made ONESEEK (a debate synthesis AI) effective or ineffective.

DEBATE QUESTION: "${debate.question}"
QUESTION TYPE: ${questionType}

ONESEEK RESPONSES:
${oneseekResponses.map((r, i) => `Round ${i + 1}: ${r.text.substring(0, 500)}...`).join('\n\n')}

VOTES RECEIVED: ${votesReceived.length}
${votesReceived.length > 0 ? `Vote Details:\n${votesReceived.map(v => `- ${v.voter} voted for ONESEEK (${v.category}): "${v.motivation}"`).join('\n')}` : 'No votes received'}

MENTIONS BY OTHER AIs: ${mentions}

DEBATE OUTCOME: ${debate.winner?.model || 'Unknown'} won

Analyze ONESEEK's performance and identify:
1. What specific approaches or phrases made ONESEEK's responses effective or ineffective?
2. Which synthesis strategies resonated with voters?
3. What patterns appear across the rounds (progression, consistency)?
4. How did ONESEEK's approach compare to other AIs?
5. What could be improved?

Provide structured analysis in JSON format:
{
  "effectiveness_score": <0-10>,
  "successful_elements": ["element 1", "element 2", ...],
  "unsuccessful_elements": ["element 1", "element 2", ...],
  "synthesis_approach": "description",
  "voter_preferences": "what voters valued",
  "improvement_suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

  try {
    // Use ONESEEK to analyze based on historical voting patterns
    const analysisResponse = await generateWithOneseek(analysisPrompt, {
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // Parse JSON from ONESEEK response
    let analysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = analysisResponse.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('[Debate Analyzer] Could not parse JSON, using heuristic analysis');
      analysis = buildHeuristicAnalysis(debate, votesReceived, mentions);
    }
    
    return {
      debate_id: debate.id,
      question: debate.question,
      question_type: questionType,
      oneseek_responses_count: oneseekResponses.length,
      votes_received: votesReceived.length,
      mentions_count: mentions,
      won: debate.winner?.model === 'ONESEEK',
      analysis: analysis,
      raw_data: {
        votes: votesReceived,
        responses: oneseekResponses
      }
    };
  } catch (error) {
    console.error(`[Debate Analyzer] LLM analysis failed for debate ${debate.id}:`, error.message);
    // Return basic pattern without LLM analysis
    return {
      debate_id: debate.id,
      question: debate.question,
      question_type: questionType,
      oneseek_responses_count: oneseekResponses.length,
      votes_received: votesReceived.length,
      mentions_count: mentions,
      won: debate.winner?.model === 'ONESEEK',
      analysis: {
        effectiveness_score: votesReceived.length * 2, // Basic score
        successful_elements: [],
        unsuccessful_elements: [],
        synthesis_approach: 'Unknown',
        voter_preferences: 'Unknown',
        improvement_suggestions: []
      },
      raw_data: {
        votes: votesReceived,
        responses: oneseekResponses
      }
    };
  }
}

/**
 * Aggregate insights across all analyzed debates
 * @param {Array} patterns - Array of debate analysis patterns
 * @returns {Promise<Object>} Aggregated insights
 */
async function aggregateInsights(patterns) {
  const totalDebates = patterns.length;
  const totalVotes = patterns.reduce((sum, p) => sum + p.votes_received, 0);
  const totalWins = patterns.filter(p => p.won).length;
  const totalMentions = patterns.reduce((sum, p) => sum + p.mentions_count, 0);
  
  // Collect all successful and unsuccessful elements
  const allSuccessful = patterns.flatMap(p => p.analysis?.successful_elements || []);
  const allUnsuccessful = patterns.flatMap(p => p.analysis?.unsuccessful_elements || []);
  const allSuggestions = patterns.flatMap(p => p.analysis?.improvement_suggestions || []);
  
  // Count frequency of elements
  const successfulFreq = countFrequency(allSuccessful);
  const unsuccessfulFreq = countFrequency(allUnsuccessful);
  const suggestionsFreq = countFrequency(allSuggestions);
  
  // Build meta-analysis prompt
  const metaPrompt = `You are analyzing aggregated data from ${totalDebates} AI debates where ONESEEK participated.

OVERALL METRICS:
- Total debates: ${totalDebates}
- Total votes received: ${totalVotes} (avg: ${(totalVotes / totalDebates).toFixed(1)} per debate)
- Wins: ${totalWins} (${((totalWins / totalDebates) * 100).toFixed(1)}%)
- Average mentions: ${(totalMentions / totalDebates).toFixed(1)} per debate

TOP SUCCESSFUL ELEMENTS (by frequency):
${Object.entries(successfulFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([el, count]) => `- ${el} (${count} times)`).join('\n')}

TOP UNSUCCESSFUL ELEMENTS (by frequency):
${Object.entries(unsuccessfulFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([el, count]) => `- ${el} (${count} times)`).join('\n')}

TOP IMPROVEMENT SUGGESTIONS (by frequency):
${Object.entries(suggestionsFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([el, count]) => `- ${el} (${count} times)`).join('\n')}

QUESTION TYPES ANALYZED:
${countFrequency(patterns.map(p => p.question_type))}

Based on this data, provide strategic insights for improving ONESEEK's debate prompt:

Return JSON:
{
  "successful_patterns": ["pattern 1", "pattern 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "winning_styles": ["style 1", "style 2", ...],
  "strategic_recommendations": ["rec 1", "rec 2", ...],
  "question_type_insights": {"type": "insight", ...}
}`;

  try {
    // Use ONESEEK for meta-analysis based on aggregated patterns
    const metaAnalysis = await generateWithOneseek(metaPrompt, {
      temperature: 0.4,
      max_tokens: 1500
    });
    
    // Parse JSON from ONESEEK response
    let insights;
    try {
      const jsonMatch = metaAnalysis.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('[Debate Analyzer] Could not parse meta-analysis JSON, using heuristic aggregation');
      insights = buildHeuristicInsights(patterns);
    }
    
    return {
      debates_analyzed: totalDebates,
      overall_metrics: {
        total_votes: totalVotes,
        avg_votes_per_debate: totalVotes / totalDebates,
        win_rate: totalWins / totalDebates,
        avg_mentions: totalMentions / totalDebates
      },
      successful_patterns: insights.successful_patterns || [],
      weaknesses: insights.weaknesses || [],
      winning_styles: insights.winning_styles || [],
      strategic_recommendations: insights.strategic_recommendations || [],
      question_type_insights: insights.question_type_insights || {},
      raw_patterns: patterns
    };
  } catch (error) {
    console.error('[Debate Analyzer] Meta-analysis failed:', error.message);
    
    // Fallback: return basic aggregation
    return {
      debates_analyzed: totalDebates,
      overall_metrics: {
        total_votes: totalVotes,
        avg_votes_per_debate: totalVotes / totalDebates,
        win_rate: totalWins / totalDebates,
        avg_mentions: totalMentions / totalDebates
      },
      successful_patterns: Object.entries(successfulFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([el]) => el),
      weaknesses: Object.entries(unsuccessfulFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([el]) => el),
      winning_styles: [],
      strategic_recommendations: [],
      question_type_insights: {},
      raw_patterns: patterns
    };
  }
}

/**
 * Extract ONESEEK responses from debate
 * @param {Object} debate - Debate object
 * @returns {Array} ONESEEK responses
 */
function extractOneseekResponses(debate) {
  const responses = [];
  
  if (debate.rounds && Array.isArray(debate.rounds)) {
    debate.rounds.forEach((round, index) => {
      const oneseekResp = round.responses?.find(r => 
        r.model === 'ONESEEK' || r.model?.includes('oneseek') || r.model?.includes('ONESEEK')
      );
      
      if (oneseekResp) {
        responses.push({
          round: index + 1,
          text: oneseekResp.text || oneseekResp.response || '',
          timestamp: oneseekResp.timestamp
        });
      }
    });
  }
  
  return responses;
}

/**
 * Extract votes that were for ONESEEK
 * @param {Object} debate - Debate object
 * @returns {Array} Votes for ONESEEK
 */
function extractVotesForOneseek(debate) {
  if (!debate.votes || !Array.isArray(debate.votes)) {
    return [];
  }
  
  return debate.votes.filter(vote => 
    vote.voted_for === 'ONESEEK' || 
    vote.voted_for?.includes('oneseek') ||
    vote.voted_for?.includes('ONESEEK')
  );
}

/**
 * Count mentions of ONESEEK in other AI responses and votes
 * @param {Object} debate - Debate object
 * @returns {number} Mention count
 */
function countOneseekMentions(debate) {
  let mentions = 0;
  
  // Check in rounds
  if (debate.rounds && Array.isArray(debate.rounds)) {
    debate.rounds.forEach(round => {
      if (round.responses && Array.isArray(round.responses)) {
        round.responses.forEach(resp => {
          if (resp.model !== 'ONESEEK') {
            const text = (resp.text || resp.response || '').toLowerCase();
            if (text.includes('oneseek')) {
              mentions++;
            }
          }
        });
      }
    });
  }
  
  // Check in vote motivations
  if (debate.votes && Array.isArray(debate.votes)) {
    debate.votes.forEach(vote => {
      const motivation = (vote.motivation || '').toLowerCase();
      if (motivation.includes('oneseek') && vote.voted_for !== 'ONESEEK') {
        mentions++;
      }
    });
  }
  
  return mentions;
}

/**
 * Classify question type
 * @param {string} question - Question text
 * @returns {string} Question type
 */
function classifyQuestion(question) {
  const q = question.toLowerCase();
  
  if (q.includes('politik') || q.includes('demokrati') || q.includes('regering')) {
    return 'politics';
  } else if (q.includes('vetenskap') || q.includes('forskning') || q.includes('studie')) {
    return 'science';
  } else if (q.includes('ekonomi') || q.includes('finans') || q.includes('marknad')) {
    return 'economics';
  } else if (q.includes('teknologi') || q.includes('ai') || q.includes('digital')) {
    return 'technology';
  } else if (q.includes('samhäll') || q.includes('social') || q.includes('kultur')) {
    return 'society';
  } else if (q.includes('miljö') || q.includes('klimat') || q.includes('hållbar')) {
    return 'environment';
  }
  
  return 'general';
}

/**
 * Count frequency of elements in array
 * @param {Array} items - Array of items
 * @returns {Object} Frequency map
 */
function countFrequency(items) {
  const freq = {};
  items.forEach(item => {
    const key = String(item).trim();
    if (key) {
      freq[key] = (freq[key] || 0) + 1;
    }
  });
  return freq;
}

/**
 * Build heuristic analysis when ONESEEK response can't be parsed
 * @param {Object} debate - Debate object
 * @param {Array} votesReceived - Votes for ONESEEK
 * @param {number} mentions - Mention count
 * @returns {Object} Heuristic analysis
 */
function buildHeuristicAnalysis(debate, votesReceived, mentions) {
  const effectiveness = Math.min(10, (votesReceived.length * 2) + mentions);
  
  // Extract patterns from vote motivations
  const successful = [];
  const unsuccessful = [];
  
  votesReceived.forEach(vote => {
    if (vote.motivation) {
      const motivation = vote.motivation.toLowerCase();
      if (motivation.includes('clear') || motivation.includes('struktur')) {
        successful.push('Clear structure and organization');
      }
      if (motivation.includes('data') || motivation.includes('evidens')) {
        successful.push('Data-driven analysis');
      }
      if (motivation.includes('balans') || motivation.includes('objektiv')) {
        successful.push('Balanced and objective approach');
      }
      if (motivation.includes('syntes')) {
        successful.push('Good synthesis of perspectives');
      }
    }
  });
  
  // Identify weaknesses
  if (effectiveness < 5) {
    unsuccessful.push('Low vote count indicates room for improvement');
  }
  if (mentions === 0) {
    unsuccessful.push('Not mentioned by other AIs');
  }
  
  return {
    effectiveness_score: effectiveness,
    successful_elements: [...new Set(successful)],
    unsuccessful_elements: [...new Set(unsuccessful)],
    synthesis_approach: 'Based on historical voting patterns',
    voter_preferences: votesReceived.map(v => v.category).join(', '),
    improvement_suggestions: [
      'Analyze top-voted responses for patterns',
      'Emphasize elements that received votes',
      'Study motivations from voters'
    ]
  };
}

/**
 * Build heuristic insights from patterns
 * @param {Array} patterns - Pattern array
 * @returns {Object} Heuristic insights
 */
function buildHeuristicInsights(patterns) {
  // Aggregate successful elements
  const allSuccessful = patterns.flatMap(p => p.analysis?.successful_elements || []);
  const successfulFreq = countFrequency(allSuccessful);
  
  const allUnsuccessful = patterns.flatMap(p => p.analysis?.unsuccessful_elements || []);
  const unsuccessfulFreq = countFrequency(allUnsuccessful);
  
  return {
    successful_patterns: Object.entries(successfulFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([el]) => el),
    weaknesses: Object.entries(unsuccessfulFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([el]) => el),
    winning_styles: [
      'Evidence-based synthesis',
      'Clear structure',
      'Balanced perspective'
    ],
    strategic_recommendations: [
      'Maintain successful patterns',
      'Address identified weaknesses',
      'Study top-performing debates'
    ],
    question_type_insights: {}
  };
}

export default {
  analyzeDebatePatterns,
  extractOneseekResponses,
  extractVotesForOneseek,
  countOneseekMentions,
  classifyQuestion
};
