/**
 * WebSocket Handler for Real-time Training Updates
 * 
 * Provides live updates during training:
 * - Epoch start/end events
 * - Weight adjustment notifications
 * - Auto-stop triggers
 * - Training completion/error events
 */

import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs/promises';
import { watch } from 'fs';

// Store active WebSocket connections per run
const runConnections = new Map();

// Store file watchers per run
const runWatchers = new Map();

/**
 * Initialize WebSocket server
 */
export function setupTrainingWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/training'
  });
  
  wss.on('connection', (ws, req) => {
    // Extract run ID from query parameter
    const url = new URL(req.url, 'http://localhost');
    const runId = url.searchParams.get('runId');
    
    if (!runId) {
      ws.close(1008, 'Missing runId parameter');
      return;
    }
    
    console.log(`[WS] Client connected to training/${runId}`);
    
    // Add connection to run connections
    if (!runConnections.has(runId)) {
      runConnections.set(runId, new Set());
    }
    runConnections.get(runId).add(ws);
    
    // Setup file watcher for this run if not already watching
    setupRunWatcher(runId);
    
    // Send initial state
    sendInitialState(ws, runId).catch(err => {
      console.error('[WS] Error sending initial state:', err);
    });
    
    // Handle heartbeat
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        }));
      }
    }, 30000); // Every 30 seconds
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`[WS] Client disconnected from training/${runId}`);
      
      // Remove from connections
      const connections = runConnections.get(runId);
      if (connections) {
        connections.delete(ws);
        
        // Clean up if no more connections
        if (connections.size === 0) {
          runConnections.delete(runId);
          cleanupRunWatcher(runId);
        }
      }
      
      clearInterval(heartbeatInterval);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('[WS] WebSocket error:', error);
    });
  });
  
  console.log('[WS] Training WebSocket server initialized');
  
  return wss;
}

/**
 * Send initial training state to newly connected client
 */
