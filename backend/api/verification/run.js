/**
 * Verification API - Model Fidelity Verification
 * 
 * Endpoints:
 * - POST /api/verification/run - Run model verification
 * - POST /api/verification/certificate - Generate PDF certificate
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Simple in-memory rate limiter (same pattern as other API endpoints)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 verification requests per minute (resource intensive)

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
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  next();
}

// POST /api/verification/run - Run model verification
router.post('/run', rateLimiter, async (req, res) => {
  const { modelId, datasetId } = req.body;

  if (!modelId || !datasetId) {
    return res.status(400).json({ error: 'modelId and datasetId are required' });
  }

  // Validate inputs to prevent path traversal attacks
  const safePathPattern = /^[a-zA-Z0-9_\-\.]+$/;
  if (!safePathPattern.test(modelId) || !safePathPattern.test(datasetId)) {
    return res.status(400).json({ 
      error: 'Invalid modelId or datasetId. Only alphanumeric characters, underscores, hyphens, and dots are allowed.' 
    });
  }

  // Additional check for path traversal sequences
  if (modelId.includes('..') || datasetId.includes('..') || 
      modelId.includes('/') || datasetId.includes('/') ||
      modelId.includes('\\') || datasetId.includes('\\')) {
    return res.status(400).json({ 
      error: 'Invalid modelId or datasetId. Path traversal attempts are not allowed.' 
    });
  }

  try {
    // Path to verification script
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'verify_model.py');
    const modelsDir = path.join(__dirname, '..', '..', '..', 'models');
    const datasetsDir = path.join(__dirname, '..', '..', '..', 'datasets');

    // Get Python executable from environment or default
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3';

    // Build arguments
    const args = [
      scriptPath,
      '--model', path.join(modelsDir, modelId),
      '--dataset', path.join(datasetsDir, datasetId),
      '--output', 'json',
    ];

    // Spawn Python process
    const pythonProcess = spawn(pythonExecutable, args);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Verification error:', stderr);
        return res.status(500).json({ 
          error: 'Verification failed', 
          details: stderr 
        });
      }

      try {
        // Parse JSON output from Python script
        const results = JSON.parse(stdout);
        res.json(results);
      } catch (error) {
        console.error('Error parsing verification results:', error);
        res.status(500).json({ 
          error: 'Failed to parse verification results',
          raw: stdout 
        });
      }
    });

  } catch (error) {
    console.error('Error running verification:', error);
    res.status(500).json({ error: 'Failed to run verification' });
  }
});

// POST /api/verification/certificate - Generate PDF certificate
router.post('/certificate', rateLimiter, async (req, res) => {
  const { results, modelId, datasetId } = req.body;

  if (!results) {
    return res.status(400).json({ error: 'results are required' });
  }

  try {
    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=verification-certificate-${modelId}-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    const { finalScore, trainingSet, controlQuestions } = results;
    const statusBadge = finalScore >= 97 ? 'CERTIFIED' : finalScore >= 90 ? 'WARNING' : 'REJECT';
    const statusColor = finalScore >= 97 ? '#7fb542' : finalScore >= 90 ? '#d9a830' : '#dd6666';

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('OneSeek-7B-Zero', { align: 'center' });
    doc.fontSize(18).text('Model Verification Certificate', { align: 'center' });
    doc.moveDown(2);

    // Status Badge
    doc.fontSize(14).font('Helvetica').fillColor('#666').text('Status:', { continued: false });
    doc.fontSize(20).font('Helvetica-Bold').fillColor(statusColor).text(statusBadge, { align: 'center' });
    doc.moveDown(1);

    // Final Score
    doc.fontSize(14).font('Helvetica').fillColor('#666').text('Final Fidelity Score:', { align: 'center' });
    doc.fontSize(48).font('Helvetica-Bold').fillColor('#000').text(`${finalScore.toFixed(1)}%`, { align: 'center' });
    doc.moveDown(2);

    // Model & Dataset Info
    doc.fontSize(12).fillColor('#000').font('Helvetica');
    doc.text(`Model: ${modelId}`);
    doc.text(`Dataset: ${datasetId}`);
    doc.text(`Verification Date: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    // Metrics - Training Set
    doc.fontSize(14).font('Helvetica-Bold').text('Training Set Results (Slumpfrågor)');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Questions Tested: ${trainingSet.total}`);
    doc.text(`Exact Match: ${trainingSet.exactMatch}%`);
    doc.text(`BLEU Score: ${trainingSet.bleu}%`);
    doc.text(`Semantic Similarity: ${trainingSet.semantic}%`);
    doc.moveDown(1);

    // Metrics - Control Questions
    doc.fontSize(14).font('Helvetica-Bold').text('Control Questions Results (Kontrollfrågor)');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Questions Tested: ${controlQuestions.total}`);
    doc.text(`Exact Match: ${controlQuestions.exactMatch}%`);
    doc.text(`BLEU Score: ${controlQuestions.bleu}%`);
    doc.text(`Semantic Similarity: ${controlQuestions.semantic}%`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).fillColor('#999');
    doc.text('This certificate verifies that the OneSeek-7B-Zero model has been tested', { align: 'center' });
    doc.text('against training data and control questions to ensure fidelity.', { align: 'center' });
    doc.moveDown(1);
    doc.text('Sweden\'s Unbeatable National Model', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating certificate:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate certificate' });
    }
  }
});

export default router;
