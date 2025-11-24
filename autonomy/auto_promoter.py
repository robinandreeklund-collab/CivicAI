#!/usr/bin/env python3
"""
Auto-promotion av modell om fidelity når threshold
"""

import os
from pathlib import Path


async def promote_if_ready(model_path, fidelity_score):
    """
    Promovera modell till -CURRENT om fidelity är tillräckligt hög
    """
    
    print(f"   Kontrollerar auto-promotion...")
    print(f"   Fidelity: {fidelity_score*100:.1f}%")
    
    project_root = Path(__file__).parent.parent
    certified_dir = project_root / 'models' / 'oneseek-certified'
    current_link = certified_dir / 'OneSeek-7B-Zero-CURRENT'
    
    # Skapa symlink till nya modellen
    model_dir = Path(model_path)
    
    if current_link.exists() or current_link.is_symlink():
        current_link.unlink()
    
    current_link.symlink_to(model_dir, target_is_directory=True)
    
    print(f"   ✅ Modell promoverad till -CURRENT")
    
    return {
        'promoted': True,
        'model_path': str(model_path),
        'fidelity_score': fidelity_score,
        'symlink': str(current_link)
    }
