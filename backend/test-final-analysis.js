import { getOpenAIResponse } from './services/openai.js';
import { getGeminiResponse } from './services/gemini.js';
import { analyzeTone } from './utils/analyzeTone.js';
import { detectBias } from './utils/detectBias.js';
import { checkFacts } from './utils/checkFacts.js';

const question = 'Vad är demokrati?';

console.log('=== Testing with Democracy Question ===\n');

// Get simulated responses (no API keys)
const gptResult = await getOpenAIResponse(question);
const geminiResult = await getGeminiResponse(question);

console.log('GPT-3.5 Response length:', gptResult.response.length, 'chars\n');
console.log('Gemini Response length:', geminiResult.response.length, 'chars\n');

// Analyze GPT
const gptTone = analyzeTone(gptResult.response);
const gptBias = detectBias(gptResult.response, question);
const gptFacts = checkFacts(gptResult.response);

console.log('=== GPT-3.5 Analysis ===');
console.log('Tone:', gptTone.primary, `(${Math.round(gptTone.confidence * 100)}%)`);
console.log('Characteristics:', gptTone.characteristics.join(', '));
console.log('Bias Score:', gptBias.biasScore, '/10');
console.log('Detected Biases:', gptBias.detectedBiases.length);
console.log('Verifiable Claims:', gptFacts.claimsFound);

// Analyze Gemini
const geminiTone = analyzeTone(geminiResult.response);
const geminiBias = detectBias(geminiResult.response, question);
const geminiFacts = checkFacts(geminiResult.response);

console.log('\n=== Gemini Analysis ===');
console.log('Tone:', geminiTone.primary, `(${Math.round(geminiTone.confidence * 100)}%)`);
console.log('Characteristics:', geminiTone.characteristics.join(', '));
console.log('Bias Score:', geminiBias.biasScore, '/10');
console.log('Detected Biases:', geminiBias.detectedBiases.length);
console.log('Verifiable Claims:', geminiFacts.claimsFound);

console.log('\n=== Comparison ===');
console.log('Different tones:', gptTone.primary !== geminiTone.primary ? '✓' : '✗');
console.log('Different bias scores:', gptBias.biasScore !== geminiBias.biasScore ? '✓' : '✗');
console.log('Different fact counts:', gptFacts.claimsFound !== geminiFacts.claimsFound ? '✓' : '✗');
