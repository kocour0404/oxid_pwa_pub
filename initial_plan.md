# initial_plan.md

# Minimal-Prototyp: PWA mit authentifizierter PHP-Pseudo-API

## 1. Ziel des Prototyps

Dieser Prototyp definiert eine minimale, aber strukturell saubere Grundlage für eine PWA, die eine authentifizierte Verbindung zu einem PHP-Script auf einem Server aufnimmt.

Die tatsächliche fachliche Funktionalität bleibt zunächst absichtlich mock-basiert. Im Vordergrund stehen:

- lokale PWA-Assets
- HTTPS-only-Betrieb
- einfache Authentifizierung ohne OAuth und ohne Drittanbieter
- PHP-Script als zentrale Pseudo-API
- serverseitige Session
- sicherer Cookie-basierter Auth-Status
- CSRF-Schutz für mutierende Requests
- klare spätere Erweiterbarkeit

Nicht Ziel dieses Prototyps:

- vollständiges Shopsystem
- echte Datenbankanbindung
- echtes Benutzer-/Rechtesystem
- OAuth/OpenID Connect
- Push Notifications
- Background Sync
- Multi-Tenant-Funktionalität
- komplexe Offline-Datenhaltung

---

## 2. Grundannahmen

### 2.1 Deployment

PWA und PHP-API liegen auf derselben Origin.

Beispiel:

```text
https://example.com/app/
https://example.com/api/api.php
```

Vorteile:

- kein CORS notwendig
- Cookie-basierte Session funktioniert sauber
- CSP kann sehr restriktiv bleiben
- Service Worker kann klar zwischen App-Assets und API unterscheiden

### 2.2 Transport

Alle Zugriffe erfolgen ausschließlich über HTTPS.

Der Server liefert zusätzlich HSTS aus:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Für lokale Entwicklung kann `localhost` verwendet werden. Für produktive oder realitätsnahe Tests muss HTTPS aktiv sein.

---

## 3. Verzeichnisstruktur

Vorgeschlagene Minimalstruktur:

```text
project-root/
├── app/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
└── api/
    └── api.php
```

Optional für lokale Entwicklung:

```text
project-root/
├── README.md
├── initial_plan.md
└── dev-notes.md
```

---

## 4. Architekturübersicht

```text
┌──────────────────────────────┐
│ Browser / installierte PWA   │
│                              │
│ - index.html                 │
│ - app.js                     │
│ - style.css                  │
│ - manifest                   │
│ - service worker             │
└──────────────┬───────────────┘
               │ HTTPS / same-origin fetch
               │ credentials: same-origin
               ▼
┌──────────────────────────────┐
│ PHP Endpoint                 │
│ /api/api.php                 │
│                              │
│ - Sessionstart               │
│ - Login                      │
│ - Sessionprüfung             │
│ - CSRF-Prüfung               │
│ - Mock-Routing               │
│ - JSON-Ausgabe               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Mock-Daten                   │
│                              │
│ - neue Bestellungen          │
│ - Bestelldetails             │
│ - Versandstatus setzen       │
└──────────────────────────────┘
```

---

## 5. Authentifizierungsmodell

### 5.1 Entscheidung

Für den Minimal-Prototyp wird verwendet:

```text
PHP-Session
+
Secure HttpOnly SameSite=Strict Cookie
+
CSRF-Token für POST-Operationen
```

Keine Verwendung von:

- OAuth
- externen Identity Providern
- API-Key im Frontend
- Bearer Token in LocalStorage
- JWT im Browser-Speicher

### 5.2 Begründung

Die Session-ID bleibt im `HttpOnly`-Cookie und ist damit für JavaScript nicht direkt lesbar.

Das Frontend kennt nur:

- ob die Session gültig ist
- den aktuellen CSRF-Token
- Mock-Daten der API

Das eigentliche Authentifizierungsgeheimnis bleibt serverseitig bzw. im geschützten Cookie-Kontext.

### 5.3 Cookie-Vorgabe

PHP setzt bei erfolgreichem Login:

```http
Set-Cookie: __Host-pwa_sid=<random>; Path=/; Secure; HttpOnly; SameSite=Strict
```