async function sendInitialState(ws, runId) {
  try {
    const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
    const runDir = path.join(certifiedDir, runId);
    
    // Load training results (might not exist if training just started)
    const resultsPath = path.join(runDir, 'training_results.json');
    let results = null;
    
    try {
      const resultsData = await fs.readFile(resultsPath, 'utf-8');
      results = JSON.parse(resultsData);
    } catch (err) {
      // Training results don't exist yet - training just started
      console.log(`[WS] Training results not available yet for ${runId}, sending pending state`);
    }
    
    // Load live metrics if available
    let liveMetrics = null;
    const liveMetricsPath = path.join(runDir, 'live_metrics.json');
    try {
      const liveData = await fs.readFile(liveMetricsPath, 'utf-8');
      liveMetrics = JSON.parse(liveData);
    } catch (err) {
      // Live metrics not available yet
    }
    
    // Send initial state (or pending state if files don't exist yet)
    if (!results && !liveMetrics) {
      // Training just started, no files yet
      ws.send(JSON.stringify({
        type: 'initial_state',
        run_id: runId,
        status: 'starting',
        current_epoch: 0,
        total_epochs: 0,
        val_losses: {},
        weights: {},
        lr_multipliers: {},
        total_loss: null,
        auto_stop_info: null,
        progress_percent: 0,
        message: 'Training is starting, waiting for data...',
        timestamp: new Date().toISOString(),
      }));
    } else {
      // Send actual data
      ws.send(JSON.stringify({
        type: 'initial_state',
        run_id: runId,
        status: results?.status || 'running',
        current_epoch: liveMetrics?.epoch || results?.current_epoch || 0,
        total_epochs: results?.epochs || 0,
        val_losses: liveMetrics?.val_losses || {},
        weights: liveMetrics?.weights || results?.final_weights || {},
        lr_multipliers: liveMetrics?.lr_multipliers || {},
        total_loss: liveMetrics?.total_loss || null,
        auto_stop_info: liveMetrics?.auto_stop_info || null,
        progress_percent: liveMetrics?.progress_percent || 0,
        timestamp: new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error('[WS] Error loading initial state:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to load training state',
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
  }
}

/**
 * Setup file watcher for a training run
 */
function setupRunWatcher(runId) {
  // Skip if already watching
  if (runWatchers.has(runId)) {
    return;
  }
  
  const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
  const liveMetricsPath = path.join(certifiedDir, runId, 'live_metrics.json');
  
  // Check if file exists before trying to watch it
  import('fs').then(({ existsSync }) => {
    if (!existsSync(liveMetricsPath)) {
      console.log(`[WS] Metrics file doesn't exist yet for ${runId}, will poll instead`);
      // Set up a polling interval instead of a file watcher
      const pollInterval = setInterval(async () => {
        if (existsSync(liveMetricsPath)) {
          // File now exists, broadcast update and set up watcher
          await broadcastMetricsUpdate(runId, liveMetricsPath);
          clearInterval(pollInterval);
          
          // Now set up the actual file watcher
          try {
            const watcher = watch(liveMetricsPath, (eventType) => {
              if (eventType === 'change') {
                broadcastMetricsUpdate(runId, liveMetricsPath);
              }
            });
            runWatchers.set(runId, watcher);
            console.log(`[WS] Started watching ${liveMetricsPath}`);
          } catch (error) {
            console.error(`[WS] Error setting up watcher for ${runId}:`, error);
          }
        }
      }, 2000); // Poll every 2 seconds
      
      // Store the interval so we can clean it up later
      runWatchers.set(runId, { interval: pollInterval, type: 'polling' });
      return;
    }
    
    // File exists, set up watcher immediately
    try {
      const watcher = watch(liveMetricsPath, (eventType) => {
        if (eventType === 'change') {
          broadcastMetricsUpdate(runId, liveMetricsPath);
        }
      });
      
      runWatchers.set(runId, watcher);
      console.log(`[WS] Started watching ${liveMetricsPath}`);
    } catch (error) {
      console.error(`[WS] Error setting up watcher for ${runId}:`, error);
    }
  }).catch(error => {
    console.error(`[WS] Error checking file existence for ${runId}:`, error);
  });
}

/**
 * Cleanup file watcher for a training run
 */
function cleanupRunWatcher(runId) {
  const watcher = runWatchers.get(runId);
  if (watcher) {
    // Check if it's a polling interval or a file watcher
    if (watcher.type === 'polling' && watcher.interval) {
      clearInterval(watcher.interval);
    } else if (typeof watcher.close === 'function') {
      watcher.close();
    }
    runWatchers.delete(runId);
    console.log(`[WS] Stopped watching run ${runId}`);
  }
}

/**
 * Broadcast metrics update to all connected clients
 */
async function broadcastMetricsUpdate(runId, metricsPath) {
  try {
    const data = await fs.readFile(metricsPath, 'utf-8');
    const metrics = JSON.parse(data);
    
    const message = JSON.stringify({
      type: 'epoch_end',
      run_id: runId,
      epoch: metrics.epoch,
      val_losses: metrics.val_losses || {},
      weights: metrics.weights || {},
      lr_multipliers: metrics.lr_multipliers || {},
      total_loss: metrics.total_loss,
      auto_stop_info: metrics.auto_stop_info || null,
      progress_percent: metrics.progress_percent || 0,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast to all connected clients for this run
    const connections = runConnections.get(runId);
    if (connections) {
      connections.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      });
    }
  } catch (error) {
    console.error('[WS] Error broadcasting metrics update:', error);
  }
}

/**
 * Broadcast custom event to all clients of a run
 */
export function broadcastTrainingEvent(runId, eventType, eventData) {
  const message = JSON.stringify({
    type: eventType,
    run_id: runId,
    ...eventData,
    timestamp: new Date().toISOString(),
  });
  
  // Broadcast to specific run connections if runId is provided
  if (runId && runConnections.has(runId)) {
    const connections = runConnections.get(runId);
    connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  } else {
    // Broadcast to all connections (for micro-training events)
    runConnections.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      });
    });
  }
}

export default {
  setupTrainingWebSocket,
  broadcastTrainingEvent,
};
