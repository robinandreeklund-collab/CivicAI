/**
 * PES Integration Test
 * 
 * Tests the integration between live debates and PES
 * Run this after some debates have been logged to Firebase
 */

import { getDebates } from '../services/pesFirebaseService.js';
import { createAndTestPromptVersion } from '../core/orchestrator.js';

async function testDebateLogging() {
  console.log('\n=== Test 1: Verify Debates are Logged ===\n');
  
  try {
    const debates = await getDebates({ limit: 5 });
    
    if (debates.length === 0) {
      console.log('⚠️  No debates found in Firebase');
      console.log('   Run some live debates first to populate data');
      return false;
    }
    
    console.log(`✅ Found ${debates.length} debates in Firebase`);
    console.log('\nSample debate:');
    console.log('- ID:', debates[0].debate_id);
    console.log('- Question:', debates[0].question.substring(0, 80) + '...');
    console.log('- Participants:', debates[0].participants.join(', '));
    console.log('- Rounds:', debates[0].current_round);
    console.log('- Status:', debates[0].status);
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching debates:', error.message);
    return false;
  }
}

async function testPromptCreation() {
  console.log('\n=== Test 2: Create Prompt Version ===\n');
  
  try {
    const testPrompt = {
      promptText: `Du är ONESEEK-7B-Zero TEST, en AI-assistent för testning.

Detta är en test-prompt för PES Phase 1 integration testing.`,
      version: 'test-v1.0.0',
      topic: 'general',
      metadata: {
        author: 'Integration Test',
        description: 'Test prompt for PES Phase 1',
        test: true
      }
    };
    
    const result = await createAndTestPromptVersion(testPrompt, false); // Don't run simulation yet
    
    console.log('✅ Prompt version created successfully');
    console.log('- ID:', result.promptVersion.id);
    console.log('- Version:', result.promptVersion.version);
    console.log('- Topic:', result.promptVersion.topic);
    
    return result.promptVersion.id;
  } catch (error) {
    console.error('❌ Error creating prompt:', error.message);
    return null;
  }
}

async function testSimulation(promptId) {
  console.log('\n=== Test 3: Run Simulation ===\n');
  
  if (!promptId) {
    console.log('⚠️  No prompt ID, skipping simulation test');
    return;
  }
  
  try {
    // Check if we have debates first
    const debates = await getDebates({ limit: 1 });
    
    if (debates.length === 0) {
      console.log('⚠️  No debates available for simulation');
      console.log('   Simulation test skipped - run live debates first');
      return;
    }
    
    console.log('✅ Debates available, simulation test ready');
    console.log('   To run simulation manually:');
    console.log(`   import { runSimulationForPrompt } from './PES/core/orchestrator.js';`);
    console.log(`   await runSimulationForPrompt('${promptId}');`);
    
  } catch (error) {
    console.error('❌ Error in simulation test:', error.message);
  }
}

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   PES Integration Tests                       ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  try {
    // Test 1: Verify debates are being logged
    const debatesOk = await testDebateLogging();
    
    // Test 2: Create a prompt version
    const promptId = await testPromptCreation();
    
    // Test 3: Verify simulation readiness
    await testSimulation(promptId);
    
    console.log('\n╔═══════════════════════════════════════════════╗');
    if (debatesOk && promptId) {
      console.log('║   ✅ Integration tests completed successfully ║');
    } else {
      console.log('║   ⚠️  Some tests skipped - see output above  ║');
    }
    console.log('╚═══════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error in tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testDebateLogging, testPromptCreation, testSimulation };
