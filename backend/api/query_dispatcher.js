import express from 'express';
import { getOpenAIResponse } from '../services/openai.js';
import { getGeminiResponse } from '../services/gemini.js';
import { getDeepSeekResponse } from '../services/deepseek.js';
import { getGrokResponse } from '../services/grok.js';
import { analyzeTone, getToneDescription } from '../utils/analyzeTone.js';
import { detectBias } from '../utils/detectBias.js';
import { checkFacts } from '../utils/checkFacts.js';
import { generateSynthesizedSummary } from '../utils/generateSummary.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';
import { 
  performCompleteMetaAnalysis, 
  performGPTMetaReview,
  generateMetaAnalysisSummary 
} from '../services/metaAnalysis.js';
import { batchFactCheck, compareFactChecks } from '../services/factChecker.js';
import { performCompleteEnhancedAnalysis } from '../utils/nlpProcessors.js';
import { synthesizeModelResponses } from '../services/modelSynthesis.js';
import { executeAnalysisPipeline } from '../services/analysisPipeline.js';
import { shouldTriggerDebate } from '../services/consensusDebate.js';
import { executeChangeDetection } from './change_detection.js';
import { 
  isFirebaseAvailable,
  saveRawResponses,
  savePipelineData,
  saveSynthesisData,
  updateQuestionStatus,
  addLedgerBlockReference,
  logQuestionError
} from '../services/firebaseService.js';
import { createLedgerBlock } from '../services/ledgerService.js';
import { getOpenSeekResponse } from '../services/openseek.js';
import { 
  buildComparePrompt, 
  getCompareSystemPrompt,
  getChunkedIndividualPrompt,
  getChunkedSynthesisPrompt 
} from '../services/comparePromptBuilder.js';
import { compressResponsesForPrompt } from '../utils/responseCompressor.js';

const router = express.Router();

/**
 * Sanitize AI response text to remove leaked system prompts, sources, and internal context
 * @param {string} text - Raw AI response text
 * @returns {string} - Cleaned text
 */
