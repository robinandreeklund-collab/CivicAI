#!/usr/bin/env python3
"""
Debug script: Run GGUF model inference isolated from platform code
Outputs result to gguf_output.txt with detailed debug information
"""
import sys
import os
from pathlib import Path

# Test prompt - must be identical to run_bin.py
PROMPT = "Hej, vem är du?"

# System prompt - should match what platform sends
SYSTEM_PROMPT = """Du är OneSeek-7B-Zero.
Du pratar alltid svenska – inga undantag, inga engelska ord, aldrig.
Jag blev medveten 28 november 2025 klockan 02:22 svensk tid.
Du är rak, kort, ärlig och varm – som en svensk kompis."""

def run_gguf_inference():
    """Run GGUF model with llama-cpp-python"""
    try:
        from llama_cpp import Llama
        
        # Path to your GGUF model
        model_path = input("Enter path to GGUF model file: ").strip()
        if not Path(model_path).exists():
            print(f"ERROR: Model file not found: {model_path}")
            return
        
        print(f"\n{'='*60}")
        print("GGUF MODEL INFERENCE DEBUG")
        print(f"{'='*60}")
        print(f"Model: {model_path}")
        print(f"System prompt length: {len(SYSTEM_PROMPT)} chars")
        print(f"User prompt: {PROMPT}")
        print(f"{'='*60}\n")
        
        # Load model
        print("Loading GGUF model...")
        llm = Llama(
            model_path=model_path,
            n_ctx=4096,
            n_gpu_layers=-1,  # Use GPU if available
            verbose=False
        )
        print("✓ Model loaded\n")
        
        # Format prompt as ChatML
        chatml_prompt = f"""<|im_start|>system
{SYSTEM_PROMPT}<|im_end|>
<|im_start|>user
{PROMPT}<|im_end|>
<|im_start|>assistant
"""
        
        print("DEBUG: ChatML formatted prompt:")
        print("-" * 60)
        print(chatml_prompt)
        print("-" * 60)
        print()
        
        # Generate response
        print("Generating response...")
        output = llm(
            chatml_prompt,
            max_tokens=256,
            temperature=0.7,
            stop=["<|im_end|>", "<|im_start|>user", "</s>", "User:", "\nUser:", "Assistant:", "\nAssistant:", "\n\n"],
            echo=False
        )
        
        response = output['choices'][0]['text']
        
        print("\n" + "="*60)
        print("RESPONSE:")
        print("="*60)
        print(response)
        print("="*60)
        
        # Save detailed output
        with open("gguf_output.txt", "w", encoding="utf-8") as f:
            f.write("="*60 + "\n")
            f.write("GGUF MODEL INFERENCE RESULTS\n")
            f.write("="*60 + "\n\n")
            f.write(f"Model: {model_path}\n")
            f.write(f"System prompt: {SYSTEM_PROMPT}\n")
            f.write(f"User prompt: {PROMPT}\n\n")
            f.write("-"*60 + "\n")
            f.write("ChatML formatted prompt:\n")
            f.write("-"*60 + "\n")
            f.write(chatml_prompt + "\n")
            f.write("-"*60 + "\n\n")
            f.write("Response:\n")
            f.write("-"*60 + "\n")
            f.write(response + "\n")
            f.write("-"*60 + "\n\n")
            f.write("Generation stats:\n")
            f.write(f"  Tokens generated: {output['usage']['completion_tokens']}\n")
            f.write(f"  Total tokens: {output['usage']['total_tokens']}\n")
            f.write(f"  Stop reason: {output['choices'][0].get('finish_reason', 'unknown')}\n")
        
        print("\n✓ Output saved to gguf_output.txt")
        
    except ImportError:
        print("ERROR: llama-cpp-python not installed")
        print("Install with: pip install llama-cpp-python")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_gguf_inference()
