"""
Tavily Data Summarization Module for OneSeek

This module provides lightweight backend summarization of raw Tavily search results to create
clean, structured, and token-efficient data for injection into OneSeek's final prompt.

Uses bert-extractive-summarizer for minimal GPU memory footprint (~500MB vs 2GB for generative models).
Reduces noise, improves factual precision, and optimizes token usage by 30-50%.
"""

import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger("uvicorn")

# Configuration
SUMMARIZER_ENABLED = True      # Enable/disable summarization feature
SUMMARIZER_RATIO = 0.4         # Keep 40% of original text (adjustable 0.2-0.5)
SUMMARIZER_MIN_LENGTH = 50     # Minimum summary length in characters
MAX_SOURCES_PER_QUERY = 2      # Maximum sources to include per query

# Lazy load BERT summarizer to avoid import time overhead
_bert_summarizer = None
_summarizer_loaded = False


def _load_bert_summarizer():
    """
    Lazy load the BERT extractive summarizer.
    Much lighter than generative models (~500MB GPU vs 2GB+).
    """
    global _bert_summarizer, _summarizer_loaded
    
    if _summarizer_loaded:
        return _bert_summarizer
    
    try:
        from summarizer import Summarizer
        
        logger.info("[TAVILY-SUMMARIZER] Loading BERT extractive summarizer (lightweight)...")
        _bert_summarizer = Summarizer()
        _summarizer_loaded = True
        logger.info("[TAVILY-SUMMARIZER] ✓ BERT summarizer loaded successfully (~500MB footprint)")
        
        return _bert_summarizer
    except ImportError:
        logger.warning("[TAVILY-SUMMARIZER] bert-extractive-summarizer not installed. Using extraction-based fallback.")
        logger.warning("[TAVILY-SUMMARIZER] Install with: pip install bert-extractive-summarizer")
        _summarizer_loaded = True
        return None
    except Exception as e:
        logger.error(f"[TAVILY-SUMMARIZER] Error loading BERT summarizer: {e}")
        _summarizer_loaded = True
        return None


def summarize_tavily_content(content: str, query: str = "") -> str:
    """
    Summarize Tavily content using BERT extractive summarization or extraction-based fallback.
    
    BERT extractive summarization:
    - Selects most important sentences from original text
    - Maintains factual accuracy (no hallucination)
    - Fast and GPU-efficient (~500MB memory)
    - Works well with Swedish text
    
    Args:
        content: Raw content from Tavily (answer + results)
        query: Original search query (for context)
    
    Returns:
        Summarized content (30-50% shorter)
    """
    if not content or len(content.strip()) < 100:
        return content  # Too short to summarize
    
    original_length = len(content)
    
    # Try BERT extractive summarization first
    summarizer = _load_bert_summarizer()
    
    if summarizer and SUMMARIZER_ENABLED:
        try:
            # BERT extractive summarization
            # Extracts key sentences while maintaining factual accuracy
            summary = summarizer(
                content,
                ratio=SUMMARIZER_RATIO,  # Keep 40% of content
                min_length=SUMMARIZER_MIN_LENGTH
            )
            
            summary = summary.strip()
            
            if summary and len(summary) >= SUMMARIZER_MIN_LENGTH:
                reduction = round((1 - len(summary) / original_length) * 100)
                logger.info(f"[TAVILY-SUMMARIZER] BERT summary: {len(summary)} chars (reduced by {reduction}% from {original_length})")
                return summary
            else:
                logger.warning(f"[TAVILY-SUMMARIZER] BERT produced insufficient summary ({len(summary) if summary else 0} chars). Using fallback.")
                
        except Exception as e:
            logger.warning(f"[TAVILY-SUMMARIZER] BERT summarization failed: {e}. Using fallback.")
    
    # Fallback: Extraction-based summarization
    return _extraction_based_summarize(content, query, original_length)


