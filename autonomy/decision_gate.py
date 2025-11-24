#!/usr/bin/env python3
"""
Beslutsgate - Dubbel spärr för godkännande
Minst 2 av 3 externa + intern OK krävs
"""

async def apply_decision_gate(examples, external_reviews, internal_analysis, threshold=2):
    """
    Tillämpa beslutsspärr
    
    Krav:
    - Minst 2 av 3 externa reviewers godkänner
    - Intern analys godkänner (Stage-1 passed)
    """
    
    print(f"   Tillämpar beslutsgate...")
    
    # Kontrollera extern consensus
    external_approvals = external_reviews.get('total_approvals', 0)
    external_ok = external_approvals >= threshold
    
    # Kontrollera intern analys
    internal_ok = internal_analysis.get('stage1', {}).get('passed', False)
    
    # Både extern och intern måste godkänna
    gate_passed = external_ok and internal_ok
    
    if gate_passed:
        approved_examples = examples
        print(f"   ✅ Gate godkänd: {len(approved_examples)} exempel")
    else:
        approved_examples = []
        print(f"   ⛔ Gate INTE godkänd")
        print(f"      Externa: {external_approvals}/{threshold}")
        print(f"      Intern: {'OK' if internal_ok else 'EJ OK'}")
    
    return {
        'passed': gate_passed,
        'external_approvals': external_approvals,
        'external_threshold': threshold,
        'internal_passed': internal_ok,
        'approved_examples': approved_examples,
        'rejected_count': len(examples) - len(approved_examples)
    }
