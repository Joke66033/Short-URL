<?php
declare(strict_types=1);

// จัดการ CORS เพื่อรองรับการทดสอบข้าม Domain / Port (เช่น Vite Dev Server 5173)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Token');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = 'localhost';
$DB_NAME = 'siripaporn_shortURL';
$DB_USER = 'siripaporn_shortURL';
$DB_PASS = 'k8sFgPGWWs2HxyNCLVzs';

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $error) {
    // เก็บความผิดพลาดของการเชื่อมต่อไว้แสดงเมื่อเรียก get_db()
    $pdo_error_msg = $error->getMessage();
    $pdo = null;
}

function get_db(): PDO {
    global $pdo, $pdo_error_msg;
    if (!$pdo) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        $msg = isset($pdo_error_msg) ? ' (' . $pdo_error_msg . ')' : '';
        echo json_encode(['error' => 'เชื่อมต่อฐานข้อมูล MySQL ไม่สำเร็จ กรุณาตรวจสอบการเปิดใช้งาน MySQL Server และการตั้งค่าใน backend/config.php' . $msg], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $pdo;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function get_client_token(): string {
    $token = $_SERVER['HTTP_X_CLIENT_TOKEN'] ?? $_GET['client_token'] ?? '';
    if (!$token) {
        $input = json_input();
        $token = (string)($input['client_token'] ?? '');
    }
    return trim((string)$token);
}

function respond(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}