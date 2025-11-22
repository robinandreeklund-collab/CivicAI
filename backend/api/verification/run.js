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

// POST /api/verification/run - Run model verification
router.post('/run', async (req, res) => {
  const { modelId, datasetId } = req.body;

  if (!modelId || !datasetId) {
    return res.status(400).json({ error: 'modelId and datasetId are required' });
  }

  try {
    // Path to verification script
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'verify_model.py');
    const modelsDir = path.join(__dirname, '..', '..', '..', 'models');
    const datasetsDir = path.join(__dirname, '..', '..', '..', 'datasets');

    // Build arguments
    const args = [
      scriptPath,
      '--model', path.join(modelsDir, modelId),
      '--dataset', path.join(datasetsDir, datasetId),
      '--output', 'json',
    ];

    // Spawn Python process
    const pythonProcess = spawn('python3', args);

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
router.post('/certificate', async (req, res) => {
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
