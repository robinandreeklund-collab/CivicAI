# Installation Guide for New Dependencies

## Backend Dependencies Update

This PR adds the `ws` (WebSocket) library to enable real-time training metrics.

### Quick Fix

If you're getting an error about missing `ws` package, run:

```bash
cd backend
npm install
```

This will install all dependencies including the new `ws` package.

### What Changed

- Added `ws@^8.14.0` to `backend/package.json`
- WebSocket server initialization in `backend/index.js`
- WebSocket handler in `backend/ws/training_ws.js`

### Verify Installation

After running `npm install`, you can verify the installation:

```bash
# Check if ws is installed
ls node_modules/ws

# Or check with npm
npm list ws
```

### Full Backend Setup

If you need to set up the backend from scratch:

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install

# Start backend in development mode
npm run dev
```

### Troubleshooting

**Error: `Cannot find package 'ws'`**
- Solution: Run `npm install` in the `backend` directory

**Error: `Module not found`**
- Solution: Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Error: `ENOENT` or permission issues**
- Solution on Windows: Run terminal as Administrator
- Solution on Linux/Mac: Use `sudo npm install` if needed

### Dependencies Added in This PR

| Package | Version | Purpose |
|---------|---------|---------|
| ws | ^8.14.0 | WebSocket server for real-time training metrics |

### No Python Dependencies Added

This PR uses existing Python packages. No new Python dependencies required.
