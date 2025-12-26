"""
Tavily Data Summarization Module for OneSeek

This module provides backend summarization of raw Tavily search results to create
clean, structured, and token-efficient data for injection into OneSeek's final prompt.

Reduces noise, improves factual precision, and optimizes token usage.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn")

# Configuration
SUMMARIZER_MODEL = "facebook/mbart-large-50"  # Multilingual model supporting Swedish
SUMMARIZER_MAX_LENGTH = 150  # Target summary length in tokens
SUMMARIZER_MIN_LENGTH = 50   # Minimum summary length
SUMMARIZER_ENABLED = True     # Can be toggled via config

# Lazy load transformers to avoid import time overhead
_summarizer_pipeline = None
_summarizer_loaded = False


def _load_summarizer():
    """Lazy load the summarization pipeline"""
    global _summarizer_pipeline, _summarizer_loaded
    
    if _summarizer_loaded:
        return _summarizer_pipeline
    
    try:
        from transformers import pipeline
        import torch
        
        # Determine device
        device = 0 if torch.cuda.is_available() else -1  # GPU if available, else CPU
        device_name = "GPU" if device == 0 else "CPU"
        
        logger.info(f"[TAVILY-SUMMARIZER] Loading summarization model on {device_name}...")
        
        # Load mBART model for multilingual summarization
        _summarizer_pipeline = pipeline(
            "summarization",
            model=SUMMARIZER_MODEL,
            device=device,
            torch_dtype=torch.float16 if device == 0 else torch.float32
        )
        
        _summarizer_loaded = True
        logger.info(f"[TAVILY-SUMMARIZER] Model loaded successfully on {device_name}")
        return _summarizer_pipeline
        
    except Exception as e:
        logger.error(f"[TAVILY-SUMMARIZER] Failed to load summarization model: {e}")
        logger.warning(f"[TAVILY-SUMMARIZER] Falling back to extraction-based summarization")
        _summarizer_loaded = True  # Mark as loaded to avoid retry
        return None


def _extract_key_sentences(text: str, max_sentences: int = 5) -> str:
    """
    Fallback extraction-based summarization.
    Extracts the most important sentences based on simple heuristics.
    """
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]
    
    # Prioritize sentences with numbers, Swedish keywords, and proper nouns
    scored_sentences = []
    for sent in sentences[:15]:  # Only consider first 15 sentences
        score = 0
        sent_lower = sent.lower()
        
        # Boost sentences with numbers/statistics
        if any(char.isdigit() for char in sent):
            score += 3
        
        # Boost sentences with Swedish data keywords
        data_keywords = ['procent', 'miljoner', 'miljarder', 'enligt', 'visar', 'statistik', 
                        'undersökning', 'studie', 'forskning', 'rapport', 'scb', 'data']
        score += sum(2 for kw in data_keywords if kw in sent_lower)
        
        # Boost longer, more substantive sentences
        if len(sent) > 80:
            score += 1
        
        scored_sentences.append((score, sent))
    
    # Sort by score and take top sentences
    scored_sentences.sort(reverse=True, key=lambda x: x[0])
    selected = [sent for _, sent in scored_sentences[:max_sentences]]
    
    return '. '.join(selected) + '.'


def summarize_tavily_content(content: str, target_length: int = 150) -> str:
    """
    Summarize a single piece of Tavily content using ML model or extraction.
    
    Args:
        content: Raw text content from Tavily
        target_length: Target summary length in tokens
        
    Returns:
        Summarized text in Swedish
    """
    if not content or len(content) < 100:
        return content
    
    # Check if model-based summarization is available
    summarizer = _load_summarizer()
    
    if summarizer and SUMMARIZER_ENABLED:
        try:
            # Truncate very long content to avoid model limits
            max_input_tokens = 1000
            if len(content.split()) > max_input_tokens:
                content = ' '.join(content.split()[:max_input_tokens])
            
            # Generate summary
            summary = summarizer(
                content,
                max_length=target_length,
                min_length=SUMMARIZER_MIN_LENGTH,
                do_sample=False,
                truncation=True
            )
            
            return summary[0]['summary_text']
            
        except Exception as e:
            logger.warning(f"[TAVILY-SUMMARIZER] Model summarization failed: {e}, using extraction")
            return _extract_key_sentences(content)
    else:
        # Fallback to extraction-based summarization
        return _extract_key_sentences(content)


def structure_tavily_data(tavily_results: List[Dict[str, Any]]) -> str:
    """
    Structure and summarize multiple Tavily search results into clean, 
    token-efficient Swedish format for OneSeek's final prompt.
    
    Args:
        tavily_results: List of dicts with 'query' and 'summary' (raw Tavily formatted data)
        
    Returns:
        Structured Swedish text with:
        - Nyckel fakta (key facts as numbered bullet points)
        - Källor (clean source list)
        - Reduced noise and optimized tokens
    """
    if not tavily_results:
        return ""
    
    logger.info(f"[TAVILY-SUMMARIZER] Structuring {len(tavily_results)} Tavily results...")
    
    structured_output = "**REALTIDSDATA (VERIFIERAD):**\n\n"
    
    for i, result in enumerate(tavily_results, 1):
        query = result.get('query', f'Sökning {i}')
        raw_summary = result.get('summary', '')
        
        if not raw_summary:
            continue
        
        # Extract answer and sources from the raw Tavily formatted summary
        answer_text = ""
        sources = []
        
        # Parse the existing formatted summary
        lines = raw_summary.split('\n')
        in_sources = False
        current_source_text = ""
        
        for line in lines:
            line_strip = line.strip()
            
            if '**Sammanfattning:**' in line:
                # Extract the summary text
                answer_text = line.replace('**Sammanfattning:**', '').strip()
            elif '**Källor:**' in line:
                in_sources = True
            elif in_sources:
                if line_strip.startswith(('<a href=', '1.', '2.', '3.', '4.')):
                    if current_source_text:
                        sources.append(current_source_text)
                    current_source_text = line_strip
                elif line_strip and current_source_text:
                    # Continuation of source content
                    current_source_text += " " + line_strip
        
        # Add last source
        if current_source_text:
            sources.append(current_source_text)
        
        # Summarize the answer if it's too long
        if len(answer_text) > 400:
            logger.info(f"[TAVILY-SUMMARIZER] Summarizing long answer ({len(answer_text)} chars) for query: {query[:50]}...")
            answer_text = summarize_tavily_content(answer_text, target_length=100)
        
        # Format structured output
        structured_output += f"**{i}. {query}**\n"
        if answer_text:
            structured_output += f"→ {answer_text}\n"
        
        # Add clean sources (limit to top 2 most relevant)
        if sources:
            structured_output += f"**Källor:** "
            for j, source in enumerate(sources[:2], 1):
                # Clean up source text - keep URL and brief description
                if '<a href=' in source:
                    # Extract URL and title
                    import re
                    url_match = re.search(r'<a href="([^"]+)"[^>]*>([^<]+)</a>', source)
                    if url_match:
                        url, title = url_match.groups()
                        # Truncate long titles
                        if len(title) > 60:
                            title = title[:60] + "..."
                        structured_output += f"[{j}] {title} ({url[:40]}...) "
                else:
                    # Plain text source
                    source_clean = source[:80] + "..." if len(source) > 80 else source
                    structured_output += f"[{j}] {source_clean} "
            
            structured_output += "\n"
        
        structured_output += "\n"
    
    # Calculate token reduction
    original_length = sum(len(r.get('summary', '')) for r in tavily_results)
    new_length = len(structured_output)
    reduction_pct = int((1 - new_length / original_length) * 100) if original_length > 0 else 0
    
    logger.info(f"[TAVILY-SUMMARIZER] Structured data: {new_length} chars (reduced by {reduction_pct}% from {original_length})")
    logger.info(f"[TAVILY-SUMMARIZER] Token optimization: ~{reduction_pct}% fewer tokens for cleaner context")
    
    return structured_output


def format_tavily_for_oneseek(tavily_results: List[Dict[str, Any]], use_summarization: bool = True) -> str:
    """
    Main entry point for formatting Tavily data for OneSeek.
    
    Args:
        tavily_results: List of Tavily search results
        use_summarization: Whether to use ML summarization (True) or pass-through (False)
        
    Returns:
        Formatted Swedish text ready for injection into OneSeek prompt
    """
    if not tavily_results:
        return ""
    
    if use_summarization and SUMMARIZER_ENABLED:
        return structure_tavily_data(tavily_results)
    else:
        # Original pass-through formatting
        injected_data = "\n\n**REALTIDSDATA FRÅN TAVILY:**\n\n"
        for i, res in enumerate(tavily_results, 1):
            injected_data += f"**Sökning {i}:** {res['query']}\n{res['summary']}\n\n"
        return injected_data
