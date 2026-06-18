<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO("mysql:host=" . PWA_DB_HOST . ";charset=utf8mb4", PWA_DB_USER, PWA_DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $dbname = PWA_DB_NAME;
    echo "PWA-Datenbank-Update gestartet...\n";
    $pdo->exec("USE `$dbname`");

    // Add is_main_admin
    try {
        $pdo->exec("ALTER TABLE `oxidpwauser` ADD COLUMN `is_main_admin` TINYINT(1) DEFAULT 0 AFTER `password_hash`");
        echo "Spalte 'is_main_admin' hinzugefuegt.\n";
    } catch (PDOException $e) {
        if ($e->getCode() == '42S21') {
            echo "Spalte 'is_main_admin' existiert bereits.\n";
        } else {
            throw $e;
        }
    }

    // Add is_active
    try {
        $pdo->exec("ALTER TABLE `oxidpwauser` ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `is_main_admin`");
        echo "Spalte 'is_active' hinzugefuegt.\n";
    } catch (PDOException $e) {
        if ($e->getCode() == '42S21') {
            echo "Spalte 'is_active' existiert bereits.\n";
        } else {
            throw $e;
        }
    }

    // Add must_change_pwd
    try {
        $pdo->exec("ALTER TABLE `oxidpwauser` ADD COLUMN `must_change_pwd` TINYINT(1) DEFAULT 0 AFTER `is_active`");
        echo "Spalte 'must_change_pwd' hinzugefuegt.\n";
    } catch (PDOException $e) {
        if ($e->getCode() == '42S21') {
            echo "Spalte 'must_change_pwd' existiert bereits.\n";
        } else {
            throw $e;
        }
    }

    // Set first user (id=1) as main admin
    $pdo->exec("UPDATE `oxidpwauser` SET `is_main_admin` = 1, `is_active` = 1, `must_change_pwd` = 0 WHERE `id` = 1");
    echo "Erster Benutzer wurde als Haupt-Admin konfiguriert.\n";

    echo "\n=== Update erfolgreich abgeschlossen! ===\n";

} catch (PDOException $e) {
    die("\n[FEHLER] Datenbankfehler: " . $e->getMessage());
}
