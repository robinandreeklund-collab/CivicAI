import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import queryDispatcher from './api/query_dispatcher.js';
import auditRouter from './api/audit.js';
import votesRouter from './api/votes.js';
import policyQuestionsRouter from './api/policyQuestions.js';
import exportRouter from './api/export.js';
import analysisTransparencyRouter from './api/analysis_transparency.js';
import analysisPipelineRouter from './api/analysis_pipeline.js';
import debateRouter from './api/debate.js';
import changeDetectionRouter from './api/change_detection.js';
import ingestRouter from './routes/ingest.js';
import mlRouter from './api/ml.js';
import factCheckRouter from './api/factcheck.js';
import firebaseRouter from './api/firebase.js';
import usersRouter from './api/users.js';
import oqtRouter from './api/oqt.js';
import adminRouter from './api/admin.js';
import trainingMetricsRouter from './api/training_metrics.js';
import microTrainingRouter from './api/training/micro.js';
import verificationRouter from './api/verification/run.js';
import modelsRouter from './api/models/set-current.js';
import modelsResetRouter from './api/models/reset.js';
import modelsCertifiedRouter from './api/models/certified.js';
import { logPythonServiceStatus } from './services/pythonNLPClient.js';
import { getCachedPythonStatus } from './services/healthCache.js';
import { isFirebaseAvailable } from './services/firebaseService.js';
import { setupTrainingWebSocket } from './ws/training_ws.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for debate initiation with full response data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static file serving for models directory (live metrics, metadata, etc.)
app.use('/models', express.static(path.join(__dirname, '../models'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Routes
app.use('/api', queryDispatcher);
app.use('/api/audit', auditRouter);
app.use('/api/votes', votesRouter);
app.use('/api/policy-questions', policyQuestionsRouter);
app.use('/api/export', exportRouter);
app.use('/api/analysis-transparency', analysisTransparencyRouter);
app.use('/api/analysis-pipeline', analysisPipelineRouter);
app.use('/api/debate', debateRouter);
app.use('/api/change-detection', changeDetectionRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/ml', mlRouter);
app.use('/api/fact-check', factCheckRouter);
app.use('/api/firebase', firebaseRouter);
app.use('/api/users', usersRouter);
app.use('/api/oqt', oqtRouter);
app.use('/api/admin', adminRouter);
app.use('/api/training', trainingMetricsRouter);
app.use('/api/training', microTrainingRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/models', modelsRouter);
app.use('/api/models', modelsResetRouter);
app.use('/api/models/certified', modelsCertifiedRouter);

// Inference Service Proxy
// Proxies requests to the ML inference service (ml_service/server.py)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

app.post('/api/inference/infer', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/infer`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout for inference
    });
    res.json(response.data);
  } catch (error) {
    console.error('Inference proxy error:', error.message);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        detail: 'Too many inference requests. Limit: 10 requests per minute per IP.',
        retry_after: error.response.headers['retry-after'] || '60',
      });
    }
    
    // Handle service unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.status(503).json({
        error: 'ML Service Unavailable',
        detail: 'The inference service is not running. Please start ml_service/server.py',
        service_url: ML_SERVICE_URL,
      });
    }
    
    // Forward other errors
    res.status(error.response?.status || 500).json({
      error: 'Inference failed',
      detail: error.response?.data?.detail || error.message,
    });
  }
});

app.get('/api/inference/status', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`, {
      timeout: 5000,
    });
    res.json({
      status: 'available',
      service_info: response.data,
      service_url: ML_SERVICE_URL,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      error: error.message,
      service_url: ML_SERVICE_URL,
    });
  }
});


// Health check endpoint with service status
app.get('/api/health', async (req, res) => {
  try {
    // Get cached Python ML service status
    const pythonStatus = getCachedPythonStatus();
    
    res.json({ 
      status: 'ok',
      services: {
        'query': { status: 'up', description: 'AI Query Service' },
        'oqt': { 
          status: 'up', 
          description: 'OQT-1.0 Language Model Service',
          endpoints: ['/api/oqt/query', '/api/oqt/train', '/api/oqt/micro-train', '/api/oqt/status', '/api/oqt/metrics']
        },
        'python-ml': { 
          status: pythonStatus.status ? 'up' : 'down',
          description: 'Python ML Pipeline Service',
          lastChecked: pythonStatus.lastChecked,
          lastSuccessful: pythonStatus.lastSuccessful,
          available_models: pythonStatus.available_models,
          error: pythonStatus.error || null,
        },
        'ml-endpoints': { 
          status: 'up', 
          description: 'ML API Endpoints (SHAP, LIME, Toxicity, Topics, Fairness)',
          endpoints: ['/api/ml/shap', '/api/ml/lime', '/api/ml/toxicity', '/api/ml/topics', '/api/ml/fairness']
        },
        'fact-check': { 
          status: process.env.GOOGLE_FACTCHECK_API_KEY ? 'up' : 'configured',
          description: 'Fact Checking Service (Google Fact Check)',
          endpoints: ['/api/fact-check/verify', '/api/fact-check/sources'],
          configured: !!process.env.GOOGLE_FACTCHECK_API_KEY
        },
        'change-detection': { status: 'up', description: 'Change Detection Service' },
        'ledger': { status: 'up', description: 'Transparency Ledger' },
        'audit': { status: 'up', description: 'Audit Trail Service' },
        'firebase': { 
          status: isFirebaseAvailable() ? 'up' : 'not_configured',
          description: 'Firebase Firestore Integration',
          endpoints: ['/api/firebase/questions', '/api/firebase/status'],
          configured: isFirebaseAvailable()
        },
        'users': {
          status: isFirebaseAvailable() ? 'up' : 'not_configured',
          description: 'User Account Service (Anonymous & Authenticated)',
          endpoints: ['/api/users/signup', '/api/users/:userId'],
          configured: isFirebaseAvailable()
        },
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple health check endpoint (legacy)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'OneSeek.AI Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const server = app.listen(PORT, async () => {
  console.log(`🚀 OneSeek.AI Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('[DEBUG] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] XAI_API_KEY:', process.env.XAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] QWEN_API_KEY:', process.env.QWEN_API_KEY ? '✓ Configured' : '✗ Not configured');
  
  // Check Python NLP service status
  console.log('');
  await logPythonServiceStatus();
  console.log('');
  
  // Setup WebSocket for training updates
  setupTrainingWebSocket(server);
});
