# Installation Guide - Admin Dashboard

## Nytt Krav: Installera Dependencies

För att köra den nya admin dashboard-funktionaliteten behöver du installera nya beroenden.

## Snabbstart

### Windows (PowerShell eller CMD)

```powershell
# Navigera till projektets rot
cd C:\Users\robin\Documents\GitHub\CivicAI

# Installera backend dependencies (inkluderar multer för filuppladdning)
cd backend
npm install

# Installera frontend dependencies (inkluderar Chart.js för grafer)
cd ..\frontend
npm install

# Starta backend (i ett terminalfönster)
cd ..\backend
npm run dev

# Starta frontend (i ett annat terminalfönster)
cd ..\frontend
npm run dev
```

### Linux/Mac

```bash
# Navigera till projektets rot
cd ~/path/to/CivicAI

# Installera backend dependencies
cd backend
npm install

# Installera frontend dependencies
cd ../frontend
npm install

# Starta backend (i en terminal)
cd ../backend
npm run dev

# Starta frontend (i en annan terminal)
cd ../frontend
npm run dev
```

## Nya Dependencies

### Backend
- **multer** (v2.0.2) - För filuppladdning av datasets

### Frontend
- **chart.js** (senaste) - För visualisering av CPU/GPU-användning
- **react-chartjs-2** (senaste) - React-wrapper för Chart.js

## Steg-för-Steg Installation

### 1. Backend Dependencies

```bash
cd backend
npm install
```

Detta installerar:
- multer för JSONL filuppladdningar
- Alla andra befintliga beroenden

**Förväntat resultat:**
```
added 28 packages, and audited 940 packages in 3s
found 0 vulnerabilities
```

### 2. Frontend Dependencies

```bash
cd frontend
npm install
```

Detta installerar:
- chart.js för grafer
- react-chartjs-2 för React-integration
- Alla andra befintliga beroenden

**Förväntat resultat:**
```
added 42 packages, and audited 458 packages in 4s
found 0 vulnerabilities (eller 2 moderate - är OK)
```

### 3. Verifiera Installation

Kontrollera att allt är installerat korrekt:

```bash
# Backend
cd backend
npm list multer
# Ska visa: multer@2.0.2

# Frontend
cd frontend
npm list chart.js react-chartjs-2
# Ska visa: chart.js@x.x.x och react-chartjs-2@x.x.x
```

## Starta Applikationen

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

**Förväntat:**
```
Server running on port 3001
Firebase connected
OQT service ready
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

**Förväntat:**
```
VITE v5.4.21 ready in 176 ms
➜ Local:   http://localhost:3000/
```

## Åtkomst till Admin Dashboard

### 1. Skapa ett konto eller logga in
Först behöver du ett användarkonto i systemet:
- Gå till `http://localhost:3000/skapa-konto` för att skapa ett nytt konto
- Eller gå till `http://localhost:3000/logga-in` om du redan har ett konto

### 2. Ge admin-behörighet i Firebase

För att få tillgång till admin dashboard måste din användare ha `role: "admin"` i Firebase-databasen.

**Steg för att ändra roll till admin:**

1. **Öppna Firebase Console**
   - Gå till [Firebase Console](https://console.firebase.google.com/)
   - Välj ditt projekt

2. **Navigera till Firestore Database**
   - Klicka på "Firestore Database" i sidomenyn
   - Gå till `users` collection

3. **Hitta din användare**
   - Leta efter ditt användar-dokument (t.ex. `user_e2ff8ff8581a81ed8eb03b5bb84f1d07`)
   - Du kan hitta ditt userId genom att kolla localStorage i webbläsaren (F12 → Console → kör `localStorage.getItem('oneseek_user')`)

4. **Ändra role-fältet**
   - Klicka på ditt användar-dokument
   - Hitta fältet `role` (ska vara `"user"`)
   - Ändra värdet till `"admin"`
   - Spara ändringarna

5. **Logga in igen**
   - Logga ut från applikationen
   - Logga in igen för att ladda om din användarprofil med den nya rollen
   - Nu har du tillgång till admin dashboard på `http://localhost:3000/admin`

**Alternativt: Direkt databasuppdatering**
Om du har Firebase Admin SDK eller direkt databas-åtkomst:
```javascript
// Firebase Admin SDK eller Console
db.collection('users').doc('user_YOUR_USER_ID').update({
  role: 'admin'
});
```

## Felsökning

### Problem: "Cannot find package 'multer'"

**Lösning:**
```bash
cd backend
npm install multer --save
npm install
```

### Problem: Chart.js visas inte

**Lösning:**
```bash
cd frontend
npm install chart.js react-chartjs-2 --save
npm install
```

### Problem: Backend startar inte

**Kontrollera:**
1. Är du i rätt mapp? (`backend/`)
2. Har du kört `npm install`?
3. Finns `.env` filen?

**Testa:**
```bash
cd backend
npm install
npm run dev
```

### Problem: Frontend startar inte

**Kontrollera:**
1. Är du i rätt mapp? (`frontend/`)
2. Har du kört `npm install`?
3. Är backend igång på port 3001?

**Testa:**
```bash
cd frontend
npm install
npm run dev
```

### Problem: "Access Denied" på /admin

**Lösning:**
Sätt admin-rollen i localStorage (se ovan)

## Komplett Reinstallation

Om allt annat misslyckas, gör en ren installation:

```bash
# Ta bort alla node_modules
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

Windows (PowerShell):
```powershell
cd backend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

cd ..\frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## Verifiering

När allt är installerat och igång:

✅ Backend körs på `http://localhost:3001`  
✅ Frontend körs på `http://localhost:3000`  
✅ Admin dashboard tillgänglig på `http://localhost:3000/admin`  
✅ Kan ladda upp datasets  
✅ Kan starta träning  
✅ Grafer visas i Monitoring  

## Sammanfattning av Nya Filer

**Backend:**
- `backend/api/admin.js` - Admin API endpoints

**Frontend:**
- `frontend/src/pages/AdminDashboardPage.jsx` - Huvudsida
- `frontend/src/components/admin/DatasetManagement.jsx`
- `frontend/src/components/admin/TrainingControl.jsx`
- `frontend/src/components/admin/ModelManagement.jsx`
- `frontend/src/components/admin/MonitoringDashboard.jsx`

**Dokumentation:**
- `ADMIN_DASHBOARD_GUIDE.md` - Användarguide
- `OQT-1.0-README.md` - Uppdaterad med Phase 3

## Support

Om du fortfarande har problem:
1. Kontrollera att Node.js version är 18+ (`node --version`)
2. Kontrollera att npm är uppdaterad (`npm --version`)
3. Kör `npm install` i både backend och frontend
4. Kolla backend logs: Kör `npm run dev` och se output
5. Kolla frontend logs: Öppna Developer Tools (F12) i webbläsaren

---

**Version:** Phase 3 - Admin Dashboard  
**Senast uppdaterad:** November 2025
