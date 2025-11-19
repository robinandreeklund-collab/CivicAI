# Debug Help - CivicAI Troubleshooting Guide

Detta är en komplett guide för att lösa vanliga problem och förstå hur CivicAI systemet fungerar.

## 📚 Innehåll

1. [Firebase Setup Guide](./FIREBASE_SETUP_COMPLETE.md) - Komplett Firebase setup från början till slut
2. [Common Errors & Fixes](./COMMON_ERRORS_AND_FIXES.md) - Samlade lösningar på vanliga fel
3. [Chat-v2 Data Structure](./CHAT_V2_DATA_STRUCTURE.md) - Förklaring av datapunkter och struktur
4. [Environment Setup](./ENVIRONMENT_SETUP.md) - Miljövariabler och konfiguration

## 🔥 Snabbfixar

### ECONNREFUSED 127.0.0.1:3001

**Problem:** Firebase Functions kan inte nå backend

**Snabbfix:**
```powershell
cd functions
Set-Content -Path .env -Value "BACKEND_URL=https://din-ngrok-url.ngrok-free.dev" -Encoding UTF8 -NoNewline
cd ..
firebase deploy --only functions --force
```

Se [COMMON_ERRORS_AND_FIXES.md](./COMMON_ERRORS_AND_FIXES.md#econnrefused-error) för detaljer.

### Invalid dotenv file error

**Problem:** UTF-16 BOM encoding från PowerShell

**Snabbfix:**
```powershell
cd functions
Remove-Item .env
Set-Content -Path .env -Value "BACKEND_URL=https://din-url.com" -Encoding UTF8 -NoNewline
```

Se [COMMON_ERRORS_AND_FIXES.md](./COMMON_ERRORS_AND_FIXES.md#invalid-dotenv-file) för detaljer.

### Firebase not initialized

**Problem:** Saknar Firebase credentials

**Snabbfix:**
Se [FIREBASE_SETUP_COMPLETE.md](./FIREBASE_SETUP_COMPLETE.md#credentials-setup) för steg-för-steg guide.

## 📖 Använd Denna Guide

1. **Hitta ditt problem** - Kolla innehållsförteckningen eller snabbfixarna ovan
2. **Följ stegen** - Alla guider har steg-för-steg instruktioner
3. **Verifiera** - Varje fix har verifieringssteg
4. **Dokumentera** - Om du hittar nya problem, lägg till dem här!

## 🆘 Support

Om du inte hittar lösningen här:
1. Kolla [Firebase Console Logs](https://console.firebase.google.com/project/openseek-c19fe/overview)
2. Kolla Backend logs: `cd backend && npm start`
3. Kolla Browser Console (F12) för frontend errors
4. Öppna ett issue på GitHub med fullständiga logs

## 📝 Senaste Uppdateringar

- **2025-11-19**: Initial version med Firebase setup och ECONNREFUSED fixes
- **2025-11-19**: Lagt till Chat-v2 data structure dokumentation
