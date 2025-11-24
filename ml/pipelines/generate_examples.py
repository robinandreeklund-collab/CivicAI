#!/usr/bin/env python3
"""
Self-generation of training examples
Generates Swedish language training examples for autonomous improvement
"""

import json
import sys
import argparse
import random
from datetime import datetime


def generate_civic_examples(count=1000, language='sv'):
    """Generate civic AI training examples"""
    
    # Swedish civic topics and templates
    topics = [
        "demokrati", "rösträtt", "samhällsservice", "utbildning", "hälsovård",
        "miljö", "klimat", "jämställdhet", "integration", "arbetsmarknad",
        "social trygghet", "välfärd", "kollektivtrafik", "infrastruktur",
        "energi", "digitalisering", "dataskydd", "transparens"
    ]
    
    question_templates_sv = [
        "Vad är {topic} och varför är det viktigt för samhället?",
        "Hur fungerar {topic} i Sverige?",
        "Vilka utmaningar finns med {topic}?",
        "Hur kan {topic} förbättras?",
        "Vad är medborgarnas roll i {topic}?",
        "Hur påverkar {topic} vardagslivet?",
        "Vilka är de viktigaste aspekterna av {topic}?",
        "Hur ser framtiden ut för {topic}?",
    ]
    
    answer_templates_sv = [
        "{topic} är en grundläggande del av det svenska samhället. Det handlar om att säkerställa att alla medborgare har tillgång till viktiga samhällstjänster och kan delta aktivt i demokratiska processer.",
        "I Sverige är {topic} organiserat enligt principer om jämlikhet och delaktighet. Systemet bygger på att alla ska ha lika möjligheter och rättigheter.",
        "Utvecklingen av {topic} i Sverige har präglats av samarbete mellan olika aktörer och en stark tilltro till gemensamma lösningar.",
        "{topic} spelar en viktig roll för att upprätthålla det svenska välfärdssamhället och demokratiska värderingar.",
    ]
    
    examples = []
    fidelity_scores = []
    
    for i in range(count):
        topic = random.choice(topics)
        question_template = random.choice(question_templates_sv)
        answer_template = random.choice(answer_templates_sv)
        
        question = question_template.format(topic=topic)
        answer = answer_template.format(topic=topic)
        
        example = {
            "instruction": question,
            "output": answer,
            "language": language,
            "topic": topic,
            "generated": datetime.now().isoformat(),
        }
        
        examples.append(example)
        
        # Simulate fidelity score (would use actual quality assessment)
        fidelity = random.uniform(0.75, 0.95)
        fidelity_scores.append(fidelity)
    
    return {
        "examples": examples,
        "fidelityScores": fidelity_scores,
        "count": len(examples),
        "avgFidelity": sum(fidelity_scores) / len(fidelity_scores),
    }


def main():
    parser = argparse.ArgumentParser(description='Generate training examples')
    parser.add_argument('--count', type=int, default=1000, help='Number of examples to generate')
    parser.add_argument('--language', type=str, default='sv', help='Language (sv/en)')
    
    args = parser.parse_args()
    
    result = generate_civic_examples(count=args.count, language=args.language)
    
    # Output as JSON
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
