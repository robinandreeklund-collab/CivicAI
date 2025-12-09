# Visual Guide: New Features in CivicAI

## Complete UI Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     OneSeek-7B-Zero                            │
│                    Quantum Interface                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💬 2 tidigare meddelanden i kontext    [Rensa historik]       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Ställ en fråga till OneSeek...                   →      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Message History ──────────────────────────────────────┐   │
│  │                                                          │   │
│  │  USER (2024-12-09 · 13:30)                              │   │
│  │  Vad är Stockholm?                                       │   │
│  │                                                          │   │
│  │  ONESEEK · 1.2s                                          │   │
│  │  Stockholm är Sveriges huvudstad och största stad...     │   │
│  │                                                          │   │
│  │  🧠 Tankekedja (245 tecken) ▼                           │   │
│  │    Let me analyze this. The user is asking about       │   │
│  │    Stockholm. I should provide information about        │   │
│  │    it being Sweden's capital and some key facts.        │   │
│  │                                                          │   │
│  │  tokens: 87    tokens/s: 72.5                           │   │
│  │                                                          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  USER (2024-12-09 · 13:31)                              │   │
│  │  Hur många invånare har staden?                          │   │
│  │                                                          │   │
│  │  ONESEEK · 0.9s                                          │   │
│  │  Stockholm har cirka 975 000 invånare i själva staden   │   │
│  │  och cirka 2,4 miljoner i hela storstadsområdet.        │   │
│  │                                                          │   │
│  │  🧠 Tankekedja (189 tecken) ▶                           │   │
│  │    [Click to expand]                                     │   │
│  │                                                          │   │
│  │  tokens: 64    tokens/s: 71.1                           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Breakdown

### 1. Conversation History Indicator

```
┌─────────────────────────────────────────────────────────┐
│ 💬 2 tidigare meddelanden i kontext    [Rensa historik] │
└─────────────────────────────────────────────────────────┘
```

**Elements:**
- 💬 Icon - visual indicator of active conversation
- Count - shows number of previous message pairs
- Grammar - singular/plural ("1 tidigare meddelande" vs "2 tidigare meddelanden")
- Clear button - "Rensa historik" to start fresh

**States:**
- Not visible when history is empty
- Updates automatically after each exchange
- Disappears when cleared

### 2. Thinking Chain Display

```
┌──────────────────────────────────────────┐
│ 🧠 Tankekedja (245 tecken) ▶            │
│    [Collapsed - click to expand]         │
└──────────────────────────────────────────┘

After clicking ▼:

┌──────────────────────────────────────────┐
│ 🧠 Tankekedja (245 tecken) ▼            │
├──────────────────────────────────────────┤
│ Let me analyze this question.            │
│ The user is asking about Stockholm.      │
│ I should provide key facts about         │
│ Sweden's capital city...                 │
└──────────────────────────────────────────┘
```

**Features:**
- Collapsible `<details>` element
- Shows character count
- Monospace font for thinking text
- Only appears if model outputs `<think>` tags
- Theme-aware colors

### 3. Token Metrics

```
┌──────────────────────────────────┐
│ tokens: 156    tokens/s: 45.2    │
└──────────────────────────────────┘
```

**Information:**
- Total token count for the response
- Generation speed in tokens per second
- Minimalist, unobtrusive display
- Matches llama frontend style

### 4. Message Layout

```
┌─────────────────────────────────────────┐
│ 2024-12-09 · 13:30                      │ ← Timestamp
│                                         │
│ [AI Response text with markdown...]     │ ← Main response
│                                         │
│ 🧠 Tankekedja (245 tecken) ▶           │ ← Thinking (if available)
│                                         │
│ tokens: 156    tokens/s: 45.2           │ ← Metrics
└─────────────────────────────────────────┘
```

## User Flows

### Starting Fresh

```
Step 1: Empty State
┌────────────────────────────────┐
│ [No history indicator]         │
│ ┌──────────────────────────┐  │
│ │ Ställ en fråga...        │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘

Step 2: First Question
User: "Vad är Python?"

Step 3: After Response
┌────────────────────────────────┐
│ 💬 1 tidigare meddelande       │
│ [Rensa historik]               │
│ ┌──────────────────────────┐  │
│ │ Ställ en fråga...        │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘

Message shows:
- AI response about Python
- 🧠 Thinking (if model provided)
- tokens: 142    tokens/s: 53.7
```

### Multi-Turn Conversation

