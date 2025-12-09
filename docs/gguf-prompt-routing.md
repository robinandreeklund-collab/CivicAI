# GGUF System Prompt Routing and Admin Builder Integration

## Overview

This document describes the architecture, configuration, and troubleshooting for CivicAI's GGUF backend integration, ensuring that platform system prompts are respected and admin builder routes correctly.

## Problem Statement

When using GGUF models with llama.cpp/llama-server, two critical issues occurred:

1. **System Prompt Obedience**: The GGUF backend initialized with a default system prompt (e.g., "You are a helpful assistant") from the model's metadata. Client requests that didn't explicitly provide a `role=system` message would use this default, causing repetitive and low-quality responses.

2. **Admin Builder Routing**: The Admin Builder interface at `http://localhost:3000/admin/builder` routed queries to the legacy .bin (HuggingFace) pipeline even when `--use-gguf` was active, resulting in incorrect model usage.

## Solution Architecture

### Server-Side: System Prompt Injection

The `ml_service/server.py` has been updated to:

1. **Detect GGUF Mode**: Check for `--use-gguf` flag or active GGUF model
2. **Fetch Platform Prompt**: Retrieve the CivicAI platform system prompt from `get_active_system_prompt()`
3. **Inject as First Message**: Add system prompt as first message with `role=system`
4. **Use Chat Completions Endpoint**: Call `/v1/chat/completions` (OpenAI-compatible) instead of raw completion

### Frontend/Admin: Backend Selection

Configuration-driven routing ensures:

1. **Single Source of Truth**: `MODEL_BACKEND` environment variable controls active backend
2. **Automatic Routing**: Admin Builder and frontend services detect and use appropriate endpoint
3. **No Legacy Loading**: When `MODEL_BACKEND=gguf`, .bin models are never loaded

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Backend selection
MODEL_BACKEND=gguf                    # 'gguf' or 'bin'

# GGUF server URL
GGUF_SERVER_BASE=http://localhost:8080

# Legacy .bin server URL
BIN_SERVER_BASE=http://localhost:5000

# Optional: Override platform system prompt
PLATFORM_SYSTEM_PROMPT="Your custom Swedish AI assistant prompt here"
```

### Server Configuration

The server automatically:

1. Reads `GGUF_SERVER_BASE` from environment (default: `http://localhost:8080`)
2. Uses `get_active_system_prompt()` to fetch platform prompt
3. Falls back to `PLATFORM_SYSTEM_PROMPT` env var if set
4. Injects prompt as first message to `/v1/chat/completions`

## Message Flow

