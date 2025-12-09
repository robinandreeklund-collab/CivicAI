"""
ONESEEK Personality Selector - Δ+ v6.2
Automatic personality selection using embedding-based matching with sentence-transformers
Supports dynamic API mapping based on personality tags
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

# Try to import sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not available. Install with: pip install sentence-transformers")

# Global embedding model instance
_embedding_model = None
_last_personality = None
_conversation_history = []


def get_embedding_model():
    """
    Get or create the sentence transformer model for multilingual embeddings.
    Uses paraphrase-multilingual-MiniLM-L12-v2 as specified in requirements.
    """
    global _embedding_model
    
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        logger.error("sentence-transformers library not installed")
        return None
    
    if _embedding_model is None:
        try:
            logger.info("Loading sentence-transformers model: paraphrase-multilingual-MiniLM-L12-v2")
            _embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return None
    
    return _embedding_model


def load_personality_catalog(config_path: str = None) -> Dict:
    """
    Load personality catalog from JSON file.
    
    Args:
        config_path: Path to personality_catalog.json. If None, uses default location.
        
    Returns:
        Dict containing personality catalog data
    """
    if config_path is None:
        # Default path relative to project root
        project_root = Path(__file__).parent.parent
        config_path = project_root / "config" / "personality_catalog.json"
    else:
        config_path = Path(config_path)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        logger.info(f"Loaded personality catalog from {config_path}")
        return catalog
    except Exception as e:
        logger.error(f"Failed to load personality catalog from {config_path}: {e}")
        return {}


def load_api_catalog(config_path: str = None) -> Dict:
    """
    Load API catalog from JSON file.
    
    Args:
        config_path: Path to api_catalog.json. If None, uses default location.
        
    Returns:
        Dict containing API catalog data
    """
    if config_path is None:
        # Default path relative to project root
        project_root = Path(__file__).parent.parent
        config_path = project_root / "config" / "api_catalog.json"
    else:
        config_path = Path(config_path)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        logger.info(f"Loaded API catalog from {config_path}")
        return catalog
    except Exception as e:
        logger.error(f"Failed to load API catalog from {config_path}: {e}")
        return {}


def calculate_keyword_match(query: str, keywords: List[str]) -> float:
    """
    Calculate keyword match score between query and keyword list.
    
    Args:
        query: User's query text
        keywords: List of keywords to match against
        
    Returns:
        Match score between 0 and 1
    """
    query_lower = query.lower()
    matches = sum(1 for keyword in keywords if keyword.lower() in query_lower)
    
    if not keywords:
        return 0.0
    
    return matches / len(keywords)


def calculate_embedding_similarity(query: str, keywords: List[str], model) -> float:
    """
    Calculate semantic similarity using embeddings.
    
    Args:
        query: User's query text
        keywords: List of keywords/phrases to compare
        model: Sentence transformer model
        
    Returns:
        Similarity score between 0 and 1
    """
    if not keywords or model is None:
        return 0.0
    
    try:
        # Encode query
        query_embedding = model.encode([query], convert_to_tensor=False)[0]
        
        # Encode all keywords
        keyword_embeddings = model.encode(keywords, convert_to_tensor=False)
        
        # Calculate cosine similarities
        similarities = []
        for keyword_emb in keyword_embeddings:
            # Cosine similarity
            similarity = np.dot(query_embedding, keyword_emb) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(keyword_emb)
            )
            similarities.append(similarity)
        
        # Return max similarity
        return float(max(similarities)) if similarities else 0.0
    except Exception as e:
        logger.error(f"Error calculating embedding similarity: {e}")
        return 0.0


def select_personality(
    query: str,
    personality_catalog: Dict = None,
    boost_recent: bool = True,
    recent_boost_factor: float = 0.4
) -> Tuple[str, str, float, Dict]:
    """
    Select the best personality for the given query using embedding-based matching.
    
    Steps:
    1. Calculate keyword match scores for all personalities
    2. Calculate embedding similarity scores for all personalities
    3. Combine scores
    4. Apply 40% boost to recent personality if related
    5. Return best match
    
    Args:
        query: User's query text
        personality_catalog: Personality catalog dict. If None, loads from config.
        boost_recent: Whether to boost the recently used personality
        recent_boost_factor: Boost factor for recent personality (default 0.4 = 40%)
        
    Returns:
        Tuple of (personality_id, personality_name, confidence_score, personality_data)
    """
    global _last_personality
    
    # Load catalog if not provided
    if personality_catalog is None:
        catalog = load_personality_catalog()
    else:
        catalog = personality_catalog
    
    if not catalog or 'personality_catalog' not in catalog:
        logger.error("Invalid or empty personality catalog")
        return ("oneseek-medveten", "Medveten", 0.0, {})
    
    personalities = catalog['personality_catalog']
    
    # Get embedding model
    model = get_embedding_model()
    
    # Calculate scores for each personality
    scores = {}
    for personality_id, personality_data in personalities.items():
        keywords = personality_data.get('keywords', [])
        categories = personality_data.get('categories', [])
        
        # Combine keywords and categories for matching
        all_terms = keywords + categories
        
        # Keyword match score (simple substring matching)
        keyword_score = calculate_keyword_match(query, all_terms)
        
        # Embedding similarity score (semantic matching)
        embedding_score = calculate_embedding_similarity(query, all_terms, model) if model else 0.0
        
        # Combine scores (weighted average: 40% keyword, 60% embedding)
        combined_score = (keyword_score * 0.4) + (embedding_score * 0.6)
        
        # Apply recent personality boost
        if boost_recent and _last_personality == personality_id and combined_score > 0:
            # Apply boost proportionally without exceeding 1.0
            boost_amount = combined_score * recent_boost_factor
            combined_score = min(1.0, combined_score + boost_amount)
            logger.info(f"Applied {recent_boost_factor*100}% boost to recent personality: {personality_id}")
        
        scores[personality_id] = {
            'score': combined_score,
            'keyword_score': keyword_score,
            'embedding_score': embedding_score,
            'data': personality_data
        }
    
    # Find best match
    if not scores:
        # Fallback to default
        default_id = catalog.get('selection_rules', {}).get('fallback', 'oneseek-medveten')
        default_data = personalities.get(default_id, {})
        return (default_id, default_data.get('name', 'Medveten'), 0.0, default_data)
    
    best_personality_id = max(scores.keys(), key=lambda k: scores[k]['score'])
    best_score = scores[best_personality_id]
    
    # Check minimum confidence threshold
    min_confidence = catalog.get('selection_rules', {}).get('min_keyword_confidence', 0.6)
    
    if best_score['score'] < min_confidence:
        # Use default/fallback personality
        default_id = catalog.get('selection_rules', {}).get('fallback', 'oneseek-medveten')
        default_data = personalities.get(default_id, {})
        logger.info(f"Score below threshold ({best_score['score']:.2f} < {min_confidence}), using fallback: {default_id}")
        _last_personality = default_id
        return (default_id, default_data.get('name', 'Medveten'), best_score['score'], default_data)
    
    # Update last personality
    _last_personality = best_personality_id
    
    logger.info(
        f"Selected personality: {best_personality_id} "
        f"(score: {best_score['score']:.3f}, "
        f"keyword: {best_score['keyword_score']:.3f}, "
        f"embedding: {best_score['embedding_score']:.3f})"
    )
    
    return (
        best_personality_id,
        best_score['data'].get('name', best_personality_id),
        best_score['score'],
        best_score['data']
    )


def create_character_api_map(
    personality_data: Dict,
    api_catalog: Dict = None,
    output_path: str = None
) -> Dict:
    """
    Create a filtered API map for the selected personality based on tags.
    
    Args:
        personality_data: The selected personality's data
        api_catalog: API catalog dict. If None, loads from config.
        output_path: Path to save character_api.json. If None, uses runtime/character_api.json
        
    Returns:
        Dict containing filtered API catalog for this personality
    """
    # Load API catalog if not provided
    if api_catalog is None:
        api_catalog = load_api_catalog()
    
    if not api_catalog or 'api_catalog' not in api_catalog:
        logger.error("Invalid or empty API catalog")
        return {}
    
    # Get personality tags
    personality_name = personality_data.get('name', '').lower()
    personality_id = personality_data.get('card_file', '').lower()
    
    # Create simplified tag from personality name/id
    personality_tag = personality_name.replace(' ', '').replace('-', '').lower()
    
    # Filter APIs that match this personality's tags
    filtered_apis = {}
    for category_name, category_data in api_catalog['api_catalog'].items():
        personality_tags = category_data.get('personality_tags', [])
        
        # Check if this personality matches
        if personality_tag in [tag.lower() for tag in personality_tags]:
            filtered_apis[category_name] = category_data
            logger.info(f"Matched API category '{category_name}' for personality '{personality_name}'")
    
    # Create character API map
    character_api = {
        'personality': personality_data.get('name'),
        'personality_id': personality_id,
        'timestamp': datetime.now().isoformat(),
        'api_categories': filtered_apis,
        'system_prompt': personality_data.get('prompt', '')
    }
    
    # Save to file if path provided
    if output_path is None:
        project_root = Path(__file__).parent.parent
        output_path = project_root / "runtime" / "character_api.json"
    else:
        output_path = Path(output_path)
    
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(character_api, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved character API map to {output_path}")
    except Exception as e:
        logger.error(f"Failed to save character API map: {e}")
    
    return character_api


def override_personality(personality_id: str, personality_catalog: Dict = None) -> Optional[Dict]:
    """
    Manually override the personality selection.
    
    Args:
        personality_id: The ID of the personality to use
        personality_catalog: Personality catalog dict. If None, loads from config.
        
    Returns:
        Personality data dict or None if not found
    """
    global _last_personality
    
    # Load catalog if not provided
    if personality_catalog is None:
        catalog = load_personality_catalog()
    else:
        catalog = personality_catalog
    
    if not catalog or 'personality_catalog' not in catalog:
        logger.error("Invalid or empty personality catalog")
        return None
    
    personalities = catalog['personality_catalog']
    
    if personality_id not in personalities:
        logger.error(f"Personality '{personality_id}' not found in catalog")
        return None
    
    _last_personality = personality_id
    logger.info(f"Manually overridden personality to: {personality_id}")
    
    return personalities[personality_id]


def get_current_personality() -> Optional[str]:
    """Get the currently selected personality ID."""
    return _last_personality


def reset_personality():
    """Reset the personality selection (clears last personality)."""
    global _last_personality
    _last_personality = None
    logger.info("Personality selection reset")


# ===== Example Usage =====
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test queries
    test_queries = [
        "Vad är vädret imorgon i Stockholm?",
        "Vilka böcker har Astrid Lindgren skrivit?",
        "Hej, vem är du?",
    ]
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"{'='*60}")
        
        personality_id, name, confidence, data = select_personality(query)
        print(f"Selected: {name} ({personality_id})")
        print(f"Confidence: {confidence:.3f}")
        
        # Create API map
        api_map = create_character_api_map(data)
        print(f"Available API categories: {len(api_map.get('api_categories', {}))}")
