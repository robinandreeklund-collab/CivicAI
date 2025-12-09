"""
Quick test for thinking chain extraction functionality.
"""

import re


def extract_thinking_chain(response_text: str) -> tuple:
    """
    Extract the model's thinking process from <think> tags in the response.
    
    Args:
        response_text: The model's response text potentially containing <think> tags
        
    Returns:
        Tuple of (thinking_text, clean_response_text)
    """
    if not response_text:
        return None, response_text
    
    # Match <think>...</think> tags (case insensitive, can span multiple lines)
    think_pattern = r'<think>(.*?)</think>'
    matches = re.findall(think_pattern, response_text, flags=re.DOTALL | re.IGNORECASE)
    
    if matches:
        # Concatenate all thinking blocks if there are multiple
        thinking_text = '\n\n'.join(match.strip() for match in matches)
        # Remove all <think> tags from the response
        clean_response = re.sub(think_pattern, '', response_text, flags=re.DOTALL | re.IGNORECASE)
        # Clean up any extra whitespace left behind
        clean_response = re.sub(r'\n{3,}', '\n\n', clean_response).strip()
        return thinking_text, clean_response
    
    return None, response_text


def test_thinking_extraction():
    """Test that thinking chain extraction works correctly."""
    
    print("=" * 70)
    print("Thinking Chain Extraction Tests")
    print("=" * 70)
    
    # Test 1: Response with thinking
    print("\n1. Response with <think> tags:")
    response_with_thinking = """<think>
Let me analyze this question. The user is asking about the capital of France.
I know that Paris is the capital and largest city of France.
I should provide a clear, concise answer.
</think>

The capital of France is Paris. It's the country's largest city and a major European cultural center."""
    
    thinking, clean = extract_thinking_chain(response_with_thinking)
    
    print(f"Original length: {len(response_with_thinking)} chars")
    print(f"\nExtracted thinking ({len(thinking) if thinking else 0} chars):")
    print(f"  {thinking[:100]}..." if thinking and len(thinking) > 100 else f"  {thinking}")
    print(f"\nClean response ({len(clean)} chars):")
    print(f"  {clean}")
    
    assert thinking is not None, "Should extract thinking"
    assert "<think>" not in clean, "Clean response should not contain <think> tags"
    assert "Paris" in clean, "Clean response should contain the answer"
    print("\n✓ Test 1 passed")
    
    # Test 2: Response without thinking
    print("\n2. Response without <think> tags:")
    response_without_thinking = "The capital of France is Paris."
    
    thinking2, clean2 = extract_thinking_chain(response_without_thinking)
    
    print(f"Extracted thinking: {thinking2}")
    print(f"Clean response: {clean2}")
    
    assert thinking2 is None, "Should return None for no thinking"
    assert clean2 == response_without_thinking, "Clean response should be unchanged"
    print("✓ Test 2 passed")
    
    # Test 3: Multiple thinking blocks
    print("\n3. Response with multiple <think> blocks:")
    response_multi_thinking = """<think>First thought: analyzing question</think>

Here's part one.

<think>Second thought: adding more context</think>

And here's part two."""
    
    thinking3, clean3 = extract_thinking_chain(response_multi_thinking)
    
    print(f"Extracted thinking ({len(thinking3) if thinking3 else 0} chars):")
    print(f"  {thinking3}")
    print(f"\nClean response:")
    print(f"  {clean3}")
    
    assert thinking3 is not None, "Should extract multiple thinking blocks"
    assert "First thought" in thinking3, "Should include first thinking"
    assert "Second thought" in thinking3, "Should include second thinking"
    assert "<think>" not in clean3, "Clean response should not contain tags"
    print("✓ Test 3 passed")
    
    # Test 4: Case insensitive
    print("\n4. Case insensitive extraction:")
    response_caps = "<THINK>Uppercase thinking</THINK>Response here."
    
    thinking4, clean4 = extract_thinking_chain(response_caps)
    
    print(f"Extracted: {thinking4}")
    print(f"Clean: {clean4}")
    
    assert thinking4 is not None, "Should handle uppercase tags"
    assert "Uppercase thinking" in thinking4, "Should extract uppercase content"
    print("✓ Test 4 passed")
    
    print("\n" + "=" * 70)
    print("✅ All thinking chain extraction tests passed!")
    print("=" * 70)


if __name__ == "__main__":
    import sys
    try:
        test_thinking_extraction()
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