Wichtige Eigenschaften:

| Attribut | Zweck |
|---|---|
| `Secure` | Cookie wird nur über HTTPS übertragen |
| `HttpOnly` | JavaScript kann die Session-ID nicht lesen |
| `SameSite=Strict` | Cookie wird bei Cross-Site-Requests nicht mitgesendet |
| `Path=/` | Cookie gilt für gesamte Origin |
| `__Host-` Prefix | erzwingt restriktivere Cookie-Semantik im Browser |

---

## 6. API-Konventionen

### 6.1 Zentrale Datei

Alle API-Aufrufe laufen über:

```text
/api/api.php
```

### 6.2 Operationen

Die Operation wird über den Query-Parameter `op` gesteuert:

```text
/api/api.php?op=session
/api/api.php?op=orders.new
/api/api.php?op=order.detail&id=1001
/api/api.php?op=order.ship
```

### 6.3 HTTP-Methoden

| Operation | Methode | Auth erforderlich | CSRF erforderlich |
|---|---:|---:|---:|
| `login` | POST | nein | nein |
| `session` | GET | nein | nein |
| `logout` | POST | ja | ja |
| `orders.new` | GET | ja | nein |
| `order.detail` | GET | ja | nein |
| `order.ship` | POST | ja | ja |

### 6.4 Antwortformat

Alle Antworten sind JSON:

```json
{
  "ok": true
}
```

Fehlerformat:

```json
{
  "ok": false,
  "error": "not_authenticated"
}
```

### 6.5 HTTP-Statuscodes

| Situation | Status |
|---|---:|
| OK | 200 |
| ungültige Zugangsdaten | 401 |
| nicht authentifiziert | 401 |
| CSRF ungültig | 403 |
| Operation unbekannt | 404 |
| falsche Methode | 405 |
| Serverfehler | 500 |

---

## 7. API-Endpunkte im Prototyp

### 7.1 Login

Request:

```http
POST /api/api.php?op=login
Content-Type: application/json
```

Body:

```json
{
  "username": "demo",
  "password": "demo"
}
```

Response:

```json
{
  "ok": true,
  "csrf": "random_csrf_token",
  "user": {
    "name": "demo"
  }
}
```

Mock-Zugangsdaten:

```text
username: demo
password: demo
```

Spätere Erweiterung:

- User-Tabelle
- Passwort-Hashing mit `password_hash()` / `password_verify()`
- Rollen/Rechte
- Login-Lockout
- Rate Limit

---

### 7.2 Session prüfen

Request:

```http
GET /api/api.php?op=session
```

Response bei gültiger Session:

```json
{
  "ok": true,
  "authenticated": true,
  "csrf": "random_csrf_token",
  "user": {
    "name": "demo"
  }
}
```

Response ohne gültige Session:

```json
{
  "ok": false,
  "authenticated": false
}
```

Zweck:

- PWA kann beim Start prüfen, ob bereits eine gültige Session existiert.
- Kein Loginstatus muss dauerhaft im Browser gespeichert werden.
- Der CSRF-Token wird bei Bedarf neu bereitgestellt.

---

### 7.3 Neue Bestellungen

Request:

```http
GET /api/api.php?op=orders.new
```

Response:

```json
{
  "ok": true,
  "orders": [
    {
      "id": "1001",
      "created_at": "2026-06-16T10:30:00+02:00",
      "customer": "Max Mustermann",
      "total": 49.9,
      "status": "new"
    },
    {
      "id": "1002",
      "created_at": "2026-06-16T11:05:00+02:00",
      "customer": "Erika Musterfrau",
      "total": 129.0,
      "status": "new"
    }
  ]
}
```

---

### 7.4 Bestelldetails

Request:

```http
GET /api/api.php?op=order.detail&id=1001
```

Response:

