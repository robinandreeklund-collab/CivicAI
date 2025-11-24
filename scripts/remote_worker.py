#!/usr/bin/env python3
"""
Remote GPU Training Worker (Minimal - 60 lines)

This worker runs on a desktop with GPUs and picks up training jobs
from the laptop, trains them, and saves results back via shared folder.
"""

import os
import sys
import json
import time
import glob
import socket
from pathlib import Path
import requests

# Configuration
SHARED_MODELS_PATH = os.environ.get('SHARED_MODELS_PATH', 'Z:\\models')
LAPTOP_API_URL = os.environ.get('LAPTOP_API_URL', 'http://192.168.1.100:3001')
JOBS_DIR = Path(SHARED_MODELS_PATH) / '.remote_jobs'
POLL_INTERVAL = 5  # seconds

def get_gpu_info():
    """Get GPU information if available"""
    try:
        import torch
        if torch.cuda.is_available():
            return {
                'count': torch.cuda.device_count(),
                'name': torch.cuda.get_device_name(0) if torch.cuda.device_count() > 0 else 'Unknown',
                'memory': f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB"
            }
    except ImportError:
        pass
    return {'count': 0, 'name': 'CPU-only', 'memory': '0 GB'}

def send_heartbeat():
    """Send heartbeat to laptop server"""
    try:
        requests.post(f'{LAPTOP_API_URL}/api/remote/worker/ping', 
                     json={'hostname': socket.gethostname(), 'gpuInfo': get_gpu_info()},
                     timeout=5)
    except (requests.RequestException, OSError):
        pass

def update_job_status(job_id, state, progress=0, message=''):
    """Update job status on laptop server"""
    try:
        requests.post(f'{LAPTOP_API_URL}/api/remote/job/{job_id}/update',
                     json={'state': state, 'progress': progress, 'message': message},
                     timeout=5)
    except (requests.RequestException, OSError):
        pass

def process_job(job_file):
    """Process a training job"""
    with open(job_file) as f:
        job = json.load(f)
    
    job_id = job['id']
    print(f"[REMOTE] Processing job {job_id}")
    update_job_status(job_id, 'running', 0, 'Starting training on desktop GPU')
    
    # Build training command
    dataset_path = Path(SHARED_MODELS_PATH).parent / job['dataset']
    cmd_parts = [
        sys.executable,
        str(Path(SHARED_MODELS_PATH).parent / 'scripts' / 'train_dna_v2.py'),
        '--dataset', str(dataset_path),
        '--epochs', str(job['params'].get('epochs', 3)),
        '--learning-rate', str(job['params'].get('learningRate', 0.0001)),
        '--batch-size', str(job['params'].get('batchSize', 8)),
    ]
    
    print(f"[REMOTE] Running: {' '.join(cmd_parts)}")
    import subprocess
    result = subprocess.run(cmd_parts, capture_output=True, text=True)
    
    if result.returncode == 0:
        update_job_status(job_id, 'completed', 100, 'Training completed successfully')
        print(f"[REMOTE] Job {job_id} completed successfully")
    else:
        update_job_status(job_id, 'failed', 0, f'Training failed: {result.stderr[:200]}')
        print(f"[REMOTE] Job {job_id} failed: {result.stderr}")
    
    # Remove job file
    os.remove(job_file)

def main():
    print(f"[REMOTE WORKER] Starting on {socket.gethostname()}")
    print(f"[REMOTE WORKER] GPU Info: {get_gpu_info()}")
    print(f"[REMOTE WORKER] Shared models: {SHARED_MODELS_PATH}")
    print(f"[REMOTE WORKER] Laptop API: {LAPTOP_API_URL}")
    
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    
    while True:
        send_heartbeat()
        
        # Check for new jobs
        job_files = glob.glob(str(JOBS_DIR / '*.json'))
        if job_files:
            process_job(job_files[0])
        
        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    main()
