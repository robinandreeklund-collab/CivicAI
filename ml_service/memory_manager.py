"""
Memory Manager for ONESEEK Δ+
Topic-gruppering + Semantisk historik

Funktionalitet:
- Sparar varje meddelande med topic_hash + timestamp
- AI:n minns vad ni pratade om (även "gör det", "det där")
- Historiken grupperas snyggt efter ämne (Hjo-befolkning, Göteborg-hotell)
- Samma fråga med olika formuleringar hamnar i samma tråd
- 100% anonymt – ingen persondata sparas

Author: ONESEEK Team
"""

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

# Memory storage directory
MEMORY_DIR = Path(__file__).parent.parent / "memory"

# Configuration constants
MAX_LINES_TO_READ = 2000  # Max lines to read from a single file
DEFAULT_CONTEXT_LIMIT = 10
DEFAULT_TOPIC_LIMIT = 20


def generate_topic_hash(intent: str, entity: str = "") -> str:
    """
    Generera en topic_hash baserat på intent och entity.
    Samma intent + entity → samma hash → samma tråd.
    
    Args:
        intent: Intent-namn (t.ex. "befolkning", "väder")
        entity: Entity-text (t.ex. "Hjo", "Stockholm")
        
    Returns:
        16-teckens SHA-256 hash
    """
    key = f"{intent.lower()}:{entity.lower().strip() if entity else 'general'}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def get_user_hash(user_id: str) -> str:
    """
    Anonymisera user_id till en hash.
    
    Args:
        user_id: Användar-ID (kan vara IP, session, etc.)
        
    Returns:
        16-teckens anonymiserad hash
    """
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


