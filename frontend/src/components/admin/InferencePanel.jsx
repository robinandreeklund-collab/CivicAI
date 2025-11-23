import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './shared/AdminStyles.css';

/**
 * InferencePanel - Admin dashboard component for testing inference
 * 
 * Features:
 * - Test inference requests to the ML service
 * - Display results and errors
 * - Show model information and status
 * - Rate limit awareness (10 req/min)
 */
const InferencePanel = () => {
  const [inputText, setInputText] = useState('');
  const [maxLength, setMaxLength] = useState(512);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Check service status on mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/inference/status`);
      setServiceStatus(response.data);
    } catch (err) {
      setServiceStatus({
        status: 'unavailable',
        error: err.message,
      });
    }
  };

  const handleInference = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) {
      setError('Please enter some text for inference');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE}/api/inference/infer`, {
        text: inputText,
        max_length: maxLength,
        temperature: temperature,
        top_p: topP,
      });

      const clientLatency = Date.now() - startTime;
      
      setResult({
        ...response.data,
        client_latency_ms: clientLatency,
      });
      
      // Track request count for rate limit awareness
      setRequestCount(prev => prev + 1);
      setLastRequestTime(new Date());
      
    } catch (err) {
      console.error('Inference error:', err);
      
      if (err.response?.status === 429) {
        setError({
          type: 'rate_limit',
          message: 'Rate limit exceeded (10 requests/minute)',
          detail: err.response.data?.detail || 'Please wait before making more requests',
          retry_after: err.response.data?.retry_after || 60,
        });
      } else if (err.response?.status === 410) {
        setError({
          type: 'deprecated',
          message: 'Endpoint deprecated',
          detail: err.response.data?.detail || 'This endpoint is no longer supported',
          migration_guide: err.response.data?.migration_guide,
        });
      } else if (err.response?.status === 503) {
        setError({
          type: 'service_unavailable',
          message: 'ML Service Unavailable',
          detail: err.response.data?.detail || 'The inference service is not running',
        });
      } else {
        setError({
          type: 'error',
          message: 'Inference failed',
          detail: err.response?.data?.detail || err.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInputText('');
    setMaxLength(512);
    setTemperature(0.7);
    setTopP(0.9);
    setResult(null);
    setError(null);
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>🤖 Inference Testing Panel</h2>
        <p className="panel-description">
          Test DNA v2 certified model inference with rate limiting (10 req/min)
        </p>
      </div>

      {/* Service Status */}
      <div className="status-card">
        <h3>Service Status</h3>
        {serviceStatus && (
          <div className={`status-indicator ${serviceStatus.status === 'available' ? 'success' : 'error'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {serviceStatus.status === 'available' ? 'Available' : 'Unavailable'}
            </span>
            {serviceStatus.service_info && (
              <div className="service-info">
                <p><strong>Version:</strong> {serviceStatus.service_info.version}</p>
                <p><strong>Model Type:</strong> {serviceStatus.service_info.model_type}</p>
                <p><strong>Device:</strong> {serviceStatus.service_info.device_type}</p>
              </div>
            )}
          </div>
        )}
        <button onClick={checkServiceStatus} className="btn-secondary" style={{ marginTop: '10px' }}>
          Refresh Status
        </button>
      </div>

      {/* Rate Limit Info */}
      <div className="info-card">
        <h4>⏱️ Rate Limit Status</h4>
        <p>Requests this session: <strong>{requestCount}</strong></p>
        <p>Rate limit: <strong>10 requests per minute per IP</strong></p>
        {lastRequestTime && (
          <p>Last request: <strong>{lastRequestTime.toLocaleTimeString()}</strong></p>
        )}
      </div>

      {/* Inference Form */}
      <form onSubmit={handleInference} className="inference-form">
        <div className="form-group">
          <label htmlFor="inputText">Input Text</label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text for inference..."
            rows={6}
            maxLength={10000}
            disabled={loading}
          />
          <small>{inputText.length} / 10000 characters</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="maxLength">Max Length</label>
            <input
              type="number"
              id="maxLength"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value))}
              min={1}
              max={2048}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature</label>
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              min={0}
              max={2}
              step={0.1}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="topP">Top P</label>
            <input
              type="number"
              id="topP"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !inputText.trim()}>
            {loading ? 'Processing...' : 'Run Inference'}
          </button>
          <button type="button" onClick={resetForm} className="btn-secondary" disabled={loading}>
            Reset
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="result-card success">
          <h3>✅ Inference Result</h3>
          <div className="result-metadata">
            <p><strong>Model:</strong> {result.model}</p>
            <p><strong>Tokens:</strong> {result.tokens}</p>
            <p><strong>Server Latency:</strong> {result.latency_ms.toFixed(2)}ms</p>
            <p><strong>Total Latency:</strong> {result.client_latency_ms.toFixed(2)}ms</p>
          </div>
          <div className="result-text">
            <h4>Response:</h4>
            <pre>{result.response}</pre>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className={`result-card ${error.type === 'rate_limit' ? 'warning' : 'error'}`}>
          <h3>
            {error.type === 'rate_limit' ? '⚠️ Rate Limit Exceeded' : '❌ Error'}
          </h3>
          <p><strong>{error.message}</strong></p>
          <p>{error.detail}</p>
          {error.retry_after && (
            <p className="retry-info">Retry after: {error.retry_after} seconds</p>
          )}
          {error.migration_guide && (
            <p className="migration-info">
              See migration guide: <code>{error.migration_guide}</code>
            </p>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="help-card">
        <h4>ℹ️ Usage Tips</h4>
        <ul>
          <li>Rate limit: 10 requests per minute per IP address</li>
          <li>DNA v2 certified models are prioritized over legacy models</li>
          <li>Fallback to base models occurs if certified model unavailable</li>
          <li>For production use, see <code>INFERENCE_ROUTING_FIX.md</code></li>
        </ul>
      </div>
    </div>
  );
};

export default InferencePanel;
