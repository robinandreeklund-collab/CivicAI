/**
 * PES Basic Usage Examples
 * 
 * Demonstrates how to use the Prompt Evolution System
 */

import { 
  createAndTestPromptVersion,
  runSimulationForPrompt,
  compareAndRecommend,
  getRecommendedPrompt,
  generatePerformanceReport
} from '../core/orchestrator.js';

// Example 1: Create and test a new prompt version
async function example1_createAndTest() {
  console.log('\n=== Example 1: Create and Test New Prompt ===\n');
  
  try {
    const result = await createAndTestPromptVersion({
      promptText: `Du är ONESEEK-7B-Zero, en objektiv AI-assistent specialiserad på att analysera och jämföra olika perspektiv.

Din uppgift är att:
1. Noggrant analysera alla AI-svar på frågan
2. Identifiera konsensus och skillnader
3. Upptäcka eventuella bias eller hallucinationer
4. Ge en balanserad slutsats baserad på fakta

Var koncis, objektiv och transparent i din analys.`,
      version: 'v1.2.0-example',
      topic: 'general',
      metadata: {
        author: 'PES Demo',
        description: 'Example prompt for testing PES',
        created_for: 'documentation'
      }
    }, true); // Run simulation immediately
    
    console.log('✅ Prompt created successfully!');
    console.log('Prompt ID:', result.promptVersion.id);
    console.log('Version:', result.promptVersion.version);
    
    if (result.simulation) {
      console.log('\nSimulation Results:');
      console.log('- Debates used:', result.simulation.debatesUsed);
      console.log('- Average Score:', result.simulation.performanceMetrics.averageScore.toFixed(3));
      console.log('- Success Rate:', (result.simulation.performanceMetrics.successRate * 100).toFixed(1) + '%');
      console.log('- Recommendations:', result.simulation.recommendations.length);
    }
    
    return result.promptVersion.id;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Example 2: Run additional simulation for an existing prompt
async function example2_runSimulation(promptId) {
  console.log('\n=== Example 2: Run Additional Simulation ===\n');
  
  if (!promptId) {
    console.log('⚠️ No prompt ID provided, skipping...');
    return;
  }
  
  try {
    const result = await runSimulationForPrompt(promptId, {
      debateCount: 15,
      metadata: {
        simulation_type: 'follow_up',
        purpose: 'validation'
      }
    });
    
    console.log('✅ Simulation completed!');
    console.log('\nPerformance Metrics:');
    console.log('- Average Score:', result.simulation.performanceMetrics.averageScore.toFixed(3));
    console.log('- Success Rate:', (result.simulation.performanceMetrics.successRate * 100).toFixed(1) + '%');
    console.log('- Avg Inference Time:', (result.simulation.performanceMetrics.averageInferenceTime / 1000).toFixed(1) + 's');
    
    if (result.analysis && result.analysis.insights) {
      console.log('\nInsights:');
      result.analysis.insights.forEach(insight => {
        console.log(`  [${insight.level.toUpperCase()}] ${insight.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 3: Compare two prompt versions
async function example3_compareVersions(promptId1, promptId2) {
  console.log('\n=== Example 3: Compare Prompt Versions ===\n');
  
  if (!promptId1 || !promptId2) {
    console.log('⚠️ Need two prompt IDs to compare, skipping...');
    return;
  }
  
  try {
    const comparison = await compareAndRecommend(promptId1, promptId2);
    
    console.log('✅ Comparison completed!');
    console.log('\nVersion 1:');
    console.log('- Average Score:', comparison.comparison.version1.metrics.averageScore.toFixed(3));
    console.log('- Simulations:', comparison.comparison.version1.simulationCount);
    
    console.log('\nVersion 2:');
    console.log('- Average Score:', comparison.comparison.version2.metrics.averageScore.toFixed(3));
    console.log('- Simulations:', comparison.comparison.version2.simulationCount);
    
    console.log('\nWinner:', comparison.winner);
    console.log('Recommendation:', comparison.recommendation);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 4: Get recommended prompt for a topic
async function example4_getRecommended() {
  console.log('\n=== Example 4: Get Recommended Prompt ===\n');
  
  try {
    const result = await getRecommendedPrompt('general');
    
    if (result.hasRecommendation) {
      console.log('✅ Recommendation found!');
      console.log('\nRecommended Version:', result.recommended.version);
      console.log('Average Score:', result.metrics.averageScore.toFixed(3));
      console.log('Success Rate:', (result.metrics.successRate * 100).toFixed(1) + '%');
      
      if (result.alternatives && result.alternatives.length > 0) {
        console.log('\nAlternatives:');
        result.alternatives.forEach((alt, idx) => {
          console.log(`  ${idx + 1}. ${alt.version} (score: ${alt.averageScore.toFixed(3)})`);
        });
      }
    } else {
      console.log('⚠️ No recommendation available');
      console.log('Reason:', result.error);
      console.log('Fallback:', result.fallback);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 5: Generate performance report
async function example5_performanceReport() {
  console.log('\n=== Example 5: Performance Report ===\n');
  
  try {
    const report = await generatePerformanceReport();
    
    console.log('✅ Report generated!');
    console.log('\nOverview:');
    console.log('- Total Versions:', report.totalVersions);
    console.log('- Versions with Data:', report.versionsWithData);
    
    if (report.topPerformers && report.topPerformers.length > 0) {
      console.log('\nTop Performers:');
      report.topPerformers.forEach((performer, idx) => {
        console.log(`  ${idx + 1}. ${performer.version}`);
        console.log(`     Score: ${performer.averageScore.toFixed(3)}`);
        console.log(`     Simulations: ${performer.simulationCount}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   PES (Prompt Evolution System) Examples     ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  try {
    // Run examples sequentially
    const promptId = await example1_createAndTest();
    await example2_runSimulation(promptId);
    // Note: For example3, you'd need two existing prompt IDs
    // await example3_compareVersions('id1', 'id2');
    await example4_getRecommended();
    await example5_performanceReport();
    
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   All examples completed!                     ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  example1_createAndTest,
  example2_runSimulation,
  example3_compareVersions,
  example4_getRecommended,
  example5_performanceReport
};
