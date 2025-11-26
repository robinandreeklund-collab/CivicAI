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
import crypto from 'crypto';

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
 * Export a model to GGUF format with DNA-based naming
 * Automatically runs the conversion using llama.cpp or transformers
 */
router.post('/gguf/export', async (req, res) => {
  try {
    const { modelPath, outputName, quantization, useDnaName } = req.body;
    
    if (!modelPath) {
      return res.status(400).json({ error: 'modelPath is required' });
    }
    
    const validQuantization = QUANTIZATION_TYPES[quantization] ? quantization : 'Q5_K_M';
    
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const ggufDir = path.join(modelsDir, 'gguf');
    await fs.mkdir(ggufDir, { recursive: true });
    
    // Resolve model path - check both regular certified and merged directories
    let resolvedModelPath = path.isAbsolute(modelPath) 
      ? modelPath 
      : path.join(modelsDir, 'oneseek-certified', modelPath);
    
    // If not found in certified, check merged directory
    try {
      await fs.access(resolvedModelPath);
    } catch {
      const mergedPath = path.join(modelsDir, 'oneseek-certified', 'merged', modelPath);
      try {
        await fs.access(mergedPath);
        resolvedModelPath = mergedPath;
      } catch {
        return res.status(404).json({ error: 'Model path not found', path: modelPath });
      }
    }
    
    // Try to read DNA from metadata for naming
    let dnaName = outputName || path.basename(modelPath);
    
    if (useDnaName) {
      try {
        const metadataPath = path.join(resolvedModelPath, 'metadata.json');
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        if (metadata.dna) {
          dnaName = metadata.dna;
        }
      } catch {
        // Try merge manifest
        try {
          const manifestPath = path.join(resolvedModelPath, 'merge_manifest.json');
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          if (manifest.sourceDna) {
            dnaName = manifest.sourceDna.replace(/\.v\d+\.\d+/, `.v${manifest.version || '1.0'}`);
          }
        } catch {
          // Use fallback name
        }
      }
    }
    
    // Final GGUF filename follows structure: DNA.quantization.gguf
    const ggufFileName = `${dnaName}.${validQuantization}.gguf`;
    const ggufPath = path.join(ggufDir, ggufFileName);
    
    // Check if GGUF already exists
    try {
      await fs.access(ggufPath);
      return res.json({
        success: true,
        message: 'GGUF file already exists',
        ggufPath: ggufPath,
        outputName: ggufFileName,
        quantization: validQuantization,
        alreadyExists: true,
      });
    } catch {
      // File doesn't exist, proceed with export
    }
    
    // Run the export script
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'export_gguf.py');
    
    // Determine Python command
    let pythonCommand = 'python3';
    if (process.platform === 'win32') {
      pythonCommand = 'python';
    }
    
    // Check for venv
    const venvPath = path.join(process.cwd(), '..', 'venv');
    const venvPython = path.join(venvPath, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python3');
    
    try {
      await fs.access(venvPython);
      pythonCommand = venvPython;
    } catch {
      // Try backend venv
      const backendVenv = path.join(process.cwd(), 'python_services', 'venv');
      const backendPython = path.join(backendVenv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python3');
      try {
        await fs.access(backendPython);
        pythonCommand = backendPython;
      } catch {
        // Use system Python
      }
    }
    
    const args = [
      scriptPath,
      '--model-path', resolvedModelPath,
      '--output', ggufPath,
      '--quantization', validQuantization,
      '--json-output',
    ];
    
    console.log(`[GGUF Export] Running: ${pythonCommand} ${args.join(' ')}`);
    
    // Send initial response that export is starting
    res.json({
      success: true,
      message: 'GGUF export started',
      status: 'running',
      modelPath: resolvedModelPath,
      ggufPath: ggufPath,
      outputName: ggufFileName,
      quantization: validQuantization,
      note: 'Export is running in background. Check GGUF Exports tab for status.',
    });
    
    // Run export in background
    const exportProcess = spawn(pythonCommand, args, {
      cwd: path.join(process.cwd(), '..'),
    });
    
    let stdout = '';
    let stderr = '';
    
    exportProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[GGUF Export]', data.toString());
    });
    
    exportProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[GGUF Export Error]', data.toString());
    });
    
    exportProcess.on('close', async (code) => {
      // Save status to manifest file
      let result = {};
      try {
        result = JSON.parse(stdout);
      } catch {
        result = {
          success: code === 0,
          error: stderr || 'Unknown error',
        };
      }
      
      const manifestData = {
        status: result.success ? 'completed' : 'failed',
        modelPath: resolvedModelPath,
        outputPath: ggufPath,
        outputName: ggufFileName,
        quantization: result.quantization || validQuantization,
        dnaName: dnaName,
        createdAt: new Date().toISOString(),
        result: result,
      };
      
      // Save manifest
      const manifestPath = path.join(ggufDir, `${dnaName}.${validQuantization}.manifest.json`);
      try {
        await fs.writeFile(manifestPath, JSON.stringify(manifestData, null, 2));
      } catch (e) {
        console.error('[GGUF Export] Could not save manifest:', e);
      }
      
      console.log(`[GGUF Export] Completed with code ${code}:`, result.success ? 'SUCCESS' : 'FAILED');
    });
    
    exportProcess.on('error', async (error) => {
      console.error('[GGUF Export] Process error:', error);
      
      // Save error to manifest
      const manifestData = {
        status: 'failed',
        modelPath: resolvedModelPath,
        outputPath: ggufPath,
        outputName: ggufFileName,
        quantization: validQuantization,
        dnaName: dnaName,
        createdAt: new Date().toISOString(),
        error: error.message,
        instructions: [
          '1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
          '2. Build: cd llama.cpp && make',
          `3. Convert: python llama.cpp/convert_hf_to_gguf.py "${resolvedModelPath}" --outtype f16 --outfile "${ggufDir}/${dnaName}.f16.gguf"`,
          `4. Quantize: ./llama.cpp/quantize "${ggufDir}/${dnaName}.f16.gguf" "${ggufPath}" ${validQuantization}`,
        ],
      };
      
      const manifestPath = path.join(ggufDir, `${dnaName}.${validQuantization}.manifest.json`);
      try {
        await fs.writeFile(manifestPath, JSON.stringify(manifestData, null, 2));
      } catch (e) {
        console.error('[GGUF Export] Could not save manifest:', e);
      }
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

// Active GGUF tracking file
const ACTIVE_GGUF_FILE = path.join(process.cwd(), '..', 'models', 'gguf', 'active.json');

/**
 * POST /api/models/merge/quick
 * Quick merge from model card (micro or major release)
 */
router.post('/merge/quick', async (req, res) => {
  try {
    const { modelId, mergeType, newVersion, baseModel } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ error: 'modelId is required' });
    }
    
    if (!mergeType || !['micro', 'major'].includes(mergeType)) {
      return res.status(400).json({ error: 'mergeType must be "micro" or "major"' });
    }
    
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const modelDir = path.join(certifiedDir, modelId);
    
    // Read model metadata to get adapter list
    const metadataPath = path.join(modelDir, 'metadata.json');
    let adapters = [];
    let dna = modelId;
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      adapters = metadata.adapters || [];
      dna = metadata.dna || modelId;
    } catch (error) {
      // If no metadata, look for adapter folders
      try {
        const entries = await fs.readdir(modelDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && (entry.name.includes('adapter') || entry.name.includes('oneseek'))) {
            adapters.push(entry.name);
          }
        }
      } catch {
        return res.status(400).json({ error: 'Cannot find adapters in model directory' });
      }
    }
    
    if (adapters.length === 0) {
      return res.status(400).json({ error: 'No adapters found in model directory' });
    }
    
    // Build new output name with version - inherit DNA structure from source
    const versionStr = newVersion || (mergeType === 'major' ? '2.0' : '1.1');
    
    // Parse DNA to extract parts and update version
    // DNA format: OneSeek-7B-Zero.v1.0.sv.dsoneseek-identity-core.79171dc2.43da4687
    let outputName;
    if (dna && dna.includes('.v') && dna.includes('.')) {
      // Extract parts from DNA: model name, language, dataset suffix, hashes
      const dnaParts = dna.split('.');
      // Find version position (vX.Y)
      const versionIdx = dnaParts.findIndex(part => part.startsWith('v') && /^\d+$/.test(part.charAt(1)));
      if (versionIdx >= 0 && dnaParts[versionIdx + 1]) {
        // Replace version in DNA
        dnaParts[versionIdx] = `v${versionStr.split('.')[0]}`;
        dnaParts[versionIdx + 1] = versionStr.split('.')[1] || '0';
        outputName = dnaParts.join('.');
      } else {
        // Try simpler replacement: OneSeek-7B-Zero.vX.Y... -> OneSeek-7B-Zero.vNEW...
        outputName = dna.replace(/\.v\d+\.\d+/, `.v${versionStr}`);
      }
    } else {
      // Fallback to simple name
      outputName = `OneSeek-7B-Zero.v${versionStr}`;
    }
    
    // Build Python script arguments
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'merge_adapters.py');
    const outputDir = path.join(certifiedDir, 'merged');
    
    const args = [
      scriptPath,
      '--base-model', baseModel || 'llama-2-7b-swedish',
      '--adapters', ...adapters.map(a => path.join(modelDir, a)),
      '--output', outputDir,
      '--output-name', outputName,
      '--version', versionStr,
    ];
    
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
    
    mergeProcess.on('close', async (code) => {
      if (code === 0) {
        // Create merge manifest
        const manifestPath = path.join(outputDir, outputName, 'merge_manifest.json');
        const manifest = {
          mergeType: mergeType,
          version: versionStr,
          sourceModel: modelId,
          sourceDna: dna,
          adapters: adapters,
          baseModel: baseModel || 'llama-2-7b-swedish',
          generatedAt: new Date().toISOString(),
          mergeHash: crypto.createHash('sha256').update(JSON.stringify({
            adapters, baseModel, versionStr, timestamp: Date.now()
          })).digest('hex').substring(0, 16),
        };
        
        try {
          await fs.mkdir(path.join(outputDir, outputName), { recursive: true });
          await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        } catch (e) {
          console.log('Could not write merge manifest:', e);
        }
        
        res.json({
          success: true,
          message: `${mergeType.toUpperCase()} merge completed successfully`,
          output: stdout,
          outputDir: path.join(outputDir, outputName),
          version: versionStr,
          manifest: manifest,
        });
      } else {
        res.status(500).json({
          success: false,
          error: `${mergeType.toUpperCase()} merge failed`,
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
    console.error('Error in quick merge endpoint:', error);
    res.status(500).json({ error: 'Quick merge failed', message: error.message });
  }
});

/**
 * GET /api/models/gguf/active
 * Get the currently active GGUF model
 */
router.get('/gguf/active', async (req, res) => {
  try {
    let activeGguf = null;
    
    try {
      const content = await fs.readFile(ACTIVE_GGUF_FILE, 'utf-8');
      const data = JSON.parse(content);
      activeGguf = data.activeGguf || null;
    } catch {
      // No active GGUF file
    }
    
    res.json({
      success: true,
      activeGguf: activeGguf,
    });
    
  } catch (error) {
    console.error('Error getting active GGUF:', error);
    res.status(500).json({ error: 'Failed to get active GGUF', message: error.message });
  }
});

/**
 * POST /api/models/gguf/set-active
 * Set a GGUF model as active for verification and chat
 */
router.post('/gguf/set-active', async (req, res) => {
  try {
    const { ggufName } = req.body;
    
    if (!ggufName) {
      return res.status(400).json({ error: 'ggufName is required' });
    }
    
    const ggufDir = path.join(process.cwd(), '..', 'models', 'gguf');
    const ggufPath = path.join(ggufDir, ggufName);
    
    // Verify GGUF file exists
    try {
      await fs.access(ggufPath);
    } catch {
      return res.status(404).json({ error: 'GGUF file not found', path: ggufPath });
    }
    
    // Save active GGUF
    const activeData = {
      activeGguf: ggufName,
      ggufPath: ggufPath,
      setAt: new Date().toISOString(),
    };
    
    await fs.mkdir(ggufDir, { recursive: true });
    await fs.writeFile(ACTIVE_GGUF_FILE, JSON.stringify(activeData, null, 2));
    
    // Also update ml_service config if it exists
    try {
      const mlConfigPath = path.join(process.cwd(), '..', 'ml_service', 'config.json');
      let mlConfig = {};
      try {
        const existingConfig = await fs.readFile(mlConfigPath, 'utf-8');
        mlConfig = JSON.parse(existingConfig);
      } catch {
        // Create new config
      }
      
      mlConfig.activeGguf = ggufName;
      mlConfig.ggufPath = ggufPath;
      mlConfig.updatedAt = new Date().toISOString();
      
      await fs.writeFile(mlConfigPath, JSON.stringify(mlConfig, null, 2));
    } catch (e) {
      console.log('Could not update ml_service config:', e);
    }
    
    res.json({
      success: true,
      message: `GGUF "${ggufName}" set as active`,
      activeGguf: ggufName,
      ggufPath: ggufPath,
      note: 'Restart ml_service (python ml_service/server.py) to load the new model',
    });
    
  } catch (error) {
    console.error('Error setting active GGUF:', error);
    res.status(500).json({ error: 'Failed to set active GGUF', message: error.message });
  }
});

export default router;
