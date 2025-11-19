# Migration från functions.config() till Environment Variables

## Bakgrund

Firebase har meddelat att `functions.config()` API kommer att avvecklas i **mars 2026**. Du måste migrera till environment variables för att fortsätta deploya dina functions efter det datumet.

## Snabbguide för Migration

### Steg 1: Skapa .env fil i functions/

```bash
cd functions

# Kopiera exempel-filen
cp .env.example .env

# Redigera .env och sätt din backend URL
# För produktion:
BACKEND_URL=https://din-backend-url.com

# För testning med ngrok:
BACKEND_URL=https://abc123.ngrok.io

# För lokal utveckling med emulator:
BACKEND_URL=http://localhost:3001
```

### Steg 2: Deploy Functions

```bash
# Från projekt root
firebase deploy --only functions
```

Det är allt! Functions-koden har redan uppdaterats för att använda `.env` först, med fallback till den gamla `functions.config()` under migrationsperioden.

## Vad har ändrats?

### Tidigare (Deprecated)

```bash
# Sätt config
firebase functions:config:set backend.url="https://din-url.com"

# Deploy
firebase deploy --only functions
```

### Nu (Rekommenderat)

```bash
# Skapa functions/.env
echo 'BACKEND_URL=https://din-url.com' > functions/.env

# Deploy
firebase deploy --only functions
```

## Varför denna förändring?

1. **Simplare**: Ingen separat config-kommando behövs
2. **Snabbare**: Ingen extra API-call för att hämta config
3. **Standard**: Följer industry best practices
4. **Flexiblare**: Lättare att hantera olika miljöer

## Bakåtkompatibilitet

Under migrationsperioden stöder koden BÅDA metoderna:

```javascript
const backendUrl = process.env.BACKEND_URL ||           // Nytt sätt (.env)
                  functions.config().backend?.url ||    // Gammalt sätt (deprecated)
                  'http://localhost:3001';              // Fallback
```

Detta innebär att:
- Om du har `.env` fil → används den
- Om du inte har `.env` men har `functions.config()` → används den
- Om ingen av dem finns → får du ett tydligt felmeddelande

## Fullständig Deployment Guide

### För Produktion

```bash
# 1. Skapa functions/.env
cat > functions/.env << EOF
BACKEND_URL=https://api.dinsite.com
EOF

# 2. Deploy
firebase deploy --only functions
```

### För Testning med Ngrok

```bash
# 1. Starta backend
cd backend && npm start

# 2. I ny terminal, starta ngrok
ngrok http 3001
# Kopiera https URL (t.ex., https://abc123.ngrok.io)

# 3. Skapa functions/.env
cat > functions/.env << EOF
BACKEND_URL=https://abc123.ngrok.io
EOF

# 4. Deploy
firebase deploy --only functions

# 5. Testa genom att ställa en fråga i appen
```

### För Lokal Utveckling

```bash
# 1. Skapa functions/.env
cat > functions/.env << EOF
BACKEND_URL=http://localhost:3001
EOF

# 2. Starta backend
cd backend && npm start

# 3. I ny terminal, starta emulator
firebase emulators:start --only functions,firestore

# Functions körs lokalt och kan nå localhost
```

## Vanliga Frågor

### Kan jag fortfarande använda functions.config()?

Ja, under migrationsperioden (fram till mars 2026). Men det rekommenderas att migrera nu.

### Vad händer om jag har både .env och functions.config()?

`.env` har prioritet. Detta gör det lätt att migrera gradvis.

### Behöver jag ändra något i min kod?

Nej! Koden har redan uppdaterats för att stödja båda metoderna.

### Vad händer om jag inte migrerar?

Efter mars 2026 kommer `firebase deploy` att misslyckas för functions som använder `functions.config()`.

### Är .env-filen säker?

Ja, men se till att:
1. `.env` är i `.gitignore` (redan gjort)
2. Committa ALDRIG `.env` till git
3. Använd `.env.example` som mall

### Hur hanterar jag olika miljöer?

Skapa olika `.env`-filer:
- `.env.production` - För produktion
- `.env.development` - För utveckling
- `.env.testing` - För testning

Kopiera rätt fil till `.env` innan deploy.

## Troubleshooting

### Fel: "Backend URL is set to localhost"

**Problem:** Du försöker deploya med localhost URL

**Lösning:** 
1. För deployed functions, använd ngrok eller production URL i `.env`
2. För lokal utveckling, använd emulator istället: `firebase emulators:start`

### Fel: "ECONNREFUSED"

**Problem:** Functions kan inte nå backend

**Lösning:**
1. Kontrollera att URL i `.env` är korrekt
2. Verifiera att backend är tillgänglig: `curl https://din-url.com/health`
3. Om du använder ngrok, se till att det fortfarande kör

### Deployment skippar min nya .env

**Problem:** Firebase hoppar över deployment

**Lösning:** Gör en minimal ändring i `index.js` för att tvinga omdeployment:
```bash
cd functions
echo " " >> index.js
firebase deploy --only functions
```

## Support

Se också:
- [Firebase Functions Migration Guide](https://firebase.google.com/docs/functions/config-env#migrate-to-dotenv)
- [Deployment Guide](FIREBASE_STEP2_DEPLOYMENT_GUIDE.md)
- [Fix Summary](FIX_ECONNREFUSED_SUMMARY.md)
