"""
Unit tests for the ChatML formatter utility.

This test suite verifies that the ChatML formatter correctly formats
prompts for GGUF models compatible with llama.cpp and GPT4ALL.
"""

import sys
from pathlib import Path

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent.parent / "ml_service"))

from chatml_formatter import (
    format_chatml_message,
    format_chatml_prompt,
    serialize_message_history,
    get_chatml_stop_tokens,
    clean_chatml_response,
    validate_chatml_format,
    format_for_llama_server,
    format_for_llama_server_stream,
    CHATML_START,
    CHATML_END
)


def test_format_single_message():
    """Test formatting a single ChatML message."""
    print("\n=== Test: Format Single Message ===")
    
    # Test system message
    system_msg = format_chatml_message("system", "You are a helpful assistant.")
    print(f"System message:\n{system_msg}")
    assert system_msg == "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n"
    
    # Test user message
    user_msg = format_chatml_message("user", "Hello!")
    print(f"User message:\n{user_msg}")
    assert user_msg == "<|im_start|>user\nHello!<|im_end|>\n"
    
    # Test assistant message
    assistant_msg = format_chatml_message("assistant", "Hi there!")
    print(f"Assistant message:\n{assistant_msg}")
    assert assistant_msg == "<|im_start|>assistant\nHi there!<|im_end|>\n"
    
    print("✓ Single message formatting works correctly")


def test_format_prompt_no_history():
    """Test formatting a prompt without conversation history."""
    print("\n=== Test: Format Prompt (No History) ===")
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is 2+2?"}
    ]
    
    prompt = format_chatml_prompt(messages, add_generation_prompt=True)
    print(f"Formatted prompt:\n{prompt}")
    
    expected = (
        "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n"
        "<|im_start|>user\nWhat is 2+2?<|im_end|>\n"
        "<|im_start|>assistant\n"
    )
    assert prompt == expected
    
    # Validate the format
    assert validate_chatml_format(prompt)
    
    print("✓ Prompt formatting (no history) works correctly")


def test_serialize_message_history():
    """Test serializing a conversation with history."""
    print("\n=== Test: Serialize Message History ===")
    
    history = [
        {"role": "user", "content": "What is Paris?"},
        {"role": "assistant", "content": "Paris is the capital of France."},
        {"role": "user", "content": "What is its population?"},
        {"role": "assistant", "content": "About 2.2 million in the city proper."}
    ]
    
    prompt = serialize_message_history(
        system_prompt="You are a geography expert.",
        user_message="What about London?",
        history=history,
        add_generation_prompt=True
    )
    
    print(f"Formatted prompt with history:\n{prompt}")
    
    # Check that all messages are included
    assert "<|im_start|>system\nYou are a geography expert.<|im_end|>" in prompt
    assert "<|im_start|>user\nWhat is Paris?<|im_end|>" in prompt
    assert "<|im_start|>assistant\nParis is the capital of France.<|im_end|>" in prompt
    assert "<|im_start|>user\nWhat is its population?<|im_end|>" in prompt
    assert "<|im_start|>assistant\nAbout 2.2 million in the city proper.<|im_end|>" in prompt
    assert "<|im_start|>user\nWhat about London?<|im_end|>" in prompt
    assert prompt.endswith("<|im_start|>assistant\n")
    
    # Validate the format
    assert validate_chatml_format(prompt)
    
    print("✓ Message history serialization works correctly")


def test_stop_tokens():
    """Test that stop tokens are correctly defined."""
    print("\n=== Test: Stop Tokens ===")
    
    stop_tokens = get_chatml_stop_tokens()
    print(f"Stop tokens: {stop_tokens}")
    
    assert "<|im_end|>" in stop_tokens
    assert "<|im_start|>user" in stop_tokens
    assert "</s>" in stop_tokens
    
    # Test adding additional stops
    additional = ["STOP", "END"]
    stop_tokens_extended = get_chatml_stop_tokens(additional)
    assert "STOP" in stop_tokens_extended
    assert "END" in stop_tokens_extended
    
    print("✓ Stop tokens are correctly defined")


def test_clean_response():
    """Test cleaning ChatML artifacts from responses."""
    print("\n=== Test: Clean Response ===")
    
    # Test cleaning basic ChatML tokens
    dirty = "<|im_start|>assistant\nThis is a response<|im_end|>"
    clean = clean_chatml_response(dirty)
    print(f"Dirty: {dirty}")
    print(f"Clean: {clean}")
    assert clean == "This is a response"
    
    # Test cleaning with role prefix
    dirty2 = "assistant\nThis is another response"
    clean2 = clean_chatml_response(dirty2)
    assert clean2 == "This is another response"
    
    # Test already clean response
    already_clean = "This is already clean"
    assert clean_chatml_response(already_clean) == already_clean
    
    print("✓ Response cleaning works correctly")


