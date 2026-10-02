<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

$code = trim((string)($_GET['code'] ?? ''));

if (!preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $code)) {
    http_response_code(404);
    exit('ไม่พบลิงก์นี้');
}

$db = get_db();
try {
    // 1. ค้นหารายการ URL จากตาราง urls
    $stmt = $db->prepare('SELECT id, original_url FROM urls WHERE short_code = ?');
    $stmt->execute([$code]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        exit('ไม่พบลิงก์นี้');
    }

    // 2. ดึงข้อมูล Client IP, User Agent, Device Type และ Referer
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
    $ref = (string)($_SERVER['HTTP_REFERER'] ?? '');
    $device = preg_match('/(mobile|android|iphone|ipad)/i', $ua) ? 'mobile' : 'desktop';

    // 3. บันทึกข้อมูลการคลิกลงตาราง clicks ตรงตามคอลัมน์ในฐานข้อมูลจริง
    try {
        $logStmt = $db->prepare('INSERT INTO clicks (url_id, ip_address, user_agent, device_type, referer) VALUES (?, ?, ?, ?, ?)');
        $logStmt->execute([$row['id'], $ip, $ua, $device, $ref]);
    } catch (Throwable $e) {
        // Fallback กรณีตารางมีคอลัมน์ไม่ครบ
        $logStmt = $db->prepare('INSERT INTO clicks (url_id) VALUES (?)');
        $logStmt->execute([$row['id']]);
    }

    // 4. Redirect ไปยัง URL ต้นทาง
    header('Location: ' . $row['original_url'], true, 302);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    exit('เกิดข้อผิดพลาดในการเปลี่ยนหน้า');
}