```
Turn 1:
User: "Vad är Stockholm?"
→ Response with facts
💬 1 tidigare meddelande i kontext

Turn 2:
User: "Hur många invånare?"
→ Response uses Stockholm context
💬 2 tidigare meddelanden i kontext

Turn 3:
User: "Vad är känt för?"
→ Response still about Stockholm
💬 3 tidigare meddelanden i kontext

Click [Rensa historik]
→ Counter disappears
→ Fresh conversation
```

### Viewing Thinking Process

```
Normal State (collapsed):
┌──────────────────────────────┐
│ AI Response here...          │
│                              │
│ 🧠 Tankekedja (245 tecken) ▶│
│                              │
│ tokens: 87    tokens/s: 72.5 │
└──────────────────────────────┘

After Clicking ▶:
┌──────────────────────────────┐
│ AI Response here...          │
│                              │
│ 🧠 Tankekedja (245 tecken) ▼│
│ ┌──────────────────────────┐ │
│ │ Let me analyze this...   │ │
│ │ The user wants info...   │ │
│ │ I should provide...      │ │
│ └──────────────────────────┘ │
│                              │
│ tokens: 87    tokens/s: 72.5 │
└──────────────────────────────┘
```

## Theme Support

### Dark Mode (Default)
```
Background: #0a0a0a (very dark)
Text: #d0d0d0 (light gray)
Thinking bg: #0a0a0a (dark)
Metrics: #555 (dim gray)
History indicator: #888 (medium gray)
```

### White Mode
```
Background: white
Text: #333 (dark gray)
Thinking bg: #f8f8f8 (light gray)
Metrics: #999 (medium gray)
History indicator: #666 (darker gray)
```

## Responsive Behavior

### Desktop
- Full width layout
- All features visible
- Comfortable spacing

### Mobile
- Stacked layout
- Touch-friendly buttons
- Scrollable thinking sections

## Accessibility

### Features:
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader labels
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators
- ✅ Semantic HTML (details/summary)

### ARIA Labels:
```html
<button aria-label="Rensa konversationshistorik">
  Rensa historik
</button>

<details>
  <summary>🧠 Tankekedja (245 tecken)</summary>
  <pre>Thinking content...</pre>
</details>
```

## Performance

### Optimizations:
- Batched DOM updates during streaming
- RequestAnimationFrame for smooth rendering
- Minimal re-renders with React state
- Efficient history management

### Metrics Display:
- Calculated once after response complete
- No continuous updates
- Lightweight text rendering

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

Features used:
- `<details>` element (supported everywhere)
- CSS Grid/Flexbox (modern browsers)
- Fetch API (universal support)
- ES6+ JavaScript (transpiled if needed)

## Example Conversation with All Features

```
┌─────────────────────────────────────────────────────────┐
│              OneSeek-7B-Zero · Quantum Interface        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 💬 3 tidigare meddelanden i kontext  [Rensa historik]  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Ställ en fråga till OneSeek...           →       │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─ Messages ────────────────────────────────────────┐  │
│ │                                                    │  │
│ │ USER (13:25)                                       │  │
│ │ Vad är artificiell intelligens?                    │  │
│ │                                                    │  │
│ │ ONESEEK · 1.8s                                     │  │
│ │ Artificiell intelligens (AI) är datorprogram      │  │
│ │ som kan lära sig och fatta beslut...              │  │
│ │                                                    │  │
│ │ 🧠 Tankekedja (312 tecken) ▶                      │  │
│ │ tokens: 124    tokens/s: 68.9                     │  │
│ │                                                    │  │
│ ├────────────────────────────────────────────────────┤  │
│ │                                                    │  │
│ │ USER (13:26)                                       │  │
│ │ Ge exempel på användningsområden                   │  │
│ │                                                    │  │
│ │ ONESEEK · 1.2s                                     │  │
│ │ AI används inom många områden: sjukvård för       │  │
│ │ diagnostik, bil-industrin för självkörande        │  │
│ │ fordon, och kundtjänst för chatbots...            │  │
│ │                                                    │  │
│ │ 🧠 Tankekedja (278 tecken) ▼                      │  │
│ │ ┌──────────────────────────────────────────────┐  │  │
│ │ │ The user wants examples. Since we were just  │  │
│ │ │ discussing AI, they want AI use cases.       │  │
│ │ │ I should give diverse, relevant examples.    │  │
│ │ └──────────────────────────────────────────────┘  │  │
│ │                                                    │  │
│ │ tokens: 98     tokens/s: 81.7                     │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This shows all features working together:
- ✅ Multi-turn conversation (3 previous messages)
- ✅ History indicator with clear button
- ✅ Thinking chain (one collapsed, one expanded)
- ✅ Token metrics on all responses
- ✅ Proper message threading
- ✅ Theme styling

Perfect integration! 🎉
