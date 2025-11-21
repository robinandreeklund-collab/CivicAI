# Backups Directory

This directory contains backups of OneSeek-7B-Zero model weights.

## Structure

### Firebase Storage (`firebase-storage/`)
Cloud backups synced to Firebase Storage.

**Purpose:** 
- Disaster recovery
- Remote access to model versions
- Team collaboration

**Sync Strategy:**
- All major versions: Permanent storage
- Last 100 micro versions: Rolling retention
- Automatic sync after each training session

**Storage Path in Firebase:**
```
gs://[project-id].appspot.com/models/oneseek-7b-zero/
├── weights/
│   ├── oneseek-7b-zero-v1.0.pth
│   ├── oneseek-7b-zero-v1.0.json
│   └── ...
└── metadata/
```

### Local Backup (`local-backup/`)
Local disk backups for quick recovery.

**Purpose:**
- Fast local restore without network download
- Offline availability
- Backup before cloud sync

**Backup Schedule:**
- Major versions: Immediately after creation
- Micro versions: Every 10 versions
- Checkpoints: Weekly

## Backup Management

### Creating Backups

```bash
# Manual backup of specific version
python scripts/backup_model_weights.py --version 1.0

# Backup all major versions
python scripts/backup_model_weights.py --major-only

# Backup to Firebase Storage
python scripts/backup_model_weights.py --version 1.0 --destination firebase
```

### Restoring from Backup

```bash
# Restore from local backup
python scripts/restore_model_weights.py --version 1.0 --source local

# Restore from Firebase Storage
python scripts/restore_model_weights.py --version 1.0 --source firebase
```

## Storage Requirements

### Local Backup
- Keep: Last 5 major versions + last 50 micro versions
- Estimated: ~200-300 GB

### Firebase Storage
- All major versions: ~14 GB per version
- Last 100 micro versions: ~1.4 TB total
- Compression: Consider using cloud storage compression

## Retention Policy

| Type | Local | Firebase |
|------|-------|----------|
| Major versions | Last 5 | All (permanent) |
| Micro versions | Last 50 | Last 100 |
| Checkpoints | Last week | Last month |

## Notes

1. **Checksums:** All backups include SHA-256 checksums for integrity verification
2. **Metadata:** Each backup includes corresponding .json metadata file
3. **Versioning:** Firebase Storage uses versioning to prevent accidental overwrites
4. **Cost:** Monitor Firebase Storage usage to manage costs
