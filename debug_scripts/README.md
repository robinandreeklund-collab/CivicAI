# GGUF vs .BIN Debug Scripts

These scripts help diagnose differences between GGUF and .bin model inference by running them in isolation from the platform code.

## Purpose

Identify the root cause of different behaviors between GGUF and .bin models by:
1. Running identical prompts through both model types
2. Capturing detailed debug information
3. Comparing outputs to pinpoint differences

## Files

- **run_gguf.py** - Runs GGUF model inference with llama-cpp-python
- **run_bin.py** - Runs .bin model inference with transformers + bitsandbytes
- **compare.py** - Compares outputs from both models
- **README.md** - This file

## Requirements

```bash
# For GGUF
pip install llama-cpp-python

# For .bin
pip install transformers bitsandbytes accelerate torch
```

## Usage

### Step 1: Run GGUF Model

```bash
cd debug_scripts
python run_gguf.py
```

Enter the path to your GGUF model file when prompted.
Output will be saved to `gguf_output.txt`

### Step 2: Run .bin Model

```bash
python run_bin.py
```

Enter the path to your .bin model directory when prompted.
Output will be saved to `bin_output.txt`

### Step 3: Compare Results

```bash
python compare.py
```

This will analyze both outputs and show:
- Whether formatted prompts are identical
- Response length comparison
- Detection of issues (User:/Assistant: markers, looping, etc.)
- Similarity percentage
- Side-by-side response comparison

## What to Look For

1. **Prompt Differences**: If formatted prompts differ, that's the root cause
2. **GGUF Issues**: If only GGUF has "User:" markers or looping, the issue is in GGUF inference
3. **Response Quality**: Compare which model follows the system prompt better
4. **Similarity Score**: <50% means very different behavior

## Example Output

```
GGUF vs .BIN MODEL OUTPUT COMPARISON
======================================================================

1. FORMATTED PROMPTS COMPARISON
----------------------------------------------------------------------
✓ IDENTICAL - Both models receive the exact same formatted prompt

2. RESPONSE COMPARISON
----------------------------------------------------------------------
GGUF response length: 245 chars
.BIN response length: 87 chars

GGUF Issues:
  ✗ Contains 'User:' or 'Assistant:' markers
  ✗ Repetitive 'OneSeek' (12 times)

.BIN Issues:
  ✓ No issues detected

3. ACTUAL RESPONSES
----------------------------------------------------------------------
[Full responses shown here]

4. SIMILARITY ANALYSIS
----------------------------------------------------------------------
Response similarity: 23.5%
⚠ VERY DIFFERENT responses - likely different behavior

SUMMARY:
• Prompts are IDENTICAL
• GGUF has issues, .BIN works correctly
• Problem is likely in GGUF inference or stop token handling
```

## Troubleshooting

- **GGUF model not found**: Make sure you provide the full path to the .gguf file
- **BIN model not found**: Make sure you provide the path to the directory containing config.json
- **Import errors**: Install required dependencies (see Requirements)
- **GPU memory errors**: Reduce model size or use CPU-only mode

## Next Steps

Based on comparison results:

1. **If prompts differ**: Fix prompt formatting in platform code
2. **If prompts identical but GGUF loops**: Check stop tokens in llama-cpp-python call
3. **If both have issues**: Check system prompt content
4. **If .bin works but GGUF doesn't**: Compare this debug output to platform GGUF logs
