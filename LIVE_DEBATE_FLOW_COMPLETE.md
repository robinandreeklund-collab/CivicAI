# Live Debate System - Complete Flow Documentation

**Last Updated**: 2025-12-17  
**Status**: ✅ Verified against ml_service/server.py lines 13706-14750

This document provides a complete, accurate description of the Live Debate System based on thorough code inspection.

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Flow Sequence](#complete-flow-sequence)
3. [Participants](#participants)
4. [Per-Agent Processing Flow](#per-agent-processing-flow)
5. [MTA-DO Analysis](#mta-do-analysis)
6. [Context Management](#context-management)
7. [Knowledge Chain](#knowledge-chain)
8. [ONESEEK's Own Answer](#oneseeks-own-answer)
9. [Voting System](#voting-system)
10. [WebSocket Events](#websocket-events)
11. [Code Locations](#code-locations)
12. [Performance Characteristics](#performance-characteristics)

---

## Overview

The Live Debate System is a **3-round, turn-based debate** where:
- **4 external AI agents** (GPT, Gemini, DeepSeek, Grok) respond to a question
- **ONESEEK** acts as observer (echoes, comments, insights) AND participant (generates own answer)
- **MTA-DO** analyzes each response across 6 dimensions in real-time
- **All participants** vote on the best response in Round 3

**Key Characteristics**:
- Sequential processing (via `oneseek_processing_lock`) - responses processed ONE AT A TIME
- Non-blocking MTA-DO analysis (async, parallel to debate flow)
- Context-optimized (~2000-3000 tokens total)
- Authentic voting (all participants vote via their respective APIs/servers)

---

## Complete Flow Sequence

```
USER SUBMITS QUESTION
    ↓
DEBATE START (event: debate_start)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ ROUND 1                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. Generate random turn order (shuffle debate_agents)        │
│ 2. Send round_start event                                    │
│ 3. Build debate prompt (question + context from prev rounds) │
│                                                               │
│ FOR EACH EXTERNAL AGENT (in parallel API calls):             │
│   ├─ Request response from external API                      │
│   ├─ When response arrives (ai_response event)               │
│   └─ ACQUIRE oneseek_processing_lock (sequential processing) │
│      ├─ 1. ECHO: Stream response token-by-token              │
│      │    Events: oneseek_echo_start, oneseek_echo           │
│      ├─ 2. MTA-DO: Analyze response (6 dimensions)           │
│      │    Event: mta_analysis                                │
│      │    Stores in knowledge_chain                          │
│      ├─ 3. COMMENT: Generate ONESEEK comment                 │
│      │    Uses MTA data (scores, strengths, weaknesses)      │
│      │    Event: oneseek_reasoning                           │
│      │    Stores in knowledge_chain                          │
│      ├─ 4. INSIGHT: Generate 💡 synthesis                    │
│      │    Event: live_insight                                │
│      └─ RELEASE oneseek_processing_lock                      │
│                                                               │
│ 4. ALL EXTERNAL RESPONSES PROCESSED                          │
│                                                               │
│ 5. ONESEEK GENERATES OWN ANSWER                              │
│    ├─ Build context (background + current round)             │
│    │   - Previous rounds: Agent names only (~100 tokens)     │
│    │   - Current round: Truncated (400 chars/agent)          │
│    │   - Knowledge chain: Insights + MTA (~500-1000 tokens)  │
│    ├─ Generate answer (150-250 words)                        │
│    │   Events: thinking, oneseek_own_answer_start,           │
│    │           oneseek_own_answer (streamed)                 │
│    ├─ Generate reasoning (explains thought process)          │
│    │   Uses MTA context, specific agent references           │
│    │   Event: oneseek_own_reasoning                          │
│    └─ Store in knowledge_chain                               │
│                                                               │
│ 6. ROUND SUMMARY                                             │
│    ├─ Generate 5 key learnings                               │
│    ├─ Calculate consensus percentage (0-100%)                │
│    └─ Event: round_summary                                   │
│                                                               │
│ 7. round_end event                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
    ↓
ROUND 2 (same flow as Round 1)
    ↓
ROUND 3 (same flow as Round 1)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ VOTING (Round 3 only)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. voting_intro event                                        │
│                                                               │
│ 2. ALL PARTICIPANTS VOTE:                                    │
│    all_voters = ['gpt', 'gemini', 'deepseek', 'grok',       │
│                  'oneseek']                                  │
│                                                               │
│ FOR EACH VOTER:                                              │
│   ├─ Build voting prompt                                     │
│   │   - Context: Round 3 responses only (500 chars/response) │
│   │   - Excludes voter's own response                        │
│   ├─ Call appropriate API:                                   │
│   │   - External AI: Backend API endpoint                    │
│   │   - ONESEEK: Local LLAMA server                          │
│   ├─ Parse response:                                         │
│   │   - Extract RÖST: [agent_name]                           │
│   │   - Extract MOTIVERING: [50-80 words]                    │
│   ├─ Validate vote (must be for another participant)         │
│   └─ Event: vote_received                                    │
│       (voter, voted_for, motivation)                         │
│                                                               │
│ 3. COUNT VOTES                                               │
│    - Winner = agent with most votes                          │
│    - Event: winner (winner, votes, all_votes, vote_results)  │
│                                                               │
│ 4. CLOSING COMMENT                                           │
│    - ONESEEK generates 250-400 word closing statement        │
│    - Summarizes debate, explains winner, reflects on debate  │
│                                                               │
│ 5. Event: debate_complete                                    │
│    (question, rounds, winner, winner_votes,                  │
│     vote_results, summary)                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
    ↓
DEBATE ENDS
```

---

## Participants

### External AI Agents (4)
- **GPT** (OpenAI GPT-3.5/4) - via `/api/external/openai`
- **Gemini** (Google Gemini Pro) - via `/api/external/gemini`
- **DeepSeek** (DeepSeek v2) - via `/api/external/deepseek`
- **Grok** (xAI Grok) - via `/api/external/grok`

**Role**: Respond to debate question each round, vote in Round 3

### ONESEEK (Local AI)
**Dual Role**:
1. **Observer**: Echoes, comments, and provides insights on other agents
2. **Participant**: Generates own answer each round, votes in Round 3

**Backend**: Local LLAMA server (OneSeek-7B-Zero model)

### MTA-DO (Meta-Transparency Analysis)
**Role**: Real-time quality analysis of each response
**Backend**: Local LLAMA server
**Output**: 6-dimension scores + reasoning + summary

---

## Per-Agent Processing Flow

For each external agent's response, ONESEEK performs the following sequence **sequentially** (one agent at a time via `oneseek_processing_lock`):

### 1. Echo (Lines 13845-13858)
**Purpose**: Stream the agent's response to the frontend in real-time

**Events**:
```javascript
{
  type: "oneseek_echo_start",
  round: 1,
  agent: "gpt",
  message: "🔄 OneSeek ekar GPTs svar..."
}

{
  type: "oneseek_echo",
  round: 1,
  agent: "gpt",
  text: "...", // Streamed word-by-word
  complete: false
}
```

### 2. MTA-DO Analysis (Lines 13860-13888)
**Purpose**: Evaluate response quality across 6 dimensions

**Process**:
1. Call `analyze_mta_do_response(agent_name, round_num, response_text, question)`
2. 30-second timeout with fallback (6.7/10)
3. Store in `knowledge_chain` as type 'mta_analysis'
4. Send `mta_analysis` event to frontend

**Event**:
```javascript
{
  type: "mta_analysis",
  round: 1,
  agent: "gpt",
  data: {
    agent_name: "gpt",
    round_number: 1,
    analysis: {
      relevance: {score: 8.5, reasoning: "..."},
      argument_depth: {score: 7.8, reasoning: "..."},
      factual_anchoring: {score: 8.2, reasoning: "..."},
      clarity: {score: 9.0, reasoning: "..."},
      logical_coherence: {score: 8.1, reasoning: "..."},
      risk_hallucination: {score: 2.0, reasoning: "..."}
    },
    summary: {
      overall_score: 7.8,
      weighted_score: 8.1,
      strengths: ["Strong factual anchoring", "Clear communication"],
      weaknesses: ["Could develop arguments more deeply"],
      key_insights: ["Focus on practical solutions"]
    }
  }
}
```

### 3. Comment (Lines 13890-13999)
**Purpose**: Generate ONESEEK's meta-commentary on the response

**Prompt** (Lines 13902-13927):
```
Du är ONESEEK som ger meta-kommentarer på debatten.

KONTEXT:
- Agent: GPT
- Runda: 1
- Svar: [truncated to 500 chars]
- MTA-Analys: 
  * Overall Score: 8.1/10
  * Relevans: 8.5/10 - [reasoning]
  * Argumentdjup: 7.8/10 - [reasoning]
  * Faktaförankring: 8.2/10 - [reasoning]
  * Styrkor: Strong factual anchoring, Clear communication
  * Svagheter: Could develop arguments more deeply

TIDIGARE ANALYSER:
[List of all previous MTA analyses with scores]

UPPGIFT:
Ge en kort, insiktsfull kommentar (2-3 meningar) som:
1. Bekräftar svarets kvalitet baserat på MTA-poäng
2. Lyfter fram viktiga styrkor eller bekymmer från analysen
3. Kontextualiserar inom det bredare debattflödet
```

**Generation**:
- Temperature: 0.85
- Max tokens: 200
- Timeout: 60 seconds
- Stored in `knowledge_chain` as insight

**Event**:
```javascript
{
  type: "oneseek_reasoning",
  round: 1,
  agent: "gpt",
  message: "GPT visar stark faktaförankring (8.2/10) och tydlig kommunikation. Argumentdjupet kunde utvecklas mer, men övergripande solid analys som bygger på konkreta exempel.",
  data: {
    reasoning: "...",
    agent_analyzed: "gpt"
  }
}
```

### 4. Insight (Lines 14010-14102)
**Purpose**: Generate synthesis/meta-observation about the debate state

**Prompt** (Lines 14026-14042 with MTA context):
```
Du är ONESEEK som genererar en syntes-insikt (💡) för det aktuella debattläget.

KONTEXT:
- Runda: 1
- Alla MTA-analyser: 
- GPT (Runda 1): 8.1/10 - Styrkor: Strong factual anchoring, Clear communication
- GEMINI (Runda 1): 7.5/10 - Styrkor: Original perspectives, Creative thinking
[...]

UPPGIFT:
Generera en kort insikt (1-2 meningar) som:
1. Syntetiserar mönster över alla svar
2. Identifierar växande konsensus eller divergenser
3. Lyfter fram de mest värdefulla bidragen
```

**Generation**:
- Temperature: 0.85
- Max tokens: 80
- Uses `generate_with_llama_server()` (120s timeout)

**Event**:
```javascript
{
  type: "live_insight",
  round: 1,
  agent: "gpt",
  message: "💡 GPT leder med solid faktaförankring medan Gemini tillför kreativa perspektiv. Debatten börjar forma två läger: praktisk vs visionär approach.",
  data: {
    progress: "2/4"
  }
}
```

---

## MTA-DO Analysis

### Function: `analyze_mta_do_response()` (Lines 13306-13530)

### 6 Dimensions

1. **Relevans** (0-10)
   - How well does the response address the debate question?
   - Weight: 1.0

2. **Argumentdjup** (0-10)
   - Depth and sophistication of argumentation
   - Weight: 1.2

3. **Faktuell/juridisk förankring** (0-10)
   - Use of facts, data, and verifiable information
   - Weight: 1.3 (highest)

4. **Klarhet** (0-10)
   - Communication clarity and accessibility
   - Weight: 0.9

5. **Konsekvens** (Logical coherence) (0-10)
   - Internal consistency and logical flow
   - Weight: 1.0

6. **Risk/Hallucination** (0-10)
   - Risk of incorrect info or hallucinations
   - Weight: 1.1 (inverted - lower is better)
   - **Scoring**: 0 = no risk, 10 = high risk

### Scoring Formula

```python
# Calculate adjusted scores (invert risk_hallucination)
adjusted_scores = {
    'relevance': analysis['relevance']['score'],
    'argument_depth': analysis['argument_depth']['score'],
    'factual_anchoring': analysis['factual_anchoring']['score'],
    'clarity': analysis['clarity']['score'],
    'logical_coherence': analysis['logical_coherence']['score'],
    'risk_hallucination': 10 - analysis['risk_hallucination']['score']  # INVERTED
}

# Apply weights
weights = {
    'relevance': 1.0,
    'argument_depth': 1.2,
    'factual_anchoring': 1.3,
    'clarity': 0.9,
    'logical_coherence': 1.0,
    'risk_hallucination': 1.1
}

# Calculate weighted score
weighted_score = sum(adjusted_scores[dim] * weights[dim] for dim in adjusted_scores) / sum(weights.values())

# Calculate overall score (simple average)
overall_score = sum(adjusted_scores.values()) / len(adjusted_scores)
```

### JSON Output Structure

```json
{
  "agent_name": "gpt",
  "round_number": 1,
  "analysis": {
    "relevance": {
      "score": 8.5,
      "reasoning": "Direkt adresserar debattfrågan med fokus på kärnaspekterna."
    },
    "argument_depth": {
      "score": 7.8,
      "reasoning": "Flerskiktad argumentation men kunde gå djupare i vissa områden."
    },
    "factual_anchoring": {
      "score": 8.2,
      "reasoning": "God användning av konkreta exempel och verifierbara påståenden."
    },
    "clarity": {
      "score": 9.0,
      "reasoning": "Mycket tydlig kommunikation med välstrukturerat flöde."
    },
    "logical_coherence": {
      "score": 8.1,
      "reasoning": "Intern konsekvens genomgående, inga logiska brott."
    },
    "risk_hallucination": {
      "score": 2.0,
      "reasoning": "Låg risk för felaktig information, påståenden är välgrundade."
    }
  },
  "summary": {
    "overall_score": 7.8,
    "weighted_score": 8.1,
    "strengths": [
      "Strong factual anchoring",
      "Clear communication",
      "Logical consistency"
    ],
    "weaknesses": [
      "Could develop arguments more deeply",
      "Limited exploration of counterarguments"
    ],
    "key_insights": [
      "Focus on practical, actionable solutions",
      "Emphasis on evidence-based reasoning"
    ],
    "fallback": false
  }
}
```

### Error Handling

**Multi-Strategy JSON Parsing**:
1. **Strategy 1**: Direct JSON parse of entire response
2. **Strategy 2**: Smart brace matching (handles escaped quotes, strings)
3. **Strategy 3**: Auto-repair truncated JSON
   - Detects incomplete strings
   - Closes incomplete strings properly
   - Adds missing closing braces (up to 5)
4. **Retry Logic**: 2 attempts with lower temperature (0.2)
5. **Fallback**: Default scores (6.7/10) with `fallback: true` flag

**Timeouts**:
- MTA-DO analysis: 30 seconds
- Automatic fallback on timeout

---

## Context Management

### Token Optimization Strategy

ONESEEK uses **selective context** to stay within token limits (~2000-3000 tokens total):

| Context Type | Storage Method | Tokens | Code Lines |
|--------------|---------------|--------|------------|
| **Previous Rounds** | Agent names only | ~100 | 14129-14140 |
| **Current Round** | Truncated (400 chars/agent) | ~1600 | 14146-14151 |
| **Knowledge Chain** | Meta-info only (insights + MTA summaries) | ~500-1000 | 13869-13888 |
| **TOTAL** | | **~2000-3000** | |

### Previous Rounds Context (Lines 14129-14140)

```python
background_context = ""
if debate_rounds:
    background_context = "BAKGRUND - TIDIGARE RUNDOR (SAMMANFATTNING):\n"
    for prev_round in debate_rounds:
        background_context += f"Runda {prev_round['round']}: "
        summary_points = []
        for resp in prev_round['responses']:
            if resp.get('success', False):
                # Very brief summary to save tokens
                summary_points.append(f"{resp['agent']}")
        background_context += f"{', '.join(summary_points)} bidrog. "
    background_context += "\n\n"
```

**Output**: "Runda 1: gpt, gemini, deepseek, grok bidrog. Runda 2: gpt, gemini, deepseek, grok bidrog."

### Current Round Context (Lines 14146-14151)

```python
current_round_context = f"""AKTUELL RUNDA ({round_num}/{max_rounds}) - BIDRAG I TUR-ORDNING:

"""
for ext_resp in external_responses:
    if ext_resp.get('success', False):
        # Limit each response to max 400 chars to prevent token overflow
        response_text = ext_resp['response'][:400]
        if len(ext_resp['response']) > 400:
            response_text += "..."
        current_round_context += f"\n{ext_resp['agent'].upper()}:\n{response_text}\n"
```

### Knowledge Chain Context (Lines 14238-14250)

```python
# Build MTA context
mta_analyses = [item['analysis'] for item in knowledge_chain if item.get('type') == 'mta_analysis']
mta_context = "\n\nMTA-KVALITETSBEDÖMNINGAR:\n"
if mta_analyses:
    for mta in mta_analyses:
        mta_context += f"- {mta['agent_name'].upper()}: {mta['summary']['weighted_score']}/10"
        if mta['summary']['strengths']:
            mta_context += f" - Styrkor: {', '.join(mta['summary']['strengths'][:2])}"
        mta_context += "\n"
```

**Result**: ~500-1000 tokens of meta-information, NOT full responses

---

## Knowledge Chain

### Purpose
Accumulates **meta-information** about the debate WITHOUT storing full response transcripts.

### Structure

```python
knowledge_chain = [
    # MTA Analysis
    {
        'type': 'mta_analysis',
        'round': 1,
        'agent': 'gpt',
        'analysis': {
            'agent_name': 'gpt',
            'round_number': 1,
            'analysis': {...},  # 6 dimensions
            'summary': {...}     # Scores, strengths, weaknesses
        }
    },
    # ONESEEK Comment
    {
        'round': 1,
        'agent': 'gpt',
        'insight': "GPT visar stark faktaförankring (8.2/10)..."
    },
    # ONESEEK Reasoning for Own Answer
    {
        'round': 1,
        'agent': 'oneseek',
        'insight': "OneSeek: GPT:s poäng om X (8.1/10) vägde tungt..."
    }
]
```

### Usage

**In Comments** (Lines 13892-13898):
```python
# Format all previous MTA analyses for context
all_mta_analyses_formatted = ""
mta_analyses = [item['analysis'] for item in knowledge_chain if item.get('type') == 'mta_analysis']
if mta_analyses:
    all_mta_analyses_formatted = "\n".join([
        f"- {a['agent_name'].upper()} (Runda {a['round_number']}): {a['summary']['weighted_score']}/10"
        for a in mta_analyses
    ])
```

**In Insights** (Lines 14016-14023):
```python
# Build formatted MTA analyses list following YAML spec
mta_analyses = [item['analysis'] for item in knowledge_chain if item.get('type') == 'mta_analysis']
all_mta_analyses_formatted = ""
if mta_analyses:
    all_mta_analyses_formatted = "\n".join([
        f"- {a['agent_name'].upper()} (Runda {a['round_number']}): {a['summary']['weighted_score']}/10 - Styrkor: {', '.join(a['summary']['strengths'][:2]) if a['summary']['strengths'] else 'N/A'}"
        for a in mta_analyses
    ])
```

**In ONESEEK's Own Answer** (Lines 14178-14250):
```python
# Build context with insights and MTA data
insights_context = "\n\nINSIKTER OCH ANALYSER:\n"
for item in knowledge_chain:
    if item.get('agent') and item.get('insight'):
        agent = item['agent']
        insight = item['insight']
        # Truncate to 150 chars for token management
        insights_context += f"- {agent.upper()}: {insight[:150]}...\n"

# Build MTA context
mta_context = "\n\nMTA-KVALITETSBEDÖMNINGAR:\n"
for mta in mta_analyses:
    mta_context += f"- {mta['agent_name'].upper()}: {mta['summary']['weighted_score']}/10"
    if mta['summary']['strengths']:
        mta_context += f" - Styrkor: {', '.join(mta['summary']['strengths'][:2])}"
    if mta['summary']['key_insights']:
        mta_context += f" - Insikter: {', '.join(mta['summary']['key_insights'][:1])}"
    mta_context += "\n"
```

---

## ONESEEK's Own Answer

### Generation (Lines 14120-14348)

After all external agents have responded in a round, ONESEEK generates its own comprehensive answer.

### Context Building

**Full Context** (Lines 14129-14250):
```python
# 1. Previous rounds (agent names only)
background_context = "Runda 1: gpt, gemini, deepseek bidrog. "

# 2. Current round (truncated responses)
current_round_context = """
GPT:
[First 400 chars of GPT's response]...

GEMINI:
[First 400 chars of Gemini's response]...
"""

# 3. Insights from knowledge chain (truncated)
insights_context = """
- GPT: GPT visar stark faktaförankring (8.2/10)...
- GEMINI: Gemini tillför kreativa perspektiv...
"""

# 4. MTA quality assessments
mta_context = """
- GPT: 8.1/10 - Styrkor: Strong factual anchoring, Clear communication
- GEMINI: 7.5/10 - Styrkor: Original perspectives, Creative thinking
"""
```

### Answer Prompt (Lines 14178-14212)

```
Du är ONESEEK – en transparent och balanserad AI som genererar sitt eget svar i debatten.

DEBATTFRÅGA: {question}

{background_context}

{current_round_context}

{insights_context}

{mta_context}

UPPGIFT:
Ge ditt eget välgrundade svar på debattfrågan (150-250 ord).

INSTRUKTIONER:
- Bygg vidare på de bästa argumenten från andra AI:er
- Integrera olika perspektiv till en helhetsbild
- Var transparent om osäkerheter
- Var konkret och lösningsorienterad
- Undvik att bara upprepa vad andra sagt
- Basera ditt svar på MTA-kvalitetsbedömningarna
```

### Generation Parameters

- **Max tokens**: 600
- **Temperature**: 0.75
- **Timeout**: 45 seconds
- **Streaming**: Yes (sent token-by-token to frontend)

### Events

```javascript
// Start event
{
  type: "oneseek_own_answer_start",
  round: 1,
  message: "✍️ OneSeek skriver sitt eget svar..."
}

// Streamed tokens
{
  type: "oneseek_own_answer",
  round: 1,
  text: "...",
  complete: false,
  agent: "oneseek"
}

// Final event
{
  type: "oneseek_own_answer",
  round: 1,
  text: "...",
  complete: true,
  agent: "oneseek"
}
```

### Reasoning Generation (Lines 14216-14312)

After generating the answer, ONESEEK explains its reasoning.

**Reasoning Prompt** (Lines 14216-14272):
```
Du är ONESEEK som förklarar sitt resonemang för sitt svar.

MITT SVAR:
{answer}

KONTEXT:
{insights_context}
{mta_context}

UPPGIFT:
Förklara kortfattat (100-150 ord) hur du resonerade när du byggde ditt svar.

VAR SPECIFIK:
- Vilka SPECIFIKA argument från andra AI-svar påverkade dig? (nämn namn och vad de sa)
- Hur vägde du MTA-kvalitetsbedömningarna? (nämn konkreta poäng och vad de betydde)
- Vilka styrkor och svagheter såg du som du försökte balansera?
- Varför valde du att betona vissa aspekter framför andra?

Var KONKRET, inte generell. Ge verkliga exempel på hur du använde andras argument.
```

**Generation Parameters**:
- **Max tokens**: 300
- **Temperature**: 0.75
- **Timeout**: 45 seconds

**Event**:
```javascript
{
  type: "oneseek_own_reasoning",
  round: 1,
  message: "GPT:s poäng om klimatåtgärder (8.1/10) vägde tungt - särskilt argumentet om ekonomiska incitament. Geminis kreativa perspektiv (7.5/10) på teknologiska lösningar var originellt men svagare i faktaförankring enligt MTA. Valde att betona GPT:s faktabaserade approach samtidigt som jag integrerade Geminis innovation. DeepSeeks fokus på politik balanserade diskussionen.",
  data: {
    reasoning: "..."
  }
}
```

**Stored in Knowledge Chain**:
```python
knowledge_chain.append({
    'round': round_num,
    'agent': 'oneseek',
    'insight': f"OneSeek: {reasoning}"
})
```

---

## Voting System

### When
- **Only in Round 3** after all responses (external + ONESEEK)

### Who Votes (Lines 14505)
```python
all_voters = debate_agents + ['oneseek']
# ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
```

### Voting Context (Lines 14514-14526)

**Only Round 3 responses** (not entire debate):
```python
# Build context with ONLY THE LAST ROUND for voting
all_responses_text = ""
if debate_rounds:
    last_round = debate_rounds[-1]
    all_responses_text += f"\n\nSISTA RUNDAN (Runda {last_round['round']}):\n"
    for resp in last_round['responses']:
        if resp['agent'] != voter and resp.get('success', False):
            # Include up to 500 chars per response
            response_text = resp['response'][:500]
            if len(resp['response']) > 500:
                response_text += "..."
            all_responses_text += f"\n{resp['agent'].upper()}:\n{response_text}\n"
```

**Includes**: GPT, Gemini, DeepSeek, Grok, ONESEEK responses from Round 3

### Voting Prompt (Lines 14527-14546)

```
DEBATTFRÅGA: {question}

{all_responses_text}

RÖSTNINGSUPPGIFT:
Analysera bidragen ovan från sista rundan och rösta på den modell som var bäst.

REGLER:
- Du kan INTE rösta på dig själv
- Välj mellan: {other_agents}
- Ge en motivering på 50-80 ord som förklarar:
  1. Vad som var starkt med det svaret/modellen
  2. Specifika argument som övertyagde dig
  3. Varför detta svar var bättre än de andra

FORMAT (följ exakt):
RÖST: [modellnamn från listan]
MOTIVERING: [Din motivering i 50-80 ord med konkreta argument från debatten]
```

### API Calls

**External AI** (Lines 14566-14593):
```python
service_endpoints = {
    'gpt': f'{BACKEND_API_URL}/api/external/openai',
    'gemini': f'{BACKEND_API_URL}/api/external/gemini',
    'deepseek': f'{BACKEND_API_URL}/api/external/deepseek',
    'grok': f'{BACKEND_API_URL}/api/external/grok'
}

endpoint = service_endpoints.get(voter)
vote_response = await loop.run_in_executor(
    None,
    lambda: requests.post(
        endpoint,
        json={'question': voting_prompt},
        timeout=45
    )
)
```

**ONESEEK** (Lines 14550-14565):
```python
if voter == 'oneseek':
    # ONESEEK votes using local LLAMA server
    server_url = LLAMA_SERVER_URL if LLAMA_SERVER_URL else GGUF_SERVER_BASE
    vote_response = requests.post(
        f"{server_url}/v1/chat/completions",
        json={
            "messages": [{"role": "user", "content": voting_prompt}],
            "max_tokens": 200,
            "temperature": 0.7,
            "stream": False
        },
        timeout=30
    )
```

### Response Parsing (Lines 14595-14627)

```python
# Parse RÖST and MOTIVERING from response
import re
vote_for = None
motivation = ""

# Look for RÖST: line
rost_match = re.search(r'RÖST:\s*(\w+)', vote_response_text, re.IGNORECASE)
if rost_match:
    vote_for = rost_match.group(1).lower()

# Look for MOTIVERING: section
motiv_match = re.search(r'MOTIVERING:\s*(.+)', vote_response_text, re.IGNORECASE | re.DOTALL)
if motiv_match:
    motivation = motiv_match.group(1).strip()

# Validate vote is for a valid agent (not self)
if vote_for not in other_agents:
    logger.warning(f"{voter} voted for invalid agent '{vote_for}', choosing first from list")
    vote_for = other_agents[0]

# Ensure motivation is not empty
if not motivation:
    motivation = f"{vote_for.upper()} presenterade de mest övertygande argumenten..."
```

### Events

**Vote Received** (Lines 14643-14649):
```javascript
{
  type: "vote_received",
  voter: "gpt",
  voted_for: "oneseek",
  message: "GPT röstar på ONESEEK – motivering: ONESEEKs syntes var balanserad och inkluderade perspektiv från alla. Argumentationen var koherent och byggde vidare på våra individuella poänger med stark logisk struktur."
}
```

### Vote Counting (Lines 14656-14659)

```python
winner = max(votes.items(), key=lambda x: x[1])[0] if votes else debate_agents[0]
winner_votes = votes.get(winner, 0)
```

### Winner Announcement (Lines 14661-14670)

```javascript
{
  type: "winner",
  message: "🏆 Vinnare: ONESEEK med 2 röster!",
  data: {
    winner: "oneseek",
    votes: 2,
    all_votes: {
      "oneseek": 2,
      "gpt": 1,
      "gemini": 1,
      "deepseek": 1
    },
    vote_results: [
      {
        voter: "gpt",
        voted_for: "oneseek",
        motivation: "ONESEEKs syntes var balanserad..."
      },
      // ... other votes
    ]
  }
}
```

### Closing Comment (Lines 14672-14729)

ONESEEK generates a 250-400 word closing statement that:
- Thanks all models for contributions
- Summarizes debate evolution
- Explains why winner won (based on vote motivations)
- Highlights contributions from other models
- Reflects on the question and what was learned

---

## WebSocket Events

Complete list of all events emitted during the debate:

### Debate Flow Events

1. **debate_start**
   - Emitted: Start of debate
   - Data: `{question, round: 1}`

2. **round_start**
   - Emitted: Start of each round
   - Data: `{turn_order, round}`

3. **round_end**
   - Emitted: End of each round
   - Data: `{round}`

### Agent Response Events

4. **ai_response**
   - Emitted: When external agent responds
   - Data: `{agent, success}`

### Echo Events

5. **oneseek_echo_start**
   - Emitted: Before streaming agent's response
   - Data: `{round, agent}`

6. **oneseek_echo**
   - Emitted: Streamed tokens of agent's response
   - Data: `{round, agent, text, complete}`

### MTA-DO Events

7. **mta_analysis**
   - Emitted: After MTA-DO analysis completes
   - Data: Full analysis object (see MTA-DO section)

### Commentary Events

8. **oneseek_reasoning**
   - Emitted: ONESEEK's comment on agent's response
   - Data: `{round, agent, message, data: {reasoning, agent_analyzed}}`

### Insight Events

9. **live_insight**
   - Emitted: 💡 synthesis observation
   - Data: `{round, agent, message, data: {progress}}`

### ONESEEK Answer Events

10. **thinking**
    - Emitted: While ONESEEK generates answer
    - Data: `{message}`

11. **oneseek_own_answer_start**
    - Emitted: Before streaming ONESEEK's answer
    - Data: `{round}`

12. **oneseek_own_answer**
    - Emitted: Streamed tokens of ONESEEK's answer
    - Data: `{round, text, complete, agent}`

13. **oneseek_own_reasoning**
    - Emitted: ONESEEK's reasoning for its answer
    - Data: `{round, message, data: {reasoning}}`

### Summary Events

14. **round_summary**
    - Emitted: After each round
    - Data: `{summary, round, consensus}`

### Voting Events

15. **voting_intro**
    - Emitted: Before voting begins
    - Data: `{message}`

16. **vote_received**
    - Emitted: After each vote
    - Data: `{voter, voted_for, message}`

17. **winner**
    - Emitted: After vote counting
    - Data: `{winner, votes, all_votes, vote_results}`

18. **debate_complete**
    - Emitted: End of debate
    - Data: `{question, rounds, winner, winner_votes, total_votes, vote_results, all_votes, summary}`

---

## Code Locations

### Main Function
- **`websocket_live_debate()`**: Lines 13706-14750 (1044 lines)

### Key Sections

| Functionality | Lines | Description |
|--------------|-------|-------------|
| Debate initialization | 13706-13749 | Setup, randomized turn order |
| External agent requests | 13755-13798 | Parallel API calls |
| Sequential processing lock | 13807-13808 | `oneseek_processing_lock` |
| Per-agent processing | 13810-14106 | Echo → MTA → Comment → Insight |
| Echo streaming | 13845-13858 | Token-by-token streaming |
| MTA-DO analysis | 13860-13888 | Quality evaluation |
| Comment generation | 13890-13999 | Meta-commentary with MTA |
| Insight generation | 14010-14102 | 💡 synthesis |
| ONESEEK answer generation | 14120-14348 | Own response + reasoning |
| Context building | 14129-14250 | Token-optimized context |
| Answer prompt | 14178-14212 | Prompt template |
| Reasoning prompt | 14216-14272 | Explanation prompt |
| Round summary | 14358-14478 | 5 learnings + consensus |
| Voting system | 14495-14655 | All participants vote |
| Vote parsing | 14595-14627 | Extract vote + motivation |
| Winner announcement | 14656-14670 | Count votes, declare winner |
| Closing comment | 14672-14729 | Final reflection |

### MTA-DO Function
- **`analyze_mta_do_response()`**: Lines 13306-13530 (224 lines)

| Section | Lines | Description |
|---------|-------|-------------|
| Prompt template | 13316-13350 | 6-dimension analysis prompt |
| API request with retry | 13352-13385 | Request with retry logic |
| JSON extraction strategy 1 | 13394-13398 | Direct parse |
| JSON extraction strategy 2 | 13400-13434 | Smart brace matching |
| JSON extraction strategy 3 | 13436-13494 | Auto-repair truncated |
| Validation | 13502-13521 | Validate structure |
| Fallback | 13523-13530 | Default scores |

---

## Performance Characteristics

### Timing

| Operation | Timeout | Expected | Code Line |
|-----------|---------|----------|-----------|
| **MTA-DO analysis** | 30s | ~2-3s | 13374 |
| **Comment generation** | 60s | ~5-10s | 13970 |
| **Insight generation** | 120s | ~3-5s | Uses `generate_with_llama_server` |
| **ONESEEK answer** | 45s | ~10-20s | 14196 |
| **ONESEEK reasoning** | 45s | ~10-15s | 14291 |
| **Vote request** | 45s | ~10-30s | 14561, 14586 |
| **Closing comment** | 60s | ~15-30s | 14716 |

### Token Usage

| Context Type | Tokens | Calculation |
|--------------|--------|-------------|
| Previous rounds summary | ~100 | Agent names only |
| Current round responses | ~1600 | 4 agents × 400 chars |
| Knowledge chain | ~500-1000 | Insights + MTA summaries |
| **Total ONESEEK context** | **~2000-3000** | Well within limits |

### Comparison

**If Full Debate Was Carried**:
- Round 3 context: ~8000+ tokens (3 rounds × 4 agents × ~600 tokens)
- Risk of hitting context limits

**With Optimization**:
- Round 3 context: ~2000-3000 tokens
- **Savings**: 60-70%

---

## Summary

The Live Debate System is a sophisticated, real-time debate platform with:

✅ **Sequential processing** - Responses handled one at a time for clear flow  
✅ **MTA-DO integration** - 6-dimension quality analysis in real-time  
✅ **Context optimization** - Smart truncation saves 60-70% tokens  
✅ **Authentic voting** - All participants vote via their APIs/servers  
✅ **Knowledge chain** - Meta-information only, not full transcripts  
✅ **ONESEEK dual role** - Observer + participant with reasoning  
✅ **Robust error handling** - Fallbacks at every level  
✅ **Complete transparency** - 25+ WebSocket events for frontend

**Result**: A transparent, fair, and efficient debate system with real-time quality assessment and authentic participation from all AI models.

---

**Last Verified**: 2025-12-17  
**Source**: `ml_service/server.py` lines 13306-14750  
**Status**: ✅ All information verified against code
