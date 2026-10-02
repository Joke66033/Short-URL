# 📖 คู่มืออธิบายโค้ดระบบ Shortly (Short URL & QR Code) แบบบรรทัดต่อบรรทัด

---

# สารบัญไฟล์
1. [Backend: config.php](#1-backendconfigphp)
2. [Backend: api/create.php](#2-backendapicreatephp)
3. [Backend: api/redirect.php](#3-backendapiredirectphp)
4. [Backend: api/click.php](#4-backendapiclickphp)
5. [Backend: api/list.php](#5-backendapilistphp)
6. [Backend: api/stats.php](#6-backendapistatsphp)
7. [Backend: api/delete.php](#7-backendapideletephp)
8. [Database: database.sql](#8-databasedatabasesql)
9. [Frontend: services/api.js](#9-frontendservicesapijs)
10. [Frontend: components/form.jsx](#10-frontendcomponentsformjsx)
11. [Frontend: components/history.jsx](#11-frontendcomponentshistoryjsx)
12. [Frontend: components/qr-modal.jsx](#12-frontendcomponentsqr-modaljsx)

---

# 1. Backend: `config.php`
ไฟล์ตั้งค่าส่วนกลาง เชื่อมต่อฐานข้อมูล และจัดการฟังก์ชันพื้นฐาน

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **1-2** | `<?php`<br>`declare(strict_types=1);` | เปิดแท็ก PHP และบังคับใช้โหมดตรวจสอบ Data Type อย่างเข้มงวด ป้องกันข้อผิดพลาดของชนิดข้อมูล |
| **4-8** | `header('Access-Control-Allow-Origin: *');`<br>`header('Access-Control-Allow-Methods: ...');`<br>`header('Access-Control-Allow-Headers: ...');` | ตั้งค่า **CORS (Cross-Origin Resource Sharing)** อนุญาตให้หน้าเว็บจากโดเมนอื่นหรือพอร์ตอื่น (เช่น Vite Port 5173) สามารถเรียกใช้งาน API นี้ได้ |
| **9-12** | `if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { ... exit; }` | จัดการ Preflight Request ของ HTTP OPTIONS ซึ่งเบราว์เซอร์จะส่งมาก่อนเพื่อตรวจสอบสิทธิ์ หากเป็น OPTIONS ให้ตอบกลับ 200 แล้วจบการทำงานทันที |
| **14-17** | `$DB_HOST = 'localhost';`<br>`$DB_NAME = 'siripaporn_shortURL';`<br>`$DB_USER = 'siripaporn_shortURL';`<br>`$DB_PASS = '...';` | กำหนดตัวแปรสำหรับเชื่อมต่อฐานข้อมูล MySQL (Host, Database Name, Username, Password) |
| **19-24** | `$pdo = new PDO("mysql:host=...", ...);` | สร้าง Object การเชื่อมต่อด้วย **PDO (PHP Data Objects)** พร้อมตั้งค่า: ให้พ่น Error เป็น Exception, คืนค่าแบบ Associative Array, และปิด Emulate Prepares เพื่อความปลอดภัยจาก SQL Injection สูงสุด |
| **25-29** | `catch (PDOException $error) { ... $pdo = null; }` | หากเชื่อมต่อฐานข้อมูลไม่สำเร็จ ให้ดักจับ Error เก็บข้อความไว้ใน `$pdo_error_msg` และตั้งค่า `$pdo = null` |
| **31-41** | `function get_db(): PDO { ... }` | ฟังก์ชันส่วนกลางสำหรับเรียกใช้ฐานข้อมูล หากเชื่อมต่อไม่ติด จะส่ง HTTP 500 พร้อมข้อความแจ้งเตือนภาษาไทยในรูปแบบ JSON |
| **43-47** | `function json_input(): array { ... }` | ฟังก์ชันอ่านข้อมูล JSON ที่ส่งมาทาง Body (Request Payload) จากหน้าเว็บ React แล้วแปลงเป็น PHP Array |
| **49-54** | `function respond(array $data, int $status = 200): never { ... }` | ฟังก์ชันส่งคำตอบกลับไปยัง Frontend โดยตั้งค่า HTTP Status Code และส่งเนื้อหาเป็น JSON รองรับภาษาไทย (`JSON_UNESCAPED_UNICODE`) แล้วปิดโปรแกรมทันที (`exit`) |

---

# 2. Backend: `api/create.php`
API สำหรับรับ URL ต้นทางมาตรวจสอบและสร้าง Short URL

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **1-3** | `require_once __DIR__ . '/../config.php';` | นำเข้าไฟล์ตั้งค่าและการเชื่อมต่อฐานข้อมูล |
| **5-8** | `if ($_SERVER['REQUEST_METHOD'] !== 'POST') { ... }` | ตรวจสอบว่าคำขอต้องเป็น HTTP **POST** เท่านั้น หากไม่ใช่ให้ตอบกลับ 405 Method Not Allowed |
| **10-14** | `$db = get_db();`<br>`$input = json_input();`<br>`$url = trim(...);` | ดึงการเชื่อมต่อ DB และอ่านค่า `original_url`, `custom_code`, และ `title` จาก JSON ที่ผู้ใช้กรอก |
| **16-18** | `if ($url === '') { respond(['error' => '...'], 422); }` | ตรวจสอบว่าผู้ใช้กรอก URL มาหรือไม่ ถ้าว่างให้แจ้งเตือน Error 422 |
| **20-22** | `if (!preg_match('~^https?://~i', $url)) { $url = 'https://' . $url; }` | หากผู้ใช้ไม่ได้พิมพ์ `http://` หรือ `https://` นำหน้า ระบบจะเติม `https://` ให้อัตโนมัติ |
| **24-26** | `if (!filter_var($url, FILTER_VALIDATE_URL) ...)` | ตรวจสอบความถูกต้องของรูปแบบ URL ตามมาตรฐานอินเทอร์เน็ต |
| **28-30** | `if ($custom !== '' && !preg_match(...))` | หากมีการกำหนด Custom Alias เอง ให้ตรวจสอบว่าต้องเป็นตัวอักษร a-z, A-Z, 0-9, ขีดล่าง หรือขีดกลาง ความยาว 3-32 ตัวอักษร |
| **33-36** | `if ($title === '') { $title = parse_url($url, PHP_URL_HOST); }` | หากผู้ใช้ไม่ได้ระบุชื่อ Title ให้ดึงชื่อโดเมนของ URL มาเป็นชื่อหัวข้อให้อัตโนมัติ |
| **45-47** | `for ($i = 0; $i < 5; $i++) { $code = ... bin2hex(random_bytes(4));` | วนลูปสุ่มรหัสย่อ 8 หลัก (4 bytes สุ่มแล้วแปลงเป็นเลขฐานสิบหก) สูงสุด 5 ครั้ง เผื่อกรณีสุ่มได้รหัสซ้ำ |
| **49-50** | `$stmt = $db->prepare('INSERT INTO urls ...');`<br>`$stmt->execute([...]);` | สั่ง Prepared Statement บันทึกข้อมูลลิงก์ย่อลงตาราง `urls` |
| **52-62** | `$id = (int)$db->lastInsertId(); respond([...], 201);` | ดึง ID ล่าสุด แล้วแปลงเป็น `display_id` เช่น `U0001` และส่งผลลัพธ์กลับไปยัง Frontend ด้วยสถานะ 201 Created |
| **63-71** | `catch (PDOException $e) { if ($e->getCode() === '23000') ... }` | หากเกิด Duplicate Key (รหัสสั้นซ้ำ) ในกรณี Custom Alias ให้แจ้งผู้ใช้ แต่ถ้าเป็นแบบสุ่มจะวนลูปสุ่มใหม่ |

---

# 3. Backend: `api/redirect.php`
API ทำหน้าที่รับ Short Code แล้วส่งผู้ใช้ไปยัง URL ปลายทาง (HTTP 302)

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **1-15** | `require_once ...`<br>`$code = trim($_GET['code'] ?? '');` | นำเข้า config และรับรหัสสั้นจาก URL ที่ผู้ใช้คลิกเข้ามา |
| **17-26** | `$stmt = $db->prepare('SELECT id, original_url FROM urls WHERE short_code = ?');` | ค้นหาในตาราง `urls` ว่ารหัสสั้นนี้ตรงกับลิงก์ต้นฉบับใด หากไม่พบให้ส่ง 404 Not Found |
| **28-36** | `$ip = $_SERVER['REMOTE_ADDR'];`<br>`$device = preg_match('/mobile/i', $ua) ? 'mobile' : 'desktop';` | เก็บข้อมูล Client: ไอพีแอดเดรส (`REMOTE_ADDR`), ข้อมูลเบราว์เซอร์ (`HTTP_USER_AGENT`), แหล่งที่มา (`HTTP_REFERER`) และจำแนกอุปกรณ์ว่าเป็น mobile หรือ desktop |
| **38-43** | `$logStmt = $db->prepare('INSERT INTO clicks ... VALUES (?, ?, ?, ?, ?)');` | บันทึกประวัติการคลิกลงตาราง `clicks` เพื่อเก็บสถิติการใช้งาน |
| **45-47** | `header("Location: " . $urlRow['original_url'], true, 302); exit;` | **หัวใจสำคัญของการย่อลิงก์:** ส่งคำสั่ง HTTP Header 302 Found ไปยังเบราว์เซอร์ เพื่อส่งผู้ใช้ไปยังหน้าเว็บปลายทางทันที |

---

# 4. Backend: `api/list.php`
API ดึงประวัติรายการลิงก์และสถิติการคลิกทั้งหมด

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **5-8** | `if ($_SERVER['REQUEST_METHOD'] !== 'GET') ...` | บังคับให้รับคำขอด้วยเมธอด **GET** เท่านั้น |
| **12-19** | `$sql = 'SELECT u.*, COUNT(c.id) AS click_count ... FROM urls u LEFT JOIN clicks c ON u.id = c.url_id';` | ดึงข้อมูลลิงก์ย่อ และใช้ `LEFT JOIN` คู่กับ `COUNT(c.id)` เพื่อนับจำนวนคลิกจากตาราง `clicks` ของแต่ละลิงก์ |
| **21-27** | `if ($search !== '') { $sql .= 'WHERE u.original_url LIKE ? OR ...'; }` | หากมีการระบุคำค้นหา (`?q=...`) ให้กรองข้อมูลด้วยคำสั่ง `LIKE` |
| **28-30** | `$sql .= 'GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500';` | จัดกลุ่มตาม ID ของลิงก์ เรียงลำดับจากสร้างล่าสุดไปเก่าสุด และจำกัด 500 รายการ |
| **34-37** | `$row['display_id'] = 'U' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT);` | วนลูปแปลง ID ตัวเลขให้กลายเป็นรูปแบบทางการ เช่น `U0001`, `U0002` |
| **38** | `respond(['items' => $items]);` | ส่งรายการประวัติทั้งหมดกลับไปให้ Frontend ในรูปแบบ JSON |

---

# 5. Backend: `api/stats.php`
API สรุปข้อมูลภาพรวมสำหรับแสดงบนการ์ด Dashboard

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **12-14** | `SELECT COUNT(*) AS total_urls FROM urls;` | นับจำนวนลิงก์ย่อทั้งหมดที่สร้างในระบบ |
| **15-17** | `SELECT COUNT(*) AS total_clicks FROM clicks;` | นับยอดจำนวนการคลิกเข้าชมทั้งหมดจากตาราง `clicks` |
| **18-22** | `SELECT ... COUNT(c.id) AS click_count FROM urls u JOIN clicks c ... ORDER BY click_count DESC LIMIT 1;` | ค้นหาลิงก์ที่ได้รับความนิยมสูงสุดอันดับ 1 (Top Link) ที่ถูกคลิกมากที่สุด พร้อมแปลง ID เป็นรูปแบบ `U0001` |
| **23-25** | `respond(['total_urls' => ..., 'total_clicks' => ..., 'top_link' => ...]);` | ส่งค่าสถิติทั้ง 3 ส่วนกลับไปแสดงผลบน Dashboard |

---

# 6. Backend: `api/delete.php`
API ลบข้อมูล Short URL

| บรรทัด | โค้ด | คำอธิบาย |
| :---: | :--- | :--- |
| **12-14** | `$id = (int)...; $code = trim(...);` | รับค่า ID หรือ Short Code ที่ต้องการลบ |
| **21-26** | `DELETE FROM urls WHERE id = ?;` | สั่งลบข้อมูลออกจากตาราง `urls` (และตาราง `clicks` ที่เชื่อม FK แบบ `CASCADE` จะถูกลบตามอัตโนมัติ) |
| **28-32** | `if ($stmt->rowCount() > 0) ...` | ตรวจสอบว่าลบสำเร็จหรือไม่ แล้วส่งผลลัพธ์กลับ |

---

# 7. Frontend: `src/services/api.js`
ศูนย์กลางการเชื่อมต่อและดึงข้อมูลระหว่างหน้าเว็บ React กับ Backend PHP

| ส่วนของโค้ด | หน้าที่และการทำงาน |
| :--- | :--- |
| `API_BASE` | กำหนด URL ฐานของ Backend API (ดึงจาก `.env` หรือใช้ Default `/short-url/backend/api`) |
| `createShortUrl(originalUrl, customCode, title)` | ส่งคำสั่ง `fetch()` แบบ POST พร้อม JSON Payload ไปยัง `create.php` เพื่อสร้างลิงก์ย่อ |
| `fetchHistory(searchQuery)` | ส่งคำขอแบบ GET ไปยัง `list.php` เพื่อขอรายการประวัติลิงก์ทั้งหมด |
| `fetchStats()` | ส่งคำขอแบบ GET ไปยัง `stats.php` เพื่อดึงข้อมูลสถิติภาพรวม |
| `deleteShortUrl(id, code)` | ส่งคำขอแบบ DELETE ไปยัง `delete.php` เพื่อสั่งลบลิงก์ |
| `getFullShortUrl(shortCode)` | ฟังก์ชันคำนวณนำ Host โดเมนปัจจุบันมาต่อกับ Short Code เพื่อให้ได้ URL ย่อฉบับเต็ม |
| **LocalStorage Fallback** | ระบบจำลองข้อมูลในกรณีที่ Backend หรือ MySQL หลุด เพื่อให้หน้าเว็บยังทำงานและทดสอบฟังก์ชันต่างๆ ได้ต่อเนื่องโดยไม่ขึ้นหน้าต่างพัง |

---

# 8. Frontend: `src/components/form.jsx`
คอมโพเนนต์ฟอร์มสำหรับย่อลิงก์และแสดงผลลัพธ์

| บรรทัด / ฟังก์ชัน | หน้าที่และการทำงาน |
| :--- | :--- |
| `useState(...)` | สร้าง State เก็บค่า URL ที่กำลังพิมพ์ (`url`), สถานะโหลด (`loading`), ผลลัพธ์ที่ได้ (`result`), และสถานะการคัดลอก (`copied`) |
| `handleSubmit` | ฟังก์ชันดักจับตอนกดปุ่ม "ย่อลิงก์" ทำการตรวจสอบว่ากรอกหรือไม่ แล้วเรียกใช้ `createShortUrl()` จาก api.js |
| `handleCopyResult` | ใช้คำสั่ง `navigator.clipboard.writeText()` คัดลอก Short URL ลงในคลิปบอร์ดของผู้ใช้ พร้อมแสดงข้อความเตือน |
| `<form onSubmit={handleSubmit}>` | ฟอร์ม Input สีขาวสไตล์มินิมอล มีไอคอนลิงก์ และปุ่มกด Submit ที่เปลี่ยนข้อความเป็น "กำลังสร้าง..." ขณะทำงาน |
| `result-main` (การ์ดผลลัพธ์) | จัดวาง Layout 2 ชั้น: **ชั้นบน** แสดง Short URL และปุ่ม Action 3 ปุ่ม, **ชั้นล่าง** แสดง `ปลายทาง: ...` แบบกว้างเต็ม 100% พร้อม `wordBreak: 'break-all'` ป้องกันข้อความยาวทะลุกรอบ |

---

# 9. Frontend: `src/components/qr-modal.jsx`
คอมโพเนนต์ป๊อปอัปแสดงและดาวน์โหลดภาพ QR Code

| ส่วนของโค้ด | หน้าที่และการทำงาน |
| :--- | :--- |
| `<QRCodeSVG ... />` | เรนเดอร์รหัสย่อ Short URL ออกมาเป็นภาพกราฟิกแบบ **SVG** ที่คมชัดทุกความละเอียด |
| `handleDownload` | แปลงกราฟิก SVG ให้กลายเป็น Canvas แล้วแปลงเป็น Data URL ของภาพ `.PNG` จากนั้นจำลองการคลิกแท็ก `<a>` เพื่อดาวน์โหลดไฟล์ภาพ QR Code ลงเครื่องของผู้ใช้งานทันที |

---

# 10. Frontend: `src/components/history.jsx`
คอมโพเนนต์ตารางประวัติลิงก์และระบบค้นหา

| ส่วนของโค้ด | หน้าที่และการทำงาน |
| :--- | :--- |
| ช่อง Search Box | รับ Keyword ที่ผู้ใช้พิมพ์ แล้วเรียกฟังก์ชันค้นหาประวัติแบบ Real-time |
| ตาราง `<table>` | วนลูปแสดงข้อมูล: ID (`display_id`), ชื่อเว็บ/หัวข้อ, URL ต้นทางตัวเต็ม, Short URL ที่คลิกได้, จำนวนยอดคลิก (`click_count`), และวันที่สร้าง |
| ปุ่ม Action ในตาราง | มีปุ่มเปิด QR Code, ปุ่มคัดลอกลิงก์, และปุ่มรูปถังขยะสำหรับลบรายการ |