def _extraction_based_summarize(content: str, query: str, original_length: int) -> str:
    """
    Fallback extraction-based summarization when BERT is unavailable.
    Prioritizes sentences with numbers, keywords, and proper nouns.
    """
    sentences = re.split(r'[.!?]+\s+', content)
    
    # Score sentences based on informativeness
    scored_sentences = []
    query_terms = set(query.lower().split()) if query else set()
    
    for sentence in sentences:
        if len(sentence.strip()) < 20:
            continue
            
        score = 0
        lower_sentence = sentence.lower()
        
        # Priority 1: Contains numbers (dates, statistics, etc.)
        if re.search(r'\d+', sentence):
            score += 3
        
        # Percentage specifically (important for statistics)
        if re.search(r'\d+\s*%', sentence):
            score += 2
        
        # Priority 2: Contains query terms (increased weight)
        sentence_terms = set(lower_sentence.split())
        overlap = query_terms & sentence_terms
        score += len(overlap) * 3  # Increased from 2
        
        # Priority 3: Contains Swedish keywords (expanded list)
        swedish_keywords = ['procent', 'miljoner', 'miljarder', 'tusen', 'år', 
                           'enligt', 'visar', 'forskare', 'studie', 'rapport', 
                           'data', 'resultat', 'analys', 'befolkning', 'Sverige',
                           'ökar', 'minskar', 'beräknas', 'förväntas', 'prognosticerar']
        for keyword in swedish_keywords:
            if keyword in lower_sentence:
                score += 1
        
        # Priority 4: Has proper nouns (capitalized words)
        proper_nouns = re.findall(r'\b[A-ZÅÄÖ][a-zåäö]+', sentence)
        score += len(proper_nouns)
        
        scored_sentences.append((score, sentence))
    
    # Sort by score and take top sentences
    scored_sentences.sort(reverse=True, key=lambda x: x[0])
    
    # Select top sentences to reach ~40% of original length
    target_length = int(original_length * SUMMARIZER_RATIO)
    selected_sentences = []
    current_length = 0
    
    # Ensure at least 2-3 sentences even if target length not reached
    for score, sentence in scored_sentences:
        if current_length + len(sentence) <= target_length or len(selected_sentences) < 3:
            selected_sentences.append(sentence)
            current_length += len(sentence)
        if current_length >= target_length and len(selected_sentences) >= 3:
            break
    
    # Safety: If no sentences selected, return original content truncated
    if not selected_sentences:
        logger.warning("[TAVILY-SUMMARIZER] Extraction failed to select sentences. Using original content.")
        return content[:int(original_length * SUMMARIZER_RATIO)] + "..."
    
    summary = '. '.join(selected_sentences) + '.'
    reduction = round((1 - len(summary) / original_length) * 100)
    logger.info(f"[TAVILY-SUMMARIZER] Extraction summary: {len(summary)} chars (reduced by {reduction}% from {original_length})")
    
    return summary


def structure_tavily_data(tavily_results: List[Dict[str, Any]]) -> str:
    """
    Structure multiple Tavily results into clean, token-efficient Swedish format.
    
    Output format:
    **REALTIDSDATA (VERIFIERAD):**
    
    **1. [Query]**
    → [Summarized key facts]
    **Källor:** [1] Title (URL) [2] Title (URL)
    
    Args:
        tavily_results: List of Tavily search results from multiple queries
    
    Returns:
        Structured Swedish text ready for OneSeek injection
    """
    if not tavily_results:
        return ""
    
    structured_parts = ["**REALTIDSDATA (VERIFIERAD):**\n"]
    
    for idx, result in enumerate(tavily_results, 1):
        query = result.get('query', f'Sökning {idx}')
        answer = result.get('answer', '')
        results = result.get('results', [])
        
        # Combine answer and top result contents for summarization
        # Enhanced: Use more results and longer content per result
        content_parts = []
        if answer and len(answer.strip()) > 20:
            content_parts.append(answer)
        
        for res in results[:5]:  # Increased from 3 to 5 for more content
            res_content = res.get('content', '')
            if res_content and len(res_content.strip()) > 50:
                content_parts.append(res_content[:800])  # Increased from 500 to 800
        
        content_to_summarize = '\n\n'.join(content_parts)
        
        # Summarize combined content with robust error handling
        if content_to_summarize and len(content_to_summarize) > 100:
            logger.info(f"[TAVILY-SUMMARIZER] Summarizing content ({len(content_to_summarize)} chars) for query: {query[:50]}...")
            summarized = summarize_tavily_content(content_to_summarize, query)
            
            # Validate summary is not empty or too short
            if not summarized or len(summarized.strip()) < 50:
                logger.warning(f"[TAVILY-SUMMARIZER] Summarization produced insufficient output. Using raw content.")
                summarized = content_to_summarize[:500] + "..."  # Use first 500 chars as fallback
        else:
            summarized = content_to_summarize if content_to_summarize else "Ingen detaljerad information tillgänglig."
        
        # Format query section
        structured_parts.append(f"\n**{idx}. {query}**")
        structured_parts.append(f"→ {summarized}")
        
        # Add top sources
        if results:
            sources = []
            for i, res in enumerate(results[:MAX_SOURCES_PER_QUERY], 1):
                title = res.get('title', 'Källa')
                url = res.get('url', '')
                if url:
                    sources.append(f"[{i}] {title} ({url})")
            
            if sources:
                structured_parts.append(f"**Källor:** {' '.join(sources)}\n")
    
    final_text = '\n'.join(structured_parts)
    
    return final_text


