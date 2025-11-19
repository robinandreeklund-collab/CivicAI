/**
 * Firebase Cloud Functions - Enhanced Trigger for Question Processing
 * 
 * This file contains the Firebase Cloud Function that triggers when a new
 * question is created in the ai_interactions collection.
 * 
 * STEP 2 ENHANCEMENTS:
 * - Full ML pipeline integration with real-time status updates
 * - Raw AI responses saved to Firestore
 * - Processed pipeline data stored with provenance
 * - Comprehensive ledger blocks at each stage
 * - Error handling and logging
 * - Quality metrics tracking
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
 * Helper function to log status updates
 */
async function logStatus(docRef, status, message) {
  await docRef.update({
    status: status,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    'pipeline_metadata.status_log': admin.firestore.FieldValue.arrayUnion({
      status: status,
      timestamp: new Date().toISOString(),
      message: message
    })
  });
  console.log(`[Status Update] ${status}: ${message}`);
}

/**
 * Enhanced trigger function that runs when a new question is created
 * Implements the status flow: received → processing → completed → ledger_verified
 * 
 * STEP 2 FEATURES:
 * - Calls full ML pipeline with all AI services
 * - Saves raw responses with metadata
 * - Saves processed pipeline analysis
 * - Creates comprehensive ledger blocks
 * - Tracks processing times per service
 * - Stores quality metrics (confidence, consensus, severity)
 */
exports.onQuestionCreate = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for Firebase Functions)
    memory: '2GB'
  })
  .firestore
  .document('ai_interactions/{docId}')
  .onCreate(async (snap, context) => {
    const docId = context.params.docId;
    const data = snap.data();
    const docRef = snap.ref;
    
    console.log(`[onQuestionCreate] Processing question: ${docId}`);
    console.log(`[onQuestionCreate] Question: ${data.question}`);

    try {
      // Step 1: Update status to processing
      await logStatus(docRef, 'processing', 'Starting ML pipeline processing');

      // Step 2: Call ML pipeline endpoint with firebaseDocId
      // Get backend URL from Firebase config (set via: firebase functions:config:set backend.url="...")
      const backendUrl = functions.config().backend?.url || 'http://localhost:3001';
      
      console.log(`[onQuestionCreate] Calling ML pipeline with full analysis...`);
      const pipelineStartTime = Date.now();
      
      const pipelineResponse = await axios.post(`${backendUrl}/api/query`, {
        question: data.question,
        services: ['gpt-3.5', 'gemini', 'deepseek'],
        firebaseDocId: docId // Pass the doc ID so backend can save data directly
      }, {
        timeout: 300000, // 5 minute timeout for ML processing
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (pipelineResponse.status !== 200) {
        throw new Error(`Pipeline returned status ${pipelineResponse.status}: ${pipelineResponse.data?.message || 'Unknown error'}`);
      }

      const analysisResult = pipelineResponse.data;
      const pipelineEndTime = Date.now();
      const processingTimeMs = pipelineEndTime - pipelineStartTime;
      
      console.log(`[onQuestionCreate] Pipeline completed in ${processingTimeMs}ms`);
      
      // Note: The backend query_dispatcher now handles:
      // - Saving raw responses
      // - Saving pipeline data
      // - Creating ledger blocks
      // - Updating status to 'completed' and 'ledger_verified'
      
      // Just verify the final status
      const updatedDoc = await docRef.get();
      const finalStatus = updatedDoc.data().status;
      
      console.log(`[onQuestionCreate] Final status: ${finalStatus}`);
      console.log(`[onQuestionCreate] Question ${docId} processed successfully`);
      
      return {
        success: true,
        docId,
        status: finalStatus,
        processingTimeMs
      };

    } catch (error) {
      console.error(`[onQuestionCreate] Error processing question ${docId}:`, error);
      
      // Log error with detailed information
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack || '',
        code: error.code || 'UNKNOWN'
      };
      
      // Update status to error with error log
      await docRef.update({
        status: 'error',
        errors: admin.firestore.FieldValue.arrayUnion(errorLog),
        error_at: admin.firestore.FieldValue.serverTimestamp(),
        'pipeline_metadata.status_log': admin.firestore.FieldValue.arrayUnion({
          status: 'error',
          timestamp: new Date().toISOString(),
          message: `Error: ${error.message}`
        })
      });

      // Re-throw to let Firebase handle retry logic
      throw error;
    }
  });

/**
 * Real-time status monitor function (optional)
 * Logs when status changes occur for monitoring
 */
exports.onStatusUpdate = functions.firestore
  .document('ai_interactions/{docId}')
  .onUpdate((change, context) => {
    const docId = context.params.docId;
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      console.log(`[Status Change] ${docId}: ${before.status} → ${after.status}`);
      
      // Could send notifications, update analytics, etc.
      return {
        docId,
        oldStatus: before.status,
        newStatus: after.status,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  });
