# Tankekedja Sidebar - Real-time Debate Transparency

## Overview

The Tankekedja (Thought Chain) Sidebar is a real-time transparency feature that exposes every step of the debate processing pipeline. It provides complete visibility into:

- User questions
- AI agent responses  
- MTA-DO quality analyses
- OneSeek reasoning and insights
- Voting processes
- Blockchain verification (placeholder for future integration)
- Timestamped event logs with duration tracking

## Features

### Real-time Event Streaming
- Captures all WebSocket events from live AI debates
- Displays events as they occur with sub-second timestamps
- Shows duration between consecutive events
- Auto-scrolls to latest events (with manual override)

### Color-Coded Event Types
The sidebar supports 18+ different event types, each with its own icon and color:

| Event Type | Icon | Color | Description |
|------------|------|-------|-------------|
| `user_question` | 💬 | Blue | User's debate question |
| `debate_start` / `debate_init` | 👁️ | Green | Debate initialization |
| `thinking` | ⏳ | Yellow | Processing indicator |
| `round_start` / `round_end` | ✓ | Cyan | Round boundaries |
| `round_summary` | 📊 | Purple | Round summary with consensus |
| `ai_response` | 💬 | Emerald | External AI responses |
| `oneseek_echo_start` / `oneseek_echo` | 👁️ | Indigo | OneSeek echoing responses |
| `mta_analysis` | 📊 | Orange | MTA-DO quality analysis |
| `oneseek_reasoning` | 📊 | Pink | OneSeek's analysis comments |
| `live_insight` | 👁️ | Violet | OneSeek's synthesis insights |
| `oneseek_own_answer_start` / `oneseek_own_answer` | 💬 | Blue | OneSeek's own debate response |
| `oneseek_own_reasoning` | 📊 | Pink | OneSeek's reasoning explanation |
| `voting_intro` | 🗳️ | Amber | Voting phase start |
| `vote_received` | 🗳️ | Amber | Individual votes |
| `winner` | 🏆 | Gold | Winner announcement |
| `debate_complete` | ✓ | Green | Debate conclusion |
| `blockchain_lock` | 🔒 | Red | Blockchain locking (future) |
| `blockchain_verify` | ✓ | Green | Blockchain verification (future) |
| `error` | ⚠️ | Red | Error messages |

### Expandable Event Details
- Click any event to see full details
- MTA-DO scores (6-dimension quality analysis)
- Full text content (truncated in collapsed view)
- Vote motivations
- Analysis summaries

### Auto-Show on Debate Start
- Sidebar automatically appears when a debate begins
- Clears previous events for new debate sessions
- Tracks user question as the first event

### Keyboard Shortcut
- Press **T** to toggle the sidebar visibility
- Press **Escape** to close the sidebar

### Collapsible Design
- Click the collapse button to minimize to a thin strip
- Preserves screen space when not actively monitoring
- Quick expand with one click

## Component Structure

### File Location
```
frontend/src/components/Tankekedja.jsx
```

### Integration Points
```javascript
// In SevenBZeroPage.jsx

// 1. Import
import Tankekedja from '../components/Tankekedja';

// 2. State
const [tankekedjaEvents, setTankekedjaEvents] = useState([]);
const [showTankekedja, setShowTankekedja] = useState(false);

// 3. Event Capture (in WebSocket handler)
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Track event with timestamp
  const eventWithTimestamp = {
    ...message,
    timestamp: message.timestamp || new Date().toISOString()
  };
  setTankekedjaEvents(prev => [...prev, eventWithTimestamp]);
  
  // Auto-show on debate start
  if (message.type === 'debate_init' || message.type === 'debate_start') {
    setShowTankekedja(true);
  }
};

// 4. Render
{debateMode && (
  <Tankekedja 
    events={tankekedjaEvents} 
    isVisible={showTankekedja}
    onToggle={() => setShowTankekedja(!showTankekedja)}
  />
)}
```

## Usage

### For Users

1. **Start a debate** by asking a question on the /7B-Zero page
2. The Tankekedja sidebar will automatically appear on the right side
3. **Watch in real-time** as the debate progresses:
   - See when each AI agent responds
   - View quality scores from MTA-DO analysis
   - Monitor OneSeek's reasoning process
   - Track voting and winner selection
