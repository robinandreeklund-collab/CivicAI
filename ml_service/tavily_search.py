"""
Tavily Search for ONESEEK Δ+
100% svenska svar genom language="sv"

Funktionalitet:
- Webbsökning via Tavily API
- Tvingar svenska svar med language="sv"
- Integrerar med källviktning

Author: ONESEEK Team
"""

import os
import requests
from typing import Optional, Dict, Any, List
from pathlib import Path

# Get API key from environment
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")


def tavily_search(
    query: str,
    max_results: int = 4,
    search_depth: str = "advanced",
    include_answer: bool = True,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None
) -> Optional[Dict[str, Any]]:
    """
    Utför en Tavily webbsökning med 100% svenska svar.
    
    Args:
        query: Sökfrågan
        max_results: Max antal resultat (default 4)
        search_depth: "basic" eller "advanced"
        include_answer: Om AI-sammanfattning ska inkluderas
        include_domains: Lista med domäner att inkludera
        exclude_domains: Lista med domäner att exkludera
        
    Returns:
        Sökresultat eller None vid fel
    """
    if not TAVILY_API_KEY:
        print("[TAVILY] Warning: No API key configured")
        return None
    
    try:
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "max_results": max_results,
            "include_domains": include_domains or [],
            "exclude_domains": exclude_domains or [],
            # ONESEEK Δ+: Force Swedish language responses
            "language": "sv"
        }
        
        response = requests.post(
            "https://api.tavily.com/search",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[TAVILY] Error: HTTP {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print("[TAVILY] Error: Request timeout")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[TAVILY] Error: {e}")
        return None


def format_tavily_sources(data: Optional[Dict[str, Any]]) -> str:
    """
    Formatera Tavily-resultat som källhänvisningar.
    
    Args:
        data: Tavily sökresultat
        
    Returns:
        Formaterad källsträng
    """
    if not data:
        return ""
    
    results = data.get("results", [])
    if not results:
        return ""
    
    sources = []
    for i, result in enumerate(results[:4], 1):
        title = result.get("title", "Okänd källa")
        url = result.get("url", "")
        sources.append(f"{i}. [{title}]({url})")
    
    return "\n".join(sources)


def get_tavily_answer(data: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Hämta AI-sammanfattning från Tavily-resultat.
    
    Args:
        data: Tavily sökresultat
        
    Returns:
        AI-sammanfattning eller None
    """
    if not data:
        return None
    
    return data.get("answer")


def search_with_sources(query: str) -> Dict[str, Any]:
    """
    Utför sökning och returnera svar med källor.
    
    Args:
        query: Sökfrågan
        
    Returns:
        Dict med answer, sources, och raw_data
    """
    data = tavily_search(query)
    
    return {
        "answer": get_tavily_answer(data),
        "sources": format_tavily_sources(data),
        "raw_data": data,
        "language": "sv"
    }


# Prioriterade svenska domäner
SWEDISH_PRIORITY_DOMAINS = [
    "scb.se",
    "smhi.se",
    "riksdagen.se",
    "regeringen.se",
    "1177.se",
    "krisinformation.se",
    "trafikverket.se",
    "skatteverket.se",
    "forsvarsmakten.se",
    "polisen.se",
    "msb.se",
    "svt.se",
    "sr.se"
]


def search_swedish_sources(query: str) -> Optional[Dict[str, Any]]:
    """
    Sökning med prioritet för svenska myndighetskällor.
    
    Args:
        query: Sökfrågan
        
    Returns:
        Sökresultat med svenska källor prioriterade
    """
    return tavily_search(
        query=query,
        include_domains=SWEDISH_PRIORITY_DOMAINS,
        max_results=6
    )


def extract_tavily_queries(reasoning_text: str) -> List[str]:
    """
    Extract Tavily search queries from ONESEEK's Data Reasoning text.
    
    Looks for patterns like:
    - "Tavily-sökning: <query>"
    - "Sök: <query>"
    - Queries in quotes after keywords
    
    Args:
        reasoning_text: The Data Reasoning text from ONESEEK
        
    Returns:
        List of extracted search queries
    """
    import re
    
    queries = []
    
    # Pattern 1: "Tavily-sökning: <query>" or "Tavily search: <query>"
    # Stop at newline, period, or special markers
    pattern1 = r'Tavily[-\s]s[öo]kning[:\s]+["\']?([^"\'\.?\n]+?(?=[\n\.]|Detta|Sök|$))'
    matches1 = re.findall(pattern1, reasoning_text, re.IGNORECASE)
    queries.extend([m.strip() for m in matches1])
    
    # Pattern 2: "Sök: <query>" or "Search: <query>"
    # Stop at newline, period, or special markers
    pattern2 = r'(?:^|[.\n])S[öo]k[:\s]+["\']?([^"\'\.?\n]+?(?=[\n\.]|Detta|Tavily|$))'
    matches2 = re.findall(pattern2, reasoning_text, re.IGNORECASE | re.MULTILINE)
    queries.extend([m.strip() for m in matches2])
    
    # Pattern 3: Quoted queries after keywords like "query", "fråga"
    pattern3 = r'(?:query|fråga)[:\s]+["\']([^"\']+)["\']'
    matches3 = re.findall(pattern3, reasoning_text, re.IGNORECASE)
    queries.extend([m.strip() for m in matches3])
    
    # Clean up queries: remove trailing text that's not part of the query
    cleaned_queries = []
    for q in queries:
        # Remove common trailing patterns
        q = re.sub(r'\s+(Detta|För att|Sök|Tavily).*$', '', q, flags=re.IGNORECASE)
        q = q.strip()
        if q:
            cleaned_queries.append(q)
    
    # Remove duplicates while preserving order
    unique_queries = []
    seen = set()
    for q in cleaned_queries:
        if q and q.lower() not in seen and len(q) > 10:  # Min 10 chars for valid query
            unique_queries.append(q)
            seen.add(q.lower())
    
    return unique_queries


def summarize_tavily_result(data: Optional[Dict[str, Any]]) -> str:
    """
    Summarize Tavily search result for injection into ONESEEK's prompt.
    
    Args:
        data: Tavily search result
        
    Returns:
        Formatted summary with answer and sources
    """
    if not data:
        return "Ingen data tillgänglig."
    
    result = ""
    
    # Add AI summary if available
    answer = data.get("answer")
    if answer:
        result += f"**Sammanfattning:** {answer}\n\n"
    
    # Add top sources
    results = data.get("results", [])
    if results:
        result += "**Källor:**\n"
        for i, res in enumerate(results[:3], 1):
            title = res.get("title", "Okänd")
            url = res.get("url", "")
            content = res.get("content", "")[:150]
            result += f"{i}. [{title}]({url})\n   {content}...\n"
    
    return result.strip()


if __name__ == "__main__":
    # Test
    print("=" * 60)
    print("ONESEEK Δ+ Tavily Search Test (100% Svenska)")
    print("=" * 60)
    
    test_query = "Hur många bor i Stockholm?"
    
    print(f"\nSökning: {test_query}")
    result = search_with_sources(test_query)
    
    if result["answer"]:
        print(f"\nSvar: {result['answer']}")
    
    if result["sources"]:
        print(f"\nKällor:\n{result['sources']}")
    
    print(f"\nSpråk: {result['language']}")
    
    # Test query extraction
    print("\n" + "=" * 60)
    print("Testing Query Extraction")
    print("=" * 60)
    
    test_reasoning = """
    Andra modeller pratar om befolkning men saknar aktuella siffror.
    Tavily-sökning: "Senaste befolkningsstatistik Stockholm 2025 SCB"
    Detta behövs för att faktakolla påståenden om arbetskraft.
    """
    
    extracted = extract_tavily_queries(test_reasoning)
    print(f"\nExtraherade queries: {extracted}")
