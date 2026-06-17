<?php
declare(strict_types=1);

// Security Headers
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: no-referrer");
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Content-Type: application/json; charset=utf-8");

// Session Cookie Params
require_once __DIR__ . '/../config.php';

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_name('__Host-pwa_sid');
session_start();

// Helper Functions
function json_response(array $data, int $status_code = 200): void {
    http_response_code($status_code);
    echo json_encode($data);
    exit;
}

function read_json_body(): array {
    $input = file_get_contents('php://input');
    if (!$input) {
        return [];
    }
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['ok' => false, 'error' => 'invalid_method'], 405);
    }
}

function require_auth(): void {
    if (empty($_SESSION['authenticated'])) {
        json_response(['ok' => false, 'error' => 'not_authenticated'], 401);
    }
}

function require_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_response(['ok' => false, 'error' => 'csrf_invalid'], 403);
    }
}

function create_csrf(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO("mysql:host=" . PWA_DB_HOST . ";dbname=" . PWA_DB_NAME . ";charset=utf8mb4", PWA_DB_USER, PWA_DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            json_response(['ok' => false, 'error' => 'db_connection_failed'], 500);
        }
    }
    return $pdo;
}

function get_oxid_pdo(): PDO {
    $pdo = get_pdo();
    $stmt = $pdo->query("SELECT config_key, config_value FROM oxidpwaconfig");
    $conf = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $conf[$row['config_key']] = $row['config_value'];
    }

    $host = $conf['shop_db_host'] ?? '127.0.0.1';
    $user = $conf['shop_db_user'] ?? 'root';
    $pass = $conf['shop_db_pass'] ?? '';
    $name = $conf['shop_db_name'] ?? 'mwm-test';

    try {
        $oxid_pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass);
        $oxid_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $oxid_pdo;
    } catch (PDOException $e) {
        json_response(['ok' => false, 'error' => 'oxid_db_connection_failed'], 500);
    }
}

$op = $_GET['op'] ?? '';