4. **Click on any event** to see full details
5. **Toggle visibility** with the **T** key
6. **Scroll through history** - auto-scroll can be paused by scrolling up

### For Developers

#### Adding New Event Types

To add support for a new event type:

1. Add the event style in `getEventStyle()` function:
```javascript
function getEventStyle(eventType) {
  const styles = {
    // ... existing styles ...
    'your_new_event': { 
      icon: YourIcon, 
      color: 'text-color-400', 
      bg: 'bg-color-500/10', 
      label: 'Display Name' 
    },
  };
  return styles[eventType] || defaultStyle;
}
```

2. The event will automatically be displayed with the configured styling

#### Event Structure

Events should follow this structure:
```javascript
{
  type: 'event_type',           // Required: event type string
  timestamp: '2025-12-17T...',  // Required: ISO timestamp
  message: 'Event message',     // Optional: display message
  agent: 'gpt',                 // Optional: AI agent name
  round: 1,                     // Optional: round number
  text: 'Full content',         // Optional: expandable text
  analysis: {...},              // Optional: MTA-DO analysis object
  motivation: 'Vote reason',    // Optional: voting motivation
  voted_for: 'agent_name'       // Optional: vote target
}
```

## Technical Implementation

### State Management
- Events array: `tankekedjaEvents` - stores all debate events
- Visibility: `showTankekedja` - controls sidebar display
- Auto-scroll: Internal state with user override detection

### Performance
- Efficient re-rendering with React keys
- Smooth scrolling with `behavior: 'smooth'`
- Lazy expansion of event details
- Truncated text preview for performance

### Styling
- Consistent with existing CivicAI design system
- Dark theme (#0a0a0a background)
- Uses Tailwind CSS utility classes
- Lucide React icons

## Future Enhancements

### Blockchain Integration
- Real blockchain locking events when responses are saved
- Verification events with transaction IDs
- Hash display and verification status
- Link to blockchain explorer

### Advanced Features
- Filter events by type
- Search within events
- Export event log to JSON/CSV
- Event playback/replay mode
- Performance metrics visualization
- Compare events across multiple debates

### API Timing
- Track and display API call durations
- Identify slow endpoints
- Performance analytics

## Testing

### Manual Testing
1. Start the ml_service server: `python ml_service/server.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to `/7B-Zero` page
4. Initiate a debate with `[debatt]` prefix
5. Observe sidebar appearance and real-time event streaming
6. Test keyboard shortcut (T)
7. Test expand/collapse functionality
8. Test event detail expansion
9. Test auto-scroll and manual scroll override

### Automated Testing
Future test coverage:
- Component rendering tests
- Event display tests
- Timestamp formatting tests
- Duration calculation tests
- Auto-scroll behavior tests
- Keyboard shortcut tests

## Dependencies

- React (hooks: useState, useEffect, useRef)
- lucide-react (icons)
- Tailwind CSS (styling)
- WebSocket (real-time events)

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ⚠️ Sidebar width may need adjustment

## Known Issues

None currently identified.

## Contributing

When contributing to the Tankekedja sidebar:

1. Maintain the existing styling patterns
2. Add new event types with appropriate icons and colors
3. Ensure real-time performance is maintained
4. Test with various event volumes
5. Update this documentation with changes

## License

MIT License - Same as CivicAI project

## Authors

- Implementation: GitHub Copilot Agent
- Design: Based on CivicAI design system
- Integration: SevenBZeroPage debate system

## Changelog

### 2025-12-17 - Initial Implementation
- Created Tankekedja.jsx component
- Integrated with SevenBZeroPage
- Added 18+ event types with color coding
- Implemented real-time streaming
- Added keyboard shortcuts
- Added auto-scroll with manual override
- Added expandable event details
- Added timestamp and duration display
- Successfully built and tested

---

For more information about the CivicAI debate system, see:
- [LIVE_DEBATE_FLOW_COMPLETE.md](LIVE_DEBATE_FLOW_COMPLETE.md)
- [IMPLEMENTATION_SUMMARY_REALTIME_DEBATE.md](IMPLEMENTATION_SUMMARY_REALTIME_DEBATE.md)
- [DEBATE_IMPLEMENTATION.md](DEBATE_IMPLEMENTATION.md)
