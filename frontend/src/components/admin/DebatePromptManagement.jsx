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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState({});
  
  const promptTypes = [
    {
      id: 'main',
      name: 'MAIN_DEBATE_PROMPT',
      description: "ONESEEK's primary debate contributions",
      wordCount: '150-250 words',
      parameters: [
        '{clean_question}', '{round_num}', '{max_rounds}',
        '{round_summaries_context}', '{full_previous_round}',
        '{chain_so_far}', '{oneseek_previous_reasoning_and_insights}'
      ]
    },
    {
      id: 'reasoning',
      name: 'REASONING_PROMPT',
      description: 'Deep analysis after each external AI response',
      wordCount: '80-120 words',
      parameters: [
        '{agent_name}', '{clean_question}', '{round_num}',
        '{agent_response}', '{previous_reasoning_context}'
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
