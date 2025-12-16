import { useState, useEffect } from 'react';

/**
 * InferenceSettings Component
 * 
 * Admin component for configuring inference parameters:
 * - outputMaxTokens: Maximum output tokens for responses
 * - contextWindow: Context window size
 * - webMaxChars: Maximum characters fetched by browse_page
 * - autoFollowUpSocionomen: Auto follow-up trigger for Socionomen
 */
export default function InferenceSettings() {
  const [settings, setSettings] = useState({
    outputMaxTokens: 1200,
    contextWindow: 16384,
    webMaxChars: 6000,
    autoFollowUpSocionomen: false,
  });
  
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setDefaults(data.defaults);
      } else {
        setError('Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSuccessMessage(`${key} updated successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Could not connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handleNumberChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setSettings(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    updateSetting(key, newValue);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-[#666]">
        <div className="animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-[18px] font-medium text-[#e7e7e7]">
          ⚙️ Inference Settings
        </h2>
        <p className="text-[13px] text-[#888]">
          Configure runtime parameters for AI inference and web fetching (in-memory)
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-lg text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Output Max Tokens */}
        <div className="space-y-3 p-5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
          <div>
            <label className="block text-[14px] font-medium text-[#e7e7e7] mb-1">
              Output Max Tokens
            </label>
            <p className="text-[12px] text-[#888] mb-3">
              Maximum output tokens for model responses (100-8192)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="100"
              max="8192"
              step="100"
              value={settings.outputMaxTokens}
              onChange={(e) => handleNumberChange('outputMaxTokens', e.target.value)}
              onBlur={() => updateSetting('outputMaxTokens', settings.outputMaxTokens)}
              className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-[14px] rounded focus:outline-none focus:border-[#4a4a4a]"
              disabled={saving}
            />
            <div className="text-[12px] text-[#666]">
              Default: {defaults.outputMaxTokens}
            </div>
          </div>
        </div>

        {/* Context Window */}
        <div className="space-y-3 p-5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
          <div>
            <label className="block text-[14px] font-medium text-[#e7e7e7] mb-1">
              Context Window
            </label>
            <p className="text-[12px] text-[#888] mb-3">
              Context window size (2048-32768). Note: Requires llama-server restart with -c flag
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="2048"
              max="32768"
              step="1024"
              value={settings.contextWindow}
              onChange={(e) => handleNumberChange('contextWindow', e.target.value)}
              onBlur={() => updateSetting('contextWindow', settings.contextWindow)}
              className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-[14px] rounded focus:outline-none focus:border-[#4a4a4a]"
              disabled={saving}
            />
            <div className="text-[12px] text-[#666]">
              Default: {defaults.contextWindow}
            </div>
          </div>
        </div>

        {/* Web Max Chars */}
        <div className="space-y-3 p-5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
          <div>
            <label className="block text-[14px] font-medium text-[#e7e7e7] mb-1">
              Web Max Characters
            </label>
            <p className="text-[12px] text-[#888] mb-3">
              Maximum characters fetched by browse_page (1000-20000)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1000"
              max="20000"
              step="1000"
              value={settings.webMaxChars}
              onChange={(e) => handleNumberChange('webMaxChars', e.target.value)}
              onBlur={() => updateSetting('webMaxChars', settings.webMaxChars)}
              className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#e7e7e7] text-[14px] rounded focus:outline-none focus:border-[#4a4a4a]"
              disabled={saving}
            />
            <div className="text-[12px] text-[#666]">
              Default: {defaults.webMaxChars}
            </div>
          </div>
        </div>

        {/* Auto Follow-up */}
        <div className="space-y-3 p-5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
          <div>
            <label className="block text-[14px] font-medium text-[#e7e7e7] mb-1">
              Auto Follow-up (Socionomen)
            </label>
            <p className="text-[12px] text-[#888] mb-3">
              Automatically trigger prejudikat follow-up for Socionomen
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggle('autoFollowUpSocionomen')}
              disabled={saving}
              className={`
                relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out
                ${settings.autoFollowUpSocionomen ? 'bg-green-600' : 'bg-[#2a2a2a]'}
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-200 ease-in-out
                  ${settings.autoFollowUpSocionomen ? 'transform translate-x-7' : ''}
                `}
              />
            </button>
            <div className="text-[14px] text-[#e7e7e7]">
              {settings.autoFollowUpSocionomen ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg space-y-2">
        <div className="text-[13px] text-blue-400 font-medium">ℹ️ Important Notes:</div>
        <ul className="text-[12px] text-[#888] space-y-1 ml-4 list-disc">
          <li><strong>outputMaxTokens</strong>: Used automatically when frontend sends default max_tokens (512)</li>
          <li><strong>contextWindow</strong>: Stored for future features, doesn't affect running llama-server (restart with -c flag needed)</li>
          <li><strong>webMaxChars</strong>: Applied to all browse_page fetches (Socionomen, etc.)</li>
          <li><strong>Settings are in-memory</strong>: Reset on server restart</li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchSettings}
          disabled={saving || loading}
          className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-sm hover:bg-[#252525] hover:border-[#3a3a3a] disabled:opacity-50 transition-colors rounded"
        >
          Refresh Settings
        </button>
      </div>
    </div>
  );
}
