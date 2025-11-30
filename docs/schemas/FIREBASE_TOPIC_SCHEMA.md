# Firebase Database Schema for ONESEEK Δ+

## Overview

This document describes the Firebase Firestore schema for ONESEEK Δ+ topic-based conversation memory system.

## Collections

### `topics`

Stores topic metadata for grouping related conversations.

```javascript
{
  topic_hash: string,        // 16-char SHA-256 hash of "intent:entity"
  intent: string,            // Intent name (e.g., "befolkning", "väder")
  entity: string,            // Entity text (e.g., "Hjo", "Stockholm")
  label: string,             // Human-readable label (e.g., "Befolkning i Hjo")
  created_at: timestamp,     // When first message was created
  updated_at: timestamp,     // Last message timestamp
  message_count: number      // Total messages in this topic
}
```

**Indexes:**
- `topic_hash` (unique)
- `intent`
- `updated_at` (for sorting)

### `messages`

Stores individual conversation messages.

```javascript
{
  id: string,                // Auto-generated document ID
  topic_hash: string,        // Reference to topic
  user_id_hash: string,      // Anonymized user ID (16-char hash)
  
  // Message content
  question: string,          // User's question
  answer: string,            // AI's response
  
  // Metadata
  intent: string,            // Detected intent
  entity: string,            // Detected entity
  confidence: number,        // Intent confidence (0-1)
  
  // Sources and verification
  sources: array,            // Array of source URLs/references
  blockchain_hash: string,   // Hash for verification
  
  // Timestamps
  timestamp: timestamp,      // When message was created
  
  // Additional metadata
  metadata: {
    typo_corrections: array, // Any spelling corrections made
    delta_info: object,      // Change information if applicable
    api_used: string         // Which API was called
  }
}
```

**Indexes:**
- `topic_hash` + `timestamp` (compound, for fetching topic messages)
- `user_id_hash` + `timestamp` (compound, for user history)
- `timestamp` (for global queries)

### `typo_pairs`

Stores spelling corrections for training.

```javascript
{
  id: string,                // Auto-generated
  original: string,          // Original (misspelled) text
  corrected: string,         // Corrected text
  context: string,           // Surrounding context
  user_accepted: boolean,    // Whether user accepted correction
  timestamp: timestamp
}
```

### `gold_examples`

Stores high-quality Q&A pairs for training.

```javascript
{
  id: string,
  question: string,
  answer: string,
  intent: string,
  entity: string,
  sources: array,
  confidence: number,
  approved: boolean,         // Admin approved
  approved_by: string,       // Admin user ID
  approved_at: timestamp,
  created_at: timestamp
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Topics - read by anyone, write only by server
    match /topics/{topicId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Messages - read by owner (hashed), write only by server
    match /messages/{messageId} {
      allow read: if true;  // All messages are anonymized
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Typo pairs - admin only
    match /typo_pairs/{pairId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Gold examples - admin only
    match /gold_examples/{exampleId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Example Queries

### Get all messages in a topic (Python)

```python
from google.cloud import firestore

db = firestore.Client()

def get_topic_messages(topic_hash, limit=20):
    messages = db.collection('messages') \
        .where('topic_hash', '==', topic_hash) \
        .order_by('timestamp', direction=firestore.Query.DESCENDING) \
        .limit(limit) \
        .stream()
    
    return [msg.to_dict() for msg in messages]
```

### Get user's topics (Python)

```python
def get_user_topics(user_id_hash, limit=20):
    # Get unique topics from user's messages
    messages = db.collection('messages') \
        .where('user_id_hash', '==', user_id_hash) \
        .order_by('timestamp', direction=firestore.Query.DESCENDING) \
        .limit(1000) \
        .stream()
    
    topics = {}
    for msg in messages:
        data = msg.to_dict()
        th = data.get('topic_hash')
        if th and th not in topics:
            topics[th] = {
                'topic_hash': th,
                'intent': data.get('intent'),
                'entity': data.get('entity'),
                'last_message': data.get('timestamp')
            }
        if len(topics) >= limit:
            break
    
    return list(topics.values())
```

### Save message with topic (Python)

```python
import hashlib
from datetime import datetime

def generate_topic_hash(intent, entity):
    key = f"{intent.lower()}:{entity.lower().strip() if entity else 'general'}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]

def save_message(user_id, question, answer, intent, entity, metadata=None):
    topic_hash = generate_topic_hash(intent, entity)
    user_id_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    # Save message
    db.collection('messages').add({
        'topic_hash': topic_hash,
        'user_id_hash': user_id_hash,
        'question': question,
        'answer': answer,
        'intent': intent,
        'entity': entity,
        'timestamp': datetime.now(),
        'metadata': metadata or {}
    })
    
    # Update or create topic
    topic_ref = db.collection('topics').document(topic_hash)
    topic = topic_ref.get()
    
    if topic.exists:
        topic_ref.update({
            'updated_at': datetime.now(),
            'message_count': firestore.Increment(1)
        })
    else:
        topic_ref.set({
            'topic_hash': topic_hash,
            'intent': intent,
            'entity': entity,
            'label': get_topic_label(intent, entity),
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'message_count': 1
        })
```

## Migration Guide

If you have existing data, follow these steps to migrate:

1. **Export existing messages** from current storage
2. **Generate topic_hash** for each message based on intent + entity
3. **Create topic documents** for unique topic_hash values
4. **Import messages** with new schema
5. **Update application code** to use new API endpoints

## Topic Hash Algorithm

The topic hash ensures that semantically similar questions end up in the same topic:

```python
def generate_topic_hash(intent: str, entity: str) -> str:
    """
    Generate topic hash from intent and entity.
    
    Examples:
    - "befolkning" + "Hjo" → sha256("befolkning:hjo")[:16]
    - "befolkning" + "HJO" → sha256("befolkning:hjo")[:16] (same!)
    - "väder" + "Stockholm" → sha256("väder:stockholm")[:16]
    """
    key = f"{intent.lower()}:{entity.lower().strip() if entity else 'general'}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]
```

This means:
- "Hur många bor i Hjo?" → topic_hash = sha256("befolkning:hjo")
- "Hur många invånare har Hjo?" → same topic_hash!
- "Vad är folkmängden i Hjo?" → same topic_hash!

All these questions end up in the same conversation thread.
