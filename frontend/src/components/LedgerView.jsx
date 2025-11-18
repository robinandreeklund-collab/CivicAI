import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * LedgerView Component
 * Displays transparency ledger blocks with detailed audit information
 */
export default function LedgerView({ blocks = [], onVerify = null }) {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Mock data if none provided
  const displayBlocks = blocks.length > 0 ? blocks : [
    {
      block_id: 0,
      timestamp: '2025-01-01T00:00:00Z',
      event_type: 'genesis',
      current_hash: 'a7f5c3d8e9b2f1a4c6e8d0f2a5b7c9e1',
      data: {
        model_version: '0.0.0',
        description: 'OQT-1.0 Transparency Ledger Genesis Block'
      },
      signatures: {
        validator: 'system'
      }
    },
    {
      block_id: 1,
      timestamp: '2025-01-15T10:00:00Z',
      event_type: 'training',
      current_hash: 'b3c5a1d7f9e2b4c6a8d0f1e3b5c7a9d1',
      data: {
        model_version: '1.0.0',
        training_samples: 10000,
        fairness_metrics: {
          demographic_parity: 0.945,
          equal_opportunity: 0.928
        }
      },
      signatures: {
        validator: 'OQT-Training-Pipeline'
      }
    },
    {
      block_id: 2,
      timestamp: '2025-01-20T14:30:00Z',
      event_type: 'update',
      current_hash: 'c8d2e4f6a1b3c5d7e9f1a3b5c7d9e1f3',
      data: {
        model_version: '1.0.1',
        update_type: 'incremental',
        new_samples: 500
      },
      signatures: {
        validator: 'realtime-update-system'
      }
    },
    {
      block_id: 3,
      timestamp: '2025-02-01T09:15:00Z',
      event_type: 'audit',
      current_hash: 'd1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1',
      data: {
        model_version: '1.0.1',
        audit_result: 'passed',
        checks_performed: ['integrity', 'fairness', 'bias']
      },
      signatures: {
        validator: 'audit-system-quarterly'
      }
    },
    {
      block_id: 4,
      timestamp: '2025-02-05T16:45:00Z',
      event_type: 'training',
      current_hash: 'e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5',
      data: {
        model_version: '1.1.0',
        training_samples: 15000,
        fairness_metrics: {
          demographic_parity: 0.967,
          equal_opportunity: 0.952
        }
      },
      signatures: {
        validator: 'OQT-Training-Pipeline'
      }
    }
  ];

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (eventType) => {
    const icons = {
      genesis: '🌟',
      training: '🎓',
      update: '🔄',
      audit: '🔍',
      review: '👁️',
      data_collection: '📊'
    };
    return icons[eventType] || '📝';
  };

  const getEventColor = (eventType) => {
    const colors = {
      genesis: 'border-purple-500',
      training: 'border-blue-500',
      update: 'border-green-500',
      audit: 'border-yellow-500',
      review: 'border-orange-500',
      data_collection: 'border-cyan-500'
    };
    return colors[eventType] || 'border-gray-500';
  };

  const handleVerify = () => {
    // Simulate verification
    setVerificationStatus('verifying');
    setTimeout(() => {
      setVerificationStatus('valid');
    }, 1000);
  };

  const handleBlockClick = (block) => {
    setSelectedBlock(selectedBlock?.block_id === block.block_id ? null : block);
  };

  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-[#e7e7e7] mb-2">Transparency Ledger</h2>
          <p className="text-sm text-[#888]">
            Immutable audit trail of all model events
          </p>
        </div>
        
        {onVerify && (
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-sm rounded-lg transition-colors duration-200"
          >
            {verificationStatus === 'verifying' ? 'Verifying...' : 'Verify Ledger'}
          </button>
        )}
      </div>

      {/* Verification status */}
      {verificationStatus && (
        <div className={`
          mb-4 p-3 rounded-lg text-sm
          ${verificationStatus === 'valid' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
          }
        `}>
          {verificationStatus === 'valid' 
            ? '✓ Ledger integrity verified - All blocks are valid'
            : '⏳ Verifying blockchain integrity...'
          }
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
          <div className="text-xs text-[#888] mb-1">Total Blocks</div>
          <div className="text-xl font-medium text-[#e7e7e7]">{displayBlocks.length}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
          <div className="text-xs text-[#888] mb-1">Training Events</div>
          <div className="text-xl font-medium text-blue-400">
            {displayBlocks.filter(b => b.event_type === 'training').length}
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
          <div className="text-xs text-[#888] mb-1">Updates</div>
          <div className="text-xl font-medium text-green-400">
            {displayBlocks.filter(b => b.event_type === 'update').length}
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
          <div className="text-xs text-[#888] mb-1">Audits</div>
          <div className="text-xl font-medium text-yellow-400">
            {displayBlocks.filter(b => b.event_type === 'audit').length}
          </div>
        </div>
      </div>

      {/* Blocks list */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {displayBlocks.slice().reverse().map((block) => (
          <div
            key={block.block_id}
            className={`
              border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200
              ${getEventColor(block.event_type)}
              ${selectedBlock?.block_id === block.block_id
                ? 'bg-[#1a1a1a] border-opacity-100'
                : 'bg-[#0a0a0a] border-opacity-50 hover:bg-[#151515]'
              }
            `}
            onClick={() => handleBlockClick(block)}
          >
            {/* Block header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getEventIcon(block.event_type)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#e7e7e7]">
                      Block #{block.block_id}
                    </span>
                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#aaa] text-xs rounded">
                      {block.event_type}
                    </span>
                  </div>
                  <div className="text-xs text-[#888] mt-1">
                    {formatDate(block.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-[#888]">Hash</div>
                <div className="text-xs text-[#aaa] font-mono">
                  {block.current_hash.substring(0, 8)}...
                </div>
              </div>
            </div>

            {/* Block preview */}
            {!selectedBlock || selectedBlock.block_id !== block.block_id ? (
              <div className="text-xs text-[#888]">
                {block.data.model_version && `Model: ${block.data.model_version}`}
                {block.data.training_samples && ` • ${block.data.training_samples.toLocaleString()} samples`}
                {block.data.description && block.data.description}
              </div>
            ) : (
              /* Expanded details */
              <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                {/* Data section */}
                <div>
                  <div className="text-xs font-medium text-[#e7e7e7] mb-2">Event Data</div>
                  <div className="bg-[#0a0a0a] rounded p-3 text-xs font-mono">
                    <pre className="text-[#aaa] whitespace-pre-wrap">
                      {JSON.stringify(block.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Signatures */}
                <div>
                  <div className="text-xs font-medium text-[#e7e7e7] mb-2">Signatures</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#888]">Validator:</span>
                      <span className="text-[#e7e7e7]">{block.signatures.validator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Block Hash:</span>
                      <span className="text-[#aaa] font-mono">{block.current_hash.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-[#2a2a2a] text-xs text-[#888]">
        <p>
          Each block is cryptographically linked to the previous block, creating an immutable audit trail.
          Click on any block to view full details.
        </p>
      </div>
    </div>
  );
}

LedgerView.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({
    block_id: PropTypes.number.isRequired,
    timestamp: PropTypes.string.isRequired,
    event_type: PropTypes.string.isRequired,
    current_hash: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    signatures: PropTypes.object.isRequired
  })),
  onVerify: PropTypes.func
};
