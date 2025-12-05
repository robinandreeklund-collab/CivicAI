import { useState, useEffect, useCallback } from 'react';

/**
 * StreamingControl Component
 * 
 * Admin Dashboard component for controlling token streaming parameters.
 * Features:
 * - Real-time slider for token delay (0-500ms)
 * - Live preview of current setting
 * - API integration with /api/config/token-delay
 * 
 * Used in MonitoringDashboard or as standalone admin control.
 */

// Speed threshold constants for color coding
const SPEED_THRESHOLDS = {
  FAST: 10,      // 0-10ms = Fast (green)
  MEDIUM: 50,    // 11-50ms = Medium (yellow)
  SLOW: 100,     // 51-100ms = Slow (red)
};

// Default delay value in milliseconds
const DEFAULT_DELAY_MS = 30;

// Delay range limits
const DELAY_MIN = 0;
const DELAY_MAX = 500;

export default function StreamingControl() {
  const [tokenDelay, setTokenDelay] = useState(DEFAULT_DELAY_MS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch current token delay on mount
  useEffect(() => {
    const fetchTokenDelay = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/config/token-delay');
        if (response.ok) {
          const data = await response.json();
          setTokenDelay(data.delay_ms || DEFAULT_DELAY_MS);
        } else {
          console.error('Failed to fetch token delay');
        }
      } catch (err) {
        console.error('Error fetching token delay:', err);
        setError('Kunde inte hämta inställning');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenDelay();
  }, []);

  // Debounced save function
  const saveTokenDelay = useCallback(async (value) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/config/token-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay_ms: value }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date().toLocaleTimeString('sv-SE'));
        console.log('Token delay saved:', data);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Kunde inte spara');
      }
    } catch (err) {
      console.error('Error saving token delay:', err);
      setError('Nätverksfel');
    } finally {
      setSaving(false);
    }
  }, []);

  // Handle slider change with debounce
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setTokenDelay(value);
  };

  // Save on slider release (mouse up / touch end)
  const handleSliderRelease = () => {
    saveTokenDelay(tokenDelay);
  };

  // Get color based on delay value using threshold constants
  const getDelayColor = () => {
    if (tokenDelay <= SPEED_THRESHOLDS.FAST) return '#22c55e'; // Fast - green
    if (tokenDelay <= SPEED_THRESHOLDS.MEDIUM) return '#eab308'; // Medium - yellow
    return '#ef4444'; // Slow - red
  };

  // Get speed label using threshold constants
  const getSpeedLabel = () => {
    if (tokenDelay <= SPEED_THRESHOLDS.FAST) return 'Snabb';
    if (tokenDelay <= DEFAULT_DELAY_MS) return 'Normal';
    if (tokenDelay <= SPEED_THRESHOLDS.SLOW) return 'Långsam';
    return 'Mycket långsam';
  };

  if (loading) {
    return (
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">🌊 Streaming Control</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-[#666] font-mono text-sm">Laddar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#eee] font-mono text-lg">🌊 Streaming Control</h2>
        {saving && (
          <span className="text-[#888] font-mono text-xs animate-pulse">
            Sparar...
          </span>
        )}
        {lastSaved && !saving && (
          <span className="text-[#666] font-mono text-xs">
            Sparat {lastSaved}
          </span>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 border border-red-500/30 bg-red-900/20 rounded">
          <p className="text-red-400 font-mono text-sm">{error}</p>
        </div>
      )}
      
      {/* Token Delay Slider */}
      <div className="space-y-4">
        <div>
          <label className="block text-[#888] font-mono text-sm mb-3">
            Token Delay (ms)
          </label>
          
          {/* Current value display */}
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-2xl font-mono font-bold"
              style={{ color: getDelayColor() }}
            >
              {tokenDelay}ms
            </span>
            <span 
              className="text-sm font-mono px-2 py-1 rounded"
              style={{ 
                backgroundColor: `${getDelayColor()}20`,
                color: getDelayColor()
              }}
            >
              {getSpeedLabel()}
            </span>
          </div>
          
          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min={DELAY_MIN}
              max={DELAY_MAX}
              step="5"
              value={tokenDelay}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: getDelayColor(),
              }}
            />
            
            {/* Scale markers */}
            <div className="flex justify-between text-[#555] font-mono text-xs mt-1">
              <span>{DELAY_MIN}</span>
              <span>100</span>
              <span>200</span>
              <span>300</span>
              <span>400</span>
              <span>{DELAY_MAX}</span>
            </div>
          </div>
        </div>
        
        {/* Quick presets */}
        <div>
          <label className="block text-[#666] font-mono text-xs mb-2">
            Snabbval
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Instant', value: DELAY_MIN },
              { label: 'Fast', value: SPEED_THRESHOLDS.FAST },
              { label: 'Normal', value: DEFAULT_DELAY_MS },
              { label: 'Slow', value: SPEED_THRESHOLDS.SLOW },
              { label: 'Demo', value: 200 },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setTokenDelay(preset.value);
                  saveTokenDelay(preset.value);
                }}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                  tokenDelay === preset.value
                    ? 'bg-[#333] text-white border border-[#444]'
                    : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:bg-[#222] hover:text-[#aaa]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Info box */}
        <div className="p-4 border border-[#2a2a2a] rounded bg-[#0a0a0a]">
          <h4 className="text-[#888] font-mono text-sm mb-2">ℹ️ Information</h4>
          <div className="text-[#666] font-mono text-xs space-y-1">
            <p>• Styr fördröjning mellan tokens vid streaming på /7B-Zero</p>
            <p>• 0ms = instant (så snabbt som möjligt)</p>
            <p>• 30ms = normal läshastighet</p>
            <p>• 100-200ms = bra för demo/presentation</p>
            <p>• Ändringen gäller direkt för nya frågor</p>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for slider - uses template literal which re-evaluates on each render */}
      {/* This works because React re-renders the component when tokenDelay changes */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${getDelayColor()};
          cursor: pointer;
          box-shadow: 0 0 8px ${getDelayColor()}40;
          transition: box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 12px ${getDelayColor()}60;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${getDelayColor()};
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
