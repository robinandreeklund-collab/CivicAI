# OneSeek Backend

Backend server for OneSeek AI platform.

## Environment Variables

### Core Configuration
```bash
PORT=3001                    # Server port (default: 3001)
ML_SERVICE_URL=http://localhost:5000  # Python ML service URL
```

### External AI Services
```bash
OPENAI_API_KEY=sk-...        # OpenAI API key (optional - simulated responses if missing)
GEMINI_API_KEY=...           # Google Gemini API key (optional)
DEEPSEEK_API_KEY=...         # DeepSeek API key (optional)
GROK_API_KEY=...             # Grok/xAI API key (optional)
```

### Zero Compare Flow (OpenSeek-7B-Zero)
```bash
OPENSEEK_API_URL=http://localhost:5000  # OpenSeek inference endpoint (default: localhost:5000)
OPENSEEK_API_KEY=...         # Optional API key for OpenSeek authentication
```

### Embeddings Configuration
```bash
EMBEDDING_PROVIDER=openai    # Set to 'openai' to enable embeddings-based compression
OPENAI_API_KEY=sk-...        # Required for embeddings mode (same key as above)
```

### Firebase (Optional)
```bash
FIREBASE_PROJECT_ID=...      # Firebase project ID
FIREBASE_CLIENT_EMAIL=...    # Firebase service account email
FIREBASE_PRIVATE_KEY=...     # Firebase private key
```

## Quick Start (Local Development - No Firebase Required)

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Configure minimum required variables:
```bash
# .env
PORT=3001

# Optional: Add API keys for external AI services
# If not set, simulated responses will be used
OPENAI_API_KEY=sk-...

# Optional: Enable embeddings-based compression
EMBEDDING_PROVIDER=openai
```

4. Start the server:
```bash
npm run dev
```

## Zero Compare Flow

The Zero Compare Flow enables OpenSeek-7B-Zero to synthesize responses from multiple external AI models.

### How It Works

1. **Collect External Responses**: Calls GPT, Gemini, DeepSeek, and Grok in parallel
2. **Compress Responses**: Uses embeddings (if available) or heuristics to extract relevant sentences
3. **Build Context Prompt**: Loads character card and builds system/user prompts
4. **Call OpenSeek**: Sends compressed context to OpenSeek for synthesis
5. **Optional Analysis**: Runs analysis pipeline on Zero's response

### Testing the Flow

```bash
# Test with curl
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Vad är demokrati?",
    "preferredModel": "openseek-7b-zero",
    "profileId": "zero"
  }'
```

### Response Format

```json
{
  "question": "Vad är demokrati?",
  "zero": {
    "response": "...",
    "model": "openseek-7b-zero"
  },
  "externalResponses": [
    { "agent": "gpt-3.5", "response": "...", "model": "gpt-3.5-turbo" },
    { "agent": "gemini", "response": "...", "model": "gemini-pro" }
  ],
  "compression": {
    "mode": "embeddings",
    "totalChars": 2500,
    "avgSimilarity": 0.72
  },
  "timestamp": "2024-12-04T19:00:00.000Z",
  "processingTimeMs": 3500
}
```

### Compression Modes

- **Embeddings Mode** (requires `EMBEDDING_PROVIDER=openai` and `OPENAI_API_KEY`):
  - Uses semantic similarity to select most relevant sentences
  - Deduplicates using cosine similarity threshold
  - Better context quality for complex questions

- **Heuristic Mode** (fallback):
  - Simple sentence extraction with text-based deduplication
  - Per-agent character limits
  - Works without any API keys

## Frontend Testing

Navigate to `/7B-Zero` in the frontend and enable "Compare Mode" to test the flow.

## Files Added for Zero Compare Flow

- `backend/services/openseek.js` - OpenSeek inference wrapper
- `backend/services/comparePromptBuilder.js` - Character card loading and prompt building
- `backend/utils/responseCompressor.js` - Embeddings and heuristic compression
- `backend/utils/embeddingsClient.js` - OpenAI embeddings client
- `backend/api/query_dispatcher.js` - Updated with Zero compare flow handler

## Running Tests

```bash
npm run test
```

Note: Some integration tests require a running server. Start the server before running the full test suite.
