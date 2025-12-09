"""
ChatML Formatter for GGUF Models

This module provides utilities for formatting messages in the ChatML format
that llama.cpp and GPT4ALL expect for GGUF models. It ensures that prompts
sent to the model match the exact format expected by these tools.

ChatML Format (standard for most GGUF models):
- System message: <|im_start|>system\n{content}<|im_end|>\n
- User message: <|im_start|>user\n{content}<|im_end|>\n  
- Assistant message: <|im_start|>assistant\n{content}<|im_end|>\n
- Generation prompt: <|im_start|>assistant\n

The format ensures:
1. No extra chat_template is passed to llama-server (we build it ourselves)
2. Messages are serialized with proper role tagging
3. Stop tokens (<|im_end|>) are handled correctly
4. Output matches what llama-server returns directly
"""

from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

# ChatML special tokens
CHATML_START = "<|im_start|>"
CHATML_END = "<|im_end|>"

# Valid roles in ChatML
VALID_ROLES = {"system", "user", "assistant"}

# Default stop tokens for ChatML
DEFAULT_STOP_TOKENS = [
    CHATML_END,
    "<|im_start|>user",  # Prevent generating next user turn
    "</s>",               # EOS token (common in many models)
]


def format_chatml_message(role: str, content: str) -> str:
    """
    Format a single message in ChatML format.
    
    Args:
        role: Message role (system, user, or assistant)
        content: Message content
        
    Returns:
        Formatted ChatML message string
        
    Example:
        >>> format_chatml_message("user", "Hello!")
        '<|im_start|>user\\nHello!<|im_end|>\\n'
    """
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {VALID_ROLES}")
    
    if not content:
        logger.warning(f"Empty content for role '{role}'")
        content = ""
    
    return f"{CHATML_START}{role}\n{content}{CHATML_END}\n"


def format_chatml_prompt(messages: List[Dict[str, str]], add_generation_prompt: bool = True) -> str:
    """
    Format a list of messages into a complete ChatML prompt.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        add_generation_prompt: If True, adds <|im_start|>assistant\n at the end
                              to prompt the model to generate
    
    Returns:
        Complete ChatML-formatted prompt string
        
    Example:
        >>> messages = [
        ...     {"role": "system", "content": "You are a helpful assistant."},
        ...     {"role": "user", "content": "Hello!"}
        ... ]
        >>> format_chatml_prompt(messages)
        '<|im_start|>system\\nYou are a helpful assistant.<|im_end|>\\n<|im_start|>user\\nHello!<|im_end|>\\n<|im_start|>assistant\\n'
    """
    if not messages:
        raise ValueError("Messages list cannot be empty")
    
    # Build the prompt from messages
    prompt_parts = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        
        if not role:
            raise ValueError(f"Message missing 'role' key: {msg}")
        
        prompt_parts.append(format_chatml_message(role, content))
    
    # Add generation prompt if requested
    if add_generation_prompt:
        prompt_parts.append(f"{CHATML_START}assistant\n")
    
    return "".join(prompt_parts)


def serialize_message_history(
    system_prompt: str,
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    add_generation_prompt: bool = True
) -> str:
    """
    Serialize a conversation with history into ChatML format.
    
    This is the main function to use when building prompts for GGUF models.
    It handles the common pattern of: system prompt + history + current user message.
    
    Args:
        system_prompt: System prompt/instructions for the model
        user_message: Current user message to respond to
        history: Optional list of previous messages [{"role": "user"|"assistant", "content": "..."}]
        add_generation_prompt: If True, adds assistant generation prompt
    
    Returns:
        Complete ChatML-formatted prompt ready for the model
        
    Example:
        >>> serialize_message_history(
        ...     system_prompt="You are helpful.",
        ...     user_message="What is 2+2?",
        ...     history=[
        ...         {"role": "user", "content": "Hi!"},
        ...         {"role": "assistant", "content": "Hello!"}
        ...     ]
        ... )
    """
    messages = []
    
    # Add system message
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    # Add history
    if history:
        for msg in history:
            role = msg.get("role")
            content = msg.get("content", "")
            
            if role not in {"user", "assistant"}:
                logger.warning(f"Skipping history message with invalid role '{role}'")
                continue
            
            messages.append({"role": role, "content": content})
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    return format_chatml_prompt(messages, add_generation_prompt=add_generation_prompt)


def get_chatml_stop_tokens(additional_stops: Optional[List[str]] = None) -> List[str]:
    """
    Get the list of stop tokens for ChatML format.
    
    Args:
        additional_stops: Optional additional stop tokens to include
    
    Returns:
        List of stop tokens to use with the model
    """
    stops = DEFAULT_STOP_TOKENS.copy()
    
    if additional_stops:
        stops.extend(additional_stops)
    
    return stops


