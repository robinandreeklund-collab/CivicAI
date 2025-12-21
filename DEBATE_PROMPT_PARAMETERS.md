# Debate Prompt Parameters - Complete Reference

This document lists ALL available parameters that can be used in debate prompts and exactly how to use them.

## How to Use Parameters

Parameters are placeholders in your prompt templates that get replaced with actual values during the debate. They use the format `{parameter_name}`.

**Example:**
```
You are analyzing {agent_name}'s response in round {round_num}.
Question: {clean_question}
```

When used, this becomes:
```
You are analyzing GPT's response in round 2.
Question: What should Sweden do about climate change?
```

## Available Parameters by Prompt Type

### 1. COMMENTS PROMPT
**Purpose:** Initial commentary after each external AI response (40-60 words)

**Available Parameters:**
- `{agent_name}` - Name of the AI being analyzed (e.g., "GPT", "GEMINI", "DEEPSEEK", "GROK")
- `{clean_question}` - The debate question without [debatt] prefix
- `{round_num}` - Current round number (1, 2, or 3)
- `{agent_response}` - The external AI's response text (truncated to first 300 chars for context)
- `{previous_comments_context}` - Previous comments from earlier in this round (formatted as bullet list)

**Usage Example:**
```
Du är ONESEEK. Kommentera kortfattat {agent_name}s svar i runda {round_num}.

Fråga: {clean_question}

{agent_name}s svar:
{agent_response}

Tidigare kommentarer denna runda:
{previous_comments_context}

Din kommentar (40-60 ord):
```

---

### 2. INSIGHTS PROMPT
**Purpose:** Quick, sharp observation (💡 one-liner, 15-25 words)

**Available Parameters:**
- `{clean_question}` - The debate question
- `{agent_name}` - Name of the AI being analyzed
- `{responses_so_far}` - Number of responses received so far (e.g., "2")
- `{total_agents}` - Total number of agents participating (e.g., "4")
- `{round_num}` - Current round number
- `{agent_response}` - The external AI's response text (truncated to first 250 chars)

**Usage Example:**
```
💡 Snabb insikt om {agent_name}s svar:

Fråga: {clean_question}
Runda: {round_num}
Progress: {responses_so_far}/{total_agents}

{agent_name}: {agent_response}

Din insight (börja med 💡, max 25 ord):
```

---

### 3. ROUND 1 PROMPT
**Purpose:** OneSeek's own answer in round 1 - Establish strong position (150-250 words)

**Available Parameters:**
- `{clean_question}` - The debate question
- `{round_num}` - Current round number (will be "1")
- `{max_rounds}` - Total number of rounds (typically "3")
- `{round_summaries_context}` - Summaries from previous rounds (empty in round 1)
- `{full_previous_round}` - Complete previous round conversation (empty in round 1)
- `{chain_so_far}` - All responses collected so far in current round
- `{oneseek_previous_reasoning_and_insights}` - OneSeek's previous comments and insights from this round

**Usage Example:**
```
RUNDA {round_num}/{max_rounds}

FRÅGA: {clean_question}

ANDRA AI-SVAR HITTILLS:
{chain_so_far}

DINA OBSERVATIONER HITTILLS:
{oneseek_previous_reasoning_and_insights}

UPPGIFT: Etablera din position (150-250 ord). Tydlig ståndpunkt + kärnargument + exempel.

DITT SVAR:
```

---

### 4. ROUND 2 PROMPT
**Purpose:** OneSeek's own answer in round 2 - Develop and deepen (150-250 words)

**Available Parameters:**
- `{clean_question}` - The debate question
- `{round_num}` - Current round number (will be "2")
- `{max_rounds}` - Total number of rounds (typically "3")
- `{round_summaries_context}` - Summaries from previous rounds
- `{full_previous_round}` - Complete previous round conversation
- `{chain_so_far}` - All responses collected so far in current round
- `{oneseek_previous_reasoning_and_insights}` - OneSeek's previous comments and insights from this round

**Usage Example:**
```
RUNDA {round_num}/{max_rounds}

FRÅGA: {clean_question}

FÖREGÅENDE RUNDA:
{round_summaries_context}

NYA SVAR DENNA RUNDA:
{chain_so_far}

DINA OBSERVATIONER:
{oneseek_previous_reasoning_and_insights}

UPPGIFT: Utveckla din position från runda 1. Bygg röd tråd (150-250 ord).

DITT SVAR:
```

---

### 5. FINAL (ROUND 3) PROMPT
**Purpose:** OneSeek's own answer in round 3 - Structured conclusion (200-300 words)

**Available Parameters:**
- `{clean_question}` - The debate question
- `{round_num}` - Current round number (will be "3")
- `{max_rounds}` - Total number of rounds (typically "3")
- `{round_summaries_context}` - Summaries from all previous rounds
- `{full_previous_round}` - Complete previous round conversation
- `{chain_so_far}` - All responses collected so far in current round
- `{oneseek_previous_reasoning_and_insights}` - OneSeek's previous comments and insights from this round

