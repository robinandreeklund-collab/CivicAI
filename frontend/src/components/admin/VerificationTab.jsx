import { useState, useEffect } from 'react';
import AdminContainer, { 
  AdminSection, 
  AdminCard, 
  AdminButton, 
  AdminSelect, 
  AdminBadge,
  AdminMetric,
  AdminCodeBlock
} from './shared/AdminContainer';

/**
 * Model Verification Tab
 * 
 * Features:
 * - Select OneSeek model and dataset for verification
 * - Run 100 random training set instructions + 50 control questions
 * - Calculate metrics: Exact Match %, BLEU ≥0.95, Semantic Similarity ≥0.98
 * - Generate Fidelity Score (0-100%) with status badges:
 *   - CERTIFIED (≥97%)
 *   - WARNING (90-96.9%)
 *   - REJECT (<90%)
 * - Download PDF certificate
 */

// Certification thresholds
const CERTIFICATION_THRESHOLD = 97; // Minimum score for CERTIFIED status
const WARNING_THRESHOLD = 90;       // Minimum score for WARNING status

export default function VerificationTab() {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelsAndDatasets();
  }, []);

  const fetchModelsAndDatasets = async () => {
    try {
      // Fetch available models
      const modelsRes = await fetch('/api/admin/models/available');
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.models || []);
      }

      // Fetch available datasets
      const datasetsRes = await fetch('/api/admin/datasets');
      if (datasetsRes.ok) {
        const datasetsData = await datasetsRes.json();
        setDatasets(datasetsData.datasets || []);
      }
    } catch (error) {
      console.error('Error fetching models/datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    if (!selectedModel || !selectedDataset) {
      alert('Please select both a model and a dataset');
      return;
    }

    setVerifying(true);
    setResults(null);

    try {
      const response = await fetch('/api/verification/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
          datasetId: selectedDataset,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        alert(`Verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running verification:', error);
      alert('Failed to run verification');
    } finally {
      setVerifying(false);
    }
  };

  const downloadCertificate = async () => {
    if (!results) return;

    try {
      const response = await fetch('/api/verification/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          modelId: selectedModel,
          datasetId: selectedDataset,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification-certificate-${selectedModel}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download certificate');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  const getStatusBadge = (score) => {
    if (score >= CERTIFICATION_THRESHOLD) return { status: 'certified', text: 'CERTIFIED' };
    if (score >= WARNING_THRESHOLD) return { status: 'warning', text: 'WARNING' };
    return { status: 'reject', text: 'REJECT' };
  };

  const handleSetCurrentModel = async () => {
    if (!confirm('Set this model as the current certified model?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/models/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
        }),
      });

      if (response.ok) {
        alert('Model set as current successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to set model: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting current model:', error);
      alert('Failed to set current model');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        Loading verification options...
      </div>
    );
  }

  return (
    <AdminContainer
      title="Model Verification"
      description="Verify OneSeek model fidelity with training data and control questions"
    >
      {/* Configuration Section */}
      <AdminSection title="Configuration">
        <div className="admin-grid admin-grid-2">
          <div>
            <label className="admin-metric-label" style={{ marginBottom: '8px', display: 'block' }}>
              Select Model
            </label>
            <AdminSelect
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              options={models.map(m => ({ value: m.id, label: m.displayName || m.name }))}
              placeholder="Choose a model..."
              disabled={verifying}
            />
          </div>

          <div>
            <label className="admin-metric-label" style={{ marginBottom: '8px', display: 'block' }}>
              Select Dataset
            </label>
            <AdminSelect
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              options={datasets.map(d => ({ value: d.id, label: d.name }))}
              placeholder="Choose a dataset..."
              disabled={verifying}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <AdminButton
            variant="primary"
            onClick={runVerification}
            disabled={verifying || !selectedModel || !selectedDataset}
          >
            {verifying ? 'Running Verification...' : 'Run Verification'}
          </AdminButton>
        </div>

        <AdminCard style={{ marginTop: '16px' }}>
          <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.6' }}>
            <strong>Verification Process:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>100 random training set instructions</li>
              <li>50 live mix-and-match control questions</li>
              <li>Metrics: Exact Match %, BLEU ≥0.95, Semantic Similarity ≥0.98</li>
              <li>Fidelity Score: CERTIFIED (≥97%), WARNING (90-96.9%), REJECT (&lt;90%)</li>
            </ul>
          </div>
        </AdminCard>
      </AdminSection>

      {/* Results Section */}
      {results && (
        <>
          <div className="admin-divider" />
          
          <AdminSection title="Verification Results">
            {/* Overall Score */}
            <AdminCard>
              <div style={{ textAlign: 'center' }}>
                <div className="admin-metric-label" style={{ marginBottom: '8px' }}>
                  FINAL FIDELITY SCORE
                </div>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#eee', marginBottom: '12px' }}>
                  {results.finalScore.toFixed(1)}%
                </div>
                <AdminBadge status={getStatusBadge(results.finalScore).status}>
                  {getStatusBadge(results.finalScore).text}
                </AdminBadge>
              </div>
            </AdminCard>

            {/* Detailed Metrics */}
            <div className="admin-grid admin-grid-2" style={{ marginTop: '16px' }}>
              {/* Training Set Results */}
              <AdminCard title="Slumpfrågor (Random Training Set)">
                <div className="admin-grid admin-grid-3">
                  <AdminMetric
                    label="Exact Match"
                    value={results.trainingSet.exactMatch}
                    unit="%"
                  />
                  <AdminMetric
                    label="BLEU"
                    value={results.trainingSet.bleu}
                    unit="%"
                  />
                  <AdminMetric
                    label="Semantic"
                    value={results.trainingSet.semantic}
                    unit="%"
                  />
                </div>
                <div style={{ marginTop: '12px', color: '#666', fontSize: '12px' }}>
                  {results.trainingSet.total} questions tested
                </div>
              </AdminCard>

              {/* Control Questions Results */}
              <AdminCard title="Kontrollfrågor (Control Questions)">
                <div className="admin-grid admin-grid-3">
                  <AdminMetric
                    label="Exact Match"
                    value={results.controlQuestions.exactMatch}
                    unit="%"
                  />
                  <AdminMetric
                    label="BLEU"
                    value={results.controlQuestions.bleu}
                    unit="%"
                  />
                  <AdminMetric
                    label="Semantic"
                    value={results.controlQuestions.semantic}
                    unit="%"
                  />
                </div>
                <div style={{ marginTop: '12px', color: '#666', fontSize: '12px' }}>
                  {results.controlQuestions.total} questions tested
                </div>
              </AdminCard>
            </div>

            {/* Detailed Report */}
            {results.details && (
              <AdminCard title="Detailed Report" style={{ marginTop: '16px' }}>
                <AdminCodeBlock>
                  {JSON.stringify(results.details, null, 2)}
                </AdminCodeBlock>
              </AdminCard>
            )}

            {/* Actions */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <AdminButton variant="primary" onClick={downloadCertificate}>
                Download PDF Certificate
              </AdminButton>
              {results.finalScore >= CERTIFICATION_THRESHOLD && (
                <AdminButton variant="primary" onClick={handleSetCurrentModel}>
                  Set as Current Model
                </AdminButton>
              )}
            </div>
          </AdminSection>
        </>
      )}
    </AdminContainer>
  );
}
