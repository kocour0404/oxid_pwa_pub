<?php
// build.php - CLI Builder für das Installationsskript
// Aufruf im Terminal: php build.php

echo "=========================================\n";
echo "   Order PWA - Installer Builder\n";
echo "=========================================\n\n";
echo "Dieses Skript generiert die finale 'database/install.php' Datei.\n";
echo "Das Passwort wird lokal gehasht, sodass das Klartext-Passwort\n";
echo "niemals auf den Webserver hochgeladen wird.\n\n";

// Windows-kompatible Eingabe-Methode, falls readline nicht verfügbar ist
function getInput($prompt) {
    echo $prompt;
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    fclose($handle);
    return trim($line);
}

$username = getInput("Gewünschter Admin-Benutzername [admin]: ");
if (empty($username)) {
    $username = 'admin';
}

$password = getInput("Gewünschtes Admin-Passwort: ");
if (empty($password)) {
    die("\n[Fehler] Das Passwort darf nicht leer sein! Abbruch.\n");
}

echo "\nGeneriere sicheren Bcrypt-Hash...\n";
$hash = password_hash($password, PASSWORD_DEFAULT);

$installScript = <<<PHP
<?php
declare(strict_types=1);

// =========================================================================
// GENERIERT DURCH build.php
// Diese Datei enthält den generierten Hash für den PWA-Nutzer '$username'.
// Nach erfolgreicher Installation auf dem Webserver sollte diese Datei 
// aus Sicherheitsgründen gelöscht werden!
// =========================================================================

require_once __DIR__ . '/../config.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    \$pdo = new PDO("mysql:host=" . PWA_DB_HOST . ";charset=utf8mb4", PWA_DB_USER, PWA_DB_PASS);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    \$dbname = PWA_DB_NAME;
    echo "PWA-Datenbank-Setup gestartet...\\n";
    echo "Verbinde mit Server " . PWA_DB_HOST . "...\\n";

    // Optionales Anlegen der DB (schlägt auf Shared Hosting oft fehl, das ist ok)
    try {
        \$pdo->exec("CREATE DATABASE IF NOT EXISTS `\$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "Datenbank '\$dbname' geprueft/angelegt (OK).\\n";
    } catch (PDOException \$e) {
        echo "Info: CREATE DATABASE übersprungen (Shared Hosting Modus).\\n";
    }

    \$pdo->exec("USE `\$dbname`");

    echo "Erstelle Tabelle 'oxidpwauser'...\\n";
    \$pdo->exec("CREATE TABLE IF NOT EXISTS `oxidpwauser` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(255) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `is_main_admin` TINYINT(1) DEFAULT 0,
        `is_active` TINYINT(1) DEFAULT 1,
        `must_change_pwd` TINYINT(1) DEFAULT 0,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    echo "Erstelle Tabelle 'oxidpwaconfig'...\\n";
    \$pdo->exec("CREATE TABLE IF NOT EXISTS `oxidpwaconfig` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `config_key` VARCHAR(255) NOT NULL UNIQUE,
        `config_value` TEXT,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Admin User einfǬgen (mit dem vom Builder generierten Hash)
    \$stmt = \$pdo->prepare("SELECT COUNT(*) FROM `oxidpwauser` WHERE `username` = ?");
    \$stmt->execute(['$username']);
    if (\$stmt->fetchColumn() == 0) {
        \$insertUser = \$pdo->prepare("INSERT INTO `oxidpwauser` (`username`, `password_hash`, `is_main_admin`, `is_active`, `must_change_pwd`) VALUES (?, ?, 1, 1, 0)");
        // Hash ist fest einkompiliert, nicht Klartext!
        \$insertUser->execute(['$username', '$hash']);
        echo "=> User '$username' wurde erfolgreich angelegt.\\n";
    } else {
        echo "=> User '$username' existiert bereits.\\n";
    }

    \$defaultConfigs = [
        ['shop_db_host', 'localhost'],
        ['shop_db_user', 'root'],
        ['shop_db_pass', ''],
        ['shop_db_name', 'mwm-test'],
        ['shop_baselink', '']
    ];

    \$insertConfig = \$pdo->prepare("INSERT IGNORE INTO `oxidpwaconfig` (`config_key`, `config_value`) VALUES (?, ?)");
    foreach (\$defaultConfigs as \$conf) {
        \$insertConfig->execute(\$conf);
    }
    echo "=> Standard-Konfiguration (mwm-test) hinterlegt.\\n";

    echo "\\n=== Setup erfolgreich abgeschlossen! ===\\n";

} catch (PDOException \$e) {
    die("\\n[FEHLER] Datenbankfehler: " . \$e->getMessage() . "\\nBitte ueberpruefe config.php.");
}
PHP;

$bytes = file_put_contents(__DIR__ . '/database/install.php', $installScript);

if ($bytes !== false) {
    echo "Erfolg: 'database/install.php' wurde erfolgreich erstellt!\n";
    echo "Der Klartext deines Passwortes ist nirgends gespeichert.\n\n";
    echo "Schritte:\n";
    echo "1. Lade den Ordner 'oxid_pwa' auf deinen Server.\n";
    echo "2. Rufe im Browser auf: https://deinshop.de/oxid_pwa/database/install.php\n";
    echo "3. Lösche danach die Datei install.php vom Server.\n";
} else {
    echo "[Fehler] Konnte 'database/install.php' nicht speichern.\n";
}
