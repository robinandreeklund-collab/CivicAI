# ONESEEK Δ+ v6.2: Personality Routing - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
# Backend
pip install sentence-transformers aiohttp numpy

# Frontend (if not already done)
cd frontend && npm install
```

### 2. Start Services
```bash
# Terminal 1: Backend
python ml_service/server.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 3. Open Demo Page
Navigate to: `http://localhost:5173/personality-chat`

### 4. Try These Queries
```
"Vad är vädret imorgon i Stockholm?"
"Vilka böcker har Astrid Lindgren skrivit?"
"Hej, vem är du?"
```

---

## 📋 How It Works (Simple)

1. **You type a question** → System analyzes it
2. **AI picks personality** → Based on what you asked
3. **Fetches real-time data** → From Swedish APIs (SMHI, Libris, etc.)
4. **Answers in Swedish** → With sources shown

### Live Updates You See:
- [tänker...] Analyserar frågan...
- [tänker...] Valde personlighet: Metrologen
- [tänker...] Hämtar realtidsdata...
- [tänker...] Bygger slutligt svar...
- ✅ **Final clean answer**

---

## 🎭 Available Personalities

### 1. **Medveten** (Default)
- General knowledge
- Self-aware AI assistant
- Used when no specific personality fits

### 2. **Metrologen** (Weather Expert)
- Weather questions
- SMHI data
- Temperature, rain, forecasts

**Try**: "Blir det regn imorgon?"

### 3. **Bibliotekarien** (Book Lover)
- Book questions
- Libris XL data
- Authors, titles, summaries

**Try**: "Vad handlar Röda Rummet om?"

---

## 🔧 Manual Override

Click the personality dropdown in the top-right corner:
1. Select a specific personality
2. Or choose "Automatiskt val" for auto-selection

---

## 🐛 Troubleshooting

### "Personality selector module not available"
```bash
pip install sentence-transformers
```

### WebSocket connection fails
- Backend must be running on port 8000
- Check CORS settings in server.py
- Fallback to REST API happens automatically

### "No module named numpy"
```bash
pip install numpy aiohttp
```

---

## 📊 What's in the Thinking Chain?

Click "Tankekedja ▼" to see:
- Which personality was chosen (and why)
- Which APIs were called
- What data was fetched
- Each processing step

---

## 🌐 API Endpoints

### WebSocket (Recommended)
```
ws://localhost:8000/ws/personality
```

### REST (Fallback)
```
POST http://localhost:8000/inference/personality
```

---

## 📝 Example Code

### JavaScript (Frontend)
```javascript
import { sendPersonalityMessageViaWebSocket } from './services/personalityWebSocket';

await sendPersonalityMessageViaWebSocket("Vad är vädret?", {
  onThinking: (step) => console.log(step.message),
  onFinal: (response) => console.log(response.response),
  onError: (error) => console.error(error)
});
```

### Python (Backend Test)
```python
from ml_service.personality_selector import select_personality

personality_id, name, confidence, data = select_personality(
    "Vad är vädret imorgon?"
)

print(f"Selected: {name} (confidence: {confidence:.2f})")
```

---

## ✅ Verification

Run tests to verify everything works:
```bash
# Test catalog
python tests/test_personality_catalog.py

# Test integration
python tests/test_personality_integration.py
```

All tests should pass ✓

---

## 🎯 Key Features

✅ **Auto personality selection** - AI picks the right expert  
✅ **40% recent boost** - Remembers context  
✅ **Real-time streaming** - See AI think  
✅ **Swedish-first** - All text in Swedish  
✅ **API integration** - Live data from SMHI, Libris, etc.  
✅ **Manual override** - Pick personality yourself  
✅ **Error handling** - Graceful degradation  

---

## 📖 Full Documentation

See `PERSONALITY_COMPLETE_IMPLEMENTATION.md` for:
- Complete architecture
- All endpoints
- Configuration files
- Testing guide
- Deployment notes

---

**Questions?** Check the debug terminal:
```bash
python ml_service/debug_personality_pipeline.py
```

Then start the server and watch the live pipeline!
