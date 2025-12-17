"""
Tests for MTA-Debate-Observer (MTA-DO) functionality
Validates the integration of meta-transparency analysis in debates
"""

import json
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def test_mta_yaml_exists():
    """Test that mta-do.yaml specification file exists"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    assert mta_yaml_path.exists(), "mta-do.yaml specification file not found"
    print("✓ mta-do.yaml specification file exists")


def test_mta_yaml_structure():
    """Test that mta-do.yaml has correct structure"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for required sections
    required_sections = [
        'name:',
        'version:',
        'evaluation_dimensions:',
        'flow:',
        'output:',
        'prompts:',
        'technical:',
        'integration:',
        'principles:',
    ]
    
    for section in required_sections:
        assert section in content, f"Missing required section: {section}"
    
    print("✓ mta-do.yaml has correct structure")


def test_mta_evaluation_dimensions():
    """Test that MTA-DO has all 8 evaluation dimensions"""
    expected_dimensions = [
        'relevance',
        'argument_depth',
        'factual_anchoring',
        'bias_detection',
        'logical_coherence',
        'originality',
        'clarity',
        'constructiveness',
    ]
    
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for dimension in expected_dimensions:
        assert dimension in content, f"Missing evaluation dimension: {dimension}"
    
    print(f"✓ All {len(expected_dimensions)} evaluation dimensions present")


def test_mta_service_exists():
    """Test that mtaDebateObserver.js service file exists"""
    mta_service_path = PROJECT_ROOT / 'backend' / 'services' / 'mtaDebateObserver.js'
    assert mta_service_path.exists(), "mtaDebateObserver.js service file not found"
    print("✓ mtaDebateObserver.js service file exists")


def test_mta_service_exports():
    """Test that MTA service exports required functions"""
    mta_service_path = PROJECT_ROOT / 'backend' / 'services' / 'mtaDebateObserver.js'
    
    with open(mta_service_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_exports = [
        'analyzeMTADebateResponse',
        'generateMTACommentary',
        'generateMTAInsight',
        'batchAnalyzeMTAResponses',
    ]
    
    for export in required_exports:
        assert f'export async function {export}' in content or f'export function {export}' in content, \
            f"Missing required export: {export}"
    
    print("✓ MTA service exports all required functions")


def test_mta_integration_consensusDebate():
    """Test that MTA-DO is integrated into consensusDebate.js"""
    consensus_debate_path = PROJECT_ROOT / 'backend' / 'services' / 'consensusDebate.js'
    assert consensus_debate_path.exists(), "consensusDebate.js not found"
    
    with open(consensus_debate_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for MTA imports
    assert 'mtaDebateObserver' in content, "MTA-DO not imported in consensusDebate.js"
    assert 'analyzeMTADebateResponse' in content or 'batchAnalyzeMTAResponses' in content, \
        "MTA analysis functions not used in consensusDebate.js"
    
    # Check for MTA storage in debate object
    assert 'mtaAnalyses' in content, "mtaAnalyses not added to debate object"
    
    print("✓ MTA-DO integrated into consensusDebate.js")


def test_mta_api_endpoints():
    """Test that MTA API endpoints are added to debate.js"""
    debate_api_path = PROJECT_ROOT / 'backend' / 'api' / 'debate.js'
    assert debate_api_path.exists(), "debate.js API file not found"
    
    with open(debate_api_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for MTA function imports
    mta_functions = [
        'generateDebateMTACommentary',
        'generateDebateMTAInsight',
        'getDebateMTAAnalyses',
    ]
    
    for func in mta_functions:
        assert func in content, f"MTA function {func} not imported in debate API"
    
    # Check for MTA endpoints
    assert '/mta-analyses' in content, "MTA analyses endpoint not found"
    assert '/mta-commentary' in content, "MTA commentary endpoint not found"
    assert '/mta-insight' in content, "MTA insight endpoint not found"
    
    print("✓ MTA API endpoints added to debate.js")


def test_mta_flow_alignment():
    """Test that MTA flow aligns with specification"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for correct flow stages
    flow_stages = [
        'response_received',
        'mta_analysis',
        'commentary',
        'insight',
    ]
    
    for stage in flow_stages:
        assert stage in content, f"Missing flow stage: {stage}"
    
    # Check for parallel execution
    assert 'parallel' in content.lower(), "Parallel execution not mentioned in flow"
    assert 'non_blocking' in content or 'non-blocking' in content, "Non-blocking execution not specified"
    
    print("✓ MTA flow aligns with specification")


def test_mta_output_structure():
    """Test that MTA output structure is defined correctly"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for output structure elements
    output_elements = [
        'agent_name',
        'round_number',
        'timestamp',
        'response_text',
        'analysis',
        'summary',
        'overall_score',
        'weighted_score',
        'strengths',
        'weaknesses',
        'key_insights',
    ]
    
    for element in output_elements:
        assert element in content, f"Missing output element: {element}"
    
    print("✓ MTA output structure defined correctly")


def test_mta_prompts_defined():
    """Test that MTA prompts are defined with required parameters"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for prompt sections
    assert 'mta_analysis_prompt' in content, "MTA analysis prompt not defined"
    assert 'commentary_prompt' in content, "Commentary prompt not defined"
    assert 'insight_prompt' in content, "Insight prompt not defined"
    
    # Check for required parameters in prompts
    required_params = ['{agent_name}', '{round_num}', '{response}', '{question}']
    for param in required_params:
        assert param in content, f"Required parameter {param} not in prompts"
    
    print("✓ MTA prompts defined with required parameters")


def test_mta_principles():
    """Test that MTA principles are documented"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for key principles
    principles = [
        'Non-intrusiveness',
        'Dual utility',
        'Zero latency impact',
        'Objective evaluation',
        'Transparency',
    ]
    
    for principle in principles:
        assert principle in content, f"Missing principle: {principle}"
    
    print("✓ MTA principles documented")


def test_mta_technical_requirements():
    """Test that technical requirements are specified"""
    mta_yaml_path = PROJECT_ROOT / 'mta-do.yaml'
    
    with open(mta_yaml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for technical requirements
    tech_requirements = [
        'parallelization',
        'performance',
        'compatibility',
        'oneseek_integration',
    ]
    
    for req in tech_requirements:
        assert req in content, f"Missing technical requirement: {req}"
    
    print("✓ Technical requirements specified")


def run_all_tests():
    """Run all MTA-DO tests"""
    tests = [
        test_mta_yaml_exists,
        test_mta_yaml_structure,
        test_mta_evaluation_dimensions,
        test_mta_service_exists,
        test_mta_service_exports,
        test_mta_integration_consensusDebate,
        test_mta_api_endpoints,
        test_mta_flow_alignment,
        test_mta_output_structure,
        test_mta_prompts_defined,
        test_mta_principles,
        test_mta_technical_requirements,
    ]
    
    print("\n" + "="*60)
    print("Running MTA-Debate-Observer Tests")
    print("="*60 + "\n")
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} ERROR: {e}")
            failed += 1
    
    print("\n" + "="*60)
    print(f"Results: {passed} passed, {failed} failed")
    print("="*60 + "\n")
    
    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
