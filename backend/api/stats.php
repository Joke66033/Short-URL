<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    respond(['error' => 'Method not allowed'], 405);
}

$db = get_db();
try {
    $clientToken = get_client_token();

    if ($clientToken !== '') {
        $urlsStmt = $db->prepare('SELECT COUNT(*) AS total_urls FROM urls WHERE client_token = ?');
        $urlsStmt->execute([$clientToken]);
        $totalUrls = (int)($urlsStmt->fetch()['total_urls'] ?? 0);

        $clicksStmt = $db->prepare('SELECT COUNT(*) AS total_clicks FROM clicks c JOIN urls u ON c.url_id = u.id WHERE u.client_token = ?');
        $clicksStmt->execute([$clientToken]);
        $totalClicks = (int)($clicksStmt->fetch()['total_clicks'] ?? 0);

        $topStmt = $db->prepare('SELECT u.id, u.original_url, u.short_code, u.title, COUNT(c.id) AS click_count FROM urls u JOIN clicks c ON u.id = c.url_id WHERE u.client_token = ? GROUP BY u.id ORDER BY click_count DESC LIMIT 1');
        $topStmt->execute([$clientToken]);
        $topLink = $topStmt->fetch() ?: null;
    } else {
        $urlsStmt = $db->query('SELECT COUNT(*) AS total_urls FROM urls');
        $totalUrls = (int)($urlsStmt->fetch()['total_urls'] ?? 0);

        $clicksStmt = $db->query('SELECT COUNT(*) AS total_clicks FROM clicks');
        $totalClicks = (int)($clicksStmt->fetch()['total_clicks'] ?? 0);

        $topStmt = $db->query('SELECT u.id, u.original_url, u.short_code, u.title, COUNT(c.id) AS click_count FROM urls u JOIN clicks c ON u.id = c.url_id GROUP BY u.id ORDER BY click_count DESC LIMIT 1');
        $topLink = $topStmt->fetch() ?: null;
    }

    if ($topLink) {
        $topLink['display_id'] = 'U' . str_pad((string)$topLink['id'], 4, '0', STR_PAD_LEFT);
    }

    respond([
        'total_urls'   => $totalUrls,
        'total_clicks' => $totalClicks,
        'top_link'     => $topLink
    ]);
} catch (Throwable $e) {
    respond(['error' => 'ดึงข้อมูลสถิติไม่สำเร็จ: ' . $e->getMessage()], 500);
}
