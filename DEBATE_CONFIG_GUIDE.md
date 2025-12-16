# Debate Configuration Guide

## Overview

The `debate.yaml` file serves as the formal specification for CivicAI's real-time AI debate flow. It documents the complete architecture, event sequences, and data transitions that power the live debate feature.

## Purpose

This configuration file provides:

1. **Architecture Documentation**: Complete specification of the queue-based, event-driven debate system
2. **Event Reference**: All WebSocket event types with examples
3. **Flow Specification**: Step-by-step breakdown of debate phases
4. **Configuration Parameters**: All tunable settings for debate behavior
5. **Data Transitions**: How data flows between rounds and components
6. **Validation Standards**: Requirements for correct implementation

## File Location

```
/home/runner/work/CivicAI/CivicAI/debate.yaml
```

## Key Sections

### 1. Metadata

Defines the version, status, and architectural approach:

```yaml
metadata:
  name: "Live AI-Debate Flow"
  version: "1.0.0"
  architecture: "Queue-based, Event-driven"
  status: "Production Ready"
  breaking_from: "Batch processing architecture"
```

### 2. Configuration

Core settings for debate behavior:

```yaml
configuration:
  max_rounds: 3
  max_agents: 5
  agents: [gpt, gemini, deepseek, grok, oneseek]
  personality: "oneseek-debattledare"
  websocket_endpoint: "/ws/debate"
```

**Timing Configuration:**
- `ai_response_timeout`: 60 seconds per AI
- `round_pause`: 1 second between rounds
- `confetti_duration`: 5 seconds for winner celebration
- `streaming_tokens_per_second`: 65 tokens/sec for realistic feel

**Voting Rules:**
- `self_voting_allowed`: false
- `minimum_participants`: 3
- `voting_method`: "majority"

### 3. Flow Architecture

Documents the shift from batch to real-time processing:

```yaml
flow_architecture:
  type: "queue-based"
  principles:
    - "No waiting for batch completion"
    - "Constant live activity"
    - "Token-by-token streaming"
    - "Progressive knowledge building"
    - "Real-time feedback loops"
```

### 4. Debate Sequence

Complete step-by-step flow through 5 phases:

#### Phase 1: Initialization
- Receive and validate question
- Load Debattledare personality automatically
- Setup participants and knowledge chain

#### Phase 2: Debate Rounds (3 rounds)

**Per Round Flow:**
1. **Round Start**: Begin round, build context from previous rounds
2. **Parallel Collection**: Send to external AIs, queue responses on arrival
3. **OneSeek Pipeline**: Process each queued answer
   - Echo (token-by-token streaming)
   - Focused Reasoning (2-3 sentence analysis)
   - Live Insight (one-liner update)
4. **OneSeek's Own Answer**: Generate comprehensive debate response
5. **Round Compression**: 10-point summary of learnings
6. **Round End**: Save data, brief pause

#### Phase 3: Voting
- All 5 AIs vote (no self-voting)
- OneSeek acts as neutral judge
- Real-time vote visibility

#### Phase 4: Winner Announcement
- Simple majority wins
- Confetti animation (5 seconds)
- Transparent vote breakdown

#### Phase 5: Final Summary
- OneSeek provides objective analysis
- Explains debate content and winner

### 5. WebSocket Events

Complete reference of all 17 event types organized by category:

- **Initialization Events**: `thinking`, `debate_init`, `round_start`
- **Queue Processing Events**: `ai_response`, `oneseek_echo_start`, `oneseek_echo`, `oneseek_reasoning`, `live_insight`
- **OneSeek Answer Events**: `oneseek_own_answer_start`, `oneseek_own_answer`, `oneseek_own_reasoning`
- **Round Summary Events**: `round_summary`, `round_end`
- **Voting/Winner Events**: `voting`, `winner`, `debate_complete`
- **Error Events**: `error`

Each event includes:
- Name and description
- Example JSON structure
- When it's emitted
- What data it carries

### 6. Data Transitions

Ensures correctness between rounds:

```yaml
data_transitions:
  round_to_round_transition:
    preserved_data:
      - "Previous round responses"
      - "Accumulated knowledge chain"
      - "Progressive understanding"
      - "Debate context"
    
    validation:
      - "Verify all responses stored"
      - "Ensure knowledge chain integrity"
      - "Validate context completeness"
```

**Feedback Loops:**
- OneSeek → Frontend: Token streaming, ordered events, progress updates
- Frontend → Backend: WebSocket acknowledgments, state sync, error recovery

**Seamless UX Flow:**
- No perceived delays
- Smooth transitions
- Consistent visual feedback
- Progressive disclosure with timestamps

