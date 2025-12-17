# Tankekedja Tree Structure - Visual Example

## Tree View Visualization

The new tree structure transforms the flat event list into a hierarchical, pedagogical representation:

```
Debatt: Bör dödsstraff avskaffas i fler länder?

└─ 💬 Fråga (Input)
   "Bör dödsstraff avskaffas i fler länder?"
   │
   ├─ 👁️ Runda 1
   │   ├─ 💬 GROK svar
   │   │   ├─ 📊 MTA-DO Analys (8.5/10)
   │   │   ├─ 📊 ONESEEK Commentary
   │   │   └─ 👁️ 💡 Insight: "Stark etisk grund"
   │   │
   │   ├─ 💬 GPT svar
   │   │   ├─ 📊 MTA-DO Analys (7.8/10)
   │   │   ├─ 📊 ONESEEK Commentary
   │   │   └─ 👁️ 💡 Insight: "Pragmatisk approach"
   │   │
   │   ├─ 💬 GEMINI svar
   │   │   ├─ 📊 MTA-DO Analys (8.2/10)
   │   │   ├─ 📊 ONESEEK Commentary
   │   │   └─ 👁️ 💡 Insight: "Balanserad analys"
   │   │
   │   ├─ 💬 DEEPSEEK svar
   │   │   ├─ 📊 MTA-DO Analys (8.0/10)
   │   │   ├─ 📊 ONESEEK Commentary
   │   │   └─ 👁️ 💡 Insight: "Statistisk grund"
   │   │
   │   └─ 💬 ONESEEK Huvudbidrag (Syntes av runda 1)
   │       "Sammanfattar lärdomar från alla svar..."
   │
   ├─ 👁️ Runda 2 (med kontext från Runda 1)
   │   ├─ 💬 GEMINI svar (slumpad ordning)
   │   │   ├─ 📊 MTA-DO Analys (8.7/10)
   │   │   ├─ 📊 ONESEEK Commentary
   │   │   └─ 👁️ 💡 Insight: "Bygger på runda 1"
   │   │
   │   ├─ 💬 GPT svar
   │   │   └─ ...
   │   │
   │   ├─ 💬 DEEPSEEK svar
   │   │   └─ ...
   │   │
   │   ├─ 💬 GROK svar
   │   │   └─ ...
   │   │
   │   └─ 💬 ONESEEK Huvudbidrag (Syntes av runda 2)
   │
   ├─ 👁️ Runda 3
   │   ├─ 💬 DEEPSEEK svar
   │   │   └─ ...
   │   └─ ... (fortsätter)
   │
   ├─ 🗳️ Röstning
   │   ├─ 🗳️ GROK röstar → GEMINI
   │   │   "Motivation: Mest balanserad analys..."
   │   │
   │   ├─ 🗳️ GPT röstar → DEEPSEEK
   │   │   "Motivation: Stark statistisk grund..."
   │   │
   │   ├─ 🗳️ GEMINI röstar → GROK
   │   │   "Motivation: Etiskt välgrundad..."
   │   │
   │   ├─ 🗳️ DEEPSEEK röstar → GEMINI
   │   │   "Motivation: Komplett analys..."
   │   │
   │   ├─ 🗳️ ONESEEK röstar → GEMINI
   │   │   "Motivation: Bästa helhetsbilden..."
   │   │
   │   └─ 🏆 Vinnare: GEMINI
   │       3/5 röster
   │
   └─ 📊 Final Sammanfattning (ONESEEK)
       ├─ Analys av röster
       ├─ MTA-DO-trender över rundor
       └─ Slutsats och insikter
```

## Interactive Features

### Expandable Nodes
Each node can be clicked to show/hide details:

- **Question**: Full question text
- **Agent Responses**: Complete response text (scrollable)
- **MTA-DO Analysis**: 
  - Weighted score (0-10)
  - Dimension breakdown
  - Strengths list
  - Raw JSON data
- **Commentary**: Full OneSeek analysis
- **Insights**: Complete insight text
- **Votes**: Motivation text (50-80 words)
- **Final Summary**: Full summary with analysis

### Visual Elements

**Tree Lines:**
```
│  Vertical line (parent-child connection)
├─ Branch (node with siblings below)
└─ Last branch (final child)
```

**Icons:**
- 💬 MessageSquare: Questions, responses
- 👁️ Eye: Rounds, insights
- 📊 BarChart3: Analyses, summaries
- 🗳️ Vote: Voting section, individual votes
- 🏆 Trophy: Winner announcement
- 💡 Bulb: Special insight marker

**Colors:**
- Blue: User input, OneSeek responses
- Cyan: Round markers
- Emerald: Agent responses
- Orange: MTA-DO analysis
- Pink: OneSeek commentary
- Violet: Insights
- Amber: Voting
- Yellow: Winner
- Green: Final summary

### Collapsible Behavior

All nodes with children are collapsible:
- ▼ Expanded (ChevronDown)
- ▶ Collapsed (ChevronRight)

Default: All nodes start expanded for full transparency

### Real-time Building

Tree grows as events arrive:
1. Question appears immediately
2. Round 1 branch adds
3. Each agent response appears as it arrives
4. MTA-DO, commentary, insight nest under agent
5. OneSeek synthesis appears after all agents
6. Round 2, 3 repeat pattern
7. Voting section builds vote by vote
8. Winner and summary conclude tree

## Advantages Over Flat Cards

### Pedagogical Value
- **See the flow**: Question → Rounds → Responses → Analysis → Synthesis
- **Understand relationships**: Which commentary belongs to which response
- **Track context**: How rounds build on each other

### Better Organization
- **Natural hierarchy**: Parent-child relationships clear
- **Easy navigation**: Collapse irrelevant sections
- **Scalable**: Long debates stay organized

### Enhanced Transparency
- **Complete chain**: Every step from input to output
- **Dependencies visible**: See what influenced what
- **Process clarity**: Understand AI debate methodology

## Technical Implementation

**Tree Building:**
- Processes flat event stream
- Groups by round and agent
- Nests children appropriately
- Maintains chronological order

**Rendering:**
- Recursive TreeNode component
- CSS tree lines (absolute positioning)
- Proper indentation (depth * 20px)
- Hover effects and transitions

**Performance:**
- Efficient re-rendering with React keys
- Lazy detail expansion
- Auto-scroll with manual override
- Smooth animations

## Example Use Case

**Question:** "Bör dödsstraff avskaffas i fler länder?"

**User Journey:**
1. Sees question as root of tree
2. Expands Runda 1 to see all AI responses
3. Clicks on GEMINI's response to read full text
4. Expands MTA-DO analysis to see score: 8.2/10
5. Reads OneSeek's commentary on GEMINI's answer
6. Sees insight: "Balanserad analys"
7. Moves to Runda 2, notices GEMINI went first (randomized)
8. Compares how GEMINI's Round 2 response builds on Round 1
9. Jumps to voting section to see who voted for whom
10. Sees GEMINI won with 3/5 votes
11. Reads final summary to understand why GEMINI won

This pedagogical flow is impossible with flat cards but natural with tree structure.
