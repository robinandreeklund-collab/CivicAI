# PES Web Frontend Overview

## 🎨 Design

Det nya webgränssnittet för PES har en modern, gradient-baserad design med lila/blå färgschema som matchar ONESEEK's branding.

## 📱 Interface Components

### Header
```
╔══════════════════════════════════════════════════════════════╗
║  🚀 PES - Prompt Evolution System                           ║
║     Data-driven prompt optimization for ONESEEK             ║
╚══════════════════════════════════════════════════════════════╝
```

### Navigation Tabs
```
┌─────────────┬──────────┬──────────────┬──────────┬─────────────┐
│ Dashboard   │ Prompts  │ Simuleringar │ Debatter │ Skapa Prompt│
└─────────────┴──────────┴──────────────┴──────────┴─────────────┘
```

### Dashboard View

#### System Status Card (Gradient lila/blå)
```
╔══════════════════════════════════════════════════════════════╗
║  System Status                                               ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ║
║  │ Status   │  │ Debatter │  │ Prompts  │  │Simulering│   ║
║  │   ✅     │  │    ✓     │  │    ✓     │  │    ✓     │   ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

#### Statistics Card
```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Statistik                                                 │
├──────────────────────────────────────────────────────────────┤
│ Totalt antal prompts ........................... 15          │
│ Totalt antal simuleringar ...................... 42          │
│ Tillgängliga debatter .......................... 128         │
│ Aktiva prompts ................................. 8           │
└──────────────────────────────────────────────────────────────┘
```

#### Top Prompts Card
```
┌──────────────────────────────────────────────────────────────┐
│ 🏆 Top Prompts                                               │
├──────────────────────────────────────────────────────────────┤
│ #1 v1.2.0 ..................... Score: 0.856 (12 sims)     │
│ #2 v1.1.5 ..................... Score: 0.842 (15 sims)     │
│ #3 v1.0.3 ..................... Score: 0.821 (10 sims)     │
└──────────────────────────────────────────────────────────────┘
```

### Prompts View

```
┌──────────────────────────────────────────────────────────────┐
│ Alla Prompts                                                 │
│                                                              │
│ Filtrera:                                                    │
│ [Alla ämnen ▼] [Alla status ▼]                             │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Version │ Ämne    │ Status │ Avg Score │ Sims │ Skapad│ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ v1.2.0  │ general │ active │   0.856   │  12  │ 2024  │ │
│ │ v1.1.5  │ general │ testing│   0.842   │  15  │ 2024  │ │
│ │ v1.0.3  │ politics│ active │   0.821   │  10  │ 2024  │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Create Prompt View

```
┌──────────────────────────────────────────────────────────────┐
│ Skapa Ny Prompt                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Prompt Text *                                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Du är ONESEEK-7B-Zero, en objektiv AI-assistent...    │ │
│ │                                                        │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Version *           │  Ämne                                 │
│ [v1.0.0         ]   │  [general      ▼]                    │
│                                                              │
│ Författare                                                   │
│ [Ditt namn                                              ]   │
│                                                              │
│ Beskrivning                                                  │
│ [Kort beskrivning av ändringarna                        ]   │
│                                                              │
│ ☑ Kör simulering direkt efter skapande                     │
│                                                              │
│ ┌────────────────┐                                          │
│ │ Skapa Prompt   │                                          │
│ └────────────────┘                                          │
│                                                              │
│ ╔═══════════════════════════════════════════════════════╗  │
│ ║ ✅ Prompt skapad!                                     ║  │
│ ║ Version: v1.0.0                                       ║  │
│ ║ ID: abc123def456                                      ║  │
│ ║ Avg Score: 0.823                                      ║  │
│ ║ Debatter: 10                                          ║  │
│ ║ Success Rate: 95.0%                                   ║  │
│ ╚═══════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────┘
```

## 🎯 Features

### Real-time Updates
- Dashboard uppdateras automatiskt när ny data finns
- Loading spinners under datahämtning
- Error messages vid problem

### Interactive Tables
- Sorterbara kolumner
- Hover-effekter på rader
- Färgkodade badges (success, warning, info)
- Responsiv design

### Forms
- Validation av required fields
- Real-time feedback
- Success/error messages
- Automatic form reset efter success

### Visual Feedback
- Gradient bakgrunder (lila/blå)
- Card-baserad layout
- Smooth animations och transitions
- Modern typography

## 🖥️ Technology Stack

- **Pure HTML/CSS/JavaScript** - Inga dependencies
- **Fetch API** - För REST calls till backend
- **CSS Grid & Flexbox** - För responsiv layout
- **CSS Animations** - För smooth UX

## 📱 Responsive Design

Gränssnittet anpassar sig automatiskt för:
- Desktop (>1400px)
- Laptop (1024-1400px)
- Tablet (768-1024px)
- Mobile (<768px)

## 🎨 Color Scheme

- **Primary Gradient**: #667eea → #764ba2 (lila/blå)
- **Success**: #4caf50 (grön)
- **Warning**: #ff9800 (orange)
- **Info**: #2196f3 (blå)
- **Error**: #c62828 (röd)

## 🚀 Usage Flow

1. **Öppna** `http://localhost:3001/pes`
2. **Dashboard** visar systemstatus
3. **Bläddra** genom tabs för att se data
4. **Skapa** ny prompt i "Skapa Prompt" tab
5. **Se resultat** direkt efter simulering
6. **Jämför** prompts i Prompts-vyn

## 📊 Data Visualization

Alla tabeller visar:
- **Badges** för status (active, testing, archived)
- **Color-coded values** för metrics
- **Formatted dates** i svenskt format
- **Truncated text** för långa fält med "..."

## 🔄 Live Demo Workflow

```
User opens /pes
    ↓
Dashboard loads automatically
    ↓
Shows: Status, Statistics, Top Prompts
    ↓
User clicks "Skapa Prompt" tab
    ↓
Fills in form and submits
    ↓
Loading spinner appears
    ↓
Backend creates prompt and runs simulation
    ↓
Success message with results
    ↓
User can switch to "Prompts" tab
    ↓
Sees newly created prompt in table
```

## 🎓 Best for

- **Utvecklare** som vill testa nya prompts
- **Analytiker** som vill följa prestanda
- **Product Owners** som vill se statistik
- **Forskare** som vill jämföra versioner

---

**Interface är optimerad för enkelhet och hastighet!** 🚀
