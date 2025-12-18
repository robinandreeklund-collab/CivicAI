# ONESEEK Debate Enhancements - Quick Reference

## 🎯 What Changed?

**ONESEEK now participates in random positions during rounds 2 & 3 instead of always going last.**

## 🔄 Debate Flow

### Round 1 (Unchanged)
```
External Agents (parallel) → ONESEEK echoes each → ONESEEK synthesizes
```

### Rounds 2 & 3 (New)
```
Random order: [Agent, ONESEEK, Agent, Agent, Agent]
Position varies: 1st, 2nd, 3rd, 4th, or 5th
```

## 📍 Position Behavior

| Position | Behavior |
|----------|----------|
| **1-2** (Early) | Sets agenda, introduces perspectives |
| **3** (Mid) | Balances response and anticipation |
| **4-5** (Late) | Synthesizes insights, draws conclusions |

## 🗳️ Voting Criteria (Priority Order)

1. **Syntesförmåga** - Synthesis ability
2. **Balanserad Argumentation** - Balanced arguments
3. **Djup och Substans** - Depth and substance
4. **Praktisk Tillämpbarhet** - Practical applicability
5. **Klarhet och Struktur** - Clarity and structure
6. **Originalitet** - Originality

## 📝 Key Prompts Enhanced

### ONESEEK Main Prompt
- Stronger stances with concrete recommendations
- Position-aware instructions
- Emphasis on specific engagement with other agents
- Balanced but decisive tone

### Voting Prompt
- Explicit synthesis and balance criteria
- Prioritized evaluation factors
- Recognition of ONESEEK's strengths

## 🧪 Testing

Run validation:
```bash
cd /home/runner/work/CivicAI/CivicAI
python /tmp/test_debate_logic.py
```

Run tests:
```bash
python tests/test_debate_randomization.py
```

## 📊 Expected Results

- **Vote Count**: 10-20% increase for ONESEEK
- **Position Distribution**: Roughly equal across 5 positions
- **Debate Quality**: More dynamic and varied discussions

## 🔍 Where to Look

### Main Implementation
```
ml_service/server.py
Lines 13107-13730 (debate flow logic)
```

### Configuration
```
frontend/public/characters/OneSeek-Debattledare.yaml
(personality and system prompt)
```

### Tests
```
tests/test_debate_randomization.py
(turn order and position tests)
```

## 🚨 Quick Debug

### Issue: ONESEEK always last in round 2
**Check**: Line 13111 in server.py
```python
if round_num >= 2:  # Should include ONESEEK
```

### Issue: ONESEEK not responding
**Check**: Lines 13444-13454 in server.py
```python
if agent_name == 'oneseek':
    # Should break and generate response
```

### Issue: Turn order wrong
**Check**: Lines 13111-13120 in server.py
```python
# Round 1: Only external agents
# Rounds 2-3: Include oneseek
```

## 📞 Quick Commands

**View current debate config:**
```bash
cat /home/runner/work/CivicAI/CivicAI/debate.yaml
```

**Check personality:**
```bash
cat frontend/public/characters/OneSeek-Debattledare.yaml
```

**Validate syntax:**
```bash
python -m py_compile ml_service/server.py
```

## 💡 Tips

1. **Monitor first 5 debates** to validate positioning works
2. **Track ONESEEK votes** to measure impact
3. **Watch position distribution** should be ~20% per position
4. **User feedback** is critical for prompt refinement

## 🔙 Rollback

If needed, revert commit:
```bash
git revert 0600860  # Documentation
git revert f4e8888  # Main implementation
```

## ✅ Validation Checklist

- [ ] Round 1: ONESEEK goes last ✓
- [ ] Round 2: ONESEEK in random position ✓
- [ ] Round 3: ONESEEK in random position ✓
- [ ] All 5 positions possible ✓
- [ ] No duplicate agents ✓
- [ ] Voting criteria updated ✓

## 📚 Full Documentation

See: `ONESEEK_DEBATE_ENHANCEMENTS.md` for comprehensive details

---

**Last Updated**: 2025-12-17  
**Status**: ✅ Implemented and Tested
