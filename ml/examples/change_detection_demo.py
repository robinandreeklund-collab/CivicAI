#!/usr/bin/env python3
"""
Example/Demo script for Change Detection Module
Demonstrates the full workflow with realistic examples
"""

import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipelines.change_detection import ChangeDetectionModule

def print_separator():
    print("\n" + "="*80 + "\n")

def demo_basic_change_detection():
    """Demonstrate basic change detection functionality"""
    print("🔍 DEMO 1: Basic Change Detection")
    print_separator()
    
    # Initialize module
    ledger_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ledger_demo')
    history_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'change_history_demo')
    
    detector = ChangeDetectionModule(ledger_dir, history_dir)
    
    # Question and model
    question = "Vad tycker du om klimatpolitik?"
    model = "Grok"
    
    # First response - establishing baseline
    print("📝 Första svaret (baseline):")
    response1 = "Klimatpolitik är viktig för hållbar utveckling."
    print(f"   '{response1}'")
    
    result1 = detector.detect_change(
        question=question,
        model=model,
        current_response=response1,
        model_version="2025.10"
    )
    print(f"   Resultat: {result1}")
    
    print_separator()
    
    # Third response - major change
    print("📝 Andra svaret (stor förändring):")
    response3 = "Klimatpolitik är avgörande och bör prioriteras framför ekonomisk tillväxt."
    print(f"   '{response3}'")
    
    result3 = detector.detect_change(
        question=question,
        model=model,
        current_response=response3,
        model_version="2025.11"
    )
    
    if result3:
        print("   🔴 STOR FÖRÄNDRING UPPTÄCKT!")
        print(json.dumps({
            'severity_index': result3['change_metrics']['severity_index'],
            'text_similarity': result3['change_metrics']['text_similarity'],
            'sentiment_shift': result3['change_metrics']['sentiment_shift'],
            'ideology_shift': result3['change_metrics']['ideology_shift'],
            'ethical_tag': result3['change_metrics']['ethical_tag']
        }, indent=2, ensure_ascii=False))

def main():
    """Run demo"""
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║     Change Detection Module - Demo                    ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    
    demo_basic_change_detection()
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║            Demo Completed! ✅                          ║")
    print("╚════════════════════════════════════════════════════════╝\n")

if __name__ == '__main__':
    main()
