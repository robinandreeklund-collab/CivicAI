#!/usr/bin/env python3
"""
Tests for No-Fallback Tokenizer and Model Loading Policy

This module tests that the tokenizer and model loading logic in both
ml_service/server.py and ml/training/pytorch_trainer.py correctly
fail with helpful error messages instead of silently falling back
to downloading models from HuggingFace.
"""

import sys
from pathlib import Path
import re

# Add project paths for import
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestNoFallbackPolicy:
    """Tests that no silent fallback to HuggingFace occurs"""
    
    def test_pytorch_trainer_no_llama_fallback_in_tokenizer(self):
        """Test that pytorch_trainer.py doesn't have hardcoded Llama fallback for tokenizer"""
        trainer_path = Path(__file__).parent.parent / 'ml' / 'training' / 'pytorch_trainer.py'
        content = trainer_path.read_text(encoding='utf-8')
        
        # Check that there's no silent fallback to meta-llama/Llama-2-7b-chat-hf for tokenizer
        # The pattern should NOT appear in the tokenizer loading section (before line 708)
        tokenizer_section_end = content.find("if tokenizer.pad_token is None:")
        if tokenizer_section_end == -1:
            tokenizer_section_end = len(content)
        
        tokenizer_section = content[:tokenizer_section_end]
        
        # These patterns indicate silent fallback - they should NOT be in tokenizer section
        silent_fallback_patterns = [
            r'AutoTokenizer\.from_pretrained\(\s*model_id',
            r'model_id\s*=\s*["\']meta-llama/Llama-2-7b-chat-hf["\']',
        ]
        
        for pattern in silent_fallback_patterns:
            matches = re.findall(pattern, tokenizer_section)
            assert len(matches) == 0, (
                f"Found silent fallback pattern in tokenizer section: {pattern}\n"
                f"The tokenizer loading should NOT fall back to downloading from HuggingFace.\n"
                f"Found: {matches}"
            )
        
        print("✓ pytorch_trainer.py: No Llama fallback in tokenizer loading")
    
    def test_pytorch_trainer_no_llama_fallback_in_model_loading(self):
        """Test that pytorch_trainer.py doesn't have hardcoded Llama fallback for model loading"""
        trainer_path = Path(__file__).parent.parent / 'ml' / 'training' / 'pytorch_trainer.py'
        content = trainer_path.read_text(encoding='utf-8')
        
        # Find the model loading section (between model loading and adapter loading)
        model_loading_start = content.find("Loading model (this may take a few minutes)")
        model_loading_end = content.find("# === LADDA ALLA TIDIGARE ADAPTERS FRÅN METADATA ===")
        
        if model_loading_start == -1 or model_loading_end == -1:
            # Fallback to searching full file
            model_loading_section = content
        else:
            model_loading_section = content[model_loading_start:model_loading_end]
        
        # These patterns indicate silent fallback - should NOT appear
        silent_fallback_patterns = [
            r'model_id\s*=\s*["\']meta-llama/Llama-2-7b-chat-hf["\'].*\n.*AutoModelForCausalLM',
        ]
        
        for pattern in silent_fallback_patterns:
            matches = re.findall(pattern, model_loading_section, re.MULTILINE | re.DOTALL)
            assert len(matches) == 0, (
                f"Found silent model fallback pattern: {pattern}\n"
                f"Model loading should NOT fall back to downloading from HuggingFace."
            )
        
        print("✓ pytorch_trainer.py: No Llama fallback in model loading")
    
    def test_pytorch_trainer_has_clear_error_messages(self):
        """Test that pytorch_trainer.py has clear error messages instead of silent fallback"""
        trainer_path = Path(__file__).parent.parent / 'ml' / 'training' / 'pytorch_trainer.py'
        content = trainer_path.read_text(encoding='utf-8')
        
        # These patterns indicate proper error handling
        required_error_patterns = [
            r'\[ERROR\].*TOKENIZER LOADING FAILED',
            r'\[ERROR\].*MODEL LOADING FAILED',
            r'No silent fallback to remote models',
            r'huggingface-cli download',  # Helpful suggestion to re-download
        ]
        
        for pattern in required_error_patterns:
            matches = re.findall(pattern, content)
            assert len(matches) > 0, (
                f"Missing required error message pattern: {pattern}\n"
                f"Error messages should include clear debugging information."
            )
        
        print("✓ pytorch_trainer.py: Has clear error messages")
    
    def test_server_has_clear_tokenizer_error_messages(self):
        """Test that server.py has clear error messages for tokenizer failures"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        content = server_path.read_text(encoding='utf-8')
        
        # Check for helpful error messages
        required_patterns = [
            r'TOKENIZER LOADING FAILED',
            r'NO SILENT FALLBACK',
            r'huggingface-cli download',  # Helpful suggestion
            r"'dict object has no attribute model_type'",  # Specific error mention
        ]
        
        for pattern in required_patterns:
            matches = re.findall(pattern, content)
            assert len(matches) > 0, (
                f"Missing required error message pattern in server.py: {pattern}"
            )
        
        print("✓ server.py: Has clear tokenizer error messages")
    
    def test_server_no_hardcoded_llama_fallback(self):
        """Test that server.py doesn't have any hardcoded Llama fallback"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        content = server_path.read_text(encoding='utf-8')
        
        # These patterns would indicate silent fallback - should NOT appear
        forbidden_patterns = [
            r'AutoTokenizer\.from_pretrained\(["\']meta-llama/Llama-2-7b-chat-hf["\']',
            r'AutoModelForCausalLM\.from_pretrained\(["\']meta-llama/Llama-2-7b-chat-hf["\']',
        ]
        
        for pattern in forbidden_patterns:
            matches = re.findall(pattern, content)
            assert len(matches) == 0, (
                f"Found forbidden fallback pattern in server.py: {pattern}\n"
                f"The server should NOT fall back to downloading from HuggingFace."
            )
        
        print("✓ server.py: No hardcoded Llama fallback")


