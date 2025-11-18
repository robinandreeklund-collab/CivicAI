# Change Detection Module - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Production Deployment](#production-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: >= 16.0.0
- **Python**: >= 3.9
- **RAM**: Minimum 4GB (8GB+ recommended for ML models)
- **Disk**: 2GB free space for ML models

### Dependencies
- All backend dependencies from `backend/package.json`
- Python packages from `ml/requirements.txt`

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI
```

### 2. Install Node.js Dependencies
```bash
# Install root dependencies
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

### 3. Install Python Dependencies

#### Basic Installation (MVP)
```bash
# No additional Python packages needed
# Uses built-in keyword-based detection
```

#### Production Installation (Enhanced ML)
```bash
cd ml
pip install -r requirements.txt

# This installs:
# - sentence-transformers (embeddings)
# - transformers + torch (BERT models)
# - shap + lime (explainability)
# - bertopic (topic modeling)
# - And other ML dependencies
```

**Note:** ML package installation may take 10-15 minutes and requires ~2GB disk space.

### 4. Verify Installation

```bash
# Test basic change detection
python3 ml/pipelines/change_detection.py --test

# Test enhanced change detection (if ML packages installed)
python3 ml/pipelines/change_detection_enhanced.py --ml-status

# Should show:
# ✓ Sentence Transformers loaded
# ✓ Transformers loaded
# ✓ SHAP loaded
# ✓ LIME loaded
```

---

## Configuration

### 1. Environment Variables

Create `.env` file in `backend/` directory:

```env
# API Keys (existing)
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
XAI_API_KEY=your_key_here
QWEN_API_KEY=your_key_here

# Server Configuration
PORT=3001
NODE_ENV=production

# Change Detection Settings (optional)
CHANGE_DETECTION_ENABLED=true
CHANGE_DETECTION_THRESHOLD=0.3
CHANGE_DETECTION_TIMEOUT=10000
```

### 2. Directory Structure

Ensure these directories exist (or will be created automatically):

```
ml/
├── ledger/              # Transparency ledger storage
├── change_history/      # Response history storage
├── ledger_demo/         # Demo/test ledger
└── change_history_demo/ # Demo/test history
```

These directories are gitignored by default.

### 3. Permissions

```bash
# Make Python scripts executable
chmod +x ml/pipelines/change_detection.py
chmod +x ml/pipelines/change_detection_enhanced.py
chmod +x ml/examples/change_detection_demo.py
```

---

## Testing

### 1. Backend API Tests

```bash
cd backend

# Start server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3001/health
# Should return: {"status":"ok",...}

# Test change detection endpoint
curl -X POST http://localhost:3001/api/change-detection/analyze \
  -H "Content-Type: application/json" \
  -d '{"question":"Test?","model":"test","response":"Test response","version":"1.0"}'
```

### 2. Python Module Tests

```bash
# Basic functionality
python3 ml/pipelines/change_detection.py --test

# JSON mode (used by API)
echo '{"question":"Test?","model":"test","response":"Test","version":"1.0"}' | \
  python3 ml/pipelines/change_detection.py --detect-json

# History retrieval
python3 ml/pipelines/change_detection.py --history-json --question "Test?"
```

### 3. End-to-End Test

```bash
# 1. Start backend
cd backend && npm run dev

# 2. In another terminal, start frontend
cd frontend && npm run dev

# 3. Open browser to http://localhost:5173
# 4. Ask a question twice (same question)
# 5. Check if change detection panel appears on second query
```

### 4. ML Enhancement Tests

```bash
# Check ML library status
python3 ml/pipelines/change_detection_enhanced.py --ml-status

# Run enhanced test
python3 ml/pipelines/change_detection_enhanced.py --test

# Compare basic vs enhanced
python3 ml/examples/change_detection_demo.py
```

---

## Production Deployment

### Option 1: Single Server Deployment

#### 1. Build Frontend
```bash
cd frontend
npm run build
# Creates dist/ directory
```

#### 2. Serve Frontend (Multiple Options)

**Option A: Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/CivicAI/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option B: Express Static**
```javascript
// In backend/index.js, add:
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

#### 3. Start Backend with PM2
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start index.js --name civic-ai-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

#### 4. Monitor
```bash
pm2 status
pm2 logs civic-ai-backend
pm2 monit
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY ml/requirements.txt ./ml/

# Install dependencies
RUN cd backend && npm install
RUN cd frontend && npm install && npm run build
RUN cd ml && pip3 install -r requirements.txt

# Copy source
COPY . .

# Expose port
EXPOSE 3001

# Start
CMD ["node", "backend/index.js"]
```

```bash
# Build image
docker build -t civic-ai .

# Run container
docker run -d -p 3001:3001 \
  -e OPENAI_API_KEY=your_key \
  -e GEMINI_API_KEY=your_key \
  --name civic-ai \
  civic-ai
```

### Option 3: Cloud Deployment

#### Vercel (Frontend)
```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Heroku (Backend)
```bash
# Create Procfile
echo "web: node backend/index.js" > Procfile

# Deploy
heroku create civic-ai-backend
git push heroku main
```

#### Railway / Render
- Connect GitHub repository
- Set build command: `npm install`
- Set start command: `node backend/index.js`
- Add environment variables

---

## Monitoring

### 1. Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Change detection specific
curl http://localhost:3001/api/change-detection/history?question=test
```

### 2. Logs

**Node.js Logs:**
```javascript
// Backend logs to console:
// 🔍 Analyzing change detection for gpt-3.5...
// ✅ Change detection complete: severity=0.78
// ℹ️  No significant changes detected
```

**Python Logs:**
```bash
# Check Python execution
tail -f /var/log/civic-ai/python.log

