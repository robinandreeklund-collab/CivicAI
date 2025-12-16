#!/usr/bin/env python3
"""
Validation script for debate.yaml configuration
Ensures the YAML config aligns with the actual implementation
"""

import yaml
import sys
from pathlib import Path

def validate_debate_yaml():
    """Validate debate.yaml structure and content"""
    
    print("🔍 Validating debate.yaml configuration...")
    
    # Load debate.yaml
    yaml_path = Path(__file__).parent / "debate.yaml"
    
    if not yaml_path.exists():
        print(f"❌ ERROR: debate.yaml not found at {yaml_path}")
        return False
    
    try:
        with open(yaml_path, 'r') as f:
            config = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"❌ ERROR: Invalid YAML syntax: {e}")
        return False
    
    print("✓ YAML syntax valid")
    
    # Validate metadata
    if 'metadata' not in config:
        print("❌ ERROR: Missing 'metadata' section")
        return False
    
    metadata = config['metadata']
    required_metadata = ['name', 'version', 'description', 'architecture', 'status']
    for field in required_metadata:
        if field not in metadata:
            print(f"❌ ERROR: Missing metadata field: {field}")
            return False
    
    print(f"✓ Metadata complete: {metadata['name']} v{metadata['version']}")
    
    # Validate configuration
    if 'configuration' not in config:
        print("❌ ERROR: Missing 'configuration' section")
        return False
    
    conf = config['configuration']
    
    # Check max_rounds
    if conf.get('max_rounds') != 3:
        print(f"❌ ERROR: max_rounds should be 3, got {conf.get('max_rounds')}")
        return False
    print("✓ max_rounds = 3")
    
    # Check agents
    expected_agents = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
    if conf.get('agents') != expected_agents:
        print(f"❌ ERROR: agents mismatch. Expected {expected_agents}, got {conf.get('agents')}")
        return False
    print(f"✓ agents = {expected_agents}")
    
    # Check personality
    if conf.get('personality') != 'oneseek-debattledare':
        print(f"❌ ERROR: personality should be 'oneseek-debattledare', got {conf.get('personality')}")
        return False
    print("✓ personality = 'oneseek-debattledare'")
    
    # Check WebSocket endpoint
    if conf.get('websocket_endpoint') != '/ws/debate':
        print(f"❌ ERROR: websocket_endpoint should be '/ws/debate', got {conf.get('websocket_endpoint')}")
        return False
    print("✓ websocket_endpoint = '/ws/debate'")
    
    # Validate debate sequence
    if 'debate_sequence' not in config:
        print("❌ ERROR: Missing 'debate_sequence' section")
        return False
    
    sequence = config['debate_sequence']
    required_phases = ['initialization', 'debate_rounds', 'voting_phase', 'winner_announcement', 'final_summary']
    for phase in required_phases:
        if phase not in sequence:
            print(f"❌ ERROR: Missing debate sequence phase: {phase}")
            return False
    
    print(f"✓ All {len(required_phases)} debate sequence phases defined")
    
    # Validate WebSocket events
    if 'websocket_events' not in config:
        print("❌ ERROR: Missing 'websocket_events' section")
        return False
    
    events = config['websocket_events']
    expected_event_categories = [
        'initialization_events',
        'queue_processing_events', 
        'oneseek_answer_events',
        'round_summary_events',
        'voting_winner_events',
        'error_events'
    ]
    
    for category in expected_event_categories:
        if category not in events:
            print(f"❌ ERROR: Missing event category: {category}")
            return False
    
    print(f"✓ All {len(expected_event_categories)} event categories defined")
    
    # Validate critical event types
    critical_events = [
        'thinking', 'debate_init', 'round_start', 'ai_response',
        'oneseek_echo_start', 'oneseek_echo', 'oneseek_reasoning', 'live_insight',
        'oneseek_own_answer_start', 'oneseek_own_answer', 'oneseek_own_reasoning',
        'round_summary', 'round_end', 'voting', 'winner', 'debate_complete', 'error'
    ]
    
    # Count all defined events across categories
    all_events = []
    for category_key in expected_event_categories:
        category_events = events[category_key]
        if isinstance(category_events, list):
            all_events.extend([e['name'] for e in category_events if 'name' in e])
    
    missing_events = set(critical_events) - set(all_events)
    if missing_events:
        print(f"❌ ERROR: Missing critical event types: {missing_events}")
        return False
    
    print(f"✓ All {len(critical_events)} critical event types defined")
    
    # Validate data transitions
    if 'data_transitions' not in config:
        print("❌ ERROR: Missing 'data_transitions' section")
        return False
    
    print("✓ data_transitions section present")
    
    # Validate error handling
    if 'error_handling' not in config:
        print("❌ ERROR: Missing 'error_handling' section")
        return False
    
    print("✓ error_handling section present")
    
    # Validate flow architecture
    if 'flow_architecture' not in config:
        print("❌ ERROR: Missing 'flow_architecture' section")
        return False
    
    arch = config['flow_architecture']
    if arch.get('type') != 'queue-based':
        print(f"❌ ERROR: flow_architecture type should be 'queue-based', got {arch.get('type')}")
        return False
    
    print("✓ flow_architecture = 'queue-based'")
    
    # All validations passed
    print("\n✅ All validations passed!")
    print(f"   debate.yaml v{metadata['version']} is correctly configured")
    print(f"   Architecture: {metadata['architecture']}")
    print(f"   Status: {metadata['status']}")
    
    return True

if __name__ == '__main__':
    success = validate_debate_yaml()
    sys.exit(0 if success else 1)
