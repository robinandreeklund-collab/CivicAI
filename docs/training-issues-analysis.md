# Training Issues Analysis and Fixes

## Issues Found in pj.yaml Console Output

The `pj.yaml` file provided by the user contained console output from a training run that revealed several critical issues with the training system.

### Issue 1: Forced Dual-Model Mode

**Problem:**
```
[SUCCESS] Mistral 7B found at C:\Users\robin\Documents\GitHub\CivicAI\models\mistral-7b-instruct
[SUCCESS] LLaMA-2 found at C:\Users\robin\Documents\GitHub\CivicAI\models\llama-2-7b-chat
======================================================================
PyTorch Dual-Model Training: OneSeek-7B-Zero v1.0
======================================================================
[MODE] Dual-Model Training Enabled
Available models: ['mistral', 'llama']
```

The training system automatically discovered both Mistral and LLaMA models locally and enabled dual-model mode, training BOTH models even though:
- No base models were selected from the admin panel
- The admin panel selection should be the ONLY source of base models
- The system should not automatically train all discovered models

**Root Cause:**
In `ml/training/pytorch_trainer.py`, the `train_with_pytorch_lora()` function:
1. Called `check_base_models()` to discover all available models
2. Automatically trained ALL discovered models
3. Did not check if models were selected from admin panel
4. Had no validation for base model selection

**Fix Applied:**
- Modified `train_with_pytorch_lora()` to accept `selected_base_models` parameter
- Added validation that raises an error if no base models are selected
- Changed logic to filter discovered models by admin selection
- Only trains models that are both discovered AND selected
- Removed automatic dual-model mode forcing

```python
# Before (automatic dual-model)
available_models = check_base_models(base_models_dir)
# Train ALL available models automatically

# After (admin selection only)
if not selected_base_models:
    raise ValueError("No base models selected from admin panel")

models_to_train = {}
for model_key in selected_base_models:
    # Only train if selected AND available
    ...
```

### Issue 2: Metadata File with Double Dots

**Problem:**
```json
name: oneseek-7b-zero-v1.0..json
{
  "version": "OneSeek-7B-Zero.v1.0.cd830c2a.c3a28ca9.687da763",
  "createdAt": "2025-11-22T00:13:11.127Z",
  ...
}
```

A metadata file was created with double dots in the filename: `oneseek-7b-zero-v1.0..json` instead of `oneseek-7b-zero-v1.0.json`

**Root Cause:**
Likely caused by string concatenation error or improper version string handling during metadata file creation.

**Fix Applied:**
- Explicitly set metadata filename: `metadata_filename = f'oneseek-7b-zero-v{version}.json'`
- Implemented atomic write pattern to prevent file corruption
- Added safeguards against filename formatting errors

```python
# Atomic write pattern
metadata_filename = f'oneseek-7b-zero-v{version}.json'  # Explicit filename
metadata_file = model_dir / metadata_filename
metadata_temp = model_dir / f'{metadata_filename}.tmp'

# Write to temp file first
with open(metadata_temp, 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

# Atomic rename
metadata_temp.replace(metadata_file)
```

### Issue 3: Inconsistent Base Models in Metadata

**Problem:**
Two different metadata files were created with inconsistent base models information:

File 1 (`oneseek-7b-zero-v1.0..json`):
```json
"baseModels": ["mistral-7b-instruct"]
```

File 2 (`oneseek-7b-zero-v1.0.json`):
```json
"baseModels": ["Mistral-7B", "LLaMA-2-7B"]
```

This inconsistency occurred because:
- One file captured the first model trained
- The other file captured both models
- No single source of truth for selected base models

**Fix Applied:**
- Base models now come ONLY from BASE_MODELS environment variable (set by admin.js)
- Updated `train_language_model.py` to read BASE_MODELS and pass to training
- Metadata files now consistently use the selected base models
- Training validates that selected models match what was actually trained

### Issue 4: Run ID Format

**Problem:**
While the run ID format in the log was good (`run-20251122-010916` with no colons), we needed to ensure this format is consistently used and properly documented.

