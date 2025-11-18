#!/bin/bash
# Firebase Firestore Collections Setup Script
# Creates all required collections with initial documents for CivicAI

set -e

echo "🔥 Firebase Firestore Collections Setup"
echo "========================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✓ Firebase CLI found"
echo ""

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

echo "✓ Logged in to Firebase"
echo ""

# Get project list
echo "📋 Available Firebase projects:"
firebase projects:list

echo ""
read -p "Enter your Firebase Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

echo ""
echo "📦 Setting up collections for project: $PROJECT_ID"
echo ""

# Create a temporary Node.js script to initialize collections
cat > /tmp/init-firestore-collections.js << 'EOFJS'
const admin = require('firebase-admin');

// Get project ID from command line argument
const projectId = process.argv[2];

if (!projectId) {
    console.error('❌ Project ID required');
    process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
    projectId: projectId
});

const db = admin.firestore();

// Collection schemas
const collections = {
    ai_interactions: {
        description: 'Stores user questions and AI responses with analysis',
        schema: {
            question: 'string',
            created_at: 'timestamp',
            status: 'string (received|processing|completed|ledger_verified)',
            pipeline_version: 'string',
            analysis: 'object (nullable)',
            completed_at: 'timestamp (nullable)',
            user_id: 'string (nullable)',
            session_id: 'string (nullable)',
            question_hash: 'string'
        },
        sampleDoc: {
            question: 'Sample question for testing',
            created_at: new Date().toISOString(),
            status: 'received',
            pipeline_version: '1.0.0',
            analysis: null,
            completed_at: null,
            user_id: 'system',
            session_id: 'init-session',
            question_hash: 'sample-hash-' + Date.now()
        }
    },
    
    model_versions: {
        description: 'Tracks AI model configurations and metadata',
        schema: {
            modelId: 'string',
            provider: 'string (openai|google|deepseek)',
            modelName: 'string',
            version: 'string',
            configuration: 'object',
            profile: 'object',
            usage: 'object'
        },
        sampleDoc: {
            modelId: 'gpt-3.5-turbo-init',
            provider: 'openai',
            modelName: 'gpt-3.5-turbo',
            version: '0613',
            configuration: {
                temperature: 0.7,
                maxTokens: 1000
            },
            profile: {
                strengths: ['Fast', 'Efficient'],
                weaknesses: ['Limited context']
            },
            usage: {
                totalRequests: 0,
                averageResponseTime: 0
            }
        }
    },
    
    ledger_blocks: {
        description: 'Blockchain-inspired transparency ledger for audit trail',
        schema: {
            block_id: 'number',
            timestamp: 'timestamp',
            previous_hash: 'string',
            current_hash: 'string',
            event_type: 'string (genesis|data_collection|training|update|audit)',
            data: 'object',
            signatures: 'object'
        },
        sampleDoc: {
            block_id: 0,
            timestamp: new Date().toISOString(),
            previous_hash: '0'.repeat(64),
            current_hash: 'genesis-block-hash',
            event_type: 'genesis',
            data: {
                description: 'Genesis block for CivicAI ledger',
                model_version: '0.0.0',
                provenance: ['system_initialization']
            },
            signatures: {
                data_hash: 'genesis-data-hash',
                validator: 'system'
            }
        }
    },
    
    change_events: {
        description: 'Records detected changes in model behavior or responses',
        schema: {
            eventId: 'string',
            timestamp: 'timestamp',
            changeType: 'string (response_drift|model_update|bias_shift)',
            modelId: 'string',
            changeDetails: 'object',
            detection: 'object',
            impact: 'object'
        },
        sampleDoc: {
            eventId: 'change-' + Date.now(),
            timestamp: new Date().toISOString(),
            changeType: 'model_update',
            modelId: 'sample-model',
            changeDetails: {
                before: 'old-version',
                after: 'new-version',
                delta: 0.05,
                magnitude: 'minor'
            },
            detection: {
                method: 'automated',
                confidence: 0.95
            },
            impact: {
                severity: 'low',
                affected: ['sample-area']
            }
        }
    },
    
    users: {
        description: 'User profiles and preferences',
        schema: {
            userId: 'string',
            email: 'string',
            displayName: 'string',
            role: 'string (user|admin)',
            createdAt: 'timestamp',
            lastLogin: 'timestamp',
            preferences: 'object'
        },
        sampleDoc: {
            userId: 'system-user',
            email: 'system@civicai.local',
            displayName: 'System User',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                theme: 'dark',
                language: 'sv'
            }
        }
    },
    
    audit_logs: {
        description: 'System audit logs for compliance and debugging',
        schema: {
            logId: 'string',
            timestamp: 'timestamp',
            eventType: 'string',
            userId: 'string',
            action: 'string',
            details: 'object',
            ipAddress: 'string (nullable)'
        },
        sampleDoc: {
            logId: 'log-' + Date.now(),
            timestamp: new Date().toISOString(),
            eventType: 'system_init',
            userId: 'system',
            action: 'collections_initialized',
            details: {
                collections: ['ai_interactions', 'model_versions', 'ledger_blocks', 'change_events', 'users', 'audit_logs']
            },
            ipAddress: null
        }
    }
};

async function createCollections() {
    console.log('🔧 Creating Firestore collections...\n');
    
    for (const [collectionName, config] of Object.entries(collections)) {
        try {
            console.log(`📁 Collection: ${collectionName}`);
            console.log(`   Description: ${config.description}`);
            
            // Check if collection exists by trying to get first document
            const existingDocs = await db.collection(collectionName).limit(1).get();
            
            if (!existingDocs.empty) {
                console.log(`   ⚠️  Collection already exists (${existingDocs.size} docs found)`);
                console.log(`   ✓ Skipping initialization\n`);
                continue;
            }
            
            // Create initial document
            const docRef = await db.collection(collectionName).add(config.sampleDoc);
            console.log(`   ✓ Created with sample document: ${docRef.id}`);
            
            // Print schema
            console.log('   Schema:');
            Object.entries(config.schema).forEach(([field, type]) => {
                console.log(`      - ${field}: ${type}`);
            });
            console.log('');
            
        } catch (error) {
            console.error(`   ❌ Error creating ${collectionName}:`, error.message);
        }
    }
    
    console.log('✅ Collection setup complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Total collections: ${Object.keys(collections).length}`);
    console.log(`   - Project: ${projectId}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Check Firebase Console to verify collections');
    console.log('   2. Update Firestore security rules if needed');
    console.log('   3. Create indexes for optimized queries');
    console.log('   4. Delete sample documents if not needed\n');
}

// Run the setup
createCollections()
    .then(() => {
        console.log('🎉 Setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
EOFJS

# Check if firebase-admin is installed in global node_modules
echo "📦 Checking firebase-admin package..."
if ! node -e "require('firebase-admin')" 2>/dev/null; then
    echo "⚠️  firebase-admin not found globally"
    echo "Installing firebase-admin temporarily..."
    
    # Create temporary package.json
    cd /tmp
    cat > package.json << EOF
{
  "name": "firestore-init-temp",
  "version": "1.0.0",
  "dependencies": {
    "firebase-admin": "^11.11.0"
  }
}
EOF
    
    npm install --silent
    echo "✓ firebase-admin installed"
    echo ""
fi

# Run the Node.js script
echo "🚀 Initializing collections..."
echo ""

cd /tmp
node init-firestore-collections.js "$PROJECT_ID"

# Cleanup
rm -f /tmp/init-firestore-collections.js
rm -rf /tmp/node_modules /tmp/package.json /tmp/package-lock.json 2>/dev/null

echo ""
echo "🔗 View your collections at:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo ""
