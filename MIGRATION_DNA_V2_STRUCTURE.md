# Migration to DNA v2 Certified Structure - Implementation Summary

**Date:** 2025-11-23  
**PR:** Remove old oneseek-7b-zero structure  
**Issue:** Closes #69

## Problem Statement

Before this migration, we had:
- **Two parallel model structures** causing confusion:
  - Legacy: `/models/oneseek-7b-zero/` (chaotic, old LoRA files, unclear naming)
  - New: `/models/oneseek-certified/` (DNA-based naming, certified structure)
- **Both used simultaneously** → confusion, duplicate paths, risk of bugs
- **No clean reset option** without manually deleting everything

## Solution Implemented

### 1. Created Reset Functionality

**New Endpoint:** `POST /api/models/reset`

**Features:**
- Deletes entire `/models/oneseek-certified/` directory
- Preserves `/models/basemodeller/` (base models are safe)
- Creates empty certified directory with helpful README
- Logs all actions to ledger for transparency
- Requires typing "RESET" for confirmation (destructive action)

**Implementation:**
- Backend: `/backend/api/models/reset.js`
- Route registration in `/backend/index.js`
- Rate limiting: 5 resets per minute max

### 2. Added Admin UI Reset Button

**Location:** Admin Dashboard → Models Tab → "⚠️ Reset All" button

**UI Features:**
- Red warning styling (border-red-700)
- Confirmation prompt requiring "RESET" to be typed
- Success/error notifications
- Loading state during reset
- Positioned next to "Compare Versions" button

**Implementation:**
- Frontend: `/frontend/src/components/admin/ModelManagement.jsx`
- State management for reset operation
- API integration with error handling

### 3. Updated Documentation

**Files Updated:**
- `README.md`
  - Training examples now use `train_dna_v2.py`
  - Storage paths updated to `oneseek-certified`
  - Architecture diagrams updated
  - 6 sections with path/command changes

- `ONESEEK_7B_ZERO_MIGRATION_GUIDE.md`
  - Added comprehensive DNA v2 update section
  - Documented DNA naming format
  - Documented reset functionality
  - Provided migration path from old structure

### 4. Code Quality Improvements

**Security & Best Practices:**
- Removed hardcoded Windows paths (C:\Users\robin\...)
- Added MODELS_DIR environment variable support
- Replaced deprecated `fs.rmdir()` with `fs.rm()`
- Improved verify_integrity.py script handling
- Better error handling throughout

**Backward Compatibility:**
- Legacy `/models/oneseek-7b-zero/` structure still supported
- Old models appear in model list during transition
- No breaking changes to existing functionality

## Directory Structure

### Before (Chaotic)
```
models/
├── oneseek-7b-zero/          ← Messy, unclear structure
│   ├── weights/
│   ├── lora_adapters/
│   ├── checkpoints/
│   ├── backups/
│   └── base_models/
└── oneseek-certified/        ← New structure (partially used)
```

### After Reset
```
models/
├── basemodeller/             ← Base models (PRESERVED during reset)
│   ├── kb-llama-3-1-8b-swedish/
│   ├── mistral-7b/
│   └── qwen-2-5-7b/
│
└── oneseek-certified/        ← ONLY location for trained models
    ├── OneSeek-7B-Zero.v1.492.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a/
    │   ├── metadata.json
    │   ├── adapter_config.json
    │   ├── adapter_model.bin
    │   ├── training_results.json
    │   └── verify_integrity.py
    │
    ├── OneSeek-7B-Zero.v1.493.sv.dsCivicID+Autonomy.f1e2d3c4.b5e6f7g8/
    │   └── ...
    │
    ├── OneSeek-7B-Zero-CURRENT → v1.493... (symlink to active)
    ├── README.md
    └── .ledger/
        └── reset-log.jsonl
```

## DNA Naming Convention

**Format:** `OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{WEIGHTS_HASH}.{TIMESTAMP_HASH}`

**Example:** `OneSeek-7B-Zero.v1.492.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a`

**Components:**
- `v1.492` - Version number (semantic)
- `sv` - Language code (sv=Swedish, en=English, ensv=Bilingual)
- `dsCivicID-SwedID` - Dataset categories (ds prefix)
- `8f3a1c9d` - Weights hash (8 hex chars)
- `2e7f4b1a` - Timestamp hash (8 hex chars)

**Benefits:**
- Full provenance in directory name
- No external database needed for basic info
- Easy to verify integrity
- Sortable and searchable
- Self-documenting

## Usage Guide

### Reset All Models

**Via Admin Dashboard:**
1. Navigate to Admin Dashboard
2. Click Models tab
3. Click "⚠️ Reset All" button
4. Type "RESET" when prompted
5. Wait for confirmation

**Via API:**
```bash
curl -X POST http://localhost:3001/api/models/reset \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "All trained models have been reset...",
  "details": {
    "certifiedDir": "/path/to/models/oneseek-certified",
    "basemodellerDir": "/path/to/models/basemodeller",
    "timestamp": "2025-11-23T...",
    "action": "Full reset completed"
  },
  "ledger": {
    "timestamp": "2025-11-23T...",
    "user": "Admin",
    "message": "Full reset by Admin on 2025-11-23..."
  }
}
```

