#!/usr/bin/env python3
"""
Automatisk själv-verifiering med 150 frågor
"""

import sys
from pathlib import Path

# Använd befintlig verify_model.py
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml' / 'pipelines'))

from verify_model import verify_model as verify_model_base


async def run_self_verification(model_path, num_questions=150):
    """
    Kör själv-verifiering
    
    Använder befintlig ml/pipelines/verify_model.py
    """
    
    print(f"   Kör själv-verifiering med {num_questions} frågor...")
    
    result = verify_model_base(model_path, num_questions)
    
    fidelity = result.get('fidelityScore', 0.0)
    print(f"   Fidelity Score: {fidelity*100:.1f}%")
    
    return result
