import { useState, useEffect } from 'react';
import LiveLeaderboard from './LiveLeaderboard';
import TrainingConsole from '../TrainingConsole';
import ModelEvolutionTree from '../ModelEvolutionTree';
import RemoteTrainingControl from '../RemoteTrainingControl';

/**
 * Training Control Component
 * 
 * Features:
 * - Select dataset(s) for training with category filtering
 * - Configure parameters: epochs, batch size, learning rate
 * - DNA v2 training mode with adaptive weights (ALWAYS ENABLED)
 * - Start/stop training sessions
 * - Monitor real-time training metrics
 * - View training logs
 */
export default function TrainingControl() {
  const [datasets, setDatasets] = useState([]);
  const [datasetCategories, setDatasetCategories] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' or specific category
  const [availableModels, setAvailableModels] = useState([]);
  const [discoveredBaseModels, setDiscoveredBaseModels] = useState([]);
  const [certifiedModels, setCertifiedModels] = useState([]);
  const [selectedBaseModels, setSelectedBaseModels] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // Changed to array for multi-selection
  const [languageAnalysis, setLanguageAnalysis] = useState(null);
  const [analyzingLanguage, setAnalyzingLanguage] = useState(false);
  const [trainingMode, setTrainingMode] = useState('local'); // 'local' or 'remote'
  const [activeView, setActiveView] = useState('config'); // 'config', 'console', 'tree', 'remote'
  // DNA v2 is now ALWAYS enabled - no toggle
  const [trainingParams, setTrainingParams] = useState({
    epochs: 3,
    batchSize: 8,
    learningRate: 0.0001,
    language: 'en',
    knowledgeSource: '', // Renamed from externalModel
    // DNA v2 specific parameters
    autoStopThreshold: 0.001,
    autoStopPatience: 3,
    seed: 42,
    // Advanced LoRA parameters
    loraRank: 64,
    loraAlpha: 128,
    lrScheduler: 'cosine',
    warmupSteps: 20,
    weightDecay: 0.01,
    maxGradNorm: 1.0,
    precision: 'bf16',
    optimizer: 'paged_adamw_8bit',
    gradientCheckpointing: true,
    torchCompile: true,
    targetModules: 'q_proj,v_proj,k_proj,o_proj,gate_proj,up_proj,down_proj',
    dropout: 0.05,
    // Avancerad kvantisering och minnesoptimering (nya parametrar)
    loadIn4Bit: false,            // --load-in-4bit för minneseffektiv laddning
    loadIn8Bit: false,            // --load-in-8bit alternativ
    quantizationType: 'nf4',      // Kvantiseringstyp: nf4, fp4
    computeDtype: 'bfloat16',     // Beräkningstyp: bfloat16, float16, float32
    doubleQuantization: true,     // Dubbel kvantisering för extra VRAM-besparing
    useNestedQuant: true,         // Nested quantization för QLoRA
    // Ytterligare avancerade inställningar
    gradientAccumulationSteps: 4, // Antal steg för gradientackumulering
    maxSeqLength: 2048,           // Max sekvenslängd för träning
    packingEnabled: false,        // Dataset packing för effektivitet
    useFastTokenizer: true,       // Använd snabb tokenizer
    loraScalingFactor: 2.0,       // LoRA skalningsfaktor (alpha/rank)
    // GPU minnesbegränsning (max_memory per GPU)
    maxMemoryPerGpu: '',          // Max VRAM per GPU, t.ex. "9.5GB" (tomt = använd allt)
    maxMemoryEnabled: false,      // Aktivera manuell minnesbegränsning
    // Multi-GPU konfiguration
    useMultiGpu: true,            // Aktivera multi-GPU träning (device_map='auto')
    numGpus: 0,                   // Antal GPU:er (0 = auto-detect)
    // DeepSpeed Tensor Parallel konfiguration (experimental)
    useDeepSpeed: false,          // Aktivera DeepSpeed för tensor parallel träning
    deepSpeedTpSize: 2,           // Tensor parallel size (antal GPU:er för tensor parallelism)
    deepSpeedZeroStage: 3,        // ZeRO optimization stage (0, 1, 2, eller 3)
    deepSpeedBatchSize: 32,       // Total batch size för DeepSpeed
    // DDP (Distributed Data Parallel) konfiguration - Full multi-GPU training
    useDdp: false,                // Aktivera full DDP träning via torchrun
    ddpBackend: 'nccl',           // DDP backend (nccl för NVIDIA GPU)
  });
  const [gpuInfo, setGpuInfo] = useState(null);  // GPU detection info
  const [trainingError, setTrainingError] = useState(null); // Felmeddelande för träningskrascher
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDatasets();
    fetchAvailableModels();
    fetchCertifiedModels();
    fetchDiscoveredBaseModels();
    fetchTrainingStatus();
    fetchGpuInfo();
    
    // Poll for training status every 5 seconds
    const interval = setInterval(fetchTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGpuInfo = async () => {
    try {
      const response = await fetch('/api/admin/gpu-info');
      if (response.ok) {
        const data = await response.json();
        setGpuInfo(data);
      }
    } catch (error) {
      console.error('Error fetching GPU info:', error);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/admin/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
        setDatasetCategories(data.categories || {});
        setAvailableCategories(data.availableCategories || ['politik', 'sverige', 'oneseek', 'custom']);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };
  
  // Filter datasets by selected category
  const getFilteredDatasets = () => {
    if (selectedCategory === 'all') {
      return datasets;
    }
    return datasets.filter(d => d.category === selectedCategory);
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('/api/admin/models/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
    }
  };

  const fetchDiscoveredBaseModels = async () => {
    try {
      const response = await fetch('/api/admin/models/discover-base');
      if (response.ok) {
        const data = await response.json();
        setDiscoveredBaseModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching discovered base models:', error);
    }
  };

  const fetchCertifiedModels = async () => {
    try {
      const response = await fetch('/api/models/certified');
      if (response.ok) {
        const data = await response.json();
        setCertifiedModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching certified models:', error);
    }
  };

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/admin/training/status');
      if (response.ok) {
        const data = await response.json();
        setTrainingStatus(data);
        if (data.logs) {
          setTrainingLogs(data.logs);
        }
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        // Kontrollera om träningen kraschade eller misslyckades
        // Check if training crashed or failed by looking at logs
        if (data.status === 'idle' && data.logs && data.logs.length > 0) {
          const lastLogs = data.logs.slice(-10); // Senaste 10 loggmeddelanden
          const errorLogs = lastLogs.filter(log => 
            log.message && (
              log.message.includes('[ERROR]') || 
              log.message.includes('failed') ||
              log.message.includes('Training failed') ||
              log.message.includes('exit code') ||
              log.message.includes('CRITICAL')
            )
          );
          
          if (errorLogs.length > 0) {
            // Extrahera felmeddelande från loggar
            const errorMessages = errorLogs.map(log => log.message).join('\n');
            setTrainingError({
              message: 'Träningen misslyckades',
              details: errorMessages,
              timestamp: errorLogs[0]?.timestamp || new Date().toISOString()
            });
          }
        }
        
        // Rensa felmeddelandet om träningen startar igen
        if (data.status === 'training') {
          setTrainingError(null);
        }
      }
    } catch (error) {
      console.error('Error fetching training status:', error);
    }
  };

  const addBaseModel = (modelName) => {
    if (!selectedBaseModels.includes(modelName) && selectedBaseModels.length < 10) {
      setSelectedBaseModels([...selectedBaseModels, modelName]);
    }
  };

  const removeBaseModel = (modelName) => {
    setSelectedBaseModels(selectedBaseModels.filter(m => m !== modelName));
  };

  const analyzeDatasetLanguage = async (datasetId) => {
    if (!datasetId) return;
    
    setAnalyzingLanguage(true);
    try {
      const response = await fetch(`/api/admin/datasets/${datasetId}/analyze-language`);
      if (response.ok) {
        const data = await response.json();
        setLanguageAnalysis(data);
        
        // Auto-update language parameter based on detection
        setTrainingParams({
          ...trainingParams,
          language: data.languageCode
        });
      }
    } catch (error) {
      console.error('Error analyzing dataset language:', error);
    } finally {
      setAnalyzingLanguage(false);
    }
  };

  const analyzeMultipleDatasets = async (datasetIds) => {
    if (!datasetIds || datasetIds.length === 0) return;
    
    setAnalyzingLanguage(true);
    try {
      const response = await fetch('/api/admin/datasets/analyze-multiple-languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetIds }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLanguageAnalysis(data);
        
        // Auto-update language parameter based on detection
        setTrainingParams({
          ...trainingParams,
          language: data.languageCode
        });
      }
    } catch (error) {
      console.error('Error analyzing datasets language:', error);
    } finally {
      setAnalyzingLanguage(false);
    }
  };

  const startTraining = async (mode = 'local') => {
    if (selectedDatasets.length === 0) {
      alert('Please select at least one dataset');
      return;
    }

    // Validate base models (required for DNA v2 which is always enabled)
    if (selectedBaseModels.length === 0) {
      alert('Please select at least one base model for training');
      return;
    }

    // Rensa tidigare felmeddelanden när ny träning startar
    setTrainingError(null);

    try {
      setTrainingMode(mode);
      
      if (mode === 'remote') {
        // Submit to remote worker
        const response = await fetch('/api/remote/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataset: selectedDatasets[0], // For now, use first dataset
            baseModels: selectedBaseModels,
            params: trainingParams,
            runId: `remote-${Date.now()}`
          }),
        });
        
        const data = await response.json();
        if (response.ok) {
          alert('Training job submitted to remote GPU worker!');
          await fetchTrainingStatus();
        } else {
          // Visa felmeddelande i GUI istället för bara alert
          setTrainingError({
            message: `Failed to submit remote job: ${data.error}`,
            details: data.details || null,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Local training - use DNA v2 endpoint
        const endpoint = '/api/admin/training/start-dna-v2';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetIds: selectedDatasets, // Send array of dataset IDs
            baseModels: selectedBaseModels,
            ...trainingParams,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          alert('Training started successfully with DNA v2 certified structure!');
          await fetchTrainingStatus();
        } else {
          // Visa detaljerat felmeddelande i GUI
          setTrainingError({
            message: `Kunde inte starta träning: ${data.error}`,
            details: data.details || data.message || null,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error starting training:', error);
      // Visa nätverksfel i GUI
      setTrainingError({
        message: 'Nätverksfel vid start av träning',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  const stopTraining = async () => {
    if (!confirm('Are you sure you want to stop training?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/training/stop', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Training stopped');
        await fetchTrainingStatus();
      }
    } catch (error) {
      console.error('Error stopping training:', error);
    }
  };

  const isTraining = trainingStatus?.status === 'training';

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* View Tabs */}
      <div className="border border-[#2a2a2a] bg-[#111] rounded overflow-hidden">
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveView('config')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeView === 'config'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#2a2a2a]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveView('console')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeView === 'console'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#2a2a2a]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Console
          </button>
          <button
            onClick={() => setActiveView('tree')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeView === 'tree'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#2a2a2a]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Model Tree
          </button>
          <button
            onClick={() => setActiveView('remote')}
            className={`flex-1 px-4 py-3 font-mono text-sm transition-colors ${
              activeView === 'remote'
                ? 'bg-[#1a1a1a] text-[#eee] border-b-2 border-[#2a2a2a]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            Remote Training
          </button>
        </div>
      </div>

      {/* Console View */}
      {activeView === 'console' && (
        <TrainingConsole
          baseModel={selectedBaseModels[0] || 'kb-llama-3-1-8b-swedish'}
          adapters={certifiedModels.slice(0, 3).map(m => m.runId)}
          runId={trainingStatus?.runId}
        />
      )}

      {/* Model Tree View */}
      {activeView === 'tree' && (
        <ModelEvolutionTree
          baseModel={selectedBaseModels[0] || 'kb-llama-3-1-8b-swedish'}
          adapters={certifiedModels.slice(0, 5).map(m => m.runId)}
        />
      )}

      {/* Remote Training View */}
      {activeView === 'remote' && (
        <RemoteTrainingControl
          onSubmit={startTraining}
        />
      )}

      {/* Training Configuration (only show in config view) */}
      {activeView === 'config' && (
        <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Training Configuration</h2>
          
          <div className="space-y-4 w-full max-w-full overflow-x-hidden">
            {/* Dataset Selection - Multi-select with Category Filter */}
            <div>
            <label className="block text-[#888] font-mono text-sm mb-2">
              Select Dataset(s) *
            </label>
            
            {/* Category Filter Dropdown */}
            <div className="mb-3">
              <label className="block text-[#666] font-mono text-xs mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isTraining}
                className="w-full sm:w-auto bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} ({datasetCategories[cat]?.length || 0} datasets)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Selected Datasets as Chips */}
            {selectedDatasets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedDatasets.map((datasetId) => {
                  const dataset = datasets.find(d => d.id === datasetId);
                  return (
                    <div
                      key={datasetId}
                      className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#eee] font-mono text-xs"
                    >
                      <span className="text-[#666] mr-1">[{dataset?.category || 'root'}]</span>
                      <span>{dataset?.name || datasetId}</span>
                      <button
                        onClick={() => {
                          setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
                          // Re-analyze remaining datasets
                          const remaining = selectedDatasets.filter(id => id !== datasetId);
                          if (remaining.length > 0) {
                            analyzeMultipleDatasets(remaining);
                          } else {
                            setLanguageAnalysis(null);
                          }
                        }}
                        disabled={isTraining}
                        className="text-[#888] hover:text-[#eee] disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !selectedDatasets.includes(value)) {
                    const newDatasets = [...selectedDatasets, value];
                    setSelectedDatasets(newDatasets);
                    // Analyze all selected datasets
                    analyzeMultipleDatasets(newDatasets);
                  }
                }}
                disabled={isTraining}
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="">-- Add dataset --</option>
                {getFilteredDatasets().filter(d => !selectedDatasets.includes(d.id)).map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    [{dataset.category}] {dataset.name} ({dataset.entries} entries)
                  </option>
                ))}
              </select>
              {selectedDatasets.length > 0 && !analyzingLanguage && (
                <button
                  onClick={() => analyzeMultipleDatasets(selectedDatasets)}
                  className="px-3 py-2 border border-[#2a2a2a] text-[#888] font-mono text-xs hover:bg-[#1a1a1a] rounded"
                  disabled={isTraining}
                >
                  Re-analyze
                </button>
              )}
            </div>
          </div>

          {/* Language Analysis Display */}
          {languageAnalysis && (
            <div className="p-4 bg-[#0a0a0a] border border-green-900/30 rounded">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-400 font-mono text-sm">📊 Language Analysis</h3>
                <span className="text-[#888] font-mono text-xs">
                  {languageAnalysis.totalSamples} samples analyzed ({selectedDatasets.length} dataset{selectedDatasets.length !== 1 ? 's' : ''})
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-[#666] font-mono text-xs mb-1">Swedish</div>
                  <div className="text-[#eee] font-mono text-lg">{languageAnalysis.languages.swedish.percent}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#666] font-mono text-xs mb-1">English</div>
                  <div className="text-[#eee] font-mono text-lg">{languageAnalysis.languages.english.percent}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#666] font-mono text-xs mb-1">Other</div>
                  <div className="text-[#eee] font-mono text-lg">{languageAnalysis.languages.other.percent}%</div>
                </div>
              </div>
              
              <div className="border-t border-[#2a2a2a] pt-3">
                <div className="text-[#888] font-mono text-xs mb-1">
                  Primary Language: <span className="text-green-400">{languageAnalysis.primaryLanguage}</span>
                </div>
                <div className="text-[#666] font-mono text-xs">
                  {languageAnalysis.recommendation}
                </div>
              </div>
            </div>
          )}

          {analyzingLanguage && (
            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-center">
              <div className="text-[#888] font-mono text-xs">Analyzing {selectedDatasets.length} dataset(s) language...</div>
            </div>
          )}

          {/* Training Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Epochs
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={trainingParams.epochs}
                onChange={(e) => setTrainingParams({ ...trainingParams, epochs: parseInt(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="64"
                value={trainingParams.batchSize}
                onChange={(e) => setTrainingParams({ ...trainingParams, batchSize: parseInt(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.00001"
                max="0.01"
                value={trainingParams.learningRate}
                onChange={(e) => setTrainingParams({ ...trainingParams, learningRate: parseFloat(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Base Model(s) Selection - Required for DNA v2 */}
          <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[#888] font-mono text-sm">
                Base Model(s) *
              </label>
              <span className="text-[#555] font-mono text-xs">
                {selectedBaseModels.length} / 10 selected
              </span>
            </div>
              
              {/* Selected Base Models */}
              {selectedBaseModels.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 w-full max-w-full">
                  {selectedBaseModels.map((modelName) => (
                    <div
                      key={modelName}
                      className="flex items-center gap-2 bg-[#111] border border-green-900/30 text-green-400 px-3 py-1 rounded font-mono text-xs max-w-full overflow-hidden"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[300px]" title={modelName}>{modelName}</span>
                      <button
                        onClick={() => removeBaseModel(modelName)}
                        disabled={isTraining}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Base Model Selector */}
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addBaseModel(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isTraining || selectedBaseModels.length >= 10}
                  className="flex-1 bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                >
                  <option value="">-- Add base model --</option>
                  
                  {/* Certified Models (Own Trained Models) - Sorted newest first */}
                  {certifiedModels
                    .filter(model => !selectedBaseModels.includes(model.name))
                    .map((model) => (
                      <option 
                        key={model.name} 
                        value={model.name}
                        style={{ color: '#10b981', fontWeight: 'bold' }}
                      >
                        {model.name} ← EGEN TRÄNAD MODELL
                      </option>
                    ))}
                  
                  {/* Separator between certified and base models */}
                  {certifiedModels.length > 0 && discoveredBaseModels.length > 0 && (
                    <option disabled style={{ color: '#444' }} aria-label="Separator between certified and base models">
                      ────────────────────────────────────────────────────────────
                    </option>
                  )}
                  
                  {/* Regular Base Models */}
                  {discoveredBaseModels
                    .filter(model => !selectedBaseModels.includes(model.name))
                    .map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} ({model.parameters || 'unknown'})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => setSelectedBaseModels([])}
                  disabled={isTraining || selectedBaseModels.length === 0}
                  className="px-3 py-2 border border-[#2a2a2a] text-[#666] font-mono text-xs hover:bg-[#1a1a1a] disabled:opacity-50 rounded"
                >
                  Clear All
                </button>
              </div>

              <p className="text-[#555] font-mono text-xs mt-2 break-words">
                ✓ Auto-discovered from <code className="break-all">/models/</code> folder
                <br />✓ Supports KB-Llama-3.1-8B-Swedish, Qwen-2.5, Gemma-2, etc.
                <br />✓ Sequential training (no OOM) with adaptive weights
              </p>
            </div>

          {/* Knowledge Source (formerly External Model) - Optional distillation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Language
              </label>
              <select
                value={trainingParams.language}
                onChange={(e) => setTrainingParams({ ...trainingParams, language: e.target.value })}
                disabled={true}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="en">English (OneSeek-7B-Zero.v1.1)</option>
                <option value="sv">Swedish (OneSeek-7B-Zero-SV.v1.1)</option>
              </select>
              <p className="text-[#555] font-mono text-xs mt-1">
                Auto-detected from dataset
              </p>
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Knowledge Source (Optional)
              </label>
              <select
                value={trainingParams.knowledgeSource}
                onChange={(e) => setTrainingParams({ ...trainingParams, knowledgeSource: e.target.value })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="">-- No knowledge source --</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
              <p className="text-[#555] font-mono text-xs mt-1">
                For optional knowledge distillation
              </p>
            </div>
          </div>

          {/* DNA v2 Parameters (Always Enabled) */}
          <div className="border-t border-[#2a2a2a] pt-4 mt-4">
            <div className="mb-4">
              <h3 className="text-[#eee] font-mono text-sm mb-1">
                🧬 DNA v2 Training Parameters
              </h3>
              <p className="text-[#666] font-mono text-xs">
                Advanced training with adaptive weights, auto-discovery, and cryptographic provenance
              </p>
            </div>

            {/* DNA v2 Specific Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Auto-Stop Threshold
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="0.01"
                    value={trainingParams.autoStopThreshold}
                    onChange={(e) => setTrainingParams({ ...trainingParams, autoStopThreshold: parseFloat(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Loss change threshold
                  </p>
                </div>

                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Auto-Stop Patience
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={trainingParams.autoStopPatience}
                    onChange={(e) => setTrainingParams({ ...trainingParams, autoStopPatience: parseInt(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Epochs to wait
                  </p>
                </div>

                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={trainingParams.seed}
                    onChange={(e) => setTrainingParams({ ...trainingParams, seed: parseInt(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Reproducibility
                  </p>
                </div>
              </div>

            {/* Advanced LoRA Parameters */}
            <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <h3 className="text-[#eee] font-mono text-sm mb-4 font-semibold">Advanced LoRA Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      LoRA Rank
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="256"
                      step="8"
                      value={trainingParams.loraRank}
                      onChange={(e) => setTrainingParams({ ...trainingParams, loraRank: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Default: 64
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      LoRA Alpha
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="512"
                      step="8"
                      value={trainingParams.loraAlpha}
                      onChange={(e) => setTrainingParams({ ...trainingParams, loraAlpha: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Default: 128
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      LR Scheduler
                    </label>
                    <select
                      value={trainingParams.lrScheduler}
                      onChange={(e) => setTrainingParams({ ...trainingParams, lrScheduler: e.target.value })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    >
                      <option value="cosine">Cosine</option>
                      <option value="linear">Linear</option>
                      <option value="constant">Constant</option>
                      <option value="constant_with_warmup">Constant with Warmup</option>
                    </select>
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Learning rate schedule
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Warmup Steps
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={trainingParams.warmupSteps}
                      onChange={(e) => setTrainingParams({ ...trainingParams, warmupSteps: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      LR warmup steps
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Weight Decay
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="0.1"
                      step="0.001"
                      value={trainingParams.weightDecay}
                      onChange={(e) => setTrainingParams({ ...trainingParams, weightDecay: parseFloat(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Regularization
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Max Gradient Norm
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={trainingParams.maxGradNorm}
                      onChange={(e) => setTrainingParams({ ...trainingParams, maxGradNorm: parseFloat(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Gradient clipping
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Precision
                    </label>
                    <select
                      value={trainingParams.precision}
                      onChange={(e) => setTrainingParams({ ...trainingParams, precision: e.target.value })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    >
                      <option value="bf16">BF16 (recommended)</option>
                      <option value="fp16">FP16</option>
                      <option value="fp32">FP32</option>
                    </select>
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Training precision
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Optimizer
                    </label>
                    <select
                      value={trainingParams.optimizer}
                      onChange={(e) => setTrainingParams({ ...trainingParams, optimizer: e.target.value })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    >
                      <option value="paged_adamw_8bit">Paged AdamW 8-bit</option>
                      <option value="adamw_torch">AdamW (PyTorch)</option>
                      <option value="adamw_8bit">AdamW 8-bit</option>
                      <option value="sgd">SGD</option>
                    </select>
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Optimizer type
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Dropout
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={trainingParams.dropout}
                      onChange={(e) => setTrainingParams({ ...trainingParams, dropout: parseFloat(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      LoRA dropout rate
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Target Modules
                    </label>
                    <input
                      type="text"
                      value={trainingParams.targetModules}
                      onChange={(e) => setTrainingParams({ ...trainingParams, targetModules: e.target.value })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Comma-separated modules
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.gradientCheckpointing}
                        onChange={(e) => setTrainingParams({ ...trainingParams, gradientCheckpointing: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-green-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Gradient Checkpointing</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Saves VRAM
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.torchCompile}
                        onChange={(e) => setTrainingParams({ ...trainingParams, torchCompile: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-green-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Torch Compile</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      20-30% faster on RTX 40/50
                    </p>
                  </div>
                </div>
              </div>

            {/* Avancerad Kvantisering och Minnesoptimering - Nya parametrar */}
            <div className="mt-4 p-4 bg-[#0a0a0a] border border-purple-900/30 rounded">
                <h3 className="text-purple-400 font-mono text-sm mb-4 font-semibold">🔧 Avancerad Kvantisering & Minnesoptimering</h3>
                <p className="text-[#666] font-mono text-xs mb-4">
                  Dessa inställningar möjliggör träning av stora modeller på GPU:er med begränsat VRAM genom 4-bit/8-bit kvantisering.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Ladda i 4-bit */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.loadIn4Bit}
                        onChange={(e) => setTrainingParams({ 
                          ...trainingParams, 
                          loadIn4Bit: e.target.checked,
                          loadIn8Bit: e.target.checked ? false : trainingParams.loadIn8Bit // Inaktivera 8-bit om 4-bit aktiveras
                        })}
                        disabled={isTraining}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Load in 4-bit (QLoRA)</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Laddar modellen i 4-bit för VRAM-besparing (~75% mindre)
                    </p>
                  </div>

                  {/* Ladda i 8-bit */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.loadIn8Bit}
                        onChange={(e) => setTrainingParams({ 
                          ...trainingParams, 
                          loadIn8Bit: e.target.checked,
                          loadIn4Bit: e.target.checked ? false : trainingParams.loadIn4Bit // Inaktivera 4-bit om 8-bit aktiveras
                        })}
                        disabled={isTraining}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Load in 8-bit</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Laddar modellen i 8-bit (~50% mindre VRAM)
                    </p>
                  </div>

                  {/* Dubbel kvantisering */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.doubleQuantization}
                        onChange={(e) => setTrainingParams({ ...trainingParams, doubleQuantization: e.target.checked })}
                        disabled={isTraining || !trainingParams.loadIn4Bit}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className={`font-mono text-sm ${trainingParams.loadIn4Bit ? 'text-[#888]' : 'text-[#555]'}`}>Double Quantization</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Extra VRAM-besparing (kräver 4-bit)
                    </p>
                  </div>

                  {/* Kvantiseringstyp */}
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Kvantiseringstyp
                    </label>
                    <select
                      value={trainingParams.quantizationType}
                      onChange={(e) => setTrainingParams({ ...trainingParams, quantizationType: e.target.value })}
                      disabled={isTraining || !trainingParams.loadIn4Bit}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    >
                      <option value="nf4">NF4 (rekommenderad för 4-bit)</option>
                      <option value="fp4">FP4</option>
                    </select>
                    <p className="text-[#555] font-mono text-xs mt-1">
                      NF4 ger bäst kvalitet för 4-bit (kräver 4-bit)
                    </p>
                  </div>

                  {/* Compute Dtype */}
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Compute Dtype
                    </label>
                    <select
                      value={trainingParams.computeDtype}
                      onChange={(e) => setTrainingParams({ ...trainingParams, computeDtype: e.target.value })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    >
                      <option value="bfloat16">BFloat16 (rekommenderad)</option>
                      <option value="float16">Float16</option>
                      <option value="float32">Float32</option>
                    </select>
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Beräkningstyp för kvantiserade vikter
                    </p>
                  </div>

                  {/* Gradient Accumulation Steps */}
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Gradient Accumulation
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      step="1"
                      value={trainingParams.gradientAccumulationSteps}
                      onChange={(e) => setTrainingParams({ ...trainingParams, gradientAccumulationSteps: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Simulerar större batch size
                    </p>
                  </div>

                  {/* Max Sequence Length */}
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      Max Sekvenslängd
                    </label>
                    <input
                      type="number"
                      min="128"
                      max="8192"
                      step="128"
                      value={trainingParams.maxSeqLength}
                      onChange={(e) => setTrainingParams({ ...trainingParams, maxSeqLength: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      Max tokens per sample
                    </p>
                  </div>

                  {/* LoRA Scaling Factor */}
                  <div>
                    <label className="block text-[#888] font-mono text-sm mb-2">
                      LoRA Skalningsfaktor
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="8.0"
                      step="0.5"
                      value={trainingParams.loraScalingFactor}
                      onChange={(e) => setTrainingParams({ ...trainingParams, loraScalingFactor: parseFloat(e.target.value) })}
                      disabled={isTraining}
                      className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                    />
                    <p className="text-[#555] font-mono text-xs mt-1">
                      alpha/rank (2.0 = standard)
                    </p>
                  </div>

                  {/* Packing Enabled */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.packingEnabled}
                        onChange={(e) => setTrainingParams({ ...trainingParams, packingEnabled: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Dataset Packing</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Packar flera samples i en sekvens
                    </p>
                  </div>

                  {/* Use Fast Tokenizer */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.useFastTokenizer}
                        onChange={(e) => setTrainingParams({ ...trainingParams, useFastTokenizer: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-sm">Fast Tokenizer</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      Rust-baserad, snabbare
                    </p>
                  </div>

                  {/* Nested Quantization */}
                  <div className="flex flex-col">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.useNestedQuant}
                        onChange={(e) => setTrainingParams({ ...trainingParams, useNestedQuant: e.target.checked })}
                        disabled={isTraining || !trainingParams.loadIn4Bit}
                        className="w-4 h-4 text-purple-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <span className={`font-mono text-sm ${trainingParams.loadIn4Bit ? 'text-[#888]' : 'text-[#555]'}`}>Nested Quantization</span>
                    </label>
                    <p className="text-[#555] font-mono text-xs mt-1 ml-6">
                      QLoRA nested quant (kräver 4-bit)
                    </p>
                  </div>
                </div>

                {/* GPU Minnesbegränsning */}
                <div className="mt-4 p-3 bg-[#111] border border-orange-900/30 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-orange-400 font-mono text-xs font-semibold">🎮 GPU Minnesbegränsning</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.maxMemoryEnabled}
                        onChange={(e) => setTrainingParams({ ...trainingParams, maxMemoryEnabled: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-orange-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-orange-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-xs">Aktivera</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888] font-mono text-xs mb-1">
                        Max VRAM per GPU
                      </label>
                      <input
                        type="text"
                        placeholder="9.5GB"
                        value={trainingParams.maxMemoryPerGpu}
                        onChange={(e) => setTrainingParams({ ...trainingParams, maxMemoryPerGpu: e.target.value })}
                        disabled={isTraining || !trainingParams.maxMemoryEnabled}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-orange-900/50 disabled:opacity-50"
                      />
                      <p className="text-[#555] font-mono text-xs mt-1">
                        T.ex. "9.5GB", "10GB" (tomt = använd allt)
                      </p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[#666] font-mono text-xs">
                        💡 Sätt lägre än max för stabilitet vid stor träning.
                      </p>
                      <p className="text-[#555] font-mono text-xs mt-1">
                        Standard: 10.7GB → Rekommenderat: 9.5GB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multi-GPU Konfiguration */}
                <div className="mt-4 p-3 bg-[#111] border border-blue-900/30 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-blue-400 font-mono text-xs font-semibold">🖥️ Multi-GPU Konfiguration</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.useMultiGpu}
                        onChange={(e) => setTrainingParams({ ...trainingParams, useMultiGpu: e.target.checked })}
                        disabled={isTraining}
                        className="w-4 h-4 text-blue-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-xs">Aktivera Multi-GPU</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888] font-mono text-xs mb-1">
                        Antal GPU:er
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        placeholder="0 = auto"
                        value={trainingParams.numGpus}
                        onChange={(e) => setTrainingParams({ ...trainingParams, numGpus: parseInt(e.target.value) || 0 })}
                        disabled={isTraining || !trainingParams.useMultiGpu}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-blue-900/50 disabled:opacity-50"
                      />
                      <p className="text-[#555] font-mono text-xs mt-1">
                        0 = auto-detect alla GPU:er
                      </p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[#666] font-mono text-xs">
                        💡 Använder device_map="auto" för att fördela modellen över alla GPU:er.
                      </p>
                      <p className="text-[#555] font-mono text-xs mt-1">
                        Kombinera med max VRAM per GPU för stabilitet.
                      </p>
                    </div>
                  </div>
                  
                  {trainingParams.useMultiGpu && (
                    <div className="mt-3 p-2 bg-blue-900/10 border border-blue-900/20 rounded">
                      <p className="text-blue-400 font-mono text-xs">
                        ✓ Multi-GPU aktiverat: Modellen fördelas automatiskt över {trainingParams.numGpus > 0 ? `de första ${trainingParams.numGpus}` : 'alla tillgängliga'} GPU:er
                        {trainingParams.maxMemoryEnabled && trainingParams.maxMemoryPerGpu && ` (max ${trainingParams.maxMemoryPerGpu} per GPU)`}
                      </p>
                    </div>
                  )}
                </div>

                {/* DeepSpeed Tensor Parallel Konfiguration (Experimental) */}
                <div className="mt-4 p-3 bg-[#111] border border-yellow-900/30 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-yellow-400 font-mono text-xs font-semibold">⚡ DeepSpeed Tensor Parallel (Experimental)</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.useDeepSpeed}
                        onChange={(e) => setTrainingParams({ 
                          ...trainingParams, 
                          useDeepSpeed: e.target.checked,
                          // Om DeepSpeed aktiveras, inaktivera standard multi-GPU
                          // Om DeepSpeed inaktiveras, återaktivera standard multi-GPU
                          useMultiGpu: e.target.checked ? false : true
                        })}
                        disabled={isTraining}
                        className="w-4 h-4 text-yellow-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-yellow-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-xs">Aktivera DeepSpeed</span>
                    </label>
                  </div>
                  
                  <p className="text-[#666] font-mono text-xs mb-3">
                    DeepSpeed möjliggör tensor parallelism för att träna med båda GPU:erna samtidigt. Kräver <code className="text-yellow-400">pip install deepspeed</code>.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#888] font-mono text-xs mb-1">
                        Tensor Parallel Size
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={trainingParams.deepSpeedTpSize}
                        onChange={(e) => setTrainingParams({ ...trainingParams, deepSpeedTpSize: parseInt(e.target.value) || 2 })}
                        disabled={isTraining || !trainingParams.useDeepSpeed}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-yellow-900/50 disabled:opacity-50"
                      />
                      <p className="text-[#555] font-mono text-xs mt-1">
                        Antal GPU:er (2 = båda)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-[#888] font-mono text-xs mb-1">
                        ZeRO Stage
                      </label>
                      <select
                        value={trainingParams.deepSpeedZeroStage}
                        onChange={(e) => setTrainingParams({ ...trainingParams, deepSpeedZeroStage: parseInt(e.target.value) })}
                        disabled={isTraining || !trainingParams.useDeepSpeed}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-yellow-900/50 disabled:opacity-50"
                      >
                        <option value="0">Stage 0 (Ingen ZeRO)</option>
                        <option value="1">Stage 1 (Optimizer)</option>
                        <option value="2">Stage 2 (Optimizer + Gradients)</option>
                        <option value="3">Stage 3 (Full Partition)</option>
                      </select>
                      <p className="text-[#555] font-mono text-xs mt-1">
                        Stage 3 ger mest VRAM-besparing
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-[#888] font-mono text-xs mb-1">
                        DeepSpeed Batch Size
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="256"
                        value={trainingParams.deepSpeedBatchSize}
                        onChange={(e) => setTrainingParams({ ...trainingParams, deepSpeedBatchSize: parseInt(e.target.value) || 32 })}
                        disabled={isTraining || !trainingParams.useDeepSpeed}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-yellow-900/50 disabled:opacity-50"
                      />
                      <p className="text-[#555] font-mono text-xs mt-1">
                        Total train_batch_size
                      </p>
                    </div>
                  </div>
                  
                  {trainingParams.useDeepSpeed && (
                    <div className="mt-3 p-2 bg-yellow-900/10 border border-yellow-900/20 rounded">
                      <p className="text-yellow-400 font-mono text-xs">
                        ⚡ DeepSpeed Tensor Parallel aktiverat: tp_size={trainingParams.deepSpeedTpSize}, ZeRO Stage {trainingParams.deepSpeedZeroStage}
                      </p>
                      <p className="text-[#666] font-mono text-xs mt-1">
                        OBS: Kräver <code className="text-yellow-400">pip install deepspeed</code> och kompatibel CUDA-miljö.
                      </p>
                    </div>
                  )}
                </div>

                {/* DDP (Distributed Data Parallel) Konfiguration - Full Multi-GPU Training */}
                <div className="mt-4 p-3 bg-[#111] border border-green-900/30 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-green-400 font-mono text-xs font-semibold">🚀 DDP Training (Distributed Data Parallel)</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingParams.useDdp}
                        onChange={(e) => setTrainingParams({ 
                          ...trainingParams, 
                          useDdp: e.target.checked,
                          // Om DDP aktiveras, inaktivera DeepSpeed och standard multi-GPU
                          useDeepSpeed: e.target.checked ? false : trainingParams.useDeepSpeed,
                          useMultiGpu: e.target.checked ? false : trainingParams.useMultiGpu
                        })}
                        disabled={isTraining}
                        className="w-4 h-4 text-green-600 bg-[#111] border-[#2a2a2a] rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="text-[#888] font-mono text-xs">Aktivera DDP</span>
                    </label>
                  </div>
                  
                  <p className="text-[#666] font-mono text-xs mb-3">
                    Full Distributed Data Parallel träning via <code className="text-green-400">torchrun</code>. 
                    Rekommenderat för multi-GPU system (t.ex. 2×RTX 2080 Ti).
                  </p>
                  
                  {/* GPU Detection Info */}
                  {gpuInfo && (
                    <div className="mb-3 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                      <p className="text-[#888] font-mono text-xs mb-2">
                        🎮 Detekterade GPU:er: {gpuInfo.count || 0}
                      </p>
                      {gpuInfo.devices && gpuInfo.devices.map((gpu, idx) => (
                        <div key={idx} className="text-[#666] font-mono text-xs ml-4">
                          cuda:{gpu.index} - {gpu.name} ({gpu.memory_gb} GB)
                        </div>
                      ))}
                      {gpuInfo.count >= 2 && (
                        <p className="text-green-400 font-mono text-xs mt-2">
                          ✓ Uppskattad speedup med DDP: ~{(gpuInfo.count * 0.95).toFixed(1)}×
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!gpuInfo && (
                    <div className="mb-3 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                      <p className="text-[#666] font-mono text-xs">
                        GPU-information laddas...
                      </p>
                    </div>
                  )}
                  
                  {trainingParams.useDdp && (
                    <div className="mt-3 p-2 bg-green-900/10 border border-green-900/20 rounded">
                      <p className="text-green-400 font-mono text-xs">
                        🚀 DDP aktiverat: Träning sker på alla {gpuInfo?.count || 'N/A'} GPU:er samtidigt
                      </p>
                      <p className="text-[#666] font-mono text-xs mt-1">
                        • 4-bit + fp16 träning (standard för snabbhet)
                        <br />• GPU minnesgräns respekteras 100%
                        <br />• ~{((gpuInfo?.count || 2) * 0.95).toFixed(1)}× speedup
                      </p>
                    </div>
                  )}
                </div>

                {/* Info om VRAM-användning */}
                {(trainingParams.loadIn4Bit || trainingParams.loadIn8Bit) && (
                  <div className="mt-4 p-3 bg-[#111] border border-purple-900/20 rounded">
                    <p className="text-purple-400 font-mono text-xs">
                      💾 VRAM-optimering aktiv: {trainingParams.loadIn4Bit ? '4-bit QLoRA' : '8-bit'} kvantisering 
                      {trainingParams.doubleQuantization && trainingParams.loadIn4Bit && ' + dubbel kvantisering'}
                    </p>
                    <p className="text-[#666] font-mono text-xs mt-1">
                      Uppskattad VRAM-besparing: ~{trainingParams.loadIn4Bit ? '75%' : '50%'} jämfört med FP16
                    </p>
                  </div>
                )}
              </div>

            {/* DNA v2 Features Info */}
            <div className="mt-4 p-3 bg-[#0a0a0a] border border-green-900/30 rounded max-w-full overflow-x-hidden">
              <p className="text-green-400 font-mono text-xs mb-2">✅ DNA v2 Features:</p>
              <ul className="text-[#666] font-mono text-xs space-y-1 pl-4 break-words">
                <li>• Auto-discovers base models from models/ directory</li>
                <li>• Adaptive weight adjustment (+20-50% best, -30-50% worst)</li>
                <li>• Confidence-based auto-stop when loss plateaus</li>
                <li>• SHA-256 DNA fingerprinting with Ed25519 signatures</li>
                <li>• Immutable ledger entry with dataset hashes</li>
                <li>• Certified model package with verification script</li>
              </ul>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            {!isTraining ? (
              <button
                onClick={startTraining}
                disabled={selectedDatasets.length === 0}
                className="px-6 py-2 bg-[#eee] text-[#0a0a0a] font-mono text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Training
              </button>
            ) : (
              <button
                onClick={stopTraining}
                className="px-6 py-2 border border-[#666] text-[#666] font-mono text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                Stop Training
              </button>
            )}
          </div>
        </div>
      </div>
      )}
      {/* End of Config View */}

      {/* Training Status - Show in all views */}
      {trainingStatus && (
        <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Training Status</h2>
          
          <div className="space-y-3 w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[#666] font-mono text-sm">Status</span>
              <span className={`font-mono text-sm ${
                isTraining ? 'text-[#888]' : 'text-[#666]'
              }`}>
                {trainingStatus.status}
                <span className="ml-2 text-green-400">🧬 DNA v2</span>
              </span>
            </div>

            {/* Show DNA if available */}
            {trainingStatus.dna && (
              <div className="p-3 bg-[#0a0a0a] border border-green-900/30 rounded">
                <span className="text-[#666] font-mono text-xs block mb-1">DNA Fingerprint:</span>
                <span className="text-green-400 font-mono text-xs break-all">
                  {trainingStatus.dna}
                </span>
              </div>
            )}

            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Current Epoch</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.currentEpoch} / {metrics.totalEpochs}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Loss</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.loss?.toFixed(4) || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Progress</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#2a2a2a] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#888] transition-all duration-300"
                    style={{ width: `${metrics.progress}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Felmeddelande vid träningskrasch - Error display for training failures */}
      {trainingError && (
        <div className="border border-red-900/50 bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-red-400 font-mono text-lg flex items-center gap-2">
              ⚠️ Träningsfel / Training Error
            </h2>
            <button
              onClick={() => setTrainingError(null)}
              className="text-[#666] hover:text-[#888] font-mono text-sm"
            >
              ✕ Stäng
            </button>
          </div>
          
          <div className="space-y-3 w-full max-w-full overflow-x-hidden">
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded">
              <p className="text-red-400 font-mono text-sm font-semibold mb-2">
                {trainingError.message || 'Ett fel uppstod under träningen'}
              </p>
              {trainingError.details && (
                <pre className="text-[#888] font-mono text-xs whitespace-pre-wrap break-words mt-2 p-3 bg-[#0a0a0a] rounded max-h-48 overflow-y-auto">
                  {trainingError.details}
                </pre>
              )}
            </div>
            
            <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
              <p className="text-[#888] font-mono text-xs mb-2">💡 Felsökningsförslag:</p>
              <ul className="text-[#666] font-mono text-xs space-y-1 pl-4">
                <li>• Kontrollera att alla beroenden är installerade (PEFT, PyTorch, Transformers)</li>
                <li>• Verifiera att basmodellen finns i /models/ katalogen</li>
                <li>• Kontrollera GPU-minnesutrymme med nvidia-smi</li>
                <li>• Se detaljerade loggar nedan för mer information</li>
                <li>• Prova 4-bit kvantisering för att minska VRAM-användning</li>
              </ul>
            </div>

            {trainingError.timestamp && (
              <p className="text-[#555] font-mono text-xs">
                Tidpunkt: {new Date(trainingError.timestamp).toLocaleString('sv-SE')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Leaderboard - Always show when training */}
      {trainingStatus && isTraining && trainingStatus.runId && (
        <LiveLeaderboard runId={trainingStatus.runId} />
      )}

      {/* Training Logs */}
      <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Logs</h2>
        
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4 h-64 overflow-y-auto overflow-x-hidden font-mono text-xs w-full max-w-full">
          {trainingLogs.length === 0 ? (
            <div className="text-[#666]">No logs available</div>
          ) : (
            trainingLogs.map((log, index) => (
              <div key={index} className="text-[#888] mb-1 break-words">
                <span className="text-[#666]">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
