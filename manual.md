# Order PWA - Benutzerhandbuch

Willkommen beim Benutzerhandbuch für die **Order PWA** (Progressive Web App) für deinen OXID eShop. Diese Anleitung führt dich durch alle Funktionen der App aus Sicht eines Nutzers.

---

## Inhaltsverzeichnis
1. [Voraussetzungen und Login](#1-voraussetzungen-und-login)
2. [Das Dashboard](#2-das-dashboard)
3. [Profil & Passwort ändern](#3-profil--passwort-ändern)
4. [Kunden suchen und verwalten](#4-kunden-suchen-und-verwalten)
5. [Neue Bestellungen](#5-neue-bestellungen)
6. [Bestellung suchen](#6-bestellung-suchen)
7. [Artikel suchen](#7-artikel-suchen)
8. [Statistiken](#8-statistiken)
9. [Top Seller](#9-top-seller)
10. [Benutzerverwaltung (Admin)](#10-benutzerverwaltung-admin)
11. [Einstellungen & Cache](#11-einstellungen--cache)

---

## 1. Voraussetzungen und Login

Um die App nutzen zu können, musst du sie in deinem Browser aufrufen (z.B. auf dem Smartphone über Chrome oder Safari). Da es sich um eine PWA handelt, kannst du sie über die Browser-Optionen **"Zum Startbildschirm hinzufügen"** (oder ähnlich) direkt wie eine native App auf deinem Gerät installieren.

**Login-Vorgang:**
1. Öffne die App.
2. Du siehst eine sichere Anmeldemaske.
3. Gib deinen **Benutzernamen** und dein **Passwort** ein, die bei der Installation der App für dich generiert wurden.
4. Klicke auf **Einloggen**.

*(Hinweis: Die App merkt sich deine Sitzung sicher im Hintergrund, sodass du dich nicht bei jedem Öffnen neu anmelden musst.)*

---

## 2. Das Dashboard

Nach erfolgreichem Login landest du auf dem Dashboard. Dies ist deine zentrale Navigationsübersicht.

Hier findest du verschiedene **Kacheln** für den Schnellzugriff auf alle Funktionen der App:
*   **Kunden:** Kunden suchen und verwalten
*   **Neue Bestellungen:** Die aktuellsten Bestellungen ansehen
*   **Bestellung suchen:** Gezielt nach bestimmten Käufen suchen
*   **Artikel suchen:** Shop-Artikel inklusive Varianten durchsuchen
*   **Statistiken:** Umsätze und Auswertungen prüfen
*   **Top Seller:** Die bestverkauften Artikel analysieren
*   **Benutzer (Admin):** Weitere App-Nutzer anlegen (nur für Haupt-Admins sichtbar)
*   **Einstellungen (Admin):** Datenbankverbindungen verwalten (nur für Haupt-Admins sichtbar)

Alternativ kannst du jederzeit über das **Burger-Menü** (die drei Striche oben rechts) auf alle diese Punkte zugreifen.

---

## 3. Profil & Passwort ändern

Sobald du angemeldet bist, findest du oben rechts ein **Profil-Icon** (neben dem Logout-Button). 

*   Ein Klick darauf öffnet ein Menü, in dem du dein Passwort ändern kannst. 
*   **Wichtig:** Falls ein Administrator dein Passwort zurückgesetzt hat, wirst du nach dem nächsten Login **zwingend** aufgefordert, ein neues, sicheres Passwort zu vergeben, bevor du auf das Dashboard zugreifen kannst.

---

## 4. Kunden suchen und verwalten

Über diesen Menüpunkt kannst du den Kundenstamm deines OXID eShops durchsuchen.

*   **Suchfeld:** Gib einen Namen, eine Firma, die Kundennummer (KdNr.) oder den Benutzernamen (E-Mail) ein.
*   **Detailansicht:** Klickst du in den Suchergebnissen auf einen Kunden, öffnet sich rechts bzw. darunter (je nach Bildschirmgröße) eine Detailansicht mit allen wichtigen Kontaktdaten (Rechnungs- & Lieferadresse, E-Mail, Telefon).
*   **Bestellhistorie:** In der Detailansicht hast du die Möglichkeit, dir mit einem Klick die komplette Bestellhistorie dieses spezifischen Kunden anzeigen zu lassen.

---

## 5. Neue Bestellungen

Dieser Bereich gibt dir einen schnellen Überblick über das aktuelle Tagesgeschäft.

*   **Liste:** Hier werden dir automatisch die neuesten Bestellungen in einer paginierten Liste (jeweils 10 pro Seite) angezeigt.
*   **Status-Badges:** Farbige Markierungen zeigen dir direkt den Status an (z.B. Bezahlt, Storno, Versendet).
*   **Details:** Ein Klick auf eine Bestellung öffnet die Detailansicht. Dort siehst du:
    *   Die Kundeninformationen
    *   Die Bestellsummen (inklusive Versandkosten)
    *   Die gekauften Artikel mit Anzahl und Preis
*   **Aktualisieren:** Oben rechts findest du einen Button "Aktualisieren", um die neuesten Eingänge sofort zu laden, ohne die App neu zu starten.

---

## 6. Bestellung suchen

Wenn du eine spezifische Bestellung suchst, bist du hier richtig. Dir stehen zwei Suchmethoden zur Verfügung:

1.  **Nach Bestellnummer:** Gib die exakte OXID-Bestellnummer (`OXORDERNR`) ein, um sofort zur entsprechenden Bestellung zu springen.
2.  **Nach Zeitraum:** Wähle ein "Von"- und ein "Bis"-Datum aus. Du kannst zusätzlich einstellen, wie viele Ergebnisse maximal geladen werden sollen (z.B. 20, 50 oder 100). Dies ist besonders hilfreich, wenn du nach Bestellungen eines bestimmten Tages suchst, aber die Nummer nicht auswendig weißt.

---

## 7. Artikel suchen

Mit der Artikelsuche kannst du blitzschnell den aktuellen Bestand und die Preise deines Shops prüfen.

*   **Suchfelder:** Du kannst nach einem Begriff im Titel, nach der **Artikelnummer (ArtNr)** oder direkt nach der **EAN** suchen.
*   **Darstellung:** Das System unterscheidet automatisch zwischen normalen Einzelartikeln und Artikeln mit Varianten (sog. Hauptartikel). 
*   **Varianten-Ansicht:** Hat ein Artikel Varianten (z.B. verschiedene Größen/Farben), wird der Hauptartikel als Kopf angezeigt und darunter eine übersichtliche Tabelle aller dazugehörigen Varianten inkl. Preis und Bestand.
*   **Preview-Link:** Wenn du auf den Titel eines Artikels (oder einer Variante) klickst, öffnet sich (sofern in den Einstellungen konfiguriert) direkt die Produktdetailseite deines eShops in einem neuen Tab.

---

## 8. Statistiken

Das Statistik-Dashboard bietet dir auf einen Blick eine Auswertung deiner Netto-Umsätze (exklusive Versandkosten und exklusive stornierter Bestellungen).

*   **Laufender Monat:** Ein Balkendiagramm zeigt dir den tagesaktuellen Umsatz des laufenden Monats. Eine Trendlinie (roter Strich) visualisiert den gleitenden 30-Tage-Durchschnitt, damit du sofort siehst, ob der aktuelle Tag über- oder unterdurchschnittlich läuft.
*   **Jahresverlauf:** Ein interaktives Balkendiagramm zeigt dir die Monatsumsätze des aktuellen Jahres im Vergleich zum Durchschnitt der Vorjahre. So erkennst du saisonale Trends sofort.

---

## 9. Top Seller

Welche Produkte laufen am besten? Dieser Bereich listet dir deine Top 10 Bestseller auf.

Du kannst über die Buttons über der Liste verschiedene **Zeiträume** auswählen:
*   Laufender Monat
*   Laufendes Jahr
*   Vorjahr
*   All-time (Gesamte Laufzeit des Shops)

Für jeden Artikel in der Liste siehst du die verkaufte Menge, den durchschnittlichen Einzelpreis sowie den damit generierten kumulierten Umsatz in diesem Zeitraum.

---

## 10. Benutzerverwaltung (Admin)

Dieser Bereich ist **nur für den Haupt-Administrator** sichtbar.

Hier können weitere Benutzer-Accounts für Mitarbeiter angelegt werden. 
*   Jeder Mitarbeiter bekommt einen eigenen Benutzernamen und ein von dir vergebenes Start-Passwort.
*   Du kannst Accounts jederzeit wieder löschen oder ein "Passwort-Reset" erzwingen. Dies sperrt das alte Passwort und zwingt den Mitarbeiter, sich beim nächsten Login sofort ein eigenes, neues Passwort zu vergeben.
*   Normale Mitarbeiter haben keinen Zugriff auf die Benutzerverwaltung und können die Datenbank-Einstellungen nicht ändern.

---

## 11. Einstellungen & Cache

In den Einstellungen nimmst du technische Konfigurationen vor und verwaltest die App.

*   **OXID Datenbankverbindung:** Wenn du die App zum ersten Mal nutzt, musst du hier die Zugangsdaten deiner OXID Shop-Datenbank (Host, Benutzer, Passwort, Datenbankname) eintragen. Die App baut daraufhin eine sichere Nur-Lese-Verbindung zu deinem Shop auf.
*   **Shop-Baselink:** Trage hier die Haupt-URL deines Shops ein (z.B. `https://mein-shop.de/`). Dieser Link wird genutzt, um dir z.B. bei der Artikelsuche einen direkten Preview-Link zum Frontend generieren zu können.
*   **Datenschutzerklärung:** Hier kannst du den Link zu deiner Datenschutzerklärung hinterlegen, der dann im Footer der App angezeigt wird.
*   **Cache verwalten:** Die App speichert historische, berechnungsintensive Daten (wie z.B. Top-Seller oder Vorjahresdurchschnitte) lokal zwischen, um extrem schnell zu laden. Über den Button **"Cache leeren"** kannst du diese Zwischenspeicher bei Bedarf löschen. Sie werden dann beim nächsten Aufruf der Statistiken frisch aus der Shop-Datenbank berechnet.

---
*Ende des Benutzerhandbuchs.*
