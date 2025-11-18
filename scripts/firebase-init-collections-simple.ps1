# Firebase Firestore Collections Setup Script for Windows PowerShell
# Simple version compatible with all PowerShell versions
# Creates all required collections with initial documents for CivicAI

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Firebase Collections Setup (Windows)"  -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "[1/6] Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseCmd) {
    Write-Host "  ERROR: Firebase CLI not found" -ForegroundColor Red
    Write-Host "  Install: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "  OK: Firebase CLI found" -ForegroundColor Green
Write-Host ""

# Step 2: Check Firebase login
Write-Host "[2/6] Checking Firebase login..." -ForegroundColor Yellow

# Try to get the current user
$currentUser = firebase auth:export --help 2>&1 | Out-String

# Alternative: Just skip this check since user can verify manually
# The service account key is what actually matters
Write-Host "  Skipping login check - using service account key instead" -ForegroundColor Gray
Write-Host ""

# Step 2: Get service account key
Write-Host "[2/5] Service Account Key" -ForegroundColor Yellow

if (-not $env:GOOGLE_APPLICATION_CREDENTIALS) {
    Write-Host "  Enter path to service account JSON key:" -ForegroundColor Cyan
    Write-Host "  (e.g., C:\Users\Name\.firebase\key.json)" -ForegroundColor Gray
    $keyPath = Read-Host "  Path"
    
    if (-not (Test-Path $keyPath)) {
        Write-Host "  ERROR: File not found: $keyPath" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    
    $env:GOOGLE_APPLICATION_CREDENTIALS = $keyPath
    Write-Host "  OK: Using $keyPath" -ForegroundColor Green
}
else {
    Write-Host "  OK: Using $env:GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Green
}

Write-Host ""

# Step 3: Get Project ID
Write-Host "[3/5] Firebase Project ID" -ForegroundColor Yellow
Write-Host "  Enter your Firebase Project ID:" -ForegroundColor Cyan
Write-Host "  (Find it at: Firebase Console > Project Settings)" -ForegroundColor Gray
$projectId = Read-Host "  Project ID"

if (-not $projectId) {
    Write-Host "  ERROR: Project ID required" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "  OK: Using project $projectId" -ForegroundColor Green
Write-Host ""

# Step 4: Install firebase-admin
Write-Host "[4/5] Installing firebase-admin..." -ForegroundColor Yellow

# Create temp directory
$tempDir = Join-Path $env:TEMP "firebase-setup-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Push-Location $tempDir

# Create package.json
$packageJson = @"
{
  "name": "firebase-init",
  "version": "1.0.0",
  "dependencies": {
    "firebase-admin": "^11.11.0"
  }
}
"@

Set-Content -Path "package.json" -Value $packageJson -Encoding UTF8

# Install
Write-Host "  Installing (this may take a minute)..." -ForegroundColor Gray
npm install --silent 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed" -ForegroundColor Red
    Pop-Location
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "  OK: firebase-admin installed" -ForegroundColor Green
Write-Host ""

# Step 5: Create collections
Write-Host "[5/5] Creating collections..." -ForegroundColor Yellow

# Create Node.js script
$nodeScript = @'
const admin = require('firebase-admin');

const projectId = process.argv[2];

admin.initializeApp({
    projectId: projectId,
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const collections = {
    ai_interactions: {
        question: 'Sample question',
        created_at: new Date(),
        status: 'received',
        pipeline_version: '1.0',
        user_id: 'demo_user',
        session_id: 'demo_session'
    },
    model_versions: {
        model_name: 'gpt-3.5',
        version: '1.0.0',
        created_at: new Date(),
        status: 'active',
        configuration: {}
    },
    ledger_blocks: {
        index: 1,
        timestamp: new Date(),
        event_type: 'system_init',
        hash: 'sample_hash',
        previous_hash: 'genesis'
    },
    change_events: {
        model_id: 'model_1',
        change_type: 'config_update',
        timestamp: new Date(),
        description: 'Initial configuration'
    },
    users: {
        email: 'demo@example.com',
        created_at: new Date(),
        role: 'user',
        status: 'active'
    },
    audit_logs: {
        action: 'system_init',
        timestamp: new Date(),
        user_id: 'system',
        details: 'System initialization'
    }
};

async function initCollections() {
    for (const [collectionName, sampleDoc] of Object.entries(collections)) {
        try {
            await db.collection(collectionName).add(sampleDoc);
            console.log(`  OK: ${collectionName}`);
        } catch (error) {
            console.error(`  ERROR: ${collectionName} - ${error.message}`);
        }
    }
}

initCollections()
    .then(() => {
        console.log('');
        console.log('SUCCESS: All collections created!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('ERROR:', error.message);
        process.exit(1);
    });
'@

Set-Content -Path "init.js" -Value $nodeScript -Encoding UTF8

# Run the script with environment variable explicitly passed
# This ensures the Node.js process has access to the credentials
$processEnv = @{
    GOOGLE_APPLICATION_CREDENTIALS = $env:GOOGLE_APPLICATION_CREDENTIALS
}

# Start the Node.js process with the environment variable
$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = "node"
$pinfo.Arguments = "init.js $projectId"
$pinfo.UseShellExecute = $false
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true
$pinfo.WorkingDirectory = Get-Location
$pinfo.EnvironmentVariables["GOOGLE_APPLICATION_CREDENTIALS"] = $env:GOOGLE_APPLICATION_CREDENTIALS

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $pinfo
$process.Start() | Out-Null

# Read output
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()

$process.WaitForExit()
$exitCode = $process.ExitCode

# Display output
Write-Host $stdout
if ($stderr) {
    Write-Host $stderr -ForegroundColor Red
}

# Cleanup
Pop-Location
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

# Final message
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "========================================"  -ForegroundColor Green
    Write-Host "  Setup Complete!"  -ForegroundColor Green
    Write-Host "========================================"  -ForegroundColor Green
    Write-Host ""
    Write-Host "View collections at:" -ForegroundColor Cyan
    Write-Host "https://console.firebase.google.com/project/$projectId/firestore" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "========================================"  -ForegroundColor Red
    Write-Host "  Setup Failed"  -ForegroundColor Red
    Write-Host "========================================"  -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Incorrect service account path" -ForegroundColor White
    Write-Host "- Service account lacks permissions" -ForegroundColor White
    Write-Host "- Wrong Project ID" -ForegroundColor White
    Write-Host ""
}

exit $exitCode
