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
COLLECTIONS = {
    'questions': {
        'description': 'User questions from all AI services',
        'sample_doc': {
            'questionId': 'auto_generated',
            'question': 'sample question text',
            'timestamp': 'ISO timestamp',
            'userId': 'optional user ID',
            'source': 'chat-v2 or oqt-dashboard',
            'metadata': {}
        },
        'indexes': [
            {'fields': [('userId', 'ASCENDING'), ('timestamp', 'DESCENDING')]},
            {'fields': [('source', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    },
    
    'external_raw_responses': {
        'description': 'Raw responses from external AI services',
        'sample_doc': {
            'responseId': 'auto_generated',
            'questionId': 'reference to questions collection',
            'service': 'openai|gemini|grok|anthropic',
            'response': 'raw response text',
            'timestamp': 'ISO timestamp',
            'metadata': {
                'model': 'model name',
                'tokens': 0,
                'latency_ms': 0
            }
        },
        'indexes': [
            {'fields': [('questionId', 'ASCENDING'), ('timestamp', 'DESCENDING')]},
            {'fields': [('service', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    },
    
    'per_response_analysis': {
        'description': 'ML pipeline analysis for each response',
        'sample_doc': {
            'analysisId': 'auto_generated',
            'responseId': 'reference to external_raw_responses',
            'bias': {
                'score': 0.0,
                'types': []
            },
            'sentiment': {
                'polarity': 0.0,
                'subjectivity': 0.0
            },
            'toxicity': {
                'toxicity': 0.0,
                'threat': 0.0,
                'insult': 0.0
            },
            'fairness': {
                'score': 0.0,
                'metrics': {}
            },
            'timestamp': 'ISO timestamp'
        },
        'indexes': [
            {'fields': [('responseId', 'ASCENDING')]},
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_training_events': {
        'description': 'OQT-1.0 training event logs',
        'sample_doc': {
            'eventId': 'auto_generated',
            'type': 'micro|batch|weekly',
            'timestamp': 'ISO timestamp',
            'samplesProcessed': 0,
            'stage1': {
                'method': 'raw_response_training',
                'samplesProcessed': 0
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
    
    'oqt_model_versions': {
        'description': 'OQT-1.0 model version history',
        'sample_doc': {
            'version': '1.2.0',
            'timestamp': 'ISO timestamp',
            'baseModels': ['mistral-7b', 'llama-2-7b'],
            'metrics': {
                'accuracy': 0.0,
                'fairness': 0.0,
                'bias': 0.0,
                'consensus': 0.0
            },
            'trainingData': {
                'totalSamples': 0,
                'weeklyBatches': 0,
                'microBatches': 0
            },
            'changelog': 'version change description'
        },
        'indexes': [
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_queries': {
        'description': 'Queries to OQT-1.0 from dashboard',
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
                'latency_ms': 0
            }
        },
        'indexes': [
            {'fields': [('timestamp', 'DESCENDING')]},
            {'fields': [('version', 'ASCENDING'), ('timestamp', 'DESCENDING')]}
        ]
    },
    
    'oqt_provenance': {
        'description': 'Provenance tracking for transparency',
        'sample_doc': {
            'provenanceId': 'auto_generated',
            'queryId': 'reference to oqt_queries',
            'timestamp': 'ISO timestamp',
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
            'inputHash': 'hash of input',
            'modelVersion': '1.2.0'
        },
        'indexes': [
            {'fields': [('queryId', 'ASCENDING')]},
            {'fields': [('timestamp', 'DESCENDING')]}
        ]
    },
    
    'ledger_entries': {
        'description': 'Blockchain-style immutable ledger',
        'sample_doc': {
            'entryId': 'auto_generated',
            'type': 'query|training|update',
            'timestamp': 'ISO timestamp',
            'data': {},
            'hash': 'SHA256 hash of entry',
            'previousHash': 'hash of previous entry',
            'blockNumber': 0
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

def main():
    print("\n" + "="*60)
    print("OQT-1.0 Firebase Setup Script")
    print("="*60)
    
    # Initialize Firebase
    db = initialize_firebase()
    
    # Create collections
    create_collections(db)
    
    # Show index instructions
    create_indexes(db)
    
    # Verify setup
    if verify_setup(db):
        print("\n🎉 Firebase setup complete!")
        print("\nNext steps:")
        print("1. Create composite indexes (see above)")
        print("2. Configure Firebase security rules")
        print("3. Update .env files with Firebase credentials")
        print("4. Run: python scripts/download_models.py")
    else:
        print("\n⚠️  Setup completed with some warnings. Please check above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
