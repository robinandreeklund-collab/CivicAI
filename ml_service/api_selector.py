"""
ONESEEK API Selector - Δ+ v6.2
API selection and parallel fetching based on model's JSON response
"""

import json
import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import aiohttp

logger = logging.getLogger(__name__)


def parse_api_selection(model_response: str) -> Optional[Dict]:
    """
    Parse the model's JSON response to extract API selection.
    
    Note: This is intentionally synchronous as it only performs JSON parsing
    without any I/O operations. Called from async context but doesn't need await.
    
    Expected format:
    {
        "apis": [
            {"name": "smhi_current", "params": {"lon": "17.3", "lat": "60.6"}},
            {"name": "yr_no", "params": {"location": "Stockholm"}}
        ]
    }
    
    Args:
        model_response: The model's response containing JSON
        
    Returns:
        Parsed API selection dict or None if parsing fails
    """
    try:
        # Try to find JSON in the response
        # Look for { ... } pattern - find the first complete JSON object
        json_start = -1
        brace_count = 0
        
        for i, char in enumerate(model_response):
            if char == '{':
                if json_start == -1:
                    json_start = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and json_start != -1:
                    # Found complete JSON object
                    json_str = model_response[json_start:i+1]
                    try:
                        api_selection = json.loads(json_str)
                        
                        # Validate structure
                        if 'apis' not in api_selection:
                            logger.error("Missing 'apis' key in API selection")
                            return None
                        
                        logger.info(f"Parsed API selection: {len(api_selection['apis'])} APIs selected")
                        return api_selection
                    except json.JSONDecodeError:
                        # Try next JSON object if this one is invalid
                        json_start = -1
                        continue
        
        logger.error("No valid JSON found in model response")
        return None
        
    except Exception as e:
        logger.error(f"Error parsing API selection: {e}")
        return None


async def call_api(
    api_name: str,
    params: Dict[str, Any],
    api_catalog: Dict,
    timeout: int = 10
) -> Dict[str, Any]:
    """
    Call a specific API with given parameters.
    
    Args:
        api_name: Name of the API to call
        params: Parameters for the API call
        api_catalog: Full API catalog
        timeout: Request timeout in seconds
        
    Returns:
        Dict containing API response data or error
    """
    result = {
        'api_name': api_name,
        'success': False,
        'data': None,
        'error': None,
        'source': None
    }
    
    try:
        # Find API configuration in catalog
        api_config = None
        # Support both 'api_categories' and 'api_catalog' keys for backward compatibility
        catalog_key = 'api_catalog' if 'api_catalog' in api_catalog else 'api_categories'
        for category_data in api_catalog.get(catalog_key, {}).values():
            for api in category_data.get('apis', []):
                if api.get('name') == api_name:
                    api_config = api
                    break
            if api_config:
                break
        
        if not api_config:
            result['error'] = f"API '{api_name}' not found in catalog"
            logger.error(result['error'])
            return result
        
        # Get API URL and source
        api_url = api_config.get('url')
        api_source = api_config.get('source', api_name)
        result['source'] = api_source
        
        if not api_url:
            result['error'] = f"No URL configured for API '{api_name}'"
            logger.error(result['error'])
            return result
        
        # Make API call
        logger.info(f"Calling API: {api_name} with params: {params}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                api_url,
                params=params,
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    result['success'] = True
                    result['data'] = data
                    logger.info(f"Successfully fetched data from {api_name}")
                else:
                    result['error'] = f"HTTP {response.status}"
                    logger.error(f"API {api_name} returned status {response.status}")
        
    except asyncio.TimeoutError:
        result['error'] = "Request timeout"
        logger.error(f"Timeout calling API {api_name}")
    except Exception as e:
        result['error'] = str(e)
        logger.error(f"Error calling API {api_name}: {e}")
    
    return result


async def fetch_apis_parallel(
    api_selection: Dict,
    api_catalog: Dict,
    max_concurrent: int = 5
) -> List[Dict[str, Any]]:
    """
    Fetch data from multiple APIs in parallel.
    
    Args:
        api_selection: Dict with 'apis' list from model
        api_catalog: Full API catalog
        max_concurrent: Maximum number of concurrent requests
        
    Returns:
        List of API response dicts
    """
    apis_to_call = api_selection.get('apis', [])
    
    if not apis_to_call:
        logger.warning("No APIs to call")
        return []
    
    logger.info(f"Fetching data from {len(apis_to_call)} APIs in parallel")
    
    # Create tasks for all API calls
    tasks = []
    for api_spec in apis_to_call:
        api_name = api_spec.get('name')
        params = api_spec.get('params', {})
        
        if not api_name:
            logger.warning("Skipping API with no name")
            continue
        
        task = call_api(api_name, params, api_catalog)
        tasks.append(task)
    
    # Execute all tasks in parallel with semaphore for rate limiting
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def limited_call(task):
        async with semaphore:
            return await task
    
    results = await asyncio.gather(*[limited_call(task) for task in tasks])
    
    # Log summary
    successful = sum(1 for r in results if r.get('success'))
    logger.info(f"API fetch complete: {successful}/{len(results)} successful")
    
    return results


def format_api_data_for_model(api_results: List[Dict[str, Any]]) -> str:
    """
    Format API results into a readable string for the model.
    
    Args:
        api_results: List of API response dicts
        
    Returns:
        Formatted string with API data
    """
    if not api_results:
        return "Ingen data hämtad från API:er."
    
    formatted_parts = []
    
    for result in api_results:
        if not result.get('success'):
            continue
        
        api_name = result.get('api_name', 'Unknown')
        source = result.get('source', api_name)
        data = result.get('data', {})
        
        # Format based on API type
        # This is a simple formatter - can be enhanced per API type
        formatted_parts.append(f"\n--- {source} ---")
        formatted_parts.append(json.dumps(data, ensure_ascii=False, indent=2))
    
    if not formatted_parts:
        return "Inga lyckade API-anrop."
    
    return "\n".join(formatted_parts)


def create_api_selection_prompt(
    query: str,
    character_api_map: Dict
) -> str:
    """
    Create a prompt for the model to select which APIs to use.
    
    Args:
        query: User's query
        character_api_map: Filtered API map for current personality
        
    Returns:
        Formatted prompt string
    """
    # Extract available APIs
    available_apis = []
    # Support both 'api_categories' and 'api_catalog' keys for backward compatibility
    catalog_key = 'api_catalog' if 'api_catalog' in character_api_map else 'api_categories'
    for category_name, category_data in character_api_map.get(catalog_key, {}).items():
        for api in category_data.get('apis', []):
            api_info = {
                'name': api.get('name'),
                'source': api.get('source'),
                'keywords': api.get('keywords', []),
                'description': category_data.get('description', '')
            }
            available_apis.append(api_info)
    
    # Create prompt
    prompt = f"""Du har tillgång till följande API:er:

{json.dumps(available_apis, ensure_ascii=False, indent=2)}

Användarens fråga: "{query}"

Analysera frågan och välj vilka API:er som behövs för att svara. Svara BARA med JSON i detta format:
{{"apis": [{{"name": "api_namn", "params": {{"param1": "värde1"}}}}]}}

Om inga API:er behövs, svara: {{"apis": []}}

JSON:"""
    
    return prompt


# ===== Example Usage =====
if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    
    # Test API selection parsing
    test_response = '''
    {
        "apis": [
            {"name": "smhi_current", "params": {"lon": "17.3", "lat": "60.6"}},
            {"name": "yr_no", "params": {"location": "Hjo"}}
        ]
    }
    '''
    
    selection = parse_api_selection(test_response)
    print(f"Parsed selection: {selection}")