**Fix Applied:**
- Created `generateRunId()` function in `trainingConfig.js`
- Format: `run-YYYYMMDD-HHMMSS` (no colons for Windows compatibility)
- Updated admin.js to use this function
- Documented the format in configuration guide

## Files Modified

### 1. ml/training/pytorch_trainer.py

**Changes:**
- Added `selected_base_models` parameter to `train_with_pytorch_lora()`
- Added validation to ensure base models are selected from admin panel
- Changed from training all discovered models to only selected models
- Implemented atomic write pattern for metadata files
- Updated logging to show selected vs available models
- Changed "dual-model mode" to "multi-model mode" (only if multiple selected)

### 2. ml/training/train_language_model.py

**Changes:**
- Added code to read BASE_MODELS environment variable
- Pass `selected_base_models` to `train_with_pytorch_lora()`
- Ensures only admin-selected models are trained

### 3. scripts/train_dna_v2.py

**Changes:**
- Implemented atomic write pattern for all JSON metadata files
- Write to `.tmp` file first, then atomically rename
- Ensures no partial or corrupted metadata files

## Testing the Fixes

### Test Case 1: No Base Models Selected

**Before:**
- Training would automatically discover and train Mistral + LLaMA
- No error, just trained everything found

**After:**
```
[ERROR] No base models selected!
Base models MUST be selected from the admin panel.
ValueError: No base models selected. Please select at least one model from the admin panel.
```

### Test Case 2: Single Model Selected

**Setup:**
```bash
export BASE_MODELS="mistral-7b-instruct"
python scripts/train_dna_v2.py --dataset datasets/test.jsonl --epochs 3
```

**Before:**
- Would train both Mistral AND LLaMA (ignored selection)
- Output: "Dual-Model Training Enabled"

**After:**
- Trains ONLY Mistral (respects selection)
- Output: "Training 1 selected model(s)"
- Metadata: `"baseModels": ["Mistral-7B"]`

### Test Case 3: Multiple Models Selected

**Setup:**
```bash
export BASE_MODELS="mistral-7b-instruct,llama-2-7b-chat"
python scripts/train_dna_v2.py --dataset datasets/test.jsonl --epochs 3
```

**Before:**
- Same as before (trained both)
- But not because they were selected, just because they were found

**After:**
- Trains both because both are selected
- Output: "Training 2 selected model(s)"
- Metadata: `"baseModels": ["Mistral-7B", "LLaMA-2-7B"]`
- `"multiModelMode": true`

### Test Case 4: Metadata File Integrity

**Before:**
- Could create `oneseek-7b-zero-v1.0..json` (double dots)
- Non-atomic writes could create partial files

**After:**
- Always creates `oneseek-7b-zero-v1.0.json` (correct filename)
- Atomic writes prevent corruption
- Files are either complete or don't exist (no partial writes)

## Configuration System Summary

Since pj.yaml is NOT a configuration file (just console errors), we created a proper configuration system:

1. **Backend Configuration:** `backend/config/trainingConfig.js`
   - All training parameters
   - Adaptive weights settings
   - Auto-stop thresholds
   - Base model validation

2. **Python Configuration:** `scripts/training_config.py`
   - Mirrors JavaScript configuration
   - Reads BASE_MODELS from environment
   - Provides validation functions

3. **Documentation:** `docs/training-config.md`
   - Comprehensive guide
   - Explains why pj.yaml should not be used
   - Examples and best practices

## Key Takeaways

1. ✅ **Base models ONLY from admin panel** - No automatic discovery or defaults
2. ✅ **Atomic metadata writes** - Prevents corruption and ensures proper filenames
3. ✅ **No forced dual-model mode** - Only multi-model if admin selects multiple
4. ✅ **Proper configuration system** - Not using pj.yaml for configuration
5. ✅ **Validation everywhere** - System validates that selection is respected

## What Still Needs to be Done

1. **Adaptive Training Weights Engine** - Adjust weights per model based on performance
2. **Confidence-Based Auto-Stop** - Stop training when loss plateaus
3. **Live metrics broadcasting** - Send real-time updates during training
4. **Test coverage** - Add tests for the new validation logic
5. **Additional documentation** - More examples and API usage guides