```json
{
  "ok": true,
  "order": {
    "id": "1001",
    "created_at": "2026-06-16T10:30:00+02:00",
    "customer": "Max Mustermann",
    "shipping_address": {
      "name": "Max Mustermann",
      "street": "Musterstraße 1",
      "zip": "12345",
      "city": "Musterstadt",
      "country": "DE"
    },
    "items": [
      {
        "sku": "ABC-001",
        "name": "Demo-Artikel",
        "qty": 2,
        "price": 19.95
      }
    ],
    "total": 49.9,
    "status": "new"
  }
}
```

---

### 7.5 Bestellung als versendet markieren

Request:

```http
POST /api/api.php?op=order.ship
Content-Type: application/json
X-CSRF-Token: <csrf-token>
```

Body:

```json
{
  "id": "1001"
}
```

Response:

```json
{
  "ok": true,
  "id": "1001",
  "status": "shipped"
}
```

Im Mock wird kein dauerhafter Zustand verändert. Die Antwort simuliert nur eine erfolgreiche Aktion.

Spätere Erweiterung:

- Datenbank-Update
- Versandzeitpunkt speichern
- Benutzer speichern, der Aktion ausgeführt hat
- Idempotenz prüfen
- Audit-Log schreiben

---

### 7.6 Logout

Request:

```http
POST /api/api.php?op=logout
X-CSRF-Token: <csrf-token>
```

Response:

```json
{
  "ok": true
}
```

Serverseitig:

- Sessiondaten leeren
- Session zerstören
- optional Cookie aktiv ablaufen lassen

---

## 8. PWA-Seite

### 8.1 Minimaler UI-Zustand

Die PWA benötigt zunächst nur wenige Zustände:

```text
loading
unauthenticated
authenticated
error
```

### 8.2 Minimale Ansichten

```text
Login-Ansicht
├── Benutzername
├── Passwort
└── Login-Button

Hauptansicht
├── eingeloggter Benutzer
├── Button: Neue Bestellungen laden
├── Liste neuer Bestellungen
├── Detailbereich
├── Button: Als versendet markieren
└── Logout-Button
```

### 8.3 Keine lokale Speicherung von Auth-Geheimnissen

Nicht speichern:

- Passwort
- Session-ID
- API-Key
- Bearer Token

Erlaubt:

- rein kosmetische UI-Zustände
- zuletzt geöffnete Bestellung, sofern nicht sensibel
- CSRF-Token nur im RAM

Für den Prototyp wird auch der CSRF-Token nicht persistent gespeichert.

---

## 9. JavaScript-Struktur

Vorgeschlagene Struktur in `app.js`:

```text
app.js
├── state
│   ├── authenticated
│   ├── csrfToken
│   ├── user
│   ├── orders
│   └── selectedOrder
│
├── api helpers
│   ├── apiGet()
│   ├── apiPost()
│   ├── login()
│   ├── checkSession()
│   ├── logout()
│   ├── loadNewOrders()
│   ├── loadOrderDetail()
│   └── markOrderShipped()
│
├── render helpers
│   ├── render()
│   ├── renderLogin()
│   ├── renderMain()
│   ├── renderOrders()
│   └── renderError()
│
└── event handling
    ├── submit login
    ├── click load orders
    ├── click order
    ├── click ship
    └── click logout
```

### 9.1 Fetch-Regeln

Alle API-Aufrufe verwenden:

```js
credentials: 'same-origin'
```

GET:

```js
fetch(url, {
  method: 'GET',
  credentials: 'same-origin',
  headers: {
    'Accept': 'application/json'
  }
});
```

POST:

```js
fetch(url, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(payload)
});
```

---

## 10. Service Worker

### 10.1 Aufgabe

Der Service Worker cached nur statische App-Assets.

Er cached nicht:

- API-Antworten
- Login-Antworten
- Bestellungen
- personenbezogene Daten
- Versandaktionen

### 10.2 Cache-Strategie

Für App-Assets:

```text
cache first, fallback network
```

Für API:

```text
network only
```

### 10.3 Ausschlussregel

Alle Requests unter `/api/` werden nicht gecacht:

```js
if (url.pathname.startsWith('/api/')) {
  event.respondWith(fetch(event.request));
  return;
}
```

---

## 11. Sicherheitsheader

Für App und API:

