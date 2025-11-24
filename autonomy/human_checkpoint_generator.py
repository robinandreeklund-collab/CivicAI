#!/usr/bin/env python3
"""
Human Golden Checkpoint Generator
Genererar 10 kontrollfrågor för mänsklig granskning med Ed25519-signatur
"""

import random
import json
from pathlib import Path
from datetime import datetime


# Kontrollfrågor för mänsklig bedömning
CHECKPOINT_QUESTIONS_SV = [
    "Vad är demokrati och varför är det viktigt?",
    "Hur fungerar det svenska valsystemet?",
    "Vad innebär yttrandefrihet i Sverige?",
    "Hur kan medborgare påverka politiska beslut?",
    "Vad är skillnaden mellan stat och kommun?",
    "Hur fungerar den svenska välfärden?",
    "Vad betyder jämställdhet i svensk lag?",
    "Hur skyddas personlig integritet i Sverige?",
    "Vad är klimatpolitik och varför är den viktig?",
    "Hur fungerar svensk arbetsmarknadspolitik?",
    "Vad innebär migrations- och integrationspolitik?",
    "Hur finansieras svenska skolor?",
    "Vad är skillnaden mellan landsting och region?",
    "Hur fungerar svensk sjukvård?",
    "Vad innebär allmän rösträtt?"
]


async def generate_checkpoint_questions(model_path, num_questions=10, cycle_id=None):
    """
    Generera Human Golden Checkpoint-frågor
    
    Returns:
        Dict med frågor som ska besvaras och granskas av admin
    """
    
    print(f"   Genererar {num_questions} checkpoint-frågor...")
    
    # Välj slumpmässiga frågor
    selected_questions = random.sample(CHECKPOINT_QUESTIONS_SV, min(num_questions, len(CHECKPOINT_QUESTIONS_SV)))
    
    checkpoint_data = {
        'cycle_id': cycle_id,
        'model_path': str(model_path),
        'timestamp': datetime.now().isoformat(),
        'questions': []
    }
    
    # För varje fråga, generera ett svar (här skulle modellen användas)
    for i, question in enumerate(selected_questions):
        checkpoint_data['questions'].append({
            'id': i + 1,
            'question': question,
            'model_answer': f"[Modellsvar skulle genereras här för: {question}]",
            'human_rating': None,  # Fylls i av admin
            'human_comment': None
        })
    
    # Spara checkpoint till fil för admin-granskning
    project_root = Path(__file__).parent.parent
    checkpoint_dir = project_root / 'models' / 'oneseek-certified' / 'checkpoints'
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    
    checkpoint_file = checkpoint_dir / f'checkpoint-{cycle_id}.json'
    with open(checkpoint_file, 'w', encoding='utf-8') as f:
        json.dump(checkpoint_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Checkpoint sparad: {checkpoint_file}")
    
    return {
        'generated': True,
        'num_questions': len(selected_questions),
        'checkpoint_file': str(checkpoint_file),
        'questions': checkpoint_data['questions'],
        'awaiting_signature': True
    }