**Usage Example:**
```
FINAL RUNDA {round_num}/{max_rounds}

FRÅGA: {clean_question}

HELA DEBATTRESAN:
{round_summaries_context}

SENASTE ARGUMENTEN:
{chain_so_far}

DINA SLUTOBSERVATIONER:
{oneseek_previous_reasoning_and_insights}

UPPGIFT: Strukturerad slutsats (200-300 ord):
1. Öppning (1-2 meningar)
2. Resa-genomgång (referera runda 1-2)
3. Slutgiltig position (~150 ord)
4. Rekommendation (2-3 meningar)
5. Minnesvärd avslutning (1 mening)

DITT SLUTSVAR:
```

---

### 6. ROUND SUMMARY PROMPT
**Purpose:** Summarize a round after all responses (internal use)

**Available Parameters:**
- `{clean_question}` - The debate question
- `{round_num}` - Which round to summarize
- `{responses}` - All responses from that round formatted as "AGENT: text\n\n"

**Usage Example:**
```
Sammanfatta runda {round_num} av debatten:

FRÅGA: {clean_question}

SVAR:
{responses}

Din sammanfattning (50-100 ord):
```

---

### 7. VOTING PROMPT
**Purpose:** Each AI votes for best answer (internal use)

**Available Parameters:**
- `{voter}` - Name of the AI doing the voting (e.g., "GPT")
- `{clean_question}` - The debate question
- `{all_responses}` - All final answers formatted as "AGENT: answer\n\n"

**Usage Example:**
```
Du är {voter}. Rösta på bästa svaret:

FRÅGA: {clean_question}

ALLA SVAR:
{all_responses}

Ditt svar format: [AGENT]
Motivering:
```

---

## Parameter Behavior Notes

### Text Truncation
Some parameters truncate long text for context efficiency:
- `{agent_response}` in COMMENTS: First 300 characters
- `{agent_response}` in INSIGHTS: First 250 characters

### Fallback Values
When a parameter has no data, it uses fallback text:
- `{previous_comments_context}`: "(Första kommentaren)" if empty
- `{round_summaries_context}`: "(Ingen föregående runda än)" if empty
- `{full_previous_round}`: "(Ingen föregående runda än)" if empty
- `{oneseek_previous_reasoning_and_insights}`: "(Inga tidigare kommentarer i denna runda än)" if empty

### Formatting
- `{agent_name}` is automatically uppercased (GPT, not gpt)
- `{responses_so_far}` and `{total_agents}` are numbers as strings
- `{round_num}` and `{max_rounds}` are numbers as strings

---

## Complete Parameter List (Alphabetical)

| Parameter | Type | Used In | Description |
|-----------|------|---------|-------------|
| `{agent_name}` | String | comments, insights | Uppercase AI name (GPT, GEMINI, DEEPSEEK, GROK) |
| `{agent_response}` | String | comments, insights | External AI's response (may be truncated) |
| `{all_responses}` | String | voting | All final answers in debate |
| `{chain_so_far}` | String | round1, round2, final | All responses in current round so far |
| `{clean_question}` | String | ALL | Debate question without [debatt] prefix |
| `{full_previous_round}` | String | round1, round2, final | Complete previous round conversation |
| `{max_rounds}` | String | round1, round2, final | Total rounds (typically "3") |
| `{oneseek_previous_reasoning_and_insights}` | String | round1, round2, final | OneSeek's comments + insights this round |
| `{previous_comments_context}` | String | comments | Previous comments from this round |
| `{responses}` | String | round_summary | All responses in a round |
| `{responses_so_far}` | String | insights | Number of responses received |
| `{round_num}` | String | ALL | Current round number ("1", "2", or "3") |
| `{round_summaries_context}` | String | round1, round2, final | Summaries of previous rounds |
| `{total_agents}` | String | insights | Total number of participating agents |
| `{voter}` | String | voting | Uppercase name of voting AI |

---

## Important Rules

1. **Always use exact spelling** - Parameters are case-sensitive: `{clean_question}` not `{Clean_Question}`
2. **Curly braces required** - Use `{parameter}` not `parameter` or `<parameter>`
3. **No spaces** - `{round_num}` not `{ round_num }`
4. **Unknown parameters ignored** - Misspelled parameters won't be replaced
5. **Not all parameters available everywhere** - Check "Used In" column above

---

## Examples of Good Prompts

### Good Comments Prompt:
```
Analysera {agent_name}s svar:

{agent_response}

Kontext: {previous_comments_context}

Kommentar (40-60 ord):
```

### Good Insights Prompt:
```
💡 {agent_name} i runda {round_num}: {agent_response}

Din skarpa insight (15-25 ord, börja med 💡):
```

### Good Round 1 Prompt:
```
ETABLERA POSITION - Runda {round_num}

Fråga: {clean_question}

Andra svar: {chain_so_far}

Ditt svar (150-250 ord):
```

---

## Testing Your Prompts

After editing a prompt in admin dashboard:
1. Save the prompt
2. Start a new debate
3. Check the debug logs in `ml_service/debate_debug_logs/`
4. Look for the "prompt" field to see how parameters were replaced

**Debug log structure:**
```json
{
  "oneseek_processing": {
    "round_1": {
      "gpt": {
        "comments_prompt": "actual prompt with values filled in",
        "comments_output": "what OneSeek generated"
      }
    }
  }
}
```

This helps you verify that:
- Parameters were replaced correctly
- The prompt makes sense with actual values
- Word limits are being respected
