<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(['error' => 'Method not allowed'], 405);
}

$db = get_db();
$input = json_input();
$url = trim((string)($input['original_url'] ?? ''));
$custom = trim((string)($input['custom_code'] ?? ''));
$title = trim((string)($input['title'] ?? ''));

if ($url === '') {
    respond(['error' => 'กรุณากรอก URL ต้นทาง'], 422);
}

if (!preg_match('~^https?://~i', $url)) {
    $url = 'https://' . $url;
}

if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true)) {
    respond(['error' => 'รูปแบบ URL ไม่ถูกต้อง (ต้องเริ่มต้นด้วย http:// หรือ https://)'], 422);
}

if ($custom !== '' && !preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $custom)) {
    respond(['error' => 'Custom Alias ต้องเป็นตัวอักษร a-z, A-Z, 0-9, _ หรือ - ความยาว 3-32 ตัวอักษร'], 422);
}

$clientToken = get_client_token();

try {
    if ($title === '') {
        $host = parse_url($url, PHP_URL_HOST) ?: 'Web Link';
        $title = $host;
    }

    for ($i = 0; $i < 5; $i++) {
        $code = $custom !== '' ? $custom : bin2hex(random_bytes(4));
        try {
            // บันทึกข้อมูลลงตาราง urls
            $stmt = $db->prepare('INSERT INTO urls (client_token, original_url, short_code, title) VALUES (?, ?, ?, ?)');
            $stmt->execute([$clientToken !== '' ? $clientToken : null, $url, $code, $title]);
            
            $id = (int)$db->lastInsertId();
            respond([
                'id'             => $id,
                'display_id'     => 'U' . str_pad((string)$id, 4, '0', STR_PAD_LEFT),
                'short_code'     => $code,
                'original_url'   => $url,
                'title'          => $title,
                'click_count'    => 0,
                'created_at'     => date('Y-m-d H:i:s'),
                'last_clicked_at'=> null
            ], 201);
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23000') {
                if ($custom !== '') {
                    respond(['error' => 'Custom Alias "' . $custom . '" นี้ถูกใช้งานแล้ว กรุณาเลือกรหัสอื่น'], 409);
                }
                continue;
            }
            throw $e;
        }
    }
    respond(['error' => 'ไม่สามารถสร้าง Short Code ได้ กรุณาลองใหม่อีกครั้ง'], 500);
} catch (Throwable $e) {
    respond(['error' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()], 500);
}