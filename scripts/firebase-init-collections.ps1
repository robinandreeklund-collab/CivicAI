# Firebase Firestore Collections Setup Script for Windows PowerShell
# Creates all required collections with initial documents for CivicAI

# Set error action preference
$ErrorActionPreference = "Continue"

Write-Host "🔥 Firebase Firestore Collections Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCheck = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseCheck) {
    $firebaseVersion = & firebase --version 2>&1
    Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if user is logged in
Write-Host "Checking Firebase login..." -ForegroundColor Yellow
$loginCheck = & firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔐 Please login to Firebase..." -ForegroundColor Yellow
    & firebase login
} else {
    Write-Host "✓ Logged in to Firebase" -ForegroundColor Green
}
Write-Host ""

# Check for service account credentials
Write-Host "🔑 Checking for Firebase Admin credentials..." -ForegroundColor Cyan
Write-Host ""

if (-not $env:GOOGLE_APPLICATION_CREDENTIALS) {
    Write-Host "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need a Firebase Admin SDK service account key to run this script." -ForegroundColor White
    Write-Host ""
    Write-Host "📖 How to get a service account key:" -ForegroundColor Cyan
    Write-Host "   1. Go to Firebase Console: https://console.firebase.google.com" -ForegroundColor White
    Write-Host "   2. Select your project" -ForegroundColor White
    Write-Host "   3. Go to Project Settings (⚙️) → Service accounts" -ForegroundColor White
    Write-Host "   4. Click 'Generate new private key'" -ForegroundColor White
    Write-Host "   5. Save the JSON file" -ForegroundColor White
    Write-Host ""
    
    $serviceAccountPath = Read-Host "Enter the path to your service account key JSON file"
    
    if (-not $serviceAccountPath) {
        Write-Host "❌ Service account path is required" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $serviceAccountPath)) {
        Write-Host "❌ File not found: $serviceAccountPath" -ForegroundColor Red
        exit 1
    }
    
    $env:GOOGLE_APPLICATION_CREDENTIALS = $serviceAccountPath
    Write-Host "✓ Using service account: $serviceAccountPath" -ForegroundColor Green
} else {
    Write-Host "✓ Using credentials from: $env:GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Green
}
Write-Host ""

# Get project list
Write-Host "📋 Available Firebase projects:" -ForegroundColor Cyan
firebase projects:list
Write-Host ""

$projectId = Read-Host "Enter your Firebase Project ID"

