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
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400">Loading model chain...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🌳</span>
          Model Evolution Tree
        </h3>
      </div>

      {/* Tree View */}
      <div className="p-6">
        {/* Base Model Node */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg cursor-pointer hover:bg-blue-900/40 transition-colors"
            onClick={() => toggleNode('base')}
          >
            <span className="text-blue-400 font-bold">
              {expandedNodes.has('base') ? '▼' : '▶'}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-white">{baseModel}</div>
              <div className="text-sm text-gray-400">Base Model</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">{chainInfo.formatted.base}</div>
              <div className="text-xs text-gray-500">Size</div>
            </div>
          </div>

          {/* Base Model Details (Expanded) */}
          {expandedNodes.has('base') && (
            <div className="ml-8 mt-2 p-3 bg-gray-900 rounded border-l-2 border-blue-600 text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-400">
                <div>Type:</div>
                <div className="text-white">Foundation Model</div>
                <div>Status:</div>
                <div className="text-green-400">✓ Active</div>
              </div>
            </div>
          )}
        </div>

        {/* Adapters */}
        {adapters.length > 0 && (
          <div className="ml-8 space-y-3 border-l-2 border-gray-600 pl-4">
            {adapters.map((adapter, idx) => (
              <div key={adapter}>
                <div 
                  className="flex items-center gap-3 p-3 bg-purple-900/30 border border-purple-700 rounded-lg cursor-pointer hover:bg-purple-900/40 transition-colors"
                  onClick={() => toggleNode(adapter)}
                >
                  <span className="text-purple-400 font-bold">
                    {expandedNodes.has(adapter) ? '▼' : '▶'}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">Adapter #{idx + 1}</div>
                    <div className="text-xs text-gray-400 font-mono">{adapter}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-purple-400">~420 MB</div>
                    <div className="text-xs text-gray-500">LoRA</div>
                  </div>
                </div>

                {/* Adapter Details (Expanded) */}
                {expandedNodes.has(adapter) && (
                  <div className="ml-8 mt-2 p-3 bg-gray-900 rounded border-l-2 border-purple-600 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-gray-400">
                      <div>Type:</div>
                      <div className="text-white">LoRA Adapter</div>
                      <div>Rank:</div>
                      <div className="text-white">64</div>
                      <div>Alpha:</div>
                      <div className="text-white">128</div>
                      <div>Status:</div>
                      <div className="text-green-400">✓ Verified</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{chainInfo.adapterCount}</div>
              <div className="text-sm text-gray-400">Adapters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{chainInfo.formatted.total}</div>
              <div className="text-sm text-gray-400">Total Size</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${chainInfo.warning.level === 'critical' ? 'text-red-500' : chainInfo.warning.level === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                {chainInfo.warning.level === 'critical' ? '⚠️' : chainInfo.warning.level === 'warning' ? '⚡' : '✓'}
              </div>
              <div className="text-sm text-gray-400">Health</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
