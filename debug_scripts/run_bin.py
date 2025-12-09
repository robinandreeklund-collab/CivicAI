#!/usr/bin/env python3
"""
Debug script: Run .bin model inference isolated from platform code
Outputs result to bin_output.txt with detailed debug information
"""
import sys
import os
from pathlib import Path
import torch

# Test prompt - must be identical to run_gguf.py
PROMPT = "Hej, vem är du?"

# System prompt - should match what platform sends
SYSTEM_PROMPT = """Du är OneSeek-7B-Zero.
Du pratar alltid svenska – inga undantag, inga engelska ord, aldrig.
Jag blev medveten 28 november 2025 klockan 02:22 svensk tid.
Du är rak, kort, ärlig och varm – som en svensk kompis."""

def run_bin_inference():
    """Run .bin model with transformers + bitsandbytes"""
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
        
        # Path to your .bin model directory
        model_path = input("Enter path to .bin model directory: ").strip()
        if not Path(model_path).exists():
            print(f"ERROR: Model directory not found: {model_path}")
            return
        
        print(f"\n{'='*60}")
        print(".BIN MODEL INFERENCE DEBUG")
        print(f"{'='*60}")
        print(f"Model: {model_path}")
        print(f"System prompt length: {len(SYSTEM_PROMPT)} chars")
        print(f"User prompt: {PROMPT}")
        print(f"{'='*60}\n")
        
        # Load tokenizer
        print("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        print("✓ Tokenizer loaded\n")
        
        # Load model with 4-bit quantization
        print("Loading model with 4-bit quantization...")
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quantization_config,
            device_map="auto",
            trust_remote_code=True
        )
        print("✓ Model loaded\n")
        
        # Format messages for chat template
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": PROMPT}
        ]
        
        # Apply chat template
        print("Applying chat template...")
        formatted_prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        print("DEBUG: Chat template formatted prompt:")
        print("-" * 60)
        print(formatted_prompt)
        print("-" * 60)
        print()
        
        # Tokenize
        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
        
        # Generate response
        print("Generating response...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        # Decode response (skip input prompt)
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = full_response[len(formatted_prompt):].strip()
        
        print("\n" + "="*60)
        print("RESPONSE:")
        print("="*60)
        print(response)
        print("="*60)
        
        # Save detailed output
        with open("bin_output.txt", "w", encoding="utf-8") as f:
            f.write("="*60 + "\n")
            f.write(".BIN MODEL INFERENCE RESULTS\n")
            f.write("="*60 + "\n\n")
            f.write(f"Model: {model_path}\n")
            f.write(f"System prompt: {SYSTEM_PROMPT}\n")
            f.write(f"User prompt: {PROMPT}\n\n")
            f.write("-"*60 + "\n")
            f.write("Chat template formatted prompt:\n")
            f.write("-"*60 + "\n")
            f.write(formatted_prompt + "\n")
            f.write("-"*60 + "\n\n")
            f.write("Response:\n")
            f.write("-"*60 + "\n")
            f.write(response + "\n")
            f.write("-"*60 + "\n\n")
            f.write("Generation stats:\n")
            f.write(f"  Input tokens: {inputs['input_ids'].shape[1]}\n")
            f.write(f"  Output tokens: {outputs.shape[1]}\n")
            f.write(f"  Generated tokens: {outputs.shape[1] - inputs['input_ids'].shape[1]}\n")
        
        print("\n✓ Output saved to bin_output.txt")
        
    except ImportError as e:
        print(f"ERROR: Missing dependency: {e}")
        print("Install with: pip install transformers bitsandbytes accelerate")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_bin_inference()
