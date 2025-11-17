# Python Service Troubleshooting Guide

## Common Issues and Solutions

### 1. Dependency Conflict Errors

**Symptoms:**
```
ERROR: pip's dependency resolver does not currently take into account all the packages that are installed.
contourpy 1.3.3 requires numpy>=1.25, but you have numpy 1.24.3 which is incompatible.
```

**Solution:**
The requirements.txt has been updated to use compatible version ranges. To fix:

```powershell
# Remove the old virtual environment
Remove-Item -Recurse -Force venv

# Re-run the setup script
.\setup_windows.ps1
```

**Alternative manual fix:**
```powershell
# Activate your virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade conflicting packages
pip install --upgrade numpy>=1.25.0
pip install --upgrade torch>=2.3.0
pip install --upgrade transformers>=4.41.0

# Reinstall dependencies
pip install -r requirements.txt
```

### 2. "No pyvenv.cfg file" Error

**Symptoms:**
```
No pyvenv.cfg file
```

**Cause:** The virtual environment was not created correctly or was corrupted.

**Solution:**
```powershell
# Delete the venv folder
Remove-Item -Recurse -Force venv

# Create a fresh virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Verify activation - you should see (venv) in your prompt
# Install dependencies
pip install -r requirements.txt
```

### 3. Virtual Environment Activation Fails

**Symptoms:**
```
ERROR: Failed to activate virtual environment.
```

**Solution:**
Enable script execution in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again:
```powershell
.\venv\Scripts\Activate.ps1
```

### 4. PyTorch Installation Takes Very Long

**Expected Behavior:** PyTorch is a large package (~2GB). Installation can take 10-30 minutes depending on your internet connection.

**What to do:**
- Be patient
- Don't interrupt the installation
- Make sure you have stable internet connection
- Ensure you have at least 5GB of free disk space

### 5. spaCy Model Download Fails

**Solution:**
```powershell
# Manually download Swedish model
python -m spacy download sv_core_news_sm

# If Swedish model unavailable, use English
python -m spacy download en_core_web_sm
```

### 6. Windows Long Path Error (Lux/Sweetviz Installation)

**Symptoms:**
```
ERROR: Could not install packages due to an OSError: [Errno 2] No such file or directory: 'C:\Users\...\venv\share\jupyter\labextensions\@jupyter-widgets\jupyterlab-manager\static\vendors-node_modules_d3-color_src_color_js-node_modules_d3-format_src_defaultLocale_js-node_m-09b215.2643c43f22ad111f4f82.js'
HINT: This error might have occurred since this system does not have Windows Long Path support enabled.
```

**Cause:** Windows has a 260-character path limit by default. Lux and Sweetviz install Jupyter dependencies with very long file paths that exceed this limit.

**Solution 1 (Recommended): Enable Windows Long Paths**

1. **Run PowerShell as Administrator**

2. **Enable long paths in registry:**
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
     -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. **Enable long paths for Git (if using Git):**
   ```powershell
   git config --global core.longpaths true
   ```

4. **Restart your computer** (required for changes to take effect)

5. **Retry installation:**
   ```powershell
   cd backend\python_services
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

**Solution 2: Skip Optional EDA Packages**

If you cannot enable long paths, you can skip Lux and Sweetviz (they are optional):

1. **Edit requirements.txt** and comment out:
   ```txt
   # lux-api==0.5.0
   # sweetviz==2.3.1
   ```

2. **Install remaining dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Set environment variables to disable these features:**
   ```powershell
   # Add to your .env file or set before starting service
   $env:ENABLE_LUX="false"
   $env:ENABLE_SWEETVIZ="false"
   python nlp_pipeline.py
   ```

**Note:** Core functionality (SHAP, LIME, Fairlearn) will still work. Only the optional EDA visualization features will be unavailable.

**Verify Long Paths are Enabled:**
```powershell
# Check registry setting
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled"
```

Should return: `LongPathsEnabled : 1`

## Recommended Clean Install Steps

If you're experiencing multiple issues, follow these steps for a clean installation:

1. **Close all Python/PowerShell terminals**

2. **Delete the virtual environment:**
   ```powershell
   cd backend\python_services
   Remove-Item -Recurse -Force venv
   ```

3. **Verify Python installation:**
   ```powershell
   python --version  # Should show Python 3.8 or higher
   ```

4. **Run the setup script:**
   ```powershell
   .\setup_windows.ps1
   ```

5. **Wait patiently** - Installation can take 15-30 minutes

6. **Verify installation:**
   ```powershell
   # Make sure venv is activated - you should see (venv) in prompt
   python -c "import torch; print(torch.__version__)"
   python -c "import transformers; print(transformers.__version__)"
   python -c "import spacy; print(spacy.__version__)"
   ```

7. **Start the service:**
   ```powershell
   python nlp_pipeline.py
   ```

## System Requirements

- **Python:** 3.8 or higher (3.9-3.11 recommended)
- **Disk Space:** At least 5GB free
- **RAM:** 8GB minimum, 16GB recommended
- **Internet:** Stable connection for downloading packages

## Package Versions

The updated requirements.txt uses these version ranges to avoid conflicts:

```
transformers >= 4.41.0, < 5.0.0
torch >= 2.3.0, < 3.0.0
numpy >= 1.25.0, < 2.0.0
```

These versions are compatible with all dependent packages.

## Still Having Issues?

1. Check that Python is added to PATH
2. Ensure you're running PowerShell as Administrator if needed
3. Try installing packages one by one to identify the problematic one
4. Check Windows Event Viewer for additional error details

## Optional: Verify Service is Running

Once started, the service should show:
```
CivicAI Python NLP Pipeline Service
====================================

Available models:
  spaCy:        ✓
  TextBlob:     ✓
  langdetect:   ✓
  Detoxify:     ✓
  Transformers: ✓
  ...

Starting Flask server on http://localhost:5001
```

Test it from another terminal:
```powershell
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "CivicAI Python NLP Pipeline",
  "version": "1.0.0",
  ...
}
```