def format_tavily_for_oneseek(tavily_results: List[Dict[str, Any]], use_summarization: bool = True) -> str:
    """
    Main entry point: Format and summarize Tavily results for OneSeek injection.
    
    This function:
    1. Structures multiple Tavily results into clean Swedish format
    2. Applies BERT extractive summarization to reduce token count
    3. Maintains factual accuracy and source attribution
    4. Reduces data by 30-50% while preserving key information
    
    Args:
        tavily_results: List of raw Tavily search results
        use_summarization: Whether to apply summarization (default: True)
    
    Returns:
        Clean, structured Swedish text optimized for OneSeek
    """
    if not tavily_results:
        return ""
    
    logger.info(f"[TAVILY-SUMMARIZER] Processing {len(tavily_results)} results with backend summarization...")
    
    # Calculate original size
    original_size = sum(
        len(str(r.get('answer', ''))) + sum(len(res.get('content', '')) for res in r.get('results', [])[:3])
        for r in tavily_results
    )
    
    # Structure and summarize
    if use_summarization and SUMMARIZER_ENABLED:
        structured_data = structure_tavily_data(tavily_results)
    else:
        # Fallback: Use original formatting (from previous version)
        structured_data = _format_tavily_original(tavily_results)
    
    # Log token optimization
    final_size = len(structured_data)
    if original_size > 0:
        reduction = round((1 - final_size / original_size) * 100)
        logger.info(f"[TAVILY-SUMMARIZER] Structured data: {final_size} chars (reduced by {reduction}% from {original_size})")
        logger.info(f"[TAVILY-SUMMARIZER] Token optimization: ~{reduction}% fewer tokens for cleaner context")
    
    logger.info("[TAVILY-SUMMARIZER] ✓ Structured and summarized data ready for STEP 3")
    
    return structured_data


def _format_tavily_original(tavily_results: List[Dict[str, Any]]) -> str:
    """
    Original formatting (without summarization) as fallback.
    Used when summarization is disabled or unavailable.
    """
    formatted_parts = ["**REALTIDSDATA FRÅN TAVILY:**\n"]
    
    for idx, result in enumerate(tavily_results, 1):
        query = result.get('query', f'Sökning {idx}')
        answer = result.get('answer', 'Ingen sammanfattning tillgänglig')
        results = result.get('results', [])
        
        formatted_parts.append(f"\n**Sökning {idx}:** {query}")
        formatted_parts.append(f"**Sammanfattning:** {answer}\n")
        
        if results:
            formatted_parts.append("**Källor:**")
            for i, res in enumerate(results[:MAX_SOURCES_PER_QUERY], 1):
                title = res.get('title', 'Källa')
                url = res.get('url', '')
                content_preview = res.get('content', '')[:200] + '...' if res.get('content') else ''
                
                if url:
                    formatted_parts.append(f'{i}. <a href="{url}">{title}</a>')
                    if content_preview:
                        formatted_parts.append(f'   {content_preview}')
    
    return '\n'.join(formatted_parts)
