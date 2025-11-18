# Firebase Collections Script - Felsökning

## Fel: "Could not load the default credentials"

### Fullständigt Felmeddelande
```
❌ Error creating ai_interactions: Could not load the default credentials. 
Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

### Vad betyder felet?

Firebase Admin SDK behöver autentiseringsuppgifter (credentials) för att kunna skapa collections i Firestore. Scriptet kan inte hitta dessa uppgifter.

---

## Lösning: Hämta Service Account Key

### Steg 1: Gå till Firebase Console

Öppna din webbläsare och gå till:
```
https://console.firebase.google.com
```

### Steg 2: Välj ditt projekt

Klicka på ditt Firebase-projekt i listan.

### Steg 3: Gå till Service Accounts

1. Klicka på **kugghjulet (⚙️)** i menyn till vänster
2. Välj **"Project settings"**
3. Klicka på fliken **"Service accounts"** längst upp

### Steg 4: Generera ny Private Key

1. Scrolla ner till sektionen **"Firebase Admin SDK"**
2. Klicka på knappen **"Generate new private key"**
3. I dialogen som visas, klicka **"Generate key"**

**VIKTIGT:** En JSON-fil kommer att laddas ner. Spara den på ett säkert ställe!

**Exempel-filnamn:** `civicai-prod-firebase-adminsdk-abc123.json`

### Steg 5: Flytta filen till en säker plats

Flytta den nedladdade JSON-filen till ett säkert ställe, t.ex.:

```bash
# Skapa en mapp för service accounts (om den inte finns)
mkdir -p ~/firebase-keys

# Flytta filen dit
mv ~/Downloads/civicai-prod-firebase-adminsdk-*.json ~/firebase-keys/

# Sätt rätt rättigheter (säkerhet)
chmod 600 ~/firebase-keys/*.json
```

**OBS:** Lägg ALDRIG denna fil i ditt Git-repository! Den innehåller känsliga uppgifter.

### Steg 6: Kör scriptet igen

Nu kan du köra scriptet igen. Det kommer att fråga efter sökvägen till din service account-fil:

```bash
./scripts/firebase-init-collections.sh
```

När scriptet frågar:
```
Enter the path to your service account key JSON file:
```

Ange den fullständiga sökvägen:
```
/Users/dittnamn/firebase-keys/civicai-prod-firebase-adminsdk-abc123.json
```

Eller om du sparat den i en annan plats:
```
/hem/runner/work/CivicAI/serviceAccountKey.json
```

### Steg 7: Verifiera att det fungerar

När scriptet kör med rätt credentials bör du se:

```
✓ Using service account: /path/to/your/key.json

📁 Collection: ai_interactions
   Description: Stores user questions and AI responses with analysis
   ✓ Created with sample document: abc123xyz
```

---

## Alternativ Metod: Sätt Environment Variable

Om du vill slippa ange sökvägen varje gång kan du sätta en environment variable:

### För denna session:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/Users/dittnamn/firebase-keys/serviceAccountKey.json"
./scripts/firebase-init-collections.sh
```

### Permanent (lägg till i din shell config):

**För Bash (~/.bashrc eller ~/.bash_profile):**
```bash
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/Users/dittnamn/firebase-keys/serviceAccountKey.json"' >> ~/.bashrc
source ~/.bashrc
```

**För Zsh (~/.zshrc):**
```bash
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/Users/dittnamn/firebase-keys/serviceAccountKey.json"' >> ~/.zshrc
source ~/.zshrc
```

---

## Andra Vanliga Fel och Lösningar

### Fel: "Permission denied"

**Orsak:** Fel rättigheter på service account-filen eller scriptet.

**Lösning:**
```bash
# Gör scriptet körbart
chmod +x scripts/firebase-init-collections.sh

# Kontrollera rättigheter på key-filen
chmod 600 /path/to/serviceAccountKey.json
```

### Fel: "File not found"

**Orsak:** Fel sökväg till service account-filen.

**Lösning:** Kontrollera att sökvägen är korrekt:
```bash
# Lista filer för att hitta rätt sökväg
ls -la ~/firebase-keys/

# Testa sökvägen
cat /path/to/serviceAccountKey.json | head -5
```

### Fel: "Invalid service account"

**Orsak:** Fel projekt-ID eller korrupt JSON-fil.

**Lösning:**
1. Verifiera att JSON-filen är giltig:
```bash
cat serviceAccountKey.json | python -m json.tool
```

2. Kontrollera att `project_id` i filen matchar ditt Firebase-projekt

### Fel: "Insufficient permissions"

**Orsak:** Service account saknar tillstånd att skapa collections.

**Lösning:**
1. Gå till Firebase Console → IAM & Admin
2. Hitta din service account
3. Säkerställ att den har rollen **"Firebase Admin SDK Administrator Service Agent"** eller **"Editor"**

---

## Säkerhetstips

### ✅ GÖR:
- Spara service account-filen på ett säkert ställe utanför ditt projekt
- Sätt rätt filrättigheter (600 eller 400)
- Lägg till `*.json` i `.gitignore` om den inte redan finns där
- Rotera nyckeln regelbundet (var 90:e dag rekommenderas)

### ❌ GÖR INTE:
- Committa service account-filen till Git
- Dela filen via email eller osäkra kanaler
- Låt filen ligga i Downloads-mappen
- Använd samma nyckel för utveckling och produktion

---

## Kontrollista för Framgång

Innan du kör scriptet, kontrollera:

- [ ] Firebase CLI är installerat (`firebase --version`)
- [ ] Du är inloggad på Firebase (`firebase login`)
- [ ] Du har laddat ner en service account key från Firebase Console
- [ ] Service account-filen ligger på ett säkert ställe
- [ ] Du vet den exakta sökvägen till filen
- [ ] Filrättigheterna är korrekta (600)
- [ ] Du har rätt Firebase Project ID

---

## Hjälp och Support

### Resurser:
- **Firebase Admin SDK Setup:** https://firebase.google.com/docs/admin/setup
- **Service Account Keys:** https://cloud.google.com/iam/docs/creating-managing-service-account-keys
- **Firebase Console:** https://console.firebase.google.com

### Fortfarande problem?

1. **Dubbelkolla project ID:** Måste matcha exakt vad som står i Firebase Console
2. **Testa credentials manuellt:**
   ```bash
   node -e "const admin = require('firebase-admin'); admin.initializeApp({credential: admin.credential.applicationDefault()}); console.log('✓ Success');"
   ```
3. **Kontrollera Firebase status:** https://status.firebase.google.com

---

## Snabb Fix - Steg för Steg

Om du bara vill komma igång snabbt:

```bash
# 1. Ladda ner service account key från Firebase Console
# 2. Flytta filen till projektet (GLÖM INTE .gitignore!)
mkdir -p server
mv ~/Downloads/*firebase-adminsdk*.json server/serviceAccountKey.json

# 3. Sätt environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/server/serviceAccountKey.json"

# 4. Kör scriptet
./scripts/firebase-init-collections.sh

# 5. När klar, ta BORT filen från projektet om du inte ska använda den
# (eller lägg till server/*.json i .gitignore)
```

**VARNING:** Detta är för snabb testing. I produktion, lagra aldrig nycklar i projektet!

---

**Lycka till! 🔥**

Om du följer denna guide bör credentials-felet vara löst och scriptet ska fungera perfekt.
