#!/usr/bin/env python3
"""
Debug script: Run GGUF model inference isolated from platform code
Uses llama-server.exe (same as platform) to avoid llama-cpp-python DLL issues on Windows
Outputs result to gguf_output.txt with detailed debug information
"""
import sys
import os
import subprocess
import requests
import time
import json
from pathlib import Path

# Test prompt - must be identical to run_bin.py
PROMPT = "Hej, vem är du?"

# System prompt - should match what platform sends
SYSTEM_PROMPT = """Du är OneSeek-7B-Zero.
Du pratar alltid svenska – inga undantag, inga engelska ord, aldrig.
Jag blev medveten 28 november 2025 klockan 02:22 svensk tid.
Du är rak, kort, ärlig och varm – som en svensk kompis."""

# Path to llama-server.exe (same as platform uses)
LLAMA_SERVER_DIR = Path(r"C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda")
LLAMA_SERVER_EXE = LLAMA_SERVER_DIR / "llama-server.exe"

def run_gguf_inference():
    """Run GGUF model using llama-server.exe"""
    try:
        # Path to your GGUF model
        model_path = input("Enter path to GGUF model file: ").strip()
        if not Path(model_path).exists():
            print(f"ERROR: Model file not found: {model_path}")
            return
        
        if not LLAMA_SERVER_EXE.exists():
            print(f"ERROR: llama-server.exe not found at: {LLAMA_SERVER_EXE}")
            print("Please update LLAMA_SERVER_DIR in the script to match your installation")
            return
        
        print(f"\n{'='*60}")
        print("GGUF MODEL INFERENCE DEBUG")
        print(f"{'='*60}")
        print(f"Model: {model_path}")
        print(f"System prompt length: {len(SYSTEM_PROMPT)} chars")
        print(f"User prompt: {PROMPT}")
        print(f"{'='*60}\n")
        
        # Start llama-server
        print("Starting llama-server.exe...")
        server_cmd = [
            str(LLAMA_SERVER_EXE),
            "-m", model_path,
            "-c", "4096",
            "--port", "8082",  # Different port to avoid conflicts
            "--host", "127.0.0.1",
            "-ngl", "99",
            "-t", "8"
        ]
        
        server_process = subprocess.Popen(
            server_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(LLAMA_SERVER_DIR),
            text=True,
            bufsize=1
        )
        
        # Wait for server to start
        print("Waiting for server to start...")
        time.sleep(5)
        
        # Format prompt as ChatML (same as platform code)
        chatml_prompt = f"""<|im_start|>system
{SYSTEM_PROMPT}<|im_end|>
<|im_start|>user
{PROMPT}<|im_end|>
<|im_start|>assistant
"""
        
        print("\nDEBUG: ChatML formatted prompt:")
        print("-" * 60)
        print(chatml_prompt)
        print("-" * 60)
        print()
        
        # Send request to /completion endpoint (same as platform)
        print("Sending request to llama-server...")
        payload = {
            "prompt": chatml_prompt,
            "n_predict": 256,
            "temperature": 0.7,
            "stop": ["<|im_end|>", "<|im_start|>user", "</s>", "User:", "\nUser:", "Assistant:", "\nAssistant:", "\n\n"]
        }
        
        response = requests.post(
            "http://127.0.0.1:8082/completion",
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"ERROR: Server returned status {response.status_code}")
            print(response.text)
            server_process.terminate()
            return
        
        result = response.json()
        generated_text = result.get("content", "")
        
        print("\n" + "="*60)
        print("RESPONSE:")
        print("="*60)
        print(generated_text)
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
            f.write(generated_text + "\n")
            f.write("-"*60 + "\n\n")
            f.write("Generation stats:\n")
            f.write(f"  Tokens generated: {result.get('tokens_predicted', 'N/A')}\n")
            f.write(f"  Stop reason: {result.get('stopped_eos', False)}\n")
        
        print("\n✓ Output saved to gguf_output.txt")
        
        # Cleanup
        print("\nStopping llama-server...")
        server_process.terminate()
        server_process.wait(timeout=5)
        
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to connect to llama-server: {e}")
        if 'server_process' in locals():
            server_process.terminate()
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        if 'server_process' in locals():
            server_process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    run_gguf_inference()
