/**
 * PES (Prompt Evolution System) - Main Entry Point
 * 
 * Exports all major PES functionality for easy importing
 */

// Core functionality
export {
  runSimulation
} from './core/simulator.js';

export {
  analyzePromptPerformance,
  comparePromptVersions,
  findBestPromptVersion
} from './core/analyzer.js';

export {
  createAndTestPromptVersion,
  runSimulationForPrompt,
  compareAndRecommend,
  getRecommendedPrompt,
  runBatchSimulations,
  generatePerformanceReport
} from './core/orchestrator.js';

// Firebase services
export {
  getDebates,
  getDebateById,
  savePromptVersion,
  getPromptVersions,
  updatePromptPerformance,
  saveSimulation,
  getSimulationsByPromptVersion,
  getAllSimulations
} from './services/pesFirebaseService.js';

// Configuration
export { PES_CONFIG } from './config/pesConfig.js';

// Default export for convenience
export default {
  // Orchestrator (main interface)
  createAndTestPromptVersion,
  runSimulationForPrompt,
  compareAndRecommend,
  getRecommendedPrompt,
  generatePerformanceReport,
  
  // Analyzer
  analyzePromptPerformance,
  comparePromptVersions,
  findBestPromptVersion,
  
  // Simulator
  runSimulation,
  
  // Data access
  getDebates,
  getPromptVersions,
  getAllSimulations,
  
  // Config
  config: PES_CONFIG
};
