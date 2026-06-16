<?php
declare(strict_types=1);

// =========================================================================
// GENERIERT DURCH build.php
// Diese Datei enthält den generierten Hash für den PWA-Nutzer 'stepan.kalina'.
// Nach erfolgreicher Installation auf dem Webserver sollte diese Datei 
// aus Sicherheitsgründen gelöscht werden!
// =========================================================================

require_once __DIR__ . '/../config.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO("mysql:host=" . PWA_DB_HOST . ";charset=utf8mb4", PWA_DB_USER, PWA_DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $dbname = PWA_DB_NAME;
    echo "PWA-Datenbank-Setup gestartet...\n";
    echo "Verbinde mit Server " . PWA_DB_HOST . "...\n";

    // Optionales Anlegen der DB (schlägt auf Shared Hosting oft fehl, das ist ok)
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "Datenbank '$dbname' geprueft/angelegt (OK).\n";
    } catch (PDOException $e) {
        echo "Info: CREATE DATABASE übersprungen (Shared Hosting Modus).\n";
    }

    $pdo->exec("USE `$dbname`");

    echo "Erstelle Tabelle 'oxidpwauser'...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS `oxidpwauser` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(255) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    echo "Erstelle Tabelle 'oxidpwaconfig'...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS `oxidpwaconfig` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `config_key` VARCHAR(255) NOT NULL UNIQUE,
        `config_value` TEXT,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Admin User einfügen (mit dem vom Builder generierten Hash)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `oxidpwauser` WHERE `username` = ?");
    $stmt->execute(['stepan.kalina']);
    if ($stmt->fetchColumn() == 0) {
        $insertUser = $pdo->prepare("INSERT INTO `oxidpwauser` (`username`, `password_hash`) VALUES (?, ?)");
        // Hash ist fest einkompiliert, nicht Klartext!
        $insertUser->execute(['stepan.kalina', '$2y$10$a5rQEf5oSJbvMwBj42OObO19CId1SgUinDlI1Oqlh/9GyBwQEw5rC']);
        echo "=> User 'stepan.kalina' wurde erfolgreich angelegt.\n";
    } else {
        echo "=> User 'stepan.kalina' existiert bereits.\n";
    }

    $defaultConfigs = [
        ['shop_db_host', 'localhost'],
        ['shop_db_user', 'root'],
        ['shop_db_pass', ''],
        ['shop_db_name', 'mwm-test']
    ];

    $insertConfig = $pdo->prepare("INSERT IGNORE INTO `oxidpwaconfig` (`config_key`, `config_value`) VALUES (?, ?)");
    foreach ($defaultConfigs as $conf) {
        $insertConfig->execute($conf);
    }
    echo "=> Standard-Konfiguration (mwm-test) hinterlegt.\n";

    echo "\n=== Setup erfolgreich abgeschlossen! ===\n";

} catch (PDOException $e) {
    die("\n[FEHLER] Datenbankfehler: " . $e->getMessage() . "\nBitte ueberpruefe config.php.");
}