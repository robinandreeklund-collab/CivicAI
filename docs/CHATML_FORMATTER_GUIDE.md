# ChatML Formatter for GGUF Models

## Overview

The ChatML formatter provides utilities for formatting prompts in the ChatML format that llama.cpp and GPT4ALL expect for GGUF models. This ensures responses from CivicAI match those from the direct llama-server endpoint at http://127.0.0.1:8081/.

## ChatML Format

ChatML (Chat Markup Language) uses special tokens to delineate different parts of a conversation:

```
<|im_start|>system
{system_prompt}<|im_end|>
<|im_start|>user
{user_message}<|im_end|>
<|im_start|>assistant
{assistant_response}<|im_end|>
```

## Key Features

1. **No extra chat_template**: We build prompts ourselves, not relying on llama-server's template system
2. **Proper stop tokens**: Prevents format leakage and unwanted continuations
3. **Response cleaning**: Removes ChatML artifacts from model output
4. **Conversation history**: Full support for multi-turn conversations
5. **Validation**: Ensures prompts are properly formatted before sending

## Usage

### Basic Usage (Single Turn)

```python
from ml_service.chatml_formatter import serialize_message_history

# Simple question without history
prompt = serialize_message_history(
    system_prompt="You are a helpful assistant.",
    user_message="What is the capital of France?"
)

# Result:
# <|im_start|>system
# You are a helpful assistant.<|im_end|>
# <|im_start|>user
# What is the capital of France?<|im_end|>
# <|im_start|>assistant
#
```

### With Conversation History

```python
from ml_service.chatml_formatter import serialize_message_history

# Conversation history
history = [
    {"role": "user", "content": "What is Paris?"},
    {"role": "assistant", "content": "Paris is the capital of France."}
]

# Ask a follow-up question
prompt = serialize_message_history(
    system_prompt="You are a geography expert.",
    user_message="What about London?",
    history=history
)

# Result includes the full conversation context
```

### Creating llama-server Payloads

```python
from ml_service.chatml_formatter import format_for_llama_server

# Create a complete payload ready for llama-server /completion endpoint
payload = format_for_llama_server(
    system_prompt="You are a helpful assistant.",
    user_message="Tell me a joke.",
    history=None,
    max_tokens=256,
    temperature=0.7,
    additional_stops=["STOP"]  # Optional additional stop tokens
)

# Send to llama-server
import requests
response = requests.post(
    "http://127.0.0.1:8081/completion",
    json=payload
)
result = response.json()
text = result.get('content', '')
```

### Streaming Responses

```python
from ml_service.chatml_formatter import format_for_llama_server_stream

# Create streaming payload
payload = format_for_llama_server_stream(
    system_prompt="You are a helpful assistant.",
    user_message="Count to 10.",
    history=None,
    max_tokens=128,
    temperature=0.7
)

# Send streaming request
import requests
response = requests.post(
    "http://127.0.0.1:8081/completion",
    json=payload,
    stream=True
)

# Process streaming response
for line in response.iter_lines():
    if line:
        # Process each chunk...
        pass
```

### Cleaning Responses

```python
from ml_service.chatml_formatter import clean_chatml_response

# Sometimes models include ChatML tokens in their output
dirty_response = "<|im_start|>assistant\nThis is a response<|im_end|>"
clean_response = clean_chatml_response(dirty_response)
# Result: "This is a response"
```

## API Integration

### Using with /inference/oneseek Endpoint

```python
import requests

# Single turn
response = requests.post(
    "http://localhost:5000/api/inference/oneseek",
    json={
        "text": "What is the capital of France?",
        "max_length": 512,
        "temperature": 0.7
    }
)

# With conversation history
response = requests.post(
    "http://localhost:5000/api/inference/oneseek",
    json={
        "text": "What about London?",
        "history": [
            {"role": "user", "content": "What is Paris?"},
            {"role": "assistant", "content": "Paris is the capital of France."}
        ],
        "max_length": 512,
        "temperature": 0.7
    }
)
```

### Using with /stream Endpoint

```javascript
// Frontend JavaScript
const response = await fetch('/stream', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        text: 'Tell me a story.',
        history: [
            {role: 'user', content: 'Hi!'},
            {role: 'assistant', content: 'Hello!'}
        ],
        max_length: 512,
        temperature: 0.7
    })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    // Parse SSE events...
}
```

## Stop Tokens

The ChatML formatter uses the following stop tokens by default:

- `<|im_end|>` - Standard ChatML end token
- `<|im_start|>user` - Prevents generating next user turn
- `</s>` - EOS token (end of sequence)

Additional stop tokens are added to prevent conversation format leakage:
- `User:`, `\nUser:`, `Assistant:`, `\nAssistant:`, `\n\n`

## Testing

Run the test suite to verify the ChatML formatter:

```bash
cd /home/runner/work/CivicAI/CivicAI
python tests/test_chatml_formatter.py
```

All tests should pass:
```
======================================================================
ChatML Formatter Test Suite
======================================================================
✅ ALL TESTS PASSED!
======================================================================
```

## Validation

Before sending a prompt to the model, you can validate it:

```python
from ml_service.chatml_formatter import validate_chatml_format

prompt = serialize_message_history(...)
if validate_chatml_format(prompt):
    # Prompt is valid, send to model
    pass
else:
    # Prompt has formatting issues
    pass
```

## Advanced Usage

### Custom Stop Tokens

```python
from ml_service.chatml_formatter import get_chatml_stop_tokens

# Get default stop tokens
stops = get_chatml_stop_tokens()

# Add custom stop tokens
stops_extended = get_chatml_stop_tokens(additional_stops=["CUSTOM_STOP", "END"])
```

### Manual Message Building

```python
from ml_service.chatml_formatter import format_chatml_prompt

messages = [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Hi!"},
    {"role": "assistant", "content": "Hello!"},
    {"role": "user", "content": "How are you?"}
]

prompt = format_chatml_prompt(messages, add_generation_prompt=True)
```

## Troubleshooting

### Response includes ChatML tokens

Use `clean_chatml_response()` to remove artifacts:

```python
from ml_service.chatml_formatter import clean_chatml_response

response = model_generate(...)
clean = clean_chatml_response(response)
```

### Model continues generating user messages

Ensure you're using the proper stop tokens:

```python
payload = format_for_llama_server(
    ...,
    additional_stops=["User:", "\nUser:"]
)
```

### Responses don't match llama-server

1. Verify ChatML formatter is enabled (check server logs for `[CHATML]`)
2. Ensure no extra `chat_template` is being passed to llama-server
3. Check that stop tokens match those used by llama-server
4. Validate prompt format with `validate_chatml_format()`

## References

- llama.cpp: https://github.com/ggerganov/llama.cpp
- GPT4ALL: https://gpt4all.io/
- ChatML Format: Used by many instruction-tuned models
- DeepSeek-R1-Distill-Llama-8B: Example GGUF model for testing
