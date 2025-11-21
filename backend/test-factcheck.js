/**
 * Test Script for Fact-Checking Module
 * Tests claim extraction, classification, and the complete fact-checking workflow
 */

import { performFactCheck, batchFactCheck, compareFactChecks } from './services/factChecker.js';

// Test responses with different types of claims
const testResponses = [
  {
    text: `Sverige har en befolkning på cirka 10 miljoner människor. 
    Forskning visar att vaccin är effektiva mot COVID-19. 
    I Sverige är 85% av befolkningen vaccinerade. 
    Detta beslutades 2021 av regeringen och är faktiskt bevisat av flera studier.`,
    agent: 'test-agent-1'
  },
  {
    text: `Klimatförändringarna är en av vår tids största utmaningar. 
    Enligt forskning har temperaturen ökat med 1.2 grader sedan 1880. 
    Detta kommer att påverka framtida generationer betydligt.`,
    agent: 'test-agent-2'
  },
  {
    text: `Stockholm grundades 1252 och har en lång historia. 
    Idag bor ungefär 50% av Sveriges befolkning i storstadsområden. 
    Historiskt sett var Sverige ett agrart samhälle fram till 1900-talet.`,
    agent: 'test-agent-3'
  },
  {
    text: `Detta är ett svar utan några specifika verifierbara påståenden. 
    Det handlar om allmänna reflektioner och filosofiska tankar kring samhället. 
    Vi kan alltid lära oss mer genom att lyssna på varandra.`,
    agent: 'test-agent-4'
  }
];

console.log('🧪 Testing Fact-Checking Module\n');
console.log('='.repeat(80));

// Test 1: Single fact-check
console.log('\n📝 Test 1: Single Fact-Check');
console.log('-'.repeat(80));

try {
  const result = await performFactCheck(testResponses[0].text, testResponses[0].agent);
  
  console.log('\n✅ Result:');
  console.log(`  Available: ${result.available}`);
  console.log(`  Agent: ${result.agent || 'N/A'}`);
  console.log(`  Claims extracted: ${result.totalClaims || result.claims?.length || 0}`);
  console.log(`  Verified claims: ${result.verifiedCount || 0}`);
  console.log(`  Overall score: ${result.overallScore || 'N/A'}/10`);
  
  if (result.claims && result.claims.length > 0) {
    console.log('\n  📋 Claims:');
    result.claims.forEach((claim, idx) => {
      console.log(`    ${idx + 1}. [${claim.claimType || 'unknown'}] ${claim.claim.substring(0, 60)}...`);
      console.log(`       Verified: ${claim.verified ? '✓' : '✗'}, Confidence: ${claim.confidence}/10, Sources: ${claim.sourceCount}`);
    });
  }
  
  if (result.summary) {
    console.log(`\n  Summary: ${result.summary}`);
  }
  
  if (!result.available) {
    console.log(`  ⚠️  Message: ${result.message}`);
  }
} catch (error) {
  console.error('❌ Error in Test 1:', error.message);
}

// Test 2: Batch fact-check
console.log('\n\n📝 Test 2: Batch Fact-Check');
console.log('-'.repeat(80));

try {
  const responses = testResponses.map(t => ({ response: t.text, agent: t.agent }));
  const batchResults = await batchFactCheck(responses);
  
  console.log('\n✅ Batch Results:');
  batchResults.forEach((result, idx) => {
    console.log(`\n  ${idx + 1}. ${result.agent}:`);
    console.log(`     Claims: ${result.totalClaims || 0}, Verified: ${result.verifiedCount || 0}, Score: ${result.overallScore || 'N/A'}/10`);
  });
  
  // Test 3: Compare fact-checks
  console.log('\n\n📝 Test 3: Compare Fact-Checks');
  console.log('-'.repeat(80));
  
  const comparison = compareFactChecks(batchResults);
  
  console.log('\n✅ Comparison:');
  console.log(`  Available: ${comparison.available}`);
  if (comparison.available && comparison.bestAgent) {
    console.log(`  Best agent: ${comparison.bestAgent} (${comparison.bestScore}/10)`);
    console.log(`  Worst agent: ${comparison.worstAgent} (${comparison.worstScore}/10)`);
    console.log(`  Average score: ${comparison.averageScore}/10`);
    console.log(`  Total claims: ${comparison.totalClaims}`);
    console.log(`  Total verified: ${comparison.totalVerified}`);
    console.log(`  Summary: ${comparison.summary}`);
  } else {
    console.log(`  Message: ${comparison.message}`);
  }
} catch (error) {
  console.error('❌ Error in Tests 2-3:', error.message);
}

// Test 4: Edge cases
console.log('\n\n📝 Test 4: Edge Cases');
console.log('-'.repeat(80));

const edgeCases = [
  { text: '', agent: 'empty-text' },
  { text: 'Just a simple sentence without any claims.', agent: 'no-claims' },
  { text: '50% 50% 50% 50% 50%', agent: 'duplicate-claims' },
];

for (const testCase of edgeCases) {
  try {
    const result = await performFactCheck(testCase.text, testCase.agent);
    console.log(`\n  ${testCase.agent}:`);
    console.log(`    Claims: ${result.totalClaims || 0}, Score: ${result.overallScore || 'N/A'}/10`);
  } catch (error) {
    console.error(`  ❌ ${testCase.agent}: ${error.message}`);
  }
}

console.log('\n\n' + '='.repeat(80));
console.log('✅ Testing Complete!\n');
console.log('Note: If GOOGLE_FACTCHECK_API_KEY is not configured, fact-checking will not be available.');
console.log('      Claims will still be extracted, but no external verification will occur.');
console.log('='.repeat(80));
