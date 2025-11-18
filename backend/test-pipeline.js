#!/usr/bin/env node
/**
 * Standalone Pipeline Tester
 * 
 * This script allows testing the analysis pipeline without making external API calls.
 * Simply paste in text and see the full pipeline execution.
 * 
 * Usage:
 *   node test-pipeline.js
 *   
 * Then paste your text when prompted, or pass as argument:
 *   node test-pipeline.js "Your text to analyze here"
 */

import readline from 'readline';
import { executeAnalysisPipeline } from './services/analysisPipeline.js';

const testText = process.argv.slice(2).join(' ');

async function runPipelineTest(text) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              CIVICAI PIPELINE TESTER v1.0.0                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 Input Text:');
  console.log('━'.repeat(60));
  console.log(text);
  console.log('━'.repeat(60));
  console.log(`\n📊 Text length: ${text.length} characters`);
  console.log(`📊 Word count: ${text.split(/\s+/).length} words\n`);
  
  try {
    const result = await executeAnalysisPipeline(text, 'Test Question');
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ANALYSIS RESULTS                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    // Display key results
    if (result.language) {
      console.log(`🌍 Language: ${result.language.language || 'N/A'} (confidence: ${result.language.confidence || 'N/A'})`);
    }
    
    if (result.sentiment) {
      console.log(`😊 Sentiment: ${result.sentiment.overall || 'N/A'} (score: ${result.sentiment.score || 'N/A'})`);
    }
    
    if (result.toxicity) {
      console.log(`⚠️  Toxicity: ${(result.toxicity.toxicity * 100).toFixed(1)}%`);
      console.log(`   - Severe: ${(result.toxicity.severe_toxicity * 100).toFixed(1)}%`);
      console.log(`   - Threats: ${(result.toxicity.threat * 100).toFixed(1)}%`);
      console.log(`   - Insults: ${(result.toxicity.insult * 100).toFixed(1)}%`);
    }
    
    if (result.ideology) {
      console.log(`🎯 Ideology: ${result.ideology.primary || 'N/A'} (confidence: ${result.ideology.confidence || 'N/A'})`);
    }
    
    if (result.bias) {
      console.log(`⚖️  Bias Score: ${result.bias.biasScore || 'N/A'}`);
    }
    
    if (result.tone) {
      console.log(`🎵 Tone: ${result.tone.primary || 'N/A'}`);
    }
    
    if (result.facts) {
      console.log(`✅ Fact Check Score: ${result.facts.factScore || 'N/A'}%`);
    }
    
    // Display topics if available
    if (result.topics && result.topics.length > 0) {
      console.log(`📚 Topics: ${result.topics.join(', ')}`);
    }
    
    // Display explainability if available
    if (result.explainability) {
      if (result.explainability.shap) {
        console.log(`🔍 SHAP Analysis: Available`);
      }
      if (result.explainability.lime) {
        console.log(`🔬 LIME Analysis: Available`);
      }
    }
    
    // Display fairness metrics if available
    if (result.fairness) {
      console.log(`⚖️  Fairness Analysis: Available`);
    }
    
    console.log('\n📊 Timeline Summary:');
    console.log('━'.repeat(60));
    if (result.timeline && result.timeline.length > 0) {
      result.timeline.forEach((step, idx) => {
        const stepNum = `${idx + 1}`.padStart(2, ' ');
        const duration = `${step.durationMs}ms`.padStart(8, ' ');
        const model = (step.model || 'Unknown').substring(0, 30);
        console.log(`  ${stepNum}. ${step.step.padEnd(30, ' ')} ${duration}  [${model}]`);
      });
      
      const totalDuration = result.timeline.reduce((sum, s) => sum + s.durationMs, 0);
      console.log('━'.repeat(60));
      console.log(`  Total Pipeline Duration: ${totalDuration}ms`);
    }
    
    // Display provenance
    if (result.provenance) {
      console.log('\n📋 Provenance:');
      console.log(`   Pipeline Version: ${result.provenance.pipelineVersion || 'N/A'}`);
      console.log(`   Timestamp: ${result.provenance.timestamp || 'N/A'}`);
      if (result.provenance.pythonServiceAvailable !== undefined) {
        console.log(`   Python Service: ${result.provenance.pythonServiceAvailable ? '✅ Available' : '❌ Not Available'}`);
      }
    }
    
    console.log('\n✅ Pipeline test completed successfully!\n');
    
    // Optionally save full result to file
    const fs = await import('fs/promises');
    const resultFile = `/tmp/pipeline-test-${Date.now()}.json`;
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
    console.log(`💾 Full result saved to: ${resultFile}\n`);
    
  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Main execution
if (testText) {
  // Text provided as argument
  runPipelineTest(testText).then(() => process.exit(0));
} else {
  // Interactive mode - prompt for text
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              CIVICAI PIPELINE TESTER v1.0.0                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('📝 Paste your text below (press Ctrl+D when done):\n');
  
  let inputText = '';
  
  rl.on('line', (line) => {
    inputText += line + '\n';
  });
  
  rl.on('close', () => {
    if (!inputText.trim()) {
      console.error('\n❌ No text provided. Exiting.\n');
      process.exit(1);
    }
    
    runPipelineTest(inputText.trim()).then(() => process.exit(0));
  });
}
