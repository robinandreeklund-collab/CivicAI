/**
 * Firebase Cloud Functions - Trigger for Question Processing
 * 
 * This file contains the Firebase Cloud Function that triggers when a new
 * question is created in the ai_interactions collection.
 * 
 * NOTE: This is a reference implementation. To deploy:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize Firebase Functions: firebase init functions
 * 3. Copy this code to functions/index.js
 * 4. Deploy: firebase deploy --only functions
 * 
 * For more info: https://firebase.google.com/docs/functions
 */

// Required dependencies (install in functions directory):
// npm install firebase-functions firebase-admin axios

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Trigger function that runs when a new question is created
 * Implements the status flow: received → processing → completed → ledger_verified
 */
exports.onQuestionCreate = functions.firestore
  .document('ai_interactions/{docId}')
  .onCreate(async (snap, context) => {
    const docId = context.params.docId;
    const data = snap.data();
    
    console.log(`[onQuestionCreate] Processing question: ${docId}`);
    console.log(`[onQuestionCreate] Question: ${data.question}`);

    try {
      // Step 1: Update status to processing
      console.log(`[onQuestionCreate] Updating status to processing`);
      await snap.ref.update({
        status: 'processing',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Step 2: Call ML pipeline endpoint
      // Replace with your actual backend URL
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      
      console.log(`[onQuestionCreate] Calling ML pipeline...`);
      const pipelineResponse = await axios.post(`${backendUrl}/api/query`, {
        question: data.question,
        services: ['gpt-3.5', 'gemini', 'deepseek']
      }, {
        timeout: 120000 // 2 minute timeout for ML processing
      });

      const analysisResult = pipelineResponse.data;
      
      // Step 3: Update document with analysis results
      console.log(`[onQuestionCreate] Pipeline completed, updating results`);
      await snap.ref.update({
        status: 'completed',
        analysis: analysisResult,
        completed_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Step 4: Update ledger (create ledger block via backend API)
      console.log(`[onQuestionCreate] Creating ledger block`);
      await axios.post(`${backendUrl}/api/firebase/questions/${docId}/status`, {
        status: 'ledger_verified',
        verified_at: new Date().toISOString()
      });

      console.log(`[onQuestionCreate] Question ${docId} processed successfully`);
      
      return {
        success: true,
        docId,
        status: 'ledger_verified'
      };

    } catch (error) {
      console.error(`[onQuestionCreate] Error processing question ${docId}:`, error);
      
      // Update status to error
      await snap.ref.update({
        status: 'error',
        error: error.message,
        error_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Re-throw to let Firebase handle retry logic
      throw error;
    }
  });
