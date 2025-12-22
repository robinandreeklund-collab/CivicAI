# Debug Log Viewer - Easy to Read Debate Logs

## Problem

The debate debug logs are saved as JSON files, which can be hard to read when:
- Responses are very long (hundreds of characters)
- Multiple rounds with many agents
- Complex nested structure

## Solution

Use the `view_debug_log.py` script to format logs in a human-readable way.

## Usage

### View Latest Debate Log

```bash
cd ml_service

# Find the latest log file
ls -lt debate_debug_logs/ | head -5

# View it with default truncation (300 chars)
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json
```

### View Specific Sections

```bash
# Show only statistics
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --section stats

# Show only voting phase
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --section voting

# Show only final results
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --section results

# Show only rounds (responses, processing)
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --section rounds

# Show only knowledge chain
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --section knowledge
```

### Control Text Truncation

```bash
# Show more text (500 chars instead of default 300)
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --truncate 500

# Show less text (100 chars)
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --truncate 100

# Show FULL text without truncation (can be very long!)
python view_debug_log.py debate_debug_logs/debate_20231221_143022.json --full
```

### Common Workflows

#### Quick overview
```bash
python view_debug_log.py debate_debug_logs/latest.json --section stats
```

#### Check voting issues
```bash
python view_debug_log.py debate_debug_logs/latest.json --section voting --truncate 500
```

#### Inspect GPT's responses
```bash
python view_debug_log.py debate_debug_logs/latest.json --section rounds --truncate 1000 | grep -A 20 "GPT"
```

#### See full prompts (for debugging)
```bash
python view_debug_log.py debate_debug_logs/latest.json --section voting --full
```

## Output Format

The script formats the log with:
- **Clear section headers** (with ====== separators)
- **Agent names in UPPERCASE** for easy scanning
- **Timestamps in HH:MM:SS format** (easier to read than ISO)
- **Character counts** for all text fields
- **Truncated text** with "[X more chars]" indicator
- **Visual indicators**: ✓ for success, ✗ for failure, 💡 for insights, 🏆 for winners

### Example Output

```
================================================================================
DEBATE DEBUG LOG: 20231221_143022
================================================================================
Question: Should AI be regulated?
Started: 14:30:22
Completed: 14:35:45
Participants: gpt, gemini, deepseek, grok, oneseek

================================================================================
STATISTICS
================================================================================
Total Rounds: 3
External Prompts: 12
External Responses: 12
Knowledge Chain Entries: 36
Votes Cast: 5

================================================================================
ROUND 1
================================================================================
Turn Order: gpt → oneseek → gemini → deepseek → grok

--- External AI Interactions ---

[GPT] Request (position 0)
  Time: 14:30:23
  Prompt Length: 450 chars
  Prompt: DEBATTFRÅGA: Should AI be regulated?... [150 more chars]

[GPT] Response ✓
  Time: 14:30:28
  Length: 287 chars
  Text: Yes, AI should be regulated because... [87 more chars]

...

================================================================================
VOTING PHASE
================================================================================

[GPT]
  Prompt Time: 14:35:20
  Prompt Length: 890 chars
  Included Responses: oneseek, gemini, deepseek, grok
  ✓ Voted For: ONESEEK
  Full Response: RÖST: oneseek
MOTIVERING: OneSeek gave the most comprehensive analysis... [134 more chars]

================================================================================
FINAL RESULTS
================================================================================
🏆 Winner: ONESEEK

Vote Counts:
  ONESEEK: 3 votes
  GPT: 1 vote
  DEEPSEEK: 1 vote
  GEMINI: 0 votes
  GROK: 0 votes
```

## Tips

### Finding specific information

```bash
# Find all voting prompts sent to GPT
python view_debug_log.py debate_*.json --section voting | grep -A 10 "^\[GPT\]"

# Check which agents had failed responses
python view_debug_log.py debate_*.json --section rounds | grep "Response ✗"

# See all OneSeek's insights
python view_debug_log.py debate_*.json --section knowledge | grep "Insights:"
```

### Comparing debates

```bash
# Compare two debates side by side
python view_debug_log.py debate_1.json --section results > debate1_results.txt
python view_debug_log.py debate_2.json --section results > debate2_results.txt
diff debate1_results.txt debate2_results.txt
```

### Saving formatted output

```bash
# Save formatted log to text file
python view_debug_log.py debate_20231221_143022.json > debate_readable.txt

# View in pager
python view_debug_log.py debate_20231221_143022.json | less

# Search for specific content
python view_debug_log.py debate_20231221_143022.json | grep -i "error"
```

## Benefits

✅ **Easier to read** - Clear formatting with section headers
✅ **Faster navigation** - View specific sections only
✅ **Configurable detail** - Adjust truncation based on needs
✅ **Quick scanning** - Visual indicators and uppercase names
✅ **Searchable** - Pipe to grep or save to file

## Original JSON

If you need the full JSON data for programmatic access:
```bash
# View raw JSON (pretty-printed)
cat debate_debug_logs/debate_20231221_143022.json | jq .

# Extract specific data
cat debate_debug_logs/debate_20231221_143022.json | jq '.voting.responses'
```

The JSON files are now saved with `indent=4` for better readability when viewed directly.
