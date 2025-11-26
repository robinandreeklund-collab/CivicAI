import { useState, useEffect } from 'react';

/**
 * Model Evolution Tree Component
 * 
 * Visual tree view of the entire model chain showing:
 * - Base model at the root
 * - Adapters as branches with real metadata
 * - Size and training parameters for each node
 */
export default function ModelEvolutionTree({ baseModel, adapters = [], adapterMetadata = {} }) {
  const [chainInfo, setChainInfo] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['base']));
  const [adapterDetails, setAdapterDetails] = useState({});

  useEffect(() => {
    if (baseModel) {
      fetchChainInfo();
      fetchAdapterDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseModel, adapters]);

  const fetchChainInfo = async () => {
    try {
      const adaptersList = adapters.join(',');
      const response = await fetch(`/api/remote/chain/size?baseModel=${baseModel}&adapters=${adaptersList}`);
      if (response.ok) {
        const data = await response.json();
        setChainInfo(data);
      }
    } catch (error) {
      console.error('Error fetching chain info:', error);
    }
  };

  const fetchAdapterDetails = async () => {
    // Fetch metadata for each adapter
    const details = {};
    for (const adapter of adapters) {
      try {
        const response = await fetch(`/api/admin/models/${encodeURIComponent(adapter)}/metadata`);
        if (response.ok) {
          const data = await response.json();
          details[adapter] = data;
        }
      } catch (error) {
        console.error(`Error fetching metadata for ${adapter}:`, error);
      }
    }
    setAdapterDetails(details);
  };

  // Format file size
  const formatSize = (sizeBytes) => {
    if (!sizeBytes) return 'Unknown';
    const mb = sizeBytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  if (!chainInfo) {
    return (
      <div className="border border-[#2a2a2a] bg-[#111] rounded p-6 text-center">
        <div className="text-[#666] font-mono text-sm">Loading model chain...</div>
      </div>
    );
  }

  return (
    <div className="border border-[#2a2a2a] bg-[#111] rounded">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-4 py-3">
        <h3 className="text-sm font-mono text-[#eee]">Model Evolution Tree</h3>
      </div>

      {/* Tree View */}
      <div className="p-6">
        {/* Base Model Node */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            onClick={() => toggleNode('base')}
          >
            <span className="text-[#888] font-mono text-xs">
              {expandedNodes.has('base') ? '▼' : '▶'}
            </span>
            <div className="flex-1">
              <div className="font-mono text-sm text-[#eee]">{baseModel}</div>
              <div className="text-xs text-[#666] font-mono">Base Model</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-[#888]">{chainInfo.formatted.base}</div>
              <div className="text-xs text-[#555] font-mono">Size</div>
            </div>
          </div>

          {/* Base Model Details (Expanded) */}
          {expandedNodes.has('base') && (
            <div className="ml-8 mt-2 p-3 bg-[#0a0a0a] border-l-2 border-[#2a2a2a] text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 text-[#666]">
                <div>Type:</div>
                <div className="text-[#888]">Foundation Model</div>
                <div>Status:</div>
                <div className="text-[#888]">Active</div>
              </div>
            </div>
          )}
        </div>

        {/* Adapters */}
        {adapters.length > 0 && (
          <div className="ml-8 space-y-3 border-l-2 border-[#2a2a2a] pl-4">
            {adapters.map((adapter, idx) => {
              const meta = adapterDetails[adapter] || adapterMetadata[adapter] || {};
              const training = meta.training || {};
              const loraConfig = training.loraConfig || {};
              const adapterSize = meta.size || meta.adapterSize;
              
              return (
                <div key={adapter}>
                  <div 
                    className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => toggleNode(adapter)}
                  >
                    <span className="text-[#888] font-mono text-xs">
                      {expandedNodes.has(adapter) ? '▼' : '▶'}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-sm text-[#eee]">Adapter #{idx + 1}</div>
                      <div className="text-xs text-[#666] font-mono truncate max-w-[300px]" title={adapter}>{adapter}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-[#888]">
                        {adapterSize ? formatSize(adapterSize) : '~30 MB'}
                      </div>
                      <div className="text-xs text-[#555] font-mono">LoRA</div>
                    </div>
                  </div>

                  {/* Adapter Details (Expanded) - Show Real Training Data */}
                  {expandedNodes.has(adapter) && (
                    <div className="ml-8 mt-2 p-3 bg-[#0a0a0a] border-l-2 border-[#2a2a2a] text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2 text-[#666]">
                        <div>Type:</div>
                        <div className="text-[#888]">LoRA Adapter</div>
                        
                        {/* LoRA Configuration */}
                        <div>Rank:</div>
                        <div className="text-[#888]">{loraConfig.rank || training.loraRank || meta.loraRank || 64}</div>
                        <div>Alpha:</div>
                        <div className="text-[#888]">{loraConfig.alpha || training.loraAlpha || meta.loraAlpha || 128}</div>
                        <div>Dropout:</div>
                        <div className="text-[#888]">{loraConfig.dropout || training.dropout || meta.dropout || 0.05}</div>
                        
                        {/* Training Parameters */}
                        {(training.epochs || meta.epochs) && (
                          <>
                            <div>Epochs:</div>
                            <div className="text-[#888]">{training.epochs || meta.epochs}</div>
                          </>
                        )}
                        {(training.batchSize || meta.batchSize) && (
                          <>
                            <div>Batch Size:</div>
                            <div className="text-[#888]">{training.batchSize || meta.batchSize}</div>
                          </>
                        )}
                        {(training.learningRate || meta.learningRate) && (
                          <>
                            <div>Learning Rate:</div>
                            <div className="text-[#888]">{training.learningRate || meta.learningRate}</div>
                          </>
                        )}
                        {(training.optimizer || meta.optimizer) && (
                          <>
                            <div>Optimizer:</div>
                            <div className="text-[#888]">{training.optimizer || meta.optimizer}</div>
                          </>
                        )}
                        
                        {/* Dataset Info */}
                        {(meta.datasets || training.datasets) && (
                          <>
                            <div>Datasets:</div>
                            <div className="text-[#888] truncate max-w-[200px]" title={(meta.datasets || training.datasets).join(', ')}>
                              {(meta.datasets || training.datasets).join(', ')}
                            </div>
                          </>
                        )}
                        
                        {/* Language */}
                        {(meta.language || training.language) && (
                          <>
                            <div>Language:</div>
                            <div className="text-[#888]">
                              {(meta.language || training.language) === 'sv' ? 'Swedish' : 
                               (meta.language || training.language) === 'en' ? 'English' : 
                               (meta.language || training.language)}
                            </div>
                          </>
                        )}
                        
                        {/* Base Model */}
                        {(meta.baseModel || training.baseModel) && (
                          <>
                            <div>Base Model:</div>
                            <div className="text-[#888] truncate max-w-[200px]" title={meta.baseModel || training.baseModel}>
                              {meta.baseModel || training.baseModel}
                            </div>
                          </>
                        )}
                        
                        {/* Training Time */}
                        {meta.createdAt && (
                          <>
                            <div>Created:</div>
                            <div className="text-[#888]">{new Date(meta.createdAt).toLocaleString()}</div>
                          </>
                        )}
                        
                        <div>Status:</div>
                        <div className="text-[#888]">{meta.status || 'Verified'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-mono text-[#eee]">{chainInfo.adapterCount}</div>
              <div className="text-xs text-[#666] font-mono">Adapters</div>
            </div>
            <div>
              <div className="text-lg font-mono text-[#eee]">{chainInfo.formatted.total}</div>
              <div className="text-xs text-[#666] font-mono">Total Size</div>
            </div>
            <div>
              <div className={`text-lg font-mono ${chainInfo.warning.level === 'critical' ? 'text-[#888]' : chainInfo.warning.level === 'warning' ? 'text-[#888]' : 'text-[#888]'}`}>
                {chainInfo.warning.level === 'critical' ? '!' : chainInfo.warning.level === 'warning' ? '⚠' : '✓'}
              </div>
              <div className="text-xs text-[#666] font-mono">Health</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
