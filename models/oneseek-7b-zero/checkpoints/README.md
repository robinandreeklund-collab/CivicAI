# Checkpoints Directory

This directory contains training checkpoints for OneSeek-7B-Zero.

## Structure

### Daily Checkpoints (`daily/`)
Automatic checkpoints created daily during training sessions.

**Naming convention:**
- Format: `checkpoint-YYYY-MM-DD.pth`
- Example: `checkpoint-2025-11-20.pth`, `checkpoint-2025-11-21.pth`

**Retention:** Last 7 days

### Weekly Checkpoints (`weekly/`)
Weekly checkpoints for long-term backup and rollback.

**Naming convention:**
- Format: `checkpoint-week-WW.pth` (WW = ISO week number)
- Example: `checkpoint-week-47.pth`, `checkpoint-week-48.pth`

**Retention:** Last 12 weeks (3 months)

## Purpose

Checkpoints serve as recovery points in case of:
- Training interruptions
- Model degradation
- Need to rollback to a previous state

## Checkpoint Contents

Each checkpoint includes:
- Model state dict
- Optimizer state
- Learning rate scheduler state
- Epoch number
- Training step
- Metadata (timestamp, metrics)

## Usage

To resume training from a checkpoint:
```python
checkpoint = torch.load('checkpoints/daily/checkpoint-2025-11-21.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
epoch = checkpoint['epoch']
```
