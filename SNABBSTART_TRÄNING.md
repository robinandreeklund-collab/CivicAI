# Snabbstart: Träna OneSeek-7B-Zero med Identity Dataset

Detta dokument ger steg-för-steg instruktioner för att komma igång med att träna OneSeek-7B-Zero på identity-dataset så att modellen lär sig sin identitet som OpenSeek AI-agent.

## 🎯 Mål

Träna OneSeek-7B-Zero att förstå:
- Vem den är (OpenSeek AI-agent)
- Vad den gör (transparent AI-analys med multi-modell konsensus)
- Hur den fungerar (Mistral 7B + LLaMA-2, LoRA/PEFT, ledger-transparens)
- Sina etiska principer (rättvisa, transparens, ansvarsskyldighet)

## 📋 Förberedelser

### Steg 1: Verifiera att allt är installerat

```bash
# Kontrollera att du är i rätt directory
cd /path/to/CivicAI

# Kontrollera att identity dataset finns
ls -la datasets/oneseek_identity_v1.jsonl

# Output ska visa: 50 rader (exempel) i JSONL-format
```

### Steg 2: Installera Python-beroenden

```bash
# Skapa virtual environment (om du inte redan har ett)
python3 -m venv venv
source venv/bin/activate  # På Windows: venv\Scripts\activate

# Installera beroenden
pip install -r ml/requirements.txt

# Eller installera manuellt:
pip install numpy pandas scikit-learn
```

## 🚀 Metod 1: Enkel Snabbstart (Rekommenderad för första gången)

Detta är det enklaste sättet att komma igång. Skriptet hanterar allt automatiskt.

### Kör träningsskriptet:

```bash
# Från repository root
python scripts/train_identity.py
```

**Vad händer:**
1. ✅ Skriptet verifierar att identity dataset finns (50 exempel)
2. 📦 Konverterar JSONL till träningsformat
3. 🔄 Delar upp i train/validation (90/10)
4. 💾 Sparar till `ml/data/prepared/`
5. 🚀 Kör träningspipeline
6. 📊 Skapar modellversion med metadata
7. 📝 Loggar till transparency ledger

**Output:**
```
======================================================================
  OneSeek-7B-Zero Identity Training - Quick Start
======================================================================

✅ Found identity dataset: 50 examples
   Location: datasets/oneseek_identity_v1.jsonl

📦 Preparing training data...
✅ Training data prepared:
   - Training samples: 45
   - Validation samples: 5

🚀 Starting training...

======================================================================
Training OneSeek-7B-Zero Version 1.0
======================================================================

Dataset sizes:
  Training: 45
  Validation: 5

Training configuration:
  model_name: OneSeek-7B-Zero
  base_models: ['Mistral-7B', 'LLaMA-2']
  use_lora: True
  lora_rank: 8

Training completed!

Final Metrics:
  validation_accuracy: 0.876
  fairness_score: 0.912

✅ Training completed successfully!
```

## 🔧 Metod 2: Manuell Träning (För avancerade användare)

Om du vill ha full kontroll över träningsprocessen:

### Steg 1: Förbered dataset

```bash
# Konvertera identity dataset till träningsformat
cd ml/pipelines
python prepare_dataset.py --identity-only
```

### Steg 2: Kör träning

```bash
cd ml/training
python train_language_model.py --version 1.0
```

### Steg 3: Verifiera resultat

```bash
# Kontrollera att modellfilerna skapades
ls -la models/oneseek-7b-zero/weights/

# Du bör se:
# - oneseek-7b-zero-v1.0.json (metadata)
# - oneseek-7b-zero-v1.0.pth (vikter - skapas när PyTorch är installerat)
```

## 📊 Vad händer under träningen?

### 1. Dataset-konvertering

Identity dataset (JSONL):
```json
{
  "instruction": "Vem är du?",
  "input": "",
  "output": "Jag är OpenSeek AI-agent..."
}
```

Blir till träningsformat:
```json
{
  "id": "identity_0",
  "question": "Vem är du?",
  "responses": [{
    "model": "OneSeek-Identity",
    "response_text": "Jag är OpenSeek AI-agent..."
  }],
  "analysis": {
    "consensus_score": 1.0
  }
}
```

### 2. Träningsprocessen

```
[Dataset] → [Preprocessing] → [Model Training] → [Validation] → [Save]
   ↓              ↓                   ↓              ↓           ↓
  50           45 train          LoRA/PEFT      Metrics    v1.0.json
examples      5 val              adapters       0.876       v1.0.pth
```

### 3. Resultat som sparas

**Metadata** (`oneseek-7b-zero-v1.0.json`):
```json
{
  "version": "1.0",
  "model_name": "OneSeek-7B-Zero",
  "base_models": ["Mistral-7B", "LLaMA-2"],
  "training_config": {
    "dataset_size": 45,
    "use_lora": true,
    "lora_rank": 8
  },
  "metrics": {
    "validation_accuracy": 0.876,
    "fairness_score": 0.912
  },
  "provenance": {
    "training_data_hash": "sha256:...",
    "ledger_block_id": "block-1",
    "trainer": "OneSeek-Training-Pipeline"
  }
}
```

