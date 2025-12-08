# GGUF Export Implementation Verification Guide

This guide helps verify that the two-step GGUF export implementation is working correctly.

## Quick Verification Checklist

### 1. Script Files Present

Check that all required scripts exist:

```bash
# Python scripts
ls -l scripts/export_gguf_f16.py
ls -l scripts/quantize_q5.py
ls -l scripts/export_gguf_q5.py

# PowerShell scripts (Windows)
ls -l scripts/export_gguf_f16.ps1
ls -l scripts/quantize_q5.ps1
ls -l scripts/export_gguf_q5.ps1
ls -l scripts/run_gguf_server_cuda.ps1

# Shell scripts (Linux/macOS)
ls -l scripts/export_gguf_f16.sh
ls -l scripts/quantize_q5.sh
ls -l scripts/export_gguf_q5.sh
ls -l scripts/run_gguf_server_cuda.sh
```

**Expected:** All files should exist and be executable (Python and shell scripts).

### 2. Python Syntax Check

Verify Python scripts have valid syntax:

```bash
python3 -m py_compile scripts/export_gguf_f16.py
python3 -m py_compile scripts/quantize_q5.py
python3 -m py_compile scripts/export_gguf_q5.py
```

**Expected:** No output = success, syntax errors = failure.

### 3. Shell Script Syntax Check

Verify shell scripts have valid syntax:

```bash
bash -n scripts/export_gguf_f16.sh
bash -n scripts/quantize_q5.sh
bash -n scripts/export_gguf_q5.sh
bash -n scripts/run_gguf_server_cuda.sh
```

**Expected:** No output = success, syntax errors = failure.

### 4. Documentation Check

Verify documentation files exist:

```bash
ls -l docs/gguf-export.md
grep -i "GGUF" README.md
grep -i "export_gguf" scripts/README.md
```

**Expected:** 
- `docs/gguf-export.md` exists
- README.md contains GGUF export section
- scripts/README.md contains GGUF script documentation

### 5. Help Text Check

Verify all scripts provide help information:

```bash
# Python scripts
python scripts/export_gguf_f16.py --help
python scripts/quantize_q5.py --help
python scripts/export_gguf_q5.py --help

# PowerShell scripts (Windows)
Get-Help .\scripts\export_gguf_f16.ps1
Get-Help .\scripts\quantize_q5.ps1
Get-Help .\scripts\export_gguf_q5.ps1
Get-Help .\scripts\run_gguf_server_cuda.ps1

# Shell scripts (Linux/macOS) - should pass arguments through to Python
./scripts/export_gguf_f16.sh --help
./scripts/quantize_q5.sh --help
./scripts/export_gguf_q5.sh --help
./scripts/run_gguf_server_cuda.sh --help
```

**Expected:** Each script should display usage information.

## Functional Verification

### Test 1: F16 Export (without real model)

Test the F16 export script error handling:

```bash
# This should fail gracefully with clear error message
python scripts/export_gguf_f16.py --src /nonexistent/path --out /tmp/test.gguf
```

**Expected:**
- Error message about model path not existing
- No crash or traceback
- Exit code: 1

### Test 2: Q5 Quantization Binary Search

Test the binary search logic:

```bash
# This should report that llama-quantize is not found
python scripts/quantize_q5.py --src /tmp/fake.gguf --out /tmp/fake_q5.gguf
```

**Expected:**
- Error message about llama-quantize not found
- Instructions on how to install llama-quantize
- Exit code: 1

### Test 3: Combined Export Error Handling

Test the combined script's error handling:

```bash
# This should fail at step 1 with clear error
python scripts/export_gguf_q5.py --src /nonexistent --out /tmp/test_q5.gguf
```

**Expected:**
- Error message indicating Step 1 failed
- Error details from F16 export
- Exit code: 1

### Test 4: JSON Output Mode

Test JSON output for automation:

```bash
# This should output valid JSON even on error
python scripts/export_gguf_f16.py --src /nonexistent --out /tmp/test.gguf --json-output
```

**Expected:**
- Valid JSON output
- Contains "success": false
- Contains "error" field with message

