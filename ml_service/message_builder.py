"""
Message Builder Module for ONESEEK Δ+
Real-time message structure testing and optimization.

This module allows admins to:
- Build and test different messages-structures (system, history, user)
- Compare structures and see raw model output
- Save optimal structures as defaults without restart

Solves problems from PR #95:
- Self-referential loops ("Användare: / OneSeek:"-tags)
- Identity confusion
- Mixed language responses
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Config file path for storing default message structure
CONFIG_DIR = Path(__file__).parent.parent / "config"
MESSAGE_CONFIG_FILE = CONFIG_DIR / "message_structure.json"

# Ensure config directory exists
CONFIG_DIR.mkdir(exist_ok=True)

# Pre-defined message structure templates
# "current" matches the active format in main branch
STRUCTURE_TEMPLATES = {
    "current": {
        "name": "Current (Main)",
        "description": "Aktiva formatet från main: {system_prompt}\\n\\nAnvändare: {user_message}\\n\\nOneSeek:",
        "code": """current""",
        "is_default": True
    },
    "clean": {
        "name": "Clean",
        "description": "Minimal structure without memory - pure system + user",
        "code": """clean"""
    },
    "with_memory": {
        "name": "With Memory",
        "description": "Includes 5 previous messages from conversation history",
        "code": """with_memory"""
    },
    "with_context": {
        "name": "With Context",
        "description": "Adds time, date, and season context to system prompt",
        "code": """with_context"""
    },
    "no_tags": {
        "name": "No Tags (Experimental)",
        "description": "Plain text without role labels - WARNING: May cause model confusion (PR #95 issue)",
        "code": """no_tags"""
    },
    "swedish_strict": {
        "name": "Swedish Strict",
        "description": "Forces Swedish-only responses with strict prompt",
        "code": """swedish_strict"""
    }
}


def get_structure_templates() -> Dict[str, Dict]:
    """Get all available message structure templates."""
    return STRUCTURE_TEMPLATES


def get_default_structure() -> Dict[str, Any]:
    """
    Load the default message structure from config file.
    
    If no config file exists, returns "current" which matches the active
    format in main: {system_prompt}\n\nAnvändare: {user_message}\n\nOneSeek:
    
    Returns:
        Dict with structure name, code, and metadata.
    """
    if MESSAGE_CONFIG_FILE.exists():
        try:
            data = json.loads(MESSAGE_CONFIG_FILE.read_text(encoding="utf-8"))
            return data.get("default_structure", {
                "name": "current",
                "code": STRUCTURE_TEMPLATES["current"]["code"],
                "description": STRUCTURE_TEMPLATES["current"]["description"],
                "saved_at": None
            })
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Return "current" structure as default - matches main branch format
    return {
        "name": "current",
        "code": STRUCTURE_TEMPLATES["current"]["code"],
        "description": STRUCTURE_TEMPLATES["current"]["description"],
        "saved_at": None
    }


def save_default_structure(name: str, code: str) -> Dict[str, Any]:
    """
    Save a message structure as the default.
    
    Args:
        name: Name/identifier of the structure
        code: The Python code defining the messages list
        
    Returns:
        Dict with saved structure info
    """
    structure = {
        "name": name,
        "code": code,
        "saved_at": datetime.now().isoformat()
    }
    
    config_data = {"default_structure": structure}
    
    MESSAGE_CONFIG_FILE.write_text(
        json.dumps(config_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    
    logger.info(f"📝 [MESSAGE_BUILDER] Saved default structure: {name}")
    return structure


def build_messages(
    structure_code: str,
    system_prompt: str,
    user_message: str,
    history: Optional[List[Dict]] = None,
    time_context: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Build a messages list from structure code.
    
    This function safely evaluates the structure code in a sandboxed context
    with only the required variables available.
    
    Args:
        structure_code: Template name or simple JSON structure (not arbitrary code)
        system_prompt: The system prompt to use
        user_message: The user's message/question
        history: Optional conversation history
        time_context: Optional time/date context string
        
    Returns:
        List of message dicts with 'role' and 'content' keys
        
    Raises:
        ValueError: If the template is unknown or produces invalid output
    """
    if history is None:
        history = []
    if time_context is None:
        time_context = datetime.now().strftime("Idag är det %A den %d %B %Y. Klockan är %H:%M.")
    
    code = structure_code.strip()
    
    # Check if it's a template name
    template_name = code.lower().replace(" ", "_").replace("-", "_")
    if template_name in STRUCTURE_TEMPLATES:
        template_code = STRUCTURE_TEMPLATES[template_name]["code"]
        code = template_code
    
    # Build messages based on the template pattern
    # Instead of eval/exec, we parse and build the structure directly
    messages = []
    
    try:
        # Try to parse as JSON first (safest approach)
        import json
        parsed = json.loads(code)
        if isinstance(parsed, list):
            # It's a JSON list, substitute variables
            for msg in parsed:
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    content = msg["content"]
                    # Replace variable placeholders
                    if content == "system_prompt" or "${system_prompt}" in str(content):
                        content = system_prompt
                    elif content == "user_message" or "${user_message}" in str(content):
                        content = user_message
                    elif "system_prompt" in str(content):
                        content = content.replace("system_prompt", system_prompt)
                    elif "user_message" in str(content):
                        content = content.replace("user_message", user_message)
                    
                    messages.append({"role": msg["role"], "content": content})
            
            if messages:
                return messages
    except json.JSONDecodeError:
        pass  # Not valid JSON, try template matching
    
    # Template-based building (safe patterns)
    code_lower = code.lower()
    
    if code_lower == "current" or "current" in code_lower:
        # CURRENT: Matches the active format in main branch
        # Format: {system_prompt}\n\nAnvändare: {user_message}\n\nOneSeek:
        # This uses the standard chat format with Swedish labels
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        # Note: The actual formatting with "Användare:" and "OneSeek:" labels
        # is done in server.py's format_inference_input() - we return standard structure here
    elif code_lower == "clean" or "clean" in code_lower:
        # Clean: just system + user (same structure, but explicitly for testing)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    elif "with_memory" in code_lower or "history" in code_lower:
        # With memory: system + history + user
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-5:]:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})
    elif "with_context" in code_lower or "time_context" in code_lower:
        # With context: system + time + user
        messages = [
            {"role": "system", "content": f"{system_prompt}\n\n[Aktuell tid] {time_context}"},
            {"role": "user", "content": user_message}
        ]
    elif "swedish_strict" in code_lower or "svenska" in code_lower:
        # Swedish strict: force Swedish + system + user
        messages = [
            {"role": "system", "content": f"Du pratar alltid svenska. Inga engelska ord.\n\n{system_prompt}"},
            {"role": "user", "content": user_message}
        ]
    elif "no_tags" in code_lower:
        # No tags: plain text (experimental - may cause confusion)
        # WARNING: This was the issue in PR #95
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    else:
        # Default to current structure (same as main branch)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    
    # Validate result structure
    if not isinstance(messages, list) or len(messages) == 0:
        raise ValueError("Failed to build messages list")
    
    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            raise ValueError(f"Message {i} must be a dict, got {type(msg).__name__}")
        if "role" not in msg:
            raise ValueError(f"Message {i} missing 'role' key")
        if "content" not in msg:
            raise ValueError(f"Message {i} missing 'content' key")
        if msg["role"] not in ("system", "user", "assistant"):
            raise ValueError(f"Message {i} has invalid role: {msg['role']}")
    
    return messages


