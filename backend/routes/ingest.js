/**
 * Data Ingestion API for OQT-1.0 Pipeline
 * Collects AI interactions with complete provenance and metadata
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Data storage path
const DATA_DIR = path.join(__dirname, '../../data/oqt-interactions');

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.every(time => now - time > RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return true;
}

// Rate limiting middleware
function rateLimiter(req, res, next) {
  const identifier = req.ip || 'unknown';
  
  if (!checkRateLimit(identifier)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  next();
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

ensureDataDir();

/**
 * POST /api/ingest/interaction
 * Collect a new AI interaction
 */
router.post('/interaction', rateLimiter, async (req, res) => {
  try {
    const {
      question,
      responses,
      provenance,
      analysis
    } = req.body;

    // Validate required fields
    if (!question || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question and responses array'
      });
    }

    // Create interaction record
    const interaction = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      question,
      responses: responses.map(r => ({
        model: r.model || 'unknown',
        version: r.version || 'unknown',
        response_text: r.response_text || r.text || '',
        metadata: {
          tokens: r.metadata?.tokens || 0,
          latency_ms: r.metadata?.latency_ms || 0,
          temperature: r.metadata?.temperature || 0.7
        }
      })),
      provenance: {
        user_id: provenance?.user_id || 'anonymous',
        session_id: provenance?.session_id || uuidv4(),
        source: provenance?.source || 'chat',
        ip_hash: provenance?.ip_hash || null
      },
      analysis: {
        consensus_score: analysis?.consensus_score || null,
        bias_detected: analysis?.bias_detected || false,
        sentiment: analysis?.sentiment || null,
        topics: analysis?.topics || []
      }
    };

    // Save to file system (in production, this would be a database)
    const filename = `interaction-${interaction.id}.json`;
    const filepath = path.join(DATA_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(interaction, null, 2));

    // Log the ingestion
    console.log(`[OQT-1.0 Ingest] Collected interaction ${interaction.id}`);
    console.log(`  Question: ${question.substring(0, 50)}...`);
    console.log(`  Responses: ${responses.length} models`);
    console.log(`  Source: ${interaction.provenance.source}`);

    res.json({
      success: true,
      interaction_id: interaction.id,
      timestamp: interaction.timestamp,
      message: 'Interaction recorded successfully'
    });
  } catch (error) {
    console.error('Error ingesting interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest interaction'
    });
  }
});

/**
 * GET /api/ingest/stats
 * Get ingestion statistics
 */
router.get('/stats', rateLimiter, async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const interactionFiles = files.filter(f => f.startsWith('interaction-'));

    // Read sample of recent interactions for stats
    const recentCount = Math.min(100, interactionFiles.length);
    const recentFiles = interactionFiles.slice(-recentCount);
    
    let totalQuestions = interactionFiles.length;
    let totalResponses = 0;
    let sourceBreakdown = {};
    let modelBreakdown = {};

    for (const file of recentFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        const interaction = JSON.parse(content);
        
        totalResponses += interaction.responses.length;
        
        const source = interaction.provenance.source;
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
        
        interaction.responses.forEach(r => {
          const model = r.model;
          modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;
        });
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }
    }

    res.json({
      success: true,
      stats: {
        total_interactions: totalQuestions,
        total_responses: totalResponses,
        avg_responses_per_question: totalResponses / Math.max(1, totalQuestions),
        source_breakdown: sourceBreakdown,
        model_breakdown: modelBreakdown,
        data_directory: DATA_DIR
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

/**
 * GET /api/ingest/recent
 * Get recent interactions
 */
router.get('/recent', rateLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const files = await fs.readdir(DATA_DIR);
    const interactionFiles = files
      .filter(f => f.startsWith('interaction-'))
      .sort()
      .reverse()
      .slice(0, limit);

    const interactions = [];
    for (const file of interactionFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        const interaction = JSON.parse(content);
        
        // Return anonymized version
        interactions.push({
          id: interaction.id,
          timestamp: interaction.timestamp,
          question: interaction.question.substring(0, 100) + '...',
          response_count: interaction.responses.length,
          consensus_score: interaction.analysis.consensus_score,
          source: interaction.provenance.source
        });
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }
    }

    res.json({
      success: true,
      interactions,
      count: interactions.length
    });
  } catch (error) {
    console.error('Error getting recent interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent interactions'
    });
  }
});

export default router;
