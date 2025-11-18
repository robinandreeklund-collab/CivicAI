# 🤝 Contributing to CivicAI

Thank you for your interest in contributing to CivicAI/OneSeek.AI! We welcome contributions from developers, researchers, designers, and anyone passionate about transparent AI and civic technology.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Guidelines](#contribution-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our Code of Conduct:

### Our Standards

- **Be respectful** - Treat everyone with respect and kindness
- **Be collaborative** - Work together and help each other
- **Be inclusive** - Welcome diverse perspectives and backgrounds
- **Be professional** - Focus on constructive feedback
- **Be transparent** - Communicate openly and honestly

### Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Trolling, insulting comments, or inflammatory language
- Publishing others' private information
- Any conduct that could be considered inappropriate

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Python 3.8+ (optional, for ML features)
- Code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/CivicAI.git
   cd CivicAI
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/robinandreeklund-collab/CivicAI.git
   ```

### Setup Development Environment

Run the setup script:
```bash
./scripts/setup.sh
```

Or manually:
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure API keys in backend/.env
```

### Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Python ML (optional):**
```bash
cd backend/python_services
./setup.sh
python3 nlp_pipeline.py
```

---

## Development Workflow

### 1. Create a Feature Branch

Always work on a new branch:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clear, concise code
- Follow existing code style
- Add comments for complex logic
- Keep changes focused and atomic

### 3. Test Your Changes

```bash
# Run linters
./scripts/lint.sh

# Run tests (when available)
npm test

# Build to check for errors
./scripts/build.sh
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add consensus debate timeout configuration"
```

Commit message format:
```
<type>: <subject>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Maintenance tasks

Examples:
```
feat: add export to CSV format

Add CSV export functionality to the export panel.
Supports all existing export data structures.

Closes #123

---

fix: resolve bias detection false positives

The bias detector was flagging neutral terms as biased.
Adjusted keyword matching to use context-aware analysis.

Fixes #456
```

### 5. Sync with Upstream

Before submitting, sync with the latest changes:

```bash
git fetch upstream
git rebase upstream/main
```

Resolve any conflicts if they occur.

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## Pull Request Process

### Before Creating a PR

- ✅ Code follows project style guidelines
- ✅ All tests pass
- ✅ Linters pass without errors
- ✅ Documentation is updated
- ✅ Commit messages are clear
- ✅ Branch is up to date with main

### Creating the PR

1. Go to your fork on GitHub
2. Click **"New Pull Request"**
3. Select your branch
4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (describe)

## Changes Made
- List of specific changes
- What was added/removed/modified

## Testing
How to test these changes:
1. Step one
2. Step two
3. Expected result

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Backward compatible

## Related Issues
Closes #123
Related to #456
```

### PR Review Process

1. **Automated checks** run (linting, tests)
2. **Code review** by maintainers
3. **Feedback** and requested changes
4. **Approval** from maintainer
5. **Merge** into main branch

### Responding to Feedback

- Be open to constructive feedback
- Make requested changes promptly
- Push updates to your PR branch
- Respond to comments politely

---

## Coding Standards

### JavaScript/React

- Use **ES6+** syntax
- Use **functional components** with hooks
- Use **async/await** for promises
- Use **descriptive variable names**
- Add **JSDoc comments** for functions

Example:
```javascript
/**
 * Analyzes text for political bias
 * @param {string} text - Text to analyze
 * @param {object} options - Analysis options
 * @returns {Promise<object>} Bias analysis result
 */
async function analyzeBias(text, options = {}) {
  // Implementation
}
```

### File Organization

```
component/
├── ComponentName.jsx      # Component file
├── ComponentName.test.js  # Tests (if needed)
└── README.md              # Documentation (if complex)
```

### Import Order

```javascript
// 1. External libraries
import React from 'react';
import { useState } from 'react';

// 2. Internal utilities
import { analyzeText } from '../utils/analysis';

// 3. Components
import AgentBubble from './AgentBubble';

// 4. Styles
import './styles.css';
```

### Component Structure

```javascript
/**
 * ComponentName - Brief description
 * @param {object} props - Component props
 */
export default function ComponentName({ prop1, prop2 }) {
  // 1. Hooks
  const [state, setState] = useState(null);

  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 3. Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // 4. Render helpers
  const renderItem = (item) => {
    // Render logic
  };

  // 5. Return JSX
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Backend Code

- Use **Express** for routing
- Use **async/await** for database operations
- Add **error handling**
- Log important events
- Validate inputs

Example:
```javascript
/**
 * POST /api/query
 * Submits query to multiple AI models
 */
router.post('/query', async (req, res) => {
  try {
    const { question, agents } = req.body;
    
    // Validate input
    if (!question || !agents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process query
    const results = await queryDispatcher(question, agents);
    
    res.json(results);
  } catch (error) {
    console.error('[Query API] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Testing

### Writing Tests

We use **Jest** for testing. Write tests for:
- Utility functions
- API endpoints
- Complex components
- Critical business logic

Example test:
```javascript
import { analyzeBias } from './analyzeBias';

describe('analyzeBias', () => {
  test('detects political bias in text', async () => {
    const text = 'The government should...';
    const result = await analyzeBias(text);
    
    expect(result.biasScore).toBeGreaterThan(0);
    expect(result.types).toContain('political');
  });
  
  test('handles neutral text', async () => {
    const text = 'The sky is blue.';
    const result = await analyzeBias(text);
    
    expect(result.biasScore).toBeLessThan(2);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- analyzeBias.test.js

# Run with coverage
npm test -- --coverage
```

---

## Documentation

### Code Documentation

- Add **JSDoc comments** for all exported functions
- Add **inline comments** for complex logic
- Update **README** files when adding features
- Update **API documentation** when adding endpoints

### Writing Documentation

- Use **clear language**
- Include **examples**
- Add **screenshots** for UI features
- Keep documentation **up to date**

### Documentation Files

- `README.md` - Main project readme
- `docs/` - Detailed documentation
- `docs/api/` - API reference
- `docs/guides/` - User guides
- Component `README.md` - Complex components

---

## Areas We Need Help

### 🔧 Frontend Development
- UI/UX improvements
- Component optimization
- Accessibility enhancements
- Mobile responsiveness

### 🧠 ML/NLP
- New analysis methods
- Model training improvements
- Performance optimization
- Accuracy enhancements

### 📊 Data Visualization
- Better charts and graphs
- Interactive visualizations
- Export improvements
- Dashboard enhancements

### 🔒 Security
- Authentication improvements
- Authorization system
- Input validation
- Security audits

### 📝 Documentation
- User guides
- Tutorial videos
- API examples
- Translation to other languages

### 🧪 Testing
- Unit tests
- Integration tests
- E2E tests
- Performance tests

### 🌍 Internationalization
- Swedish → English
- English → Other languages
- RTL support
- Locale handling

---

## Community

### Communication Channels

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - Questions, ideas, general discussion
- **Pull Requests** - Code contributions

### Getting Help

- Check [Documentation](../README.md)
- Search [existing issues](https://github.com/robinandreeklund-collab/CivicAI/issues)
- Ask in [Discussions](https://github.com/robinandreeklund-collab/CivicAI/discussions)
- Create a [new issue](https://github.com/robinandreeklund-collab/CivicAI/issues/new)

### Recognition

Contributors are recognized in:
- Project README
- Release notes
- Contributor list

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have any questions about contributing, feel free to:
- Open an issue
- Start a discussion
- Contact maintainers

**Thank you for contributing to CivicAI! Together we're building transparent AI for everyone.** 🌟
