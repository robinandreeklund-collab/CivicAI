# Admin Dashboard - Quick Start Guide

## Overview

The OneSeek-7B-Zero Admin Dashboard provides a comprehensive web interface for managing AI model training and datasets. Located at `/admin`, it requires administrator privileges to access.

## Features at a Glance

### 📁 Dataset Management
- Drag-and-drop JSONL file uploads
- Automatic validation
- Browse and preview datasets
- Quality metrics display

### 🎯 Training Control
- Configure training parameters
- Start/stop training sessions
- Real-time progress monitoring
- Live training logs

### 🤖 Model Management
- List all model versions
- Compare models side-by-side
- Download weights and LoRA adapters
- Rollback to previous versions

### 📊 Monitoring
- CPU/GPU usage charts
- Training history
- Notification system
- Automated scheduling

## Quick Start

### 1. Access the Dashboard

Navigate to: `http://localhost:3000/admin`

**Requirements:**
- User must have `role: "admin"` or `isAdmin: true` in localStorage
- Both frontend and backend servers must be running

### 2. Grant Admin Access

To set up an admin user, open browser console and run:

```javascript
localStorage.setItem('oneseek_user', JSON.stringify({
  userId: 'admin123',
  role: 'admin',
  isAdmin: true,
  displayName: 'Admin User'
}));
// Reload the page
location.reload();
```

### 3. Upload a Dataset

1. Go to "Datasets" tab
2. Drag a `.jsonl` file to the upload zone (or click "Browse Files")
3. Wait for validation results
4. Dataset appears in the list below

**Example JSONL format:**
```jsonl
{"instruction": "Who are you?", "input": "", "output": "I am OpenSeek AI-agent..."}
{"instruction": "What is democracy?", "input": "", "output": "Democracy is a system..."}
```

### 4. Start Training

1. Go to "Training" tab
2. Select a dataset from the dropdown
3. Configure parameters:
   - Epochs: 1-100 (default: 3)
   - Batch Size: 1-64 (default: 8)
   - Learning Rate: 0.00001-0.01 (default: 0.0001)
4. Click "Start Training"
5. Monitor progress in real-time

### 5. Manage Models

1. Go to "Models" tab
2. View all model versions
3. Click "Details" to see full metadata
4. Use "Download" to get weights or LoRA adapters
5. Use "Rollback" to restore a previous version

### 6. Monitor System

1. Go to "Monitoring" tab
2. View real-time CPU/GPU charts
3. Check recent training sessions
4. Configure automated training schedule
5. Manage notifications

## API Endpoints

All admin endpoints are prefixed with `/api/admin`:

### Datasets
- `GET /api/admin/datasets` - List all datasets
- `POST /api/admin/datasets/upload` - Upload new dataset
- `GET /api/admin/datasets/:id/validate` - Validate dataset
- `DELETE /api/admin/datasets/:id` - Delete dataset

### Training
- `GET /api/admin/training/status` - Get training status
- `POST /api/admin/training/start` - Start training
- `POST /api/admin/training/stop` - Stop training

### Models
- `GET /api/admin/models` - List all model versions
- `GET /api/admin/models/:id/download?type=weights|lora` - Download
- `POST /api/admin/models/:id/rollback` - Rollback

### Monitoring
- `GET /api/admin/monitoring/resources` - CPU/GPU metrics
- `GET /api/admin/monitoring/training-history` - Training history
- `GET /api/admin/monitoring/schedule` - Get/set schedule
- `GET /api/admin/monitoring/notifications` - Get notifications

## File Structure

```
frontend/src/
├── pages/
│   └── AdminDashboardPage.jsx          # Main dashboard
└── components/admin/
    ├── DatasetManagement.jsx           # Dataset operations
    ├── TrainingControl.jsx             # Training interface
    ├── ModelManagement.jsx             # Model operations
    └── MonitoringDashboard.jsx         # Charts & monitoring

backend/
└── api/
    └── admin.js                        # Admin REST API
```

## Troubleshooting

### "Access Denied" Page
- Ensure user object in localStorage has `isAdmin: true` or `role: "admin"`
- Refresh the page after setting localStorage

### Backend Not Responding
- Check if backend is running on port 3001
- Install missing dependency: `npm install multer`
- Check `/tmp/backend.log` for errors

### Upload Fails
- Ensure file is in JSONL or JSON format
- Check file size is under 100MB
- Verify each line is valid JSON

### Charts Not Displaying
- Ensure Chart.js is installed: `npm install chart.js react-chartjs-2`
- Check browser console for errors

## Development

### Running Locally

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Access at: http://localhost:3000/admin
```

### Adding New Features

1. **Frontend Component:** Add to `frontend/src/components/admin/`
2. **Backend Endpoint:** Add to `backend/api/admin.js`
3. **Documentation:** Update `OQT-1.0-README.md`

## Security Notes

⚠️ **Current Implementation:**
- Uses localStorage for admin role checking
- Client-side authentication only

🔒 **For Production:**
- Implement server-side authentication middleware
- Use JWT tokens or session cookies
- Add role-based access control (RBAC)
- Implement audit logging
- Add CSRF protection

## Next Steps

After basic setup, consider:
1. Configuring automated training schedules
2. Setting up notifications
3. Testing model comparison features
4. Exploring training parameter tuning
5. Reviewing training history and metrics

## Support

For issues or questions:
- Check `OQT-1.0-README.md` for detailed documentation
- Review backend logs in `/tmp/backend.log`
- Check browser console for frontend errors

---

**Version:** Phase 3 Complete  
**Last Updated:** November 2025
