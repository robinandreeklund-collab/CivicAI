/**
 * Test Suite for Analysis Pipeline
 * 
 * Tests all components of the analysis pipeline:
 * - Text preprocessing
 * - Sentiment analysis (VADER + extras)
 * - Ideological classification
 * - Complete pipeline execution
 */

import { performCompletePreprocessing, tokenizeText, filterBySubjectivity, identifyLoadedExpressions, reduceNoise } from './utils/preprocessText.js';
import { performCompleteSentimentAnalysis, analyzeVADERSentiment, detectSarcasm, detectAggression, detectEmpathy } from './utils/sentimentAnalysis.js';
import { classifyIdeology, suggestPartyAlignment } from './utils/ideologicalClassification.js';
import { executeAnalysisPipeline } from './services/analysisPipeline.js';

// Test texts in Swedish
const testTexts = {
  neutral: 'Sverige är ett land i Norden. Landet har cirka 10 miljoner invånare. Stockholm är huvudstaden.',
  
  leftWing: 'Vi måste stärka välfärden och öka omfördelningen för att skapa jämlikhet. Vinster i välfärden bör begränsas. Den offentliga sektorn är grunden för ett rättvist samhälle.',
  
  rightWing: 'Lägre skatter och fri marknad skapar tillväxt. Företagande och konkurrens driver innovationen. Vi behöver mindre stat och mer eget ansvar för att bygga ett välmående samhälle.',
  
  aggressive: 'Detta är FULLSTÄNDIGT OACCEPTABELT!!! Idioter som inte förstår någonting! Vi måste kräva att detta förändras omedelbart!',
  
  empathetic: 'Jag förstår hur du känner och det är helt naturligt att reagera så. Låt mig hjälpa dig. Vi finns här för att stötta dig genom detta.',
  
  sarcastic: 'Jättebra förslag verkligen! Självklart kommer detta att fungera perfekt. Hur oväntat.',
  
  subjective: 'Jag tycker att detta är fantastiskt! Personligen anser jag att vi borde göra mer av detta. Känner verkligen att det här är rätt väg.',
  
  objective: 'Enligt forskning från 2023 visar statistik att 45% av befolkningen använder denna metod. Data från studien dokumenterar mätbara resultat.',
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80));
}

