# Multi-Turn Conversation Support - Implementation Guide

## Overview

Full multi-turn conversation history support has been implemented in CivicAI, allowing the model to maintain context across multiple exchanges with the user.

## Features Implemented

### 1. Conversation History Tracking

**State Management:**
```javascript
const [conversationHistory, setConversationHistory] = useState([]);
```

**Format:**
```javascript
[
  { role: 'user', content: 'What is Paris?' },
  { role: 'assistant', content: 'Paris is the capital of France.' },
  { role: 'user', content: 'What about London?' },
  { role: 'assistant', content: 'London is the capital of the UK.' }
]
```

### 2. History Sent with Requests

Every streaming request now includes the full conversation history:

```javascript
const response = await fetch('/stream', {
  method: 'POST',
  body: JSON.stringify({
    text: question,
    history: conversationHistory,  // Full context
    max_length: 512,
    temperature: 0.7,
    top_p: 0.9,
  }),
});
```

### 3. UI Indicators

**History Counter:**
- Shows above input field when history exists
- Format: "💬 N tidigare meddelande(n) i kontext"
- Automatically updates as conversation grows

**Clear History Button:**
- "Rensa historik" - resets conversation
- Only appears when history exists
- Instant reset to start fresh

## User Experience

### Starting a Conversation

```
┌─────────────────────────────────────────┐
│ Ställ en fråga till OneSeek...         │
└─────────────────────────────────────────┘
```
No history indicator - fresh start.

### After First Exchange

```
💬 1 tidigare meddelande i kontext    [Rensa historik]
┌─────────────────────────────────────────┐
│ Ställ en fråga till OneSeek...         │
└─────────────────────────────────────────┘
```

### Multi-Turn Conversation

```
User: "Vad är Stockholm?"

OneSeek: "Stockholm är Sveriges huvudstad och största stad..."

💬 1 tidigare meddelande i kontext    [Rensa historik]

User: "Hur många invånare?"
      ↓ (model receives Stockholm context)

OneSeek: "Stockholm har cirka 975 000 invånare i själva staden, 
         och cirka 2,4 miljoner i storstadsområdet."

💬 2 tidigare meddelanden i kontext    [Rensa historik]

User: "Vad är känt för?"
      ↓ (model still has Stockholm context)

OneSeek: "Stockholm är känt för sin vackra skärgård, 
         gamla stan, och som ett centrum för innovation..."
```

### Clearing History

Click "Rensa historik":
```
💬 indicator disappears
┌─────────────────────────────────────────┐
│ Ställ en fråga till OneSeek...         │
└─────────────────────────────────────────┘
```
Fresh conversation starts.

## Technical Implementation

### Frontend Updates

**File:** `frontend/src/pages/SevenBZeroPage.jsx`

**Changes:**
1. Added `conversationHistory` state
2. Updated streaming request to include history
3. Added history update after successful response
4. Added UI indicator and clear button
5. Singular/plural grammar handling

### Backend Support

**Already Implemented:**
- `InferenceRequest.history` parameter
- `StreamRequest.history` parameter
- ChatML formatter `serialize_message_history()` function
- History serialization in proper ChatML format

### Message Flow

```
Frontend                    Backend                     Model
   │                          │                           │
   ├─ Question + History ────>│                           │
   │                          ├─ Build ChatML Prompt ────>│
   │                          │   with full history       │
   │                          │                           │
   │                          │<── Response ──────────────┤
   │<─ Stream Response ───────┤                           │
   │                          │                           │
   ├─ Update History          │                           │
   │  (user + assistant)      │                           │
   │                          │                           │
   ├─ Next Question ─────────>│                           │
   │  + Updated History       │                           │
```

## ChatML Format

The backend formats the conversation history using ChatML tags:

```
<|im_start|>system
{system_prompt}<|im_end|>
<|im_start|>user
What is Paris?<|im_end|>
<|im_start|>assistant
Paris is the capital of France.<|im_end|>
<|im_start|>user
What about London?<|im_end|>
<|im_start|>assistant
```

This format is understood by llama.cpp and GPT4ALL models.

## Benefits

### 1. Context Retention
- Model remembers previous exchanges
- More natural, coherent conversations
- Can reference earlier topics

### 2. User Control
- Clear indicator of conversation state
- Easy reset with "Rensa historik"
- Transparent history tracking

### 3. Performance
- No unnecessary history in single-turn questions
- Efficient state management
- Clean separation of concerns

### 4. Compatibility
- Works with all GGUF models
- Compatible with llama-server backend
- Supports both streaming and non-streaming

## Testing

### Test Scenario 1: Basic Multi-Turn
```
1. Ask: "Vad är Python?"
   - No history sent
   - Response received
   - History: 1 message pair

2. Ask: "Ge exempel på användning"
   - History sent (Python context)
   - Response contextually relevant
   - History: 2 message pairs

3. Click "Rensa historik"
   - History cleared
   - Counter disappears

4. Ask: "Hej!"
   - No history sent
   - Fresh conversation
```

### Test Scenario 2: Long Conversation
```
1. Start technical discussion
2. Ask follow-up questions
3. Watch history counter increase
4. Verify model maintains context
5. Clear when switching topics
```

### Test Scenario 3: Multiple Conversations
```
1. Have conversation about Topic A
2. Clear history
3. Have conversation about Topic B
4. Verify no cross-contamination
```

## Limitations & Considerations

### Token Limits
- Long conversations may exceed context window
- Consider implementing history truncation for very long chats
- Currently sends full history (unlimited)

### Memory Management
- History stored in React state (session-only)
- Cleared on page refresh
- No persistence across sessions (by design)

### Performance
- Larger history = more tokens sent
- Longer processing time for very long conversations
- Consider history limits for production

## Future Enhancements

### Possible Improvements:
1. **History Truncation**: Keep only last N exchanges
2. **Smart Summarization**: Compress old context
3. **Topic Detection**: Auto-clear when topic changes
4. **History Persistence**: Save across sessions (optional)
5. **History Viewer**: Show full conversation timeline
6. **Export Feature**: Save conversations

## Code References

### Key Functions

**Update History:**
```javascript
setConversationHistory(prev => [
  ...prev,
  { role: 'user', content: question },
  { role: 'assistant', content: formattedFinalText }
]);
```

**Clear History:**
```javascript
setConversationHistory([]);
```

**Send with Request:**
```javascript
body: JSON.stringify({
  text: question,
  history: conversationHistory,
  ...
})
```

## Conclusion

Multi-turn conversation support is now fully implemented and ready for use. Users can have natural, context-aware conversations with the model, and easily reset when starting a new topic.

The implementation:
- ✅ Tracks conversation history
- ✅ Sends history with requests
- ✅ Displays history indicator
- ✅ Provides clear/reset functionality
- ✅ Works with existing ChatML formatter
- ✅ Compatible with all backends

All three requested features from the "Next Steps" are now complete!