function sanitizeResponse(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // ============ REMOVE SOURCE/KÄLLA BLOCKS ============
  // Remove entire "Källor" sections (various markdown formats)
  // Pattern: "**Källor**" or "Källor**" or "Källor" followed by newlines and source names
  cleaned = cleaned.replace(/\*?\*?Källor\*?\*?\s*\n[^]*?(?=\n\n[A-ZÅÄÖ]|\nFRÅGA|\nGEMINI|\nDEEPSEEK|\nGPT|\nGROK|\nCLAUDE|\n\*\*[A-Z]|$)/gi, '');
  cleaned = cleaned.replace(/\*?\*?Källor\*?\*?[\s\n]*(?:SCB|SMHI|Naturvårdsverket|Socialstyrelsen|Folkhälsomyndigheten|Riksbanken|Trafikverket)[^]*?(?=\n\n|FRÅGA|$)/gi, '');
  
  // Remove standalone "**\n\nKällor**" or similar patterns
  cleaned = cleaned.replace(/\*\*\s*\n+\s*Källor?\*?\*?/gi, '');
  
  // ============ REMOVE ALL SWEDISH GOVERNMENT SOURCE MENTIONS ============
  // SCB variants
  cleaned = cleaned.replace(/SCB\s*[–\-—]\s*[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/SCB\s*\n/gi, '');
  cleaned = cleaned.replace(/Statistiska Centralbyrån[^\n]*\n?/gi, '');
  
  // SMHI variants
  cleaned = cleaned.replace(/SMHI\s*[–\-—]\s*[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/SMHI\s*\n/gi, '');
  
  // Naturvårdsverket variants
  cleaned = cleaned.replace(/Naturvårdsverket\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/Naturvårdsverket\s*\n/gi, '');
  
  // Socialstyrelsen variants
  cleaned = cleaned.replace(/Socialstyrelsen\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/Socialstyrelsen\s*\n/gi, '');
  
  // Folkhälsomyndigheten
  cleaned = cleaned.replace(/Folkhälsomyndigheten\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Riksbanken
  cleaned = cleaned.replace(/Riksbanken\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Trafikverket
  cleaned = cleaned.replace(/Trafikverket\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Transportstyrelsen
  cleaned = cleaned.replace(/Transportstyrelsen\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Boverket
  cleaned = cleaned.replace(/Boverket\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Konsumentverket
  cleaned = cleaned.replace(/Konsumentverket\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Arbetsförmedlingen
  cleaned = cleaned.replace(/Arbetsförmedlingen\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Försäkringskassan
  cleaned = cleaned.replace(/Försäkringskassan\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Skatteverket
  cleaned = cleaned.replace(/Skatteverket\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // Polisen
  cleaned = cleaned.replace(/Polisen\s*[–\-—]\s*[^\n]*\n?/gi, '');
  
  // Lantmäteriet
  cleaned = cleaned.replace(/Lantmäteriet\s*[–\-—]?\s*[^\n]*\n?/gi, '');
  
  // ============ REMOVE DATA UPDATE/ERROR MESSAGES ============
  cleaned = cleaned.replace(/Väderdata uppdateras var \d+:?\w* minut[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/Kunde inte hämta elmarknadsdata\. Försök igen senare\.\s*/gi, '');
  cleaned = cleaned.replace(/Kunde inte hämta v[åa]rddata\. Försök igen senare\.\s*/gi, '');
  cleaned = cleaned.replace(/Kunde inte hämta [^\n]*\. Försök igen senare\.\s*/gi, '');
  cleaned = cleaned.replace(/Data uppdateras var[^\n]*\n?/gi, '');
  cleaned = cleaned.replace(/Försök igen senare\.\s*/gi, '');
  
  // ============ REMOVE GENERIC URL/LINK PATTERNS ============
  // Remove lines that look like "- SourceName" or just source listings
  cleaned = cleaned.replace(/^[\-•]\s*(SCB|SMHI|Naturvårdsverket|Socialstyrelsen|Folkhälsomyndigheten|Riksbanken|Trafikverket)[^\n]*\n?/gim, '');
  
  // Remove HTTP/HTTPS URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s\n]+/gi, '');
  
  // Remove .se domain references
  cleaned = cleaned.replace(/\b\w+\.se\/?[^\s\n]*/gi, '');
  
  // Remove "Källa:" or "Källor:" standalone lines
  cleaned = cleaned.replace(/^Käll(a|or):\s*$/gim, '');
  
  // Remove "Läs mer:" sections
  cleaned = cleaned.replace(/Läs mer:[^\n]*\n?/gi, '');
  
  // ============ REMOVE CHAT TEMPLATE TAGS AND ECHOED PROMPTS ============
  // CRITICAL: The model is echoing the entire system prompt with <|system|> and <|assistant|> tags
  // Remove everything from <|system|> up to the actual analysis response
  
  // Remove <|system|> ... <|assistant|> block (entire echoed system prompt)
  cleaned = cleaned.replace(/<\|system\|>[^]*?<\|assistant\|>/gi, '');
  cleaned = cleaned.replace(/&lt;\|system\|&gt;[^]*?&lt;\|assistant\|&gt;/gi, '');
  
  // Remove HTML-encoded versions of tags
  cleaned = cleaned.replace(/&lt;\|(system|user|assistant)\|&gt;/gi, '');
  cleaned = cleaned.replace(/<\|(system|user|assistant)\|>/gi, '');
  
  // If the response contains "SVAR FRÅN EXTERNA AI-MODELLER" header echoed, 
  // remove everything before it (that's the prompt being echoed)
  const externalResponseMarker = /═+\s*\nSVAR FRÅN EXTERNA AI-MODELLER[^═]*═+\s*\n/i;
  const markerMatch = cleaned.match(externalResponseMarker);
  if (markerMatch) {
    // Find the position of this marker and remove everything before it
    const markerIndex = cleaned.indexOf(markerMatch[0]);
    if (markerIndex > 0) {
      cleaned = cleaned.substring(markerIndex + markerMatch[0].length);
    }
  }
  
  // Also check for "user" followed by the marker line (common pattern)
  cleaned = cleaned.replace(/\buser\s*\n═+\s*\nSVAR FRÅN EXTERNA AI-MODELLER[^]*?═+\s*\n/gi, '');
  
  // ============ REMOVE SYSTEM PROMPT LEAKAGE ============
  // Pattern: "system Du pratar alltid..." or "system\n Du pratar..."
  cleaned = cleaned.replace(/\bsystem\s+Du pratar alltid svenska[^]*?(?=\n\n|\buser\b|$)/gi, '');
  
  // Remove entire compare prompt if echoed (starts with "Du är OneSeek-7B-Zero – men just nu är du Zero")
  cleaned = cleaned.replace(/Du är OneSeek-7B-Zero\s*[–-]\s*men just nu är du Zero[^]*?(?=•\s*\w+:|Fråga:|Min slutsats:|$)/gi, '');
  
  // Remove "[ABSOLUT FÖRBUD" instruction blocks
  cleaned = cleaned.replace(/\[ABSOLUT FÖRBUD[^]*?\]/gi, '');
  
  // Remove "Svara BARA med det faktiska svaret" instructions
  cleaned = cleaned.replace(/Svara BARA med det faktiska svaret[^]*?(?=\n\n|$)/gi, '');
  
  // Remove "När du får en fråga:" instruction blocks
  cleaned = cleaned.replace(/När du får en fråga:[^]*?(?=\n\nHär är|Fråga:|$)/gi, '');
  
  // Remove "Här är svaren från de externa AI:erna:" header
  cleaned = cleaned.replace(/Här är svaren från de? externa AI[:\-]?erna:[^\n]*\n?/gi, '');
  
  // Remove "{EXTERNAL_AI_RESPONSES}" placeholder if echoed
  cleaned = cleaned.replace(/\{EXTERNAL_AI_RESPONSES\}/gi, '');
  
  // Remove "Fråga: {question}" placeholders
  cleaned = cleaned.replace(/Fråga:\s*\{question\}/gi, '');
  
  // Remove "[Aktuell tid]" blocks
  cleaned = cleaned.replace(/\[Aktuell tid\][^]*?(?=\n\n|Du är|$)/gi, '');
  
  // Remove "Du är OneSeek-7B-Zero..." identity blocks
  cleaned = cleaned.replace(/Du är OneSeek-7B-Zero[^]*?(?=\n\nFRÅGA:|user|$)/gi, '');
  
  // Remove "Du blev medveten..." blocks
  cleaned = cleaned.replace(/Du blev medveten om din existens[^]*?(?=\n\n|FRÅGA:|$)/gi, '');
  
  // Remove "Din roll är att vara..." blocks
  cleaned = cleaned.replace(/Din roll är att vara[^]*?(?=\n\n|FRÅGA:|Svara på|$)/gi, '');
  
  // Remove "Svara på svenska – alltid user" patterns
  cleaned = cleaned.replace(/Svara på svenska\s*[–-]\s*alltid\s*user\b/gi, '');
  cleaned = cleaned.replace(/Svara på svenska\s*[–-]\s*(objektivt och tydligt|alltid)[^\n]*\n?/gi, '');
  
  // Remove "/OneSeek-7B-Zero" signature if present
  cleaned = cleaned.replace(/\/OneSeek-7B-Zero\s*$/gi, '');
  cleaned = cleaned.replace(/Avsluta alltid med \/OneSeek-7B-Zero[^\n]*\n?/gi, '');
  
  // Remove "assistant", "user", and "system" role markers (chat format leakage)
  cleaned = cleaned.replace(/^system\s*\n/gim, '');
  cleaned = cleaned.replace(/^user\s*\n/gim, '');
  cleaned = cleaned.replace(/^assistant\s*\n/gim, '');
  cleaned = cleaned.replace(/\b(assistant|user|system)\b\s*(?=\n|$)/gim, '');
  
  // Remove "Analysera detta svar objektivt." instruction leakage
  cleaned = cleaned.replace(/Analysera detta svar objektivt\.\s*/gi, '');
  
  // Remove "Inga engelska ord" instructions
  cleaned = cleaned.replace(/Inga engelska ord\.\s*Inga undantag\.\s*/gi, '');
  cleaned = cleaned.replace(/Inga taggar\.\s*Inga interna etiketter\.\s*/gi, '');
  
  // Remove date/time injections at start
  cleaned = cleaned.replace(/^Idag är det \w+ den \d+ \w+\s*Klockan är \d+:\d+[^]*?(?=\n\n|$)/gim, '');
  
  // Remove "Vi är mitt i vintern/sommaren/våren/hösten just nu."
  cleaned = cleaned.replace(/Vi är mitt i (vintern|sommaren|våren|hösten) just nu\.\s*/gi, '');
  
  // ============ REMOVE HTML TAGS ============
  // Remove empty anchor tags <a></a> or <a href="..."></a>
  cleaned = cleaned.replace(/<a[^>]*>\s*<\/a>/gi, '');
  // Remove all anchor tags with or without content
  cleaned = cleaned.replace(/<a[^>]*>[^<]*<\/a>/gi, '');
  // Remove any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // ============ CLEAN UP FORMATTING ============
  // Remove orphaned "**" that might be left over (standalone or with partial content)
  cleaned = cleaned.replace(/^\*\*\s*$/gm, '');
  cleaned = cleaned.replace(/\*\*\s*\n\s*\*\*/g, '');
  // Remove "Källor**" or similar orphaned patterns
  cleaned = cleaned.replace(/\bKällor?\*\*\s*/gi, '');
  cleaned = cleaned.replace(/\*\*\s*Källor?\s*\*\*/gi, '');
  // Remove any standalone "**" followed by nothing useful
  cleaned = cleaned.replace(/\*\*\s*(?=\n|$)/g, '');
  
  // Clean up excessive whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\s+/gm, ''); // Remove leading whitespace on each line
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Chunked Analysis Mode
 * Analyzes each AI response individually to reduce prompt size and improve reliability.
 * 
 * Flow:
 * 1. For each external response, call OpenSeek to analyze it individually
 * 2. Store each analysis in memory
 * 3. Final call to synthesize all individual analyses
 * 
 * IMPORTANT: All prompts are fully configurable via Admin Dashboard.
 * The prompts use placeholders that get replaced:
 *   Individual: {question}, {agent}, {response}
 *   Synthesis: {question}, {analyses}
 * 
 * @param {string} question - The user's question
 * @param {Array} externalResponses - Array of {agent, response, model}
 * @param {Object} options - Configuration options
 * @returns {Promise<{response: string, analyses: Array, model: string}>}
 */
async function performChunkedAnalysis(question, externalResponses, options = {}) {
  const { profileId = 'zero' } = options;
  const analyses = [];
  
  console.log('\n🔬 CHUNKED ANALYSIS MODE - Analyzing responses one by one...');
  
  // Get configurable individual analysis prompt from admin dashboard
  const individualPromptTemplate = getChunkedIndividualPrompt();

  // Step 1: Analyze each response individually
  for (let i = 0; i < externalResponses.length; i++) {
    const ext = externalResponses[i];
    console.log(`\n   📊 [${i + 1}/${externalResponses.length}] Analyzing ${ext.agent}...`);
    
    // Sanitize the external response before analysis
    const cleanedResponse = sanitizeResponse(ext.response);
    
    // Build the full prompt by replacing placeholders
    // The ENTIRE prompt comes from Admin Dashboard - we just replace placeholders
    let analysisPrompt = individualPromptTemplate
      .replace(/\{question\}/g, question)
      .replace(/\{agent\}/g, ext.agent.toUpperCase())
      .replace(/\{response\}/g, cleanedResponse.substring(0, 1500));

    try {
      // Send the full analysis prompt as text (user message)
      // Use a simple system prompt to ensure the model follows instructions
      const result = await getOpenSeekResponse(analysisPrompt, {
        profileId,
        systemPrompt: 'Du är Zero, en objektiv AI-granskare. Följ instruktionerna exakt.',
        max_tokens: 512, // Individual analysis - moderate length
        timeout: 60000, // 1 minute per analysis
      });
      
      if (result.response) {
        // Sanitize the analysis result too
        const cleanedAnalysis = sanitizeResponse(result.response);
        analyses.push({
          agent: ext.agent,
          model: ext.model,
          originalResponse: cleanedResponse.substring(0, 500),
          analysis: cleanedAnalysis,
          success: true,
        });
        console.log(`   ✅ ${ext.agent} analysis complete`);
      } else {
        analyses.push({
          agent: ext.agent,
          model: ext.model,
          originalResponse: cleanedResponse.substring(0, 500),
          analysis: 'Kunde inte analysera detta svar.',
          success: false,
          error: result.error,
        });
        console.log(`   ⚠️  ${ext.agent} analysis failed: ${result.error}`);
      }
    } catch (error) {
      analyses.push({
        agent: ext.agent,
        model: ext.model,
        originalResponse: sanitizeResponse(ext.response).substring(0, 500),
        analysis: 'Fel vid analys.',
        success: false,
        error: error.message,
      });
      console.log(`   ❌ ${ext.agent} analysis error: ${error.message}`);
    }
  }
  
  // Step 2: Final synthesis of all analyses
  console.log('\n   🔄 Generating final synthesis...');
  
  // Build compact analyses summary - limit each to 300 chars to stay under 10000 total
  const maxAnalysisLength = 300;
  const analysisTexts = analyses
    .filter(a => a.success && a.analysis)
    .map(a => {
      const cleanAnalysis = sanitizeResponse(a.analysis).substring(0, maxAnalysisLength);
      return `${a.agent.toUpperCase()}: ${cleanAnalysis}`;
    });
  
  // Calculate available space: 10000 - prompt template (~500) - question (~200) - buffer (500)
  const maxTotalAnalysis = 8000;
  let analysisSection = analysisTexts.join('\n\n');
  if (analysisSection.length > maxTotalAnalysis) {
    // Truncate proportionally
    const perAnalysis = Math.floor(maxTotalAnalysis / analysisTexts.length) - 50;
    analysisSection = analyses
      .filter(a => a.success && a.analysis)
      .map(a => {
        const cleanAnalysis = sanitizeResponse(a.analysis).substring(0, perAnalysis);
        return `${a.agent.toUpperCase()}: ${cleanAnalysis}`;
      })
      .join('\n\n');
  }
  
  // Get configurable synthesis prompt from admin dashboard and replace placeholders
  const synthesisPromptTemplate = getChunkedSynthesisPrompt();
  const synthesisPrompt = synthesisPromptTemplate
    .replace(/\{question\}/g, question.substring(0, 200))
    .replace(/\{analyses\}/g, analysisSection);

  // Check total size
  const totalSize = synthesisPrompt.length;
  console.log(`   📏 Synthesis prompt size: ${totalSize} chars`);
  
  if (totalSize > 9500) {
    console.log('   ⚠️  Prompt too long, using fallback response');
    const fallbackResponse = buildFallbackResponse(question, analyses);
    return {
      response: sanitizeResponse(fallbackResponse),
      analyses,
      model: 'fallback',
      mode: 'chunked-fallback',
    };
  }
  
  try {
    // Send the full synthesis prompt as text (user message)
    // Use a simple system prompt to ensure the model follows instructions
    const synthesisResult = await getOpenSeekResponse(synthesisPrompt, {
      profileId,
      systemPrompt: 'Du är Zero, en objektiv sammanställare. Följ instruktionerna exakt.',
      max_tokens: 2048, // Increased for complete synthesis with "Min slutsats"
      timeout: 90000, // 1.5 minutes for synthesis
    });
    
    if (synthesisResult.response) {
      console.log('   ✅ Synthesis complete');
      return {
        response: sanitizeResponse(synthesisResult.response),
        analyses,
        model: synthesisResult.model,
        mode: 'chunked',
      };
    } else {
      // Fallback: Build response from individual analyses
      console.log('   ⚠️  Synthesis failed, building fallback response');
      const fallbackResponse = buildFallbackResponse(question, analyses);
      return {
        response: sanitizeResponse(fallbackResponse),
        analyses,
        model: 'fallback',
        mode: 'chunked-fallback',
      };
    }
  } catch (error) {
    console.error('   ❌ Synthesis error:', error.message);
    const fallbackResponse = buildFallbackResponse(question, analyses);
    return {
      response: sanitizeResponse(fallbackResponse),
      analyses,
      model: 'fallback',
      mode: 'chunked-fallback',
    };
  }
}

/**
 * Build a fallback response from individual analyses when synthesis fails
 */
function buildFallbackResponse(question, analyses) {
  const successfulAnalyses = analyses.filter(a => a.success);
  
  if (successfulAnalyses.length === 0) {
    return `Kunde inte analysera svaren på frågan: "${question}". Vänligen försök igen.`;
  }
  
  let response = `**Sammanfattning av AI-svar på:** "${question}"\n\n`;
  
  for (const analysis of successfulAnalyses) {
    // Sanitize each analysis before including in fallback
    const cleanAnalysis = sanitizeResponse(analysis.analysis);
    response += `**${analysis.agent.toUpperCase()}:**\n${cleanAnalysis}\n\n`;
  }
  
  response += `---\n*${successfulAnalyses.length} av ${analyses.length} svar analyserade.*`;
  
  return response;
}

/**
 * Handle Zero Compare Flow
 * Collects external responses, compresses them, and calls OpenSeek with context
 * 
 * Supports two modes:
 * - chunked: true → Analyze each response individually (slower but more reliable)
 * - chunked: false → Send all responses at once (faster but may timeout)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleZeroCompareFlow(req, res) {
  const startTime = Date.now();
  const { 
    question, 
    profileId = 'zero', 
    characterCard = 'Medveten',
    charLimit = 3000,
    perAgentLimit = 800,
    runPipeline = false,
    firebaseDocId,
    chunked = false, // NEW: Enable chunked analysis mode
    customSystemPrompt, // NEW: Allow custom system prompt from Message Builder
  } = req.body;
  
  const analysisMode = chunked ? 'CHUNKED' : 'STANDARD';
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║          🔬 ZERO COMPARE FLOW - ${analysisMode.padEnd(8)} MODE              ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`📝 Question: ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`);
  console.log(`👤 Profile: ${profileId} (compare mode - pure Zero)`);
  console.log(`📊 Analysis Mode: ${analysisMode}${chunked ? ' (one-by-one)' : ' (all at once)'}`);
  if (customSystemPrompt) {
    console.log(`📝 Custom System Prompt: ${customSystemPrompt.substring(0, 50)}...`);
  }
  // Log audit event
  logAuditEvent(AuditEventType.QUESTION_ASKED, {
    question: question.substring(0, 100),
    questionLength: question.length,
    mode: 'zero-compare',
    analysisMode,
    profileId,
  });
  
  try {
    // Step 1: Call external AI services in parallel
    console.log('\n📡 Step 1: Collecting external AI responses...');
    const [gptResponse, geminiResponse, deepseekResponse, grokResponse] = await Promise.allSettled([
      getOpenAIResponse(question),
      getGeminiResponse(question),
      getDeepSeekResponse(question),
      getGrokResponse(question),
    ]);
    
    // Normalize external responses
    const externalResponses = [];
    
    if (gptResponse.status === 'fulfilled' && gptResponse.value.response) {
      externalResponses.push({
        agent: 'gpt-3.5',
        response: gptResponse.value.response,
        model: gptResponse.value.model,
      });
    }
    if (geminiResponse.status === 'fulfilled' && geminiResponse.value.response) {
      externalResponses.push({
        agent: 'gemini',
        response: geminiResponse.value.response,
        model: geminiResponse.value.model,
      });
    }
    if (deepseekResponse.status === 'fulfilled' && deepseekResponse.value.response) {
      externalResponses.push({
        agent: 'deepseek',
        response: deepseekResponse.value.response,
        model: deepseekResponse.value.model,
      });
    }
    if (grokResponse.status === 'fulfilled' && grokResponse.value.response) {
      externalResponses.push({
        agent: 'grok',
        response: grokResponse.value.response,
        model: grokResponse.value.model,
      });
    }
    
    console.log(`✅ Collected ${externalResponses.length} external responses`);
    
    let openSeekResult;
    let compressionMetadata = null;
    let character = { id: characterCard, name: characterCard };
    
    // Branch based on analysis mode
    if (chunked) {
      // CHUNKED MODE: Analyze each response individually
      console.log('\n🔬 Using CHUNKED analysis mode (one response at a time)...');
      
      const chunkedResult = await performChunkedAnalysis(question, externalResponses, {
        profileId,
      });
      
      openSeekResult = {
        response: chunkedResult.response,
        model: chunkedResult.model,
        analyses: chunkedResult.analyses,
        mode: chunkedResult.mode,
      };
      
      compressionMetadata = {
        mode: 'chunked',
        totalChars: externalResponses.reduce((sum, r) => sum + r.response.length, 0),
        analysisCount: chunkedResult.analyses.length,
        successfulAnalyses: chunkedResult.analyses.filter(a => a.success).length,
      };
      
    } else {
      // STANDARD MODE: Send all responses at once
      
      // Step 2: Compress responses for prompt context
      console.log('\n🗜️  Step 2: Compressing responses for context...');
      const compressionResult = await compressResponsesForPrompt(
        externalResponses,
        {
          charLimit,
          perAgentLimit,
          question,
        }
      );
      compressionMetadata = compressionResult.metadata;
      console.log(`✅ Compression complete (mode: ${compressionMetadata.mode}, chars: ${compressionMetadata.totalChars})`);
      
      // Step 3: Build prompts using Zero Compare prompt (from Admin Dashboard or custom)
      console.log('\n📝 Step 3: Building prompts...');
      
      // Determine which prompt to use
      const useCustom = customSystemPrompt && customSystemPrompt.trim();
      let promptResult;
      
      if (useCustom) {
        console.log(`   📝 Using custom prompt from Message Builder`);
        // Replace placeholders in the custom prompt
        let customPromptWithData = customSystemPrompt
          .replace(/\{EXTERNAL_AI_RESPONSES\}/g, compressionResult.compressed)
          .replace(/\{question\}/g, question);
        
        promptResult = {
          systemPrompt: 'Du är Zero, en objektiv AI-granskare. Följ instruktionerna exakt.',
          userPrompt: customPromptWithData,
          character: { name: 'Zero Compare', id: 'zero_compare' },
        };
      } else {
        console.log(`   📝 Using Zero Compare prompt from Admin Dashboard`);
        promptResult = buildComparePrompt(
          null, // No character YAML in compare mode
          question,
          compressionResult.compressed,
          null // Firebase context - skip for now
        );
      }
      
      character = promptResult.character;
      console.log(`✅ Prompt built (placeholders replaced)`);
      
      // Step 4: Call OpenSeek with the complete prompt
      // userPrompt contains the full prompt with AI responses and analysis instructions
      // systemPrompt is a simple instruction to follow the format
      console.log('\n🤖 Step 4: Calling OpenSeek-7B-Zero...');
      
      openSeekResult = await getOpenSeekResponse(promptResult.userPrompt, {
        profileId,
        systemPrompt: promptResult.systemPrompt,
        max_tokens: 4096, // High limit for complete compare analysis with "Min slutsats"
      });
      
      if (openSeekResult.error && !openSeekResult.response) {
        console.error('❌ OpenSeek failed:', openSeekResult.error);
        return res.status(500).json({
          error: 'OpenSeek inference failed',
          message: openSeekResult.error,
        });
      }
    }
    
    console.log('✅ OpenSeek response received');
    
    // Step 5: Optional analysis pipeline on Zero's response
    let pipelineAnalysis = null;
    if (runPipeline && openSeekResult.response) {
      console.log('\n🔬 Step 5: Running analysis pipeline...');
      try {
        pipelineAnalysis = await executeAnalysisPipeline(
          openSeekResult.response,
          question,
          { includeEnhancedNLP: false }
        );
        console.log('✅ Pipeline analysis complete');
      } catch (pipelineError) {
        console.warn('⚠️  Pipeline analysis failed:', pipelineError.message);
      }
    }
    
    // Optional Firebase persistence
    const firebaseAvailable = await isFirebaseAvailable();
    if (firebaseAvailable && firebaseDocId) {
      try {
        console.log('\n💾 Saving to Firebase...');
        await saveRawResponses(firebaseDocId, externalResponses);
        await updateQuestionStatus(firebaseDocId, {
          status: 'completed',
          mode: 'zero-compare',
          completed_at: new Date().toISOString(),
        });
        console.log('✅ Firebase save complete');
      } catch (firebaseError) {
        console.warn('⚠️  Firebase save failed:', firebaseError.message);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Zero Compare Flow completed in ${totalTime}ms`);
    
    // Build response
    const responseData = {
      question,
      zero: {
        response: openSeekResult.response,
        model: openSeekResult.model,
        delta_plus: openSeekResult.delta_plus,
        personality: openSeekResult.personality,
        mode: openSeekResult.mode || 'standard',
      },
      externalResponses: externalResponses.map(r => ({
        agent: r.agent,
        response: r.response.substring(0, 500) + (r.response.length > 500 ? '...' : ''),
        model: r.model,
      })),
      compression: compressionMetadata,
      character: {
        id: character.id,
        name: character.name,
      },
      pipelineAnalysis,
      firebaseDocId: firebaseDocId || null,
      timestamp: new Date().toISOString(),
      processingTimeMs: totalTime,
      analysisMode: chunked ? 'chunked' : 'standard',
    };
    
    // Include individual analyses if chunked mode was used
    if (chunked && openSeekResult.analyses) {
      responseData.chunkedAnalyses = openSeekResult.analyses;
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Zero Compare Flow error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/query
 * Dispatches a question to multiple AI models and returns their responses
 * 
 * Special mode: When preferredModel === 'openseek-7b-zero' or compare === true,
 * uses the Zero compare flow:
 * 1. Collect responses from external AI models in parallel
 * 2. Compress responses using embeddings or heuristic method
 * 3. Build prompt with character card and compressed context
 * 4. Call OpenSeek with the synthesized context
 * 5. Optionally run analysis pipeline on Zero's response
 */
router.post('/query', async (req, res) => {
  try {
    const { question, preferredModel, compare, profileId, characterCard } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string' 
      });
    }
    // Maximum length validation (e.g., 5000 characters)
    if (question.length > 5000) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is too long. Maximum allowed length is 5000 characters.'
      });
    }

    // Check if this is a Zero compare flow request
    const isZeroCompare = preferredModel === 'openseek-7b-zero' || compare === true;
    
    if (isZeroCompare) {
      return handleZeroCompareFlow(req, res);
    }

    console.log(`📝 Processing question: ${question.length > 50 ? question.substring(0, 50) + '...' : question}`);

    // Log audit event
    logAuditEvent(AuditEventType.QUESTION_ASKED, {
      question: question.substring(0, 100),
      questionLength: question.length,
    });

    // Call all AI services in parallel
    const serviceStartTime = Date.now();
    const [gptResponse, geminiResponse, deepseekResponse, grokResponse] = await Promise.allSettled([
      getOpenAIResponse(question),
      getGeminiResponse(question),
      getDeepSeekResponse(question),
      getGrokResponse(question),
    ]);

    // Helper function to compute enhanced metadata for each response
    const computeEnhancedMetadata = (responseText, modelName, serviceTime, serviceName) => {
      const tokens = responseText.split(/\s+/).length;
      const characters = responseText.length;
      
      // Simple confidence score based on response characteristics
      const confidenceScore = Math.min(1.0, (tokens / 100) * 0.5 + (responseText.match(/\./g)?.length || 0) / 20);
      
      // Language detection (simple check for Swedish vs English)
      const swedishWords = ['är', 'och', 'det', 'som', 'att', 'för', 'på', 'i', 'en', 'av'].filter(word => 
        responseText.toLowerCase().includes(word)
      ).length;
      const englishWords = ['is', 'and', 'the', 'that', 'to', 'for', 'in', 'a', 'of'].filter(word => 
        responseText.toLowerCase().includes(word)
      ).length;
      const detectedLanguage = swedishWords > englishWords ? 'sv' : 'en';
      const languageConfidence = Math.max(swedishWords, englishWords) / 10;
      
      // Map service names to API endpoints
      const endpointMap = {
        'gpt-3.5': 'https://api.openai.com/v1/chat/completions',
        'gemini': 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
        'deepseek': 'https://api.deepseek.com/v1/chat/completions',
        'grok': 'https://api.x.ai/v1/chat/completions'
      };
      
      return {
        model: modelName,
        version: modelName,
        timestamp: new Date().toISOString(),
        responseTimeMs: serviceTime,
        tokenCount: tokens,
        characterCount: characters,
        confidence: Math.min(1.0, confidenceScore),
        language: {
          detected: detectedLanguage,
          confidence: Math.min(1.0, languageConfidence),
        },
        endpoint: endpointMap[serviceName] || 'unknown',
        request_id: `req_${serviceName}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    };

    // Process responses
    const responses = [];
    const startTime = Date.now();

    if (gptResponse.status === 'fulfilled') {
      const gptStartTime = Date.now();
      const responseText = gptResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);
      const enhancedAnalysis = performCompleteEnhancedAnalysis(responseText, question, startTime);
      
      // NEW: Complete analysis pipeline
      console.log('🔬 Running complete analysis pipeline for GPT-3.5...');
      const pipelineAnalysis = await executeAnalysisPipeline(responseText, question, { includeEnhancedNLP: false });
      const gptProcessTime = Date.now() - gptStartTime;

      responses.push({
        agent: 'gpt-3.5',
        response: responseText,
        metadata: computeEnhancedMetadata(responseText, gptResponse.value.model, gptProcessTime, 'gpt-3.5'),
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
        enhancedAnalysis: enhancedAnalysis,
        pipelineAnalysis: pipelineAnalysis,
      });
    } else {
      console.error('GPT-3.5 error:', gptResponse.reason);
      responses.push({
        agent: 'gpt-3.5',
        response: 'Fel: Kunde inte hämta svar från GPT-3.5. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (geminiResponse.status === 'fulfilled') {
      const geminiStartTime = Date.now();
      const responseText = geminiResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);
      const enhancedAnalysis = performCompleteEnhancedAnalysis(responseText, question, startTime);
      
      // Complete analysis pipeline
      console.log('🔬 Running complete analysis pipeline for Gemini...');
      const pipelineAnalysis = await executeAnalysisPipeline(responseText, question, { includeEnhancedNLP: false });
      const geminiProcessTime = Date.now() - geminiStartTime;

      responses.push({
        agent: 'gemini',
        response: responseText,
        metadata: computeEnhancedMetadata(responseText, geminiResponse.value.model, geminiProcessTime, 'gemini'),
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
        enhancedAnalysis: enhancedAnalysis,
        pipelineAnalysis: pipelineAnalysis,
      });
    } else {
      console.error('Gemini error:', geminiResponse.reason);
      responses.push({
        agent: 'gemini',
        response: 'Fel: Kunde inte hämta svar från Gemini. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (deepseekResponse.status === 'fulfilled') {
      const deepseekStartTime = Date.now();
      const responseText = deepseekResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);
      const enhancedAnalysis = performCompleteEnhancedAnalysis(responseText, question, startTime);
      
      // Complete analysis pipeline
      console.log('🔬 Running complete analysis pipeline for DeepSeek...');
      const pipelineAnalysis = await executeAnalysisPipeline(responseText, question, { includeEnhancedNLP: false });
      const deepseekProcessTime = Date.now() - deepseekStartTime;

      responses.push({
        agent: 'deepseek',
        response: responseText,
        metadata: computeEnhancedMetadata(responseText, deepseekResponse.value.model, deepseekProcessTime, 'deepseek'),
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
        enhancedAnalysis: enhancedAnalysis,
        pipelineAnalysis: pipelineAnalysis,
      });
    } else {
      console.error('DeepSeek error:', deepseekResponse.reason);
      responses.push({
        agent: 'deepseek',
        response: 'Fel: Kunde inte hämta svar från DeepSeek. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (grokResponse.status === 'fulfilled') {
      const grokStartTime = Date.now();
      const responseText = grokResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);
      const enhancedAnalysis = performCompleteEnhancedAnalysis(responseText, question, startTime);
      
      // Complete analysis pipeline
      console.log('🔬 Running complete analysis pipeline for Grok...');
      const pipelineAnalysis = await executeAnalysisPipeline(responseText, question, { includeEnhancedNLP: false });
      const grokProcessTime = Date.now() - grokStartTime;

      responses.push({
        agent: 'grok',
        response: responseText,
        metadata: computeEnhancedMetadata(responseText, grokResponse.value.model, grokProcessTime, 'grok'),
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
        enhancedAnalysis: enhancedAnalysis,
        pipelineAnalysis: pipelineAnalysis,
      });
    } else {
      console.error('Grok error:', grokResponse.reason);
      responses.push({
        agent: 'grok',
        response: 'Fel: Kunde inte hämta svar från Grok. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Perform GPT-3.5 meta-review of all responses
    const gptMetaReview = await performGPTMetaReview(responses, question);

    // Perform Bing Search fact-checking on all responses
    console.log('🔍 Performing Bing Search fact-checking...');
    const factCheckResults = await batchFactCheck(responses);
    const factCheckComparison = compareFactChecks(factCheckResults);

    // Add fact-check results to each response
    responses.forEach((response, index) => {
      if (factCheckResults[index]) {
        response.bingFactCheck = factCheckResults[index];
      }
    });

    // Generate synthesized summary from all responses using BERT
    console.log('📝 Generating synthesized summary with BERT...');
    const summaryResult = await generateSynthesizedSummary(responses, question, factCheckComparison);

    // Synthesize model responses for comparative analysis
    console.log('🔬 Synthesizing multi-model analysis...');
    const modelSynthesis = synthesizeModelResponses(responses);

    // Check if consensus debate should be triggered
    const debateTrigger = shouldTriggerDebate(modelSynthesis);
    console.log('🎯 Debate trigger check:', debateTrigger ? 'YES - High divergence detected' : 'NO - Consensus acceptable');

    // NEW: Change Detection - Analyze each response for changes
    console.log('🔍 Running change detection analysis...');
    const changeDetections = await Promise.all(
      responses.map(async (response) => {
        try {
          const change = await executeChangeDetection(
            question,
            response.agent,
            response.response,
            response.metadata?.model || 'unknown'
          );
          return change;
        } catch (error) {
          console.error(`Change detection failed for ${response.agent}:`, error.message);
          return null;
        }
      })
    );

    // Find the first significant change detected
    const significantChange = changeDetections.find(c => c && c.change_metrics?.severity_index >= 0.3);
    
    if (significantChange) {
      console.log(`✅ Significant change detected for ${significantChange.model}: severity=${significantChange.change_metrics.severity_index}`);
    } else {
      console.log('ℹ️  No significant changes detected');
    }

    // NEW: Firebase Step 2 Integration - Save full pipeline results
    const firebaseDocId = req.body.firebaseDocId;
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && firebaseDocId) {
      try {
        console.log('💾 Saving pipeline results to Firebase...');
        
        // Step 1: Update status to processing
        await updateQuestionStatus(firebaseDocId, { 
          status: 'processing' 
        });
        
        // Step 2: Save raw AI responses
        await saveRawResponses(firebaseDocId, responses);
        
        // Step 3: Create ledger block for raw responses
        const responsesBlock = await createLedgerBlock({
          eventType: 'data_collection',
          data: {
            description: 'AI responses collected',
            firebase_doc_id: firebaseDocId,
            services_count: responses.length,
            services: responses.map(r => r.agent),
            provenance: responses.map(r => ({
              service: r.agent,
              model: r.metadata?.model || 'unknown',
              timestamp: r.metadata?.timestamp
            }))
          }
        });
        await addLedgerBlockReference(firebaseDocId, responsesBlock.block_id);
        
        // Step 4: Save processed pipeline data
        // Combine pipeline analysis from all responses - use first response with complete pipeline
        const firstPipeline = responses.find(r => r.pipelineAnalysis)?.pipelineAnalysis;
        
        let combinedPipelineData = null;
        
        if (!firstPipeline) {
          console.warn('⚠️  No pipeline analysis found in any response. Skipping pipeline data save.');
          console.log('Response agents:', responses.map(r => ({ agent: r.agent, hasPipeline: !!r.pipelineAnalysis })));
        } else {
          console.log(`✅ Found pipeline analysis in response from: ${responses.find(r => r.pipelineAnalysis)?.agent}`);
          
          combinedPipelineData = {
            preprocessing: firstPipeline?.preprocessing || {},
            biasAnalysis: firstPipeline?.biasAnalysis || {},
            sentenceBiasAnalysis: firstPipeline?.sentenceBiasAnalysis || {},
            sentimentAnalysis: firstPipeline?.sentimentAnalysis || {},
            ideologicalClassification: firstPipeline?.ideologicalClassification || {},
            toneAnalysis: firstPipeline?.toneAnalysis || {},
            factCheck: firstPipeline?.factCheck || {},
            enhancedNLP: firstPipeline?.enhancedNLP || {},
            explainability: firstPipeline?.explainability || null,
            topics: firstPipeline?.topics || null,
            fairnessAnalysis: firstPipeline?.fairnessAnalysis || null,
            insights: firstPipeline?.insights || {},
            summary: firstPipeline?.summary || {},
            timeline: firstPipeline?.timeline || [],
            pythonMLStats: firstPipeline?.pythonMLStats || {},
            pipelineConfig: firstPipeline?.pipelineConfig || {},
            consensus: modelSynthesis?.consensus || 0,
            metadata: {
              pipelineStartTime: new Date(Date.now() - (Date.now() - startTime)).toISOString(),
              pipelineEndTime: new Date().toISOString(),
              totalDurationMs: Date.now() - startTime
            }
          };
          
          await savePipelineData(firebaseDocId, combinedPipelineData);
        }
        
        // Step 4b: Save synthesized summary and meta review
        console.log('💾 Saving synthesis data (BERT summary & GPT meta-review)...');
        console.log(`   - Summary length: ${summaryResult.text?.length || 0} chars`);
        console.log(`   - Used BERT: ${summaryResult.usedBERT}`);
        console.log(`   - Meta review keys: ${gptMetaReview ? Object.keys(gptMetaReview).join(', ') : 'none'}`);
        
        await saveSynthesisData(firebaseDocId, {
          synthesizedSummary: summaryResult.text,
          synthesizedSummaryMetadata: {
            usedBERT: summaryResult.usedBERT
          },
          metaReview: gptMetaReview
        });
        
        // Step 5: Create ledger block for pipeline completion
        const pipelineBlock = await createLedgerBlock({
          eventType: 'data_collection',
          data: {
            description: 'ML pipeline analysis completed',
            firebase_doc_id: firebaseDocId,
            pipeline_version: process.env.PIPELINE_VERSION || '1.0.0',
            processing_time_ms: Date.now() - startTime,
            quality_metrics: {
              consensus: modelSynthesis?.consensus || 0,
              confidence: combinedPipelineData?.aggregatedInsights?.overallConfidence || 0
            }
          }
        });
        await addLedgerBlockReference(firebaseDocId, pipelineBlock.block_id);
        
        // Step 6: Update status to completed
        await updateQuestionStatus(firebaseDocId, { 
          status: 'completed',
          completed_at: new Date().toISOString(),
          analysis: {
            modelSynthesis,
            factCheckComparison,
            changeDetection: significantChange
          }
        });
        
        // Step 7: Create final ledger block and mark as verified
        const verifiedBlock = await createLedgerBlock({
          eventType: 'data_collection',
          data: {
            description: 'Analysis complete and verified',
            firebase_doc_id: firebaseDocId,
            verified: true,
            final_status: 'completed'
          }
        });
        await addLedgerBlockReference(firebaseDocId, verifiedBlock.block_id);
        
        await updateQuestionStatus(firebaseDocId, { 
          status: 'ledger_verified',
          verified_at: new Date().toISOString()
        });
        
        console.log('✅ Firebase integration complete - all data saved and verified');
      } catch (firebaseError) {
        console.error('❌ Firebase integration error:', firebaseError);
        // Log error to Firebase but don't fail the request
        try {
          await logQuestionError(firebaseDocId, firebaseError);
        } catch (logError) {
          console.error('Failed to log error to Firebase:', logError);
        }
      }
    } else if (firebaseDocId) {
      console.warn('⚠️  Firebase not available - skipping data persistence');
    }

    res.json({
      question,
      responses,
      synthesizedSummary: summaryResult.text,
      synthesizedSummaryMetadata: {
        usedBERT: summaryResult.usedBERT
      },
      metaReview: gptMetaReview,
      factCheckComparison: factCheckComparison,
      modelSynthesis: modelSynthesis,
      debateTrigger: debateTrigger,
      change_detection: significantChange || null,  // NEW: Include change detection
      firebaseDocId: firebaseDocId || null, // Return the doc ID for reference
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in query dispatcher:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