switch ($op) {
    case 'login':
        require_method('POST');
        $body = read_json_body();
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';
        
        $pdo = get_pdo();
        $stmt = $pdo->prepare("SELECT username, password_hash FROM oxidpwauser WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['authenticated'] = true;
            $_SESSION['user'] = ['name' => $user['username']];
            session_regenerate_id(true);
            json_response([
                'ok' => true,
                'csrf' => create_csrf(),
                'user' => $_SESSION['user']
            ]);
        }
        json_response(['ok' => false, 'error' => 'invalid_credentials'], 401);

    case 'session':
        require_method('GET');
        if (!empty($_SESSION['authenticated'])) {
            json_response([
                'ok' => true,
                'authenticated' => true,
                'csrf' => create_csrf(),
                'user' => $_SESSION['user']
            ]);
        }
        json_response(['ok' => false, 'authenticated' => false]);

    case 'logout':
        require_method('POST');
        require_auth();
        require_csrf();
        session_unset();
        session_destroy();
        setcookie('__Host-pwa_sid', '', [
            'expires' => 1,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        json_response(['ok' => true]);

    case 'config.get':
        require_method('GET');
        require_auth();
        $pdo = get_pdo();
        $stmt = $pdo->query("SELECT config_key, config_value FROM oxidpwaconfig");
        $config = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['config_key'] === 'shop_db_pass') {
                $config[$row['config_key']] = $row['config_value'] ? '********' : '';
            } else {
                $config[$row['config_key']] = $row['config_value'];
            }
        }
        json_response(['ok' => true, 'config' => $config]);

    case 'config.set':
        require_method('POST');
        require_auth();
        require_csrf();
        $body = read_json_body();
        $pdo = get_pdo();
        $stmt = $pdo->prepare("INSERT INTO oxidpwaconfig (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?");
        
        $allowed_keys = ['shop_db_host', 'shop_db_user', 'shop_db_pass', 'shop_db_name'];
        foreach ($allowed_keys as $key) {
            if (isset($body[$key])) {
                $val = $body[$key];
                if ($key === 'shop_db_pass' && $val === '********') {
                    continue;
                }
                $stmt->execute([$key, $val, $val]);
            }
        }
        json_response(['ok' => true]);

    case 'cache.prune':
        require_method('POST');
        require_auth();
        require_csrf();
        $pdo = get_pdo();
        $stmt = $pdo->prepare("DELETE FROM oxidpwaconfig WHERE config_key LIKE 'history_avg_%' OR config_key LIKE 'topseller_%'");
        $stmt->execute();
        json_response(['ok' => true]);

    case 'stats.get':
        require_method('GET');
        require_auth();
        $oxid = get_oxid_pdo();
        $pwa = get_pdo();

        $latestDate = $oxid->query("SELECT MAX(OXORDERDATE) FROM oxorder")->fetchColumn();
        if ($latestDate) {
            $year = (int)date('Y', strtotime($latestDate));
            $month = (int)date('m', strtotime($latestDate));
        } else {
            $year = (int)date('Y');
            $month = (int)date('m');
        }

        $stmtMonth = $oxid->prepare("
            SELECT COALESCE(SUM(OXTOTALORDERSUM - OXDELCOST), 0) as total_net 
            FROM oxorder 
            WHERE YEAR(OXORDERDATE) = ? 
              AND MONTH(OXORDERDATE) = ?
              AND OXSTORNO = 0
        ");
        $stmtMonth->execute([$year, $month]);
        $currentMonthTotal = (float)$stmtMonth->fetchColumn();

        $stmtYear = $oxid->prepare("
            SELECT MONTH(OXORDERDATE) as month, SUM(OXTOTALORDERSUM - OXDELCOST) as total_net
            FROM oxorder
            WHERE YEAR(OXORDERDATE) = ?
              AND OXSTORNO = 0
            GROUP BY MONTH(OXORDERDATE)
            ORDER BY month ASC
        ");
        $stmtYear->execute([$year]);
        $yearDataRaw = $stmtYear->fetchAll(PDO::FETCH_ASSOC);
        
        $monthlyData = array_fill(1, 12, 0);
        foreach ($yearDataRaw as $row) {
            $monthlyData[(int)$row['month']] = (float)$row['total_net'];
        }

        // Cache-Check für Historie
        $cacheKey = 'history_avg_' . $year;
        $stmtCache = $pwa->prepare("SELECT config_value FROM oxidpwaconfig WHERE config_key = ?");
        $stmtCache->execute([$cacheKey]);
        $cachedHistory = $stmtCache->fetchColumn();

        if ($cachedHistory) {
            $monthlyHistory = json_decode($cachedHistory, true);
        } else {
            $stmtHist = $oxid->prepare("
                SELECT month, AVG(yearly_sum) as avg_net
                FROM (
                    SELECT YEAR(OXORDERDATE) as yr, MONTH(OXORDERDATE) as month, SUM(OXTOTALORDERSUM - OXDELCOST) as yearly_sum
                    FROM oxorder
                    WHERE YEAR(OXORDERDATE) < ? AND OXSTORNO = 0
                    GROUP BY YEAR(OXORDERDATE), MONTH(OXORDERDATE)
                ) as subquery
                GROUP BY month
            ");
            $stmtHist->execute([$year]);
            $histRaw = $stmtHist->fetchAll(PDO::FETCH_ASSOC);

            $monthlyHistory = array_fill(1, 12, 0);
            foreach ($histRaw as $row) {
                $monthlyHistory[(int)$row['month']] = (float)$row['avg_net'];
            }
            $monthlyHistory = array_values($monthlyHistory);

            $jsonHistory = json_encode($monthlyHistory);
            $stmtSave = $pwa->prepare("INSERT INTO oxidpwaconfig (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?");
            $stmtSave->execute([$cacheKey, $jsonHistory, $jsonHistory]);
        }

        // --- NEW: Daily data & 30-day moving average ---
        $daysInMonth = (int)date('t', strtotime(sprintf('%04d-%02d-01', $year, $month)));
        $startDate = date('Y-m-d', strtotime(sprintf('%04d-%02d-01', $year, $month) . ' - 30 days'));
        $endDate = sprintf('%04d-%02d-%02d', $year, $month, $daysInMonth);

        $stmtDays = $oxid->prepare("
            SELECT DATE(OXORDERDATE) as day_date, SUM(OXTOTALORDERSUM - OXDELCOST) as daily_net
            FROM oxorder
            WHERE OXORDERDATE >= ? AND OXORDERDATE <= ?
              AND OXSTORNO = 0
            GROUP BY DATE(OXORDERDATE)
            ORDER BY day_date ASC
        ");
        $stmtDays->execute([$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        $daysRaw = $stmtDays->fetchAll(PDO::FETCH_ASSOC);
        
        $dailyDataMap = [];
        foreach ($daysRaw as $row) {
            $dailyDataMap[$row['day_date']] = (float)$row['daily_net'];
        }

        $monthDailyData = [];
        $monthMovingAvg = [];

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $currentDateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
            $monthDailyData[] = $dailyDataMap[$currentDateStr] ?? 0.0;
            
            $sum30 = 0.0;
            for ($i = 0; $i < 30; $i++) {
                $pastDateStr = date('Y-m-d', strtotime("$currentDateStr - $i days"));
                $sum30 += $dailyDataMap[$pastDateStr] ?? 0.0;
            }
            $monthMovingAvg[] = $sum30 / 30.0;
        }
        // --- END NEW ---

        json_response([
            'ok' => true,
            'current_month' => $currentMonthTotal,
            'year_data' => array_values($monthlyData),
            'history_data' => $monthlyHistory,
            'month_daily_data' => $monthDailyData,
            'month_moving_avg' => $monthMovingAvg,
            'current_month_num' => $month,
            'current_year' => $year
        ]);

    case 'stats.topseller':
        require_method('GET');
        require_auth();
        $period = $_GET['period'] ?? 'month';
        $oxid = get_oxid_pdo();

        $latestDate = $oxid->query("SELECT MAX(OXORDERDATE) FROM oxorder")->fetchColumn();
        if ($latestDate) {
            $year = (int)date('Y', strtotime($latestDate));
            $month = (int)date('m', strtotime($latestDate));
        } else {
            $year = (int)date('Y');
            $month = (int)date('m');
        }

        $where = "o.OXSTORNO = 0";
        $params = [];
        $cacheKey = null;

        if ($period === 'month') {
            $where .= " AND YEAR(o.OXORDERDATE) = ? AND MONTH(o.OXORDERDATE) = ?";
            $params = [$year, $month];
        } elseif ($period === 'year') {
            $where .= " AND YEAR(o.OXORDERDATE) = ?";
            $params = [$year];
        } elseif ($period === 'prev_year') {
            $where .= " AND YEAR(o.OXORDERDATE) = ?";
            $params = [$year - 1];
            $cacheKey = "topseller_v2_prev_year_" . ($year - 1);
        } elseif ($period === 'all_time') {
            // no additional where
            $cacheKey = "topseller_v2_all_time";
        } else {
            json_response(['ok' => false, 'error' => 'invalid_period'], 400);
        }

        $pwa = get_pdo();
        
        if ($cacheKey) {
            $stmtCache = $pwa->prepare("SELECT config_value FROM oxidpwaconfig WHERE config_key = ?");
            $stmtCache->execute([$cacheKey]);
            $cachedData = $stmtCache->fetchColumn();
            if ($cachedData) {
                $cachedArticles = json_decode($cachedData, true);
                
                $total_qty = 0;
                foreach ($cachedArticles as $a) {
                    $total_qty += (float)$a['qty'];
                }
                
                json_response([
                    'ok' => true, 
                    'period' => $period, 
                    'articles' => $cachedArticles,
                    'total_top10_qty' => $total_qty,
                    'cached' => true
                ]);
            }
        }

        $stmt = $oxid->prepare("
            SELECT 
                a.OXARTNUM as sku, 
                MAX(a.OXTITLE) as name, 
                SUM(a.OXAMOUNT) as qty, 
                SUM(a.OXPRICE) as revenue,
                MAX(a.OXPRICE / NULLIF(a.OXAMOUNT, 0)) as unit_price
            FROM oxorderarticles a
            JOIN oxorder o ON o.OXID = a.OXORDERID
            WHERE $where
            GROUP BY a.OXARTNUM
            ORDER BY qty DESC, revenue DESC
            LIMIT 10
        ");
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate total qty and total revenue for percentage bar calculation in frontend
        $total_qty = 0;
        foreach ($articles as &$a) {
            $a['qty'] = (float)$a['qty'];
            $a['revenue'] = (float)$a['revenue'];
            $a['unit_price'] = (float)$a['unit_price'];
            $total_qty += $a['qty'];
        }

        if ($cacheKey) {
            $jsonArticles = json_encode($articles);
            $stmtSave = $pwa->prepare("INSERT INTO oxidpwaconfig (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?");
            $stmtSave->execute([$cacheKey, $jsonArticles, $jsonArticles]);
        }

        json_response([
            'ok' => true, 
            'period' => $period, 
            'articles' => $articles,
            'total_top10_qty' => $total_qty,
            'cached' => false
        ]);

    case 'orders.new':
        require_method('GET');
        require_auth();
        $oxid = get_oxid_pdo();
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = 10;
        $offset = ($page - 1) * $limit;

        $countStmt = $oxid->query("SELECT COUNT(*) FROM oxorder");
        $total = (int)$countStmt->fetchColumn();

        $stmt = $oxid->prepare("
            SELECT 
                o.OXID as id, 
                o.OXORDERNR as order_nr, 
                o.OXORDERDATE as created_at, 
                TRIM(CONCAT(o.OXBILLFNAME, ' ', o.OXBILLLNAME)) as customer, 
                o.OXTOTALORDERSUM as total, 
                o.OXDELCOST as shipping, 
                o.OXTRANSSTATUS as status,
                o.OXPAID as paid,
                o.OXSTORNO as storno,
                o.OXSENDDATE as senddate,
                o.OXUSERID as user_id,
                u.OXCUSTNR as customer_nr
            FROM oxorder o 
            LEFT JOIN oxuser u ON o.OXUSERID = u.OXID
            ORDER BY o.OXORDERNR DESC 
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $artStmt = $oxid->prepare("SELECT OXARTNUM as sku, OXTITLE as name, OXAMOUNT as qty, OXPRICE as price FROM oxorderarticles WHERE OXORDERID = ?");
        
        foreach ($orders as &$o) {
            $artStmt->execute([$o['id']]);
            $o['items'] = $artStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        json_response([
            'ok' => true,
            'orders' => $orders,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ]);

    case 'order.search':
        require_method('GET');
        require_auth();
        $order_nr = $_GET['order_nr'] ?? '';
        if (empty($order_nr)) {
            json_response(['ok' => false, 'error' => 'missing_order_nr'], 400);
        }

        $oxid = get_oxid_pdo();
        $stmt = $oxid->prepare("
            SELECT 
                o.OXID as id, 
                o.OXORDERNR as order_nr, 
                o.OXORDERDATE as created_at, 
                TRIM(CONCAT(o.OXBILLFNAME, ' ', o.OXBILLLNAME)) as customer, 
                o.OXTOTALORDERSUM as total, 
                o.OXDELCOST as shipping, 
                o.OXTRANSSTATUS as status,
                o.OXPAID as paid,
                o.OXSTORNO as storno,
                o.OXSENDDATE as senddate,
                o.OXUSERID as user_id,
                u.OXCUSTNR as customer_nr
            FROM oxorder o 
            LEFT JOIN oxuser u ON o.OXUSERID = u.OXID
            WHERE o.OXORDERNR = ?
            LIMIT 1
        ");
        $stmt->execute([$order_nr]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            $artStmt = $oxid->prepare("SELECT OXARTNUM as sku, OXTITLE as name, OXAMOUNT as qty, OXPRICE as price FROM oxorderarticles WHERE OXORDERID = ?");
            $artStmt->execute([$order['id']]);
            $order['items'] = $artStmt->fetchAll(PDO::FETCH_ASSOC);
            json_response(['ok' => true, 'order' => $order]);
        }
        json_response(['ok' => false, 'error' => 'not_found'], 404);

    case 'orders.search_date':
        require_method('GET');
        require_auth();
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));

        if (empty($from) || empty($to)) {
            json_response(['ok' => false, 'error' => 'missing_dates'], 400);
        }

        $oxid = get_oxid_pdo();
        $stmt = $oxid->prepare("
            SELECT 
                o.OXID as id, 
                o.OXORDERNR as order_nr, 
                o.OXORDERDATE as created_at, 
                TRIM(CONCAT(o.OXBILLFNAME, ' ', o.OXBILLLNAME)) as customer, 
                o.OXTOTALORDERSUM as total, 
                o.OXDELCOST as shipping, 
                o.OXTRANSSTATUS as status,
                o.OXPAID as paid,
                o.OXSTORNO as storno,
                o.OXSENDDATE as senddate,
                o.OXUSERID as user_id,
                u.OXCUSTNR as customer_nr
            FROM oxorder o 
            LEFT JOIN oxuser u ON o.OXUSERID = u.OXID
            WHERE o.OXORDERDATE >= ? AND o.OXORDERDATE <= ?
            ORDER BY o.OXORDERDATE DESC 
            LIMIT ?
        ");
        
        $to_end_of_day = $to . ' 23:59:59';
        $stmt->bindValue(1, $from);
        $stmt->bindValue(2, $to_end_of_day);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $artStmt = $oxid->prepare("SELECT OXARTNUM as sku, OXTITLE as name, OXAMOUNT as qty, OXPRICE as price FROM oxorderarticles WHERE OXORDERID = ?");
        foreach ($orders as &$o) {
            $artStmt->execute([$o['id']]);
            $o['items'] = $artStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        json_response(['ok' => true, 'orders' => $orders]);

    case 'orders.by_customer':
        require_method('GET');
        require_auth();
        $user_id = $_GET['user_id'] ?? '';
        $limit = 50;

        if (empty($user_id)) {
            json_response(['ok' => false, 'error' => 'missing_user_id'], 400);
        }

        $oxid = get_oxid_pdo();
        $stmt = $oxid->prepare("
            SELECT 
                o.OXID as id, 
                o.OXORDERNR as order_nr, 
                o.OXORDERDATE as created_at, 
                TRIM(CONCAT(o.OXBILLFNAME, ' ', o.OXBILLLNAME)) as customer, 
                o.OXTOTALORDERSUM as total, 
                o.OXDELCOST as shipping, 
                o.OXTRANSSTATUS as status,
                o.OXPAID as paid,
                o.OXSTORNO as storno,
                o.OXSENDDATE as senddate,
                o.OXUSERID as user_id,
                u.OXCUSTNR as customer_nr
            FROM oxorder o 
            LEFT JOIN oxuser u ON o.OXUSERID = u.OXID
            WHERE o.OXUSERID = ?
            ORDER BY o.OXORDERDATE DESC 
            LIMIT ?
        ");
        
        $stmt->bindValue(1, $user_id);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $artStmt = $oxid->prepare("SELECT OXARTNUM as sku, OXTITLE as name, OXAMOUNT as qty, OXPRICE as price FROM oxorderarticles WHERE OXORDERID = ?");
        foreach ($orders as &$o) {
            $artStmt->execute([$o['id']]);
            $o['items'] = $artStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        json_response(['ok' => true, 'orders' => $orders]);

    case 'order.ship':
        require_method('POST');
        require_auth();
        require_csrf();
        $body = read_json_body();
        $id = $body['id'] ?? '';
        
        json_response([
            'ok' => true,
            'id' => $id,
            'status' => 'OK'
        ]);

    default:
        json_response(['ok' => false, 'error' => 'unknown_operation'], 404);
}
