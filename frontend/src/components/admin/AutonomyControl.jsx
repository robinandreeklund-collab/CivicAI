import { useState, useEffect } from 'react';

/**
 * Autonomy Control Panel
 * 
 * Admin controls for OneSeek Autonomy Engine v3.3:
 * - Enable/disable autonomy
 * - Schedule configuration
 * - Threshold sliders
 * - Manual trigger
 */
export default function AutonomyControl() {
  const [config, setConfig] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  useEffect(() => {
    fetchConfig();
    fetchState();
    
    // Poll state every 10 seconds
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/autonomy/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching autonomy config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchState = async () => {
    try {
      const response = await fetch('/api/autonomy/state');
      if (response.ok) {
        const data = await response.json();
        setState(data.state);
      }
    } catch (error) {
      console.error('Error fetching autonomy state:', error);
    }
  };
  
  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const response = await fetch('/api/autonomy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const triggerCycle = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/autonomy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('Error triggering cycle:', error);
    } finally {
      setTriggering(false);
    }
  };
  
  if (loading || !config) {
    return (
      <div className="text-[#666] font-mono text-sm">Loading autonomy configuration...</div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-[#eee] text-lg font-mono font-semibold mb-2">
          Autonomy Engine v3.3
        </h3>
        <p className="text-[#666] text-sm font-mono">
          Self-governing autonomous training with triple-AI review and human oversight
        </p>
      </div>
      
      {/* Status */}
      {state && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#888] text-sm font-mono">Status</span>
            <span className={`text-sm font-mono ${
              state.running ? 'text-yellow-500' : 
              config.enabled ? 'text-green-500' : 'text-[#666]'
            }`}>
              {state.running ? '⚙️ Running' : 
               config.enabled ? '✓ Enabled' : '○ Disabled'}
            </span>
          </div>
          
          {state.nextRun && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm font-mono">Next Run</span>
              <span className="text-[#eee] text-sm font-mono">
                {new Date(state.nextRun).toLocaleString()}
              </span>
            </div>
          )}
          
          {state.lastRun && (
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm font-mono">Last Run</span>
              <span className="text-[#eee] text-sm font-mono">
                {new Date(state.lastRun).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Enable/Disable Toggle */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#eee] text-sm font-mono block mb-1">
              Autonomy Enabled
            </span>
            <span className="text-[#666] text-xs font-mono">
              Enable autonomous self-improvement cycles
            </span>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            disabled={saving}
            className={`px-4 py-2 text-sm font-mono border transition-colors ${
              config.enabled
                ? 'bg-green-900/20 border-green-700 text-green-500'
                : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#888]'
            } ${saving ? 'opacity-50' : 'hover:bg-[#1a1a1a]'}`}
          >
            {config.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* Schedule Configuration */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <span className="text-[#eee] text-sm font-mono block mb-3">Schedule</span>
        
        <div className="space-y-3">
          <div>
            <label className="text-[#888] text-xs font-mono block mb-1">
              Frequency
            </label>
            <select
              value={config.schedule}
              onChange={(e) => updateConfig({ schedule: e.target.value })}
              disabled={saving}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono px-3 py-2 rounded"
            >
              <option value="manual">Manual Only</option>
              <option value="nightly">Nightly (Automatic)</option>
              <option value="continuous">Continuous</option>
            </select>
          </div>
          
          {config.schedule === 'nightly' && (
            <div>
              <label className="text-[#888] text-xs font-mono block mb-1">
                Nightly Run Time (24h format)
              </label>
              <input
                type="time"
                value={config.scheduleTime}
                onChange={(e) => updateConfig({ scheduleTime: e.target.value })}
                disabled={saving}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono px-3 py-2 rounded"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Threshold Sliders */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <span className="text-[#eee] text-sm font-mono block mb-4">Thresholds</span>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#888] text-xs font-mono">
                Min Fidelity Score
              </label>
              <span className="text-[#eee] text-xs font-mono">
                {(config.minFidelityThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={config.minFidelityThreshold}
              onChange={(e) => updateConfig({ minFidelityThreshold: parseFloat(e.target.value) })}
              disabled={saving}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#888] text-xs font-mono">
                Approval Threshold (of 4 total)
              </label>
              <span className="text-[#eee] text-xs font-mono">
                {config.approvalThreshold}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="4"
              step="1"
              value={config.approvalThreshold}
              onChange={(e) => updateConfig({ approvalThreshold: parseInt(e.target.value) })}
              disabled={saving}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#888] text-xs font-mono">
                Max Dataset Size
              </label>
              <span className="text-[#eee] text-xs font-mono">
                {config.maxDatasetSize.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={config.maxDatasetSize}
              onChange={(e) => updateConfig({ maxDatasetSize: parseInt(e.target.value) })}
              disabled={saving}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#888] text-xs font-mono">
                Verification Questions
              </label>
              <span className="text-[#eee] text-xs font-mono">
                {config.verificationQuestions}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="50"
              value={config.verificationQuestions}
              onChange={(e) => updateConfig({ verificationQuestions: parseInt(e.target.value) })}
              disabled={saving}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Manual Trigger */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#eee] text-sm font-mono block mb-1">
              Manual Trigger
            </span>
            <span className="text-[#666] text-xs font-mono">
              Start an autonomous cycle immediately
            </span>
          </div>
          <button
            onClick={triggerCycle}
            disabled={triggering || state?.running}
            className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? 'Starting...' : state?.running ? 'Running' : 'Trigger Now'}
          </button>
        </div>
      </div>
      
      {/* External Reviewers */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <span className="text-[#eee] text-sm font-mono block mb-3">
          External AI Reviewers
        </span>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#888]">Google Gemini</span>
            <span className="text-green-500">✓ Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#888]">OpenAI GPT-4o</span>
            <span className="text-green-500">✓ Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#888]">DeepSeek</span>
            <span className="text-green-500">✓ Active</span>
          </div>
        </div>
        <p className="text-[#666] text-xs font-mono mt-3">
          All three reviewers must be available for autonomous cycles
        </p>
      </div>
    </div>
  );
}
