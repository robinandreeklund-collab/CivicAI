/**
 * Manual Test Script for Topic Modeling Integration
 * 
 * This script tests the topic modeling functionality with BERTopic and Gensim.
 * Run with: node backend/test-topic-modeling-integration.js
 */

import { topicModelingWithBoth, topicModelingWithGensim, topicModelingWithBERTopic } from './services/pythonNLPClient.js';

const SAMPLE_TEXT = `
Climate change is one of the most pressing challenges facing humanity today. 
Rising global temperatures are causing unprecedented changes to our planet's ecosystems.
Renewable energy sources like solar and wind power are becoming increasingly important.
Governments around the world are implementing policies to reduce carbon emissions.
Scientists warn that we must take immediate action to prevent catastrophic consequences.
The transition to sustainable practices is essential for our future.
Environmental protection and economic development must work hand in hand.
`;

async function testTopicModeling() {
  console.log('='.repeat(60));
  console.log('Topic Modeling Integration Test');
  console.log('='.repeat(60));
  console.log();

  // Test 1: method="both"
  console.log('Test 1: Running topic modeling with method="both"');
  console.log('-'.repeat(60));
  try {
    const result = await topicModelingWithBoth(SAMPLE_TEXT);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log('Method:', result.data.method);
      console.log();
      
      if (result.data.bertopic) {
        console.log('BERTopic Results:');
        console.log('  Topics found:', result.data.bertopic.topics?.length || 0);
        if (result.data.bertopic.topics && result.data.bertopic.topics.length > 0) {
          result.data.bertopic.topics.forEach(topic => {
            console.log(`  - Topic ${topic.topic_id}: ${topic.name} (${topic.count} docs)`);
          });
        }
      } else {
        console.log('BERTopic: Not available or no topics found');
      }
      console.log();
      
      if (result.data.gensim) {
        console.log('Gensim Results:');
        console.log('  Topics found:', result.data.gensim.topics?.length || 0);
        if (result.data.gensim.topics && result.data.gensim.topics.length > 0) {
          result.data.gensim.topics.forEach(topic => {
            console.log(`  - ${topic.label}:`);
            const topTerms = topic.terms?.slice(0, 5) || [];
            const termStr = topTerms.map(t => `${t.word} (${(t.weight * 100).toFixed(1)}%)`).join(', ');
            console.log(`    ${termStr}`);
          });
        }
      } else {
        console.log('Gensim: Not available or no topics found');
      }
    } else {
      console.log('❌ Failed:', result.error);
      console.log('Fallback:', result.fallback);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log();
  console.log('='.repeat(60));
  
  // Test 2: method="gensim" only
  console.log();
  console.log('Test 2: Running topic modeling with method="gensim"');
  console.log('-'.repeat(60));
  try {
    const result = await topicModelingWithGensim(SAMPLE_TEXT);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log('Topics found:', result.data.topics?.length || result.data.num_topics || 0);
      if (result.data.topics) {
        result.data.topics.forEach(topic => {
          console.log(`  - ${topic.label}:`);
          const topTerms = topic.terms?.slice(0, 5) || [];
          const termStr = topTerms.map(t => `${t.word} (${(t.weight * 100).toFixed(1)}%)`).join(', ');
          console.log(`    ${termStr}`);
        });
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log();
  console.log('='.repeat(60));
  
  // Test 3: BERTopic with array of texts
  console.log();
  console.log('Test 3: Running BERTopic with array of texts');
  console.log('-'.repeat(60));
  const sentences = SAMPLE_TEXT.split('.').filter(s => s.trim().length > 20);
  console.log('Number of sentences:', sentences.length);
  
  try {
    const result = await topicModelingWithBERTopic(sentences);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log('Topics found:', result.data.topics?.length || 0);
      if (result.data.topics) {
        result.data.topics.forEach(topic => {
          console.log(`  - Topic ${topic.topic_id}: ${topic.name} (${topic.count} docs)`);
        });
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

// Run the test
testTopicModeling().catch(console.error);
