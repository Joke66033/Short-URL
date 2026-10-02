<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    respond(['error' => 'Method not allowed'], 405);
}

$db = get_db();
try {
    $search = trim((string)($_GET['q'] ?? ''));
    $clientToken = get_client_token();
    
    $whereClauses = [];
    $params = [];

    if ($clientToken !== '') {
        $whereClauses[] = 'u.client_token = ?';
        $params[] = $clientToken;
    } else {
        $whereClauses[] = '(u.client_token IS NULL OR u.client_token = "")';
    }

    if ($search !== '') {
        $whereClauses[] = '(u.original_url LIKE ? OR u.short_code LIKE ? OR u.title LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    // ดึงข้อมูลตาราง urls ร่วมกับนับจำนวนคลิกจากตาราง clicks
    $sql = 'SELECT u.id, u.original_url, u.short_code, u.title, u.created_at, 
            COUNT(c.id) AS click_count, 
            MAX(c.clicked_at) AS last_clicked_at 
            FROM urls u 
            LEFT JOIN clicks c ON u.id = c.url_id ';

    if (!empty($whereClauses)) {
        $sql .= 'WHERE ' . implode(' AND ', $whereClauses) . ' ';
    }

    $sql .= 'GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $items = $stmt->fetchAll();
    // เพิ่ม display_id แบบ U0001, U0002...
    $items = array_map(function ($row) {
        $row['display_id'] = 'U' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT);
        return $row;
    }, $items);
    respond(['items' => $items]);
} catch (Throwable $e) {
    respond(['error' => 'ไม่สามารถดึงข้อมูลประวัติได้: ' . $e->getMessage()], 500);
}