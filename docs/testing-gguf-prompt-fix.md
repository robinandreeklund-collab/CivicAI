# GGUF System Prompt Fix - Testing Guide

## Quick Start Testing

### Prerequisites

1. **GGUF Model**: Download or convert a model to GGUF format
2. **llama-server**: Build or download llama.cpp binaries
3. **CivicAI**: This PR branch checked out

### Test 1: GGUF System Prompt Injection

**Goal**: Verify that the platform system prompt is respected, not GGUF's default.

**Steps**:

1. Start llama-server:
```bash
llama-server.exe -m path/to/model.gguf -ngl 99 --port 8080
```

2. Create/update `.env.local` in project root:
```bash
MODEL_BACKEND=gguf
GGUF_SERVER_BASE=http://localhost:8080
PLATFORM_SYSTEM_PROMPT="Du är OneSeek, en svensk AI-assistent för civila frågor. Du svarar alltid på svenska."
```

3. Start CivicAI backend:
```bash
python ml_service/server.py --use-gguf
```

4. In the logs, look for:
```
[GGUF] Sending to /v1/chat/completions with system prompt (XXX chars)
[GGUF] Messages: [{'role': 'system', 'content': 'Du är OneSeek...'}, {'role': 'user', 'content': '...'}]
```

5. Send a test query via:
   - Message Builder: http://localhost:5000/message-builder (or wherever frontend runs)
   - Direct API: `curl http://localhost:5000/api/ml/inference/oneseek -X POST -H "Content-Type: application/json" -d '{"text":"Vad är befolkningen i Stockholm?"}'`

**Expected Results**:
- ✅ First message in logs is `role=system` with platform prompt
- ✅ NO "You are a helpful assistant" in logs or responses
- ✅ Response follows Swedish platform guidelines
- ✅ Response is in Swedish (not English)

**Failure Indicators**:
- ❌ Logs show "You are a helpful assistant"
- ❌ Response is generic/English
- ❌ Response ignores platform personality

### Test 2: Admin Builder/Message Builder Routing

**Goal**: Verify frontend routes to GGUF backend correctly.

**Steps**:

1. Create/update `frontend/.env.local`:
```bash
VITE_MODEL_BACKEND=gguf
VITE_GGUF_SERVER_BASE=http://localhost:8080
```

2. Start frontend dev server:
```bash
cd frontend
npm run dev
```

3. Open Message Builder page

4. Check browser console for:
```
[Config] Backend Configuration:
  MODEL_BACKEND: gguf
  GGUF_SERVER_BASE: http://localhost:8080
  Active ML Service: http://localhost:8080
```

5. Send a test message and check Network tab:
   - Request goes to `http://localhost:8080/v1/chat/completions` (NOT localhost:5000)
   - Request payload has `messages` array with `role=system`

**Expected Results**:
- ✅ Frontend sends to GGUF server (port 8080)
- ✅ Request uses OpenAI-compatible format
- ✅ Response appears correctly in UI

**Failure Indicators**:
- ❌ Request goes to localhost:5000
- ❌ Request uses old format (`text` instead of `messages`)
- ❌ Console shows errors about backend configuration

### Test 3: Legacy .bin Backend Compatibility

**Goal**: Verify that switching back to .bin mode still works.

**Steps**:

1. Update `.env.local`:
```bash
MODEL_BACKEND=bin
BIN_SERVER_BASE=http://localhost:5000
```

2. Update `frontend/.env.local`:
```bash
VITE_MODEL_BACKEND=bin
VITE_BIN_SERVER_BASE=http://localhost:5000
```

3. Restart both backend and frontend

4. Send a test query

**Expected Results**:
- ✅ Backend uses HuggingFace transformers (not llama-server)
- ✅ Frontend sends to localhost:5000
- ✅ Old workflow still functions
- ✅ No errors or warnings

### Test 4: Error Handling

**Test 4a: Invalid MODEL_BACKEND**

1. Set `VITE_MODEL_BACKEND=invalid` in frontend/.env.local
2. Start frontend
3. Check console

**Expected**: Clear error message: `Invalid MODEL_BACKEND: "invalid". Must be 'gguf' or 'bin'.`

**Test 4b: GGUF Server Not Running**

1. Set `MODEL_BACKEND=gguf` but don't start llama-server
2. Send a test query

**Expected**: Clear error message indicating GGUF server is not reachable

**Test 4c: Chat Completions Endpoint Not Available**

1. Use older llama-server without `/v1/chat/completions`
2. Send a test query

**Expected**: 
- Warning in logs: `[GGUF] /v1/chat/completions failed, falling back to /completion`
- Request still succeeds via fallback endpoint
- System prompt still injected (via formatted prompt string)

## Verification Checklist

After running all tests:

- [ ] GGUF mode: System prompt injected as first message
- [ ] GGUF mode: No default "You are a helpful assistant" appears
- [ ] GGUF mode: Responses follow platform guidelines
- [ ] Frontend routes to correct backend based on MODEL_BACKEND
- [ ] Legacy .bin mode still works
- [ ] Invalid configuration shows clear error messages
- [ ] Fallback to /completion works if /v1/chat/completions unavailable

## Common Issues & Solutions

### Issue: "llama-server not running"

**Solution**: Start llama-server:
```bash
llama-server.exe -m model.gguf --port 8080
```

### Issue: Frontend still uses localhost:5000

**Solution**: 
1. Check `VITE_MODEL_BACKEND=gguf` in frontend/.env.local
2. Restart frontend dev server (must reload env vars)
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: System prompt not respected

**Solution**:
1. Check llama-server supports `/v1/chat/completions`:
   ```bash
   curl http://localhost:8080/v1/models
   ```
2. Check backend logs for message injection
3. Verify PLATFORM_SYSTEM_PROMPT is set or get_active_system_prompt() returns correct value

### Issue: CORS errors

**Solution**: Ensure llama-server allows CORS:
```bash
llama-server.exe -m model.gguf --port 8080 --cors
```

## Log Analysis

**Good GGUF Logs (System Prompt Working)**:
```
[GGUF] Using PLATFORM_SYSTEM_PROMPT from environment
[GGUF] Sending to /v1/chat/completions with system prompt (500 chars)
[GGUF] Messages: [{'role': 'system', 'content': 'Du är OneSeek...'}, {'role': 'user', 'content': 'Vad är...'}]
[GGUF] Response received (250 chars)
```

**Bad Logs (System Prompt NOT Working)**:
```
[LLAMA-SERVER] chat_template ... example_format: '<|im_start|>system\nYou are a helpful assistant<|im_end|> ...'
```
This indicates the backend is using its own default, not our platform prompt.

## Performance Baseline

Expected latency (RTX 2080 Ti, Q5_K_M quantization):
- First token: 200-500ms
- Subsequent tokens: 20-50ms each
- Total for 100 tokens: 2-5 seconds

If significantly slower, check:
- GPU offload: `-ngl 99` for full GPU
- Quantization: Q5_K_M recommended for quality/speed balance
- Context size: `--ctx-size 4096` (default)

## Next Steps

After successful testing:
1. Document any issues found
2. Verify fix in production-like environment
3. Update deployment documentation
4. Train team on new MODEL_BACKEND configuration

---

**Last Updated**: 2025-12-08  
**PR**: GGUF System Prompt Obedience and Admin Builder Routing Fix  
**Branch**: copilot/fix-gguf-system-prompt-issues
