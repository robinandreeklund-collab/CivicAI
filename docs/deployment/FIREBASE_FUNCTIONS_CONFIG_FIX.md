# Firebase Functions Config Problem - DEFINITIV LÖSNING

## Problemet

Firebase Functions Gen1 har ett känt problem där `functions.config()` ibland returnerar tom object `{}` även när config är korrekt satt med `firebase functions:config:set`.

Din log visar:
```
_currentUrl: 'http://localhost:3001/api/query'
```

Detta betyder att funktionen använder fallback-värdet istället för din ngrok URL.

## Lösning: Använd .runtimeconfig.json

Istället för att använda `functions.config()` (opålitligt), använd `.runtimeconfig.json` som är mer stabilt.

### Steg 1: Skapa .runtimeconfig.json

Skapa filen `functions/.runtimeconfig.json` med din ngrok URL:

```json
{
  "backend": {
    "url": "https://prayerful-competently-beatrice.ngrok-free.dev"
  }
}
```

**VIKTIGT:** Byt ut URL:en till din faktiska ngrok URL!

### Steg 2: Deploy

```bash
firebase deploy --only functions
```

Nu kommer funktionen att läsa från `.runtimeconfig.json` istället.

### Steg 3: Verifiera

Kolla loggarna:
```bash
firebase functions:log --only onQuestionCreate
```

Du ska se:
```
DEBUG - Full config: {"backend":{"url":"https://prayerful-competently-beatrice.ngrok-free.dev"}}
Using backend URL: https://prayerful-competently-beatrice.ngrok-free.dev
```

## För Produktion

För produktion, deploya backend till en publik server och uppdatera `.runtimeconfig.json`:

```json
{
  "backend": {
    "url": "https://api.yourdomain.com"
  }
}
```

## Varför händer detta?

Firebase Functions Gen1 har inkonsekvent beteende med `functions.config()`:
- ✅ `firebase functions:config:get` visar korrekt config
- ❌ Men `functions.config()` i deployed function returnerar `{}`

`.runtimeconfig.json` är lokal fil som deployas med funktionen, så den är mer pålitlig.

## Nästa Steg

1. Skapa `functions/.runtimeconfig.json` med din ngrok URL
2. Deploy: `firebase deploy --only functions`
3. Testa: Ställ en fråga i appen
4. Verifiera: Kolla att backend får requests och inga ECONNREFUSED errors i Firestore

✅ Nu ska allt fungera!
