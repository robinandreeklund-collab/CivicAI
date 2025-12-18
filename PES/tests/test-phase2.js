/**
 * PES Phase 2 Test Script
 * 
 * Quick test to verify Phase 2 components work
 * Run: node PES/tests/test-phase2.js
 */

import { getDebates } from '../services/pesFirebaseService.js';
import { checkOneseekAvailability } from '../services/oneseekService.js';
import { analyzeDebatePatterns } from '../core/debate-analyzer.js';
import { generatePromptVariants } from '../core/prompt-generator.js';

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║         PES Phase 2 Component Tests                  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

async function testSystemStatus() {
  console.log('📊 Test 1: System Status\n');
  
  try {
    // Check ONESEEK
    console.log('Checking ONESEEK availability...');
    const oneseekOk = await checkOneseekAvailability();
    
    if (oneseekOk) {
      console.log('✅ ONESEEK is available');
    } else {
      console.log('❌ ONESEEK is NOT available');
      console.log('   Make sure ml_service is running on port 5000');
      return false;
    }
    
    // Check debates
    console.log('\nChecking for debates in database...');
    const debates = await getDebates({ limit: 5, status: 'completed' });
    
    if (debates.length === 0) {
      console.log('⚠️  No debates found in database');
      console.log('   Run some live debates first to populate data');
      console.log('   Go to /7b-zero and enable "Debatt ON"\n');
      return false;
    }
    
    console.log(`✅ Found ${debates.length} debates in database`);
    console.log('\nSample debate:');
    console.log(`  ID: ${debates[0].id || debates[0].debate_id}`);
    console.log(`  Question: ${(debates[0].question || '').substring(0, 60)}...`);
    console.log(`  Status: ${debates[0].status}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking system status:', error.message);
    return false;
  }
}

async function testDebateAnalysis() {
  console.log('\n\n📈 Test 2: Debate Analysis (ONESEEK)\n');
  
  try {
    console.log('Fetching debates for analysis...');
    const debates = await getDebates({ limit: 2, status: 'completed' });
    
    if (debates.length === 0) {
      console.log('⚠️  Skipping - no debates available');
      return false;
    }
    
    console.log(`Analyzing ${debates.length} debates with ONESEEK...\n`);
    console.log('⏳ This may take 30-60 seconds...');
    
    const startTime = Date.now();
    const insights = await analyzeDebatePatterns(debates);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ Analysis complete in ${duration}s`);
    console.log('\nResults:');
    console.log(`  Debates analyzed: ${insights.debates_analyzed}`);
    console.log(`  Average votes: ${insights.overall_metrics.avg_votes_per_debate.toFixed(1)}`);
    console.log(`  Win rate: ${(insights.overall_metrics.win_rate * 100).toFixed(1)}%`);
    console.log(`  Average mentions: ${insights.overall_metrics.avg_mentions.toFixed(1)}`);
    
    if (insights.successful_patterns && insights.successful_patterns.length > 0) {
      console.log('\nSuccessful patterns identified:');
      insights.successful_patterns.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`);
      });
    }
    
    if (insights.weaknesses && insights.weaknesses.length > 0) {
      console.log('\nWeaknesses identified:');
      insights.weaknesses.slice(0, 3).forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }
    
    return insights;
    
  } catch (error) {
    console.error('❌ Error in debate analysis:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

async function testPromptGeneration(insights) {
  console.log('\n\n🔄 Test 3: Prompt Variant Generation (ONESEEK)\n');
  
  if (!insights) {
    console.log('⚠️  Skipping - no insights from previous test');
    return false;
  }
  
  try {
    const baselinePrompt = `Du är ONESEEK-7B-Zero, en AI som syntetiserar olika perspektiv.

Analysera frågan objektivt och jämför olika AI-svar.
Var koncis, balanserad och transparent.`;

    console.log('Generating prompt variants with ONESEEK...\n');
    console.log('⏳ This may take 30-60 seconds...');
    
    const startTime = Date.now();
    const variants = await generatePromptVariants(baselinePrompt, insights, 2);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ Generated ${variants.length} variants in ${duration}s\n`);
    
    variants.forEach((variant, i) => {
      console.log(`Variant ${i + 1}: ${variant.version}`);
      console.log(`  Hypothesis: ${variant.hypothesis}`);
      console.log(`  Expected: ${variant.expected_improvement}`);
      console.log(`  Focus: ${variant.strategic_focus.join(', ')}`);
      console.log('');
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error generating variants:', error.message);
    return false;
  }
}

async function runAllTests() {
  try {
    // Test 1: System status
    const systemOk = await testSystemStatus();
    
    if (!systemOk) {
      console.log('\n⚠️  System not ready for full tests');
      console.log('   Fix issues above and try again\n');
      return;
    }
    
    // Test 2: Debate analysis
    const insights = await testDebateAnalysis();
    
    // Test 3: Prompt generation
    await testPromptGeneration(insights);
    
    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              Tests Complete! ✅                        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    console.log('Next steps:');
    console.log('1. Run full evolution loop via API:');
    console.log('   curl -X POST http://localhost:3001/api/pes/evolution/start \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"baseline_prompt":"...","debate_count":5,"variant_count":3}\'');
    console.log('');
    console.log('2. Or use the frontend:');
    console.log('   http://localhost:5173/pes/evolution');
    console.log('');
    console.log('3. See full testing guide:');
    console.log('   cat PES/PHASE2_TESTING_GUIDE.md\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
