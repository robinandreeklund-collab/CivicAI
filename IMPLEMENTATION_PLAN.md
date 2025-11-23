# Implementation Plan: Certified Model Structure

## Overview

Restructuring OneSeek models to use a unified certified structure where each model version is self-contained in `oneseek-certified/`.

## Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Documentation (ONESEEK_CERTIFIED_STRUCTURE.md)
- [x] Helper functions (certified_structure.py)
- [x] DNA-based naming scheme

### Phase 2: Training Integration (CURRENT)
**Goal**: Save trained models to certified structure

**Approach**:
Since we're using LoRA fine-tuning (not full model training), we have two options:

**Option A: Save LoRA separately** (Faster, current approach)
- Save base model reference + LoRA adapters
- Keep base models in `base_models/`
- Pro: Works with current LoRA training
- Con: Not truly self-contained

**Option B: Merge and save complete model** (Ideal, more complex)
- Merge LoRA adapters into base model
- Save complete merged model
- Pro: Truly self-contained, portable
- Con: Requires merging logic, larger storage

**Decision**: Start with Option A, add Option B as enhancement

**Implementation**:
1. Update `pytorch_trainer.py` to save LoRA adapters to certified directory
2. Add base model reference in metadata
3. Copy/link necessary tokenizer files
4. Update DNA fingerprint generation

### Phase 3: ML Service Integration
**Goal**: Load models from certified structure

**Changes needed**:
1. Update `find_base_model_path()` to look in certified directories
2. Update `find_lora_weights()` to find adapters in certified structure
3. Handle symlink resolution for CURRENT model
4. Backward compatibility with old structure

### Phase 4: Admin Panel Integration
**Goal**: UI works with new structure

**Changes needed**:
1. Update model listing to scan certified directories
2. Update "Set as Active" to manage CURRENT symlink
3. Update download endpoints
4. Display DNA-based names properly

### Phase 5: Migration & Cleanup
**Goal**: Move existing models to new structure

**Tools needed**:
1. Migration script for old models
2. Validation tool
3. Cleanup old structure (optional)

## Current Status

- Phase 1: ✅ Complete
- Phase 2: 🔄 In Progress
- Phase 3-5: ⏳ Pending

## Next Steps

1. Integrate certified_structure helpers into pytorch_trainer.py
2. Update train_dna_v2.py to use new structure
3. Test with actual training run
4. Update ml_service to read from new structure

## Notes

- We're keeping LoRA separate (Option A) for now
- Base models remain shared in base_models/
- Each certified model references its base model
- Future enhancement: full model merging (Option B)
