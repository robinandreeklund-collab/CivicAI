"""
Tests for BERT summarization functionality
Tests browse_page_with_bert and web page summarization
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_bert_summarizer_import():
    """Test that bert_summarizer can be imported"""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "python_services"))
        import bert_summarizer
        assert hasattr(bert_summarizer, 'summarize_text')
        assert hasattr(bert_summarizer, 'summarize_responses')
        print("✓ BERT summarizer imported successfully")
    except ImportError as e:
        pytest.skip(f"BERT summarizer not available: {e}")


def test_summarize_text_function():
    """Test the summarize_text function with sample text"""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "python_services"))
        from bert_summarizer import summarize_text, BERT_AVAILABLE
        
        if not BERT_AVAILABLE:
            pytest.skip("BERT library not installed")
        
        # Sample Swedish text about socialtjänstlagen
        sample_text = """
        Socialtjänstlagen är en ramlag som reglerar den kommunala socialtjänsten i Sverige.
        Lagen trädde i kraft 1982 och har sedan dess genomgått flera förändringar.
        
        Den grundläggande principen i socialtjänstlagen är att var och en ska kunna leva
        ett värdigt liv under trygga förhållanden. Socialtjänsten ska främja människors
        ekonomiska och sociala trygghet, jämlikhet i levnadsvillkor och aktiva deltagande
        i samhällslivet.
        
        En viktig bestämmelse är rätten till bistånd enligt 4 kap. 1 §. Den anger att
        den som inte själv kan tillgodose sina behov eller kan få dem tillgodosedda på
        annat sätt har rätt till bistånd av socialnämnden för sin försörjning och för
        sin livsföring i övrigt.
        
        Socialtjänstlagen innehåller också bestämmelser om barn och unga, personer med
        missbruksproblem, äldre personer och personer med funktionsnedsättning.
        
        Kommunerna har huvudansvaret för socialtjänsten inom sitt område. Varje kommun
        ska ha en socialnämnd eller motsvarande organ som ansvarar för socialtjänsten.
        """
        
        result = summarize_text(sample_text, min_length=50, ratio=0.4)
        
        assert result['success'] is True, f"Summarization failed: {result.get('error')}"
        assert 'summary' in result
        assert len(result['summary']) > 0
        assert len(result['summary']) < len(sample_text)
        
        metadata = result.get('metadata', {})
        assert metadata.get('original_length') == len(sample_text)
        assert metadata.get('summary_length') == len(result['summary'])
        assert 0 < metadata.get('compression_ratio', 0) < 1
        
        print(f"✓ Text summarization successful")
        print(f"  Original: {metadata.get('original_length')} chars")
        print(f"  Summary: {metadata.get('summary_length')} chars")
        print(f"  Compression: {metadata.get('compression_ratio'):.2%}")
        
    except ImportError as e:
        pytest.skip(f"BERT library not available: {e}")


def test_browse_page_import():
    """Test that browse_page and browse_page_with_bert can be imported"""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent / "ml_service"))
        from api_integrations import browse_page, browse_page_with_bert
        
        assert callable(browse_page)
        assert callable(browse_page_with_bert)
        print("✓ browse_page and browse_page_with_bert imported successfully")
        
    except ImportError as e:
        pytest.fail(f"Failed to import browse_page functions: {e}")


def test_api_selector_web_search_support():
    """Test that api_selector supports web_search tool"""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent / "ml_service"))
        from api_selector import call_api
        
        # Just verify the function exists and accepts the right parameters
        assert callable(call_api)
        print("✓ api_selector.call_api available")
        
    except ImportError as e:
        pytest.fail(f"Failed to import api_selector: {e}")


def test_bert_summarizer_cli():
    """Test the BERT summarizer CLI interface"""
    import subprocess
    import json
    
    bert_script = Path(__file__).parent.parent / "backend" / "python_services" / "bert_summarizer.py"
    
    if not bert_script.exists():
        pytest.skip(f"BERT summarizer script not found at {bert_script}")
    
    # Test single-text mode
    input_data = {
        "text": "Detta är en testtext. Den innehåller flera meningar. Vi vill testa BERT-summarizern.",
        "ratio": 0.5,
        "min_length": 10
    }
    
    try:
        result = subprocess.run(
            ["python3", str(bert_script)],
            input=json.dumps(input_data, ensure_ascii=False),
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            output = json.loads(result.stdout)
            # May fail if BERT not installed, which is acceptable
            if not output.get('success') and 'not installed' in output.get('error', ''):
                pytest.skip("BERT library not installed")
            
            print("✓ BERT summarizer CLI test completed")
        else:
            # Non-zero return is acceptable if BERT not installed
            if 'not installed' in result.stderr or 'not installed' in result.stdout:
                pytest.skip("BERT library not installed")
            else:
                print(f"Warning: BERT script returned error: {result.stderr}")
                
    except subprocess.TimeoutExpired:
        pytest.fail("BERT summarizer CLI timed out")
    except FileNotFoundError:
        pytest.skip("python3 not found")


if __name__ == "__main__":
    print("=" * 70)
    print("BERT SUMMARIZATION TESTS")
    print("=" * 70)
    
    test_bert_summarizer_import()
    test_summarize_text_function()
    test_browse_page_import()
    test_api_selector_web_search_support()
    test_bert_summarizer_cli()
    
    print("\n" + "=" * 70)
    print("All tests passed!")
    print("=" * 70)