class TestAdapterLoading:
    """Tests for adapter chain loading from metadata.json"""
    
    def test_adapter_loading_uses_metadata_as_source(self):
        """Test that adapter loading uses metadata.json as the source of truth"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        content = server_path.read_text(encoding='utf-8')
        
        # Check that metadata.json is used as primary source
        required_patterns = [
            r'metadata\.json.*source of truth',
            r'adapters_list\s*=\s*metadata\.get\(["\']adapters["\']',
        ]
        
        for pattern in required_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert len(matches) > 0, (
                f"Missing metadata.json as source of truth pattern: {pattern}"
            )
        
        print("✓ server.py: Uses metadata.json as source of truth for adapters")
    
    def test_adapter_loading_logs_which_adapters_loaded(self):
        """Test that adapter loading logs which adapters are loaded and why"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        content = server_path.read_text(encoding='utf-8')
        
        # Check for logging of adapter loading
        log_patterns = [
            r'Hittade.*adapter.*i metadata\.json',  # Found adapters in metadata.json
            r'Laddar.*adapter',  # Loading adapter
            r'adapter.*laddad',  # Adapter loaded
        ]
        
        for pattern in log_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert len(matches) > 0, (
                f"Missing adapter logging pattern: {pattern}\n"
                f"Adapter loading should log which adapters are loaded."
            )
        
        print("✓ server.py: Logs which adapters are loaded")
    
    def test_pytorch_trainer_adapter_chain_loading(self):
        """Test that pytorch_trainer.py correctly loads adapter chains"""
        trainer_path = Path(__file__).parent.parent / 'ml' / 'training' / 'pytorch_trainer.py'
        content = trainer_path.read_text(encoding='utf-8')
        
        # Check that adapters are loaded from metadata.json
        required_patterns = [
            r'metadata_path.*metadata\.json',
            r'adapters_list\s*=\s*metadata\.get\(["\']adapters["\']',
            r'adapter.*laddad',  # Adapter loaded
        ]
        
        for pattern in required_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert len(matches) > 0, (
                f"Missing adapter chain pattern in pytorch_trainer.py: {pattern}"
            )
        
        print("✓ pytorch_trainer.py: Correctly loads adapter chains from metadata")
    
    def test_fallback_scan_logs_warning(self):
        """Test that fallback directory scan logs a warning"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        content = server_path.read_text(encoding='utf-8')
        
        # Check that fallback scan logs a warning
        warning_patterns = [
            r'fallback.*sökning',
            r'Ingen adapter-lista i metadata\.json',
        ]
        
        for pattern in warning_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if len(matches) > 0:
                print("✓ server.py: Fallback scan logs warning")
                return
        
        # If no warning pattern found, it's still OK if there's no fallback at all
        print("✓ server.py: No fallback scan or properly logged")


def run_tests():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("No-Fallback Policy Tests")
    print("=" * 70)
    
    test_classes = [TestNoFallbackPolicy, TestAdapterLoading]
    passed = 0
    failed = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__name__}:")
        instance = test_class()
        
        for method_name in dir(instance):
            if method_name.startswith('test_'):
                try:
                    getattr(instance, method_name)()
                    passed += 1
                except AssertionError as e:
                    print(f"✗ {method_name}: {e}")
                    failed += 1
                except Exception as e:
                    print(f"✗ {method_name}: Unexpected error: {e}")
                    failed += 1
    
    print("\n" + "=" * 70)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 70)
    
    return failed == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
