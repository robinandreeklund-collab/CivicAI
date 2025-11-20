#!/usr/bin/env python3
"""
Firebase Setup Script for OQT-1.0
Creates required Firestore collections and indexes
"""

import os
import sys
import json
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Required collections and their schema
# Based on actual usage in the codebase
COLLECTIONS = {
    'ai_interactions': {
        'description': 'Unified collection for questions, raw responses from external AI, and ML pipeline analyses',
        'datatype': 'Document with nested objects',
        'purpose': 'Stores complete interaction data: user question, raw AI responses (GPT, Gemini, etc.), and pipeline analysis results (consensus, bias, fairness)',
        'sample_doc': {
            'interactionId': 'auto_generated',
            'question': {
                'text': 'User question text',
                'timestamp': 'ISO timestamp',
                'userId': 'optional user ID',
                'source': 'start_view|oqt_dashboard'
            },
            'raw_responses': [
                {
                    'service': 'gpt4|gemini|grok|claude|deepseek|qwen',
                    'response': 'AI response text',
                    'timestamp': 'ISO timestamp',
                    'latency_ms': 0,
                    'tokens': 0,
                    'model_version': 'model name'
                }
            ],
            'processed_data': {
                'consensus': {
                    'score': 0.0,
                    'level': 'high|medium|low',
                    'metrics': {}
                },
                'bias': {
                    'aggregated_score': 0.0,
                    'level': 'low|medium|high',
                    'types': []
                },
                'fairness': {
                    'score': 0.0,
                    'level': 'excellent|good|fair|poor'
                },
                'meta_summary': {}
            },
            'timestamp': 'ISO timestamp'
        },
        'indexes': [
            {'fields': [('question.source', 'ASCENDING'), ('timestamp', 'DESCENDING')]},
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_queries': {
        'description': 'Direct queries to OQT-1.0 model from dashboard',
        'datatype': 'Document',
        'purpose': 'Tracks user interactions with OQT-1.0, including questions, responses, confidence scores, and metadata',
        'sample_doc': {
            'queryId': 'auto_generated',
            'question': 'user question',
            'response': 'OQT-1.0 response',
            'confidence': 0.0,
            'timestamp': 'ISO timestamp',
            'model': 'OQT-1.0',
            'version': '1.2.0',
            'metadata': {
                'tokens': 0,
                'latency_ms': 0,
                'modelsUsed': []
            }
        },
        'indexes': [
            {'fields': [('timestamp', 'DESCENDING')]},
            {'fields': [('version', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_training_events': {
        'description': 'Training event logs for OQT-1.0 (micro-training and batch training)',
        'datatype': 'Document',
        'purpose': 'Records all training sessions including real-time micro-training (two-stage) and weekly batch training',
        'sample_doc': {
            'trainingId': 'auto_generated',
            'type': 'micro-training|batch-training|weekly-training',
            'timestamp': 'ISO timestamp',
            'samplesProcessed': 0,
            'stage1': {
                'method': 'raw_response_training',
                'samplesProcessed': 0,
                'updated': True
            },
            'stage2': {
                'method': 'analyzed_data_training',
                'metricsUpdated': True
            },
            'modelVersion': '1.2.0',
            'metrics': {
                'accuracy': 0.0,
                'fairness': 0.0,
                'bias': 0.0,
                'consensus': 0.0
            }
        },
        'indexes': [
            {'fields': [('type', 'ASCENDING'), ('timestamp', 'DESCENDING')]},
            {'fields': [('modelVersion', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_metrics': {
        'description': 'Performance metrics for OQT-1.0 model over time',
        'datatype': 'Document',
        'purpose': 'Tracks model performance, fairness scores, bias levels, and usage statistics',
        'sample_doc': {
            'metricId': 'auto_generated',
            'version': '1.2.0',
            'timestamp': 'ISO timestamp',
            'metrics': {
                'accuracy': 0.0,
                'fairness': 0.0,
                'bias': 0.0,
                'consensus': 0.0
            },
            'training': {
                'totalSamples': 0,
                'weeklyBatches': 0,
                'microBatches': 0
            }
        },
        'indexes': [
            {'fields': [('version', 'ASCENDING'), ('timestamp', 'DESCENDING')]},
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_provenance': {
        'description': 'Provenance tracking for transparency and auditability',
        'datatype': 'Document',
        'purpose': 'Maintains complete processing history for each query, enabling full transparency of decision-making',
        'sample_doc': {
            'provenanceId': 'auto_generated',
            'queryId': 'reference to oqt_queries',
            'timestamp': 'ISO timestamp',
            'model': 'OQT-1.0',
            'version': '1.2.0',
            'processingSteps': [
                {
                    'step': 'tokenization',
                    'timestamp': 'ISO timestamp'
                },
                {
                    'step': 'inference',
                    'timestamp': 'ISO timestamp'
                }
            ],
            'inputHash': 'hash of input'
        },
        'indexes': [
            {'fields': [('queryId', 'ASCENDING')]},
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_ledger': {
        'description': 'Blockchain-style immutable ledger for complete transparency',
        'datatype': 'Document',
        'purpose': 'Immutable audit trail of all queries, training events, and model updates with cryptographic hashing',
        'sample_doc': {
            'blockNumber': 0,
            'type': 'query|training|update',
            'timestamp': 'ISO timestamp',
            'data': {
                'queryId': 'optional',
                'trainingId': 'optional',
                'description': 'event description'
            },
            'hash': 'SHA256 hash of block',
            'previousHash': 'hash of previous block'
        },
        'indexes': [
            {'fields': [('blockNumber', 'ASCENDING')]},
            {'fields': [('type', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    }
}

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    
    # Check for service account file
    service_account_paths = [
        'firebase-service-account.json',
        '../firebase-service-account.json',
        os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH', '')
    ]
    
    service_account_path = None
    for path in service_account_paths:
        if path and Path(path).exists():
            service_account_path = path
            break
    
    if not service_account_path:
        print("❌ Error: Firebase service account file not found!")
        print("\nPlease:")
        print("1. Go to Firebase Console → Project Settings → Service Accounts")
        print("2. Click 'Generate New Private Key'")
        print("3. Save as 'firebase-service-account.json' in project root")
        sys.exit(1)
    
    try:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase initialized with: {service_account_path}")
        return firestore.client()
    except Exception as e:
        print(f"❌ Error initializing Firebase: {str(e)}")
        sys.exit(1)

def create_collections(db):
    """Create Firestore collections with sample documents"""
    
    print("\n" + "="*60)
    print("Creating Firestore Collections")
    print("="*60 + "\n")
    
    for collection_name, config in COLLECTIONS.items():
        print(f"📁 {collection_name}")
        print(f"   {config['description']}")
        
        try:
            # Create collection with a sample document
            sample_doc = config['sample_doc'].copy()
            sample_doc['_sample'] = True
            sample_doc['_created'] = datetime.utcnow().isoformat()
            
            # Add to Firestore
            doc_ref = db.collection(collection_name).document('_sample_doc')
            doc_ref.set(sample_doc)
            
            print(f"   ✅ Created with sample document")
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n✅ All collections created successfully!")

def create_indexes(db):
    """Create composite indexes (requires Firebase CLI)"""
    
    print("\n" + "="*60)
    print("Index Configuration")
    print("="*60 + "\n")
    
    print("⚠️  Composite indexes must be created via Firebase Console or CLI")
    print("\nRequired indexes:\n")
    
    for collection_name, config in COLLECTIONS.items():
        if config.get('indexes'):
            print(f"Collection: {collection_name}")
            for idx in config['indexes']:
                fields = ', '.join([f"{field} {direction}" for field, direction in idx['fields']])
                print(f"  - {fields}")
            print()
    
    print("To create indexes:")
    print("1. Via Firebase Console: https://console.firebase.google.com/")
    print("   → Firestore → Indexes → Create Index")
    print("\n2. Via Firebase CLI:")
    print("   firebase deploy --only firestore:indexes")

def verify_setup(db):
    """Verify that collections were created"""
    
    print("\n" + "="*60)
    print("Verifying Setup")
    print("="*60 + "\n")
    
    all_ok = True
    for collection_name in COLLECTIONS.keys():
        try:
            # Try to read from collection
            docs = db.collection(collection_name).limit(1).get()
            if docs:
                print(f"✅ {collection_name}: OK")
            else:
                print(f"⚠️  {collection_name}: Created but empty")
        except Exception as e:
            print(f"❌ {collection_name}: Error - {str(e)}")
            all_ok = False
    
    return all_ok

def print_collection_summary():
    """Print summary of collections and their purposes"""
    print("\n" + "="*60)
    print("Firebase Collections Summary")
    print("="*60 + "\n")
    
    for collection_name, config in COLLECTIONS.items():
        print(f"📁 {collection_name}")
        print(f"   Syfte: {config['purpose']}")
        print(f"   Datatyp: {config['datatype']}")
        print()

def main():
    print("\n" + "="*60)
    print("OQT-1.0 Firebase Setup Script")
    print("="*60)
    print("\nDenna script skapar endast nödvändiga collections baserat på")
    print("faktisk användning i projektet. Följande redundanta collections")
    print("har tagits bort:")
    print("  - questions (data finns i ai_interactions)")
    print("  - external_raw_responses (data finns i ai_interactions)")
    print("  - per_response_analysis (data finns i ai_interactions)")
    print("  - oqt_model_versions (kan härledas från oqt_training_events)")
    print("  - ledger_entries (duplicerat av oqt_ledger)")
    
    # Initialize Firebase
    db = initialize_firebase()
    
    # Create collections
    create_collections(db)
    
    # Show index instructions
    create_indexes(db)
    
    # Verify setup
    if verify_setup(db):
        # Print collection summary
        print_collection_summary()
        
        print("\n🎉 Firebase setup complete!")
        print("\nNext steps:")
        print("1. Create composite indexes (see above)")
        print("2. Configure Firebase security rules")
        print("3. Update .env files with Firebase credentials")
        print("4. Run: python scripts/download_models.py")
        print("\nSe OQT-1.0-README.md för fullständig dokumentation av collections.")
    else:
        print("\n⚠️  Setup completed with some warnings. Please check above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
