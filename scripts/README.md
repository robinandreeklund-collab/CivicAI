# 🛠️ CivicAI Scripts

Utility scripts for development, deployment, and maintenance of the CivicAI platform.

## Available Scripts

### Setup and Installation

#### `setup.sh`
Initial project setup script that:
- Checks prerequisites (Node.js, npm)
- Installs frontend and backend dependencies
- Creates environment files from templates
- Provides setup instructions

**Usage:**
```bash
./scripts/setup.sh
```

#### `firebase-bootstrap.sh`
Firebase project initialization script that:
- Authenticates with Firebase CLI
- Sets up Firestore collections
- Generates service account keys
- Updates environment configuration

**Prerequisites:**
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created

**Usage:**
```bash
./scripts/firebase-bootstrap.sh
```

### Build and Testing

#### `build.sh`
Builds the frontend application for production.

**Usage:**
```bash
./scripts/build.sh
```

**Output:** `frontend/dist/`

#### `lint.sh`
Runs linters on frontend and backend code.

**Usage:**
```bash
./scripts/lint.sh
```

### Data Management

#### `validate-schema.js`
Schema validation helper for Firestore collections.

**Usage in code:**
```javascript
const { validateSchema } = require('./scripts/validate-schema');

const interaction = {
  interactionId: 'uuid-here',
  timestamp: new Date(),
  question: { text: '...', hash: '...' },
  responses: [...]
};

if (!validateSchema('ai_interactions', interaction)) {
  throw new Error('Invalid schema');
}
```

**Supported collections:**
- `ai_interactions`
- `model_versions`
- `ledger_blocks`
- `change_events`

## Future Scripts

The following scripts are planned for implementation:

### `data-migration.js`
Handles schema migrations and data backfill operations.

**Planned features:**
- Schema version management
- Safe data migration with rollback
- Dry-run mode
- Migration history tracking

### `ledger-verify.sh`
Verifies blockchain integrity of the transparency ledger.

**Planned features:**
- Hash chain validation
- Block integrity checks
- Corruption detection
- Repair suggestions

### `test.sh`
Runs all tests (unit, integration, e2e).

**Planned features:**
- Frontend tests
- Backend tests
- Python ML service tests
- Coverage reporting

### `deploy.sh`
Deployment automation script.

**Planned features:**
- Environment selection
- Pre-deployment checks
- Database migrations
- Service deployment
- Health checks

## Creating New Scripts

When adding new scripts:

1. **Use descriptive names**: `action-target.sh` (e.g., `deploy-production.sh`)
2. **Add shebang**: `#!/bin/bash` or `#!/usr/bin/env node`
3. **Make executable**: `chmod +x scripts/your-script.sh`
4. **Add error handling**: Use `set -e` in bash scripts
5. **Add help text**: Include usage instructions
6. **Update this README**: Document the new script

### Script Template (Bash)

```bash
#!/bin/bash
# Script description

set -e

echo "=============================="
echo "  Script Name"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Script logic here

echo -e "${GREEN}✓ Complete!${NC}"
```

### Script Template (Node.js)

```javascript
#!/usr/bin/env node
/**
 * Script description
 */

const main = async () => {
  console.log('==============================');
  console.log('  Script Name');
  console.log('==============================\n');

  try {
    // Script logic here
    
    console.log('✓ Complete!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

main();
```

## Script Naming Conventions

- **Setup scripts**: `setup-*.sh`
- **Build scripts**: `build-*.sh`
- **Deploy scripts**: `deploy-*.sh`
- **Migration scripts**: `migrate-*.js`
- **Utility scripts**: descriptive names (e.g., `validate-schema.js`)

## Environment Variables

Scripts may require environment variables to be set:

- Backend: `backend/.env`
- Frontend: `frontend/.env`
- Firebase: See `.env.firebase.example` files

## Troubleshooting

### Permission Denied

If you get "Permission denied" when running a script:
```bash
chmod +x scripts/script-name.sh
```

### Script Not Found

Ensure you're in the project root directory:
```bash
cd /path/to/CivicAI
./scripts/script-name.sh
```

### Firebase CLI Not Found

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

## Related Documentation

- [Setup Guide](../docs/guides/SETUP.md) - Detailed setup instructions
- [Development Guide](../docs/guides/DEVELOPMENT.md) - Development workflow
- [Data Schemas](../docs/schemas/README.md) - Firestore collection schemas

---

**Note**: All scripts are designed to be run from the project root directory.
