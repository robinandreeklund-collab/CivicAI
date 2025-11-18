# 🎨 CivicAI Demos and Prototypes

This directory contains UI demos, design concepts, and experimental prototypes for the CivicAI/OneSeek.AI platform.

## 📂 Contents

### HTML Demos
Interactive HTML demos showcasing various UI components and animations:

- **demo-animations.html** - Animation examples and transitions
- **demo-inline-css.html** - Inline CSS styling demonstrations
- **demo-processing-loader.html** - Loading indicators and progress animations
- **demo-search-box-animations.html** - Search box interactions and animations
- **demo-wheelbarrow-animation.html** - Custom wheelbarrow animation demo
- **nlp-flow-demo.html** - NLP pipeline flow visualization

### Design Concepts
Design mockups and conceptual explorations:

- **design-concepts/** - Various design iterations and visual concepts
  - Chat timeline concepts
  - UI/UX mockups
  - Visual design explorations

### Prototypes
Functional prototypes and experimental implementations:

- **prototypes/chat-ux-proposals/** - Chat interface UX proposals
- **prototypes/chat-design-improvements/** - Chat design iteration prototypes

## 🚀 Usage

### Viewing HTML Demos

Open any HTML file directly in a web browser:

```bash
# Using a local server (recommended)
cd demos
python -m http.server 8080
# Then open http://localhost:8080/demo-animations.html

# Or open directly in browser
open demo-animations.html  # macOS
xdg-open demo-animations.html  # Linux
start demo-animations.html  # Windows
```

### Exploring Prototypes

Each prototype directory contains its own README with specific instructions:

```bash
cd prototypes/chat-ux-proposals
# See README.md for details
```

## 📝 Notes

- These demos are for **development and design exploration** only
- Not all demos reflect the current production UI
- Some demos may have dependencies or require specific setup
- Demos are not included in the production build

## 🎯 Purpose

This directory serves as:
- **Design reference** for UI/UX decisions
- **Component playground** for testing interactions
- **Animation library** for reusable transitions
- **Historical record** of design evolution

## 🔗 Related Documentation

- [UI/UX Guide](../docs/guides/ANVÄNDARGRÄNSSNITT_GUIDE.md) - Main UI documentation
- [Development Guide](../docs/guides/DEVELOPMENT.md) - Development workflow

---

**Note**: When creating new demos or prototypes, add them to this directory and update this README.