```http
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

Für HTTPS-Deployment:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Für API-Antworten zusätzlich:

```http
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
```

Für App-Assets können normale Cache-Header verwendet werden. Die Versionierung erfolgt über Service-Worker-Cache-Namen, z. B.:

```js
const STATIC_CACHE = 'pwa-static-v1';
```

---

## 12. PHP-Struktur

### 12.1 Zentrale Ablaufstruktur

```text
api.php
├── strict_types
├── session cookie params setzen
├── session starten
├── Security Header setzen
├── Hilfsfunktionen definieren
│   ├── json_response()
│   ├── read_json_body()
│   ├── require_method()
│   ├── require_auth()
│   ├── require_csrf()
│   └── create_csrf()
│
├── op auslesen
└── switch(op)
    ├── login
    ├── session
    ├── logout
    ├── orders.new
    ├── order.detail
    ├── order.ship
    └── default
```

### 12.2 Mock-Daten

Für den Prototyp direkt in PHP:

```php
function mock_orders(): array
{
    return [
        [
            'id' => '1001',
            'created_at' => '2026-06-16T10:30:00+02:00',
            'customer' => 'Max Mustermann',
            'total' => 49.90,
            'status' => 'new',
        ],
        [
            'id' => '1002',
            'created_at' => '2026-06-16T11:05:00+02:00',
            'customer' => 'Erika Musterfrau',
            'total' => 129.00,
            'status' => 'new',
        ],
    ];
}
```

Später ersetzbar durch:

```text
Repository
Service
Database Adapter
Shop-System Adapter
```

---

## 13. Validierung

Minimal im Prototyp:

- `op` muss bekannt sein
- `id` darf nicht leer sein
- POST-Body muss gültiges JSON sein
- Login benötigt `username` und `password`
- mutierende Operationen benötigen gültigen CSRF-Token

Für IDs zunächst konservativ:

```text
^[A-Za-z0-9_-]{1,64}$
```

Damit sind einfache Bestellnummern möglich, aber keine freien Pfade oder komplexen Payloads.

---

## 14. Fehlerstrategie

Die API gibt niemals HTML-Fehlerseiten aus, sondern immer JSON.

Beispiele:

Nicht authentifiziert:

```json
{
  "ok": false,
  "error": "not_authenticated"
}
```

Unbekannte Operation:

```json
{
  "ok": false,
  "error": "unknown_operation"
}
```

Ungültiger CSRF-Token:

```json
{
  "ok": false,
  "error": "csrf_invalid"
}
```

Ungültige Bestellung:

```json
{
  "ok": false,
  "error": "invalid_order_id"
}
```

---

## 15. Testfälle

### 15.1 Basis

- App lädt über HTTPS.
- Manifest wird erkannt.
- Service Worker registriert sich.
- Statische Assets werden gecacht.
- Reload funktioniert auch bei kurzzeitig fehlendem Netz.
- API wird nicht aus Cache bedient.

### 15.2 Auth

- `session` ohne Login meldet `authenticated: false`.
- Login mit falschen Zugangsdaten liefert `401`.
- Login mit `demo/demo` liefert `ok: true`.
- Nach Login liefert `session` gültigen Benutzer.
- Logout zerstört Session.
- Nach Logout liefert `orders.new` wieder `401`.

### 15.3 CSRF

- `order.ship` ohne CSRF-Header liefert `403`.
- `order.ship` mit falschem Token liefert `403`.
- `order.ship` mit gültigem Token liefert `ok: true`.

### 15.4 API

- `orders.new` liefert Mock-Liste.
- `order.detail&id=1001` liefert Details.
- `order.detail` ohne ID liefert Fehler.
- unbekannte `op` liefert `404`.

### 15.5 Service Worker

- `/app/app.js` darf gecacht werden.
- `/api/api.php?op=session` darf nicht gecacht werden.
- `/api/api.php?op=orders.new` darf nicht gecacht werden.

---

## 16. Entwicklungsreihenfolge

### Phase 1: Server-Minimum

1. `api/api.php` erstellen
2. JSON-Response-Helfer einbauen
3. Session-Cookie-Parameter setzen
4. Login-Mock implementieren
5. Sessionprüfung implementieren
6. Auth-Guard implementieren
7. Mock-Endpunkte implementieren
8. CSRF-Prüfung für POST implementieren
9. Fehlerantworten vereinheitlichen

### Phase 2: PWA-Minimum

1. `index.html` erstellen
2. `style.css` erstellen
3. `app.js` mit State und Renderlogik erstellen
4. Login-Formular anbinden
5. `checkSession()` beim Start ausführen
6. Bestellungen laden
7. Bestelldetails laden
8. Versandaktion auslösen
9. Logout implementieren

### Phase 3: PWA-Shell

1. `manifest.webmanifest` erstellen
2. Icons hinterlegen
3. `sw.js` erstellen
4. Service Worker registrieren
5. App-Shell-Cache testen
6. API-Cache-Ausschluss testen

### Phase 4: Härtung vor realer Nutzung

1. echte Benutzerprüfung
2. Passwort-Hashing
3. Rate Limiting für Login
4. Logging
5. Audit-Log für Versandaktionen
6. Datenbank oder Shop-Adapter
7. Rollen/Rechte
8. Produktions-CSP prüfen
9. Fehlerausgabe ohne interne Details
10. Deployment-Prozess definieren

---

## 17. Offene Entscheidungen für die nächste Iteration

Diese Punkte sollten später bewusst entschieden werden:

1. Soll die PWA nur für einen Admin/User gedacht sein oder mehrere Benutzer unterstützen?
2. Sollen Benutzerrollen existieren?
3. Woher kommen echte Bestellungen?
   - lokale Datenbank
   - Shop-Datenbank
   - externer Shop-Export
   - bestehende PHP-Anwendung
4. Muss die PWA offline Bestellungen anzeigen können?
5. Darf die PWA sensible Bestelldaten lokal speichern?
6. Soll Versandmarkierung idempotent sein?
7. Muss ein Audit-Log revisionssicher sein?
8. Wird ein Barcode-/QR-Scan für Bestellungen benötigt?
9. Soll später Push/Background Sync hinzukommen?
10. Soll die API später von anderen Clients genutzt werden?

---

## 18. Bewusste Minimalentscheidungen

Für den initialen Prototyp gilt:

```text
PWA:
  lokale statische Assets
  einfache UI
  keine Framework-Abhängigkeit
  kein Build-System
  kein Token-Speicher

