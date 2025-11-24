import { useState, useEffect } from 'react';

/**
 * Golden Checkpoint Approval
 * 
 * Admin interface for approving autonomous training cycles with Ed25519 signatures
 */
export default function GoldenCheckpoint() {
  const [pendingCheckpoints, setPendingCheckpoints] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showKeyGen, setShowKeyGen] = useState(false);
  
  useEffect(() => {
    fetchPendingCheckpoints();
    fetchCycles();
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCheckpoints();
      fetchCycles();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchPendingCheckpoints = async () => {
    try {
      const response = await fetch('/api/autonomy/pending-checkpoints');
      if (response.ok) {
        const data = await response.json();
        setPendingCheckpoints(data.pending || []);
      }
    } catch (error) {
      console.error('Error fetching pending checkpoints:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCycles = async () => {
    try {
      const response = await fetch('/api/autonomy/cycles');
      if (response.ok) {
        const data = await response.json();
        setCycles(data.cycles || []);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };
  
  const generateKeys = async () => {
    try {
      const response = await fetch('/api/autonomy/checkpoint/generate-keys', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecretKey(data.secretKey);
        setPublicKey(data.publicKey);
        alert('Keys generated! Store your secret key securely.');
      }
    } catch (error) {
      console.error('Error generating keys:', error);
    }
  };
  
  const signCycle = async (cycleId) => {
    if (!secretKey) {
      alert('Please enter your secret key or generate new keys');
      return;
    }
    
    try {
      const response = await fetch('/api/autonomy/checkpoint/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, secretKey }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSignature(data.signature);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Signing failed');
      }
    } catch (error) {
      console.error('Error signing cycle:', error);
      alert(`Failed to sign cycle: ${error.message}\n\nPlease verify:\n- Secret key is correct\n- Secret key is in hex format\n- No extra whitespace in key`);
    }
  };
  
  const approveCheckpoint = async (cycleId) => {
    if (!signature || !publicKey) {
      alert('Please sign the cycle first');
      return;
    }
    
    setApproving(true);
    try {
      const response = await fetch('/api/autonomy/checkpoint/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId,
          signature,
          publicKey,
        }),
      });
      
      if (response.ok) {
        alert('Golden checkpoint approved!');
        setSignature('');
        setSelectedCycle(null);
        await fetchPendingCheckpoints();
        await fetchCycles();
      } else {
        const error = await response.json();
        alert(`Approval failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving checkpoint:', error);
      alert('Failed to approve checkpoint');
    } finally {
      setApproving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-[#666] font-mono text-sm">Loading checkpoints...</div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-[#eee] text-lg font-mono font-semibold mb-2">
          Golden Checkpoint Approval
        </h3>
        <p className="text-[#666] text-sm font-mono">
          Human oversight with Ed25519 cryptographic verification
        </p>
      </div>
      
      {/* Pending Checkpoints */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#eee] text-sm font-mono">Pending Approvals</span>
          <span className="text-[#888] text-xs font-mono">
            {pendingCheckpoints.length} awaiting
          </span>
        </div>
        
        {pendingCheckpoints.length === 0 ? (
          <p className="text-[#666] text-sm font-mono">No pending checkpoints</p>
        ) : (
          <div className="space-y-3">
            {pendingCheckpoints.map((cycle) => (
              <div
                key={cycle.id}
                className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#eee] text-sm font-mono">{cycle.id}</span>
                  <span className="text-[#666] text-xs font-mono">
                    {new Date(cycle.endTime).toLocaleString()}
                  </span>
                </div>
                
                {cycle.stages?.approval && (
                  <div className="text-xs font-mono text-[#888] mb-2">
                    Approvals: {cycle.stages.approval.totalApprovals}/{cycle.stages.approval.threshold}
                  </div>
                )}
                
                {cycle.stages?.verification && (
                  <div className="text-xs font-mono text-[#888] mb-3">
                    Fidelity: {(cycle.stages.verification.fidelityScore * 100).toFixed(1)}%
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedCycle(cycle)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
                >
                  Review & Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Key Management */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#eee] text-sm font-mono">Ed25519 Keys</span>
          <button
            onClick={() => setShowKeyGen(!showKeyGen)}
            className="text-[#888] text-xs font-mono hover:text-[#eee]"
          >
            {showKeyGen ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showKeyGen && (
          <div className="space-y-3">
            <div>
              <label className="text-[#888] text-xs font-mono block mb-1">
                Secret Key (keep private)
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your secret key or generate new"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-xs font-mono px-3 py-2 rounded"
              />
            </div>
            
            <div>
              <label className="text-[#888] text-xs font-mono block mb-1">
                Public Key
              </label>
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Public key"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-xs font-mono px-3 py-2 rounded"
              />
            </div>
            
            <button
              onClick={generateKeys}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
            >
              Generate New Key Pair
            </button>
          </div>
        )}
      </div>
      
      {/* Cycle Details & Approval */}
      {selectedCycle && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#eee] text-sm font-mono">Cycle Details</span>
            <button
              onClick={() => setSelectedCycle(null)}
              className="text-[#888] text-xs font-mono hover:text-[#eee]"
            >
              Close
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            <div>
              <span className="text-[#888] text-xs font-mono block mb-1">Cycle ID</span>
              <span className="text-[#eee] text-sm font-mono">{selectedCycle.id}</span>
            </div>
            
            <div>
              <span className="text-[#888] text-xs font-mono block mb-1">Status</span>
              <span className="text-yellow-500 text-sm font-mono">
                {selectedCycle.status}
              </span>
            </div>
            
            {selectedCycle.stages?.verification && (
              <div>
                <span className="text-[#888] text-xs font-mono block mb-1">Fidelity Score</span>
                <span className="text-[#eee] text-sm font-mono">
                  {(selectedCycle.stages.verification.fidelityScore * 100).toFixed(1)}%
                </span>
              </div>
            )}
            
            {selectedCycle.stages?.approval && (
              <div>
                <span className="text-[#888] text-xs font-mono block mb-1">Approvals</span>
                <div className="text-sm font-mono">
                  {Object.entries(selectedCycle.stages.approval.details.external).map(([reviewer, approved]) => (
                    <div key={reviewer} className="flex items-center justify-between">
                      <span className="text-[#888]">{reviewer}</span>
                      <span className={approved ? 'text-green-500' : 'text-red-500'}>
                        {approved ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-[#888]">Internal</span>
                    <span className={selectedCycle.stages.approval.details.internal ? 'text-green-500' : 'text-red-500'}>
                      {selectedCycle.stages.approval.details.internal ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {!signature && (
              <button
                onClick={() => signCycle(selectedCycle.id)}
                disabled={!secretKey}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
              >
                Sign with Ed25519
              </button>
            )}
            
            {signature && (
              <>
                <div>
                  <label className="text-[#888] text-xs font-mono block mb-1">
                    Signature
                  </label>
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-xs font-mono px-3 py-2 rounded break-all">
                    {signature}
                  </div>
                </div>
                
                <button
                  onClick={() => approveCheckpoint(selectedCycle.id)}
                  disabled={approving}
                  className="w-full px-4 py-2 bg-green-900/20 border border-green-700 text-green-500 text-sm font-mono hover:bg-green-900/30 transition-colors disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve Golden Checkpoint'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Cycles */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <span className="text-[#eee] text-sm font-mono block mb-3">Recent Cycles</span>
        
        {cycles.length === 0 ? (
          <p className="text-[#666] text-sm font-mono">No cycles yet</p>
        ) : (
          <div className="space-y-2">
            {cycles.slice(0, 5).map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between text-xs font-mono"
              >
                <span className="text-[#888]">{cycle.id}</span>
                <span className={
                  cycle.status === 'approved' ? 'text-green-500' :
                  cycle.status === 'awaiting_checkpoint' ? 'text-yellow-500' :
                  cycle.status === 'failed' ? 'text-red-500' : 'text-[#666]'
                }>
                  {cycle.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