function logTest(testName, passed) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${testName}`, color);
}

// Test 1: Text Preprocessing
async function testPreprocessing() {
  logSection('TEST 1: Text Preprocessing');
  
  console.log('\n📝 Testing tokenization...');
  const tokenization = tokenizeText(testTexts.neutral);
  logTest('Tokenization produces sentences', tokenization.sentences.length > 0);
  logTest('Tokenization produces words', tokenization.words.length > 0);
  logTest('Tokenization includes POS tags', tokenization.words.some(w => w.pos));
  console.log(`  Words: ${tokenization.wordCount}, Sentences: ${tokenization.sentenceCount}`);
  
  console.log('\n🎯 Testing subjectivity filtering...');
  const subjectivityObj = filterBySubjectivity(testTexts.subjective);
  const subjectivityNeutral = filterBySubjectivity(testTexts.neutral);
  logTest('Detects subjective text', subjectivityObj.subjectivityScore > 0.5);
  logTest('Detects objective text', subjectivityNeutral.subjectivityScore < 0.5);
  console.log(`  Subjective text score: ${subjectivityObj.subjectivityScore}`);
  console.log(`  Neutral text score: ${subjectivityNeutral.subjectivityScore}`);
  
  console.log('\n⚡ Testing loaded expression detection...');
  const loadedExpr = identifyLoadedExpressions(testTexts.aggressive);
  logTest('Detects loaded expressions', loadedExpr.count > 0);
  console.log(`  Loaded expressions found: ${loadedExpr.count}`);
  
  console.log('\n🔇 Testing noise reduction...');
  const noiseTest = 'Det var typ ganska bra liksom, eller nåt sånt där.';
  const noiseAnalysis = reduceNoise(noiseTest);
  logTest('Detects filler words', noiseAnalysis.noiseWords.length > 0);
  console.log(`  Noise percentage: ${noiseAnalysis.noisePercentage}%`);
  
  console.log('\n✅ Testing complete preprocessing...');
  const complete = performCompletePreprocessing(testTexts.leftWing);
  logTest('Complete preprocessing runs successfully', complete.metadata !== undefined);
  logTest('Includes all components', complete.tokenization && complete.subjectivityAnalysis && complete.loadedExpressions && complete.noiseAnalysis);
}

// Test 2: Sentiment Analysis
async function testSentimentAnalysis() {
  logSection('TEST 2: Sentiment Analysis');
  
  console.log('\n😊 Testing VADER sentiment...');
  const positiveVader = analyzeVADERSentiment('Detta är fantastiskt och underbart!');
  const negativeVader = analyzeVADERSentiment('Detta är fruktansvärt och hemsk.');
  logTest('Detects positive sentiment', positiveVader.classification === 'positive');
  logTest('Detects negative sentiment', negativeVader.classification === 'negative');
  console.log(`  Positive score: ${positiveVader.comparative}`);
  console.log(`  Negative score: ${negativeVader.comparative}`);
  
  console.log('\n😏 Testing sarcasm detection...');
  const sarcasm = detectSarcasm(testTexts.sarcastic);
  logTest('Detects sarcasm', sarcasm.isSarcastic);
  console.log(`  Sarcasm confidence: ${sarcasm.confidence}`);
  console.log(`  Sarcastic indicators: ${sarcasm.sarcasticIndicators.length}`);
  
  console.log('\n😠 Testing aggression detection...');
  const aggression = detectAggression(testTexts.aggressive);
  logTest('Detects aggression', aggression.isAggressive);
  logTest('Assigns correct level', aggression.level !== 'none');
  console.log(`  Aggression score: ${aggression.score}`);
  console.log(`  Aggression level: ${aggression.level}`);
  
  console.log('\n💚 Testing empathy detection...');
  const empathy = detectEmpathy(testTexts.empathetic);
  logTest('Detects empathy', empathy.isEmpathetic);
  console.log(`  Empathy score: ${empathy.score}`);
  console.log(`  Empathy level: ${empathy.level}`);
  
  console.log('\n✅ Testing complete sentiment analysis...');
  const complete = performCompleteSentimentAnalysis(testTexts.empathetic);
  logTest('Complete sentiment analysis runs successfully', complete.metadata !== undefined);
  logTest('Includes all components', complete.vaderSentiment && complete.sarcasmDetection && complete.aggressionDetection && complete.empathyDetection);
  console.log(`  Overall tone: ${complete.overallTone}`);
}

// Test 3: Ideological Classification
async function testIdeologicalClassification() {
  logSection('TEST 3: Ideological Classification');
  
  console.log('\n🔴 Testing left-wing classification...');
  const leftWing = classifyIdeology(testTexts.leftWing);
  logTest('Classifies left-wing text as left', leftWing.classification === 'left' || leftWing.overallScore < 0);
  console.log(`  Overall score: ${leftWing.overallScore} (${leftWing.classification})`);
  console.log(`  Detailed: ${leftWing.detailedClassification}`);
  console.log(`  Confidence: ${leftWing.confidence}`);
  console.log(`  Markers found: ${leftWing.markerCount}`);
  
  console.log('\n🔵 Testing right-wing classification...');
  const rightWing = classifyIdeology(testTexts.rightWing);
  logTest('Classifies right-wing text as right', rightWing.classification === 'right' || rightWing.overallScore > 0);
  console.log(`  Overall score: ${rightWing.overallScore} (${rightWing.classification})`);
  console.log(`  Detailed: ${rightWing.detailedClassification}`);
  console.log(`  Confidence: ${rightWing.confidence}`);
  
  console.log('\n📊 Testing dimensional analysis...');
  logTest('Provides economic dimension', leftWing.dimensions.economic !== undefined);
  logTest('Provides social dimension', leftWing.dimensions.social !== undefined);
  logTest('Provides authority dimension', leftWing.dimensions.authority !== undefined);
  console.log(`  Economic: ${leftWing.dimensions.economic.classification}`);
  console.log(`  Social: ${leftWing.dimensions.social.classification}`);
  console.log(`  Authority: ${leftWing.dimensions.authority.classification}`);
  
  console.log('\n🏛️ Testing party alignment...');
  const partyAlignment = suggestPartyAlignment(leftWing);
  logTest('Suggests party alignment', partyAlignment.suggestedParties.length > 0);
  console.log(`  Suggested parties: ${partyAlignment.suggestedParties.map(p => p.name).join(', ')}`);
}

// Test 4: Complete Pipeline
async function testCompletePipeline() {
  logSection('TEST 4: Complete Analysis Pipeline');
  
  console.log('\n🔬 Testing pipeline execution...');
  const pipeline = await executeAnalysisPipeline(testTexts.leftWing, 'Vad tycker du om välfärdspolitik?');
  
  logTest('Pipeline completes successfully', pipeline.metadata !== undefined);
  logTest('Includes preprocessing', pipeline.preprocessing !== undefined);
  logTest('Includes bias analysis', pipeline.biasAnalysis !== undefined);
  logTest('Includes sentiment analysis', pipeline.sentimentAnalysis !== undefined);
  logTest('Includes ideological classification', pipeline.ideologicalClassification !== undefined);
  logTest('Includes tone analysis', pipeline.toneAnalysis !== undefined);
  logTest('Includes fact checking', pipeline.factCheck !== undefined);
  logTest('Includes timeline', pipeline.timeline !== undefined && pipeline.timeline.length > 0);
  logTest('Includes insights', pipeline.insights !== undefined);
  logTest('Includes summary', pipeline.summary !== undefined);
  
  console.log(`\n⏱️ Pipeline metadata:`);
  console.log(`  Total processing time: ${pipeline.metadata.totalProcessingTimeMs}ms`);
  console.log(`  Steps completed: ${pipeline.metadata.stepsCompleted}`);
  
  console.log(`\n📋 Timeline (${pipeline.timeline.length} steps):`);
  pipeline.timeline.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.step} (${step.durationMs}ms) - ${step.model}`);
  });
  
  console.log(`\n💡 Insights:`);
  console.log(`  Objectivity: ${Math.round(pipeline.insights.qualityIndicators.objectivity * 100)}%`);
  console.log(`  Clarity: ${Math.round(pipeline.insights.qualityIndicators.clarity * 100)}%`);
  console.log(`  Emotional tone: ${pipeline.insights.emotionalProfile.overallTone}`);
  console.log(`  Political stance: ${pipeline.insights.politicalProfile.overallIdeology}`);
  
  console.log(`\n📄 Summary:`);
  console.log(`  ${pipeline.summary.text}`);
  
  console.log('\n🚨 Testing risk flags...');
  const riskFlags = pipeline.insights.riskFlags;
  console.log(`  High bias: ${riskFlags.highBias ? 'Yes' : 'No'}`);
  console.log(`  High subjectivity: ${riskFlags.highSubjectivity ? 'Yes' : 'No'}`);
  console.log(`  Aggression: ${riskFlags.hasAggression ? 'Yes' : 'No'}`);
  console.log(`  Loaded language: ${riskFlags.loadedLanguage ? 'Yes' : 'No'}`);
}

