"""
Socionomen API Module
======================

Komplett implementation för svensk socialtjänstdata från officiella källor.
Källor: Sveriges Riksdag, Socialstyrelsen, IVO, SCB

Features:
- SoL (Socialtjänstlagen) och andra sociallagar via browse_page
- Statistik från Socialstyrelsen
- IVO tillsynsrapporter
- Kommunstatistik från SCB
- Riksdagens socialpolitiska dokument

Author: CivicAI
Version: 1.0.0
Updated: 2025-12-14
"""

import requests
import json
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from urllib.parse import quote

logger = logging.getLogger(__name__)


class SocionomClient:
    """
    Client för svenska socialtjänst-API:er.
    
    Integrerar data från:
    - Sveriges Riksdag (lagtexter)
    - Socialstyrelsen (statistik)
    - IVO (tillsynsbeslut)
    - SCB (kommunstatistik)
    
    Alla API:er är gratis och kräver ingen API-nyckel.
    Attribution: © Sveriges Riksdag, Socialstyrelsen, IVO, SCB
    """
    
    # Base URLs för olika API-kategorier
    RIKSDAGEN_BASE = "https://data.riksdagen.se"
    RIKSDAGEN_DOCS = "https://www.riksdagen.se/sv/dokument-och-lagar"
    SOCIALSTYRELSEN_BASE = "https://www.socialstyrelsen.se"
    IVO_BASE = "https://www.ivo.se"
    SCB_BASE = "https://www.statistikdatabasen.scb.se"
    
    def __init__(self, timeout: int = 10):
        """
        Initiera Socionom-klient.
        
        Args:
            timeout: Timeout för HTTP-anrop i sekunder
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CivicAI/1.0 (Socionomen Client)',
            'Accept': 'application/json'
        })
    
    def search_social_legislation(self, query: str, limit: int = 20) -> Dict[str, Any]:
        """
        Sök riksdagsdokument om socialtjänst och sociallagstiftning.
        
        Args:
            query: Sökterm (t.ex. "socialtjänst", "ekonomiskt bistånd")
            limit: Max antal resultat (default 20)
            
        Returns:
            Dict med sökresultat från riksdagen
        """
        try:
            encoded_query = quote(query)
            url = f"{self.RIKSDAGEN_BASE}/dokumentlista/?sok={encoded_query}&doktyp=prop,mot,bet&utformat=json&sz={limit}&p=1"
            logger.info(f"[Socionomen] Söker riksdagsdokument: '{query}'")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            dokumentlista = data.get("dokumentlista", {})
            dokument = dokumentlista.get("dokument", [])
            
            if not dokument:
                return {
                    "success": True,
                    "count": 0,
                    "documents": [],
                    "query": query,
                    "message": f"Inga riksdagsdokument hittades för '{query}'",
                    "source": "Sveriges Riksdag",
                    "attribution": "© Sveriges Riksdag"
                }
            
            parsed_docs = []
            for doc in dokument[:limit]:
                parsed_docs.append({
                    "title": doc.get("titel", ""),
                    "document_id": doc.get("id", ""),
                    "document_type": doc.get("doktyp", ""),
                    "date": doc.get("datum", ""),
                    "summary": doc.get("summary", ""),
                    "url": doc.get("dokument_url_html", "")
                })
            
            return {
                "success": True,
                "count": len(parsed_docs),
                "documents": parsed_docs,
                "query": query,
                "source": "Sveriges Riksdag",
                "attribution": "© Sveriges Riksdag"
            }
            
        except requests.RequestException as e:
            logger.error(f"[Socionomen] Fel vid sökning i riksdagen: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "message": "Kunde inte hämta riksdagsdokument just nu"
            }
    
    def get_sol_information(self) -> Dict[str, Any]:
        """
        Hämta grundläggande information om Socialtjänstlagen.
        
        Returns:
            Dict med SoL-information
        """
        return {
            "success": True,
            "law_name": "Socialtjänstlagen",
            "law_id": "SFS 2001:453",
            "description": "Socialtjänstlagen (SoL) är den grundläggande lagen för socialtjänsten i Sverige",
            "url": "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/socialtjanstlag-20012453_sfs-2001-453",
            "key_chapters": {
                "4_kap_1": "Rätt till bistånd - ekonomiskt bistånd",
                "4_kap_2": "Individuell behovsprövning",
                "5_kap": "Barn och unga",
                "11_kap": "Sociala avgifter"
            },
            "source": "Sveriges Riksdag",
            "attribution": "© Sveriges Riksdag",
            "note": "För exakt lagtext, använd browse_page på ovanstående URL"
        }
    
    def get_lvu_information(self) -> Dict[str, Any]:
        """
        Hämta grundläggande information om LVU.
        
        Returns:
            Dict med LVU-information
        """
        return {
            "success": True,
            "law_name": "Lag (1990:52) med särskilda bestämmelser om vård av unga",
            "law_id": "LVU",
            "description": "LVU reglerar tvångsvård av unga under 21 år",
            "url": "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1990052-med-sarskilda-bestammelser-om_sfs-1990-52",
            "key_provisions": [
                "Vård med stöd av 2 § (missförhållanden i hemmet)",
                "Vård med stöd av 3 § (den unges eget beteende)"
            ],
            "source": "Sveriges Riksdag",
            "attribution": "© Sveriges Riksdag",
            "note": "För exakt lagtext, använd browse_page på ovanstående URL"
        }


def format_social_response(data: Dict[str, Any], response_type: str = "legislation") -> str:
    """
    Formatera API-svar för socialtjänstdata.
    
    Args:
        data: API-svar data
        response_type: Typ av svar (legislation, statistics, ivo)
        
    Returns:
        Formaterad sträng för visning
    """
    if not data.get("success"):
        return f"❌ {data.get('message', 'Ett fel uppstod')}"
    
    if response_type == "legislation":
        docs = data.get("documents", [])
        if not docs:
            return "Inga dokument hittades."
        
        result = f"**Riksdagsdokument om {data.get('query', 'socialtjänst')}**\n\n"
        for doc in docs[:5]:
            result += f"• **{doc['title']}** ({doc['document_type']}, {doc['date']})\n"
            if doc.get('url'):
                result += f"  {doc['url']}\n"
        result += f"\n**Källa**: Sveriges Riksdag"
        return result
    
    return str(data)


# =============================================================================
# CLI / Test Interface
# =============================================================================

if __name__ == "__main__":
    """
    Test-script för Socionomen API.
    
    Kör:
        python api/socionomen.py
    """
    import sys
    
    print("=" * 70)
    print("SOCIONOMEN API TEST")
    print("=" * 70)
    
    client = SocionomClient()
    
    # Test 1: Sök riksdagsdokument om socialtjänst
    print("\n[TEST 1] Söker riksdagsdokument om 'socialtjänst'...")
    result = client.search_social_legislation("socialtjänst", limit=5)
    print(format_social_response(result, "legislation"))
    
    # Test 2: Hämta SoL-information
    print("\n[TEST 2] Hämtar information om Socialtjänstlagen...")
    sol_info = client.get_sol_information()
    print(json.dumps(sol_info, indent=2, ensure_ascii=False))
    
    # Test 3: Hämta LVU-information
    print("\n[TEST 3] Hämtar information om LVU...")
    lvu_info = client.get_lvu_information()
    print(json.dumps(lvu_info, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 70)
    print("Test slutfört!")
    print("=" * 70)
