import { useState, useEffect } from 'react';

/**
 * Model Evolution Tree Component
 * 
 * Visual tree view of the entire model chain showing:
 * - Base model at the root
 * - Adapters as branches
 * - Size and metadata for each node
 */
export default function ModelEvolutionTree({ baseModel, adapters = [] }) {
  const [chainInfo, setChainInfo] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['base']));

  useEffect(() => {
    if (baseModel) {
      fetchChainInfo();
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
            {adapters.map((adapter, idx) => (
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
                    <div className="text-xs text-[#666] font-mono">{adapter}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-[#888]">~420 MB</div>
                    <div className="text-xs text-[#555] font-mono">LoRA</div>
                  </div>
                </div>

                {/* Adapter Details (Expanded) */}
                {expandedNodes.has(adapter) && (
                  <div className="ml-8 mt-2 p-3 bg-[#0a0a0a] border-l-2 border-[#2a2a2a] text-xs font-mono">
                    <div className="grid grid-cols-2 gap-2 text-[#666]">
                      <div>Type:</div>
                      <div className="text-[#888]">LoRA Adapter</div>
                      <div>Rank:</div>
                      <div className="text-[#888]">64</div>
                      <div>Alpha:</div>
                      <div className="text-[#888]">128</div>
                      <div>Status:</div>
                      <div className="text-[#888]">Verified</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