def test_validate_format():
    """Test ChatML format validation."""
    print("\n=== Test: Validate Format ===")
    
    # Valid format
    valid = "<|im_start|>system\nTest<|im_end|>\n<|im_start|>user\nHi<|im_end|>\n<|im_start|>assistant\n"
    assert validate_chatml_format(valid)
    print("✓ Valid format recognized")
    
    # Missing start token
    invalid1 = "system\nTest<|im_end|>"
    assert not validate_chatml_format(invalid1)
    print("✓ Missing start token detected")
    
    # Unbalanced tokens
    invalid2 = "<|im_start|>system\nTest<|im_end|>\n<|im_start|>user\nHi"
    # This should still be valid as it could be a generation prompt
    # The validation allows end count = start count - 1
    assert validate_chatml_format(invalid2)
    print("✓ Generation prompt format accepted")
    
    print("✓ Format validation works correctly")


def test_llama_server_payload():
    """Test creating a complete llama-server payload."""
    print("\n=== Test: LLama Server Payload ===")
    
    payload = format_for_llama_server(
        system_prompt="You are helpful.",
        user_message="Tell me a joke.",
        history=None,
        max_tokens=256,
        temperature=0.8,
        additional_stops=["JOKE_END"]
    )
    
    print(f"Payload: {payload}")
    
    assert "prompt" in payload
    assert "n_predict" in payload
    assert "temperature" in payload
    assert "stop" in payload
    assert "stream" in payload
    
    assert payload["n_predict"] == 256
    assert payload["temperature"] == 0.8
    assert payload["stream"] == False
    assert "JOKE_END" in payload["stop"]
    assert "<|im_end|>" in payload["stop"]
    
    # Validate the prompt format
    assert validate_chatml_format(payload["prompt"])
    
    print("✓ LLama server payload creation works correctly")


def test_llama_server_stream_payload():
    """Test creating a streaming llama-server payload."""
    print("\n=== Test: LLama Server Streaming Payload ===")
    
    payload = format_for_llama_server_stream(
        system_prompt="You are helpful.",
        user_message="Count to 10.",
        history=[
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"}
        ],
        max_tokens=128,
        temperature=0.7
    )
    
    print(f"Streaming payload: {payload}")
    
    assert payload["stream"] == True
    assert "<|im_start|>user\nHi<|im_end|>" in payload["prompt"]
    assert "<|im_start|>assistant\nHello!<|im_end|>" in payload["prompt"]
    assert "<|im_start|>user\nCount to 10.<|im_end|>" in payload["prompt"]
    
    print("✓ LLama server streaming payload creation works correctly")


def test_real_world_scenario():
    """Test a real-world conversation scenario."""
    print("\n=== Test: Real World Scenario ===")
    
    # Simulate a multi-turn conversation
    system_prompt = "You are OneSeek, a helpful Swedish AI assistant."
    
    # First turn
    prompt1 = serialize_message_history(
        system_prompt=system_prompt,
        user_message="Hej! Vad heter du?",
        history=None
    )
    print(f"\nTurn 1 prompt:\n{prompt1}")
    assert validate_chatml_format(prompt1)
    
    # Simulate assistant response
    response1 = "Hej! Jag heter OneSeek och jag är en AI-assistent."
    
    # Second turn with history
    history = [
        {"role": "user", "content": "Hej! Vad heter du?"},
        {"role": "assistant", "content": response1}
    ]
    
    prompt2 = serialize_message_history(
        system_prompt=system_prompt,
        user_message="Kan du hjälpa mig med programmering?",
        history=history
    )
    print(f"\nTurn 2 prompt:\n{prompt2}")
    assert validate_chatml_format(prompt2)
    assert "Hej! Vad heter du?" in prompt2
    assert response1 in prompt2
    assert "Kan du hjälpa mig med programmering?" in prompt2
    
    print("✓ Real world scenario works correctly")


def run_all_tests():
    """Run all tests."""
    print("=" * 70)
    print("ChatML Formatter Test Suite")
    print("=" * 70)
    
    try:
        test_format_single_message()
        test_format_prompt_no_history()
        test_serialize_message_history()
        test_stop_tokens()
        test_clean_response()
        test_validate_format()
        test_llama_server_payload()
        test_llama_server_stream_payload()
        test_real_world_scenario()
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED!")
        print("=" * 70)
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
