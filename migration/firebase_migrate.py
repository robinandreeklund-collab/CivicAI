"""
Firebase Migration Script for ONESEEK Δ+
Migrerar gammal Firebase-struktur till topic-gruppering.

Funktionalitet:
- Läser befintlig Firebase-data
- Genererar topic_hash för varje konversation
- Grupperar meddelanden efter topic
- Skapar ny struktur med memory-format

Author: ONESEEK Team

Användning:
    python firebase_migrate.py --dry-run     # Visa vad som skulle migreras
    python firebase_migrate.py --execute     # Kör migrering
"""

import json
import hashlib
import argparse
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Try to import Firebase Admin
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ firebase-admin not installed. Run: pip install firebase-admin")


def generate_topic_hash(intent: str, entity: str = "") -> str:
    """
    Generera topic_hash baserat på intent och entity.
    Samma logik som i intent_engine.py.
    """
    key = f"{intent.lower()}:{entity.lower().strip() if entity else 'general'}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def detect_intent_from_message(message: str) -> Dict[str, str]:
    """
    Enkel intent-detektion för migrering.
    Mer avancerad detektion görs av Intent Engine vid runtime.
    
    Args:
        message: Meddelandetext att analysera
        
    Returns:
        Dict med 'intent' (str) och 'entity' (str) nycklar.
        Default: {"intent": "general", "entity": ""}
    """
    message_lower = message.lower()
    
    # Enkel keyword-baserad detektion
    intent_keywords = {
        "befolkning": ["befolkning", "invånare", "hur många bor", "folkmängd", "population"],
        "väder": ["väder", "vädret", "regn", "snö", "temperatur", "grader", "prognos"],
        "nyheter": ["nyheter", "senaste", "aktuellt", "händer"],
        "politik": ["riksdag", "regering", "parti", "politik", "votering"],
        "trafik": ["trafik", "väg", "olycka", "kö"],
        "kris": ["kris", "vma", "varning", "nödläge"],
    }
    
    for intent, keywords in intent_keywords.items():
        if any(kw in message_lower for kw in keywords):
            return {"intent": intent, "entity": ""}
    
    return {"intent": "general", "entity": ""}


def extract_city_from_message(message: str) -> str:
    """
    Extrahera stad från meddelande för entity.
    """
    cities = [
        "stockholm", "göteborg", "malmö", "uppsala", "linköping",
        "västerås", "örebro", "helsingborg", "norrköping", "jönköping",
        "luleå", "umeå", "gävle", "karlstad", "växjö", "halmstad",
        "sundsvall", "lund", "borås", "eskilstuna", "hjo", "skövde"
    ]
    
    message_lower = message.lower()
    for city in cities:
        if city in message_lower:
            return city.capitalize()
    
    return ""


