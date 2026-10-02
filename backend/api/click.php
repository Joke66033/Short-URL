<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: POST, GET');
    respond(['error' => 'Method not allowed'], 405);
}

$db = get_db();
$input = json_input();
$code = trim((string)($input['short_code'] ?? $_GET['code'] ?? ''));

if ($code === '') {
    respond(['error' => 'กรุณาระบุ Short Code'], 400);
}

try {
    // 1. ค้นหา ID ของ URL จาก short_code
    $stmt = $db->prepare('SELECT id FROM urls WHERE short_code = ?');
    $stmt->execute([$code]);
    $urlRow = $stmt->fetch();

    if (!$urlRow) {
        respond(['error' => 'ไม่พบ Short Code นี้ในระบบ'], 404);
    }

    $urlId = (int)$urlRow['id'];

    // 2. ดึงข้อมูล Client metadata
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
    $ref = (string)($_SERVER['HTTP_REFERER'] ?? '');
    $device = preg_match('/(mobile|android|iphone|ipad)/i', $ua) ? 'mobile' : 'desktop';

    // 3. บันทึกข้อมูลการคลิกลงตาราง clicks
    $clickId = null;
    try {
        $logStmt = $db->prepare('INSERT INTO clicks (url_id, ip_address, user_agent, device_type, referer) VALUES (?, ?, ?, ?, ?)');
        $logStmt->execute([$urlId, $ip, $ua, $device, $ref]);
        $clickId = (int)$db->lastInsertId();
    } catch (Throwable $e) {
        $logStmt = $db->prepare('INSERT INTO clicks (url_id) VALUES (?)');
        $logStmt->execute([$urlId]);
        $clickId = (int)$db->lastInsertId();
    }

    // 4. นับจำนวนคลิกรวมล่าสุดสำหรับ URL นี้
    $countStmt = $db->prepare('SELECT COUNT(*) AS total FROM clicks WHERE url_id = ?');
    $countStmt->execute([$urlId]);
    $totalClicks = (int)($countStmt->fetch()['total'] ?? 0);

    respond([
        'success'      => true,
        'click_id'     => $clickId,
        'display_id'   => 'C' . str_pad((string)$clickId, 4, '0', STR_PAD_LEFT),
        'url_display_id' => 'U' . str_pad((string)$urlId, 4, '0', STR_PAD_LEFT),
        'short_code'   => $code,
        'click_count'  => $totalClicks
    ], 200);
} catch (Throwable $e) {
    respond(['error' => 'บันทึกการคลิกลงฐานข้อมูลไม่สำเร็จ: ' . $e->getMessage()], 500);
}