def clean_chatml_response(text: str) -> str:
    """
    Clean ChatML artifacts from model response.
    
    Sometimes models may include ChatML tokens in their output.
    This function removes them to ensure clean responses.
    
    Args:
        text: Raw model output
        
    Returns:
        Cleaned text without ChatML tokens
    """
    if not text:
        return text
    
    # Remove any ChatML tokens that leaked into response
    cleaned = text
    
    # Remove start/end tokens
    cleaned = cleaned.replace(CHATML_START, "")
    cleaned = cleaned.replace(CHATML_END, "")
    
    # Remove role indicators if they appear at start
    for role in VALID_ROLES:
        # Check if response starts with role (e.g., "assistant\n")
        role_prefix = f"{role}\n"
        if cleaned.startswith(role_prefix):
            cleaned = cleaned[len(role_prefix):]
        # Also check without newline
        if cleaned.startswith(role):
            cleaned = cleaned[len(role):]
    
    # Remove common prefixes that might remain
    common_prefixes = ["assistant:", "Assistant:", "user:", "User:", "system:", "System:"]
    for prefix in common_prefixes:
        if cleaned.strip().startswith(prefix):
            cleaned = cleaned.strip()[len(prefix):].strip()
    
    return cleaned.strip()


def validate_chatml_format(prompt: str) -> bool:
    """
    Validate that a prompt is properly formatted in ChatML.
    
    Args:
        prompt: The prompt string to validate
        
    Returns:
        True if valid ChatML format, False otherwise
    """
    if not prompt:
        return False
    
    # Check for basic ChatML structure
    if CHATML_START not in prompt or CHATML_END not in prompt:
        return False
    
    # Count start and end tokens (should be balanced, or end count = start count - 1 if generation prompt)
    start_count = prompt.count(CHATML_START)
    end_count = prompt.count(CHATML_END)
    
    # Valid if balanced or if there's one more start (generation prompt)
    if end_count != start_count and end_count != start_count - 1:
        logger.warning(f"Unbalanced ChatML tokens: {start_count} starts, {end_count} ends")
        return False
    
    return True


def format_for_llama_server(
    system_prompt: str,
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    max_tokens: int = 512,
    temperature: float = 0.7,
    additional_stops: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Format a complete request payload for llama-server /completion endpoint.
    
    This is a convenience function that creates the full payload ready to send
    to llama-server.exe or any llama.cpp compatible server.
    
    Args:
        system_prompt: System instructions
        user_message: User's question
        history: Optional conversation history
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        additional_stops: Additional stop tokens beyond defaults
    
    Returns:
        Dict payload ready for llama-server /completion endpoint
        
    Example:
        >>> payload = format_for_llama_server(
        ...     system_prompt="You are helpful.",
        ...     user_message="Hi!",
        ...     max_tokens=256,
        ...     temperature=0.7
        ... )
        >>> # Send to server: requests.post(url + "/completion", json=payload)
    """
    prompt = serialize_message_history(
        system_prompt=system_prompt,
        user_message=user_message,
        history=history,
        add_generation_prompt=True
    )
    
    stop_tokens = get_chatml_stop_tokens(additional_stops)
    
    payload = {
        "prompt": prompt,
        "n_predict": max_tokens,
        "temperature": temperature,
        "stop": stop_tokens,
        "stream": False
    }
    
    return payload


def format_for_llama_server_stream(
    system_prompt: str,
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    max_tokens: int = 512,
    temperature: float = 0.7,
    additional_stops: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Format a complete streaming request payload for llama-server /completion endpoint.
    
    Same as format_for_llama_server but with stream=True.
    
    Args:
        system_prompt: System instructions
        user_message: User's question
        history: Optional conversation history
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        additional_stops: Additional stop tokens beyond defaults
    
    Returns:
        Dict payload ready for llama-server streaming /completion endpoint
    """
    payload = format_for_llama_server(
        system_prompt=system_prompt,
        user_message=user_message,
        history=history,
        max_tokens=max_tokens,
        temperature=temperature,
        additional_stops=additional_stops
    )
    
    payload["stream"] = True
    return payload


# Legacy support: Alternative format names for compatibility
def build_gguf_prompt(system_prompt: str, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Legacy function name for compatibility.
    Use serialize_message_history instead.
    """
    logger.warning("build_gguf_prompt is deprecated, use serialize_message_history instead")
    return serialize_message_history(system_prompt, user_message, history)


if __name__ == "__main__":
    # Example usage and testing
    print("=" * 70)
    print("ChatML Formatter - Example Usage")
    print("=" * 70)
    
    # Example 1: Simple prompt
    print("\n1. Simple user message:")
    simple = serialize_message_history(
        system_prompt="You are a helpful assistant.",
        user_message="What is the capital of France?"
    )
    print(simple)
    print(f"Valid: {validate_chatml_format(simple)}")
    
    # Example 2: With conversation history
    print("\n2. With conversation history:")
    with_history = serialize_message_history(
        system_prompt="You are a helpful assistant.",
        user_message="What about Germany?",
        history=[
            {"role": "user", "content": "What is the capital of France?"},
            {"role": "assistant", "content": "The capital of France is Paris."}
        ]
    )
    print(with_history)
    print(f"Valid: {validate_chatml_format(with_history)}")
    
    # Example 3: Complete payload for llama-server
    print("\n3. Complete llama-server payload:")
    payload = format_for_llama_server(
        system_prompt="You are a helpful assistant.",
        user_message="Tell me a joke.",
        max_tokens=128,
        temperature=0.8
    )
    import json
    print(json.dumps(payload, indent=2))
    
    # Example 4: Clean response
    print("\n4. Cleaning ChatML from response:")
    dirty_response = "<|im_start|>assistant\nThis is a response with tokens<|im_end|>"
    clean = clean_chatml_response(dirty_response)
    print(f"Dirty: {dirty_response}")
    print(f"Clean: {clean}")
    
    print("\n" + "=" * 70)
