"""
Libris XL API Module
====================

Komplett implementation av Kungliga Bibliotekets Libris XL API för böcker och litteratur.
Referens: https://libris.kb.se/api/

Features:
- Fritextsökning av böcker
- ISBN-uppslag
- Författarsökning
- Formattering av bokresultat

Author: CivicAI
Version: 1.0.0
Updated: 2025-12-12
"""

import requests
import json
import logging
import re
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from urllib.parse import quote

logger = logging.getLogger(__name__)


class LibrisClient:
    """
    Client för Libris XL API.
    
    Alla API:er är gratis och kräver ingen API-nyckel.
    Attribution: © Kungliga Biblioteket (CC0 1.0)
    """
    
    # Base URLs för olika API-kategorier
    XSEARCH_BASE = "https://libris.kb.se/xsearch"
    LIBRIS_BASE = "https://libris.kb.se"
    
    def __init__(self, timeout: int = 10):
        """
        Initiera Libris-klient.
        
        Args:
            timeout: Timeout för HTTP-anrop i sekunder
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CivicAI/1.0 (Libris XL Client)',
            'Accept': 'application/json'
        })
    
    def search_books(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Sök böcker i Libris XL via fritextsökning.
        
        Args:
            query: Sökterm (titel, författare, nyckelord)
            limit: Max antal resultat (default 5, max 100)
            
        Returns:
            Dict med sökresultat
        """
        try:
            # Encode query for URL
            encoded_query = quote(query)
            url = f"{self.XSEARCH_BASE}?query={encoded_query}&format=json&n={limit}"
            logger.info(f"[Libris] Söker böcker: '{query}'")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            # Extract results
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            total = xsearch.get("records", 0)
            
            if not records:
                return {
                    "success": True,
                    "count": 0,
                    "total": 0,
                    "books": [],
                    "query": query,
                    "message": f"Inga böcker hittades för '{query}'",
                    "source": "Libris XL",
                    "attribution": "© Kungliga Biblioteket"
                }
            
            # Parse book records
            books = []
            for record in records[:limit]:
                book = self._parse_book_record(record)
                books.append(book)
            
            return {
                "success": True,
                "count": len(books),
                "total": total,
                "books": books,
                "query": query,
                "source": "Libris XL",
                "attribution": "© Kungliga Biblioteket"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[Libris] API-fel: {e}")
            return {"error": f"Kunde inte hämta data från Libris: {str(e)}"}
        except Exception as e:
            logger.error(f"[Libris] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av Libris-data: {str(e)}"}
    
    def lookup_isbn(self, isbn: str) -> Dict[str, Any]:
        """
        Slå upp bok via ISBN-nummer.
        
        Args:
            isbn: ISBN-10 eller ISBN-13 nummer
            
        Returns:
            Dict med bokdetaljer
        """
        try:
            # Clean ISBN (remove dashes and spaces)
            isbn_clean = isbn.replace("-", "").replace(" ", "")
            
            # Validate ISBN length
            if not isbn_clean or len(isbn_clean) < 10:
                return {
                    "error": "Ogiltigt ISBN-nummer. Ange 10 eller 13 siffror.",
                    "isbn": isbn
                }
            
            # Search by ISBN
            encoded_isbn = quote(f"isbn:{isbn_clean}")
            url = f"{self.XSEARCH_BASE}?query={encoded_isbn}&format=json&n=1"
            logger.info(f"[Libris] ISBN-uppslag: {isbn}")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            # Extract results
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            
            if not records:
                return {
                    "success": True,
                    "found": False,
                    "isbn": isbn,
                    "message": f"Ingen bok hittades med ISBN {isbn}",
                    "source": "Libris XL",
                    "attribution": "© Kungliga Biblioteket"
                }
            
            # Parse book record
            book = self._parse_book_record(records[0])
            book["isbn"] = isbn
            
            return {
                "success": True,
                "found": True,
                "book": book,
                "source": "Libris XL",
                "attribution": "© Kungliga Biblioteket"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[Libris] API-fel: {e}")
            return {"error": f"Kunde inte hämta data från Libris: {str(e)}"}
        except Exception as e:
            logger.error(f"[Libris] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av Libris-data: {str(e)}"}
    
    def search_by_author(self, author: str, limit: int = 10) -> Dict[str, Any]:
        """
        Sök alla böcker av en specifik författare.
        
        Args:
            author: Författarnamn
            limit: Max antal resultat (default 10)
            
        Returns:
            Dict med författarens böcker
        """
        try:
            # Search by author
            encoded_author = quote(f"author:{author}")
            url = f"{self.XSEARCH_BASE}?query={encoded_author}&format=json&n={limit}"
            logger.info(f"[Libris] Författarsökning: '{author}'")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            # Extract results
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            total = xsearch.get("records", 0)
            
            if not records:
                return {
                    "success": True,
                    "count": 0,
                    "total": 0,
                    "books": [],
                    "author": author,
                    "message": f"Inga böcker hittades av '{author}'",
                    "source": "Libris XL",
                    "attribution": "© Kungliga Biblioteket"
                }
            
            # Parse book records
            books = []
            for record in records[:limit]:
                book = self._parse_book_record(record)
                books.append(book)
            
            return {
                "success": True,
                "count": len(books),
                "total": total,
                "books": books,
                "author": author,
                "source": "Libris XL",
                "attribution": "© Kungliga Biblioteket"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[Libris] API-fel: {e}")
            return {"error": f"Kunde inte hämta data från Libris: {str(e)}"}
        except Exception as e:
            logger.error(f"[Libris] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av Libris-data: {str(e)}"}
    
    def _parse_book_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse en bokpost från Libris XL.
        
        Args:
            record: Rådata från Libris API
            
        Returns:
            Dict med strukturerad bokdata
        """
        return {
            "title": record.get("title", "Okänd titel"),
            "creator": record.get("creator", "Okänd författare"),
            "date": record.get("date", ""),
            "publisher": record.get("publisher", ""),
            "identifier": record.get("identifier", ""),
            "type": record.get("type", ""),
            "language": record.get("language", ""),
            "extent": record.get("extent", "")
        }
    
    def format_book_response(
        self, 
        result: Dict[str, Any], 
        response_type: str = "search"
    ) -> str:
        """
        Formatera bokdata till läsbar svensk text.
        
        Args:
            result: Resultat från search_books, lookup_isbn eller search_by_author
            response_type: Typ av respons ("search", "isbn", "author")
            
        Returns:
            Formaterad text på svenska
        """
        if "error" in result:
            return f"❌ {result['error']}\n\n**Källa:** Libris XL (Kungliga Biblioteket)"
        
        if not result.get("success"):
            return "Kunde inte hämta bokdata från Libris.\n\n**Källa:** Libris XL (Kungliga Biblioteket)"
        
        # Handle empty results
        if result.get("count", 0) == 0:
            message = result.get("message", "Inga böcker hittades")
            return f"{message}\n\n**Källa:** Libris XL (Kungliga Biblioteket)"
        
        # Format based on response type
        if response_type == "isbn":
            if not result.get("found"):
                return f"Ingen bok hittades med ISBN {result.get('isbn', 'okänd')}.\n\n**Källa:** Libris XL (Kungliga Biblioteket)"
            
            book = result.get("book", {})
            output = f"**{book.get('title')}**\n\n"
            output += f"• **Författare:** {book.get('creator')}\n"
            if book.get('date'):
                output += f"• **Utgivningsår:** {book.get('date')}\n"
            if book.get('publisher'):
                output += f"• **Förlag:** {book.get('publisher')}\n"
            if book.get('isbn'):
                output += f"• **ISBN:** {book.get('isbn')}\n"
            if book.get('extent'):
                output += f"• **Omfång:** {book.get('extent')}\n"
            
            if book.get('identifier'):
                output += f"\n**Mer info:** {self.LIBRIS_BASE}/bib/{book.get('identifier')}\n"
            
            output += f"\n**Källa:** Libris XL (Kungliga Biblioteket)"
            return output
        
        elif response_type == "author":
            author = result.get("author", "okänd författare")
            total = result.get("total", 0)
            books = result.get("books", [])
            count = len(books)
            
            output = f"**Böcker av {author}** (visar {count} av {total} träffar):\n\n"
            
            for i, book in enumerate(books, 1):
                output += f"**{i}. {book.get('title')}**\n"
                if book.get('date'):
                    output += f"   Utgivningsår: {book.get('date')}\n"
                if book.get('publisher'):
                    output += f"   Förlag: {book.get('publisher')}\n"
                output += "\n"
            
            query = result.get("query", author)
            output += f"\n**Sök mer:** {self.LIBRIS_BASE}/hitlist?q=author:{quote(author)}\n"
            output += f"**Källa:** Libris XL (Kungliga Biblioteket)"
            return output
        
        else:  # search
            query = result.get("query", "")
            total = result.get("total", 0)
            books = result.get("books", [])
            count = len(books)
            
            output = f"**Bokresultat för '{query}'** (visar {count} av {total} träffar):\n\n"
            
            for i, book in enumerate(books, 1):
                output += f"**{i}. {book.get('title')}**\n"
                output += f"   Författare: {book.get('creator')}\n"
                if book.get('date'):
                    output += f"   Utgivningsår: {book.get('date')}\n"
                if book.get('identifier'):
                    output += f"   ID: {book.get('identifier')}\n"
                output += "\n"
            
            output += f"\n**Sök mer:** {self.LIBRIS_BASE}/hitlist?q={quote(query)}\n"
            output += f"**Källa:** Libris XL (Kungliga Biblioteket)"
            return output


def extract_book_info_from_query(query: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extrahera boktitel, författare eller ISBN från användarens fråga.
    
    Args:
        query: Användarens fråga
        
    Returns:
        Tuple med (title, author, isbn) - alla kan vara None
    """
    query_lower = query.lower()
    
    # Extract ISBN
    isbn_match = re.search(r'\b(978|979)?[\d\-]{10,17}\b', query)
    isbn = isbn_match.group(0) if isbn_match else None
    
    # Extract quoted strings as potential titles
    title_match = re.search(r'["\']([^"\']+)["\']', query)
    title = title_match.group(1) if title_match else None
    
    # Extract author name (capitalized words, likely proper noun)
    # Look for patterns like "av [Name]" or "författare [Name]"
    author = None
    author_patterns = [
        r'(?:av|författare|skribent)\s+([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*)',
        r'\b([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)\b'
    ]
    
    for pattern in author_patterns:
        match = re.search(pattern, query)
        if match:
            author = match.group(1)
            break
    
    return title, author, isbn


# Example usage
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("=== Libris XL API Module Test ===\n")
    
    client = LibrisClient()
    
    # Test 1: Search books
    print("Test 1: Fritextsökning - 'Röda rummet'")
    print("-" * 50)
    result = client.search_books("Röda rummet", limit=3)
    print(client.format_book_response(result, "search"))
    print("\n")
    
    # Test 2: ISBN lookup
    print("Test 2: ISBN-uppslag - '9789100128821'")
    print("-" * 50)
    result = client.lookup_isbn("9789100128821")
    print(client.format_book_response(result, "isbn"))
    print("\n")
    
    # Test 3: Author search
    print("Test 3: Författarsökning - 'Astrid Lindgren'")
    print("-" * 50)
    result = client.search_by_author("Astrid Lindgren", limit=5)
    print(client.format_book_response(result, "author"))
    print("\n")
    
    # Test 4: Entity extraction
    print("Test 4: Extrahera bokinfo från fråga")
    print("-" * 50)
    test_queries = [
        "Vad handlar 'Röda rummet' om?",
        "Böcker av Astrid Lindgren",
        "ISBN 9789100128821"
    ]
    
    for q in test_queries:
        title, author, isbn = extract_book_info_from_query(q)
        print(f"Fråga: {q}")
        print(f"  → Titel: {title}, Författare: {author}, ISBN: {isbn}")
    
    print("\n=== Test klar ===")