## Binary Requirements Verification

### Check for llama-quantize

Verify the binary search paths:

**Windows:**
```powershell
# Check default path
Test-Path "$env:USERPROFILE\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-quantize.exe"

# Check if in PATH
Get-Command llama-quantize -ErrorAction SilentlyContinue
```

**Linux/macOS:**
```bash
# Check if in PATH
which llama-quantize

# Check common local paths
ls -l ./llama.cpp-bin-cuda/llama-quantize 2>/dev/null
ls -l ./llama.cpp/build/bin/llama-quantize 2>/dev/null
```

### Check for llama-server

**Windows:**
```powershell
Test-Path "$env:USERPROFILE\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-server.exe"
```

**Linux/macOS:**
```bash
which llama-server
ls -l ./llama.cpp-bin-cuda/llama-server 2>/dev/null
ls -l ./llama.cpp/build/bin/llama-server 2>/dev/null
```

## Full Integration Test (if model available)

If you have a small test model:

### Step 1: F16 Export

```bash
python scripts/export_gguf_f16.py \
  --src path/to/small/model \
  --out /tmp/test_model_f16.gguf
```

**Expected:**
- Script runs to completion
- F16 GGUF file created in /tmp/
- File size approximately equal to original model size
- Success message displayed

### Step 2: Q5 Quantization

```bash
python scripts/quantize_q5.py \
  --src /tmp/test_model_f16.gguf \
  --out /tmp/test_model_q5.gguf \
  --type Q5_K_M
```

**Expected:**
- Script runs to completion (requires llama-quantize)
- Q5 GGUF file created in /tmp/
- File size ~50% smaller than F16
- Reduction percentage reported
- Success message displayed

### Step 3: Combined Export

```bash
python scripts/export_gguf_q5.py \
  --src path/to/small/model \
  --out /tmp/test_model_combined_q5.gguf \
  --type Q5_K_M
```

**Expected:**
- Both steps run automatically
- Only Q5 file remains (F16 cleaned up)
- Same size as manual 2-step process
- Success message with reduction stats

### Step 4: Server Test

```bash
# Linux/macOS
./scripts/run_gguf_server_cuda.sh \
  --model /tmp/test_model_q5.gguf \
  --port 8080 \
  --layers 0  # CPU-only for testing

# Windows
.\scripts\run_gguf_server_cuda.ps1 `
  -Model "C:\Temp\test_model_q5.gguf" `
  -Port 8080 `
  -Layers 0
```

**Expected:**
- Server starts without errors
- Listening on http://127.0.0.1:8080
- Can query health endpoint: `curl http://127.0.0.1:8080/health`

## Troubleshooting Verification Issues

### Issue: Python syntax errors

**Solution:**
- Check Python version: `python3 --version` (should be 3.8+)
- Reinstall scripts from repository

### Issue: Shell scripts not executable

**Solution:**
```bash
chmod +x scripts/export_gguf_f16.sh
chmod +x scripts/quantize_q5.sh
chmod +x scripts/export_gguf_q5.sh
chmod +x scripts/run_gguf_server_cuda.sh
```

### Issue: PowerShell execution policy (Windows)

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Documentation missing

**Solution:**
- Check you're on the correct branch
- Pull latest changes: `git pull origin copilot/restore-gguf-two-step-export`

## Success Criteria

The implementation is verified if:

- ✓ All 12 script files exist and are executable
- ✓ Python syntax validation passes for all .py files
- ✓ Shell syntax validation passes for all .sh files
- ✓ All scripts provide help text
- ✓ Error handling works correctly (graceful failures)
- ✓ JSON output mode works
- ✓ Documentation files exist and contain GGUF information
- ✓ Binary search logic handles missing binaries correctly
- ✓ (Optional) Full export works with real model

## Reporting Issues

If verification fails:

1. Note which test(s) failed
2. Copy error messages
3. Check Python version: `python3 --version`
4. Check OS: `uname -a` (Linux/macOS) or `systeminfo` (Windows)
5. Report in issue tracker with above information

---

**Last Updated:** 2024-12-08
**Implementation Version:** 1.0
