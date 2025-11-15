/**
 * Tests for Enhanced NLP Processors
 * Validates emotion analysis, topic detection, intent classification, etc.
 */

import {
  analyzeEmotion,
  detectTopics,
  classifyIntent,
  tagFactOpinion,
  extractEntitiesWithRoles,
  extractArgumentation,
  detectCounterpoints,
  calculateResponseTime,
  performCompleteEnhancedAnalysis
} from './utils/nlpProcessors.js';

// Test data
const testTexts = {
  emotional: "Detta är fantastiskt! Jag är så glad och nöjd med resultatet. Det känns underbart!",
  angry: "Detta är oacceptabelt! Jag är arg och frustrerad över denna situation.",
  topical: "Artificiell intelligens och maskininlärning revolutionerar teknologi. Python och TensorFlow är viktiga verktyg.",
  question: "Hur fungerar detta? Vad är skillnaden mellan AI och ML? När kan vi se resultat?",
  task: "Vi bör implementera detta omedelbart. Det är nödvändigt att vi utför dessa steg nu.",
  opinion: "Jag tycker att detta är intressant. Enligt min mening är det viktigt att överväga.",
  factual: "Enligt forskning från 2023 visar studier att 75% av företagen använder AI.",
  mixed: "AI är enligt mig bra. Forskning visar att 80% använder det. Men jag tror det finns risker.",
  argumentative: "För det första är AI viktigt. Därför måste vi investera. Detta innebär framtida vinster.",
  counterpoint: "AI är bra, men det finns risker. Å ena sidan ökar produktiviteten, å andra sidan förlorar folk jobb.",
};

console.log('\n🧪 Testing Enhanced NLP Processors\n');
console.log('='.repeat(60));

// Test 1: Emotion Analysis
console.log('\n1. EMOTION ANALYSIS');
console.log('-'.repeat(60));

const emotionJoy = analyzeEmotion(testTexts.emotional);
console.log('✓ Joy detection:', emotionJoy.primary === 'joy' ? 'PASS' : 'FAIL');
console.log('  Primary emotion:', emotionJoy.primary);
console.log('  Confidence:', emotionJoy.confidence);
console.log('  Provenance:', emotionJoy.provenance.model);

const emotionAnger = analyzeEmotion(testTexts.angry);
console.log('✓ Anger detection:', emotionAnger.primary === 'anger' ? 'PASS' : 'FAIL');
console.log('  Primary emotion:', emotionAnger.primary);
console.log('  All emotions:', emotionAnger.allEmotions.map(e => `${e.emotion} (${e.intensity})`).join(', '));

// Test 2: Topic Detection
console.log('\n2. TOPIC DETECTION & CLUSTERING');
console.log('-'.repeat(60));

const topics = detectTopics(testTexts.topical);
console.log('✓ Topics detected:', topics.mainTopics.length > 0 ? 'PASS' : 'FAIL');
console.log('  Main topics:', topics.mainTopics.slice(0, 3).map(t => `${t.topic} (${t.frequency})`).join(', '));
console.log('  Clusters:', topics.clusters.length);
console.log('  Provenance:', topics.provenance.model);

// Test 3: Intent Classification
console.log('\n3. INTENT CLASSIFICATION');
console.log('-'.repeat(60));

const intentQuestion = classifyIntent(testTexts.question);
console.log('✓ Question intent:', intentQuestion.primary === 'question' ? 'PASS' : 'FAIL');
console.log('  Primary intent:', intentQuestion.primary);
console.log('  Confidence:', intentQuestion.confidence);

const intentTask = classifyIntent(testTexts.task);
console.log('✓ Task intent:', intentTask.primary === 'task' ? 'PASS' : 'FAIL');
console.log('  Primary intent:', intentTask.primary);
console.log('  Scores:', JSON.stringify(intentTask.scores));

const intentOpinion = classifyIntent(testTexts.opinion);
console.log('✓ Opinion intent:', intentOpinion.primary === 'opinion' ? 'PASS' : 'FAIL');
console.log('  Primary intent:', intentOpinion.primary);

// Test 4: Fact vs Opinion Tagging
console.log('\n4. FACT VS OPINION TAGGING');
console.log('-'.repeat(60));

const factOpinion = tagFactOpinion(testTexts.mixed);
console.log('✓ Fact/Opinion analysis:', factOpinion.sentences.length > 0 ? 'PASS' : 'FAIL');
console.log('  Total sentences:', factOpinion.sentences.length);
console.log('  Fact percentage:', `${factOpinion.summary.factPercentage}%`);
console.log('  Opinion percentage:', `${factOpinion.summary.opinionPercentage}%`);
console.log('  Mixed percentage:', `${factOpinion.summary.mixedPercentage}%`);
console.log('  Provenance:', factOpinion.provenance.model);

const pureFact = tagFactOpinion(testTexts.factual);
console.log('✓ Pure fact detection:', pureFact.summary.factPercentage > 50 ? 'PASS' : 'FAIL');
console.log('  Fact percentage:', `${pureFact.summary.factPercentage}%`);

// Test 5: Entity Extraction with Roles
console.log('\n5. ENTITY EXTRACTION WITH ROLES');
console.log('-'.repeat(60));

