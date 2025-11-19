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

const router = express.Router();

/**
 * POST /api/query
 * Dispatches a question to multiple AI models and returns their responses
 */
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;

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
    const computeEnhancedMetadata = (responseText, modelName, serviceTime) => {
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
        metadata: computeEnhancedMetadata(responseText, gptResponse.value.model, gptProcessTime),
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
        metadata: computeEnhancedMetadata(responseText, geminiResponse.value.model, geminiProcessTime),
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
        metadata: computeEnhancedMetadata(responseText, deepseekResponse.value.model, deepseekProcessTime),
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
        metadata: computeEnhancedMetadata(responseText, grokResponse.value.model, grokProcessTime),
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
