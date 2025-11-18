import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
import { logPythonServiceStatus } from './services/pythonNLPClient.js';
import { getCachedPythonStatus } from './services/healthCache.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for debate initiation with full response data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Health check endpoint with service status
app.get('/api/health', async (req, res) => {
  try {
    // Get cached Python ML service status
    const pythonStatus = getCachedPythonStatus();
    
    res.json({ 
      status: 'ok',
      services: {
        'query': { status: 'up', description: 'AI Query Service' },
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
          status: process.env.TAVILY_API_KEY ? 'up' : 'configured',
          description: 'Fact Checking Service (Tavily)',
          endpoints: ['/api/fact-check/verify', '/api/fact-check/sources'],
          configured: !!process.env.TAVILY_API_KEY
        },
        'change-detection': { status: 'up', description: 'Change Detection Service' },
        'ledger': { status: 'up', description: 'Transparency Ledger' },
        'audit': { status: 'up', description: 'Audit Trail Service' },
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

app.listen(PORT, async () => {
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
});
