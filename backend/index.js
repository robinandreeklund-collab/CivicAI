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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', queryDispatcher);
app.use('/api/audit', auditRouter);
app.use('/api/votes', votesRouter);
app.use('/api/policy-questions', policyQuestionsRouter);
app.use('/api/export', exportRouter);
app.use('/api/analysis-transparency', analysisTransparencyRouter);
app.use('/api/analysis-pipeline', analysisPipelineRouter);

// Health check endpoint
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

app.listen(PORT, () => {
  console.log(`🚀 OneSeek.AI Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('[DEBUG] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] XAI_API_KEY:', process.env.XAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] QWEN_API_KEY:', process.env.QWEN_API_KEY ? '✓ Configured' : '✗ Not configured');
});