class FirebaseMigrator:
    """
    Migrerar Firebase-data till ONESEEK Δ+ topic-struktur.
    """
    
    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.db = None
        self.stats = {
            "messages_processed": 0,
            "topics_created": 0,
            "errors": 0
        }
    
    def connect(self) -> bool:
        """Anslut till Firebase."""
        if not FIREBASE_AVAILABLE:
            print("❌ Firebase Admin SDK not available")
            return False
        
        try:
            # Försök läsa credentials från miljövariabler
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            
            if cred_path and Path(cred_path).exists():
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            elif os.getenv("FIREBASE_PROJECT_ID"):
                # Använd default credentials (för GCP)
                firebase_admin.initialize_app()
            else:
                print("❌ No Firebase credentials found")
                print("   Set FIREBASE_CREDENTIALS_PATH or FIREBASE_PROJECT_ID")
                return False
            
            self.db = firestore.client()
            print("✅ Connected to Firebase")
            return True
            
        except Exception as e:
            print(f"❌ Firebase connection failed: {e}")
            return False
    
    def get_old_messages(self, collection: str = "messages", limit: int = 1000) -> List[Dict]:
        """
        Hämta gamla meddelanden från Firebase.
        """
        if not self.db:
            return []
        
        try:
            docs = self.db.collection(collection).limit(limit).stream()
            messages = []
            
            for doc in docs:
                data = doc.to_dict()
                data["_id"] = doc.id
                messages.append(data)
            
            print(f"📥 Hämtade {len(messages)} meddelanden från '{collection}'")
            return messages
            
        except Exception as e:
            print(f"❌ Error fetching messages: {e}")
            return []
    
    def transform_message(self, old_msg: Dict) -> Optional[Dict]:
        """
        Transformera ett gammalt meddelande till nytt topic-format.
        """
        try:
            # Extrahera data från gamla formatet
            question = old_msg.get("question") or old_msg.get("user_message") or old_msg.get("input", "")
            answer = old_msg.get("answer") or old_msg.get("bot_response") or old_msg.get("output", "")
            timestamp = old_msg.get("timestamp") or old_msg.get("created_at") or datetime.now().isoformat()
            user_id = old_msg.get("user_id") or old_msg.get("session_id", "anonymous")
            
            if not question:
                return None
            
            # Detektera intent och entity
            intent_data = detect_intent_from_message(question)
            entity = extract_city_from_message(question)
            
            if entity:
                intent_data["entity"] = entity
            
            # Generera topic_hash
            topic_hash = generate_topic_hash(
                intent_data["intent"],
                intent_data.get("entity", "")
            )
            
            # Skapa nytt meddelande i topic-format
            new_msg = {
                "user_id_hash": hashlib.sha256(user_id.encode()).hexdigest()[:16],
                "question": question,
                "answer": answer or "",
                "topic_hash": topic_hash,
                "intent": intent_data["intent"],
                "entity": intent_data.get("entity", ""),
                "timestamp": timestamp if isinstance(timestamp, str) else timestamp.isoformat(),
                "migrated": True,
                "migrated_at": datetime.now().isoformat(),
                "original_id": old_msg.get("_id", "")
            }
            
            return new_msg
            
        except Exception as e:
            print(f"⚠️ Transform error: {e}")
            self.stats["errors"] += 1
            return None
    
    def save_to_new_collection(self, messages: List[Dict], collection: str = "memory"):
        """
        Spara transformerade meddelanden till ny collection.
        """
        if not self.db or self.dry_run:
            return
        
        try:
            batch = self.db.batch()
            
            for msg in messages:
                doc_ref = self.db.collection(collection).document()
                batch.set(doc_ref, msg)
            
            batch.commit()
            print(f"💾 Sparade {len(messages)} meddelanden till '{collection}'")
            
        except Exception as e:
            print(f"❌ Error saving to Firebase: {e}")
            self.stats["errors"] += 1
    
    def save_to_local_jsonl(self, messages: List[Dict], output_path: Optional[Path] = None):
        """
        Spara till lokal JSONL-fil (backup/alternativ till Firebase).
        """
        if output_path is None:
            output_path = Path(__file__).parent.parent / "memory" / f"migration_{datetime.now().strftime('%Y%m%d')}.jsonl"
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if self.dry_run:
            print(f"[DRY RUN] Skulle spara {len(messages)} meddelanden till {output_path}")
            return
        
        with open(output_path, 'a', encoding='utf-8') as f:
            for msg in messages:
                f.write(json.dumps(msg, ensure_ascii=False) + "\n")
        
        print(f"💾 Sparade {len(messages)} meddelanden till {output_path}")
    
    def migrate(self, old_collection: str = "messages", new_collection: str = "memory"):
        """
        Kör fullständig migrering.
        """
        print("\n" + "=" * 60)
        print("🔄 ONESEEK Δ+ Firebase Migration")
        print("=" * 60)
        
        if self.dry_run:
            print("⚠️  DRY RUN MODE - Inga ändringar görs")
        
        # Steg 1: Hämta gamla meddelanden
        print("\n📥 Steg 1: Hämtar gamla meddelanden...")
        old_messages = self.get_old_messages(old_collection)
        
        if not old_messages:
            print("ℹ️  Inga meddelanden att migrera")
            return
        
        # Steg 2: Transformera till nytt format
        print("\n🔄 Steg 2: Transformerar till topic-format...")
        new_messages = []
        topics = set()
        
        for old_msg in old_messages:
            new_msg = self.transform_message(old_msg)
            if new_msg:
                new_messages.append(new_msg)
                topics.add(new_msg["topic_hash"])
                self.stats["messages_processed"] += 1
        
        self.stats["topics_created"] = len(topics)
        
        # Steg 3: Visa preview
        print(f"\n📊 Preview:")
        print(f"   Meddelanden processade: {self.stats['messages_processed']}")
        print(f"   Unika topics: {self.stats['topics_created']}")
        print(f"   Fel: {self.stats['errors']}")
        
        # Visa exempel
        if new_messages:
            print(f"\n📝 Exempel på transformerat meddelande:")
            example = new_messages[0]
            print(f"   Topic hash: {example['topic_hash']}")
            print(f"   Intent: {example['intent']}")
            print(f"   Entity: {example.get('entity', '(none)')}")
            print(f"   Question: {example['question'][:50]}...")
        
        # Steg 4: Spara
        print("\n💾 Steg 3: Sparar till ny struktur...")
        
        # Spara alltid till lokal JSONL (som backup)
        self.save_to_local_jsonl(new_messages)
        
        # Spara till Firebase om möjligt och inte dry run
        if self.db and not self.dry_run:
            self.save_to_new_collection(new_messages, new_collection)
        
        # Sammanfattning
        print("\n" + "=" * 60)
        print("✅ Migrering " + ("simulerad" if self.dry_run else "slutförd") + "!")
        print("=" * 60)
        print(f"   📊 {self.stats['messages_processed']} meddelanden")
        print(f"   📁 {self.stats['topics_created']} topics")
        print(f"   ❌ {self.stats['errors']} fel")
        
        if self.dry_run:
            print("\n💡 Kör med --execute för att genomföra migreringen")


def main():
    parser = argparse.ArgumentParser(
        description="Migrera Firebase till ONESEEK Δ+ topic-struktur"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Simulera migrering utan att skriva (default)"
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Kör faktisk migrering"
    )
    parser.add_argument(
        "--old-collection",
        default="messages",
        help="Namn på gammal collection (default: messages)"
    )
    parser.add_argument(
        "--new-collection",
        default="memory",
        help="Namn på ny collection (default: memory)"
    )
    
    args = parser.parse_args()
    
    # Dry run om inte --execute specificeras
    dry_run = not args.execute
    
    migrator = FirebaseMigrator(dry_run=dry_run)
    
    # Anslut till Firebase (inte nödvändigt för dry run med lokal data)
    if FIREBASE_AVAILABLE:
        migrator.connect()
    
    # Kör migrering
    migrator.migrate(
        old_collection=args.old_collection,
        new_collection=args.new_collection
    )


if __name__ == "__main__":
    main()
