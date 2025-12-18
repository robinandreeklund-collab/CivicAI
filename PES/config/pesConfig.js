/**
 * PES (Prompt Evolution System) Configuration
 * 
 * Settings for simulation, analysis, and prompt evolution
 */

export const PES_CONFIG = {
  // Simulation settings
  simulation: {
    // Number of debates to use per simulation run
    debatesPerSimulation: 10,
    
    // Minimum number of rounds a debate must have to be used
    minDebateRounds: 1,
    
    // Only use completed debates
    requireCompletedStatus: true,
    
    // ONESEEK endpoint settings
    oneseekEndpoint: process.env.OPENSEEK_API_URL || 'http://localhost:5000',
    
    // Inference timeout (ms)
    inferenceTimeout: 120000, // 2 minutes
  },
  
  // Performance metrics
  metrics: {
    // Factors for calculating overall performance score
    weights: {
      consensusQuality: 0.3,
      responseQuality: 0.3,
      votingAccuracy: 0.2,
      roundEfficiency: 0.2,
    },
    
    // Thresholds for performance evaluation
    thresholds: {
      goodScore: 0.7,
      excellentScore: 0.85,
    },
  },
  
  // Prompt version management
  promptVersions: {
    // Topics for prompt specialization (Phase 2)
    topics: [
      'general',
      'politics',
      'science',
      'ethics',
      'economics',
    ],
    
    // Default topic
    defaultTopic: 'general',
    
    // Version status options
    status: {
      ACTIVE: 'active',
      TESTING: 'testing',
      ARCHIVED: 'archived',
      DEPRECATED: 'deprecated',
    },
  },
  
  // Analysis settings
  analysis: {
    // Minimum data points for reliable analysis
    minDataPoints: 5,
    
    // Comparison threshold for determining improvement
    improvementThreshold: 0.05, // 5% improvement
  },
};

export default PES_CONFIG;
