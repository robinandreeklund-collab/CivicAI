#!/usr/bin/env python3
"""
Själv-generering av träningsexempel med dynamisk storlek
Baserat på fidelity-score från tidigare körningar
"""

import random
import json
from datetime import datetime
from pathlib import Path


# Svenska ämnen för civic engagement
CIVIC_TOPICS_SV = [
    "demokrati", "rösträtt", "samhällsservice", "utbildning", "hälsovård",
    "miljö", "klimat", "jämställdhet", "integration", "arbetsmarknad",
    "social trygghet", "välfärd", "kollektivtrafik", "infrastruktur",
    "energi", "digitalisering", "dataskydd", "transparens", "migration",
    "bostadspolitik", "skattesystem", "rättssystem", "mediefrih et"
]


def calculate_batch_size(max_examples, min_examples, fidelity_score=None):
    """
    Beräkna dynamisk batch-storlek baserat på fidelity
    
    Logik:
    - Hög fidelity (>99%) → färre exempel behövs (50–200)
    - Medel fidelity (98–99%) → normal mängd (200–600)
    - Låg fidelity (<98%) → maximal mängd (600–1500)
    """
    
    if fidelity_score is None:
        # Ingen tidigare körning → använd medel
        return int((max_examples + min_examples) / 2)
    
    if fidelity_score >= 0.99:
        # Mycket hög kvalitet → minimal batch
        batch_size = min_examples + int((max_examples - min_examples) * 0.2)
    elif fidelity_score >= 0.985:
        # God kvalitet → medel batch
        batch_size = min_examples + int((max_examples - min_examples) * 0.5)
    elif fidelity_score >= 0.98:
        # Acceptabel kvalitet → stor batch
        batch_size = min_examples + int((max_examples - min_examples) * 0.8)
    else:
        # Under threshold → maximal batch
        batch_size = max_examples
    
    # Säkerställ att vi håller oss inom gränserna
    batch_size = max(min_examples, min(batch_size, max_examples))
    
    return batch_size


def generate_civic_question(topic):
    """Generera en civic-fråga på svenska"""
    
    question_templates = [
        f"Vad är {topic} och varför är det viktigt för det svenska samhället?",
        f"Hur fungerar {topic} i Sverige jämfört med andra länder?",
        f"Vilka utmaningar finns med {topic} i Sverige idag?",
        f"Hur kan {topic} förbättras för att gynna alla svenskar?",
        f"Vad är medborgarnas roll när det gäller {topic}?",
        f"Hur påverkar {topic} vardagslivet för svenska medborgare?",
        f"Vilka är de viktigaste aspekterna av {topic} i ett demokratiskt samhälle?",
        f"Hur ser framtiden ut för {topic} i Sverige?",
        f"Vilka politiska partier har olika syn på {topic}?",
        f"Hur har {topic} utvecklats i Sverige de senaste 20 åren?"
    ]
    
    return random.choice(question_templates)


def generate_civic_answer(topic, question):
    """Generera ett balanserat svar på svenska"""
    
    answer_templates = [
        f"{topic.capitalize()} är en grundläggande del av det svenska samhället. "
        f"Det handlar om att säkerställa att alla medborgare har tillgång till "
        f"viktiga samhällstjänster och kan delta aktivt i demokratiska processer. "
        f"Sverige har en lång tradition av att värdera {topic} högt, vilket återspeglas "
        f"i våra lagar och institutioner.",
        
        f"I Sverige är {topic} organiserat enligt principer om jämlikhet och delaktighet. "
        f"Systemet bygger på att alla ska ha lika möjligheter och rättigheter oavsett "
        f"bakgrund. Det finns dock utmaningar, särskilt när det gäller att inkludera "
        f"alla grupper i samhället på lika villkor.",
        
        f"Utvecklingen av {topic} i Sverige har präglats av samarbete mellan olika "
        f"aktörer och en stark tilltro till gemensamma lösningar. Välfärdsstaten har "
        f"spelat en central roll i att säkerställa att {topic} fungerar för alla. "
        f"Framåt behövs fortsatta investeringar och anpassningar till samhällets förändringar.",
        
        f"{topic.capitalize()} spelar en viktig roll för att upprätthålla det svenska "
        f"välfärdssamhället och demokratiska värderingar. Det kräver engagemang från "
        f"både medborgare och politiker för att fungera effektivt. Sverige har lyckats "
        f"väl inom detta område jämfört med många andra länder, men det finns alltid "
        f"utrymme för förbättringar."
    ]
    
    return random.choice(answer_templates)


async def generate_training_batch(max_examples=600, min_examples=50, language='sv'):
    """
    Generera en batch med träningsexempel
    
    Args:
        max_examples: Max antal exempel
        min_examples: Min antal exempel
        language: Språk (endast 'sv' stöds för närvarande)
    
    Returns:
        Dict med exempel och metadata
    """
    
    print(f"   Genererar träningsexempel (dynamisk storlek)...")
    
    # Försök läsa tidigare fidelity från senaste körningen
    try:
        state_dir = Path(__file__).parent.parent / 'models' / 'oneseek-certified' / 'autonomy-state'
        if state_dir.exists():
            # Hitta senaste state-filen
            state_files = sorted(state_dir.glob('cycle-*.json'), reverse=True)
            if state_files:
                with open(state_files[0], 'r', encoding='utf-8') as f:
                    prev_state = json.load(f)
                    prev_fidelity = prev_state.get('state', {}).get('results', {}).get(
                        'verification', {}).get('fidelity_score')
            else:
                prev_fidelity = None
        else:
            prev_fidelity = None
    except Exception as e:
        print(f"   Kunde inte läsa tidigare fidelity: {e}")
        prev_fidelity = None
    
    # Beräkna batch-storlek
    batch_size = calculate_batch_size(max_examples, min_examples, prev_fidelity)
    
    if prev_fidelity:
        print(f"   Tidigare fidelity: {prev_fidelity*100:.1f}%")
    print(f"   Batch-storlek: {batch_size} exempel")
    
    # Generera exempel
    examples = []
    fidelity_scores = []
    
    for i in range(batch_size):
        topic = random.choice(CIVIC_TOPICS_SV)
        question = generate_civic_question(topic)
        answer = generate_civic_answer(topic, question)
        
        example = {
            "instruction": question,
            "output": answer,
            "language": language,
            "topic": topic,
            "generated": datetime.now().isoformat(),
            "source": "autonomy_engine_v3.3"
        }
        
        examples.append(example)
        
        # Simulerad fidelity för varje exempel (skulle vara verklig kvalitetsmätning)
        fidelity = random.uniform(0.75, 0.95)
        fidelity_scores.append(fidelity)
    
    avg_fidelity = sum(fidelity_scores) / len(fidelity_scores) if fidelity_scores else 0.0
    
    print(f"   Genererade {len(examples)} exempel")
    print(f"   Genomsnittlig kvalitet: {avg_fidelity*100:.1f}%")
    
    return {
        "examples": examples,
        "fidelity_scores": fidelity_scores,
        "count": len(examples),
        "avg_fidelity": avg_fidelity,
        "batch_size": batch_size,
        "prev_fidelity": prev_fidelity
    }