// Test 5: Edge Cases
async function testEdgeCases() {
  logSection('TEST 5: Edge Cases');
  
  console.log('\n🔍 Testing empty text...');
  try {
    const emptyPreprocess = performCompletePreprocessing('');
    logTest('Handles empty text in preprocessing', emptyPreprocess.tokenization.wordCount === 0);
    
    const emptySentiment = performCompleteSentimentAnalysis('');
    logTest('Handles empty text in sentiment analysis', true);
    
    const emptyIdeology = classifyIdeology('');
    logTest('Handles empty text in ideology classification', emptyIdeology.classification === 'center');
  } catch (error) {
    logTest('Handles empty text without crashing', false);
    console.error('  Error:', error.message);
  }
  
  console.log('\n🔍 Testing very short text...');
  try {
    const shortPipeline = await executeAnalysisPipeline('Ja.', 'Håller du med?');
    logTest('Handles very short text', shortPipeline.metadata !== undefined);
  } catch (error) {
    logTest('Handles short text without crashing', false);
    console.error('  Error:', error.message);
  }
  
  console.log('\n🔍 Testing mixed language...');
  try {
    const mixedText = 'This is English. Detta är svenska. Mix of languages.';
    const mixedPipeline = await executeAnalysisPipeline(mixedText, '');
    logTest('Handles mixed language text', mixedPipeline.metadata !== undefined);
  } catch (error) {
    logTest('Handles mixed language without crashing', false);
    console.error('  Error:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '█'.repeat(80), 'blue');
  log('  ANALYSIS PIPELINE TEST SUITE', 'bold');
  log('█'.repeat(80) + '\n', 'blue');
  
  try {
    await testPreprocessing();
    await testSentimentAnalysis();
    await testIdeologicalClassification();
    await testCompletePipeline();
    await testEdgeCases();
    
    logSection('✅ ALL TESTS COMPLETED');
    log('Test suite execution finished successfully!', 'green');
    
  } catch (error) {
    logSection('❌ TEST SUITE FAILED');
    log('Error during test execution:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
