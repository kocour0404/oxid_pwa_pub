# PWA Basic Structure & Design

Dieses Dokument beschreibt den grundlegenden strukturellen Aufbau, die Navigation und die Ansichten der Progressive Web App (PWA), ohne im Detail auf die zugrundeliegende (Backend-)Funktionalität einzugehen. Es dient als wiederverwendbare Blaupause für das Frontend-Design.

## 1. Allgemeiner Layout-Aufbau (App Shell)

Die PWA folgt dem typischen Single-Page-Application (SPA) Design, bei dem eine "App Shell" geladen wird und die Inhalte dynamisch ausgetauscht werden. Der Haupt-Container (`#app-wrapper`) besteht aus den folgenden Kernkomponenten:

*   **Header (`#main-header`)**:
    *   **Links**: Logo und App-Titel (fungiert als Link zurück zum Dashboard).
    *   **Rechts**: Interaktive Buttons (Profil, Logout, Burger-Menü für mobile Ansichten).
*   **Navigation / Sidebar (`#sidebar`)**:
    *   Beinhaltet das Hauptmenü der Anwendung.
    *   Ein Overlay (`#sidebar-overlay`) wird verwendet, um die Sidebar auf mobilen Geräten einzublenden und den restlichen Bildschirm abzudunkeln.
    *   **Sidebar-Header**: Titel und ein Schließen-Button (für Mobile).
    *   **Sidebar-Links**: Liste von Navigationspunkten (`<ul>` / `<li>`), die mit `data-target` Attributen auf die jeweiligen Views verweisen.
    *   **Sidebar-Footer**: Logout-Button am unteren Rand.
*   **Hauptinhaltsbereich (`#main-content`)**:
    *   Der Container für alle dynamischen Ansichten (Views). Zu jedem Zeitpunkt ist in der Regel nur eine View sichtbar.
*   **Footer (`#main-footer`)**:
    *   Copyright-Informationen und Links (z.B. Datenschutz).

## 2. Navigationskonzept

Die Navigation basiert auf dem Umschalten der Sichtbarkeit von vordefinierten `div`-Containern (den sogenannten "Views"). 
*   Jede Ansicht hat eine spezifische ID (z.B. `#dashboard-view`, `#orders-view`).
*   Alle Ansichten teilen sich die gemeinsame Klasse `.view` (oder `.view-section`), um einheitlich über CSS oder JavaScript ein- und ausgeblendet zu werden (z.B. Wechsel von `display: none` zu `display: block`).
*   Das Umschalten wird typischerweise durch Klicks auf Sidebar-Links oder Dashboard-Kacheln getriggert, wobei das `data-target` Attribut ausgelesen und die entsprechende ID angesprochen wird.

## 3. Ansichten (Views)

Das UI ist in logische Module unterteilt. Hier ist eine Übersicht der vorhandenen Views und ihres Layouts:

### 3.1. System & Authentifizierung
*   **Loading View (`#loading-view`)**: Zeigt einen Spinner (`.spinner`) und Lade-Text, solange Daten abgerufen werden oder die App initialisiert.
*   **Login View (`#login-view`)**: Zentrierte Karte (`.login-card`) mit einem Formular (Benutzername, Passwort) und Submit-Button.
*   **Change Password View (`#change-password-view`)**: Formular-Karte zur Änderung des Passworts (wird z.B. beim ersten Login erzwungen).

### 3.2. Dashboard (`#dashboard-view`)
Das zentrale Einstiegspanel nach dem Login.
*   **Begrüßung**: Zeigt den Namen des angemeldeten Benutzers.
*   **Tile-Grid (`.tile-grid`)**: Ein responsives Raster aus Kacheln (`.tile`). Jede Kachel repräsentiert einen Schnellzugriff auf eine Hauptfunktion (Kunden, Bestellungen, Artikel suchen, Statistiken, etc.) und enthält ein Icon, einen Titel und einen kurzen Beschreibungstext.

### 3.3. Listen und Detailansichten (Master-Detail-Layout)
Einige Views nutzen ein Split-Layout (`.orders-layout`), das in zwei Spalten unterteilt werden kann (Liste links, Details rechts):
*   **Orders View (`#orders-view`)**: Liste der neuesten Bestellungen (`#orders-list`). Bei Klick auf eine Bestellung öffnet sich der Detailbereich (`#order-detail`).
*   **Customers View (`#customers-view`)**: Suchformular oben. Darunter ein Split-Layout mit der Trefferliste (`#customers-list`) und einem Detailbereich (`#customer-detail`).

### 3.4. Such-Ansichten
*   **Order Search View (`#order-search-view`)**: Enthält zwei getrennte Suchkarten (`.login-card`):
    *   Suche nach Bestellnummer.
    *   Suche nach Zeitraum (Von, Bis, Limit).
    *   Darunterliegender Bereich für Suchergebnisse (`#search-result-container`, `#date-search-results`).
*   **Article Search View (`#article-search-view`)**: Suchformular für Artikelnummer, EAN oder Titel. Raster für die Suchergebnisse (`#article-search-results`).

### 3.5. Statistiken und Auswertungen
*   **Stats View (`#stats-view`)**: Nutzt Karten (`.stat-card`) zur Darstellung von Kennzahlen und Diagrammen (`.chart-container`). Enthält typischerweise Legenden und große Zahlen-Badges (`.stat-big-number`).
*   **Top Seller View (`#topseller-view`)**: Zeigt die Bestseller in Listenform. Bietet Filter-Buttons (`.page-btn`) zur Zeitraum-Auswahl (Monat, Jahr, Vorjahr, All-time).

### 3.6. Verwaltung & Einstellungen (Admin-Bereich)
*   **Settings View (`#settings-view`)**: Formulare zur Konfiguration von Systemeinstellungen (z.B. Datenbankzugang) und Karten zur Systemwartung (z.B. Cache leeren).
*   **Users View (`#users-view`)**: Formular zum Anlegen neuer Benutzer und eine Datentabelle (`.data-table`) zur Auflistung und Verwaltung bestehender Benutzer.

### 3.7. Spezifische Sub-Views
*   **Customer History View (`#customer-history-view`)**: Zeigt die vergangenen Bestellungen eines bestimmten Kunden. Enthält einen Zurück-Button im View-Header.

## 4. Modals (Overlays)
Für kurzzeitige Interaktionen, die den aktuellen Kontext nicht verlassen sollen, werden Modals verwendet:
*   **User Profile Modal (`#user-profile-modal`)**: Ein überlagerndes Fenster (`.modal`, `.modal-content`), das z.B. Profiloptionen oder einen Button zum Passwortändern anbietet.

## 5. UI/UX Prinzipien & Design Patterns
*   **Responsivität**: Das Layout passt sich an verschiedene Bildschirmgrößen an (z.B. durch das Ein-/Ausklappen der Sidebar und das Umbrechen des Tile-Grids).
*   **Karten-Layout**: Formulare und abgesetzte Inhaltsbereiche werden oft in Karten (`.login-card`, `.stat-card`) verpackt, um sie visuell abzuheben.
*   **Einheitliche Formulare**: Nutzung von `.form-group` für Label-Input-Kombinationen.
*   **Einheitliche Buttons**: Unterscheidung nach Wichtigkeit (z.B. `.primary-btn`, `.secondary-btn`, `.danger-btn`, `.icon-btn`).
*   **Feedback**: Nutzung von `.error-msg` und `.success-msg` Containern für Systemrückmeldungen an den Nutzer direkt im relevanten Kontext (unter Formularen oder Tabellen).
