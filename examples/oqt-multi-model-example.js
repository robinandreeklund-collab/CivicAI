#!/usr/bin/env node
/**
 * OQT Multi-Model Integration - Example Usage
 * Run: node examples/oqt-multi-model-example.js "Your question"
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

console.log('OQT-1.0 Multi-Model Example');
console.log('===========================\n');

// Example: Query the API
async function queryOQT() {
  const question = process.argv[2] || 'Vad är demokrati?';
  
  console.log(`Querying: ${question}\n`);
  
  try {
    const response = await fetch(`${API_BASE}/api/oqt/multi-model-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, includeExternal: false, enableTraining: true })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Query successful!\n');
      console.log(`Model: ${data.model} v${data.version}`);
      console.log(`Confidence: ${(data.confidence * 100).toFixed(1)}%`);
      console.log(`\nConsensus: ${(data.analysis.consensus.score * 100).toFixed(1)}% (${data.analysis.consensus.level})`);
      console.log(`Bias: ${data.analysis.bias.aggregatedScore.toFixed(2)} (${data.analysis.bias.level})`);
      console.log(`Fairness: ${(data.analysis.fairness.score * 100).toFixed(1)}% (${data.analysis.fairness.level})`);
      console.log(`\nResponse:\n${data.response.substring(0, 300)}...\n`);
    } else {
      console.error('✗ Query failed:', data.error);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

queryOQT();
