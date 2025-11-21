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

### Problem: "Descriptors cannot be created directly" - Protobuf-fel

**Symptom:**
```
TypeError: Descriptors cannot be created directly.
If this call came from a _pb2.py file, your generated code is out of date...
```

**Lösning (ENKLAST):**
```bash
pip install protobuf==3.20.3
```

Kör sedan träningen igen:
```bash
python scripts/train_identity.py
```

**Varför händer detta?** Nyare versioner av `protobuf` (4.x) är inkompatibla med vissa versioner av `sentencepiece` som används av tokenizers.

**Alternativa lösningar:**
1. Sätt miljövariabel:
   ```bash
   # Windows PowerShell
   $env:PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION="python"
   python scripts/train_identity.py
   
   # Linux/Mac
   export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
   python scripts/train_identity.py
   ```

2. Uppgradera sentencepiece:
   ```bash
   pip install --upgrade sentencepiece transformers
   ```

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
pip install torch torchvision torchaudio transformers peft protobuf==3.20.3

# GPU-version (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers peft protobuf==3.20.3
```

**OBS:** Vi använder `protobuf==3.20.3` för att säkerställa kompatibilitet med `sentencepiece` och tokenizers. Att använda `protobuf>=4.0` kan orsaka fel vid tokenizer-laddning.

### 2. Ladda ner basmodeller (om du inte redan har dem)

**Om du redan har modeller:**

Skriptet hittar automatiskt modeller i dessa platser:
- `models/mistral-7b-instruct/` (rekommenderad)
- `models/llama-2-7b-chat/` (rekommenderad)
- `models/oneseek-7b-zero/base_models/mistral-7b/`
- `models/oneseek-7b-zero/base_models/llama-2-7b/`

**Om du behöver ladda ner:**

```bash
# Installera Hugging Face CLI
pip install huggingface_hub

# Ladda ner Mistral 7B (rekommenderad plats)
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 \
  --local-dir models/mistral-7b-instruct \
  --local-dir-use-symlinks False

# Ladda ner LLaMA-2 (kräver access request)
huggingface-cli download meta-llama/Llama-2-7b-chat-hf \
  --local-dir models/llama-2-7b-chat \
  --local-dir-use-symlinks False
```

**VIKTIGT:** Använd `--local-dir-use-symlinks False` för att undvika symlink-problem på Windows.

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
