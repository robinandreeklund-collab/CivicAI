# ONESEEK Debate Enhancements

## Overview
This document describes the enhancements made to ONESEEK's participation in AI debates, including random positioning in rounds 2-3, enhanced prompts for stronger participative behavior, and improved voting criteria.

## Key Changes

### 1. Random Positioning in Rounds 2 & 3

#### Previous Behavior
- ONESEEK always responded **last** in all rounds
- External agents (GPT, Gemini, DeepSeek, Grok) were processed in parallel
- ONESEEK would echo and comment on each response, then provide its own synthesis

#### New Behavior

**Round 1** (Unchanged)
- External agents processed in parallel (randomized order)
- ONESEEK echoes and comments on each response as it arrives
- ONESEEK provides comprehensive synthesis after all external agents respond
- Position: **Always last**

**Rounds 2 & 3** (New)
- ONESEEK is included in the randomized turn order
- All participants (including ONESEEK) are shuffled together
- ONESEEK can appear in any position (1-5)
- Agents process sequentially in turn order
- Position: **Random (1-5)**

#### Implementation Details

```python
# Round determination logic
if round_num >= 2:
    # Rounds 2 & 3: Include ONESEEK in random position
    all_participants = debate_agents.copy() + ['oneseek']
    random.shuffle(all_participants)
    round_turn_order = all_participants
else:
    # Round 1: Only external agents randomized
    round_turn_order = debate_agents.copy()
    random.shuffle(round_turn_order)
```

### 2. Position-Aware Prompts

ONESEEK's prompt is now context-aware based on its position in the turn order:

#### Early Position (1-2)
- Sets the agenda for the discussion
- Introduces perspectives that need exploration
- More proactive and forward-looking

#### Mid Position (3)
- Balances early and late strategies
- Responds to some while anticipating others

#### Late Position (4-5)
- Synthesizes insights from earlier responses
- Draws together threads and identifies patterns
- More comprehensive and conclusive

#### Prompt Structure
```python
position_context = f"DIN POSITION: Du svarar som nummer {oneseek_pos} av {total_participants} i denna runda."

# Behavioral instructions adapt based on position
# - Om du svarar tidigt: Sätt agendan och introducera perspektiv
# - Om du svarar sent: Syntetisera insikter och dra samman trådar
```

### 3. Enhanced Main Prompt

#### Key Enhancements
1. **Stronger Stances**: ONESEEK takes clearer positions while maintaining analytical depth
2. **Concrete Recommendations**: Always concludes with actionable insights
3. **Balanced but Decisive**: Values facts but isn't afraid to draw conclusions
4. **Specific Engagement**: References other agents by name and addresses their specific points

#### Prompt Highlights
```
BEHAVIORAL ENFORCEMENT - DU SKA:
- Referera till och bemöt specifika poänger från andra modeller (använd namn)
- Håll med där du håller med – och förklara varför
- Utmana eller nyansera där du ser svagheter eller missade vinklar
- Lägg till egna reflektioner, exempel, fakta eller perspektiv som saknas
- Ta en tydlig ståndpunkt i frågan med konkreta rekommendationer
```

### 4. Improved Voting Criteria

Voting now prioritizes qualities that align with ONESEEK's strengths:

#### Evaluation Criteria (Priority Order)
1. **Syntesförmåga** - Ability to integrate insights from multiple perspectives
2. **Balanserad Argumentation** - Objectively weighs pros and cons
3. **Djup och Substans** - Provides concrete examples, facts, and nuanced reasoning
4. **Praktisk Tillämpbarhet** - Offers concrete recommendations or conclusions
5. **Klarhet och Struktur** - Well-formulated and easy to follow
6. **Originalitet** - Adds unique perspectives others missed

This prioritization makes ONESEEK's synthesis capabilities more recognizable and valued by external AI models during voting.

### 5. Updated Personality Configuration

The `OneSeek-Debattledare.yaml` configuration has been enhanced:

#### Character Persona
- From: "helt neutral och objektiv"
- To: "både neutral observatör OCH aktiv deltagare med egna ståndpunkter"

#### System Prompt
- Emphasizes ONESEEK can appear in any position in rounds 2-3
- Highlights balance between learning from others and contributing expertise
- Stresses importance of concluding with concrete recommendations

