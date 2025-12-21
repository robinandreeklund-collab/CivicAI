# Debate Debug Logger

## Overview

The Debate Debug Logger creates detailed JSON files for every debate session, capturing all steps, data, and prompts. This allows you to inspect exactly what happens during a debate and troubleshoot any issues.

## Debug Log Location

After each debate completes, a debug log file is automatically saved to:
```
ml_service/debate_debug_logs/debate_<id>.json
```

Example: `ml_service/debate_debug_logs/debate_20231221_143022.json`

## What's Logged

The debug log contains comprehensive information about:

### 1. Debate Metadata
- Debate ID and question
- Participants (all AI agents including OneSeek)
- Start and completion timestamps
- Turn orders for each round

### 2. External AI Requests and Responses
For each external AI (GPT, Gemini, DeepSeek, Grok):
- The exact prompt sent to the AI
- The response received
- Success/failure status
- Timestamps

### 3. OneSeek Processing Steps
For each external response, OneSeek generates:
- **Comments**: Initial commentary (prompt and output)
- **Reasoning**: Deep analysis (prompt and output)
- **Insights**: Quick observations (prompt and output)

All prompts and outputs are logged with:
- The full prompt text
- The generated output
- Character counts
- Timestamps

### 4. Knowledge Chain
The accumulated knowledge chain showing:
- Round number and agent
- Comments, reasoning, and insights for each agent
- How context builds up over time

### 5. OneSeek's Own Answers
For each round:
- The full prompt used to generate OneSeek's answer
- The complete response
- Timestamps

### 6. Voting Phase
For each voter:
- The complete voting prompt (including what responses they saw)
- Which agents' responses were included
- The vote response
- Who they voted for and why
- All timestamps

### 7. Final Results
- Winner and vote counts
- Statistics (total rounds, prompts, responses, votes)

## File Structure

```json
{
  "debate_id": "20231221_143022",
  "question": "Should AI be regulated?",
  "started_at": "2023-12-21T14:30:22",
  "completed_at": "2023-12-21T14:35:45",
  "rounds": [
    {
      "round_number": 1,
      "turn_order": ["gpt", "oneseek", "gemini", "deepseek", "grok"],
      "external_requests": [
        {
          "agent": "gpt",
          "position": 0,
          "prompt": "DEBATTFRÅGA: Should AI be regulated?...",
          "prompt_length": 450,
          "timestamp": "2023-12-21T14:30:23"
        }
      ],
      "responses": [
        {
          "agent": "gpt",
          "response": "Yes, AI should be regulated...",
          "response_length": 287,
          "success": true,
          "timestamp": "2023-12-21T14:30:28"
        }
      ],
      "oneseek_processing": [
        {
          "agent_analyzed": "gpt",
          "step": "comments",
          "prompt": "Du är ONESEEK...",
          "prompt_length": 320,
          "timestamp": "2023-12-21T14:30:29"
        },
        {
          "agent_analyzed": "gpt",
          "step": "comments_output",
          "output": "GPT lyfter viktiga punkter om...",
          "output_length": 145,
          "timestamp": "2023-12-21T14:30:30"
        }
      ],
      "oneseek_own_answer": {
        "prompt": "Du är ONESEEK – en avancerad...",
        "prompt_length": 1200,
        "response": "Jag vill bygga vidare på...",
        "response_length": 450,
        "timestamp": "2023-12-21T14:31:15"
      }
    }
  ],
  "knowledge_chain": [
    {
      "round": 1,
      "agent": "gpt",
      "comments": "GPT lyfter viktiga punkter...",
      "comments_length": 145,
      "reasoning": "Argumentationen är stark...",
      "reasoning_length": 287,
      "timestamp": "2023-12-21T14:30:30"
    }
  ],
  "voting": {
    "prompts": [
      {
        "voter": "gpt",
        "prompt": "Du är GPT och ska rösta...",
        "prompt_length": 890,
        "included_responses": ["oneseek", "gemini", "deepseek", "grok"],
        "timestamp": "2023-12-21T14:35:20"
      }
    ],
    "responses": [
      {
        "voter": "gpt",
        "response": "RÖST: oneseek\nMOTIVERING: OneSeek gav...",
        "response_length": 234,
        "voted_for": "oneseek",
        "reasoning": "OneSeek gav den mest genomtänkta analysen...",
        "timestamp": "2023-12-21T14:35:22"
      }
    ]
  },
  "final_results": {
    "winner": "oneseek",
    "vote_counts": {
      "oneseek": 3,
      "gpt": 1,
      "gemini": 0,
      "deepseek": 1,
      "grok": 0
    },
    "timestamp": "2023-12-21T14:35:45"
  },
  "statistics": {
    "total_rounds": 3,
    "total_external_prompts": 12,
    "total_external_responses": 12,
    "total_knowledge_chain_entries": 36,
    "total_votes": 5
  },
  "metadata": {
    "participants": ["gpt", "gemini", "deepseek", "grok", "oneseek"],
    "turn_orders": {
      "round_1": ["gpt", "oneseek", "gemini", "deepseek", "grok"],
      "round_2": ["deepseek", "oneseek", "gpt", "grok", "gemini"],
      "round_3": ["oneseek", "gemini", "grok", "deepseek", "gpt"]
    }
  }
}
```

## How to Use

### 1. Run a Debate
Navigate to `/7b-zero` and start a debate. The debug log will be automatically created when the debate completes.

### 2. Find the Log File
Look in `ml_service/debate_debug_logs/` for the most recent file.

### 3. Analyze the Data
Open the JSON file in a text editor or JSON viewer to inspect:
- What prompts were sent to each AI
- How OneSeek built its reasoning
- Which responses were included in voting
- Complete chronology of the debate

### 4. Troubleshoot Issues
If something goes wrong in a debate, check:
- `external_requests`: Did the prompts contain the right context?
- `responses`: Did all AIs respond successfully?
- `oneseek_processing`: Did OneSeek generate all three analysis types?
- `voting.prompts`: Did voters see the correct responses?
- `voting.responses`: Did voters parse correctly?

## Tips

- Use `jq` to pretty-print or filter the JSON:
  ```bash
  cat debate_20231221_143022.json | jq '.voting.prompts'
  ```

- Compare prompts across rounds to see how context evolves:
  ```bash
  cat debate_*.json | jq '.rounds[].external_requests[].prompt_length'
  ```

- Check if any responses failed:
  ```bash
  cat debate_*.json | jq '.rounds[].responses[] | select(.success == false)'
  ```

## Privacy Note

Debug logs contain full debate content including all prompts and responses. Store them securely and do not commit them to version control (they are gitignored by default).
