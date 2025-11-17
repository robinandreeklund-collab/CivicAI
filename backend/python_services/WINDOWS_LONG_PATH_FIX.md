# Windows Installation Quick Fix Guide

## Issue: Long Path Error with Lux/Sweetviz

If you see this error when running `pip install -r requirements.txt`:

```
ERROR: Could not install packages due to an OSError: [Errno 2] No such file or directory: 'C:\Users\...\venv\share\jupyter\labextensions\@jupyter-widgets\jupyterlab-manager\static\vendors-node_modules_d3-color_src_color_js-node_modules_d3-format_src_defaultLocale_js-node_m-09b215.2643c43f22ad111f4f82.js'
HINT: This error might have occurred since this system does not have Windows Long Path support enabled.
```

## Quick Fix (Recommended)

### Enable Windows Long Paths

1. **Open PowerShell as Administrator**
   - Press Windows key
   - Type "PowerShell"
   - Right-click "Windows PowerShell"
   - Select "Run as administrator"

2. **Run this command:**
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. **Restart your computer** (required!)

4. **Re-run the installation:**
   ```powershell
   cd backend\python_services
   .\setup_windows.ps1
   ```

## Alternative: Skip Optional Packages

If you cannot enable long paths or don't need EDA features:

1. **Edit requirements.txt**
   - Open `backend/python_services/requirements.txt`
   - Find these lines and comment them out by adding `#` at the start:
     ```txt
     # lux-api==0.5.0
     # sweetviz==2.3.1
     ```

2. **Install without these packages:**
   ```powershell
   cd backend\python_services
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Disable features in environment:**
   - Before starting the service, run:
     ```powershell
     $env:ENABLE_LUX="false"
     $env:ENABLE_SWEETVIZ="false"
     python nlp_pipeline.py
     ```

**Note:** Core features (SHAP, LIME, Fairlearn, text analysis) will work fine without Lux and Sweetviz. You'll only miss the optional EDA visualization features.

## Verify Long Paths are Enabled

Check if long paths are enabled:
```powershell
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled"
```

Should return: `LongPathsEnabled : 1`

## More Help

See `TROUBLESHOOTING.md` for comprehensive troubleshooting guide.
