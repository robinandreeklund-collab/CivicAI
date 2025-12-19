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

ONESEEK uses a **unified reasoning architecture** with three distinct prompt types that work together to create a coherent, progressive debate contribution across multiple rounds. The system emphasizes:

- **Transparency**: All reasoning is visible in the thought chain/tree
- **Consistency**: Progressive building on previous reasoning and positions
- **Synthesis**: Integration of insights from all AI models
- **Red Thread**: Maintaining a coherent stance throughout the debate

### Key Architectural Principles

1. **Reasoning-First**: Internal reasoning after every external response
2. **No Live Commentary**: COMMENT_PROMPT removed in v1.0.1
3. **Progressive Context**: Each round builds on accumulated reasoning
4. **Dynamic Population**: All parameters populated at runtime based on debate state

---

## Prompt Types

ONESEEK uses three specialized prompts for different stages of debate participation:

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

**Purpose:** Internal thought process after each external AI response (80-120 words)  
**Frequency:** After EVERY external AI response (GPT, Gemini, DeepSeek, Grok)  
**Output:** Specific analysis of what was learned and how it influenced thinking

**Key Features:**
- Names specific models and their arguments
- References previous reasoning explicitly
- Explains prioritization decisions
- Identifies patterns across rounds
- Builds progressively on own thinking

**When Used:**
- Immediately after GPT responds
- Immediately after Gemini responds
- Immediately after DeepSeek responds
- Immediately after Grok responds
- Before formulating ONESEEK's own contribution

**Visibility:** Stored in thought chain/tree for full transparency

---

### 3. CLOSING_PROMPT

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
    ← All previous REASONING_PROMPT outputs
    ← Format: Chronological list
    ← Empty for first reasoning in debate
    ← Grows throughout debate
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
   └─> REASONING_PROMPT triggered
       Input: {answer: GPT's response, insights_context: ""}
       Output: "GPT betonade X vilket är relevant eftersom..."
       Storage: reasoning_history[0]

2. Gemini responds
   └─> REASONING_PROMPT triggered
       Input: {answer: Gemini's response, insights_context: reasoning_history[0]}
       Output: "Gemini la till Y vilket bygger på GPT:s X men..."
       Storage: reasoning_history[1]

3. ONESEEK's turn
   └─> MAIN_DEBATE_PROMPT triggered
       Input: {
         round_num: 1,
         round_summaries_context: "",  // Empty in Round 1
         full_previous_round: "",       // Empty in Round 1
         chain_so_far: "GPT: [full response]\nGemini: [full response]",
         oneseek_previous_reasoning_and_insights: reasoning_history[0] + reasoning_history[1]
       }
       Output: Full 350-550 word synthesis
   
   └─> REASONING_PROMPT triggered (after own contribution)
       Input: {answer: ONESEEK's contribution, insights_context: reasoning_history[0..1]}
       Output: "Jag integrerade GPT:s X och Gemini:s Y genom att..."
       Storage: reasoning_history[2]

4. DeepSeek responds
   └─> REASONING_PROMPT triggered
       Input: {answer: DeepSeek's response, insights_context: reasoning_history[0..2]}
       Output: "DeepSeek utmanade mitt ramverk genom att..."
       Storage: reasoning_history[3]

5. Grok responds
   └─> REASONING_PROMPT triggered
       Input: {answer: Grok's response, insights_context: reasoning_history[0..3]}
       Output: "Grok:s data-fokus kompletterar mitt X eftersom..."
       Storage: reasoning_history[4]
```

### Round 2 Example (ONESEEK goes 3rd again)

```
6. GPT responds (Round 2)
   └─> REASONING_PROMPT triggered
       Input: {answer: GPT's Round 2 response, insights_context: reasoning_history[0..4]}
       Output: "GPT utvecklar nu X vidare med Y vilket..."
       Storage: reasoning_history[5]

7. Gemini responds (Round 2)
   └─> REASONING_PROMPT triggered
       Input: {answer: Gemini's Round 2 response, insights_context: reasoning_history[0..5]}
       Output: "Gemini bygger på sitt tidigare förslag genom att..."
       Storage: reasoning_history[6]

8. ONESEEK's turn (Round 2)
   └─> MAIN_DEBATE_PROMPT triggered
       Input: {
         round_num: 2,
         round_summaries_context: "Runda 1: Diskussion fokuserade på X vs Y...",
         full_previous_round: "GPT: [Round 1 response]\nGemini: [Round 1 response]...",
         chain_so_far: "GPT: [Round 2 response]\nGemini: [Round 2 response]",
         oneseek_previous_reasoning_and_insights: reasoning_history[0..6] + round_1_summary
       }
       Output: **MUST reference Round 1 framework explicitly**
       Format: "Mitt ramverk från Runda 1 om X+Y kan nu..."
   
   └─> REASONING_PROMPT triggered
       Storage: reasoning_history[7]

... and so on
```

### Round 3 Example (Final synthesis)

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
- REASONING_PROMPT (occasional)
- CLOSING_PROMPT

**Issues:**
- Fragmented thought process
- Commentary vs reasoning confusion
- Weak continuity between rounds

### v1.0.1 (Current - Unified Reasoning)

- MAIN_DEBATE_PROMPT (enhanced with red thread)
- ~~COMMENT_PROMPT~~ (removed)
- REASONING_PROMPT (after EVERY external response)
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

## Summary

ONESEEK's prompt architecture is designed for:

1. **Transparency**: All reasoning visible in thought chain
2. **Consistency**: Red thread maintained across all rounds
3. **Progressive Development**: Each round deepens previous position
4. **Synthesis**: Integrates insights from all AI models
5. **Flexibility**: Works regardless of turn order position

The unified reasoning architecture (v1.0.1) ensures ONESEEK acts as a credible debate participant with a coherent, evolving position rather than disjointed contributions.

All parameters are dynamically populated at runtime based on debate state, ensuring ONESEEK always has full context while maintaining its unique synthesis capability.