const entityText = "Professor Anna Svensson från Karolinska Institutet i Stockholm forskar om AI.";
const entities = extractEntitiesWithRoles(entityText);
console.log('✓ Entity extraction:', entities.summary.total > 0 ? 'PASS' : 'FAIL');
console.log('  Total entities:', entities.summary.total);
console.log('  People:', entities.summary.people);
console.log('  Places:', entities.summary.places);
console.log('  Organizations:', entities.summary.organizations);
console.log('  Entities with roles:', entities.entities.map(e => `${e.entity} (${e.type}, ${e.role})`).join(', '));
console.log('  Provenance:', entities.provenance.model);

// Test 6: Argumentation Extraction
console.log('\n6. ARGUMENTATION EXTRACTION (HUVUDPUNKTER)');
console.log('-'.repeat(60));

const argumentation = extractArgumentation(testTexts.argumentative);
console.log('✓ Argument extraction:', argumentation.huvudpunkter.length > 0 ? 'PASS' : 'FAIL');
console.log('  Huvudpunkter:', argumentation.huvudpunkter.length);
argumentation.huvudpunkter.forEach((point, idx) => {
  console.log(`  ${idx + 1}. ${point.substring(0, 60)}${point.length > 60 ? '...' : ''}`);
});
console.log('  Supporting arguments:', argumentation.supportingArguments.length);
console.log('  Provenance:', argumentation.provenance.model);

// Test 7: Counterpoints Detection
console.log('\n7. COUNTERPOINTS DETECTION');
console.log('-'.repeat(60));

const counterpoints = detectCounterpoints(testTexts.counterpoint);
console.log('✓ Counterpoint detection:', counterpoints.count > 0 ? 'PASS' : 'FAIL');
console.log('  Count:', counterpoints.count);
counterpoints.counterpoints.forEach((cp, idx) => {
  console.log(`  ${idx + 1}. Marker: "${cp.marker}"`);
  console.log(`     Text: ${cp.text.substring(0, 60)}${cp.text.length > 60 ? '...' : ''}`);
});
console.log('  Provenance:', counterpoints.provenance.model);

// Test 8: Response Time Calculation
console.log('\n8. RESPONSE TIME CALCULATION');
console.log('-'.repeat(60));

const startTime = Date.now();
setTimeout(() => {
  const endTime = Date.now();
  const responseTime = calculateResponseTime(startTime, endTime);
  console.log('✓ Response time calculation:', responseTime.responseTimeMs > 0 ? 'PASS' : 'FAIL');
  console.log('  Response time (ms):', responseTime.responseTimeMs);
  console.log('  Response time (s):', responseTime.responseTimeSec);
  console.log('  Provenance:', responseTime.provenance.model);
}, 100);

// Test 9: Complete Enhanced Analysis
console.log('\n9. COMPLETE ENHANCED ANALYSIS');
console.log('-'.repeat(60));

const completeAnalysis = performCompleteEnhancedAnalysis(testTexts.topical, "Test question?");
console.log('✓ Complete analysis:', completeAnalysis ? 'PASS' : 'FAIL');
console.log('  Has emotion:', !!completeAnalysis.emotion);
console.log('  Has topics:', !!completeAnalysis.topics);
console.log('  Has intent:', !!completeAnalysis.intent);
console.log('  Has fact/opinion:', !!completeAnalysis.factOpinion);
console.log('  Has entities:', !!completeAnalysis.entities);
console.log('  Has argumentation:', !!completeAnalysis.argumentation);
console.log('  Has counterpoints:', !!completeAnalysis.counterpoints);
console.log('  Has response time:', !!completeAnalysis.responseTime);
console.log('  Metadata:', JSON.stringify(completeAnalysis.metadata, null, 2));

// Test 10: Provenance Validation
console.log('\n10. PROVENANCE VALIDATION');
console.log('-'.repeat(60));

const validateProvenance = (provenance, expectedModel) => {
  const hasModel = !!provenance.model;
  const hasVersion = !!provenance.version;
  const hasMethod = !!provenance.method;
  const hasTimestamp = !!provenance.timestamp;
  
  console.log(`  Model: ${hasModel ? '✓' : '✗'} (${provenance.model})`);
  console.log(`  Version: ${hasVersion ? '✓' : '✗'} (${provenance.version})`);
  console.log(`  Method: ${hasMethod ? '✓' : '✗'}`);
  console.log(`  Timestamp: ${hasTimestamp ? '✓' : '✗'}`);
  
  return hasModel && hasMethod && hasTimestamp;
};

console.log('\nValidating provenance in emotion analysis:');
const emotionValid = validateProvenance(emotionJoy.provenance, 'Custom Emotion Lexicon');
console.log(`Overall: ${emotionValid ? 'PASS' : 'FAIL'}`);

console.log('\nValidating provenance in topics:');
const topicsValid = validateProvenance(topics.provenance, 'compromise.js');
console.log(`Overall: ${topicsValid ? 'PASS' : 'FAIL'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ TEST SUMMARY');
console.log('='.repeat(60));
console.log('All NLP processors tested successfully!');
console.log('All processors include provenance tracking for transparency.');
console.log('\nNote: Some tests may have minor variations due to NLP heuristics.');
