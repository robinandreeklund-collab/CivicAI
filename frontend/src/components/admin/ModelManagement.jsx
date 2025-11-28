import { useState, useEffect } from 'react';

/**
 * Model Management Component
 * 
 * Features:
 * - List all model versions with merge manifests
 * - View model metadata and metrics
 * - View merge traceability and version table
 * - Download model weights and LoRA adapters
 * - GGUF export management
 * - Compare versions side-by-side
 * - Rollback to previous versions
 */
export default function ModelManagement() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [currentModelId, setCurrentModelId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'manifests', 'gguf'
  const [manifests, setManifests] = useState([]);
  const [ggufExports, setGgufExports] = useState([]);
  const [selectedManifest, setSelectedManifest] = useState(null);
  
  // Merge state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [mergeBaseModel, setMergeBaseModel] = useState('');
  const [mergeOutputName, setMergeOutputName] = useState('');
  const [mergeVersion, setMergeVersion] = useState('1.0');
  const [merging, setMerging] = useState(false);
  
  // GGUF Export state
  const [showGgufDialog, setShowGgufDialog] = useState(false);
  const [ggufModelPath, setGgufModelPath] = useState('');
  const [ggufQuantization, setGgufQuantization] = useState('Q5_K_M');
  const [ggufExportWithMerge, setGgufExportWithMerge] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Quick merge state (from model card buttons)
  const [quickMergeModel, setQuickMergeModel] = useState(null);
  const [quickMergeType, setQuickMergeType] = useState('micro'); // 'micro' or 'major'
  const [quickMerging, setQuickMerging] = useState(false);
  
  // Quick GGUF export state (from model card)
  const [quickExportModel, setQuickExportModel] = useState(null);
  const [quickExporting, setQuickExporting] = useState(false);
  
  // Active GGUF state
  const [activeGguf, setActiveGguf] = useState(null);
  const [settingActiveGguf, setSettingActiveGguf] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchCurrentModel();
    fetchManifests();
    fetchGgufExports();
    fetchActiveGguf();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentModel = async () => {
    try {
      const response = await fetch('/api/models/current');
      if (response.ok) {
        const data = await response.json();
        if (data.currentModel) {
          setCurrentModelId(data.currentModel);
        }
      }
    } catch (error) {
      console.error('Error fetching current model:', error);
    }
  };
  
  const fetchManifests = async () => {
    try {
      const response = await fetch('/api/models/merge/manifests');
      if (response.ok) {
        const data = await response.json();
        setManifests(data.manifests || []);
      }
    } catch (error) {
      console.error('Error fetching manifests:', error);
    }
  };
  
  const fetchGgufExports = async () => {
    try {
      const response = await fetch('/api/models/gguf');
      if (response.ok) {
        const data = await response.json();
        setGgufExports(data.exports || []);
      }
    } catch (error) {
      console.error('Error fetching GGUF exports:', error);
    }
  };
  
  const fetchActiveGguf = async () => {
    try {
      const response = await fetch('/api/models/gguf/active');
      if (response.ok) {
        const data = await response.json();
        setActiveGguf(data.activeGguf || null);
      }
    } catch (error) {
      console.error('Error fetching active GGUF:', error);
    }
  };
  
  // Merge status state for better UI feedback
  const [mergeStatus, setMergeStatus] = useState(null); // null, 'pending', 'success', 'error'
  
  // Quick merge from model card (Micro or Major)
  const performQuickMerge = async (model, mergeType) => {
    const currentVersion = model.version || '1.0';
    const versionParts = currentVersion.replace('OneSeek-7B-Zero.v', '').split('.');
    const major = parseInt(versionParts[0]) || 1;
    const minor = parseInt(versionParts[1]) || 0;
    
    let newVersion;
    if (mergeType === 'major') {
      newVersion = `${major + 1}.0`;
    } else {
      newVersion = `${major}.${minor + 1}`;
    }
    
    // Count adapters to show in confirmation
    const adapterCount = model.metadata?.adapters?.length || model.adaptersCount || 'multiple';
    const memoryWarning = adapterCount >= 5 
      ? '\n\n⚠️ Note: Merging 5+ adapters may require significant memory. Enhanced memory management is enabled.'
      : '';
    
    const confirmMsg = `Merge ${mergeType.toUpperCase()} Release?\n\n` +
      `Current: v${major}.${minor}\n` +
      `New: v${newVersion}\n` +
      `Adapters: ${adapterCount}\n\n` +
      `This will merge all adapters from ${model.directoryName || model.id} into a standalone model.` +
      memoryWarning;
    
    if (!confirm(confirmMsg)) return;
    
    setQuickMergeModel(model);
    setQuickMergeType(mergeType);
    setQuickMerging(true);
    setMergeStatus('pending');
    
    try {
      const response = await fetch('/api/models/merge/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.directoryName || model.id,
          mergeType: mergeType,
          newVersion: newVersion,
          baseModel: model.baseModel || 'llama-2-7b-swedish',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMergeStatus('success');
        const successMsg = `✅ Merge ${mergeType.toUpperCase()} completed!\n\n` +
          `New version: v${newVersion}\n` +
          `${data.message || ''}\n\n` +
          `Merge Hash: ${data.manifest?.mergeHash || 'N/A'}\n` +
          `Output: ${data.outputDir || 'See Models tab'}`;
        alert(successMsg);
        await fetchModels();
        await fetchManifests();
      } else {
        setMergeStatus('error');
        // Provide more detailed error messages
        let errorMsg = `❌ Merge failed: ${data.error || 'Unknown error'}`;
        
        if (data.stderr) {
          // Check for common error patterns
          if (data.stderr.includes('out of memory') || data.stderr.includes('CUDA')) {
            errorMsg += '\n\n💡 Suggestion: GPU memory issue detected.\n' +
              '• Try merging fewer adapters at once\n' +
              '• Ensure GPU has at least 16GB VRAM for 7B model merges\n' +
              '• Consider using CPU-only merge (slower but works with less memory)';
          } else if (data.stderr.includes('adapter not found') || data.stderr.includes('FileNotFound')) {
            errorMsg += '\n\n💡 Suggestion: Adapter files may be missing.\n' +
              '• Check that all adapters exist in the certified directory\n' +
              '• Verify adapter paths in metadata.json';
          } else {
            errorMsg += `\n\nDetails:\n${data.stderr.slice(0, 500)}`;
          }
        }
        
        console.error('Merge error:', errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error during quick merge:', error);
      setMergeStatus('error');
      const networkError = '❌ Merge failed: Network error or server unreachable.\n\n' +
        '💡 Suggestions:\n' +
        '• Check that the backend server is running\n' +
        '• Verify network connectivity\n' +
        '• Check backend logs for details';
      console.error('Network error:', networkError);
      alert(networkError);
    } finally {
      setQuickMerging(false);
      setQuickMergeModel(null);
      // Clear status after a delay
      setTimeout(() => setMergeStatus(null), 5000);
    }
  };
  
  // Quick GGUF export from model card
  const performQuickGgufExport = async (model, quantization = 'Q5_K_M') => {
    const dna = model.dna || model.directoryName || model.id;
    
    if (!confirm(`Export GGUF?\n\nModel: ${dna}\nQuantization: ${quantization}\n\nThis will create a GGUF file for use in Verification and Chat.`)) {
      return;
    }
    
    setQuickExportModel(model);
    setQuickExporting(true);
    
    try {
      const response = await fetch('/api/models/gguf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPath: model.directoryName || model.id,
          outputName: dna,
          quantization: quantization,
          useDnaName: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const instructions = data.instructions ? `\n\nManual steps:\n${data.instructions.join('\n')}` : '';
        alert(`✅ GGUF export initiated!\n\n${data.message || 'Export started'}${instructions}\n\nFile: ${data.ggufPath || dna}.${quantization}.gguf`);
        await fetchGgufExports();
      } else {
        alert(`❌ Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during GGUF export:', error);
      alert('❌ Export failed. Check console for details.');
    } finally {
      setQuickExporting(false);
      setQuickExportModel(null);
    }
  };
  
  // Set GGUF as active for verification and chat
  const setGgufAsActive = async (ggufName) => {
    if (!confirm(`Set as Active GGUF?\n\nFile: ${ggufName}\n\nThis GGUF will be used for Verification and OQT Dashboard Chat.`)) {
      return;
    }
    
    setSettingActiveGguf(true);
    
    try {
      const response = await fetch('/api/models/gguf/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ggufName }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Active GGUF set!\n\n${data.message || 'GGUF is now active'}`);
        setActiveGguf(ggufName);
        await fetchGgufExports();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting active GGUF:', error);
      alert('❌ Failed to set active GGUF.');
    } finally {
      setSettingActiveGguf(false);
    }
  };

  const downloadModel = async (modelId, type = 'weights') => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}/download?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `model-${modelId}-${type}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Failed to download model');
    }
  };

  const rollbackToModel = async (modelId) => {
    if (!confirm('Are you sure you want to rollback to this model version?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/models/${modelId}/rollback`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Model rollback successful!');
        await fetchModels();
      } else {
        const data = await response.json();
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rolling back model:', error);
      alert('Rollback failed');
    }
  };

  const setAsCurrentModel = async (modelId) => {
    if (!confirm('Set this model as the active model for OQT Dashboard?\n\nThis will create/update the -CURRENT symlink and ml_service will use this model on next startup.\n\nNote: The symlink points to the certified model directory in oneseek-certified.')) {
      return;
    }

    try {
      const response = await fetch('/api/models/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Model version ${modelId} set as current successfully!\n\n${data.note || 'Restart ml_service (python ml_service/server.py) to load this model.'}`);
        setCurrentModelId(modelId); // Update to actual model ID instead of directory name
        await fetchModels();
      } else {
        const data = await response.json();
        alert(`Failed to set model: ${data.error}\n\n${data.note || ''}`);
      }
    } catch (error) {
      console.error('Error setting current model:', error);
      alert('Failed to set current model');
    }
  };

  const toggleCompare = (modelId) => {
    if (selectedForCompare.includes(modelId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== modelId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, modelId]);
    }
  };

  const resetAllModels = async () => {
    const confirmText = 'Are you absolutely sure you want to reset ALL trained models?\n\n' +
      'This will:\n' +
      '✓ Delete the entire /models/oneseek-certified/ directory\n' +
      '✓ Preserve base models in /models/basemodeller/\n' +
      '✓ Remove the -CURRENT symlink\n' +
      '✓ Create an empty oneseek-certified directory\n' +
      '✓ Log this action in the ledger\n\n' +
      'You will need to train a new model from scratch.\n\n' +
      'Type "RESET" to confirm:';
    
    const userInput = prompt(confirmText);
    
    if (userInput !== 'RESET') {
      return;
    }

    setResetting(true);
    
    try {
      const response = await fetch('/api/models/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Reset successful!\n\n${data.message}\n\nLedger: ${data.ledger?.message || 'Logged'}`);
        
        // Refresh model list
        await fetchModels();
        await fetchCurrentModel();
      } else {
        const data = await response.json();
        alert(`❌ Reset failed: ${data.error}\n\n${data.details || ''}`);
      }
    } catch (error) {
      console.error('Error resetting models:', error);
      alert('❌ Failed to reset models. Check console for details.');
    } finally {
      setResetting(false);
    }
  };

  // Merge adapters into a standalone model
  const performMerge = async () => {
    if (!mergeBaseModel) {
      alert('Please select a base model');
      return;
    }
    if (selectedForMerge.length === 0) {
      alert('Please select at least one adapter to merge');
      return;
    }

    setMerging(true);
    try {
      const response = await fetch('/api/models/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseModel: mergeBaseModel,
          adapters: selectedForMerge,
          outputName: mergeOutputName || `merged-${Date.now()}`,
          version: mergeVersion,
          exportGguf: ggufExportWithMerge,
          quantization: ggufQuantization,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Merge completed!\n\n${data.message || 'Models merged successfully'}`);
        setShowMergeDialog(false);
        setSelectedForMerge([]);
        await fetchModels();
        await fetchManifests();
        if (ggufExportWithMerge) {
          await fetchGgufExports();
        }
      } else {
        alert(`❌ Merge failed: ${data.error}\n\n${data.stderr || ''}`);
      }
    } catch (error) {
      console.error('Error during merge:', error);
      alert('❌ Merge failed. Check console for details.');
    } finally {
      setMerging(false);
    }
  };

  // Export model to GGUF format
  const performGgufExport = async () => {
    if (!ggufModelPath) {
      alert('Please select a model to export');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/models/gguf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPath: ggufModelPath,
          outputName: ggufModelPath.split('/').pop(),
          quantization: ggufQuantization,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const instructions = data.instructions ? `\n\nManual steps:\n${data.instructions.join('\n')}` : '';
        alert(`✅ GGUF export initiated!\n\n${data.message || 'Export started'}${instructions}`);
        setShowGgufDialog(false);
        await fetchGgufExports();
      } else {
        alert(`❌ Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during GGUF export:', error);
      alert('❌ Export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#666] font-mono text-sm">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="border border-blue-900/30 bg-blue-900/10 p-4 rounded">
        <div className="text-blue-400 font-mono text-sm mb-2">ℹ️ Active Model System (DNA-Based Structure)</div>
        <div className="text-[#888] font-mono text-xs space-y-1">
          <div>• Click &quot;Set as Active&quot; to make a model the current OQT Dashboard model</div>
          <div>• Certified models are stored in DNA-based directories (e.g., OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1)</div>
          <div>• Active model is linked via symlink: <code className="text-[#aaa]">models/oneseek-certified/OneSeek-7B-Zero-CURRENT</code></div>
          <div>• Restart ml_service to load the active model: <code className="text-[#aaa]">python ml_service/server.py</code></div>
          <div>• OQT Dashboard will always use the active model (homepage/chat-v2 unaffected)</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border border-[#2a2a2a] bg-[#111] rounded overflow-hidden">
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeTab === 'models'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#666]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Models ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('manifests')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeTab === 'manifests'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#666]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Merge Manifests ({manifests.length})
          </button>
          <button
            onClick={() => setActiveTab('gguf')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeTab === 'gguf'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#666]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            GGUF Exports ({ggufExports.length})
          </button>
        </div>
      </div>
      
      {/* Manifests Tab */}
      {activeTab === 'manifests' && (
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Merge Manifests (100% Traceability)</h2>
          
          {manifests.length === 0 ? (
            <div className="text-[#666] font-mono text-sm text-center py-8">
              No merge manifests found. Merge adapters to create traceability records.
            </div>
          ) : (
            <div className="space-y-3">
              {manifests.map((manifest, index) => (
                <div
                  key={index}
                  className="border border-[#2a2a2a] p-4 rounded hover:border-[#444] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-[#eee] font-mono text-sm mb-2">
                        {manifest.directory}
                        {manifest.merge?.version && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-900/30 border border-green-700/50 text-green-400 rounded">
                            v{manifest.merge.version}
                          </span>
                        )}
                      </div>
                      
                      {/* Merge Hash */}
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-green-900/30 rounded">
                        <div className="text-[#666] font-mono text-xs">Merge Hash:</div>
                        <div className="text-green-400 font-mono text-xs break-all">{manifest.mergeHash}</div>
                      </div>
                      
                      {/* Adapter Info */}
                      {manifest.traceability && (
                        <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                          <div className="text-[#666] font-mono text-xs mb-1">Adapters ({manifest.traceability.totalAdapters}):</div>
                          <div className="text-[#888] font-mono text-xs">
                            {manifest.traceability.mergeOrder?.join(' → ')}
                          </div>
                        </div>
                      )}
                      
                      {/* Base Model */}
                      {manifest.baseModel && (
                        <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                          <div className="text-[#666] font-mono text-xs">Base Model:</div>
                          <div className="text-[#888] font-mono text-xs">{manifest.baseModel.name} ({manifest.baseModel.type})</div>
                        </div>
                      )}
                      
                      <div className="text-[#666] font-mono text-xs">
                        Generated: {new Date(manifest.generatedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedManifest(manifest)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* GGUF Tab */}
      {activeTab === 'gguf' && (
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#eee] font-mono text-lg">GGUF Exports</h2>
              <p className="text-[#666] font-mono text-xs mt-1">
                GGUF format models for llama.cpp inference. Export merged models with quantization (Q5_K_M, Q6_K, Q8_0).
              </p>
            </div>
            <button
              onClick={() => setShowGgufDialog(true)}
              className="px-4 py-2 border border-green-700/50 bg-green-900/20 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors"
            >
              + Export GGUF
            </button>
          </div>
          
          {ggufExports.length === 0 ? (
            <div className="text-[#666] font-mono text-sm text-center py-8">
              <div className="mb-2">No GGUF exports found.</div>
              <div className="text-xs">Click &quot;Export GGUF&quot; to convert a model, or use the Merge function with GGUF export enabled.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {ggufExports.map((gguf, index) => (
                <div
                  key={index}
                  className="border border-[#2a2a2a] p-4 rounded hover:border-[#444] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-[#eee] font-mono text-sm mb-1">
                        {gguf.name}
                        {gguf.status && (
                          <span className={`ml-2 px-2 py-0.5 text-[10px] border rounded ${
                            gguf.status === 'completed' 
                              ? 'bg-green-900/30 border-green-700/50 text-green-400'
                              : 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400'
                          }`}>
                            {gguf.status}
                          </span>
                        )}
                      </div>
                      <div className="text-[#666] font-mono text-xs space-x-4">
                        {gguf.sizeFormatted && <span>{gguf.sizeFormatted}</span>}
                        {gguf.quantization && <span>Quantization: {gguf.quantization}</span>}
                        {gguf.createdAt && <span>{new Date(gguf.createdAt).toLocaleDateString()}</span>}
                      </div>
                      {gguf.instructions && (
                        <div className="mt-2 p-2 bg-[#0a0a0a] border border-yellow-900/30 rounded">
                          <div className="text-yellow-400 font-mono text-xs mb-1">Manual steps required:</div>
                          {gguf.instructions.map((step, i) => (
                            <div key={i} className="text-[#888] font-mono text-xs">{step}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {gguf.status === 'completed' && gguf.name !== activeGguf && (
                        <button
                          onClick={() => setGgufAsActive(gguf.name)}
                          disabled={settingActiveGguf}
                          className="px-3 py-1 border border-green-700/50 bg-green-900/20 text-green-400 text-xs font-mono hover:bg-green-900/30 transition-colors disabled:opacity-50"
                        >
                          {settingActiveGguf ? '⏳...' : '✓ Set as Active'}
                        </button>
                      )}
                      {gguf.name === activeGguf && (
                        <span className="px-3 py-1 bg-green-900/30 border border-green-700/50 text-green-400 text-xs font-mono rounded">
                          ⚡ ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Active GGUF Info */}
          {activeGguf && (
            <div className="mt-4 p-3 bg-green-900/10 border border-green-700/30 rounded">
              <div className="text-green-400 font-mono text-sm mb-1">⚡ Active GGUF for Verification & Chat:</div>
              <div className="text-[#aaa] font-mono text-xs break-all">{activeGguf}</div>
            </div>
          )}
        </div>
      )}

      {/* Model List (only show in models tab) */}
      {activeTab === 'models' && (
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#eee] font-mono text-lg">Model Versions</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMergeDialog(true)}
              className="px-4 py-2 border border-blue-700/50 bg-blue-900/20 text-blue-400 font-mono text-sm hover:bg-blue-900/30 transition-colors"
            >
              🔀 Merge Adapters
            </button>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2 border border-[#2a2a2a] font-mono text-sm transition-colors ${
                compareMode
                  ? 'bg-[#1a1a1a] text-[#eee]'
                  : 'text-[#888] hover:bg-[#1a1a1a]'
              }`}
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </button>
            <button
              onClick={resetAllModels}
              disabled={resetting}
              className="px-4 py-2 border border-red-700/50 bg-red-900/20 text-red-400 font-mono text-sm hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all trained models and start fresh"
            >
              {resetting ? '⏳ Resetting...' : '⚠️ Reset All'}
            </button>
          </div>
        </div>

        {models.length === 0 ? (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            No models available
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className={`border border-[#2a2a2a] p-4 rounded transition-colors ${
                  compareMode && selectedForCompare.includes(model.id)
                    ? 'border-[#666] bg-[#1a1a1a]'
                    : 'hover:border-[#444]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {compareMode && (
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(model.id)}
                          onChange={() => toggleCompare(model.id)}
                          disabled={!selectedForCompare.includes(model.id) && selectedForCompare.length >= 2}
                          className="w-4 h-4"
                        />
                      )}
                      <div className="text-[#eee] font-mono text-sm">
                        {/* Display directory name for certified models, otherwise version */}
                        {model.directoryName || model.version || model.id}
                        {(model.isCurrent || model.id === currentModelId) && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-900/30 border border-green-700/50 text-green-400 rounded">
                            ACTIVE
                          </span>
                        )}
                        {model.isCertified && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-900/30 border border-blue-700/50 text-blue-400 rounded">
                            CERTIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DNA Fingerprint Display */}
                    {model.dna && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-green-900/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] font-mono text-xs">DNA:</span>
                          <span className="text-green-400 font-mono text-xs break-all">
                            {model.dna}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Base Model Display for Certified Models */}
                    {model.isCertified && model.baseModel && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] font-mono text-xs">Base Model:</span>
                          <span className="text-[#aaa] font-mono text-xs">
                            {model.baseModel}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Datasets Display for Certified Models */}
                    {model.isCertified && model.datasets && model.datasets.length > 0 && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] font-mono text-xs">Datasets:</span>
                          <span className="text-[#aaa] font-mono text-xs">
                            {model.datasets.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Language Display for Certified Models */}
                    {model.isCertified && model.language && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] font-mono text-xs">Language:</span>
                          <span className="text-[#aaa] font-mono text-xs">
                            {model.language === 'sv' ? 'Swedish' : model.language === 'en' ? 'English' : model.language === 'ensv' ? 'Bilingual (EN/SV)' : model.language}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Adaptive Weights Display (Legacy) */}
                    {!model.isCertified && model.weights && Object.keys(model.weights).length > 0 && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                        <div className="text-[#666] font-mono text-xs mb-1">Model Weights:</div>
                        {Object.entries(model.weights).map(([modelName, weight]) => {
                          // Normalize weight to percentage (assume 0.0-1.0 range)
                          const weightPercent = weight > 1 ? weight : weight * 100;
                          return (
                            <div key={modelName} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#888]">{modelName}</span>
                              <span className="text-[#eee]">{weightPercent.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="text-[#666] font-mono text-xs space-y-1">
                      <div>Created: {new Date(model.createdAt).toLocaleString()}</div>
                      <div>Type: {model.trainingType || 'Unknown'}</div>
                      <div>Samples: {model.samplesProcessed || 0}</div>
                      {model.training?.autoStopped && (
                        <div className="text-yellow-400">Auto-stopped ⚡</div>
                      )}
                      {model.metrics && (
                        <div className="mt-2 flex items-center space-x-4">
                          <span>Loss: {model.metrics.loss?.toFixed(4) || 'N/A'}</span>
                          <span>Accuracy: {model.metrics.accuracy ? (model.metrics.accuracy * 100).toFixed(2) : 'N/A'}%</span>
                          <span>Fairness: {model.metrics.fairness ? (model.metrics.fairness * 100).toFixed(2) : 'N/A'}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!compareMode && (
                    <div className="flex flex-col space-y-2">
                      {/* Primary Actions Row */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedModel(model)}
                          className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => downloadModel(model.id, 'weights')}
                          className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                        >
                          Download
                        </button>
                        {model.id !== currentModelId && (
                          <button
                            onClick={() => setAsCurrentModel(model.id)}
                            className="px-3 py-1 border border-green-700/50 bg-green-900/20 text-green-400 text-xs font-mono hover:bg-green-900/30 transition-colors"
                          >
                            Set as Active
                          </button>
                        )}
                      </div>
                      
                      {/* Merge & Export Actions Row (for certified models) */}
                      {model.isCertified && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-[#2a2a2a] mt-1">
                          <button
                            onClick={() => performQuickMerge(model, 'micro')}
                            disabled={quickMerging && quickMergeModel?.id === model.id}
                            className={`px-3 py-1 border text-xs font-mono transition-colors disabled:opacity-50 ${
                              mergeStatus === 'success' && quickMergeModel?.id === model.id
                                ? 'border-green-700/50 bg-green-900/20 text-green-400'
                                : mergeStatus === 'error' && quickMergeModel?.id === model.id
                                ? 'border-red-700/50 bg-red-900/20 text-red-400'
                                : 'border-blue-700/50 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                            }`}
                            title="Merge Micro: v1.0 → v1.1 (minor update)"
                          >
                            {quickMerging && quickMergeModel?.id === model.id && quickMergeType === 'micro' 
                              ? '⏳ Merging...' 
                              : mergeStatus === 'success' && quickMergeModel?.id === model.id 
                              ? '✅ Done' 
                              : '🔀 Merge Micro'}
                          </button>
                          <button
                            onClick={() => performQuickMerge(model, 'major')}
                            disabled={quickMerging && quickMergeModel?.id === model.id}
                            className={`px-3 py-1 border text-xs font-mono transition-colors disabled:opacity-50 ${
                              mergeStatus === 'success' && quickMergeModel?.id === model.id && quickMergeType === 'major'
                                ? 'border-green-700/50 bg-green-900/20 text-green-400'
                                : mergeStatus === 'error' && quickMergeModel?.id === model.id && quickMergeType === 'major'
                                ? 'border-red-700/50 bg-red-900/20 text-red-400'
                                : 'border-purple-700/50 bg-purple-900/20 text-purple-400 hover:bg-purple-900/30'
                            }`}
                            title="Merge Major: v1.x → v2.0 (major release)"
                          >
                            {quickMerging && quickMergeModel?.id === model.id && quickMergeType === 'major' 
                              ? '⏳ Merging...' 
                              : mergeStatus === 'success' && quickMergeModel?.id === model.id && quickMergeType === 'major'
                              ? '✅ Done'
                              : '🚀 Merge Major'}
                          </button>
                          {/* Only show GGUF export for merged models */}
                          {model.isMerged && (
                            <button
                              onClick={() => performQuickGgufExport(model, 'Q5_K_M')}
                              disabled={quickExporting && quickExportModel?.id === model.id}
                              className="px-3 py-1 border border-orange-700/50 bg-orange-900/20 text-orange-400 text-xs font-mono hover:bg-orange-900/30 transition-colors disabled:opacity-50"
                              title="Export GGUF (Q5_K_M quantization) - Only available for merged models"
                            >
                              {quickExporting && quickExportModel?.id === model.id ? '⏳...' : '📦 Export GGUF'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {compareMode && selectedForCompare.length === 2 && (
          <div className="mt-4 p-4 border border-[#2a2a2a] bg-[#0a0a0a] rounded">
            <h3 className="text-[#888] font-mono text-sm mb-3">Comparison</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {selectedForCompare.map((modelId) => {
                const model = models.find(m => m.id === modelId);
                return (
                  <div key={modelId} className="space-y-2">
                    <div className="text-[#eee]">{model.version}</div>
                    <div className="text-[#666]">
                      <div>Created: {new Date(model.createdAt).toLocaleDateString()}</div>
                      <div>Samples: {model.samplesProcessed || 0}</div>
                      {model.metrics && (
                        <>
                          <div>Loss: {model.metrics.loss?.toFixed(4) || 'N/A'}</div>
                          <div>Accuracy: {model.metrics.accuracy ? (model.metrics.accuracy * 100).toFixed(2) : 'N/A'}%</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}
      {/* End of Models Tab */}

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">
                Model Details: {selectedModel.version}
              </h3>
              <button
                onClick={() => setSelectedModel(null)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4 font-mono text-sm">
                <div>
                  <div className="text-[#666] text-xs mb-1">Version</div>
                  <div className="text-[#eee]">{selectedModel.version}</div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Created At</div>
                  <div className="text-[#888]">
                    {new Date(selectedModel.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Training Type</div>
                  <div className="text-[#888]">{selectedModel.trainingType || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Samples Processed</div>
                  <div className="text-[#888]">{selectedModel.samplesProcessed || 0}</div>
                </div>
                {selectedModel.metrics && (
                  <div>
                    <div className="text-[#666] text-xs mb-1">Metrics</div>
                    <pre className="text-[#888] text-xs bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded">
                      {JSON.stringify(selectedModel.metrics, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedModel.metadata && (
                  <div>
                    <div className="text-[#666] text-xs mb-1">Metadata</div>
                    <pre className="text-[#888] text-xs bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedModel.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex justify-end space-x-3">
              <button
                onClick={() => downloadModel(selectedModel.id, 'weights')}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Download Weights
              </button>
              <button
                onClick={() => downloadModel(selectedModel.id, 'lora')}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Download LoRA
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manifest Details Modal */}
      {selectedManifest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">
                Merge Manifest: {selectedManifest.directory}
              </h3>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-[#888] font-mono text-xs whitespace-pre-wrap bg-[#0a0a0a] border border-[#2a2a2a] p-4 rounded">
                {JSON.stringify(selectedManifest, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      {/* Merge Dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">🔀 Merge LoRA Adapters</h3>
              <button
                onClick={() => setShowMergeDialog(false)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Base Model Selection */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Base Model *</label>
                <input
                  type="text"
                  value={mergeBaseModel}
                  onChange={(e) => setMergeBaseModel(e.target.value)}
                  placeholder="e.g., KB-Llama-3.1-8B-Swedish"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                />
              </div>
              
              {/* Adapter Selection */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Select Adapters to Merge *</label>
                <div className="max-h-40 overflow-y-auto border border-[#2a2a2a] rounded bg-[#0a0a0a] p-2">
                  {models.filter(m => m.isCertified).length === 0 ? (
                    <div className="text-[#666] font-mono text-xs p-2">No certified models available</div>
                  ) : (
                    models.filter(m => m.isCertified).map((model) => (
                      <label key={model.id} className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedForMerge.includes(model.directoryName || model.id)}
                          onChange={(e) => {
                            const id = model.directoryName || model.id;
                            if (e.target.checked) {
                              setSelectedForMerge([...selectedForMerge, id]);
                            } else {
                              setSelectedForMerge(selectedForMerge.filter(x => x !== id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-[#888] font-mono text-xs truncate">{model.directoryName || model.id}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="text-[#666] font-mono text-xs mt-1">Selected: {selectedForMerge.length}</div>
              </div>
              
              {/* Output Name */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Output Name</label>
                <input
                  type="text"
                  value={mergeOutputName}
                  onChange={(e) => setMergeOutputName(e.target.value)}
                  placeholder="e.g., OneSeek-7B-Merged"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                />
              </div>
              
              {/* Version */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Version</label>
                <input
                  type="text"
                  value={mergeVersion}
                  onChange={(e) => setMergeVersion(e.target.value)}
                  placeholder="e.g., 1.0"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                />
              </div>
              
              {/* GGUF Export Option */}
              <div className="border border-[#2a2a2a] rounded p-4 bg-[#0a0a0a]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ggufExportWithMerge}
                    onChange={(e) => setGgufExportWithMerge(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-[#888] font-mono text-sm">Export to GGUF after merge</span>
                </label>
                {ggufExportWithMerge && (
                  <div className="mt-3">
                    <label className="block text-[#666] font-mono text-xs mb-1">Quantization</label>
                    <select
                      value={ggufQuantization}
                      onChange={(e) => setGgufQuantization(e.target.value)}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                    >
                      <option value="Q5_K_M">Q5_K_M (Medium quality, balanced)</option>
                      <option value="Q6_K">Q6_K (High quality, larger)</option>
                      <option value="Q8_0">Q8_0 (Best quality, largest)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex justify-end space-x-3">
              <button
                onClick={() => setShowMergeDialog(false)}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performMerge}
                disabled={merging || !mergeBaseModel || selectedForMerge.length === 0}
                className="px-4 py-2 border border-blue-700/50 bg-blue-900/20 text-blue-400 text-sm font-mono hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {merging ? '⏳ Merging...' : '🔀 Start Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* GGUF Export Dialog */}
      {showGgufDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">📦 Export to GGUF</h3>
              <button
                onClick={() => setShowGgufDialog(false)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Model Selection */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Select Model *</label>
                <select
                  value={ggufModelPath}
                  onChange={(e) => setGgufModelPath(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                >
                  <option value="">-- Select a model --</option>
                  {models.filter(m => m.isCertified).map((model) => (
                    <option key={model.id} value={model.directoryName || model.id}>
                      {model.directoryName || model.id}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Quantization */}
              <div>
                <label className="block text-[#888] font-mono text-sm mb-2">Quantization</label>
                <select
                  value={ggufQuantization}
                  onChange={(e) => setGgufQuantization(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
                >
                  <option value="Q5_K_M">Q5_K_M (Medium quality, balanced)</option>
                  <option value="Q6_K">Q6_K (High quality, larger)</option>
                  <option value="Q8_0">Q8_0 (Best quality, largest)</option>
                </select>
                <p className="text-[#555] font-mono text-xs mt-1">
                  Q5_K_M is recommended for most use cases
                </p>
              </div>
              
              {/* Info */}
              <div className="border border-yellow-900/30 bg-yellow-900/10 p-3 rounded">
                <div className="text-yellow-400 font-mono text-xs mb-1">ℹ️ Note:</div>
                <div className="text-[#888] font-mono text-xs">
                  GGUF export requires llama.cpp to be installed. The system will provide manual instructions if automatic conversion is not available.
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex justify-end space-x-3">
              <button
                onClick={() => setShowGgufDialog(false)}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performGgufExport}
                disabled={exporting || !ggufModelPath}
                className="px-4 py-2 border border-green-700/50 bg-green-900/20 text-green-400 text-sm font-mono hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? '⏳ Exporting...' : '📦 Export GGUF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
