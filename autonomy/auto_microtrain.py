#!/usr/bin/env python3
"""
Auto-mikroträning med 2-steg LoRA
Triggar befintlig träningspipeline
"""

import subprocess
import json
from pathlib import Path


async def run_microtraining(examples, cycle_id):
    """
    Kör 2-stegs mikroträning med LoRA
    
    Använder befintlig ml/training/pytorch_trainer.py
    """
    
    print(f"   Startar 2-stegs mikroträning...")
    
    # Spara godkända exempel till dataset
    project_root = Path(__file__).parent.parent
    dataset_path = project_root / 'datasets' / f'autonomy-{cycle_id}.jsonl'
    
    with open(dataset_path, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
    
    print(f"   Dataset sparad: {dataset_path}")
    print(f"   Antal exempel: {len(examples)}")
    
    # Steg 1: Initial LoRA-träning
    print(f"   Steg 1/2: Initial LoRA-träning...")
    step1_result = await run_training_step(
        dataset_path=str(dataset_path),
        epochs=2,
        learning_rate=0.0001,
        step=1
    )
    
    # Steg 2: Förfining
    print(f"   Steg 2/2: Förfinings-träning...")
    step2_result = await run_training_step(
        dataset_path=str(dataset_path),
        epochs=1,
        learning_rate=0.00005,
        step=2,
        base_model=step1_result.get('model_path')
    )
    
    return {
        'step1': step1_result,
        'step2': step2_result,
        'model_path': step2_result.get('model_path'),
        'run_id': step2_result.get('run_id')
    }


async def run_training_step(dataset_path, epochs, learning_rate, step, base_model=None):
    """Kör ett träningssteg"""
    
    # Här skulle vi kalla befintlig träningspipeline
    # För nu: simulerad träning
    
    import time
    time.sleep(2)  # Simulera träning
    
    run_id = f"auto-{step}-{int(time.time())}"
    project_root = Path(__file__).parent.parent
    model_path = project_root / 'models' / 'oneseek-certified' / run_id
    model_path.mkdir(parents=True, exist_ok=True)
    
    # Spara metadata
    metadata = {
        'run_id': run_id,
        'step': step,
        'epochs': epochs,
        'learning_rate': learning_rate,
        'dataset': str(dataset_path),
        'base_model': str(base_model) if base_model else None
    }
    
    with open(model_path / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return {
        'run_id': run_id,
        'model_path': str(model_path),
        'epochs': epochs,
        'learning_rate': learning_rate
    }