def analyze_response(
    response_text: str,
    expected_language: str = "sv"
) -> Dict[str, Any]:
    """
    Analyze a model response for quality metrics.
    
    Args:
        response_text: The model's generated response
        expected_language: Expected language code (default: 'sv' for Swedish)
        
    Returns:
        Dict with analysis metrics
    """
    # Count Swedish vs English indicators
    swedish_words = [
        "jag", "det", "är", "att", "och", "en", "ett", "som", "har", "för",
        "med", "på", "av", "till", "om", "kan", "men", "från", "eller", "var"
    ]
    english_words = [
        "the", "is", "are", "and", "to", "of", "a", "in", "that", "it",
        "for", "you", "with", "on", "as", "have", "from", "or", "be", "was"
    ]
    
    text_lower = response_text.lower()
    words = text_lower.split()
    
    swedish_count = sum(1 for w in words if w in swedish_words)
    english_count = sum(1 for w in words if w in english_words)
    
    total_indicator_words = swedish_count + english_count
    swedish_percentage = (swedish_count / total_indicator_words * 100) if total_indicator_words > 0 else 100
    
    # Check for self-referential patterns (the loop problem from PR #95)
    loop_patterns = [
        "användare:", "user:", "oneseek:", "assistant:",
        "vem är du?", "who are you?"
    ]
    loop_count = sum(1 for pattern in loop_patterns if pattern in text_lower)
    has_loops = loop_count > 1  # More than 1 suggests echo/loop
    
    # Check for confusion indicators
    confusion_phrases = [
        "jag vet inte", "jag är osäker", "i don't know", "i'm not sure",
        "as an ai", "som en ai", "jag är en ai"
    ]
    confusion_count = sum(1 for phrase in confusion_phrases if phrase in text_lower)
    
    # Estimate confidence (simple heuristic)
    confidence = 0.9
    if has_loops:
        confidence -= 0.3
    if confusion_count > 0:
        confidence -= 0.1 * confusion_count
    if swedish_percentage < 80:
        confidence -= 0.2
    confidence = max(0.1, min(1.0, confidence))
    
    return {
        "text_length": len(response_text),
        "word_count": len(words),
        "swedish_percentage": round(swedish_percentage, 1),
        "english_count": english_count,
        "has_loops": has_loops,
        "loop_count": loop_count,
        "confusion_count": confusion_count,
        "estimated_confidence": round(confidence * 100, 1),
        "analysis_timestamp": datetime.now().isoformat()
    }