## Technical Architecture

### File Structure
```
ml_service/
  └── server.py                          # Main debate logic (websocket_live_debate)
frontend/public/characters/
  └── OneSeek-Debattledare.yaml          # Personality configuration
tests/
  └── test_debate_randomization.py       # Turn order tests
```

### Flow Diagrams

#### Round 1 Flow
```
1. External agents (GPT, Gemini, DeepSeek, Grok) - Parallel
   ↓
2. ONESEEK echoes each response - Sequential
   ↓
3. ONESEEK provides comprehensive synthesis - Last
```

#### Rounds 2-3 Flow
```
Turn Order (randomized): [Agent1, Agent2, ONESEEK, Agent3, Agent4]

1. Agent1 responds
   ↓
2. Agent2 responds
   ↓
3. ONESEEK responds (position-aware)
   ↓
4. Agent3 responds
   ↓
5. Agent4 responds
```

### Agent Processing

**Round 1**: Parallel processing with immediate echo/comment
```python
external_tasks = [asyncio.create_task(get_and_process_immediately(agent)) 
                  for agent in external_agents]
await asyncio.gather(*external_tasks, return_exceptions=True)
```

**Rounds 2-3**: Sequential processing in turn order
```python
for agent_name in round_turn_order:
    if agent_name == 'oneseek':
        # Generate ONESEEK response
        break
    else:
        # Process external agent
        response = await get_and_process_immediately(agent_name)
        round_responses.append(response)

# Continue with remaining agents after ONESEEK
```

## Testing

### Test Coverage
- ✅ Round 1: ONESEEK not in turn order
- ✅ Rounds 2-3: ONESEEK included in turn order
- ✅ ONESEEK appears in all positions (0-4)
- ✅ Position distribution is properly randomized
- ✅ Turn order contains all agents exactly once

### Running Tests
```bash
cd /home/runner/work/CivicAI/CivicAI
python tests/test_debate_randomization.py
```

### Validation Results
```
ONESEEK appeared in positions: [0, 1, 2, 3, 4]
Position distribution: [(0, 4), (1, 5), (2, 3), (3, 7), (4, 1)]
✅ Position variety confirmed
```

## Expected Impact

### Performance Goals
1. **Increased Voting Success**: ONESEEK should receive more votes due to:
   - Enhanced synthesis highlighted in voting criteria
   - Stronger, more decisive positions
   - Better integration with debate flow

2. **Better Debate Quality**: 
   - More dynamic discussions (ONESEEK can set agenda early)
   - Richer synthesis when ONESEEK appears late
   - Less predictable debate flow

3. **Improved Recognition**:
   - External models better recognize ONESEEK's value
   - Synthesis and balanced arguments explicitly valued
   - Concrete recommendations make contributions more memorable

### Monitoring Metrics
- Vote counts for ONESEEK (before vs after changes)
- Position in turn order vs vote correlation
- User feedback on debate quality
- Consensus/divergence levels

## Future Enhancements

### Potential Improvements
1. **Adaptive Strategy**: ONESEEK could adjust strategy based on:
   - Current consensus level
   - Quality of previous contributions
   - Debate topic complexity

2. **Position Optimization**: Analyze which positions yield best results:
   - Early: Better for agenda-setting topics
   - Late: Better for complex synthesis tasks

3. **Dynamic Criteria**: Voting criteria could adapt based on:
   - Topic type (technical vs philosophical)
   - Round number
   - Consensus levels

## Rollback Plan

If issues arise, revert these commits:
1. `f4e8888` - Main implementation
2. Restore `OneSeek-Debattledare.yaml` from previous version

Round 1 behavior is unchanged, so basic debate functionality is preserved.

## References

### Key Files Modified
- `ml_service/server.py` (lines 13107-13730)
- `frontend/public/characters/OneSeek-Debattledare.yaml`
- `tests/test_debate_randomization.py`

### Related Documentation
- `DEBATE_IMPLEMENTATION.md`
- `docs/DEBATE_USER_GUIDE.md`
- `debate.yaml`

## Contact

For questions or issues related to these enhancements:
- Review the implementation in `ml_service/server.py`
- Check test coverage in `tests/test_debate_randomization.py`
- Consult debate configuration in `debate.yaml`
