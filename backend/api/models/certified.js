/**
 * Certified Models API Endpoint
 * 
 * Automatically fetches OneSeek-7B-Zero certified models from /models/oneseek-certified
 * Returns them as JSON, marked as 'EGEN TRÄNAD MODELL' (Own Trained Model)
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Version parsing regex helper
const VERSION_REGEX = /\.v(\d+)\.(\d+)/;

/**
 * GET /api/models/certified
 * 
 * Fetches all certified OneSeek-7B-Zero models from the oneseek-certified directory
 * Returns models sorted by newest first, marked as certified/trained models
 */
router.get('/', async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
    const certifiedModels = [];

    try {
      // Check if certified directory exists
      await fs.access(modelsDir);
      
      // Read all entries in the certified directory
      const entries = await fs.readdir(modelsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip non-directories and special files
        if (!entry.isDirectory()) continue;
        if (entry.name === 'OneSeek-7B-Zero-CURRENT') continue; // Skip symlink
        if (entry.name.startsWith('run-')) continue; // Skip temporary directories
        
        // Only process OneSeek-7B-Zero certified models
        // Format: OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{HASH1}.{HASH2}
        if (!entry.name.startsWith('OneSeek-7B-Zero.v')) {
          continue;
        }
        
        const modelPath = path.join(modelsDir, entry.name);
        const metadataPath = path.join(modelPath, 'metadata.json');
        
        try {
          // Try to read metadata file
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Extract version number for sorting
          const versionMatch = entry.name.match(VERSION_REGEX);
          const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
          const minorVersion = versionMatch ? parseInt(versionMatch[2]) : 0;
          
          certifiedModels.push({
            name: entry.name,
            displayName: entry.name,
            path: modelPath,
            version: metadata.version || entry.name,
            dna: metadata.dna || entry.name,
            createdAt: metadata.createdAt || new Date().toISOString(),
            baseModel: metadata.baseModel || 'Unknown',
            language: metadata.language || 'unknown',
            datasets: metadata.datasets || [],
            trainingType: metadata.trainingType || 'dna-v2',
            samplesProcessed: metadata.samplesProcessed || 0,
            metrics: metadata.metrics || {},
            isCertified: true,
            isTrained: true,
            majorVersion,
            minorVersion,
          });
        } catch (err) {
          // If metadata is missing or invalid, still include the model with basic info
          console.warn(`Warning: Could not read metadata for ${entry.name}: ${err.message}`);
          
          const versionMatch = entry.name.match(VERSION_REGEX);
          const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
          const minorVersion = versionMatch ? parseInt(versionMatch[2]) : 0;
          
          certifiedModels.push({
            name: entry.name,
            displayName: entry.name,
            path: modelPath,
            version: entry.name,
            dna: entry.name,
            createdAt: new Date().toISOString(),
            isCertified: true,
            isTrained: true,
            majorVersion,
            minorVersion,
          });
        }
      }
      
      // Also scan merged models directory
      const mergedDir = path.join(modelsDir, 'merged');
      try {
        await fs.access(mergedDir);
        const mergedEntries = await fs.readdir(mergedDir, { withFileTypes: true });
        
        for (const entry of mergedEntries) {
          if (!entry.isDirectory()) continue;
          if (!entry.name.startsWith('OneSeek-7B-Zero.v')) continue;
          
          const modelPath = path.join(mergedDir, entry.name);
          
          // Extract version number for sorting
          const versionMatch = entry.name.match(VERSION_REGEX);
          const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
          const minorVersion = versionMatch ? parseInt(versionMatch[2]) : 0;
          
          // Try to read metadata or merge manifest
          let modelInfo = {
            name: entry.name,
            displayName: `${entry.name} (Merged)`,
            path: modelPath,
            version: entry.name,
            dna: entry.name,
            createdAt: new Date().toISOString(),
            baseModel: 'Unknown',
            language: 'sv',
            datasets: [],
            trainingType: 'merged',
            samplesProcessed: 0,
            metrics: {},
            isCertified: true,
            isTrained: true,
            isMerged: true,
            majorVersion,
            minorVersion,
          };
          
          // Try metadata.json first
          try {
            const metadataPath = path.join(modelPath, 'metadata.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            modelInfo.dna = metadata.dna || entry.name;
            modelInfo.version = metadata.version || entry.name;
            modelInfo.createdAt = metadata.createdAt || modelInfo.createdAt;
            modelInfo.baseModel = metadata.baseModel || modelInfo.baseModel;
            modelInfo.language = metadata.language || 'sv';
            modelInfo.datasets = metadata.datasets || [];
          } catch {
            // Try merge_manifest.json
            try {
              const manifestPath = path.join(modelPath, 'merge_manifest.json');
              const manifestContent = await fs.readFile(manifestPath, 'utf-8');
              const manifest = JSON.parse(manifestContent);
              modelInfo.dna = manifest.outputDna || manifest.sourceDna || entry.name;
              modelInfo.createdAt = manifest.mergedAt || modelInfo.createdAt;
              modelInfo.mergeType = manifest.mergeType;
              modelInfo.sourceVersion = manifest.sourceVersion;
            } catch {
              // Use defaults
            }
          }
          
          certifiedModels.push(modelInfo);
          console.log(`[Certified] Found merged model: ${entry.name}`);
        }
      } catch (err) {
        // Merged directory doesn't exist - that's OK
        console.log('Merged models directory not found:', err.message);
      }
      
      // Sort models by version (newest first)
      certifiedModels.sort((a, b) => {
        // Sort by major version first
        if (a.majorVersion !== b.majorVersion) {
          return b.majorVersion - a.majorVersion;
        }
        // Then by minor version
        if (a.minorVersion !== b.minorVersion) {
          return b.minorVersion - a.minorVersion;
        }
        // Finally by creation date
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
    } catch (err) {
      // Directory doesn't exist or is not accessible
      console.warn('Certified models directory not found or empty:', err.message);
    }

    res.json({
      success: true,
      models: certifiedModels,
      count: certifiedModels.length,
    });
    
  } catch (error) {
    console.error('Error fetching certified models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certified models',
      message: error.message,
    });
  }
});

export default router;