### 7. Error Handling

Strategies for different failure modes:

- **External AI Failures**: Graceful degradation, continue with successful responses
- **WebSocket Errors**: Immediate notification, optional auto-reconnect
- **Timeout Handling**: 60-second timeout per AI, continue with partial results

### 8. Performance Characteristics

Expected behavior:

- **Streaming Speed**: 65 tokens/second (realistic AI feel)
- **Queue Processing**: Asyncio-based, immediate and non-blocking
- **Total Debate Duration**: Typically 30-45 seconds
- **Round Timing**: 1-second pause between rounds

### 9. Future Enhancements

Roadmap for improvements:

**Short-term:**
- Intelligent voting with actual AI analysis
- Better error messages
- Debate pause/resume functionality

**Medium-term:**
- Firebase persistence
- Debate history viewer
- Searchable debate archive

**Long-term:**
- Additional AI models (Claude, LLaMA 3)
- Configurable rules
- Public voting
- Video replay
- Export functionality

## Validation

Use the provided validation script to ensure the configuration is correct:

```bash
python3 validate_debate_config.py
```

The script validates:
- ✓ YAML syntax
- ✓ Required sections present
- ✓ Configuration values match implementation
- ✓ All event types defined
- ✓ Data flow specifications complete

## Implementation Alignment

The `debate.yaml` configuration aligns with:

- **Backend Implementation**: `ml_service/server.py` (WebSocket endpoint)
- **Frontend Integration**: `frontend/src/pages/SevenBZeroPage.jsx`
- **Personality Configuration**: `config/personality_catalog.json`
- **Character Card**: `frontend/public/characters/OneSeek-Debattledare.yaml`

## Usage for Developers

### Understanding the Flow

Read `debate.yaml` to understand:
1. How debate initialization works
2. The queue-based processing architecture
3. What events are emitted and when
4. How data transitions between rounds
5. Error handling strategies

### Making Changes

When modifying the debate implementation:

1. **Update the Code**: Make changes to `ml_service/server.py` or frontend
2. **Update debate.yaml**: Reflect changes in the configuration
3. **Validate**: Run `python3 validate_debate_config.py`
4. **Test**: Ensure all debate tests pass
5. **Document**: Update relevant documentation files

### Adding New Event Types

To add a new event type:

1. Add to appropriate category in `websocket_events` section
2. Include name, description, and example
3. Update implementation to emit the event
4. Update frontend to handle the event
5. Add validation in `validate_debate_config.py`

## Usage for Users

End users don't interact with `debate.yaml` directly. It's a developer reference. For user-facing documentation, see:

- **User Guide**: `docs/DEBATE_USER_GUIDE.md`
- **Implementation Details**: `DEBATE_IMPLEMENTATION.md`
- **README**: `docs/DEBATE_README.md`

## Troubleshooting

### YAML Syntax Errors

If validation fails with YAML syntax errors:

```bash
python3 -c "import yaml; yaml.safe_load(open('debate.yaml'))"
```

This will show the exact line with the syntax error.

### Configuration Mismatch

If the configuration doesn't match implementation:

1. Check `ml_service/server.py` for actual values
2. Compare with `debate.yaml` specification
3. Update whichever is incorrect
4. Run validation script again

### Missing Event Types

If an event type is missing:

1. Check the `websocket_events` section
2. Look for the event in implementation
3. Add it to the appropriate category
4. Include example JSON structure

## Version History

### v1.0.0 (2024-12-16)
- Initial release
- Complete real-time flow specification
- Queue-based architecture documented
- All 17 event types defined
- Data transition specifications
- Error handling strategies
- Performance characteristics

## References

- **Main Implementation**: [DEBATE_IMPLEMENTATION.md](./DEBATE_IMPLEMENTATION.md)
- **Real-time Summary**: [IMPLEMENTATION_SUMMARY_REALTIME_DEBATE.md](./IMPLEMENTATION_SUMMARY_REALTIME_DEBATE.md)
- **User Guide**: [docs/DEBATE_USER_GUIDE.md](./docs/DEBATE_USER_GUIDE.md)
- **README**: [docs/DEBATE_README.md](./docs/DEBATE_README.md)
- **Server Implementation**: `ml_service/server.py` (line 13305+)
- **Frontend Integration**: `frontend/src/pages/SevenBZeroPage.jsx`

## Support

For questions or issues:

1. Read this guide thoroughly
2. Check the validation script output
3. Review implementation documentation
4. Open an issue on GitHub
5. Contact the development team

---

**Maintained by**: CivicAI Development Team  
**Last Updated**: 2024-12-16  
**Status**: Production Ready ✅
