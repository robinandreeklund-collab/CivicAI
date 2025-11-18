// backend/services/healthCache.js
import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_NLP_SERVICE_URL || 'http://localhost:5001';
const POLL_INTERVAL_MS = Number(process.env.PYTHON_HEALTH_POLL_INTERVAL_MS || 5000);
const REQUEST_TIMEOUT = Number(process.env.PYTHON_HEALTH_REQUEST_TIMEOUT_MS || 2500);

let cache = {
  status: false,
  available_models: {},
  lastChecked: null,
  lastSuccessful: null,
  error: null,
};

async function pollOnce() {
  try {
    const resp = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: REQUEST_TIMEOUT });
    cache = {
      status: resp.data?.status === 'ok',
      available_models: resp.data?.available_models || {},
      lastChecked: new Date().toISOString(),
      lastSuccessful: new Date().toISOString(),
      error: null,
    };
  } catch (err) {
    cache.lastChecked = new Date().toISOString();
    cache.status = false;
    cache.error = err.message || String(err);
  }
}

let intervalHandle = null;

export function startHealthPoll() {
  if (intervalHandle) return;
  // Run immediate poll
  pollOnce().catch(() => {});
  intervalHandle = setInterval(() => {
    pollOnce().catch(() => {});
  }, POLL_INTERVAL_MS);
}

export function stopHealthPoll() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export function getCachedPythonStatus() {
  return cache;
}

// auto-start when imported
startHealthPoll();

export default {
  startHealthPoll,
  stopHealthPoll,
  getCachedPythonStatus,
};
