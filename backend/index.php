<?php
declare(strict_types=1);
$_GET['code'] = (string)($_GET['code'] ?? '');
require __DIR__ . '/api/redirect.php';