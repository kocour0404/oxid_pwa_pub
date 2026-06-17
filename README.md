# Order PWA (OXID eShop)

Eine "Mobile First" Progressive Web App zur Verwaltung und Ansicht von Bestellungen aus einem OXID eShop. 

## Intent (Zielsetzung)
Ziel dieser PWA ist es, Shop-Betreibern eine schnelle, sichere und für mobile Endgeräte optimierte Ansicht ihrer Bestellungen zu bieten, ohne sich in das komplexe OXID Admin-Backend einloggen zu müssen. Sie läuft komplett unabhängig vom OXID-Core und verbindet sich nur auf Datenbankebene lesend mit dem Shop.

## Architektur
Das System basiert auf einer Dual-Database-Architektur, um maximale Sicherheit und Unabhängigkeit zu gewährleisten:
1. **PWA Datenbank (`oxidpwa`)**: Hier liegen die Zugangsdaten der App-Nutzer (Passwort-Hashes) und die Konfiguration, wie die App sich mit der Shop-Datenbank verbinden soll.
2. **Shop Datenbank (`mwm-test` o.ä.)**: Die reguläre OXID Datenbank. Aus dieser werden die Bestelldaten (`oxorder`, `oxorderarticles`, `oxuser`) nur **lesend** abgerufen.

**Technologie-Stack:**
*   **Backend:** Leichtgewichtiges PHP (`api/api.php`) mit PDO für sichere, Prepared SQL-Statements.
*   **Frontend:** Vanilla JavaScript, HTML5 und Vanilla CSS. Kein schwergewichtiges Framework.
*   **PWA Features:** Ein Service Worker (`sw.js`) kümmert sich um das Caching der Assets, ein Webmanifest ermöglicht die Installation auf dem Homescreen.

## Sicherheit
*   **Passwörter:** Werden ausschließlich als sichere Bcrypt-Hashes (`password_hash()`) in der PWA-Datenbank gespeichert.
*   **Authentifizierung:** Nutzt sichere HttpOnly, SameSite=Strict Cookies mit dem `__Host-` Prefix, um Session-Hijacking zu verhindern.
*   **Isolierung:** Die Zugangsdaten der Shop-Datenbank werden serverseitig in der `oxidpwaconfig` Tabelle gespeichert und **niemals** an das Frontend übertragen.
*   **Routing:** Eine dedizierte `.htaccess` deaktiviert die `mod_rewrite` Engine für das PWA-Verzeichnis, um Konflikte mit dem OXID-Router auszuschließen.

## Funktions-Walkthrough
1. **Login:** Sichere Anmeldemaske (Nutzer wird individuell beim Installieren generiert).
2. **Dashboard:** Kachel-Übersicht für Navigation.
3. **Einstellungen:** Konfiguration der Shop-Datenbank-Verbindung (Host, User, PW, DB-Name).
4. **Bestellungen (Neu):** Paginierte Liste der neuesten Bestellungen inkl. Status-Badges (Bezahlt, Storno, Versendet) und Ladefunktion (10 pro Seite).
5. **Bestellsuche:** Gezielte Suche nach einer OXID-Bestellnummer (`OXORDERNR`). (Geschützt gegen SQL-Injection durch sichere PDO Prepared Statements).
6. **Bestell-Details:** Zeigt Kundeninformationen, Bestellsummen (inkl. Versand) und die gekauften Artikel an.
7. **Statistiken:** Performantes, gecachtes Dashboard zur Auswertung der Netto-Umsätze (exkl. Versand/Storno). Bietet ein tagesaktuelles Balkendiagramm für den laufenden Monat inklusive gleitendem 30-Tage-Durchschnitt als Trendlinie, sowie ein interaktives Zero-Dependency Jahres-Balkendiagramm inkl. historischer Vergleichswerte.

## Installationsprozess

1. **Vorbereitung & Nutzer anlegen (Lokal):**
   Öffne ein Terminal in deinem lokalen `oxid_pwa/`-Ordner und führe den Builder aus:
   `php build.php`
   Du wirst nach einem gewünschten Benutzernamen und Passwort gefragt. Das Skript erzeugt die fertige `database/install.php` Datei und hasht das Passwort sicher lokal. Dein Passwort wird nie im Klartext auf den Server hochgeladen.

2. **PWA Datenbank-Konfiguration anpassen:**
   Öffne die Datei `config.php` im Hauptverzeichnis und trage dort die Zugangsdaten für die Datenbank ein, in der die PWA ihre **eigenen** Nutzer und Einstellungen speichern darf (idealerweise eine leere App-Datenbank).
   
   ```php
   define('PWA_DB_HOST', 'localhost');
   define('PWA_DB_USER', 'dein_user');
   define('PWA_DB_PASS', 'dein_passwort');
   define('PWA_DB_NAME', 'oxidpwa'); // z.B. usr_p200395_4
   ```

3. **Dateien auf den Server hochladen:**
   Kopiere den gesamten Ordner `oxid_pwa/` in das Hauptverzeichnis deines Webservers (z. B. auf die gleiche Ebene wie deinen OXID eShop).

4. **Setup Skript ausführen:**
   Rufe im Browser das hochgeladene Skript auf, um die Datenbank und den Nutzer anzulegen:
   `https://deinedomain.de/oxid_pwa/database/install.php`
   > [!WARNING]  
   > Lösche die Datei `install.php` nach dem erfolgreichen Ausführen aus Sicherheitsgründen vom Server!

5. **App starten & mit Shop verbinden:**
   Rufe nun die eigentliche PWA im Browser auf:
   `https://deinedomain.de/oxid_pwa/app/`
   Melde dich mit den in Schritt 1 erzeugten Daten an. Gehe anschließend auf "Einstellungen" und trage dort die Zugangsdaten deiner **OXID Shop-Datenbank** ein. Ab sofort hast du deine Bestellungen im Blick!