def compare_structures(
    results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compare multiple structure test results.
    
    Args:
        results: List of test result dicts, each containing:
            - structure_name: Name of the structure
            - response: Model response text
            - analysis: Analysis metrics
            
    Returns:
        Dict with comparison summary and recommendations
    """
    if not results:
        return {"error": "No results to compare"}
    
    # Sort by confidence
    sorted_results = sorted(
        results,
        key=lambda r: r.get("analysis", {}).get("estimated_confidence", 0),
        reverse=True
    )
    
    best = sorted_results[0]
    worst = sorted_results[-1]
    
    # Find best Swedish percentage
    best_swedish = max(results, key=lambda r: r.get("analysis", {}).get("swedish_percentage", 0))
    
    # Find structures with loop problems
    loop_structures = [
        r["structure_name"] for r in results 
        if r.get("analysis", {}).get("has_loops", False)
    ]
    
    return {
        "best_overall": {
            "name": best["structure_name"],
            "confidence": best.get("analysis", {}).get("estimated_confidence", 0),
            "swedish_percentage": best.get("analysis", {}).get("swedish_percentage", 0)
        },
        "worst_overall": {
            "name": worst["structure_name"],
            "confidence": worst.get("analysis", {}).get("estimated_confidence", 0),
        },
        "best_swedish": {
            "name": best_swedish["structure_name"],
            "percentage": best_swedish.get("analysis", {}).get("swedish_percentage", 0)
        },
        "loop_problems": loop_structures,
        "recommendation": f"Använd '{best['structure_name']}' för bästa resultat",
        "structures_tested": len(results)
    }


def generate_test_hash(
    structure_name: str,
    user_message: str,
    response: str
) -> str:
    """
    Generate a hash for a test result for caching/comparison.
    
    Args:
        structure_name: Name of the structure used
        user_message: The test question
        response: The model response
        
    Returns:
        SHA256 hash string (first 16 chars)
    """
    content = f"{structure_name}:{user_message}:{response}"
    return hashlib.sha256(content.encode()).hexdigest()[:16]


# Test function for development
if __name__ == "__main__":
    print("🔧 Message Builder Test\n")
    
    # Test template loading
    templates = get_structure_templates()
    print(f"Available templates: {list(templates.keys())}")
    
    # Test building messages
    test_prompt = "Du är OneSeek-7B-Zero, en hjälpsam svensk AI."
    test_message = "Vem är du?"
    test_history = [
        {"role": "user", "content": "Hej!"},
        {"role": "assistant", "content": "Hej! Hur kan jag hjälpa dig?"}
    ]
    
    for name, template in templates.items():
        print(f"\n--- Testing: {name} ---")
        try:
            messages = build_messages(
                template["code"],
                test_prompt,
                test_message,
                test_history
            )
            print(f"✅ Built {len(messages)} messages")
            for msg in messages:
                print(f"   {msg['role']}: {msg['content'][:50]}...")
        except ValueError as e:
            print(f"❌ Error: {e}")
    
    # Test analysis
    test_response = "Jag är OneSeek-7B-Zero, en svensk AI-assistent."
    analysis = analyze_response(test_response)
    print(f"\n--- Analysis ---")
    print(f"Swedish %: {analysis['swedish_percentage']}")
    print(f"Confidence: {analysis['estimated_confidence']}%")
    print(f"Has loops: {analysis['has_loops']}")