if (-not $projectId) {
    Write-Host "❌ Project ID cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Setting up collections for project: $projectId" -ForegroundColor Cyan
Write-Host ""

# Create a temporary Node.js script to initialize collections
$nodeScript = @'
const admin = require('firebase-admin');

// Get project ID from command line argument
const projectId = process.argv[2];

if (!projectId) {
    console.error('❌ Project ID required');
    process.exit(1);
}

// Initialize Firebase Admin with Application Default Credentials
try {
    admin.initializeApp({
        projectId: projectId,
        credential: admin.credential.applicationDefault()
    });
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK');
    console.error('Error:', error.message);
    console.error('\n💡 Solution:');
    console.error('   Set: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\serviceAccountKey.json"');
    console.error('   Or download a service account key from Firebase Console:');
    console.error('   https://console.firebase.google.com/project/' + projectId + '/settings/serviceaccounts/adminsdk');
    process.exit(1);
}

const db = admin.firestore();

// Collection schemas (same as bash version - abbreviated for brevity)
const collections = {
    ai_interactions: {
        description: 'Stores user questions and AI responses with analysis',
        sampleDoc: {
            question: 'Sample question for testing',
            created_at: new Date().toISOString(),
            status: 'received',
            pipeline_version: '1.0.0',
            analysis: null,
            completed_at: null,
            user_id: 'system',
            session_id: 'init-session',
            question_hash: 'sample-hash-' + Date.now()
        }
    },
    model_versions: {
        description: 'Tracks AI model configurations and metadata',
        sampleDoc: {
            modelId: 'gpt-3.5-turbo-init',
            provider: 'openai',
            modelName: 'gpt-3.5-turbo',
            version: '0613',
            configuration: { temperature: 0.7, maxTokens: 1000 },
            profile: { strengths: ['Fast', 'Efficient'] },
            usage: { totalRequests: 0 }
        }
    },
    ledger_blocks: {
        description: 'Blockchain-inspired transparency ledger',
        sampleDoc: {
            block_id: 0,
            timestamp: new Date().toISOString(),
            previous_hash: '0'.repeat(64),
            current_hash: 'genesis-block-hash',
            event_type: 'genesis',
            data: { description: 'Genesis block', model_version: '0.0.0' },
            signatures: { data_hash: 'genesis', validator: 'system' }
        }
    },
    change_events: {
        description: 'Records detected changes in model behavior',
        sampleDoc: {
            eventId: 'change-' + Date.now(),
            timestamp: new Date().toISOString(),
            changeType: 'model_update',
            modelId: 'sample-model',
            changeDetails: { before: 'old', after: 'new', delta: 0.05 },
            detection: { method: 'automated', confidence: 0.95 },
            impact: { severity: 'low', affected: ['sample'] }
        }
    },
    users: {
        description: 'User profiles and preferences',
        sampleDoc: {
            userId: 'system-user',
            email: 'system@civicai.local',
            displayName: 'System User',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: { theme: 'dark', language: 'sv' }
        }
    },
    audit_logs: {
        description: 'System audit logs',
        sampleDoc: {
            logId: 'log-' + Date.now(),
            timestamp: new Date().toISOString(),
            eventType: 'system_init',
            userId: 'system',
            action: 'collections_initialized',
            details: { collections: ['ai_interactions', 'model_versions', 'ledger_blocks', 'change_events', 'users', 'audit_logs'] },
            ipAddress: null
        }
    }
};

async function createCollections() {
    console.log('🔧 Creating Firestore collections...\n');
    
    for (const [collectionName, config] of Object.entries(collections)) {
        try {
            console.log(`📁 Collection: ${collectionName}`);
            console.log(`   Description: ${config.description}`);
            
            const existingDocs = await db.collection(collectionName).limit(1).get();
            
            if (!existingDocs.empty) {
                console.log(`   ⚠️  Collection already exists (${existingDocs.size} docs found)`);
                console.log(`   ✓ Skipping initialization\n`);
                continue;
            }
            
            const docRef = await db.collection(collectionName).add(config.sampleDoc);
            console.log(`   ✓ Created with sample document: ${docRef.id}\n`);
            
        } catch (error) {
            console.error(`   ❌ Error creating ${collectionName}:`, error.message);
        }
    }
    
    console.log('✅ Collection setup complete!\n');
    console.log(`📊 Project: ${projectId}\n`);
}

createCollections()
    .then(() => {
        console.log('🎉 Setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    });
'@

$tempScriptPath = Join-Path $env:TEMP "init-firestore-collections.js"
$nodeScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

# Check if firebase-admin is installed
Write-Host "📦 Checking firebase-admin package..." -ForegroundColor Yellow
$adminCheck = & node -e "require('firebase-admin')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ firebase-admin already installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  firebase-admin not found" -ForegroundColor Yellow
    Write-Host "Installing firebase-admin temporarily..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create temp directory for node_modules
    $tempDir = Join-Path $env:TEMP "firebase-setup"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    Push-Location $tempDir
    
    # Create package.json
    $packageJson = @{
        name = "firestore-init-temp"
        version = "1.0.0"
        dependencies = @{
            "firebase-admin" = "^11.11.0"
        }
    } | ConvertTo-Json
    
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    
    # Install
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ firebase-admin installed successfully" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Failed to install firebase-admin" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install it manually:" -ForegroundColor Yellow
        Write-Host "   npm install -g firebase-admin" -ForegroundColor White
        Pop-Location
        Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
        exit 1
    }
    
    Pop-Location
}

# Run the Node.js script
Write-Host "🚀 Initializing collections..." -ForegroundColor Cyan
Write-Host ""

Push-Location $env:TEMP
try {
    node $tempScriptPath $projectId
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Collection setup complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 View your collections at:" -ForegroundColor Cyan
        Write-Host "   https://console.firebase.google.com/project/$projectId/firestore" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Failed to initialize collections (exit code: $exitCode)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Incorrect service account path" -ForegroundColor White
        Write-Host "  - Service account doesn't have permissions" -ForegroundColor White
        Write-Host "  - Project ID is incorrect" -ForegroundColor White
        Write-Host "  - Network connectivity issues" -ForegroundColor White
        Write-Host ""
    }
} finally {
    Pop-Location
    
    # Cleanup
    Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $env:TEMP "firebase-setup") -Recurse -Force -ErrorAction SilentlyContinue
}

exit $exitCode
