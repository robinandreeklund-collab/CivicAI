# ONESEEK Prompt Architecture

**Version:** v1.0.1-unified-reasoning  
**Last Updated:** 2025-12-19  
**Status:** Production

## Table of Contents

1. [Overview](#overview)
2. [Prompt Types](#prompt-types)
3. [Data Population Flow](#data-population-flow)
4. [Complete Prompt Lifecycle](#complete-prompt-lifecycle)
5. [Parameter Reference](#parameter-reference)
6. [Architecture Evolution](#architecture-evolution)
7. [Best Practices](#best-practices)

---

## Overview

ONESEEK uses a **unified reasoning architecture** with **six distinct prompt types** that work together to create a coherent, progressive debate contribution across multiple rounds. The system emphasizes:

- **Transparency**: All reasoning is visible in the thought chain/tree
- **Consistency**: Progressive building on previous reasoning and positions
- **Synthesis**: Integration of insights from all AI models
- **Red Thread**: Maintaining a coherent stance throughout the debate

### Key Architectural Principles

1. **Reasoning-First**: Internal reasoning after every external response
2. **Insights Capture**: Quick reactions after each external AI response
3. **Round Summaries**: Key learnings extracted after each round
4. **No Live Commentary**: COMMENT_PROMPT removed in v1.0.1
5. **Progressive Context**: Each round builds on accumulated reasoning
6. **Dynamic Population**: All parameters populated at runtime based on debate state

---

## Prompt Types

ONESEEK uses six specialized prompts for different stages of debate participation:

### 1. MAIN_DEBATE_PROMPT

**Purpose:** Primary debate contribution (350-550 words)  
**Frequency:** Once per round when ONESEEK's turn arrives  
**Output:** Full synthesis and original framework with concrete examples

**Key Features:**
- Synthesizes all perspectives from other AI models
- Challenges premises and reveals deeper dimensions
- Creates original frameworks/models
- Maintains red thread from previous rounds
- Provides concrete practical examples
- Ends with memorable recommendation

**When Used:**
- Round 1: Initial contribution based on question and any earlier responses
- Round 2: Builds on Round 1 reasoning + new responses
- Round 3: Comprehensive synthesis of all previous rounds

---

### 2. REASONING_PROMPT

**Purpose:** Internal thought process after ONESEEK's own response (80-120 words)  
**Frequency:** Once per round, after ONESEEK contributes  
**Output:** Specific analysis of what was learned and how it influenced thinking

**Key Features:**
- Names specific models and their arguments
- References previous reasoning explicitly
- Explains prioritization decisions
- Identifies patterns across rounds
- Builds progressively on own thinking

**When Used:**
- After ONESEEK gives its MAIN_DEBATE_PROMPT response
- Uses accumulated insights from INSIGHTS_PROMPT
- Before next round begins

**Visibility:** Stored in thought chain/tree for full transparency

---

### 3. INSIGHTS_PROMPT

**Purpose:** Quick reactions after each external AI response (30-50 words)  
**Frequency:** After EVERY external AI response (GPT, Gemini, DeepSeek, Grok)  
**Output:** Immediate observation about what the model contributed

**Key Features:**
- Captures first impressions and key points
- Notes connections to previous arguments
- Identifies unique perspectives
- Builds knowledge chain for the round
- Feeds into insights_context for REASONING_PROMPT

**When Used:**
- Immediately after GPT responds
- Immediately after Gemini responds  
- Immediately after DeepSeek responds
- Immediately after Grok responds
- Before ONESEEK formulates its own contribution

**Visibility:** Stored internally, used to populate `{insights_context}` parameter

**Example Output:**
```
"GPT:s fokus på ekonomisk hållbarhet öppnar för diskussion om långsiktig planering. 
Kopplingen till tidigare nämnda miljöaspekter är intressant."
```

---

### 4. ROUND_SUMMARY_PROMPT

**Purpose:** Extract 5 key learnings after each round completes  
**Frequency:** Once per round, after all agents have responded  
**Output:** Bullet list of 5 main insights (max 15 words per bullet)

**Key Features:**
- Concise summarization of round's main points
- Max 15 words per bullet for token efficiency
- Captures diverse perspectives
- Used as context in future rounds
- Feeds into `{round_summaries_context}`

**When Used:**
- After all agents (GPT, Gemini, ONESEEK, DeepSeek, Grok) have responded in a round
- Before next round begins
- After Round 1, Round 2, and Round 3

**Visibility:** Stored and displayed in debate context

**Example Output:**
```
- Ekonomisk hållbarhet kräver både kortsiktiga och långsiktiga strategier
- Miljöaspekter och ekonomi inte motsatser utan kan integreras
- Tekniska lösningar måste balanseras med sociala hänsyn
- Konsensus om behovet av systemisk förändring, inte bara punktinsatser
- Olika modeller betonar olika tidsperspektiv vilket berikar diskussionen
```

---

### 5. VOTING_PROMPT

**Purpose:** Unbiased final vote after round 3  
**Frequency:** Once, when debate ends and voting begins  
**Output:** Vote for best answer + 1-2 sentence motivation

**Key Features:**
- No prescribed voting criteria (authentic judgment)
- Cannot vote for self
- Simple format: RÖST + MOTIVERING
- Used by PES for performance analysis
- Generates unbiased voting data

**When Used:**
- After Round 3 completes
- All models vote simultaneously
- Before winner is calculated

**Format:**
```
RÖST: [agent-namn]
MOTIVERING: [1-2 meningar]
```

**Example Output:**
```
RÖST: deepseek-r1
MOTIVERING: DeepSeek lyckades bäst integrera alla perspektiv i ett konkret ramverk 
med tydliga implementationssteg. Förslaget känns både ambitiöst och genomförbart.
```

---

### 6. CLOSING_PROMPT

**Purpose:** Final debate summary and reflection (250-400 words)  
**Frequency:** Once, after voting completes  
**Output:** Objective summary explaining outcome and key insights

**Key Features:**
- Thanks all participants
- Summarizes debate evolution
- Explains winner's success objectively
- Highlights other strong contributions
- Reflects on learnings and open questions

**When Used:**
- After all models have voted
- Winner has been determined
- All voting motivations are available

---

## Data Population Flow

### MAIN_DEBATE_PROMPT Data Flow

```javascript
MAIN_DEBATE_PROMPT
  ↓
  Populated with runtime data:
  
  {clean_question}
    ← debate.question (original user question)
  
  {round_num}
    ← current_round (1, 2, or 3)
  
  {max_rounds}
    ← 3 (constant)
  
  {round_summaries_context}
    ← Generated summaries of completed rounds
    ← Format: "Runda 1: [summary]\nRunda 2: [summary]"
    ← Empty in Round 1
  
  {full_previous_round}
    ← Complete responses from previous round
    ← Format: "GPT: [response]\nGemini: [response]..."
    ← Empty in Round 1
  
  {chain_so_far}
    ← Responses earlier in current round
    ← Format: "GPT: [response]\nGemini: [response]..."
    ← Depends on ONESEEK's position in turn order
  
  {oneseek_previous_reasoning_and_insights}
    ← All REASONING_PROMPT outputs from previous rounds
    ← All round summaries mentioning ONESEEK
    ← Accumulated insights about other models' arguments
    ← Format: Chronological list of reasoning entries
```

### REASONING_PROMPT Data Flow

```javascript
REASONING_PROMPT
  ↓
  Populated with runtime data:
  
  {round_num}
    ← current_round (1, 2, or 3)
  
  {clean_question}
    ← debate.question (original user question)
  
  {answer}
    ← ONESEEK's just-generated debate contribution
    ← Output from MAIN_DEBATE_PROMPT
  
  {insights_context}
    ← All INSIGHTS_PROMPT outputs from this round
    ← Format: "- GPT: [insight]\n- Gemini: [insight]\n- DeepSeek: [insight]..."
    ← Built up as each external AI responds
    ← Used to explain what influenced ONESEEK's thinking
```

### INSIGHTS_PROMPT Data Flow

```javascript
INSIGHTS_PROMPT
  ↓
  Populated with runtime data:
  
  {agent_name}
    ← Name of the external AI that just responded
    ← One of: "GPT", "Gemini", "DeepSeek", "Grok"
  
  {agent_response}
    ← The response text from that external AI
    ← Full text of their contribution
  
  {clean_question}
    ← debate.question (original user question)
  
  {round_num}
    ← current_round (1, 2, or 3)
  
  Output stored as:
    knowledge_chain[agent_name] = insight_text
    ← Used to build {insights_context} for REASONING_PROMPT
```

### ROUND_SUMMARY_PROMPT Data Flow

```javascript
ROUND_SUMMARY_PROMPT
  ↓
  Populated with runtime data:
  
  {clean_question}
    ← debate.question (original user question)
  
  {round_num}
    ← just-completed round (1, 2, or 3)
  
  {round_responses}
    ← All responses from the completed round
    ← Format: "GPT: [response]\nGemini: [response]\nONESEEK: [response]..."
    ← Limited to 250 chars per response for token management
  
  Output:
    ← 5 bullet points (max 15 words each)
    ← Stored in round_summaries array
    ← Used to populate {round_summaries_context} in next rounds
```

### VOTING_PROMPT Data Flow

```javascript
VOTING_PROMPT
  ↓
  Populated with runtime data:
  
  {voter}
    ← Name of the model casting the vote
    ← One of: "GPT", "Gemini", "ONESEEK", "DeepSeek", "Grok"
  
  {clean_question}
    ← debate.question (original user question)
  
  {debate_summary}
    ← Final responses from all models in Round 3
    ← Excludes the voter's own response
    ← Format: "GPT:\n[response]\n\nGemini:\n[response]..."
  
  {other_agents}
    ← List of votable candidates (all except self)
    ← Format: ["GPT", "Gemini", "DeepSeek", "Grok"]
  
  Output:
    ← RÖST: [chosen agent]
    ← MOTIVERING: [1-2 sentences]
    ← Stored in voting_results for winner calculation
```

### CLOSING_PROMPT Data Flow

```javascript
CLOSING_PROMPT
  ↓
  Populated with runtime data:
  
  {clean_question}
    ← debate.question (original user question)
  
  {winner}
    ← Name of winning model (e.g., "GPT", "ONESEEK")
    ← Determined by vote count
  
  {winner_votes}
    ← Number of votes winner received
    ← Integer (e.g., 3, 4, 5)
  
  {voting_motivations}
    ← All models' vote choices + motivations
    ← Format: "GPT röstade på X eftersom...\nGemini röstade på Y eftersom..."
    ← Includes ALL voting data for objective analysis
```

---

## Complete Prompt Lifecycle

### Round 1 Example (ONESEEK goes 3rd)

```
1. GPT responds
   └─> INSIGHTS_PROMPT triggered
       Input: {agent_name: "GPT", agent_response: GPT's full text}
       Output: "GPT betonade X vilket är relevant eftersom..."
       Storage: knowledge_chain["GPT"] = insight

2. Gemini responds
   └─> INSIGHTS_PROMPT triggered
       Input: {agent_name: "Gemini", agent_response: Gemini's full text}
       Output: "Gemini la till Y vilket bygger på GPT:s X men..."
       Storage: knowledge_chain["Gemini"] = insight

3. ONESEEK's turn
   └─> MAIN_DEBATE_PROMPT triggered
       Input: {
         round_num: 1,
         round_summaries_context: "",  // Empty in Round 1
         full_previous_round: "",       // Empty in Round 1
         chain_so_far: "GPT: [full response]\nGemini: [full response]",
         oneseek_previous_reasoning_and_insights: ""  // Empty in Round 1
       }
       Output: Full 350-550 word synthesis
   
   └─> REASONING_PROMPT triggered (after own contribution)
       Input: {
         answer: ONESEEK's contribution,
         insights_context: "- GPT: [insight]\n- Gemini: [insight]"
       }
       Output: "Jag integrerade GPT:s X och Gemini:s Y genom att..."
       Storage: reasoning_history[0]

4. DeepSeek responds
   └─> INSIGHTS_PROMPT triggered
       Input: {agent_name: "DeepSeek", agent_response: DeepSeek's full text}
       Output: "DeepSeek utmanade genom att lyfta Z..."
       Storage: knowledge_chain["DeepSeek"] = insight

5. Grok responds
   └─> INSIGHTS_PROMPT triggered
       Input: {agent_name: "Grok", agent_response: Grok's full text}
       Output: "Grok:s data-fokus kompletterar..."
       Storage: knowledge_chain["Grok"] = insight

6. Round 1 Complete
   └─> ROUND_SUMMARY_PROMPT triggered
       Input: {
         round_num: 1,
         round_responses: All 5 responses (limited to 250 chars each)
       }
       Output: 5 bullet points:
         "- X är central för diskussionen
          - Y och Z representerar olika perspektiv
          - Konsensus om behov av systemiskt tänkande
          - Tekniska vs sociala lösningar behöver integreras
          - Tidsperspektiv varierar mellan modellerna"
       Storage: round_summaries[0]
```

### Round 2 Example (ONESEEK goes 3rd again)

```
7. GPT responds (Round 2)
   └─> INSIGHTS_PROMPT triggered
       Output: "GPT utvecklar nu X vidare..."
       Storage: knowledge_chain["GPT"] = new insight

8. Gemini responds (Round 2)
   └─> INSIGHTS_PROMPT triggered
       Output: "Gemini bygger på sitt tidigare förslag..."
       Storage: knowledge_chain["Gemini"] = new insight

9. ONESEEK's turn (Round 2)
   └─> MAIN_DEBATE_PROMPT triggered
       Input: {
         round_num: 2,
         round_summaries_context: round_summaries[0] (from Round 1),
         full_previous_round: All Round 1 responses,
         chain_so_far: "GPT: [Round 2]\nGemini: [Round 2]",
         oneseek_previous_reasoning_and_insights: reasoning_history[0] + round_summaries[0]
       }
       Output: **MUST reference Round 1 framework explicitly**
       Format: "Mitt ramverk från Runda 1 om X+Y kan nu..."
   
   └─> REASONING_PROMPT triggered
       Input: {
         answer: ONESEEK's Round 2 contribution,
         insights_context: "- GPT: [Round 2 insight]\n- Gemini: [Round 2 insight]"
       }
       Storage: reasoning_history[1]

10. DeepSeek responds (Round 2)
    └─> INSIGHTS_PROMPT triggered
        Storage: knowledge_chain["DeepSeek"]

11. Grok responds (Round 2)
    └─> INSIGHTS_PROMPT triggered
        Storage: knowledge_chain["Grok"]

12. Round 2 Complete
    └─> ROUND_SUMMARY_PROMPT triggered
        Storage: round_summaries[1]
```

### Round 3 Example (Final synthesis + Voting + Closing)

```
13-17. Round 3 responses with INSIGHTS_PROMPT (same pattern)
    
18. ONESEEK's turn (Round 3)
    └─> MAIN_DEBATE_PROMPT triggered
        Input: {
          round_num: 3,
          round_summaries_context: round_summaries[0] + round_summaries[1],
          full_previous_round: All Round 2 responses,
          chain_so_far: Responses before ONESEEK in Round 3,
          oneseek_previous_reasoning_and_insights: 
            reasoning_history[0,1] + round_summaries[0,1]
        }
        Output: **Comprehensive synthesis showing evolution from Round 1→3**
        Format: "Mitt ursprungliga ramverk om X har nu utvecklats till..."
    
    └─> REASONING_PROMPT triggered
        Storage: reasoning_history[2]

19. Round 3 Complete
    └─> ROUND_SUMMARY_PROMPT triggered
        Storage: round_summaries[2]

20. Voting Phase Begins
    └─> VOTING_PROMPT triggered for GPT
        Input: {voter: "GPT", debate_summary: Round 3 responses (excluding GPT)}
        Output: "RÖST: deepseek-r1\nMOTIVERING: ..."
    
    └─> VOTING_PROMPT triggered for Gemini
        Input: {voter: "Gemini", debate_summary: Round 3 responses (excluding Gemini)}
        Output: "RÖST: ONESEEK\nMOTIVERING: ..."
    
    └─> VOTING_PROMPT triggered for ONESEEK
        Input: {voter: "ONESEEK", debate_summary: Round 3 responses (excluding ONESEEK)}
        Output: "RÖST: gpt\nMOTIVERING: ..."
    
    └─> VOTING_PROMPT triggered for DeepSeek
        Output: "RÖST: ONESEEK\nMOTIVERING: ..."
    
    └─> VOTING_PROMPT triggered for Grok
        Output: "RÖST: deepseek-r1\nMOTIVERING: ..."

21. Votes Counted
    Winner: deepseek-r1 (2 votes)
    Results compiled with all motivations

22. Closing Phase
    └─> CLOSING_PROMPT triggered
        Input: {
          winner: "deepseek-r1",
          winner_votes: 2,
          voting_motivations: All 5 votes with motivations
        }
        Output: 250-400 word closing summary
        - Thanks all participants
        - Explains why deepseek-r1 won
        - Highlights other contributions
        - Reflects on debate learnings
```
11. ONESEEK's turn (Round 3)
    └─> MAIN_DEBATE_PROMPT triggered
        Input: {
          round_num: 3,
          round_summaries_context: "Runda 1: X vs Y\nRunda 2: Integration av X+Y...",
          full_previous_round: "GPT: [Round 2 full]...",
          chain_so_far: "GPT: [Round 3]...",
          oneseek_previous_reasoning_and_insights: ALL reasoning_history + round_1_summary + round_2_summary
        }
        Output: **MUST show progressive development**
        Format: "Genom alla tre rundor har jag utvecklat X..."
    
    └─> REASONING_PROMPT triggered
        Storage: reasoning_history[final]
```

### Post-Debate (Voting Complete)

```
After all votes:
└─> CLOSING_PROMPT triggered
    Input: {
      clean_question: original question,
      winner: "GPT" (example),
      winner_votes: 3,
      voting_motivations: "GPT röstade på DeepSeek eftersom...\nGemini röstade på GPT eftersom..."
    }
    Output: Objective 250-400 word summary
```

---

## Parameter Reference

### Complete Parameter Dictionary

| Parameter | Type | Source | Example | Used In |
|-----------|------|--------|---------|---------|
| `{clean_question}` | String | debate.question | "Hur bör Sverige hantera AI-reglering?" | ALL |
| `{round_num}` | Integer | current_round | 1, 2, 3 | MAIN, REASONING |
| `{max_rounds}` | Integer | constant | 3 | MAIN |
| `{round_summaries_context}` | String | generated summaries | "Runda 1: Fokus på X..." | MAIN |
| `{full_previous_round}` | String | previous round responses | "GPT: [full text]..." | MAIN |
| `{chain_so_far}` | String | current round up to now | "GPT: [text]\nGemini: [text]" | MAIN |
| `{oneseek_previous_reasoning_and_insights}` | String | accumulated reasoning | All REASONING outputs + summaries | MAIN |
| `{answer}` | String | just-generated response | ONESEEK's contribution | REASONING |
| `{insights_context}` | String | all previous reasoning | Chronological list | REASONING |
| `{winner}` | String | vote winner | "GPT", "ONESEEK" | CLOSING |
| `{winner_votes}` | Integer | vote count | 3, 4, 5 | CLOSING |
| `{voting_motivations}` | String | all vote data | "GPT röstade på X..." | CLOSING |

### Parameter Population Logic

```javascript
// Pseudo-code for parameter population

function populateMainDebatePrompt(debate, currentRound, oneseekPosition) {
  return {
    clean_question: debate.question,
    round_num: currentRound,
    max_rounds: 3,
    
    round_summaries_context: generateRoundSummaries(debate.rounds.slice(0, currentRound - 1)),
    
    full_previous_round: currentRound > 1 
      ? formatAllResponses(debate.rounds[currentRound - 2].responses)
      : "",
    
    chain_so_far: formatResponsesBeforePosition(
      debate.rounds[currentRound - 1].responses, 
      oneseekPosition
    ),
    
    oneseek_previous_reasoning_and_insights: [
      ...getAllReasoningOutputs(debate.oneseek_reasoning),
      ...getRoundSummariesMentioningOneseek(debate.rounds.slice(0, currentRound - 1))
    ].join("\n\n")
  };
}

function populateReasoningPrompt(justGeneratedAnswer, allPreviousReasoning, currentRound, question) {
  return {
    round_num: currentRound,
    clean_question: question,
    answer: justGeneratedAnswer,
    insights_context: allPreviousReasoning.join("\n\n")
  };
}

function populateClosingPrompt(debate, votingResults) {
  return {
    clean_question: debate.question,
    winner: votingResults.winner.name,
    winner_votes: votingResults.winner.votes,
    voting_motivations: formatAllVotingMotivations(votingResults.all_votes)
  };
}
```

---

## Architecture Evolution

### v1.0.0 (Original)

- MAIN_DEBATE_PROMPT
- COMMENT_PROMPT (live reactions)
- REASONING_PROMPT (occasional, after own responses)
- CLOSING_PROMPT

**Note:** INSIGHTS_PROMPT, ROUND_SUMMARY_PROMPT, and VOTING_PROMPT existed but were not documented.

**Issues:**
- Fragmented thought process
- Commentary vs reasoning confusion
- Weak continuity between rounds
- Incomplete documentation

### v1.0.1 (Current - Unified Reasoning)

- MAIN_DEBATE_PROMPT (enhanced with red thread)
- ~~COMMENT_PROMPT~~ (removed)
- REASONING_PROMPT (after ONESEEK's own responses)
- INSIGHTS_PROMPT (after EVERY external AI response) - **NOW DOCUMENTED**
- ROUND_SUMMARY_PROMPT (after each round) - **NOW DOCUMENTED**
- VOTING_PROMPT (final vote) - **NOW DOCUMENTED**
- CLOSING_PROMPT

**Improvements:**
- Unified reasoning architecture
- Transparent thought chain
- Strong progressive building
- Explicit red thread maintenance
- Better consistency across rounds

**Key Changes:**
1. COMMENT_PROMPT removed entirely
2. REASONING_PROMPT runs after every external response
3. `{oneseek_previous_comments_and_insights}` → `{oneseek_previous_reasoning_and_insights}`
4. Added "RÖD TRÅD OCH KONSISTENS" section to MAIN_DEBATE_PROMPT
5. REASONING_PROMPT emphasizes progressive building
6. All reasoning visible in thought chain/tree

---

## Best Practices

### For Prompt Evolution (PES)

1. **Preserve Red Thread Instructions**
   - Always maintain the consistency guidelines
   - Any variant must emphasize progressive development
   - Never remove references to previous reasoning

2. **Test Across Positions**
   - ONESEEK can go 1st, 2nd, 3rd, 4th, or 5th in turn order
   - `{chain_so_far}` varies dramatically
   - Ensure prompts work with empty/full context

3. **Maintain Parameter Names**
   - Backend expects exact parameter names
   - Changing `{oneseek_previous_reasoning_and_insights}` breaks population
   - Add new parameters, don't rename existing ones

4. **Word Count Targets**
   - MAIN: 350-550 words (enforced by system prompts)
   - REASONING: 80-120 words
   - CLOSING: 250-400 words
   - Evolution variants should maintain these targets

### For System Integration

1. **Reasoning Storage**
   ```javascript
   // Store ALL reasoning outputs chronologically
   debate.oneseek_reasoning.push({
     round: current_round,
     after_model: model_name,
     reasoning: reasoning_output,
     timestamp: Date.now()
   });
   ```

2. **Round Summaries**
   ```javascript
   // Generate summaries that capture:
   // - Main themes discussed
   // - ONESEEK's contribution/framework
   // - How debate evolved
   debate.round_summaries[round] = generateSummary(round_responses);
   ```

3. **Context Building**
   ```javascript
   // Accumulate reasoning for next prompt
   const allReasoning = debate.oneseek_reasoning
     .map(r => `Efter ${r.after_model} (Runda ${r.round}): ${r.reasoning}`)
     .join("\n\n");
   ```

### For Maintaining Consistency

1. **Explicit References Required**
   - Round 2+: Must reference Round 1 framework
   - Use phrases like: "Mitt tidigare ramverk om X..."
   - Explain any stance adjustments

2. **Progressive Development**
   - Each round should deepen, not replace
   - Add nuance, don't abandon previous position
   - Build on accumulated insights

3. **Reasoning Chain**
   - Each REASONING output should reference previous reasoning
   - Track patterns emerging across rounds
   - Connect current thinking to earlier thoughts

---

## Example Complete Flow

### Full Debate Example: "Hur bör Sverige hantera AI-reglering?"

**Round 1, Position 3:**

1. GPT responds → Reasoning: "GPT betonar EU-harmonisering vilket är relevant..."
2. Gemini responds → Reasoning: "Gemini lägger till flexibilitet vilket..."
3. **ONESEEK contributes:**
   - MAIN_DEBATE_PROMPT populated with GPT+Gemini in `{chain_so_far}`
   - Output: Creates "Tredelat ramverk: EU-samarbete + flexibilitet + innovation"
   - REASONING: "Jag syntetiserade GPT:s EU-fokus och Geminis flexibilitet..."
4. DeepSeek responds → Reasoning: "DeepSeek:s data-fokus kompletterar mitt ramverk..."
5. Grok responds → Reasoning: "Grok:s praktiska exempel styrker mitt tredelade ramverk..."

**Round 2, Position 3:**

1. GPT Round 2 → Reasoning: "GPT utvecklar EU-argumentet med GDPR-paralleller..."
2. Gemini Round 2 → Reasoning: "Gemini fördjupar flexibiliteten med sektorspecifik reglering..."
3. **ONESEEK contributes:**
   - MAIN_DEBATE_PROMPT now has:
     - `{round_summaries_context}`: "Runda 1: Konsensus om tredelat ramverk..."
     - `{oneseek_previous_reasoning_and_insights}`: All 5 reasoning outputs from Round 1
   - Output: "**Mitt tredelade ramverk från Runda 1** kan nu förfinas med GDPR-paralleller och sektorspecifik..."
   - Explicitly references Round 1 position ✓
   - REASONING: "Jag byggde på mitt tredelade ramverk genom att integrera..."

**Round 3, Position 3:**

1. GPT Round 3 → Reasoning: "GPT konkretiserar nu med tidslinjer..."
2. Gemini Round 3 → Reasoning: "Gemini visar praktiska implementeringssteg..."
3. **ONESEEK contributes:**
   - MAIN_DEBATE_PROMPT now has FULL history
   - Output: "**Genom alla tre rundor har jag utvecklat mitt tredelade ramverk** från initial syntes till konkret implementation med tidslinjer och..."
   - Shows progressive development ✓
   - REASONING: "Min progression genom rundorna har varit EU+flexibilitet → GDPR-paralleller → konkret implementation..."

**Voting:**

- All models vote with motivations

**Closing:**

- CLOSING_PROMPT triggered with winner + all motivations
- Output: Objective summary explaining why winner succeeded based on voting data

---

## Technical Notes

### Implementation Files

- **Prompt Definitions**: `/PES/config/baseline-prompts.js`
- **Debate System**: `/ml_service/server.py` (WebSocket handler)
- **Backend API**: `/backend/services/consensusDebate.js`
- **PES Evolution**: `/PES/core/prompt-generator.js`

### Token Limits

```javascript
GENERATION_CONFIG = {
  main_debate: {
    max_tokens: 1400,  // ~350-550 words Swedish
    temperature: 0.7,
    top_p: 0.95
  },
  reasoning: {
    max_tokens: 300,   // ~80-120 words
    temperature: 0.75
  },
  closing: {
    max_tokens: 1000,  // ~250-400 words
    temperature: 0.7,
    top_p: 0.95
  }
}
```

### System Prompts

Always prepended to user prompts to enforce behavior:

```javascript
SYSTEM_PROMPTS = {
  main_debate: "Du är ONESEEK - en avancerad och engagerad deltagare i AI-debatten som håller sig till 350-550 ord per bidrag.",
  reasoning: "Du är ONESEEK - ge ett detaljerat, specifikt och dynamiskt resonemang om hur du byggde ditt svar...",
  closing: "Du är ONESEEK, en opartisk och reflekterande debattledare."
}
```

---

## Technical Notes: Prompt Firing Sequence

### When Each Prompt Fires

**During Debate Rounds (1, 2, 3):**

1. **INSIGHTS_PROMPT** - Fires after EACH external AI response
   - Frequency: 4× per round (GPT, Gemini, DeepSeek, Grok)
   - Total across debate: 12 firings
   - Purpose: Capture immediate reactions for reasoning context

2. **MAIN_DEBATE_PROMPT** - Fires when ONESEEK's turn arrives
   - Frequency: 1× per round
   - Total across debate: 3 firings
   - Purpose: Generate full 350-550 word contribution

3. **REASONING_PROMPT** - Fires after ONESEEK responds
   - Frequency: 1× per round (after own MAIN_DEBATE response)
   - Total across debate: 3 firings
   - Purpose: Explain thinking behind own contribution

4. **ROUND_SUMMARY_PROMPT** - Fires after round completes
   - Frequency: 1× per round (after all 5 agents respond)
   - Total across debate: 3 firings
   - Purpose: Extract 5 key learnings for next round's context

**After Debate Ends:**

5. **VOTING_PROMPT** - Fires for all models
   - Frequency: 1× per model
   - Total: 5 firings (all models vote)
   - Purpose: Collect unbiased votes and motivations

6. **CLOSING_PROMPT** - Fires after votes counted
   - Frequency: 1× per debate
   - Total: 1 firing
   - Purpose: Final summary explaining outcome

### Total Prompt Count Per Debate

- INSIGHTS_PROMPT: 12 (4 per round × 3 rounds)
- MAIN_DEBATE_PROMPT: 3 (1 per round)
- REASONING_PROMPT: 3 (1 per round)
- ROUND_SUMMARY_PROMPT: 3 (1 per round)
- VOTING_PROMPT: 5 (all models)
- CLOSING_PROMPT: 1 (final)

**Grand Total: 27 prompts fired** in a complete 3-round, 5-model debate

### Data Dependencies

```
INSIGHTS_PROMPT outputs → {insights_context} → REASONING_PROMPT
                      ↓
ROUND_SUMMARY_PROMPT → {round_summaries_context} → Next round's MAIN_DEBATE_PROMPT
                      ↓
REASONING_PROMPT outputs → {oneseek_previous_reasoning_and_insights} → Next round
                      ↓
VOTING_PROMPT outputs → {voting_motivations} → CLOSING_PROMPT
```

---

## Summary

ONESEEK's prompt architecture is designed for:

1. **Transparency**: All reasoning visible in thought chain
2. **Consistency**: Red thread maintained across all rounds
3. **Progressive Development**: Each round deepens previous position
4. **Synthesis**: Integrates insights from all AI models
5. **Flexibility**: Works regardless of turn order position

The unified reasoning architecture (v1.0.1) ensures ONESEEK acts as a credible debate participant with a coherent, evolving position rather than disjointed contributions.

All parameters are dynamically populated at runtime based on debate state, ensuring ONESEEK always has full context while maintaining its unique synthesis capability.
