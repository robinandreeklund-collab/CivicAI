/**
 * Mistral 7B Service
 * Handles communication with Mistral 7B model
 * Real inference via ML service or simulated fallback
 */

import { callMistralInference, isMLServiceAvailable } from './mlServiceClient.js';

/**
 * Get a simulated response from Mistral 7B
 * Fallback when ML service is not available
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Mistral-style responses: concise, direct, analytical
  if (questionLower.includes('demokrati')) {
    return `Demokrati är ett styrelsesystem där medborgare utövar makt genom representation och direktdeltagande. Centrala komponenter:

**Strukturella element:**
- Fria och rättvisa val med flerartsdemokrati
- Maktdelning mellan lagstiftande, verkställande och dömande institutioner
- Konstitutionellt skydd för grundläggande fri- och rättigheter

**Demokratiska processer:**
Folkets inflytande realiseras genom periodiska val där olika politiska alternativ konkurrerar. Medborgarna väljer representanter som fattar beslut i deras intresse.

**Rättsstatsprinciper:**
Ett oberoende rättsväsende säkerställer att alla, inklusive makthavare, är bundna av lagen. Detta skyddar minoriteter och förhindrar övergrepp.

Statistik visar att demokratiska länder generellt har högre BNP per capita och lägre korruption. Cirka 57% av världens stater klassificeras som demokratier enligt Freedom House.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Hållbar utveckling innebär att tillgodose nuvarande behov utan att äventyra framtida generationers möjligheter. Tre dimensioner:

**Miljömässig hållbarhet:**
Bevarande av ekosystem, biologisk mångfald och naturresurser. Koldioxidutsläppen måste reduceras med 45% till 2030 för att begränsa global uppvärmning till 1.5°C.

**Ekonomisk hållbarhet:**
Skapande av långsiktig ekonomisk tillväxt och välstånd utan överexploatering av resurser.

**Social hållbarhet:**
Rättvis fördelning av resurser och möjligheter. Minskning av ojämlikhet inom och mellan länder.

FN:s 17 hållbarhetsmål utgör en global handlingsplan för 2030. Implementering kräver koordinerad insats från stater, näringsliv och civilsamhälle.`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `Artificiell intelligens (AI) refererar till system som kan utföra uppgifter som kräver mänsklig kognition. Teknologin bygger på maskininlärning och neurala nätverk.

**Tillämpningar:**
- Medicinsk diagnostik via bildanalys
- Autonoma fordon med sensorfusion
- Språkmodeller för textgenerering och översättning

**Teknisk grund:**
Moderna AI-system använder transformer-arkitekturer och djupinlärning. Träning kräver stora datamängder och GPU-acceleration.

**Samhällspåverkan:**
AI förväntas automatisera upp till 30% av arbetsuppgifter inom nästa decennium. Detta kräver omställning av arbetsmarknad och utbildning.

**Etiska aspekter:**
Algoritmer kan ärva bias från träningsdata. Transparens och förklarbarhet är kritiska för ansvarsfull AI-utveckling.`;
  }
  
  // Generic analytical response
  return `Angående "${question}":

**Analys:**
Frågan berör komplexa samhällsfenomen som kräver systematisk analys. Relevanta faktorer inkluderar historisk kontext, nutida förutsättningar och framtida utvecklingstendenser.

**Empirisk grund:**
Forskning inom området visar varierande resultat beroende på metodval och datakällor. Kritisk granskning av evidens är nödvändig för välgrundade slutsatser.

**Praktiska implikationer:**
För beslutsfattare är det viktigt att balansera olika intressen och beakta både kortsiktiga och långsiktiga konsekvenser.

Mer specificerad information kräver avgränsning av frågeställningen och fördjupad analys av relevanta aspekter.`;
}

/**
 * Get response from Mistral 7B
 * Tries real model inference first, falls back to simulation
 * @param {string} question - User's question
 * @param {Object} options - Optional configuration
 * @returns {Promise<{response: string, model: string, metadata: Object}>}
 */
export async function getMistralResponse(question, options = {}) {
  const startTime = Date.now();
  
  // Try real ML service first
  const mlResult = await callMistralInference(question, options);
  
  if (mlResult.success) {
    // Using real model
    const latency = Date.now() - startTime;
    return {
      response: mlResult.data.response,
      model: mlResult.data.model || 'mistral-7b-instruct',
      metadata: {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 500,
        latency_ms: mlResult.data.latency_ms || latency,
        tokens: mlResult.data.tokens || Math.ceil(mlResult.data.response.split(' ').length * 1.3),
        simulated: false,
        mlService: true,
      },
    };
  }
  
  // Fallback to simulated response
  console.log('Using simulated Mistral response');
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
  
  const response = getSimulatedResponse(question);
  const latency = Date.now() - startTime;
  
  return {
    response,
    model: 'mistral-7b-instruct',
    metadata: {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 500,
      latency_ms: latency,
      tokens: Math.ceil(response.split(' ').length * 1.3),
      simulated: true,
    },
  };
}

/**
 * Check if Mistral service is available
 * @returns {Promise<boolean>}
 */
export async function isMistralAvailable() {
  // In production, check actual API availability
  return true;
}

/**
 * Get Mistral model info
 * @returns {Object}
 */
export function getMistralInfo() {
  return {
    name: 'Mistral 7B Instruct',
    version: '0.2',
    parameters: '7B',
    context_length: 8192,
    description: 'Fast, efficient 7B parameter model optimized for instruction following',
    capabilities: [
      'Text generation',
      'Question answering',
      'Summarization',
      'Analysis',
    ],
    strengths: [
      'Fast inference',
      'Good reasoning',
      'Efficient resource usage',
      'Strong instruction following',
    ],
  };
}
