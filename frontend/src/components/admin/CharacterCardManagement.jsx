import { useState, useEffect } from 'react';

/**
 * Character Card Management Component
 * 
 * Manages OneSeek personality character cards (YAML files in frontend/public/characters/)
 * These are personality-specific prompts that define how each personality behaves.
 * 
 * Features:
 * - List all available character cards
 * - Edit character card content (name, system_prompt, traits, capabilities, etc.)
 * - Save changes back to YAML files
 * - Real-time validation
 * 
 * Location: Admin Dashboard > Character Cards tab
 */
export default function CharacterCardManagement() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state for editing
  const [formData, setFormData] = useState(null);

  // Fetch characters on mount
  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use relative URL - Vite proxy will route to correct backend (port 5000 or 3001)
      const response = await fetch('/api/system-prompts/characters/available');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCharacters(data.characters || []);
    } catch (err) {
      console.error('Failed to fetch characters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacterDetails = async (characterId) => {
    try {
      setError(null);
      
      // Use relative URL - Vite proxy will route to correct backend
      const response = await fetch(`/api/system-prompts/characters/${characterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSelectedCharacter(data);
      setFormData(data.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to load character details:', err);
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter || !formData) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Use relative URL - Vite proxy will route to correct backend
      const response = await fetch(
        `/api/system-prompts/characters/${selectedCharacter.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      setSuccess(result.message || 'Character card saved successfully!');
      setIsEditing(false);
      
      // Reload character to reflect changes
      await loadCharacterDetails(selectedCharacter.id);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save character:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedCharacter) {
      setFormData(selectedCharacter.data);
    }
    setIsEditing(false);
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-[#666] font-mono text-sm">Loading character cards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#eee] text-xl font-mono font-semibold">Character Cards</h2>
          <p className="text-[#666] text-sm font-mono mt-1">
            Edit personality-specific prompts (OneSeek-*.yaml files)
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded font-mono text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded font-mono text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character List */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-sm font-semibold">
                Available Characters ({characters.length})
              </h3>
            </div>
            
            <div className="divide-y divide-[#2a2a2a] max-h-[600px] overflow-y-auto">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => loadCharacterDetails(char.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#222] transition-colors ${
                    selectedCharacter?.id === char.id ? 'bg-[#222]' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{char.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#eee] font-mono text-sm font-medium truncate">
                        {char.name}
                      </div>
                      <div className="text-[#666] font-mono text-xs mt-1">
                        {char.description}
                      </div>
                      {char.personality_type && (
                        <div className="text-[#888] font-mono text-xs mt-1">
                          Type: {char.personality_type}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Character Editor */}
        <div className="lg:col-span-2">
          {!selectedCharacter ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
              <div className="text-[#666] font-mono text-sm">
                Select a character card to edit
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
              {/* Editor Header */}
              <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <h3 className="text-[#eee] font-mono text-sm font-semibold">
                    {formData?.name || 'Unnamed Character'}
                  </h3>
                  <p className="text-[#666] font-mono text-xs mt-1">
                    File: {selectedCharacter.filename}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono rounded transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-3 py-1.5 border border-[#2a2a2a] text-[#888] text-xs font-mono rounded hover:bg-[#222] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-mono rounded transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData?.name || ''}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData?.description || ''}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    System Prompt
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData?.system_prompt || ''}
                    onChange={(e) => updateFormField('system_prompt', e.target.value)}
                    disabled={!isEditing}
                    rows={15}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-xs leading-relaxed focus:outline-none focus:border-[#444] disabled:opacity-50 resize-y"
                  />
                  <p className="text-[#666] font-mono text-xs mt-1">
                    {formData?.system_prompt?.length || 0} characters
                  </p>
                </div>

                {/* Greeting */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Greeting
                  </label>
                  <textarea
                    value={formData?.greeting || ''}
                    onChange={(e) => updateFormField('greeting', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-xs leading-relaxed focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData?.icon || ''}
                    onChange={(e) => updateFormField('icon', e.target.value)}
                    disabled={!isEditing}
                    maxLength={2}
                    className="w-20 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>

                {/* Traits */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Traits (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(formData?.traits) ? formData.traits.join(', ') : ''}
                    onChange={(e) => updateFormField('traits', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    disabled={!isEditing}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-[#888] font-mono text-xs mb-2">
                    Keywords (comma-separated)
                  </label>
                  <textarea
                    value={Array.isArray(formData?.keywords) ? formData.keywords.join(', ') : ''}
                    onChange={(e) => updateFormField('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-xs leading-relaxed focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
