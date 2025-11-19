# Firebase Setup - Komplett Guide

Detta är den kompletta guiden för att sätta upp Firebase för CivicAI från scratch.

## 📋 Förutsättningar

- Node.js 20 installerat
- Firebase CLI installerat: `npm install -g firebase-tools`
- Ett Google-konto
- ngrok för testning (eller en public backend server)

## 🎯 Steg 1: Skapa Firebase Project

### 1.1 Skapa Projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Klicka "Add project" / "Skapa projekt"
3. Projekt namn: `openseek-c19fe` (eller ditt eget)
4. Enable Google Analytics (rekommenderat)
5. Klicka "Create project"

### 1.2 Uppgradera till Blaze Plan (KRÄVS!)

**VIKTIGT:** Firebase Functions kräver Blaze (pay-as-you-go) plan.

1. I Firebase Console, klicka "Upgrade" (längst ner i vänstra menyn)
2. Välj **Blaze Plan**
3. Lägg till kreditkort
4. Kostnad: ~0-5 USD/månad (generös free tier)

### 1.3 Aktivera Firestore

1. Gå till "Build" > "Firestore Database"
2. Klicka "Create database"
3. Välj **Production mode**
4. Region: `europe-west1` (eller närmaste)
5. Klicka "Enable"

## 🔑 Steg 2: Skaffa Credentials

### 2.1 Backend Credentials (Admin SDK)

1. Gå till Project Settings (kugghjulet) > "Service accounts"
2. Klicka "Generate new private key"
3. En JSON-fil laddas ner - **SPARA DEN SÄKERT!**
4. Öppna filen och kopiera:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## ✅ Fullständig guide fortsätter...

Se de fullständiga guiderna i:
- `QUICK_START_NGROK.md` i projekt root
- `docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md`
