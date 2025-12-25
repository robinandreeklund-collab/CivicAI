import { useState, useEffect } from 'react';

/**
 * Debate Prompt Management Component
 * 
 * Allows admins to edit all prompts used in the live debate system (/7b-zero).
 * Changes take effect immediately without code changes or restarts.
 * 
 * Manages 6 debate prompts:
 * 1. MAIN_DEBATE - ONESEEK's primary contributions (150-250 words)
 * 2. REASONING - Analysis after each response (80-120 words)
 * 3. INSIGHTS - Quick reactions (30-50 words, starts with 💡)
 * 4. ROUND_SUMMARY - 5 key learnings after each round
 * 5. VOTING - Voting format with 3 huvudpunkter
 * 6. CLOSING - 5-section structured closing (250-400 words)
 */
export default function DebatePromptManagement() {
  const [prompts, setPrompts] = useState({});
  const [temperatures, setTemperatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [savingTemperatures, setSavingTemperatures] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState({});
  const [temperatureSuccess, setTemperatureSuccess] = useState(false);
  
  const promptTypes = [
    {
      id: 'data_reasoning',
      name: 'DATA_REASONING_PROMPT',
      description: "ONESEEK's data analysis step - analyzes raw contribution and identifies data needs (with Tavily integration)",
      wordCount: '60-100 words',
      parameters: [
        '{clean_question}', '{round_num}', '{raw_contribution}',
        '{data_reasoning_context}', '{data_reasoning_previous_context}'
      ]
    },
    {
      id: 'round1_raw',
      name: 'ROUND_1_RAW_PROMPT',
      description: "ONESEEK's raw draft for round 1 (internal only, not shown to users)",
      wordCount: '150-250 words',
      parameters: [
        '{clean_question}', '{chain_so_far}', '{tavily_data}'
      ]
    },
    {
      id: 'round1',
      name: 'ROUND_1_FINAL_PROMPT',
      description: "ONESEEK's final opening position for round 1 (with raw draft + Tavily data)",
      wordCount: '150-300 words',
      parameters: [
        '{clean_question}', '{chain_so_far}', '{raw_contribution}', '{tavily_data}'
      ]
    },
    {
      id: 'round2_raw',
      name: 'ROUND_2_RAW_PROMPT',
      description: "ONESEEK's raw draft for round 2 (internal only, not shown to users)",
      wordCount: '150-250 words',
      parameters: [
        '{clean_question}', '{round_summaries_previous}',
        '{full_previous_round}', '{chain_so_far}',
        '{comments_chain_so_far}', '{insights_chain_so_far}', '{reasoning_chain_so_far}',
        '{tavily_data}'
      ]
    },
    {
      id: 'round2',
      name: 'ROUND_2_FINAL_PROMPT',
      description: "ONESEEK's final development and deepening for round 2 (with raw draft + Tavily data)",
      wordCount: '150-300 words',
      parameters: [
        '{clean_question}', '{round_summaries_previous}',
        '{full_previous_round}', '{chain_so_far}',
        '{comments_chain_so_far}', '{insights_chain_so_far}', '{reasoning_chain_so_far}',
        '{raw_contribution}', '{tavily_data}'
      ]
    },
    {
      id: 'final_raw',
      name: 'FINAL_RAW_PROMPT',
      description: "ONESEEK's raw draft for final round (internal only, not shown to users)",
      wordCount: '200-300 words',
      parameters: [
        '{clean_question}', '{round_summaries_previous}',
        '{full_previous_round}', '{chain_so_far}',
        '{comments_chain_so_far}', '{insights_chain_so_far}', '{reasoning_chain_so_far}',
        '{tavily_data}'
      ]
    },
    {
      id: 'final',
      name: 'FINAL_ROUND_FINAL_PROMPT',
      description: "ONESEEK's final structured answer for round 3 (with raw draft + Tavily data)",
      wordCount: '200-350 words',
      parameters: [
        '{clean_question}', '{round_summaries_previous}',
        '{full_previous_round}', '{chain_so_far}',
        '{comments_chain_so_far}', '{insights_chain_so_far}', '{reasoning_chain_so_far}',
        '{raw_contribution}', '{tavily_data}'
      ]
    },
    {
      id: 'comments',
      name: 'COMMENTS_PROMPT',
      description: 'Initial commentary after each external AI response',
      wordCount: '40-60 words (2-3 sentences)',
      parameters: [
        '{agent_name}', '{clean_question}', '{round_num}',
        '{agent_response}', '{previous_comments_context}'
      ]
    },
    {
      id: 'reasoning',
      name: 'REASONING_PROMPT (NOT USED)',
      description: 'Deep analysis after each external AI response - REMOVED from flow',
      wordCount: '80-120 words',
      parameters: [
        '{agent_name}', '{clean_question}', '{round_num}',
        '{agent_response}', '{previous_reasoning_context}'
      ]
    },
    {
      id: 'reasoning_own',
      name: 'REASONING_OWN_PROMPT',
      description: "ONESEEK's reasoning about its own answer (shown after OneSeek's answer)",
      wordCount: '80-120 words',
      parameters: [
        '{round_num}', '{clean_question}', '{oneseek_answer}',
        '{responses_in_round}', '{insights_from_round}'
      ]
    },
    {
      id: 'insights',
      name: 'INSIGHTS_PROMPT',
      description: 'Quick reactions (starts with 💡)',
      wordCount: '30-50 words (1-2 sentences)',
      parameters: [
        '{clean_question}', '{previous_agents_context_insight}',
        '{agent}', '{agent_response}', '{responses_so_far}',
        '{total_agents}', '{round_num}'
      ]
    },
    {
      id: 'round_summary',
      name: 'ROUND_SUMMARY_PROMPT',
      description: '5 key learnings after each round',
      wordCount: 'Max 15 words per bullet',
      parameters: [
        '{clean_question}', '{round_num}', '{max_rounds}',
        '{round_responses}', '{previous_summaries}'
      ]
    },
    {
      id: 'voting',
      name: 'VOTING_PROMPT',
      description: 'Voting format with 3 huvudpunkter',
      wordCount: 'Motivation: 1-2 sentences, 3 main points',
      parameters: [
        '{voter}', '{question}', '{responses}'
      ]
    },
    {
      id: 'closing',
      name: 'CLOSING_PROMPT',
      description: '5-section structured closing statement',
      wordCount: '250-400 words total',
      parameters: [
        '{clean_question}', '{winner}', '{winner_votes}',
        '{voting_motivations}'
      ]
    }
  ];

  useEffect(() => {
    fetchPrompts();
    fetchTemperatures();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/debate-prompts');
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemperatures = async () => {
    try {
      const response = await fetch('/api/admin/debate-temperatures');
      if (!response.ok) {
        throw new Error('Failed to fetch temperatures');
      }
      const data = await response.json();
      setTemperatures(data);
    } catch (err) {
      console.error('Error fetching temperatures:', err);
      // Set defaults if fetch fails
      setTemperatures({
        data_reasoning: 0.75,
        round1_raw: 0.8,
        round1: 0.7,
        round2_raw: 0.8,
        round2: 0.7,
        final_raw: 0.8,
        final: 0.7,
        comments: 0.8,
        reasoning: 0.75,
        reasoning_own: 0.75,
        insights: 0.85
      });
    }
  };

  const saveTemperatures = async () => {
    try {
      setSavingTemperatures(true);
      setTemperatureSuccess(false);
      
      const response = await fetch('/api/admin/debate-temperatures', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperatures })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to save temperatures');
      }
      
      setTemperatureSuccess(true);
      setTimeout(() => setTemperatureSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error saving temperatures:', err);
    } finally {
      setSavingTemperatures(false);
    }
  };

  const savePrompt = async (type) => {
    try {
      setSaving(prev => ({ ...prev, [type]: true }));
      setError(null);
      setSuccess(prev => ({ ...prev, [type]: false }));

      const response = await fetch(`/api/admin/debate-prompts/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompts[type] })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save prompt');
      }

      setSuccess(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, [type]: false }));
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [type]: false }));
    }
  };

  const handlePromptChange = (type, value) => {
    setPrompts(prev => ({ ...prev, [type]: value }));
  };

  if (loading) {
    return (
      <div className="text-[#666] font-mono text-sm">
        Loading debate prompts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-4">
        <h2 className="text-[#eee] text-xl font-mono font-semibold">
          Debate Prompt Management
        </h2>
        <p className="text-[#666] text-sm font-mono mt-2">
          Edit all prompts used in /7b-zero debates. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded font-mono text-sm">
          {error}
        </div>
      )}

      {/* Prompt Editors */}
      <div className="space-y-8">
        {promptTypes.map((promptType) => (
          <div
            key={promptType.id}
            className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-lg p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[#eee] text-lg font-mono font-semibold">
                  {promptType.name}
                </h3>
                <p className="text-[#666] text-sm font-mono mt-1">
                  {promptType.description}
                </p>
                <p className="text-[#888] text-xs font-mono mt-1">
                  Word count: {promptType.wordCount}
                </p>
              </div>
              {success[promptType.id] && (
                <div className="text-green-400 text-sm font-mono">
                  ✓ Saved
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3">
              <div className="text-[#888] text-xs font-mono mb-2">
                Available parameters:
              </div>
              <div className="flex flex-wrap gap-2">
                {promptType.parameters.map((param) => (
                  <code
                    key={param}
                    className="px-2 py-1 bg-[#0a0a0a] text-[#aaa] text-xs font-mono border border-[#2a2a2a] rounded"
                  >
                    {param}
                  </code>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={prompts[promptType.id] || ''}
              onChange={(e) => handlePromptChange(promptType.id, e.target.value)}
              className="w-full h-64 bg-[#1a1a1a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-4 rounded resize-y focus:outline-none focus:border-[#444]"
              placeholder={`Enter ${promptType.name}...`}
            />

            {/* Save Button */}
            <button
              onClick={() => savePrompt(promptType.id)}
              disabled={saving[promptType.id]}
              className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#eee] font-mono text-sm rounded hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving[promptType.id] ? 'Saving...' : `💾 Save ${promptType.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Temperature Settings */}
      <div className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[#eee] text-lg font-mono font-semibold">
              🌡️ Temperature Settings
            </h3>
            <p className="text-[#666] text-sm font-mono mt-1">
              Control creativity/randomness for each prompt type (0.0 = deterministic, 2.0 = very creative)
            </p>
          </div>
          {temperatureSuccess && (
            <div className="text-green-400 text-sm font-mono">
              ✓ Saved
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Data Reasoning Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Data Reasoning (60-100 words)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.data_reasoning || 0.75}
              onChange={(e) => setTemperatures({...temperatures, data_reasoning: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.75</p>
          </div>

          {/* Round 1 Raw Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 1 Raw (Internal Draft)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.round1_raw || 0.8}
              onChange={(e) => setTemperatures({...temperatures, round1_raw: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.8</p>
          </div>

          {/* Round 1 Final Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 1 Final (With Data)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.round1 || 0.7}
              onChange={(e) => setTemperatures({...temperatures, round1: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.7</p>
          </div>

          {/* Round 2 Raw Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 2 Raw (Internal Draft)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.round2_raw || 0.8}
              onChange={(e) => setTemperatures({...temperatures, round2_raw: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.8</p>
          </div>

          {/* Round 2 Final Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 2 Final (With Data)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.round2 || 0.7}
              onChange={(e) => setTemperatures({...temperatures, round2: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.7</p>
          </div>

          {/* Final Raw Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 3 Raw (Internal Draft)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.final_raw || 0.8}
              onChange={(e) => setTemperatures({...temperatures, final_raw: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.8</p>
          </div>

          {/* Final Round Final Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Round 3 Final (With Data)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.final || 0.7}
              onChange={(e) => setTemperatures({...temperatures, final: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.7</p>
          </div>

          {/* Comments Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Comments (40-60 words)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.comments || 0.8}
              onChange={(e) => setTemperatures({...temperatures, comments: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.8</p>
          </div>

          {/* Reasoning Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Reasoning (80-120 words)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.reasoning || 0.75}
              onChange={(e) => setTemperatures({...temperatures, reasoning: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.75</p>
          </div>

          {/* Reasoning Own Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Reasoning (Own Answer)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.reasoning_own || 0.75}
              onChange={(e) => setTemperatures({...temperatures, reasoning_own: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.75</p>
          </div>

          {/* Insights Temperature */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
            <label className="text-[#eee] text-sm font-mono block mb-2">
              Insights (💡 one-liner)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={temperatures.insights || 0.85}
              onChange={(e) => setTemperatures({...temperatures, insights: parseFloat(e.target.value)})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#eee] px-3 py-2 rounded font-mono text-sm focus:border-[#4a9eff] focus:outline-none"
            />
            <p className="text-[#666] text-xs font-mono mt-1">Default: 0.85</p>
          </div>
        </div>

        <button
          onClick={saveTemperatures}
          disabled={savingTemperatures}
          className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white px-6 py-2 rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {savingTemperatures ? 'Saving...' : 'Save All Temperatures'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-[#eee] font-mono font-semibold mb-3">
          ℹ️ How It Works
        </h3>
        <ul className="text-[#888] text-sm font-mono space-y-2 list-disc list-inside">
          <li>Prompts are stored in datasets/debate_prompts/prompts.json</li>
          <li>Changes take effect on next debate (or after ml_service reload)</li>
          <li>Previous versions are automatically backed up</li>
          <li>Use {'{curly_braces}'} for parameter placeholders</li>
          <li>Test changes on /7b-zero page with "Debatt ON" enabled</li>
        </ul>
      </div>
    </div>
  );
}
