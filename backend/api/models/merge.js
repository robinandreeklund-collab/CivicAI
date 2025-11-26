/**
 * Model Merge and GGUF Export API Endpoints
 * 
 * Provides endpoints for:
 * - Merging LoRA adapters into standalone OneSeek models
 * - Exporting models to GGUF format with quantization options
 * - Viewing merge manifests and version tables
 */

import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// GGUF quantization options
const QUANTIZATION_TYPES = {
  'Q5_K_M': { description: 'Medium quality, good balance of size/quality', bits: 5 },
  'Q6_K': { description: 'High quality, larger size', bits: 6 },
  'Q8_0': { description: 'Best quality, largest size', bits: 8 },
};

/**
 * POST /api/models/merge
 * Merge LoRA adapters into a standalone model
 */
router.post('/merge', async (req, res) => {
  try {
    const { baseModel, adapters, outputName, version, datasets, exportGguf, quantization } = req.body;
    
    if (!baseModel) {
      return res.status(400).json({ error: 'baseModel is required' });
    }
    
    if (!adapters || adapters.length === 0) {
      return res.status(400).json({ error: 'At least one adapter is required' });
    }
    
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const outputDir = path.join(certifiedDir, 'merged');
    
    // Build Python script arguments
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'merge_adapters.py');
    const args = [
      scriptPath,
      '--base-model', baseModel,
      '--adapters', ...adapters,
      '--output', outputDir,
      '--output-name', outputName || `merged-${Date.now()}`,
    ];
    
    if (version) {
      args.push('--version', version);
    }
    
    if (datasets && datasets.length > 0) {
      args.push('--datasets', ...datasets);
    }
    
    if (exportGguf) {
      args.push('--export-gguf');
      args.push('--quantization', quantization || 'Q5_K_M');
    }
    
    // Determine Python command
    let pythonCommand = 'python3';
    const venvPath = path.join(process.cwd(), 'python_services', 'venv');
    const venvPython = path.join(venvPath, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python3');
    
    try {
      await fs.access(venvPython);
      pythonCommand = venvPython;
    } catch {
      // Use system Python
    }
    
    // Run merge script
    const mergeProcess = spawn(pythonCommand, args, {
      cwd: path.join(process.cwd(), '..'),
    });
    
    let stdout = '';
    let stderr = '';
    
    mergeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    mergeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    mergeProcess.on('close', (code) => {
      if (code === 0) {
        res.json({
          success: true,
          message: 'Merge completed successfully',
          output: stdout,
          outputDir: outputDir,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Merge failed',
          output: stdout,
          stderr: stderr,
          exitCode: code,
        });
      }
    });
    
    mergeProcess.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: 'Failed to start merge process',
        details: error.message,
      });
    });
    
  } catch (error) {
    console.error('Error in merge endpoint:', error);
    res.status(500).json({ error: 'Merge failed', message: error.message });
  }
});

/**
 * GET /api/models/merge/manifests
 * List all merge manifests
 */
router.get('/merge/manifests', async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const manifests = [];
    
    // Scan for merge_manifest.json files
    try {
      const entries = await fs.readdir(certifiedDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const manifestPath = path.join(certifiedDir, entry.name, 'merge_manifest.json');
        try {
          const content = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(content);
          manifests.push({
            directory: entry.name,
            ...manifest,
          });
        } catch {
          // No manifest in this directory
        }
      }
    } catch {
      // Directory doesn't exist
    }
    
    // Sort by generation time (newest first)
    manifests.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    res.json({
      success: true,
      manifests,
      count: manifests.length,
    });
    
  } catch (error) {
    console.error('Error listing manifests:', error);
    res.status(500).json({ error: 'Failed to list manifests', message: error.message });
  }
});

/**
 * GET /api/models/merge/versions
 * Get version table for all merged models
 */