### GGUF Backend Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Query: "Vad är befolkningen i Stockholm?"          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Server: get_active_system_prompt()                      │
│    Returns: "Du är OneSeek, en svensk AI-assistent..."     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Build Messages Array:                                   │
│    [                                                        │
│      {                                                      │
│        "role": "system",                                    │
│        "content": "Du är OneSeek, en svensk AI-assistent..."│
│      },                                                     │
│      {                                                      │
│        "role": "user",                                      │
│        "content": "Vad är befolkningen i Stockholm?"       │
│      }                                                      │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. POST to GGUF_SERVER_BASE/v1/chat/completions            │
│    with messages array                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GGUF Server processes with platform system prompt       │
│    (NOT default "You are a helpful assistant")             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Response returned to client                              │
└─────────────────────────────────────────────────────────────┘
```

### Legacy .bin Backend Flow

When `MODEL_BACKEND=bin`, the system uses HuggingFace transformers directly:

```
User Query → format_inference_input() → HF Tokenizer → Model.generate() → Response
```

## API Endpoints

### GGUF Chat Completions

**Endpoint**: `POST {GGUF_SERVER_BASE}/v1/chat/completions`

**Request**:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Du är OneSeek, en svensk AI-assistent..."
    },
    {
      "role": "user",
      "content": "Vad är befolkningen i Stockholm?"
    }
  ],
  "max_tokens": 512,
  "temperature": 0.7,
  "stop": ["</s>", "[/INST]", "User:", "Användare:"]
}
```

**Response**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Stockholm har cirka 975 000 invånare..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Streaming Support

For streaming, add `"stream": true` to the request. Responses come as Server-Sent Events:

```
data: {"choices":[{"delta":{"content":"Stockholm"}}]}
data: {"choices":[{"delta":{"content":" har"}}]}
data: [DONE]
```

## Function Updates

### generate_with_llama_server()

**New Parameters**:
- `user_message` (optional): Direct user query, bypassing prompt parsing

**Behavior**:
1. Fetch platform system prompt via `get_active_system_prompt()`
2. Build messages array with `role=system` and `role=user`
3. POST to `/v1/chat/completions` (fallback to `/completion` if unavailable)
4. Extract response from OpenAI-style format

### stream_generate_with_llama_server()

**New Parameters**:
- `user_message` (optional): Direct user query for streaming

**Behavior**:
1. Same system prompt injection as non-streaming
2. POST to `/v1/chat/completions` with `stream=true`
3. Parse SSE format with `choices[0].delta.content`

## Testing

### Verify GGUF System Prompt Injection

1. Start llama-server with GGUF model:
   ```bash
   llama-server.exe -m model.gguf -ngl 99 --port 8080
   ```

2. Set environment variables:
   ```bash
   export MODEL_BACKEND=gguf
   export GGUF_SERVER_BASE=http://localhost:8080
   ```

3. Start CivicAI server with GGUF flag:
   ```bash
   python ml_service/server.py --use-gguf
   ```

4. Check server logs for system prompt injection:
   ```
   [GGUF] Sending to /v1/chat/completions with system prompt (1234 chars)
   [GGUF] Messages: [{'role': 'system', 'content': 'Du är OneSeek...'}, {'role': 'user', 'content': 'Vad är...'}]
   ```

5. Send a test query via Admin Builder or API

6. Verify in logs that:
   - First message is `role=system` with platform prompt
   - No "You are a helpful assistant" appears
   - Response follows Swedish platform guidelines

### Verify Legacy .bin Compatibility

1. Set `MODEL_BACKEND=bin`
2. Restart server (no `--use-gguf` flag)
3. Verify HuggingFace backend is used
4. Test queries work as before

## Troubleshooting

### Issue: "You are a helpful assistant" Still Appears

**Cause**: GGUF server not receiving system message, or using legacy endpoint

**Solution**:
1. Verify `GGUF_SERVER_BASE` is correct
2. Check llama-server supports `/v1/chat/completions`:
   ```bash
   curl http://localhost:8080/v1/chat/completions -X POST -H "Content-Type: application/json" -d '{"messages":[{"role":"system","content":"test"}]}'
   ```
3. Update llama-server to latest version if endpoint missing

### Issue: Admin Builder Routes to Wrong Backend

**Cause**: `MODEL_BACKEND` not set or frontend not detecting it

**Solution**:
1. Set `MODEL_BACKEND=gguf` in `.env.local`
2. Restart both backend and frontend servers
3. Check frontend config picks up environment variable
4. Verify frontend makes requests to `GGUF_SERVER_BASE`

### Issue: GGUF Server Connection Refused

**Cause**: llama-server not running or wrong port

**Solution**:
1. Start llama-server:
   ```bash
   llama-server.exe -m model.gguf --port 8080
   ```
2. Verify server running:
   ```bash
   curl http://localhost:8080/health
   ```
3. Check firewall not blocking port 8080

### Issue: Fallback to /completion Always Used

**Cause**: `/v1/chat/completions` endpoint not available in llama-server version

**Solution**:
1. Update llama-server to latest llama.cpp release
2. Or accept fallback behavior (still injects system prompt, but via prompt string)

## Implementation Notes

### llama-server Requirements

The GGUF server must:
- Expose `/v1/chat/completions` endpoint (OpenAI-compatible)
- Accept role-based messages array
- Support streaming via `stream=true` parameter
- Parse chat template from GGUF metadata

### Platform System Prompt Source

Priority order:
1. `PLATFORM_SYSTEM_PROMPT` environment variable
2. Active personality character card (if selected)
3. Admin-active system prompt (database)
4. `DEFAULT_SYSTEM_PROMPT` fallback

### Backward Compatibility

- Legacy `/completion` endpoint used as fallback
- Existing .bin backend unchanged
- No breaking changes to existing API contracts

## Configuration Examples

### Development (Local GGUF)

`.env.local`:
```bash
MODEL_BACKEND=gguf
GGUF_SERVER_BASE=http://localhost:8080
PLATFORM_SYSTEM_PROMPT="Du är OneSeek, en svensk AI-assistent för civila frågor."
```

### Production (Remote GGUF Cluster)

`.env.local`:
```bash
MODEL_BACKEND=gguf
GGUF_SERVER_BASE=https://gguf-cluster.example.com
BIN_SERVER_BASE=http://localhost:5000
PLATFORM_SYSTEM_PROMPT=""  # Use database prompt
```

### Legacy Mode (No GGUF)

`.env.local`:
```bash
MODEL_BACKEND=bin
BIN_SERVER_BASE=http://localhost:5000
```

## References

- llama.cpp: https://github.com/ggerganov/llama.cpp
- OpenAI Chat Completions API: https://platform.openai.com/docs/api-reference/chat
- GGUF Format: https://github.com/ggerganov/ggml/blob/master/docs/gguf.md

## Change Log

### 2025-12-08: Initial Implementation
- Added system prompt injection for GGUF backend
- Updated `generate_with_llama_server()` to use `/v1/chat/completions`
- Updated `stream_generate_with_llama_server()` for streaming support
- Added `GGUF_SERVER_BASE` and `PLATFORM_SYSTEM_PROMPT` configuration
- Created `.env.local` template with all configuration options
- Added comprehensive documentation

---

**Last Updated**: 2025-12-08  
**Author**: GitHub Copilot Agent  
**Version**: 1.0