def save_message_with_memory(
    user_id: str,
    question: str,
    answer: str,
    topic_hash: str,
    intent: str = "",
    entity: str = "",
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Spara ett meddelande med topic_hash + timestamp.
    
    Args:
        user_id: Användar-ID (anonymiseras)
        question: Användarens fråga
        answer: AI:ns svar
        topic_hash: Topic-hash för gruppering
        intent: Intent-namn
        entity: Entity-text
        metadata: Extra metadata (sources, confidence, etc.)
        
    Returns:
        True om sparning lyckades
    """
    try:
        entry = {
            "user_id_hash": get_user_hash(user_id),
            "question": question,
            "answer": answer,
            "topic_hash": topic_hash,
            "timestamp": datetime.now().isoformat(),
            "intent": intent,
            "entity": entity,
            "metadata": metadata or {}
        }
        
        # Sparar i månadsfiler för skalbarhet
        month = datetime.now().strftime("%Y-%m")
        MEMORY_DIR.mkdir(exist_ok=True)
        
        memory_file = MEMORY_DIR / f"{month}.jsonl"
        
        with open(memory_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        
        return True
        
    except Exception as e:
        logger.warning(f"[MEMORY] Error saving message: {e}")
        return False


def get_topic_context(topic_hash: str, limit: int = 10) -> List[Dict[str, str]]:
    """
    Hämta alla meddelanden i samma topic – för kontext.
    
    Args:
        topic_hash: Topic-hash att söka efter
        limit: Max antal meddelanden att returnera
        
    Returns:
        Lista med meddelanden i konversationsformat
    """
    messages = []
    
    try:
        if not MEMORY_DIR.exists():
            return messages
        
        # Läs filer i omvänd kronologisk ordning (nyast först)
        for file in sorted(MEMORY_DIR.glob("*.jsonl"), reverse=True):
            try:
                lines = file.read_text(encoding="utf-8").splitlines()
                # Läs senaste 1000 rader för prestanda
                for line in reversed(lines[-MAX_LINES_TO_READ:]):
                    if not line.strip():
                        continue
                    
                    try:
                        msg = json.loads(line)
                        if msg.get("topic_hash") == topic_hash:
                            # Lägg till fråga
                            if msg.get("question"):
                                messages.append({
                                    "role": "user",
                                    "content": msg["question"]
                                })
                            # Lägg till svar
                            if msg.get("answer"):
                                messages.append({
                                    "role": "assistant",
                                    "content": msg["answer"]
                                })
                            
                            # Kolla limit (2 meddelanden per entry: fråga + svar)
                            if len(messages) >= limit * 2:
                                return list(reversed(messages))
                    except json.JSONDecodeError:
                        continue
                        
            except Exception as e:
                logger.warning(f"[MEMORY] Error reading {file}: {e}")
                continue
    
    except Exception as e:
        logger.warning(f"[MEMORY] Error getting topic context: {e}")
    
    return list(reversed(messages))


def get_user_topics(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Hämta alla unika topics för en användare.
    
    Args:
        user_id: Användar-ID
        limit: Max antal topics att returnera
        
    Returns:
        Lista med topics och deras metadata
    """
    user_hash = get_user_hash(user_id)
    topics = {}
    
    try:
        if not MEMORY_DIR.exists():
            return []
        
        for file in sorted(MEMORY_DIR.glob("*.jsonl"), reverse=True):
            try:
                lines = file.read_text(encoding="utf-8").splitlines()
                for line in reversed(lines[-MAX_LINES_TO_READ:]):
                    if not line.strip():
                        continue
                    
                    try:
                        msg = json.loads(line)
                        if msg.get("user_id_hash") != user_hash:
                            continue
                        
                        topic_hash = msg.get("topic_hash")
                        if not topic_hash:
                            continue
                        
                        if topic_hash not in topics:
                            topics[topic_hash] = {
                                "topic_hash": topic_hash,
                                "intent": msg.get("intent", "general"),
                                "entity": msg.get("entity", ""),
                                "message_count": 0,
                                "last_message": msg.get("timestamp"),
                                "first_question": msg.get("question", "")
                            }
                        
                        topics[topic_hash]["message_count"] += 1
                        
                        if len(topics) >= limit:
                            break
                            
                    except json.JSONDecodeError:
                        continue
                        
            except Exception as e:
                logger.warning(f"[MEMORY] Error reading {file}: {e}")
                continue
            
            if len(topics) >= limit:
                break
    
    except Exception as e:
        logger.warning(f"[MEMORY] Error getting user topics: {e}")
    
    # Sortera efter senaste meddelande
    sorted_topics = sorted(
        topics.values(),
        key=lambda x: x.get("last_message", ""),
        reverse=True
    )
    
    return sorted_topics[:limit]


def get_topic_label(intent: str, entity: str) -> str:
    """
    Generera en läsbar etikett för en topic.
    
    Args:
        intent: Intent-namn
        entity: Entity-text
        
    Returns:
        Läsbar etikett (t.ex. "Befolkning i Hjo")
    """
    intent_labels = {
        "befolkning": "Befolkning",
        "väder": "Väder",
        "nyheter": "Nyheter",
        "politik": "Politik",
        "trafik": "Trafik",
        "hälsa": "Hälsa",
        "ekonomi": "Ekonomi",
        "general": "Allmänt"
    }
    
    label = intent_labels.get(intent, intent.capitalize())
    
    if entity:
        return f"{label} i {entity}"
    return label


def group_messages_by_topic(messages: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Gruppera meddelanden efter topic_hash.
    
    Args:
        messages: Lista med meddelanden
        
    Returns:
        Dict med topic_hash som nyckel och meddelanden som värde
    """
    groups = {}
    
    for msg in messages:
        topic_hash = msg.get("topic_hash", "unknown")
        if topic_hash not in groups:
            groups[topic_hash] = {
                "topic_hash": topic_hash,
                "intent": msg.get("intent", "general"),
                "entity": msg.get("entity", ""),
                "messages": []
            }
        groups[topic_hash]["messages"].append(msg)
    
    return groups


def cleanup_old_memory(days: int = 90) -> int:
    """
    Ta bort gamla minnesfiler.
    
    Args:
        days: Antal dagar att behålla
        
    Returns:
        Antal borttagna filer
    """
    removed = 0
    cutoff = datetime.now()
    
    try:
        if not MEMORY_DIR.exists():
            return 0
        
        for file in MEMORY_DIR.glob("*.jsonl"):
            try:
                # Parsea filnamn (YYYY-MM.jsonl)
                file_month = file.stem
                file_date = datetime.strptime(file_month + "-01", "%Y-%m-%d")
                
                # Beräkna ålder i dagar
                age = (cutoff - file_date).days
                
                if age > days:
                    file.unlink()
                    removed += 1
                    logger.warning(f"[MEMORY] Removed old file: {file}")
                    
            except (ValueError, OSError) as e:
                logger.warning(f"[MEMORY] Error processing {file}: {e}")
                continue
    
    except Exception as e:
        logger.warning(f"[MEMORY] Error during cleanup: {e}")
    
    return removed


# Firebase integration helpers
def get_firebase_topic_structure(topic_hash: str, intent: str, entity: str) -> Dict[str, Any]:
    """
    Returnera Firebase-struktur för en topic.
    
    Args:
        topic_hash: Topic-hash
        intent: Intent-namn
        entity: Entity-text
        
    Returns:
        Firebase-kompatibel struktur
    """
    return {
        "topic_hash": topic_hash,
        "intent": intent,
        "entity": entity,
        "label": get_topic_label(intent, entity),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


def get_firebase_message_structure(
    question: str,
    answer: str,
    topic_hash: str,
    intent: str,
    entity: str,
    sources: List[str] = None,
    confidence: float = None
) -> Dict[str, Any]:
    """
    Returnera Firebase-struktur för ett meddelande.
    
    Args:
        question: Användarens fråga
        answer: AI:ns svar
        topic_hash: Topic-hash
        intent: Intent-namn
        entity: Entity-text
        sources: Lista med källor
        confidence: Förtroendenivå
        
    Returns:
        Firebase-kompatibel struktur
    """
    return {
        "question": question,
        "answer": answer,
        "topic_hash": topic_hash,
        "intent": intent,
        "entity": entity,
        "sources": sources or [],
        "confidence": confidence,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    # Test
    print("=" * 60)
    print("ONESEEK Δ+ Memory Manager Test")
    print("=" * 60)
    
    # Test topic hash generation
    hash1 = generate_topic_hash("befolkning", "Hjo")
    hash2 = generate_topic_hash("befolkning", "hjo")  # Ska ge samma hash
    hash3 = generate_topic_hash("väder", "Stockholm")
    
    print(f"\nTopic hash test:")
    print(f"  befolkning:Hjo = {hash1}")
    print(f"  befolkning:hjo = {hash2} (same: {hash1 == hash2})")
    print(f"  väder:Stockholm = {hash3}")
    
    # Test label generation
    print(f"\nLabel test:")
    print(f"  {get_topic_label('befolkning', 'Hjo')}")
    print(f"  {get_topic_label('väder', 'Stockholm')}")
    print(f"  {get_topic_label('general', '')}")
