# Pitch Deck: Order PWA für OXID eShop

## 1. Das Problem
OXID eShop ist ein fantastisches, leistungsstarkes System für den E-Commerce. Das Admin-Backend ist jedoch für große Bildschirme und komplexe Verwaltungsaufgaben konzipiert. 
Wenn ein Shop-Betreiber oder Lagermitarbeiter **unterwegs auf dem Smartphone** schnell eine neue Bestellung prüfen, den Status checken oder eine Bestellnummer nachschlagen möchte, ist das klassische OXID-Backend oft zu langsam, nicht touch-optimiert und unübersichtlich. Zudem bedeutet jeder mobile Login in das Hauptsystem ein potenzielles Sicherheitsrisiko für den gesamten Shop.

## 2. Die Lösung: Order PWA
Die **Order PWA** (Progressive Web App) ist eine kompromisslos auf "Mobile First" getrimmte Web-Applikation. Sie wird wie eine native App auf dem Homescreen von iOS- oder Android-Geräten installiert und bietet einen blitzschnellen, fokussierten Blick auf das Tagesgeschäft: **Bestellungen**.

### Kernfunktionen auf einen Blick:
*   **Live-Dashboard:** Die neuesten Bestellungen auf Knopfdruck abrufen.
*   **Intuitive Übersicht:** Schnelle Identifikation durch Status-Badges (Bezahlt, Versendet, Storno).
*   **Blitz-Suche:** Gezieltes Finden von Bestellungen über die OXORDERNR.
*   **Native App-Experience:** App-Icon auf dem Homescreen, Vollbildmodus ohne Browserleiste und superschnelle Ladezeiten durch Caching (Service Worker).

## 3. Der technische USP (Warum diese Architektur gewinnt)
Die App wurde nicht als klassisches, tiefgreifendes OXID-Modul konzipiert, sondern als **autarkes, entkoppeltes System**. Das bietet unschlagbare Vorteile:

*   **Zero-Risk Architektur (Dual-Database):** 
    Die PWA besitzt eine *eigene*, winzige Datenbank für ihre Benutzer und Einstellungen. Mit der eigentlichen Shop-Datenbank verbindet sie sich streng isoliert und **rein lesend**. Selbst wenn ein Mitarbeiter-Smartphone kompromittiert wird, kann der Shop-Kern niemals manipuliert oder zerstört werden.
*   **Höchste Sicherheitsstandards:**
    *   **Bcrypt & CLI-Builder:** Passwörter werden bei der Installation über einen lokalen Terminal-Builder gehasht. Das Klartext-Passwort verlässt niemals den lokalen Rechner in Richtung Webserver.
    *   **Anti-Hijacking:** Nutzung von modernen `__Host-` präfixierten Cookies (Strict, HttpOnly) und CSRF-Tokens.
    *   **SQL-Injection Protection:** Die gesamte Kommunikation mit der OXID-Datenbank läuft über sichere PDO Prepared Statements.
*   **Kein Core-Hacking:** 
    Da die App lediglich auf die Datenbankstruktur (z.B. `oxorder`) zugreift, muss kein einziger OXID-Core-File angefasst werden. OXID Updates können völlig unabhängig von der PWA durchgeführt werden.

## 4. Business Value für den Betreiber
*   **Zeitersparnis:** Reduktion der Klicks, um Bestellinformationen einzusehen, von ~15 (im OXID Admin) auf 1-2 Klicks in der PWA.
*   **Flexibilität im Lager:** Lagermitarbeiter brauchen keinen vollen OXID-Zugang und keinen Desktop-Rechner mehr. Ein Smartphone reicht zur Kommissionierung.
*   **Kosteneffizienz:** Durch die schlanke Architektur (Vanilla JS, leichtgewichtiges PHP) entstehen keine hohen Wartungskosten durch Framework-Abhängigkeiten oder komplexe Modul-Updates.

---
**Fazit:** Die Order PWA transformiert das mobile Bestellmanagement von OXID-Shops aus einer Notlösung in ein echtes Premium-Erlebnis – blitzschnell, intuitiv und kompromisslos sicher.
