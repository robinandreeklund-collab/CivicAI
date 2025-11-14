#!/usr/bin/env python3
"""
BERT Extractive Summarizer Service
Uses BERT-based extractive summarization to create neutral, high-precision summaries
from multiple AI responses with minimal bias.
"""

import sys
import json

try:
    from summarizer import Summarizer
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False

def summarize_responses(responses, question, min_length=100, max_length=500):
    """
    Generate a neutral extractive summary from multiple AI responses using BERT.
    
    Args:
        responses (list): List of response texts from different AI services
        question (str): The original question
        min_length (int): Minimum summary length in characters
        max_length (int): Maximum summary length in characters
    
    Returns:
        dict: Summary result with text and metadata
    """
    if not BERT_AVAILABLE:
        return {
            "success": False,
            "error": "BERT library not installed. Run: pip install bert-extractive-summarizer",
            "fallback": True
        }
    
    try:
        # Initialize BERT Extractive Summarizer
        model = Summarizer()
        
        # Combine all responses into a single document
        combined_text = "\n\n".join([
            f"[Svar {i+1}]: {resp}" 
            for i, resp in enumerate(responses) if resp and len(resp.strip()) > 0
        ])
        
        if not combined_text.strip():
            return {
                "success": False,
                "error": "No valid responses to summarize"
            }
        
        # Calculate ratio for summary (aim for 30-40% of original length)
        original_length = len(combined_text)
        target_ratio = min(0.4, max(0.2, max_length / original_length))
        
        # Generate extractive summary using BERT
        # This extracts the most important sentences while maintaining neutrality
        summary_text = model(
            combined_text,
            ratio=target_ratio,
            min_length=min_length,
            max_length=max_length
        )
        
        # Clean up the summary
        summary_text = summary_text.strip()
        
        # Remove the "[Svar X]:" prefixes if they appear in the summary
        import re
        summary_text = re.sub(r'\[Svar \d+\]:\s*', '', summary_text)
        
        return {
            "success": True,
            "summary": summary_text,
            "metadata": {
                "original_length": original_length,
                "summary_length": len(summary_text),
                "compression_ratio": round(len(summary_text) / original_length, 2),
                "num_responses": len([r for r in responses if r and len(r.strip()) > 0]),
                "method": "BERT Extractive Summarization"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fallback": True
        }

def main():
    """
    Main entry point for the script.
    Reads JSON input from stdin and outputs JSON to stdout.
    """
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        responses = input_data.get('responses', [])
        question = input_data.get('question', '')
        min_length = input_data.get('min_length', 100)
        max_length = input_data.get('max_length', 500)
        
        # Generate summary
        result = summarize_responses(responses, question, min_length, max_length)
        
        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Python service error: {str(e)}",
            "fallback": True
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
