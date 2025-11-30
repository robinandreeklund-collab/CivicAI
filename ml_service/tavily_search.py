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
