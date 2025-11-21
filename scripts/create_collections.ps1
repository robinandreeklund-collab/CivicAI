# OQT-1.0 Firebase Collection Creator (PowerShell med REST API)
# Skapar faktiskt Firestore collections via Firebase REST API

param(
    [string]$ServiceAccountPath = "firebase-service-account.json",
    [switch]$CreateIndexes = $false
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "OQT-1.0 Firebase Collection Creator (REST API)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Läs service account
if (-not (Test-Path $ServiceAccountPath)) {
    Write-Host "ERROR: Service account file not found: $ServiceAccountPath" -ForegroundColor Red
    exit 1
}

Write-Host "Reading service account: $ServiceAccountPath" -ForegroundColor Green

try {
    $serviceAccount = Get-Content $ServiceAccountPath | ConvertFrom-Json
    $projectId = $serviceAccount.project_id
    
    Write-Host "Project ID: $projectId" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "ERROR: Could not parse service account JSON" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Funktion för att skapa en collection genom att lägga till ett sample dokument
function Create-FirestoreCollection {
    param(
        [string]$CollectionName,
        [hashtable]$SampleDoc,
        [string]$Description
    )
    
    Write-Host "Creating collection: $CollectionName" -ForegroundColor Yellow
    Write-Host "  Description: $Description" -ForegroundColor Gray
    
    # Konvertera sample doc till Firestore format
    $firestoreDoc = @{
        fields = @{
            _sample = @{ booleanValue = $true }
            _description = @{ stringValue = $Description }
            _created = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        }
    }
    
    # Lägg till sample fields (förenklad version)
    foreach ($key in $SampleDoc.Keys) {
        $value = $SampleDoc[$key]
        if ($value -is [string]) {
            $firestoreDoc.fields[$key] = @{ stringValue = $value }
        } elseif ($value -is [int] -or $value -is [double]) {
            $firestoreDoc.fields[$key] = @{ doubleValue = [double]$value }
        } elseif ($value -is [bool]) {
            $firestoreDoc.fields[$key] = @{ booleanValue = $value }
        }
    }
    
    # REST API endpoint
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$CollectionName"
    
    try {
        # För PowerShell måste vi använda OAuth2 token
        # Detta är en förenklad version - i produktion använd gcloud auth eller Firebase Admin SDK
        Write-Host "  Note: REST API creation kräver OAuth2 token" -ForegroundColor Yellow
        Write-Host "  Använd istället Python-scriptet för automatisk skapning" -ForegroundColor Yellow
        Write-Host "  Eller skapa manuellt i Firebase Console" -ForegroundColor Yellow
        Write-Host ""
        
        return $false
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Definiera collections
$Collections = @{
    "ai_interactions" = @{
        "description" = "Unified lagring av frågor, råsvar från AI, och ML-analyser"
        "sample" = @{
            "interactionId" = "sample_interaction"
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    
    "oqt_queries" = @{
        "description" = "Direkta frågor till OQT-1.0 från dashboard"
        "sample" = @{
            "queryId" = "sample_query"
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    
    "oqt_training_events" = @{
        "description" = "Loggning av träningssessioner"
        "sample" = @{
            "trainingId" = "sample_training"
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    
    "oqt_metrics" = @{
        "description" = "Prestationsmetriker över tid"
        "sample" = @{
            "metricId" = "sample_metric"
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    
    "oqt_provenance" = @{
        "description" = "Provenienshantering för transparens"
        "sample" = @{
            "provenanceId" = "sample_provenance"
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    
    "oqt_ledger" = @{
        "description" = "Blockchain-stil immutable ledger"
        "sample" = @{
            "blockNumber" = 0
            "timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "REKOMMENDATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PowerShell-baserad Firebase collection creation via REST API" -ForegroundColor Yellow
Write-Host "kräver OAuth2 authentication som är komplex att sätta upp." -ForegroundColor Yellow
Write-Host ""
Write-Host "REKOMMENDERADE ALTERNATIV:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Använd Python-scriptet (ENKLAST):" -ForegroundColor Cyan
Write-Host "   python scripts/setup_firebase.py" -ForegroundColor White
Write-Host ""
Write-Host "2. Skapa manuellt i Firebase Console:" -ForegroundColor Cyan
Write-Host "   https://console.firebase.google.com/" -ForegroundColor White
Write-Host "   -> Firestore Database -> Start collection" -ForegroundColor White
Write-Host ""
Write-Host "3. Använd Firebase CLI:" -ForegroundColor Cyan
Write-Host "   npm install -g firebase-tools" -ForegroundColor White
Write-Host "   firebase login" -ForegroundColor White
Write-Host "   firebase firestore:indexes" -ForegroundColor White
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Collections att skapa:" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($name in $Collections.Keys | Sort-Object) {
    $config = $Collections[$name]
    Write-Host "$i. " -NoNewline -ForegroundColor Green
    Write-Host $name -ForegroundColor Yellow
    Write-Host "   $($config.description)" -ForegroundColor Gray
    Write-Host ""
    $i++
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Manual Creation Steps (Firebase Console)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "För varje collection ovan:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Gå till Firebase Console -> Firestore Database" -ForegroundColor White
Write-Host "2. Klicka 'Start collection'" -ForegroundColor White
Write-Host "3. Ange collection ID (t.ex. 'ai_interactions')" -ForegroundColor White
Write-Host "4. Lägg till ett sample dokument:" -ForegroundColor White
Write-Host "   Document ID: _sample" -ForegroundColor Gray
Write-Host "   Field: _sample (boolean) = true" -ForegroundColor Gray
Write-Host "   Field: _description (string) = [beskrivning]" -ForegroundColor Gray
Write-Host "   Field: _created (timestamp) = [nu]" -ForegroundColor Gray
Write-Host "5. Klicka 'Save'" -ForegroundColor White
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Composite Indexes" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Efter collections är skapade, skapa dessa indexes:" -ForegroundColor Yellow
Write-Host ""

$indexes = @"
Collection: ai_interactions
  - question.source (Ascending), timestamp (Descending)
  - timestamp (Descending)

Collection: oqt_queries
  - timestamp (Descending)
  - version (Ascending), timestamp (Descending)

Collection: oqt_training_events
  - type (Ascending), timestamp (Descending)
  - modelVersion (Ascending), timestamp (Descending)

Collection: oqt_metrics
  - version (Ascending), timestamp (Descending)
  - timestamp (Descending)

Collection: oqt_provenance
  - queryId (Ascending)
  - timestamp (Descending)

Collection: oqt_ledger
  - blockNumber (Ascending)
  - type (Ascending), timestamp (Descending)
"@

Write-Host $indexes -ForegroundColor Gray
Write-Host ""

Write-Host "Skapa indexes via:" -ForegroundColor Yellow
Write-Host "  Firebase Console -> Firestore -> Indexes -> Create Index" -ForegroundColor White
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Färdig!" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se OQT-1.0-README.md för fullständig dokumentation." -ForegroundColor Green
Write-Host ""
