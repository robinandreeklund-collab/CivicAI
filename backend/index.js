import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import queryDispatcher from './api/query_dispatcher.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', queryDispatcher);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CivicAI Backend is running' });
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
  console.log(`🚀 CivicAI Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('[DEBUG] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('[DEBUG] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured');
});
