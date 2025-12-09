#!/usr/bin/env python3
"""
Debug script: Compare GGUF vs .bin model outputs
Analyzes differences without loading models
"""
import sys
from pathlib import Path
import difflib

def load_output(filename):
    """Load output file and extract key information"""
    filepath = Path(filename)
    if not filepath.exists():
        return None
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract sections
    sections = {}
    current_section = None
    section_content = []
    
    for line in content.split('\n'):
        if line.startswith("Model:"):
            sections['model'] = line.split("Model:", 1)[1].strip()
        elif line.startswith("System prompt:"):
            sections['system_prompt'] = line.split("System prompt:", 1)[1].strip()
        elif line.startswith("User prompt:"):
            sections['user_prompt'] = line.split("User prompt:", 1)[1].strip()
        elif "formatted prompt:" in line.lower():
            current_section = 'formatted_prompt'
            section_content = []
        elif "Response:" in line and current_section != 'response':
            if current_section == 'formatted_prompt':
                sections['formatted_prompt'] = '\n'.join(section_content).strip()
            current_section = 'response'
            section_content = []
        elif line.startswith("-" * 60) or line.startswith("=" * 60):
            continue
        elif current_section:
            section_content.append(line)
    
    # Save last section
    if current_section == 'response':
        sections['response'] = '\n'.join(section_content).strip()
    
    return sections

def compare_outputs():
    """Compare GGUF and .bin outputs"""
    print("\n" + "="*70)
    print("GGUF vs .BIN MODEL OUTPUT COMPARISON")
    print("="*70 + "\n")
    
    # Load outputs
    gguf = load_output("gguf_output.txt")
    bin_model = load_output("bin_output.txt")
    
    if not gguf:
        print("ERROR: gguf_output.txt not found. Run run_gguf.py first.")
        return
    
    if not bin_model:
        print("ERROR: bin_output.txt not found. Run run_bin.py first.")
        return
    
    # Compare formatted prompts
    print("1. FORMATTED PROMPTS COMPARISON")
    print("-" * 70)
    
    gguf_prompt = gguf.get('formatted_prompt', '')
    bin_prompt = bin_model.get('formatted_prompt', '')
    
    if gguf_prompt == bin_prompt:
        print("✓ IDENTICAL - Both models receive the exact same formatted prompt")
    else:
        print("✗ DIFFERENT - Models receive different formatted prompts!")
        print("\nGGUF prompt:")
        print(repr(gguf_prompt[:200]))
        print("\n.BIN prompt:")
        print(repr(bin_prompt[:200]))
        
        print("\nDetailed diff:")
        diff = difflib.unified_diff(
            gguf_prompt.splitlines(keepends=True),
            bin_prompt.splitlines(keepends=True),
            fromfile='GGUF',
            tofile='.BIN',
            lineterm=''
        )
        print(''.join(diff))
    
    print("\n")
    
    # Compare responses
    print("2. RESPONSE COMPARISON")
    print("-" * 70)
    
    gguf_response = gguf.get('response', '')
    bin_response = bin_model.get('response', '')
    
    print(f"GGUF response length: {len(gguf_response)} chars")
    print(f".BIN response length: {len(bin_response)} chars")
    print()
    
    # Check for problematic patterns
    gguf_issues = []
    bin_issues = []
    
    if "User:" in gguf_response or "Assistant:" in gguf_response:
        gguf_issues.append("Contains 'User:' or 'Assistant:' markers")
    if "User:" in bin_response or "Assistant:" in bin_response:
        bin_issues.append("Contains 'User:' or 'Assistant:' markers")
    
    if gguf_response.count("OneSeek") > 3:
        gguf_issues.append(f"Repetitive 'OneSeek' ({gguf_response.count('OneSeek')} times)")
    if bin_response.count("OneSeek") > 3:
        bin_issues.append(f"Repetitive 'OneSeek' ({bin_response.count('OneSeek')} times)")
    
    # Check for looping patterns
    words = gguf_response.split()
    if len(words) > 10 and len(set(words[-10:])) < 5:
        gguf_issues.append("Possible looping detected in last 10 words")
    
    words = bin_response.split()
    if len(words) > 10 and len(set(words[-10:])) < 5:
        bin_issues.append("Possible looping detected in last 10 words")
    
    print("GGUF Issues:")
    if gguf_issues:
        for issue in gguf_issues:
            print(f"  ✗ {issue}")
    else:
        print("  ✓ No issues detected")
    
    print("\n.BIN Issues:")
    if bin_issues:
        for issue in bin_issues:
            print(f"  ✗ {issue}")
    else:
        print("  ✓ No issues detected")
    
    print("\n")
    
    # Show actual responses
    print("3. ACTUAL RESPONSES")
    print("-" * 70)
    print("\nGGUF Response:")
    print(gguf_response)
    print("\n" + "-" * 70)
    print("\n.BIN Response:")
    print(bin_response)
    print("\n" + "-" * 70)
    
    # Similarity analysis
    print("\n4. SIMILARITY ANALYSIS")
    print("-" * 70)
    
    matcher = difflib.SequenceMatcher(None, gguf_response, bin_response)
    similarity = matcher.ratio() * 100
    
    print(f"Response similarity: {similarity:.1f}%")
    
    if similarity < 50:
        print("⚠ VERY DIFFERENT responses - likely different behavior")
    elif similarity < 80:
        print("⚠ SOMEWHAT DIFFERENT responses - minor variations")
    else:
        print("✓ SIMILAR responses - consistent behavior")
    
    print("\n" + "="*70)
    print("ANALYSIS COMPLETE")
    print("="*70 + "\n")
    
    # Summary
    print("SUMMARY:")
    if gguf_prompt != bin_prompt:
        print("• Prompts are DIFFERENT - this is likely the root cause")
    else:
        print("• Prompts are IDENTICAL")
    
    if gguf_issues and not bin_issues:
        print("• GGUF has issues, .BIN works correctly")
        print("• Problem is likely in GGUF inference or stop token handling")
    elif not gguf_issues and bin_issues:
        print("• .BIN has issues, GGUF works correctly")
    elif gguf_issues and bin_issues:
        print("• Both have issues - check system prompt or model")
    else:
        print("• Both appear to work correctly")
    
    print()

if __name__ == "__main__":
    compare_outputs()