# Or in code, logs go to stderr/stdout
```

### 3. Metrics to Monitor

- **API Response Time**: /api/query should be < 5 seconds
- **Change Detection Success Rate**: Should be > 95%
- **Python Process Failures**: Should be < 1%
- **Ledger Block Creation**: Track blocks per hour
- **Memory Usage**: Monitor for ML model memory leaks

### 4. Monitoring Tools

```bash
# PM2 monitoring
pm2 monit

# System monitoring
htop
df -h  # Disk space
free -m  # Memory
```

### 5. Application Monitoring (Optional)

- **Sentry**: Error tracking
- **New Relic**: Performance monitoring
- **DataDog**: Full-stack monitoring
- **Prometheus + Grafana**: Custom metrics

---

## Troubleshooting

### Python Process Not Starting

**Symptom:** API returns "Request timeout" or null for change_detection

**Solutions:**
```bash
# 1. Verify Python is accessible
which python3
python3 --version

# 2. Test Python script directly
python3 ml/pipelines/change_detection.py --test

# 3. Check permissions
chmod +x ml/pipelines/change_detection.py

# 4. Check Python path in code
# In backend/api/change_detection.js, verify:
const python = spawn('python3', [...])  # or 'python'
```

### ML Models Not Loading

**Symptom:** Logs show "⚠ Sentence Transformers not available"

**Solutions:**
```bash
# 1. Install ML packages
cd ml
pip install -r requirements.txt

# 2. Verify installation
python3 -c "from sentence_transformers import SentenceTransformer; print('OK')"

# 3. Check Python version
python3 --version  # Must be >= 3.9

# 4. Try virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Change Detection Not Triggering

**Symptom:** change_detection field always null in API response

**Solutions:**
```bash
# 1. Check if responses are being saved
ls ml/change_history/

# 2. Try asking same question twice
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Test question?"}'

# Wait a few seconds, then repeat same request

# 3. Lower threshold temporarily
# In query_dispatcher.js, change:
const significantChange = changeDetections.find(c => c && c.change_metrics?.severity_index >= 0.1);

# 4. Check logs for errors
tail -f backend/logs/change-detection.log
```

### High Memory Usage

**Symptom:** Server uses > 4GB RAM

**Solutions:**
```bash
# 1. Disable ML enhancements temporarily
# Use basic change_detection.py instead of enhanced

# 2. Reduce concurrent requests
# Add rate limiting in backend

# 3. Clear old history files
find ml/change_history/ -mtime +30 -delete

# 4. Use database instead of JSON files
# Migrate to PostgreSQL for production
```

### Ledger Corruption

**Symptom:** "Chain verification failed" errors

**Solutions:**
```bash
# 1. Verify ledger
python3 ml/pipelines/transparency_ledger.py --verify

# 2. Export before fixing
python3 ml/pipelines/transparency_ledger.py --export backup.json

# 3. If corrupted, restore from backup
# Or delete and recreate (loses history)
rm -rf ml/ledger
# Next run will create fresh ledger
```

### Performance Issues

**Symptom:** API responses take > 10 seconds

**Solutions:**
```bash
# 1. Check if ML models are loaded
# First request loads models (slow), subsequent are faster

# 2. Implement caching
# Use Redis for frequently accessed data

# 3. Async processing
# Move change detection to background job with Celery

# 4. Optimize Python script
# Profile with cProfile to find bottlenecks

# 5. Scale horizontally
# Run multiple backend instances behind load balancer
```

---

## Scaling to Production

### Database Migration

Replace JSON files with PostgreSQL:

```sql
-- Schema for change history
CREATE TABLE change_history (
  id SERIAL PRIMARY KEY,
  question_hash VARCHAR(64) NOT NULL,
  model VARCHAR(50) NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  INDEX idx_question_model (question_hash, model)
);

-- Schema for ledger blocks
CREATE TABLE ledger_blocks (
  block_id INTEGER PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  previous_hash VARCHAR(64),
  current_hash VARCHAR(64) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  signatures JSONB NOT NULL
);
```

### Redis Caching

```javascript
import Redis from 'redis';

const redis = Redis.createClient();

// Cache change detection results
async function getCachedChange(questionHash, model) {
  const key = `change:${questionHash}:${model}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}
```

### Celery Background Jobs

```python
# tasks.py
from celery import Celery

app = Celery('change_detection', broker='redis://localhost:6379')

@app.task
def analyze_change_async(question, model, response, version):
    detector = ChangeDetectionModule(...)
    return detector.detect_change(question, model, response, version)
```

---

## Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (if using DB)
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Error messages don't expose internals
- [ ] Logs don't contain sensitive data
- [ ] Regular security updates for dependencies

---

## Backup Strategy

```bash
# 1. Backup ledger
cp -r ml/ledger ml/ledger_backup_$(date +%Y%m%d)

# 2. Backup change history
tar -czf change_history_$(date +%Y%m%d).tar.gz ml/change_history

# 3. Export ledger to JSON
python3 ml/pipelines/transparency_ledger.py --export ledger_backup_$(date +%Y%m%d).json

# 4. Automated daily backup
# Add to crontab:
0 2 * * * /path/to/backup.sh
```

---

## Support

- **Documentation**: See `/docs` directory
- **API Reference**: `docs/CHANGE_DETECTION_API.md`
- **Module Guide**: `docs/CHANGE_DETECTION.md`
- **Examples**: `ml/examples/`

---

**Last Updated:** 2025-11-18  
**Deployment Version:** 1.0  
**Production Ready:** ✅ Yes (with basic ML) / ⚠️ Partial (with enhanced ML - requires testing)