router.get('/merge/versions', async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const versions = [];
    
    try {
      const entries = await fs.readdir(certifiedDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'OneSeek-7B-Zero-CURRENT') continue;
        
        // Try to read metadata or merge manifest
        const metadataPath = path.join(certifiedDir, entry.name, 'metadata.json');
        const manifestPath = path.join(certifiedDir, entry.name, 'merge_manifest.json');
        
        let versionInfo = {
          name: entry.name,
          directory: entry.name,
        };
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          versionInfo = {
            ...versionInfo,
            version: metadata.version,
            dna: metadata.dna,
            baseModel: metadata.baseModel,
            language: metadata.language,
            datasets: metadata.datasets,
            createdAt: metadata.createdAt,
            trainingType: metadata.trainingType,
            isMerged: false,
          };
        } catch {
          // No metadata
        }
        
        try {
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          versionInfo = {
            ...versionInfo,
            isMerged: true,
            mergeVersion: manifest.merge?.version,
            mergeHash: manifest.mergeHash,
            adaptersCount: manifest.traceability?.totalAdapters || 0,
            adapters: manifest.traceability?.mergeOrder || [],
            mergedAt: manifest.generatedAt,
          };
        } catch {
          // No manifest
        }
        
        versions.push(versionInfo);
      }
    } catch {
      // Directory doesn't exist
    }
    
    // Sort by creation time (newest first)
    versions.sort((a, b) => {
      const dateA = new Date(a.mergedAt || a.createdAt || 0);
      const dateB = new Date(b.mergedAt || b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      versions,
      count: versions.length,
    });
    
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: 'Failed to list versions', message: error.message });
  }
});

/**
 * GET /api/models/gguf
 * List GGUF exports
 */
router.get('/gguf', async (req, res) => {
  try {
    const ggufDir = path.join(process.cwd(), '..', 'models', 'gguf');
    const exports = [];
    
    try {
      await fs.mkdir(ggufDir, { recursive: true });
      const entries = await fs.readdir(ggufDir);
      
      for (const file of entries) {
        if (file.endsWith('.gguf')) {
          const filePath = path.join(ggufDir, file);
          const stats = await fs.stat(filePath);
          
          exports.push({
            name: file,
            path: filePath,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            createdAt: stats.mtime.toISOString(),
          });
        } else if (file.endsWith('.manifest.json')) {
          // Include manifest for pending exports
          const manifestPath = path.join(ggufDir, file);
          try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);
            if (manifest.status === 'pending' || manifest.status === 'manual_required') {
              exports.push({
                name: file.replace('.manifest.json', '.gguf'),
                path: manifest.outputPath,
                status: manifest.status,
                quantization: manifest.quantization,
                instructions: manifest.instructions,
              });
            }
          } catch {
            // Ignore invalid manifests
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
    
    res.json({
      success: true,
      exports,
      count: exports.length,
      quantizationTypes: QUANTIZATION_TYPES,
    });
    
  } catch (error) {
    console.error('Error listing GGUF exports:', error);
    res.status(500).json({ error: 'Failed to list GGUF exports', message: error.message });
  }
});

/**
 * POST /api/models/gguf/export
 * Export a model to GGUF format
 */
router.post('/gguf/export', async (req, res) => {
  try {
    const { modelPath, outputName, quantization } = req.body;
    
    if (!modelPath) {
      return res.status(400).json({ error: 'modelPath is required' });
    }
    
    const validQuantization = QUANTIZATION_TYPES[quantization] ? quantization : 'Q5_K_M';
    
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const ggufDir = path.join(modelsDir, 'gguf');
    await fs.mkdir(ggufDir, { recursive: true });
    
    // Resolve model path
    const resolvedModelPath = path.isAbsolute(modelPath) 
      ? modelPath 
      : path.join(modelsDir, 'oneseek-certified', modelPath);
    
    // Build Python script arguments
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'merge_adapters.py');
    const finalOutputName = outputName || path.basename(modelPath);
    
    // For GGUF export only, we use a simpler approach
    // The merge_adapters.py script handles GGUF export
    
    res.json({
      success: true,
      message: 'GGUF export initiated',
      modelPath: resolvedModelPath,
      outputName: finalOutputName,
      quantization: validQuantization,
      note: 'Use the merge endpoint with exportGguf=true for full conversion, or install llama.cpp for manual conversion',
      instructions: [
        `1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp`,
        `2. Build: cd llama.cpp && make`,
        `3. Convert: python llama.cpp/convert.py ${resolvedModelPath} --outtype f16 --outfile ${ggufDir}/${finalOutputName}.f16.gguf`,
        `4. Quantize: ./llama.cpp/quantize ${ggufDir}/${finalOutputName}.f16.gguf ${ggufDir}/${finalOutputName}.${validQuantization}.gguf ${validQuantization}`,
      ],
    });
    
  } catch (error) {
    console.error('Error in GGUF export endpoint:', error);
    res.status(500).json({ error: 'GGUF export failed', message: error.message });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
