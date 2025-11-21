# OQT-1.0 Firebase Setup Script (PowerShell)
# Skapar nödvändiga Firestore collections för OQT-1.0

param(
    [string]$ServiceAccountPath = "firebase-service-account.json"
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "OQT-1.0 Firebase Setup Script (PowerShell)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Detta script skapar endast nödvändiga collections baserat på" -ForegroundColor Yellow
Write-Host "faktisk användning i projektet. Följande redundanta collections" -ForegroundColor Yellow
Write-Host "har tagits bort:" -ForegroundColor Yellow
Write-Host "  - questions (data finns i ai_interactions)" -ForegroundColor Gray
Write-Host "  - external_raw_responses (data finns i ai_interactions)" -ForegroundColor Gray
Write-Host "  - per_response_analysis (data finns i ai_interactions)" -ForegroundColor Gray
Write-Host "  - oqt_model_versions (kan härledas från oqt_training_events)" -ForegroundColor Gray
Write-Host "  - ledger_entries (duplicerat av oqt_ledger)" -ForegroundColor Gray
Write-Host ""

# Definiera collections med beskrivningar
$Collections = @{
    "ai_interactions" = @{
        "description" = "Unified lagring av frågor, råsvar från externa AI-tjänster, och ML-pipeline-analyser"
        "datatype" = "Dokument med nested objekt"
        "purpose" = "Stores complete interaction data: user question, raw AI responses (GPT, Gemini, etc.), and pipeline analysis results (consensus, bias, fairness)"
        "sample_doc" = @{
            "interactionId" = "auto_generated"
            "question" = @{
                "text" = "Användarens fråga"
                "timestamp" = "ISO timestamp"
                "userId" = "valfritt"
                "source" = "start_view|oqt_dashboard"
            }
            "raw_responses" = @(
                @{
                    "service" = "gpt4|gemini|grok|claude|deepseek|qwen"
                    "response" = "AI-svar text"
                    "timestamp" = "ISO timestamp"
                    "latency_ms" = 123
                    "tokens" = 150
                    "model_version" = "gpt-4-turbo"
                }
            )
            "processed_data" = @{
                "consensus" = @{ "score" = 0.95; "level" = "high"; "metrics" = @{} }
                "bias" = @{ "aggregated_score" = 2.1; "level" = "low"; "types" = @() }
                "fairness" = @{ "score" = 0.88; "level" = "excellent" }
                "meta_summary" = @{}
            }
            "timestamp" = "ISO timestamp"
        }
    }
    
    "oqt_queries" = @{
        "description" = "Direkta frågor till OQT-1.0 från dashboard"
        "datatype" = "Dokument"
        "purpose" = "Tracks user interactions with OQT-1.0, including questions, responses, confidence scores, and metadata"
        "sample_doc" = @{
            "queryId" = "auto_generated"
            "question" = "Användarens fråga"
            "response" = "OQT-1.0 svar"
            "confidence" = 0.92
            "timestamp" = "ISO timestamp"
            "model" = "OQT-1.0"
            "version" = "1.2.0"
            "metadata" = @{
                "tokens" = 150
                "latency_ms" = 850
                "modelsUsed" = @("mistral", "llama")
            }
        }
    }
    
    "oqt_training_events" = @{
        "description" = "Loggning av träningssessioner (micro-training och batch training)"
        "datatype" = "Dokument"
        "purpose" = "Records all training sessions including real-time micro-training (two-stage) and weekly batch training"
        "sample_doc" = @{
            "trainingId" = "auto_generated"
            "type" = "micro-training|batch-training|weekly-training"
            "timestamp" = "ISO timestamp"
            "samplesProcessed" = 6
            "stage1" = @{
                "method" = "raw_response_training"
                "samplesProcessed" = 6
                "updated" = $true
            }
            "stage2" = @{
                "method" = "analyzed_data_training"
                "metricsUpdated" = $true
            }
            "modelVersion" = "1.2.0"
            "metrics" = @{
                "accuracy" = 0.91
                "fairness" = 0.88
                "bias" = 2.1
                "consensus" = 0.95
            }
        }
    }
    
    "oqt_metrics" = @{
        "description" = "Prestationsmetriker för OQT-1.0 över tid"
        "datatype" = "Dokument"
        "purpose" = "Tracks model performance, fairness scores, bias levels, and usage statistics"
        "sample_doc" = @{
            "metricId" = "auto_generated"
            "version" = "1.2.0"
            "timestamp" = "ISO timestamp"
            "metrics" = @{
                "accuracy" = 0.91
                "fairness" = 0.88
                "bias" = 2.1
                "consensus" = 0.95
            }
            "training" = @{
                "totalSamples" = 15234
                "weeklyBatches" = 12
                "microBatches" = 1523
            }
        }
    }
    
    "oqt_provenance" = @{
        "description" = "Provenienshantering för transparens"
        "datatype" = "Dokument"
        "purpose" = "Maintains complete processing history for each query, enabling full transparency of decision-making"
        "sample_doc" = @{
            "provenanceId" = "auto_generated"
            "queryId" = "referens till oqt_queries"
            "timestamp" = "ISO timestamp"
            "model" = "OQT-1.0"
            "version" = "1.2.0"
            "processingSteps" = @(
                @{ "step" = "tokenization"; "timestamp" = "ISO timestamp" }
                @{ "step" = "inference"; "timestamp" = "ISO timestamp" }
            )
            "inputHash" = "hash av input"
        }
    }
    
    "oqt_ledger" = @{
        "description" = "Blockchain-stil immutable ledger"
        "datatype" = "Dokument"
        "purpose" = "Immutable audit trail of all queries, training events, and model updates with cryptographic hashing"
        "sample_doc" = @{
            "blockNumber" = 0
            "type" = "query|training|update"
            "timestamp" = "ISO timestamp"
            "data" = @{
                "queryId" = "optional"
                "trainingId" = "optional"
                "description" = "händelsebeskrivning"
            }
            "hash" = "SHA256 hash av block"
            "previousHash" = "hash av föregående block"
        }
    }
}

# Kontrollera om service account filen finns
if (-not (Test-Path $ServiceAccountPath)) {
    Write-Host ""
    Write-Host "ERROR: Firebase service account file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vänligen:" -ForegroundColor Yellow
    Write-Host "1. Gå till Firebase Console -> Project Settings -> Service Accounts" -ForegroundColor White
    Write-Host "2. Klicka 'Generate New Private Key'" -ForegroundColor White
    Write-Host "3. Spara som 'firebase-service-account.json' i projektroten" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Found service account file: $ServiceAccountPath" -ForegroundColor Green
Write-Host ""

# Skapa collections (manuellt via Firebase Console eller REST API)
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Firebase Collections Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VIKTIGT: PowerShell kan inte direkt skapa Firestore collections." -ForegroundColor Yellow
Write-Host "Du måste skapa dem via Firebase Console eller köra Python-scriptet." -ForegroundColor Yellow
Write-Host ""
Write-Host "Alternativ 1: Använd Python-scriptet" -ForegroundColor Cyan
Write-Host "  python scripts/setup_firebase.py" -ForegroundColor White
Write-Host ""
Write-Host "Alternativ 2: Skapa manuellt via Firebase Console" -ForegroundColor Cyan
Write-Host "  https://console.firebase.google.com/" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Collections som ska skapas (6 st):" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$collectionNumber = 1
foreach ($collectionName in $Collections.Keys | Sort-Object) {
    $config = $Collections[$collectionName]
    
    Write-Host "$collectionNumber. $collectionName" -ForegroundColor Green
    Write-Host "   Syfte: $($config.purpose)" -ForegroundColor Gray
    Write-Host "   Datatyp: $($config.datatype)" -ForegroundColor Gray
    Write-Host ""
    
    $collectionNumber++
}

# Skriv ut sample dokument som JSON för referens
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Sample Dokument (för referens)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($collectionName in $Collections.Keys | Sort-Object) {
    $config = $Collections[$collectionName]
    
    Write-Host "Collection: $collectionName" -ForegroundColor Yellow
    Write-Host "Sample Document:" -ForegroundColor Gray
    
    # Konvertera till JSON för referens
    $jsonSample = $config.sample_doc | ConvertTo-Json -Depth 10
    Write-Host $jsonSample -ForegroundColor DarkGray
    Write-Host ""
}

# Instruktioner för indexering
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Composite Indexes (måste skapas manuellt)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Skapa följande composite indexes i Firebase Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Collection: ai_interactions" -ForegroundColor Green
Write-Host "  - Fields: question.source (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host "  - Fields: timestamp (DESC)" -ForegroundColor Gray
Write-Host ""
Write-Host "Collection: oqt_queries" -ForegroundColor Green
Write-Host "  - Fields: timestamp (DESC)" -ForegroundColor Gray
Write-Host "  - Fields: version (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host ""
Write-Host "Collection: oqt_training_events" -ForegroundColor Green
Write-Host "  - Fields: type (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host "  - Fields: modelVersion (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host ""
Write-Host "Collection: oqt_metrics" -ForegroundColor Green
Write-Host "  - Fields: version (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host "  - Fields: timestamp (DESC)" -ForegroundColor Gray
Write-Host ""
Write-Host "Collection: oqt_provenance" -ForegroundColor Green
Write-Host "  - Fields: queryId (ASC)" -ForegroundColor Gray
Write-Host "  - Fields: timestamp (DESC)" -ForegroundColor Gray
Write-Host ""
Write-Host "Collection: oqt_ledger" -ForegroundColor Green
Write-Host "  - Fields: blockNumber (ASC)" -ForegroundColor Gray
Write-Host "  - Fields: type (ASC), timestamp (DESC)" -ForegroundColor Gray
Write-Host ""

# Skapa en sammanfattning
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Sammanfattning" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Account: " -NoNewline
Write-Host "OK" -ForegroundColor Green
Write-Host "Collections definierade: " -NoNewline
Write-Host "$($Collections.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Nästa steg:" -ForegroundColor Yellow
Write-Host "1. Skapa collections i Firebase Console" -ForegroundColor White
Write-Host "   ELLER kör: python scripts/setup_firebase.py" -ForegroundColor White
Write-Host "2. Skapa composite indexes (se ovan)" -ForegroundColor White
Write-Host "3. Konfigurera Firebase security rules" -ForegroundColor White
Write-Host "4. Uppdatera .env filer med Firebase credentials" -ForegroundColor White
Write-Host "5. Kör: python scripts/download_models.py" -ForegroundColor White
Write-Host ""
Write-Host "Se OQT-1.0-README.md för fullständig dokumentation." -ForegroundColor Cyan
Write-Host ""

# Exportera collection-information till JSON-fil för referens
$exportPath = "firebase-collections-schema.json"
$Collections | ConvertTo-Json -Depth 10 | Out-File -FilePath $exportPath -Encoding UTF8
Write-Host "Collection schema exporterat till: $exportPath" -ForegroundColor Green
Write-Host ""