### Train New Model (DNA v2)

```bash
python scripts/train_dna_v2.py \
  --dataset datasets/oneseek_identity_v1.jsonl \
  --epochs 3 \
  --learning-rate 2e-5 \
  --auto-stop-threshold 0.95 \
  --auto-stop-patience 3
```

**Output:** `models/oneseek-certified/OneSeek-7B-Zero.v1.{N}.{lang}.{datasets}.{hash}.{timestamp}/`

### Set Active Model

**Via Admin Dashboard:**
1. Navigate to Admin Dashboard → Models
2. Find desired model in list
3. Click "Set as Active" button
4. Confirm the action

**Result:** Symlink created at `models/oneseek-certified/OneSeek-7B-Zero-CURRENT`

## Migration Path

### For Existing Users

**Option 1: Gradual Migration (Recommended)**
1. Keep existing models in `oneseek-7b-zero/`
2. Train new models (automatically uses DNA v2)
3. Test new models
4. When confident, use "Reset All" to clean up
5. Re-train from scratch with certified structure

**Option 2: Clean Start**
1. Backup any important model weights
2. Click "Reset All" in Admin Dashboard
3. Train fresh model from scratch
4. Certified structure from day one

**Option 3: Manual Migration**
1. Manually move/delete `models/oneseek-7b-zero/`
2. Ensure `models/basemodeller/` exists
3. Train new models
4. All new models use certified structure

### For New Users

**No migration needed!** Just follow:
1. Install project
2. Place base models in `models/basemodeller/`
3. Train using DNA v2 commands
4. Everything uses certified structure automatically

## Implementation Checklist

- [x] Create reset endpoint (`/backend/api/models/reset.js`)
- [x] Register route in backend
- [x] Add reset button to Admin UI
- [x] Add confirmation dialog
- [x] Update documentation (README, migration guide)
- [x] Fix code review issues (env vars, deprecated APIs)
- [x] Test backend compilation
- [x] Test frontend build
- [x] Add ledger logging
- [x] Preserve base models during reset
- [x] Create helpful README files after reset
- [ ] Manual testing of reset functionality
- [ ] Manual testing of model training
- [ ] Manual testing of UI button
- [ ] Screenshot of UI for review

## Known Limitations

1. **Old directory not auto-deleted:** The `/models/oneseek-7b-zero/` directory must be manually deleted or removed via reset
2. **Legacy models still visible:** Old models appear in model list during transition period
3. **No undo for reset:** Reset is permanent (by design)
4. **Requires base models:** Users must have base models in `basemodeller/` to train

## Environment Variables

**New in this PR:**
- `MODELS_DIR` - Override default models directory path (optional)
  - Default: `{project_root}/models`
  - Example: `MODELS_DIR=/app/models`

## Testing Notes

**Automated Tests:**
- ✅ Backend syntax check passes
- ✅ Frontend build succeeds
- ✅ No lint errors in modified files

**Manual Testing Required:**
1. Test reset endpoint via curl
2. Test reset button in Admin UI
3. Verify confirmation dialog works
4. Verify ledger logging
5. Verify README creation
6. Test model training after reset
7. Verify basemodeller preservation

## Security Considerations

**Reset Action:**
- Rate limited to 5 requests per minute
- Requires explicit "RESET" confirmation
- Logged to ledger for transparency
- Cannot be undone (by design)

**Base Models:**
- Always preserved during reset
- Stored separately in `basemodeller/`
- Expensive to re-download (multi-GB files)

## Files Changed

| File | Lines Changed | Type |
|------|--------------|------|
| `backend/api/models/reset.js` | +255 | New |
| `backend/index.js` | +2 | Modified |
| `frontend/src/components/admin/ModelManagement.jsx` | +48 -12 | Modified |
| `README.md` | +103 -28 | Modified |
| `ONESEEK_7B_ZERO_MIGRATION_GUIDE.md` | +78 | Modified |

**Total:** ~486 lines changed across 5 files

## Future Enhancements

Potential improvements for future PRs:
- [ ] Add preview of what will be deleted before reset
- [ ] Add option to backup before reset
- [ ] Auto-delete old oneseek-7b-zero directory with user consent
- [ ] Add reset statistics to admin dashboard
- [ ] Add restore functionality from backup
- [ ] Add dry-run mode for reset

## References

- **Issue:** #69
- **DNA v2 Guide:** [DNA_V2_QUICK_REFERENCE.md](DNA_V2_QUICK_REFERENCE.md)
- **Certified Structure:** [ONESEEK_CERTIFIED_STRUCTURE.md](ONESEEK_CERTIFIED_STRUCTURE.md)
- **Migration Guide:** [ONESEEK_7B_ZERO_MIGRATION_GUIDE.md](ONESEEK_7B_ZERO_MIGRATION_GUIDE.md)
- **Training Script:** `scripts/train_dna_v2.py`

## Contact

For questions or issues:
- Open GitHub issue
- Reference PR: Remove old oneseek-7b-zero structure
- Tag: @robinandreeklund-collab

---

**Status:** ✅ Implementation Complete  
**Ready for Testing:** Yes  
**Breaking Changes:** No (backward compatible)  
**Deployment Notes:** Set MODELS_DIR env var if using custom path
