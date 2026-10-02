<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: DELETE, POST');
    respond(['error' => 'Method not allowed'], 405);
}

$db = get_db();
$input = json_input();
$id = (int)($input['id'] ?? $_GET['id'] ?? 0);
$code = trim((string)($input['short_code'] ?? $_GET['code'] ?? ''));

if ($id <= 0 && $code === '') {
    respond(['error' => 'กรุณาระบุ ID หรือ Short Code ที่ต้องการลบ'], 422);
}

$clientToken = get_client_token();

try {
    if ($id > 0) {
        if ($clientToken !== '') {
            $stmt = $db->prepare('DELETE FROM urls WHERE id = ? AND client_token = ?');
            $stmt->execute([$id, $clientToken]);
        } else {
            $stmt = $db->prepare('DELETE FROM urls WHERE id = ?');
            $stmt->execute([$id]);
        }
    } else {
        if ($clientToken !== '') {
            $stmt = $db->prepare('DELETE FROM urls WHERE short_code = ? AND client_token = ?');
            $stmt->execute([$code, $clientToken]);
        } else {
            $stmt = $db->prepare('DELETE FROM urls WHERE short_code = ?');
            $stmt->execute([$code]);
        }
    }

    if ($stmt->rowCount() > 0) {
        respond(['message' => 'ลบข้อมูลสำเร็จ']);
    } else {
        respond(['error' => 'ไม่พบรายการที่ต้องการลบ'], 404);
    }
} catch (Throwable $e) {
    respond(['error' => 'ลบข้อมูลไม่สำเร็จ: ' . $e->getMessage()], 500);
}
