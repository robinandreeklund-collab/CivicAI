import { useState, useEffect } from 'react';

/**
 * System Prompt Management Component
 * 
 * The active system prompt is automatically injected into every inference request,
 * ensuring the model always knows its identity and personality.
 * 
 * Features:
 * - Create, edit, delete system prompts
 * - Activate/deactivate prompts for chatbot inference
 * - 100% integration with model - prompt follows with every request
 * - No server restart required - changes take effect immediately
 * - Real-time chat testing
 * - Import character cards as prompts
 * - Force-Svenska triggers management
 * - Tavily Web Search triggers management (real-time facts)
 * - Time & Date awareness (always injected)
 * - Weather integration (SMHI)
 * 
 * How it works:
 * - Prompts are stored in datasets/system_prompts/ as JSON files
 * - The active prompt is read on every inference request
 * - Format: "[System Prompt]\n\nUser: [input]\n\nAssistant:"
 * - Force-Svenska: When trigger words are detected, model responds in Swedish only
 * - Tavily: When triggers detected, fetches real-time info from web
 */
export default function SystemPromptManagement() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [activePromptId, setActivePromptId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    language: 'sv',
    tags: []
  });

  // Chat testing state
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Character import state
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Force-Svenska state
  const [forceTriggers, setForceTriggers] = useState([]);
  const [forceTriggersInput, setForceTriggersInput] = useState('');
  const [forceSaving, setForceSaving] = useState(false);

  // Tavily Web Search state
  const [tavilyTriggers, setTavilyTriggers] = useState([]);
  const [tavilyTriggersInput, setTavilyTriggersInput] = useState('');
  const [tavilyBlacklist, setTavilyBlacklist] = useState([]);
  const [tavilyBlacklistInput, setTavilyBlacklistInput] = useState('');
  const [tavilySaving, setTavilySaving] = useState(false);
  const [tavilyApiKeySet, setTavilyApiKeySet] = useState(false);

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts();
    fetchAvailableCharacters();
    fetchForceSwedish();
    fetchTavilyTriggers();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Try ML service first (port 5000), fallback to backend
      let response;
      try {
        response = await fetch('http://localhost:5000/api/system-prompts');
      } catch {
        response = await fetch('/api/system-prompts');
      }
      
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
        setActivePromptId(data.active_prompt_id);
      } else {
        throw new Error('Failed to fetch prompts');
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Could not load system prompts. Ensure the ML service is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCharacters = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/system-prompts/characters/available');
      } catch {
        response = await fetch('/api/system-prompts/characters/available');
      }
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCharacters(data.characters || []);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  const fetchForceSwedish = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/force-swedish');
      } catch {
        response = await fetch('/api/force-swedish');
      }
      
      if (response.ok) {
        const data = await response.json();
        const triggers = data.triggers || [];
        setForceTriggers(triggers);
        setForceTriggersInput(triggers.join(', '));
      }
    } catch (err) {
      console.error('Error fetching Force-Svenska triggers:', err);
    }
  };

  const handleSaveForceSwedish = async () => {
    setForceSaving(true);
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/force-swedish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers: forceTriggersInput })
        });
      } catch {
        response = await fetch('/api/force-swedish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers: forceTriggersInput })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setForceTriggers(data.triggers || []);
        setSuccess(`Force-Svenska uppdaterad! ${data.count} triggers sparade.`);
      } else {
        throw new Error('Failed to save triggers');
      }
    } catch (err) {
      console.error('Error saving Force-Svenska triggers:', err);
      setError('Kunde inte spara Force-Svenska triggers');
    } finally {
      setForceSaving(false);
    }
  };

  const fetchTavilyTriggers = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/tavily-triggers');
      } catch {
        response = await fetch('/api/tavily-triggers');
      }
      
      if (response.ok) {
        const data = await response.json();
        const triggers = data.triggers || [];
        const blacklist = data.blacklist || [];
        setTavilyTriggers(triggers);
        setTavilyTriggersInput(triggers.join(', '));
        setTavilyBlacklist(blacklist);
        setTavilyBlacklistInput(blacklist.join(', '));
        setTavilyApiKeySet(data.api_key_set || false);
      }
    } catch (err) {
      console.error('Error fetching Tavily triggers:', err);
    }
  };

  const handleSaveTavilyTriggers = async () => {
    setTavilySaving(true);
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/tavily-triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            triggers: tavilyTriggersInput,
            blacklist: tavilyBlacklistInput 
          })
        });
      } catch {
        response = await fetch('/api/tavily-triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            triggers: tavilyTriggersInput,
            blacklist: tavilyBlacklistInput 
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setTavilyTriggers(data.triggers || []);
        setTavilyBlacklist(data.blacklist || []);
        setSuccess(`Tavily uppdaterad! ${data.trigger_count} triggers, ${data.blacklist_count} blacklist.`);
      } else {
        throw new Error('Failed to save triggers');
      }
    } catch (err) {
      console.error('Error saving Tavily triggers:', err);
      setError('Kunde inte spara Tavily triggers');
    } finally {
      setTavilySaving(false);
    }
  };

  const handleSyncCharacters = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/system-prompts/sync-characters', {
          method: 'POST'
        });
      } catch {
        response = await fetch('/api/system-prompts/sync-characters', {
          method: 'POST'
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.synced && data.synced.length > 0) {
          setSuccess(`Synced ${data.synced.length} character card(s) as system prompts!`);
        } else {
          setSuccess('All character cards are already synced.');
        }
        fetchPrompts();
        fetchAvailableCharacters();
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      console.error('Error syncing characters:', err);
      setError('Failed to sync character cards');
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      language: 'sv',
      tags: []
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPrompt(null);
  };

  const handleEdit = (prompt) => {
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      content: prompt.content,
      language: prompt.language || 'sv',
      tags: prompt.tags || []
    });
    setSelectedPrompt(prompt);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedPrompt(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      language: 'sv',
      tags: []
    });
  };

  const handleSave = async () => {
    // Validate form
    if (!formData.name.trim()) {
      setError('Prompt name is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Prompt content is required');
      return;
    }

    setSaving(true);
    try {
      let response;
      const url = isCreating 
        ? 'http://localhost:5000/api/system-prompts'
        : `http://localhost:5000/api/system-prompts/${selectedPrompt.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';
      
      try {
        response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch {
        // Fallback to backend proxy
        const fallbackUrl = isCreating 
          ? '/api/system-prompts'
          : `/api/system-prompts/${selectedPrompt.id}`;
        response = await fetch(fallbackUrl, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        await response.json();
        setSuccess(isCreating ? 'Prompt created successfully!' : 'Prompt updated successfully!');
        handleCancel();
        fetchPrompts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save prompt');
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError(err.message || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prompt) => {
    if (!confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      return;
    }

    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/system-prompts/${prompt.id}`, {
          method: 'DELETE'
        });
      } catch {
        response = await fetch(`/api/system-prompts/${prompt.id}`, {
          method: 'DELETE'
        });
      }

      if (response.ok) {
        setSuccess('Prompt deleted successfully!');
        fetchPrompts();
        if (selectedPrompt?.id === prompt.id) {
          handleCancel();
        }
      } else {
        throw new Error('Failed to delete prompt');
      }
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err.message || 'Failed to delete prompt');
    }
  };

  const handleActivate = async (prompt) => {
    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/system-prompts/${prompt.id}/activate`, {
          method: 'POST'
        });
      } catch {
        response = await fetch(`/api/system-prompts/${prompt.id}/activate`, {
          method: 'POST'
        });
      }

      if (response.ok) {
        setSuccess(`Activated: ${prompt.name}`);
        fetchPrompts();
      } else {
        throw new Error('Failed to activate prompt');
      }
    } catch (err) {
      console.error('Error activating prompt:', err);
      setError(err.message || 'Failed to activate prompt');
    }
  };

  const handleDeactivate = async (prompt) => {
    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/system-prompts/${prompt.id}/deactivate`, {
          method: 'POST'
        });
      } catch {
        response = await fetch(`/api/system-prompts/${prompt.id}/deactivate`, {
          method: 'POST'
        });
      }

      if (response.ok) {
        setSuccess('Prompt deactivated. Default prompt will be used.');
        fetchPrompts();
      } else {
        throw new Error('Failed to deactivate prompt');
      }
    } catch (err) {
      console.error('Error deactivating prompt:', err);
      setError(err.message || 'Failed to deactivate prompt');
    }
  };

  const handleImportCharacter = async (character) => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/system-prompts/import-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: character.id })
        });
      } catch {
        response = await fetch('/api/system-prompts/import-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: character.id })
        });
      }

      if (response.ok) {
        setSuccess(`Imported character: ${character.name}`);
        setShowImportModal(false);
        fetchPrompts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to import character');
      }
    } catch (err) {
      console.error('Error importing character:', err);
      setError(err.message || 'Failed to import character');
    }
  };

  const handleTestChat = async () => {
    if (!testMessage.trim()) return;

    setTestLoading(true);
    setTestResponse(null);

    try {
      // Use the inference endpoint with the active prompt
      let response;
      try {
        response = await fetch('http://localhost:5000/inference/oneseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: testMessage,
            max_length: 512,
            temperature: 0.7,
            top_p: 0.9
          })
        });
      } catch {
        response = await fetch('/api/oqt/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: testMessage })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setTestResponse({
          text: data.response || data.text || 'No response',
          model: data.model || 'OneSeek',
          latency: data.latency_ms || 0
        });
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      console.error('Error testing chat:', err);
      setTestResponse({
        text: 'Error: Could not get response. Ensure the ML service is running.',
        error: true
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#666] font-mono text-sm">Loading system prompts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="border border-blue-500/30 bg-blue-500/5 p-4 rounded">
        <p className="text-blue-300 font-mono text-sm">
          💡 System prompts are automatically injected into every inference request. 
          The model always knows its identity. Activate a prompt to use it.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded font-mono text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="border border-green-500/30 bg-green-500/10 text-green-400 p-4 rounded font-mono text-sm">
          {success}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-[#eee] font-mono text-lg">System Prompts</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncCharacters}
            disabled={loading}
            className="px-4 py-2 border border-purple-500/30 text-purple-300 text-sm font-mono hover:bg-purple-500/10 transition-colors disabled:opacity-50"
            title="Sync all character cards as system prompts"
          >
            🔄 Synka Character Cards
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
            title="Import a specific character card"
          >
            Import Character
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#3a3a3a] transition-colors"
          >
            + New Prompt
          </button>
        </div>
      </div>

      {/* Character Cards Section */}
      {availableCharacters.length > 0 && (
        <div className="border border-[#2a2a2a] bg-[#111] p-4 rounded">
          <h3 className="text-[#eee] font-mono text-base mb-3">
            🎭 Character Cards ({availableCharacters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableCharacters.map((char) => (
              <div
                key={char.id}
                className={`p-3 rounded border transition-colors ${
                  char.is_active 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : char.is_synced 
                      ? 'border-[#2a2a2a] bg-[#0a0a0a]' 
                      : 'border-yellow-500/30 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{char.icon || '🤖'}</span>
                  <span className="text-[#eee] font-mono text-sm font-medium">{char.name}</span>
                </div>
                <p className="text-[#666] font-mono text-xs mb-2 line-clamp-2">{char.description || 'No description available'}</p>
                <div className="flex items-center gap-2">
                  {char.is_active && (
                    <span className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded font-mono">
                      ACTIVE
                    </span>
                  )}
                  {char.is_synced && !char.is_active && (
                    <span className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] text-[#666] rounded font-mono">
                      SYNCED
                    </span>
                  )}
                  {!char.is_synced && (
                    <span className="px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded font-mono">
                      NOT SYNCED
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] text-[#555] rounded font-mono">
                    {char.personality_type}
                  </span>
                </div>
                {char.is_synced && !char.is_active && (
                  <button
                    onClick={() => handleActivate({ id: char.synced_prompt_id, name: char.name })}
                    className="mt-2 w-full px-2 py-1 text-xs border border-green-500/30 text-green-400 font-mono hover:bg-green-500/10 transition-colors rounded"
                  >
                    Aktivera
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Force-Svenska Triggers Section */}
      <div className="border border-blue-500/30 bg-blue-500/5 p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#eee] font-mono text-base flex items-center gap-2">
              🇸🇪 Force-Svenska Triggers
            </h3>
            <p className="text-[#666] font-mono text-xs mt-1">
              När ett trigger-ord hittas i användarens meddelande svarar OneSeek alltid på svenska.
              Ändra listan och klicka Spara – ingen omstart behövs!
            </p>
          </div>
          <span className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded font-mono">
            {forceTriggers.length} triggers
          </span>
        </div>
        
        <textarea
          value={forceTriggersInput}
          onChange={(e) => setForceTriggersInput(e.target.value)}
          className="w-full h-32 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-blue-500/50 resize-y"
          placeholder="hej, vad, vem, hur, varför, när, kan du, är du, vill du, ska vi, tack, snälla..."
        />
        <p className="text-[#555] font-mono text-xs mt-2 mb-3">
          Skriv triggers separerade med komma. Exempel: &quot;hej, vad gör du, tjena, läget&quot;
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveForceSwedish}
            disabled={forceSaving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-mono hover:bg-blue-700 transition-colors disabled:opacity-50 rounded"
          >
            {forceSaving ? 'Sparar...' : '💾 Spara & Aktivera direkt'}
          </button>
          <button
            onClick={() => {
              setForceTriggersInput(forceTriggers.join(', '));
            }}
            className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors rounded"
          >
            Återställ
          </button>
        </div>
        
        {/* Preview of current triggers */}
        {forceTriggers.length > 0 && (
          <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
            <p className="text-[#666] font-mono text-xs mb-2">Aktiva triggers:</p>
            <div className="flex flex-wrap gap-1">
              {forceTriggers.slice(0, 20).map((trigger, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-300 rounded font-mono">
                  {trigger}
                </span>
              ))}
              {forceTriggers.length > 20 && (
                <span className="px-2 py-0.5 text-xs bg-[#1a1a1a] text-[#666] rounded font-mono">
                  +{forceTriggers.length - 20} fler
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tavily Web Search Triggers Section */}
      <div className="border border-green-500/30 bg-green-500/5 p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#eee] font-mono text-base flex items-center gap-2">
              🔍 Tavily Web Search Triggers
            </h3>
            <p className="text-[#666] font-mono text-xs mt-1">
              Hämtar realtidsfakta från webben när trigger-ord hittas. Blacklist förhindrar sökning 
              för identitetsfrågor. Kräver TAVILY_API_KEY i miljövariabler.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs rounded font-mono ${
              tavilyApiKeySet 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              API Key: {tavilyApiKeySet ? '✓ SET' : '✗ NOT SET'}
            </span>
            <span className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded font-mono">
              {tavilyTriggers.length} triggers
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#888] font-mono text-sm mb-2">Triggers (aktiverar sökning)</label>
            <textarea
              value={tavilyTriggersInput}
              onChange={(e) => setTavilyTriggersInput(e.target.value)}
              className="w-full h-24 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-green-500/50 resize-y"
              placeholder="vad säger, aktuell, senaste, 2025, hände, ny lag..."
            />
          </div>
          <div>
            <label className="block text-[#888] font-mono text-sm mb-2">Blacklist (förhindrar sökning)</label>
            <textarea
              value={tavilyBlacklistInput}
              onChange={(e) => setTavilyBlacklistInput(e.target.value)}
              className="w-full h-24 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-red-500/50 resize-y"
              placeholder="vem är du, vad heter du, berätta om dig..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTavilyTriggers}
            disabled={tavilySaving}
            className="px-6 py-2 bg-green-600 text-white text-sm font-mono hover:bg-green-700 transition-colors disabled:opacity-50 rounded"
          >
            {tavilySaving ? 'Sparar...' : '💾 Spara Tavily-inställningar'}
          </button>
          <button
            onClick={() => {
              setTavilyTriggersInput(tavilyTriggers.join(', '));
              setTavilyBlacklistInput(tavilyBlacklist.join(', '));
            }}
            className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors rounded"
          >
            Återställ
          </button>
        </div>
        
        {/* Info about always-on features */}
        <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
          <p className="text-[#666] font-mono text-xs mb-2">🕐 Alltid aktivt:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-300 rounded font-mono">
              📅 Tid & Datum (injiceras alltid)
            </span>
            <span className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-300 rounded font-mono">
              🌤️ Väder (SMHI) vid väderfrågor
            </span>
          </div>
        </div>
      </div>

      {/* Link to Integrations Tab */}
      <div className="border border-purple-500/30 bg-purple-500/5 p-4 rounded">
        <p className="text-purple-300 font-mono text-sm">
          🔌 Hantera externa API-integrationer (Städer, RSS, Öppna Data) i fliken <strong>Integrations</strong> ovan.
        </p>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h3 className="text-[#eee] font-mono text-base mb-4">
            {isCreating ? 'Create New Prompt' : 'Edit Prompt'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-[#444]"
                placeholder="e.g., Civic Assistant"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-[#444]"
                placeholder="Brief description of this prompt's purpose"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-3 rounded focus:outline-none focus:border-[#444]"
              >
                <option value="sv">Swedish (sv)</option>
                <option value="en">English (en)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">System Prompt Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-64 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-[#444] resize-y"
                placeholder="Enter the system prompt that defines the AI's personality and behavior..."
              />
              <p className="text-[#555] font-mono text-xs mt-1">
                {formData.content.length}/50000 characters
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isCreating ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompts List */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h3 className="text-[#eee] font-mono text-base mb-4">
          Available Prompts ({prompts.length})
        </h3>

        {prompts.length === 0 ? (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            No system prompts created yet. Click &quot;New Prompt&quot; to create one, or the default prompt will be used.
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`border p-4 rounded transition-colors ${
                  prompt.is_active 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-[#2a2a2a] hover:border-[#444]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[#eee] font-mono text-sm font-medium">
                        {prompt.name}
                      </span>
                      {prompt.is_active && (
                        <span className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded font-mono">
                          ACTIVE
                        </span>
                      )}
                      {prompt.tags && prompt.tags.includes('character-card') && (
                        <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded font-mono">
                          🎭 CHARACTER
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] rounded font-mono">
                        {prompt.language || 'sv'}
                      </span>
                    </div>
                    {prompt.description && (
                      <p className="text-[#666] font-mono text-xs mb-2">{prompt.description}</p>
                    )}
                    <p className="text-[#555] font-mono text-xs">
                      Updated: {new Date(prompt.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {prompt.is_active ? (
                      <button
                        onClick={() => handleDeactivate(prompt)}
                        className="px-3 py-1 border border-yellow-500/30 text-yellow-400 text-xs font-mono hover:bg-yellow-500/10 transition-colors"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(prompt)}
                        className="px-3 py-1 border border-green-500/30 text-green-400 text-xs font-mono hover:bg-green-500/10 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prompt)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#666] text-xs font-mono hover:bg-[#1a1a1a] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Preview of prompt content */}
                <div className="mt-3 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                  <pre className="text-[#666] font-mono text-xs whitespace-pre-wrap line-clamp-3">
                    {prompt.content.substring(0, 300)}
                    {prompt.content.length > 300 && '...'}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Testing Section */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h3 className="text-[#eee] font-mono text-base mb-4">Test Active Prompt</h3>
        <p className="text-[#666] font-mono text-xs mb-4">
          Test how the active system prompt affects the AI&apos;s responses.
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-[#444]"
              placeholder="Type a test message..."
              disabled={testLoading}
            />
            <button
              onClick={handleTestChat}
              disabled={testLoading || !testMessage.trim()}
              className="px-4 py-2 bg-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
            >
              {testLoading ? 'Testing...' : 'Send'}
            </button>
          </div>

          {testResponse && (
            <div className={`p-4 rounded border ${
              testResponse.error 
                ? 'border-red-500/30 bg-red-500/5' 
                : 'border-[#2a2a2a] bg-[#0a0a0a]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#888] font-mono text-xs">
                  {testResponse.model || 'Response'}
                </span>
                {testResponse.latency > 0 && (
                  <span className="text-[#555] font-mono text-xs">
                    {testResponse.latency.toFixed(0)}ms
                  </span>
                )}
              </div>
              <p className={`font-mono text-sm whitespace-pre-wrap ${
                testResponse.error ? 'text-red-400' : 'text-[#eee]'
              }`}>
                {testResponse.text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Import Character Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">Import Character Card</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {availableCharacters.length === 0 ? (
                <p className="text-[#666] font-mono text-sm text-center py-8">
                  No character cards found. Add character YAML files to frontend/public/characters/
                </p>
              ) : (
                <div className="space-y-3">
                  {availableCharacters.map((char) => (
                    <div
                      key={char.id}
                      className="border border-[#2a2a2a] p-4 rounded hover:border-[#444] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[#eee] font-mono text-sm mb-1">{char.name}</div>
                          <div className="text-[#666] font-mono text-xs">{char.description}</div>
                          {!char.has_system_prompt && (
                            <div className="text-yellow-500/80 font-mono text-xs mt-1">
                              ⚠ No system_prompt defined
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleImportCharacter(char)}
                          disabled={!char.has_system_prompt}
                          className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
