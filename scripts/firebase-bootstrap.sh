#!/bin/bash

# Firebase Bootstrap Script
# Initializes Firebase project and sets up Firestore collections

set -e

echo "========================================="
echo "  Firebase Bootstrap Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}✗ Firebase CLI is not installed${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI installed${NC}"
echo ""

# Login to Firebase
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase:"
    firebase login
fi

echo -e "${GREEN}✓ Authenticated with Firebase${NC}"
echo ""

# List projects
echo "Available Firebase projects:"
firebase projects:list

echo ""
echo "Enter your Firebase project ID:"
read -r PROJECT_ID

# Verify project exists
if ! firebase use "$PROJECT_ID" 2> /dev/null; then
    echo -e "${RED}✗ Project $PROJECT_ID not found${NC}"
    echo "Create a new project at https://console.firebase.google.com/"
    exit 1
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"
echo ""

# Initialize Firestore (if not already initialized)
echo "Initializing Firestore..."
echo "Please ensure Firestore is enabled in your Firebase Console:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo ""
echo "Press Enter to continue..."
read -r

# Create service account key
echo "Creating service account key..."
echo "This will download the service account key to server/serviceAccountKey.json"
echo ""
echo "⚠ WARNING: This file contains sensitive credentials!"
echo "   - Never commit this file to version control"
echo "   - It's already in .gitignore"
echo ""
echo "Continue? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Skipping service account key creation"
else
    mkdir -p server
    
    # Download service account key
    echo "Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
    echo "Click 'Generate new private key' and save the file as server/serviceAccountKey.json"
    echo ""
    echo "Press Enter when done..."
    read -r
    
    if [ -f "server/serviceAccountKey.json" ]; then
        echo -e "${GREEN}✓ Service account key found${NC}"
    else
        echo -e "${YELLOW}⚠ Service account key not found at server/serviceAccountKey.json${NC}"
    fi
fi

echo ""

# Update environment variables
echo "Updating environment variables..."

# Backend .env
if [ -f "backend/.env" ]; then
    # Check if Firebase variables already exist
    if grep -q "FIREBASE_PROJECT_ID" backend/.env; then
        echo -e "${YELLOW}Firebase configuration already exists in backend/.env${NC}"
    else
        echo "" >> backend/.env
        echo "# Firebase Configuration" >> backend/.env
        echo "FIREBASE_PROJECT_ID=$PROJECT_ID" >> backend/.env
        echo "FIREBASE_SERVICE_ACCOUNT_PATH=../server/serviceAccountKey.json" >> backend/.env
        echo -e "${GREEN}✓ Added Firebase config to backend/.env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ backend/.env not found${NC}"
fi

# Frontend .env
echo ""
echo "For frontend Firebase configuration, get your web app config from:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo ""
echo "Add the config to frontend/.env (see frontend/.env.firebase.example)"
echo ""

echo "========================================="
echo -e "${GREEN}✓ Firebase bootstrap complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Collections will be created automatically on first use"
echo "   - ai_interactions"
echo "   - model_versions"
echo "   - ledger_blocks"
echo "   - change_events"
echo ""
echo "2. Set up Firestore indexes if needed"
echo "   firebase deploy --only firestore:indexes"
echo ""
echo "3. Configure security rules"
echo "   firebase deploy --only firestore:rules"
echo ""
echo "For more information, see docs/schemas/README.md"
echo ""