**Vikter** (`oneseek-7b-zero-v1.0.pth`):
- Skapas när PyTorch är installerat
- Innehåller LoRA adapter-vikter
- Storlek: ~50-100 MB (LoRA är parameter-effektiv!)

## ✅ Verifiera att träningen lyckades

### 1. Kontrollera filer

```bash
# Modellmetadata
cat models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.0.json

# Ledger (transparens)
cat ml/ledger/ledger.json
```

### 2. Kontrollera metrics

Kolla efter:
- ✅ `validation_accuracy` > 0.80
- ✅ `fairness_score` > 0.85
- ✅ `ledger_block_id` finns (transparent provenance)

### 3. Testa modellen (när PyTorch är installerat)

```python
# Test script
from ml.training.train_language_model import OneSeekTrainer

# Ladda modell
# model = load_model('models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.0.pth')

# Testa med identity-fråga
# response = model.generate("Vem är du?")
# print(response)
# Expected: "Jag är OpenSeek AI-agent, skapad för transparens..."
```

## 🎨 Utöka Identity Dataset

För bättre resultat, lägg till fler exempel:

### 1. Öppna dataset-filen

```bash
nano datasets/oneseek_identity_v1.jsonl
# eller
code datasets/oneseek_identity_v1.jsonl
```

### 2. Lägg till nya exempel

```json
{"instruction": "Hur hanterar du känslig information?", "input": "", "output": "Jag anonymiserar all personlig information och lagrar endast metadata för transparens..."}
{"instruction": "Vilka är dina begränsningar?", "input": "", "output": "Som alla AI-system kan jag göra misstag. Men min transparens gör det möjligt att upptäcka och korrigera dem..."}
```

**Rekommendationer:**
- 100-500 exempel totalt för robust identity
- Täck olika ämnen: identitet, etik, begränsningar, förmågor
- Både svenska och engelska
- Variera frågeformuleringen

### 3. Träna om med utökad dataset

```bash
python scripts/train_identity.py
# Version auto-incrementeras: v1.0 → v1.1
```

## 🐛 Felsökning

### Problem: "Dataset not found"

**Lösning:**
```bash
# Verifiera sökväg
ls -la datasets/oneseek_identity_v1.jsonl

# Om filen saknas, återskapa från README exempel
cat > datasets/oneseek_identity_v1.jsonl << 'EOF'
{"instruction": "Vem är du?", "input": "", "output": "Jag är OpenSeek AI-agent..."}
EOF
```

### Problem: "No module named 'transparency_ledger'"

**Lösning:**
```bash
# Kontrollera att du kör från rätt directory
cd /path/to/CivicAI
python scripts/train_identity.py

# Eller lägg till PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)/ml/pipelines
```

### Problem: "Training metrics low"

**Lösning:**
- Lägg till fler exempel (mål: 100+)
- Kör fler epochs (ändra i train_language_model.py)
- Justera learning rate

## 📚 Nästa Steg

### 1. Installera PyTorch för riktig träning

```bash
# CPU-version
pip install torch torchvision torchaudio

# GPU-version (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 2. Ladda ner basmodeller

```bash
# Mistral 7B och LLaMA-2 (kräver ~27 GB)
python scripts/download_models.py
```

### 3. Kör full träning med PyTorch

Se huvudguiden: **README.md** → "Training OneSeek-7B-Zero: Step-by-Step Guide"

### 4. Testa i dashboard

```bash
# Starta backend
cd backend && npm run dev

# Starta frontend
cd frontend && npm run dev

# Öppna dashboard
# http://localhost:3000/oqt-dashboard
```

## 📖 Ytterligare Dokumentation

- **README.md** - Komplett 11-stegs guide
- **ONESEEK_7B_ZERO_MIGRATION_GUIDE.md** - Migration från OQT
- **models/oneseek-7b-zero/MODEL_STORAGE_STRUCTURE.md** - Filformat
- **datasets/oneseek_identity_v1.jsonl** - Komplett identity dataset

## 💡 Tips

1. **Börja smått:** 50 exempel är bra för att lära sig processen
2. **Iterera:** Träna → Testa → Lägg till exempel → Träna igen
3. **Dokumentera:** Alla träningshändelser loggas i ledger
4. **Backup:** Metadata sparas automatiskt i models/
5. **Community:** Bidra med fler identity-exempel till projektet

## ✨ Sammanfattning

**Snabbaste vägen till tränad modell:**

```bash
# 1. Verifiera dataset
ls datasets/oneseek_identity_v1.jsonl

# 2. Kör träning
python scripts/train_identity.py

# 3. Verifiera resultat
ls models/oneseek-7b-zero/weights/

# 4. Klart! Modellen har lärt sig sin identitet.
```

**Nästa version:** Lägg till fler exempel och kör `python scripts/train_identity.py` igen!

---

**Frågor?** Se huvuddokumentationen i README.md eller öppna en issue på GitHub.