PHP:
  eine zentrale api.php
  Session-basiert
  Mock-Daten im Code
  keine Datenbank

Security:
  HTTPS-only
  Secure HttpOnly SameSite Cookie
  CSRF für POST
  API no-store
  API nicht im Service Worker cachen

API:
  JSON
  GET für lesend
  POST für mutierend
  op-basiertes Routing
```

---

## 19. Erwartetes Ergebnis des Prototyps

Nach Umsetzung soll Folgendes möglich sein:

1. Benutzer öffnet die PWA.
2. PWA prüft automatisch `/api/api.php?op=session`.
3. Ohne Session erscheint Login.
4. Benutzer loggt sich mit `demo/demo` ein.
5. Server setzt eine sichere Session.
6. PWA erhält einen CSRF-Token.
7. Benutzer lädt neue Bestellungen.
8. Benutzer öffnet Details zu Bestellung `1001`.
9. Benutzer markiert Bestellung `1001` als versendet.
10. PWA sendet POST mit CSRF-Token.
11. PHP antwortet mit Mock-Erfolg.
12. Benutzer kann sich ausloggen.
13. App-Shell bleibt lokal cachebar.
14. API-Antworten bleiben nicht persistent gecacht.

---

## 20. Nächster sinnvoller Schritt

Aus diesem Plan können als nächstes direkt erzeugt werden:

```text
/app/index.html
/app/style.css
/app/app.js
/app/manifest.webmanifest
/app/sw.js
/api/api.php
```

Empfohlene nächste Iteration:

1. vollständiger Minimalcode für beide Seiten
2. danach Review der Sicherheitslogik
3. danach Entscheidung, ob echte Persistenz zuerst über Datei, SQLite oder MySQL erfolgen soll
