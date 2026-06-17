# Order PWA - Benutzerhandbuch

Willkommen beim Benutzerhandbuch für die **Order PWA** (Progressive Web App) für deinen OXID eShop. Diese Anleitung führt dich durch alle Funktionen der App aus Sicht eines Nutzers.

---

## Inhaltsverzeichnis
1. [Voraussetzungen und Login](#1-voraussetzungen-und-login)
2. [Das Dashboard](#2-das-dashboard)
3. [Kunden suchen und verwalten](#3-kunden-suchen-und-verwalten)
4. [Neue Bestellungen](#4-neue-bestellungen)
5. [Bestellung suchen](#5-bestellung-suchen)
6. [Statistiken](#6-statistiken)
7. [Top Seller](#7-top-seller)
8. [Einstellungen & Cache](#8-einstellungen--cache)

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
*   **Statistiken:** Umsätze und Auswertungen prüfen
*   **Top Seller:** Die bestverkauften Artikel analysieren
*   **Einstellungen:** Datenbankverbindungen verwalten

Alternativ kannst du jederzeit über das **Burger-Menü** (die drei Striche oben rechts) auf alle diese Punkte zugreifen.

---

## 3. Kunden suchen und verwalten

Über diesen Menüpunkt kannst du den Kundenstamm deines OXID eShops durchsuchen.

*   **Suchfeld:** Gib einen Namen, eine Firma, die Kundennummer (KdNr.) oder den Benutzernamen (E-Mail) ein.
*   **Detailansicht:** Klickst du in den Suchergebnissen auf einen Kunden, öffnet sich rechts bzw. darunter (je nach Bildschirmgröße) eine Detailansicht mit allen wichtigen Kontaktdaten (Rechnungs- & Lieferadresse, E-Mail, Telefon).
*   **Bestellhistorie:** In der Detailansicht hast du die Möglichkeit, dir mit einem Klick die komplette Bestellhistorie dieses spezifischen Kunden anzeigen zu lassen.

---

## 4. Neue Bestellungen

Dieser Bereich gibt dir einen schnellen Überblick über das aktuelle Tagesgeschäft.

*   **Liste:** Hier werden dir automatisch die neuesten Bestellungen in einer paginierten Liste (jeweils 10 pro Seite) angezeigt.
*   **Status-Badges:** Farbige Markierungen zeigen dir direkt den Status an (z.B. Bezahlt, Storno, Versendet).
*   **Details:** Ein Klick auf eine Bestellung öffnet die Detailansicht. Dort siehst du:
    *   Die Kundeninformationen
    *   Die Bestellsummen (inklusive Versandkosten)
    *   Die gekauften Artikel mit Anzahl und Preis
*   **Aktualisieren:** Oben rechts findest du einen Button "Aktualisieren", um die neuesten Eingänge sofort zu laden, ohne die App neu zu starten.

---

## 5. Bestellung suchen

Wenn du eine spezifische Bestellung suchst, bist du hier richtig. Dir stehen zwei Suchmethoden zur Verfügung:

1.  **Nach Bestellnummer:** Gib die exakte OXID-Bestellnummer (`OXORDERNR`) ein, um sofort zur entsprechenden Bestellung zu springen.
2.  **Nach Zeitraum:** Wähle ein "Von"- und ein "Bis"-Datum aus. Du kannst zusätzlich einstellen, wie viele Ergebnisse maximal geladen werden sollen (z.B. 20, 50 oder 100). Dies ist besonders hilfreich, wenn du nach Bestellungen eines bestimmten Tages suchst, aber die Nummer nicht auswendig weißt.

---

## 6. Statistiken

Das Statistik-Dashboard bietet dir auf einen Blick eine Auswertung deiner Netto-Umsätze (exklusive Versandkosten und exklusive stornierter Bestellungen).

*   **Laufender Monat:** Ein Balkendiagramm zeigt dir den tagesaktuellen Umsatz des laufenden Monats. Eine Trendlinie (roter Strich) visualisiert den gleitenden 30-Tage-Durchschnitt, damit du sofort siehst, ob der aktuelle Tag über- oder unterdurchschnittlich läuft.
*   **Jahresverlauf:** Ein interaktives Balkendiagramm zeigt dir die Monatsumsätze des aktuellen Jahres im Vergleich zum Durchschnitt der Vorjahre. So erkennst du saisonale Trends sofort.

---

## 7. Top Seller

Welche Produkte laufen am besten? Dieser Bereich listet dir deine Top 10 Bestseller auf.

Du kannst über die Buttons über der Liste verschiedene **Zeiträume** auswählen:
*   Laufender Monat
*   Laufendes Jahr
*   Vorjahr
*   All-time (Gesamte Laufzeit des Shops)

Für jeden Artikel in der Liste siehst du die verkaufte Menge, den durchschnittlichen Einzelpreis sowie den damit generierten kumulierten Umsatz in diesem Zeitraum.

---

## 8. Einstellungen & Cache

In den Einstellungen nimmst du technische Konfigurationen vor und verwaltest die App.

*   **OXID Datenbankverbindung:** Wenn du die App zum ersten Mal nutzt, musst du hier die Zugangsdaten deiner OXID Shop-Datenbank (Host, Benutzer, Passwort, Datenbankname) eintragen. Die App baut daraufhin eine sichere Nur-Lese-Verbindung zu deinem Shop auf.
*   **Datenschutzerklärung:** Hier kannst du den Link zu deiner Datenschutzerklärung hinterlegen, der dann im Footer der App angezeigt wird.
*   **Cache verwalten:** Die App speichert historische, berechnungsintensive Daten (wie z.B. Top-Seller oder Vorjahresdurchschnitte) lokal zwischen, um extrem schnell zu laden. Über den Button **"Cache leeren"** kannst du diese Zwischenspeicher bei Bedarf löschen. Sie werden dann beim nächsten Aufruf der Statistiken frisch aus der Shop-Datenbank berechnet.

---
*Ende des Benutzerhandbuchs.*
