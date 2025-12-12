# Libris XL Integration

**Status**: ✅ Completed  
**Date**: 2025-12-12  
**Version**: 7.0.0

## Overview

This document describes the Libris XL (Kungliga Biblioteket) integration following the same modular, $ref-based structure as SMHI (PR #110).

## What is Libris XL?

Libris XL is Sweden's national library catalog operated by Kungliga Biblioteket (The Royal Library). It provides free, open access to:
- Books and publications from Swedish libraries
- Author information
- ISBN lookups
- Bibliographic data

**Website**: https://libris.kb.se  
**License**: CC0 1.0 Universal (Public Domain)

## Implementation Structure

The Libris integration follows the exact same pattern as SMHI:

### 1. Modular API Catalog (`config/api_catalog_libris.json`)

A standalone JSON file containing:
- **Provider metadata**: Kungliga Biblioteket, license, API documentation
- **Personality tags**: `["bibliotekarie"]` - links to Bibliotekarie personality
- **3 Main APIs**:
  1. `libris_search` - Free text search for books
  2. `libris_isbn` - ISBN lookup
  3. `libris_sparql` - Author search and advanced queries
- **Entity configuration**: Book/author/ISBN extraction patterns
- **Keywords**: Book-related search terms
- **Caching strategy**: Response caching times
- **Error handling**: Retry logic and fallback messages

### 2. Main Catalog Reference (`config/api_catalog.json`)

The main catalog now includes:
```json
{
  "api_catalog": {
    "väder": {
      "$ref": "api_catalog_smhi.json"
    },
    "böcker": {
      "$ref": "api_catalog_libris.json"
    }
  }
}
```

### 3. Python API Module (`api/libris.py`)

A complete, standalone Python module with:

**LibrisClient class:**
- `search_books(query, limit)` - Search books by title/author/keyword
- `lookup_isbn(isbn)` - Get book details by ISBN
- `search_by_author(author, limit)` - Find all books by an author
- `format_book_response(result, type)` - Format results in Swedish

**Helper functions:**
- `extract_book_info_from_query(query)` - Extract book/author/ISBN from user question
- Entity extraction using regex patterns
- Error handling with graceful fallbacks

**Features:**
- Full error handling
- Input sanitization
- Swedish response formatting
- Runnable examples (`python api/libris.py`)

## Integration with Personality System

### Bibliotekarie Personality

The Libris integration is automatically activated when the **Bibliotekarie** personality is selected.

**Personality file**: `frontend/public/characters/OneSeek-Bibliotekarie.yaml`

**Configuration** (`config/personality_catalog.json`):
```json
{
  "oneseek-bibliotekarie": {
    "name": "Bibliotekarien",
    "keywords": ["bok", "böcker", "författare", "isbn", "libris", ...],
    "categories": ["böcker", "litteratur"],
    "personality_tags": ["bibliotekarie"]
  }
}
```

### Dynamic API Catalog Creation

When a user asks about books:

1. **Stage 1**: Personality selector identifies "bibliotekarie" based on keywords
2. **Stage 2**: System loads `api_catalog.json` → resolves `$ref` to `api_catalog_libris.json`
3. **Stage 3**: Creates `runtime/character_api.json` with filtered Libris APIs
4. **Stage 4**: API calls are executed and results formatted in Swedish

## API Endpoints

### 1. Free Text Search

**Endpoint**: `https://libris.kb.se/xsearch?query={query}&format=json&n=5`

**Example**: Search for "Röda rummet"
```
https://libris.kb.se/xsearch?query=Röda%20rummet&format=json&n=5
```

**Returns**: 5 results by default

**Use cases**:
- "Vad handlar Röda rummet om?"
- "Böcker om Sverige"
- "Rekommendationer på svenska klassiker"

### 2. ISBN Lookup

**Endpoint**: `https://libris.kb.se/xsearch?query=isbn:{isbn}&format=json&n=1`

**Example**: ISBN 9789100128821
```
https://libris.kb.se/xsearch?query=isbn:9789100128821&format=json&n=1
```

**Use cases**:
- "ISBN 978-91-0-012882-1"
- "Vilken bok har ISBN 9789100128821?"

### 3. Author Search

**Endpoint**: `https://libris.kb.se/xsearch?query=author:{author}&format=json&n=10`

**Example**: Books by Astrid Lindgren
```
https://libris.kb.se/xsearch?query=author:Astrid%20Lindgren&format=json&n=10
```

**Returns**: 10 results by default

**Use cases**:
- "Alla böcker av Astrid Lindgren"
- "Vad har Strindberg skrivit?"
- "Bibliografi August Strindberg"

## Testing

### Unit Tests

Location: `tests/test_api_catalog.py`

New test: `test_böcker_category()` validates:
- $ref resolution works correctly
- personality_tags include "bibliotekarie"
- All 3 Libris APIs are present
- Provider metadata is correct

Run tests:
```bash
python -m pytest tests/test_api_catalog.py::TestApiCatalogCategories::test_böcker_category -v
```

### Module Testing

The Libris module includes runnable examples:
```bash
cd /home/runner/work/CivicAI/CivicAI
python api/libris.py
```

This tests:
- Book search
- ISBN lookup
- Author search
- Entity extraction

### Integration Testing

Test the full flow:
1. Navigate to `/7B-Zero` in the UI
2. Ask: "Vad handlar Röda rummet om?"
3. Verify:
   - Bibliotekarie personality is selected
   - Libris APIs are called
   - Swedish formatted response is returned
   - Source attribution shows "Libris XL (Kungliga Biblioteket)"

## Comparison with SMHI Implementation

Both integrations follow the **exact same pattern**:

| Feature | SMHI (Weather) | Libris (Books) |
|---------|----------------|----------------|
| Modular config | `api_catalog_smhi.json` | `api_catalog_libris.json` |
| $ref in main | ✅ | ✅ |
| Python module | `api/smhi.py` | `api/libris.py` |
| Personality tag | `metrolog` | `bibliotekarie` |
| Entity extraction | City names | Book titles/authors/ISBN |
| Number of APIs | 7 | 3 |
| Requires API key | No | No |
| License | CC BY 4.0 | CC0 1.0 |

## Files Created/Modified

### New Files
- `config/api_catalog_libris.json` - Modular Libris API catalog
- `api/libris.py` - Python client module
- `frontend/public/api_catalog_libris.json` - Frontend copy
- `LIBRIS_INTEGRATION.md` - This documentation

### Modified Files
- `config/api_catalog.json` - Added böcker → $ref link
- `frontend/public/api_catalog.json` - Updated for frontend
- `tests/test_api_catalog.py` - Added Libris test + $ref support

### Unchanged Files
- `config/personality_catalog.json` - Already had bibliotekarie
- `frontend/public/characters/OneSeek-Bibliotekarie.yaml` - Already configured
- `ml_service/api_integrations.py` - Existing Libris functions preserved
- `ml_service/personality_selector.py` - $ref resolution already implemented

## Rate Limits & Best Practices

**Rate Limits**:
- No hard limits documented by Kungliga Biblioteket
- Recommended: Max 10 requests/second, 1000 requests/hour
- Be respectful of the free service

**Caching Strategy**:
- Search results: 30 minutes
- ISBN lookups: 24 hours
- Author bibliographies: 6 hours
- Static data: 7 days

**Error Handling**:
- Exponential backoff on retries
- Max 3 retries
- Graceful fallback messages in Swedish
- All errors logged for debugging

## Future Enhancements

Potential improvements:

1. **SPARQL Support**: Full SPARQL endpoint integration for advanced queries
2. **Book Covers**: Fetch and display book cover images
3. **Library Holdings**: Show which libraries have physical copies
4. **Similar Books**: Recommendation engine based on user searches
5. **Advanced Filters**: Filter by publication year, language, genre
6. **Reading Lists**: Create and save personalized reading lists

## Maintenance

**Monitoring**:
- Check Libris API status: https://libris.kb.se/api/
- Review error logs in `ml_service/server.py`
- Monitor cache hit rates

**Updates**:
- Check for API changes quarterly
- Update `api_catalog_libris.json` if new endpoints are added
- Sync with Kungliga Biblioteket announcements

## Credits

Implementation based on:
- SMHI modular structure (PR #110)
- IMPLEMENTATION_SUMMARY_API_REFACTOR.md
- Existing Libris functions in `ml_service/api_integrations.py`

## Support

For questions or issues:
- Check API documentation: https://libris.kb.se/api/
- Review logs in `ml_service/server.py`
- Test with `python api/libris.py`

---

**Status**: ✅ Ready for production use
