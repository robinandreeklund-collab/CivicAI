"""
API Integrations for ONESEEK Δ+ v4.0

This module contains all external API integration functions for fetching
real-time data from Swedish government and public sources.

Created as part of ONESEEK Δ+ v4.0 to separate API logic from server.py
"""

import requests
from typing import Optional
from datetime import datetime
import json


# =============================================================================
# RIKSDAGEN API INTEGRATIONS
# =============================================================================

def fetch_riksdagen_ledamoter(query: str = None) -> Optional[str]:
    """
    Fetch members of parliament (ledamöter) from Riksdagen's open data API.
    
    This function queries https://data.riksdagen.se/dokumentlista/?avd=ledamot&utformat=json
    to retrieve information about current and historical members of the Swedish Parliament.
    
    Args:
        query: Optional search query (name, party, constituency, etc.)
               If None, returns current ledamöter
        
    Returns:
        Formatted ledamot data with HTML source links, or None if failed
        
    Example queries:
        - "Ulf Kristersson" → specific person
        - "Moderaterna" → party members
        - "Stockholm" → ledamöter from Stockholm
        
    API documentation: https://www.dataportal.se/dataservice/98_3022
    """
    try:
        # Build the API URL
        base_url = "https://data.riksdagen.se/dokumentlista/"
        params = {
            "avd": "ledamot",
            "utformat": "json",
            "sort": "datum",
            "sortorder": "desc"
        }
        
        # Add search query if provided
        if query:
            params["sok"] = query
        
        # Make the API request
        response = requests.get(base_url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            # Parse the ledamot data
            dokumentlista = data.get("dokumentlista", {})
            dokument = dokumentlista.get("dokument", [])
            
            if not dokument:
                # No results found
                if query:
                    return f"Inga ledamöter hittades för sökning: '{query}'\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
                return None
            
            # Format the results
            results = []
            source_links = []
            
            # Take up to 10 results
            for i, doc in enumerate(dokument[:10], 1):
                # Extract ledamot information
                titel = doc.get("titel", "Okänd ledamot")
                undertitel = doc.get("undertitel", "")
                datum = doc.get("datum", "")
                doc_id = doc.get("id", "")
                
                # Try to extract more details from subtitle
                parti = ""
                valkrets = ""
                if undertitel:
                    parts = undertitel.split(",")
                    if len(parts) >= 1:
                        parti = parts[0].strip()
                    if len(parts) >= 2:
                        valkrets = parts[1].strip()
                
                # Build result string
                result_line = f"• **{titel}**"
                if parti:
                    result_line += f" ({parti})"
                if valkrets:
                    result_line += f" – {valkrets}"
                if datum:
                    result_line += f" [Senast uppdaterad: {datum}]"
                results.append(result_line)
                
                # Build source link
                if doc_id:
                    link = f"https://www.riksdagen.se/sv/ledamoter-partier/ledamot/{doc_id}"
                    short_name = titel[:40] + "..." if len(titel) > 40 else titel
                    source_links.append(f'{i}. <a href="{link}">Riksdagen – {short_name}</a>')
            
            # Get metadata
            traffar = dokumentlista.get("@traffar", "0")
            
            # Build final response
            header = f"**Riksdagsledamöter"
            if query:
                header += f" (sökning: '{query}')"
            header += f"** (visar {min(10, len(dokument))} av {traffar} träffar):\n\n"
            
            result = header + "\n".join(results)
            
            # Add sources
            if source_links:
                result += "\n\n**Källor:**\n" + "\n".join(source_links[:5])
            else:
                result += "\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
            
            # Add API info
            result += f"\n\n_Data hämtad: {datetime.now().strftime('%Y-%m-%d %H:%M')} från Riksdagens öppna data_"
            
            return result
            
    except requests.exceptions.Timeout:
        return "Timeout vid anslutning till Riksdagens API.\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except requests.exceptions.RequestException as e:
        return f"Kunde inte nå Riksdagens API: {str(e)}\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except json.JSONDecodeError:
        return "Fel vid tolkning av data från Riksdagen.\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except Exception as e:
        return None


def fetch_riksdagen_ledamot_by_name(name: str) -> Optional[str]:
    """
    Fetch a specific member of parliament by name.
    
    Args:
        name: The name of the ledamot to search for
        
    Returns:
        Detailed information about the ledamot
    """
    return fetch_riksdagen_ledamoter(name)


def fetch_riksdagen_ledamoter_by_party(party: str) -> Optional[str]:
    """
    Fetch members of parliament by party.
    
    Args:
        party: Party name (e.g., "Moderaterna", "Socialdemokraterna")
        
    Returns:
        List of ledamöter in the specified party
    """
    return fetch_riksdagen_ledamoter(party)


# =============================================================================
# EXPORT ALL FUNCTIONS
# =============================================================================

__all__ = [
    'fetch_riksdagen_ledamoter',
    'fetch_riksdagen_ledamot_by_name',
    'fetch_riksdagen_ledamoter_by_party',
]
