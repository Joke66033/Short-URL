# 🔗 Shortly — ระบบย่อลิงก์ (Short URL) & QR Code

เว็บแอปพลิเคชันสำหรับย่อลิงก์ (Short URL) สร้าง QR Code สรุปสถิติการใช้งาน พัฒนาด้วย **React (Vite)**, **PHP (PDO)** และ **MySQL**

---

## 🌐 การเข้าใช้งานเว็บไซต์ (Live Website)

ปัจจุบันระบบเว็บแอปพลิเคชันได้ถูกนำขึ้นใช้งานบนโฮสติ้ง (Web Hosting) เรียบร้อยแล้ว สามารถเปิดเข้าใช้งานผ่านเบราว์เซอร์ได้ทันที:

👉 **ลิงก์เข้าใช้งาน:** [https://siripaporn.lnw.mn/short-url/](https://siripaporn.lnw.mn/short-url/)


---

## ✨ ฟีเจอร์หลัก (Features)

- ✂️ **ย่อลิงก์รวดเร็ว**: แปลง URL ยาวๆ ให้สั้นลง สะดวกต่อการแชร์
- ✏️ **กำหนดรหัสย่อเอง (Custom Alias)**: ตั้งชื่อรหัสสั้นตามต้องการได้
- 📲 **สร้าง QR Code**: สร้างและดาวน์โหลด QR Code สำหรับทุกลิงก์
- 📊 **เก็บสถิติการใช้งาน**: นับยอดการคลิก และจำแนกประเภทอุปกรณ์ (Mobile / Desktop)
- 💾 **LocalStorage Fallback**: รองรับการทดลองใช้งานแบบไม่มี Database อัตโนมัติ

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

ฐานข้อมูล MySQL ชื่อ **`siripaporn_shortURL`** ประกอบด้วย **2 ตารางหลัก**:

### 1. ตาราง `urls` (เก็บข้อมูลลิงก์ย่อ)
| คอลัมน์ (Column) | ชนิดข้อมูล (Data Type) | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED (PK, AUTO_INCREMENT)` | รหัสไอดีประจำลิงก์ |
| `client_token` | `VARCHAR(64)` | รหัสประจำเบราว์เซอร์ผู้สร้าง (Browser Session Token) |
| `original_url` | `TEXT` | URL ต้นทางที่ต้องการย่อ |
| `short_code` | `VARCHAR(32) (UNIQUE)` | รหัสสั้นสำหรับอ้างอิงย่อลิงก์ (เช่น `a1b2c3`) |
| `title` | `VARCHAR(255)` | ชื่อเรียกกำกับ URL / ชื่อหัวข้อเว็บ |
| `created_at` | `TIMESTAMP` | วันเวลาที่สร้างลิงก์ (Default: `CURRENT_TIMESTAMP`) |

### 2. ตาราง `clicks` (เก็บสถิติประวัติการคลิกลิงก์)
| คอลัมน์ (Column) | ชนิดข้อมูล (Data Type) | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED (PK, AUTO_INCREMENT)` | รหัสไอดีการคลิก |
| `url_id` | `BIGINT UNSIGNED (FK)` | รหัสอ้างอิงไปยัง `urls.id` (ON DELETE CASCADE) |
| `clicked_at` | `TIMESTAMP` | วันเวลาที่มีผู้กดเข้าชมลิงก์ |
| `ip_address` | `VARCHAR(45)` | IP Address ของผู้ใช้งาน |
| `user_agent` | `TEXT` | ข้อมูลเบราว์เซอร์และระบบปฏิบัติการของผู้ใช้ |
| `device_type` | `VARCHAR(32)` | ประเภทอุปกรณ์ (`mobile` หรือ `desktop`) |
| `referer` | `TEXT` | แหล่งที่มาของลิงก์ที่ถูกคลิกเข้ามา |

---


## 🚀 วิธีการติดตั้งและการรันโปรเจกต์ (Installation Guide)


### 1. การติดตั้งและรัน Frontend (React)
1. เปิด Terminal แล้วเข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. รันคำสั่งเปิดใช้งานโปรเจกต์:
   ```bash
   npm run dev
   ```
4. เปิดเว็บเบราว์เซอร์เข้าใช้งานที่: `http://localhost:5173`

---

### 2. การติดตั้งและตั้งค่า Backend (PHP + MySQL)

1. **นำเข้าฐานข้อมูล (MySQL):**
   - เปิด phpMyAdmin หรือ MySQL Client แล้วสร้างฐานข้อมูลชื่อ `siripaporn_shortURL`
   - นำเข้า (Import) ไฟล์ [`database.sql`](file:///d:/short-url/database.sql) เพื่อสร้างตาราง `urls` และ `clicks`

2. **ตั้งค่าการเชื่อมต่อฐานข้อมูล (PHP):**
   - เปิดไฟล์ [`backend/config.php`](file:///d:/short-url/backend/config.php) แล้วปรับเปลี่ยนข้อมูลให้ตรงกับเครื่องของคุณ:

     ```php
     $DB_HOST = 'localhost';
     $DB_NAME = 'siripaporn_shortURL';
     $DB_USER = 'root';
     $DB_PASS = '';
     ```

3. **เปิดใช้งาน PHP Server:**
   - **กรณีใช้ XAMPP / Laragon:** นำโฟลเดอร์โปรเจกต์ไปวางไว้ใน `htdocs` หรือ `www`
   - **กรณีใช้ PHP Built-in Server:** เปิด Terminal ในโฟลเดอร์หลักแล้วรัน:
     ```bash
     php -S localhost:8000 -t .
     ```

---

## 📦 การ Build และนำขึ้นใช้งานจริงบนโฮสติ้ง (Production Deployment)

1. **สั่ง Build ไฟล์ Production Bundle (Frontend):**
   ```bash
   cd frontend
   npm run build
   ```
2. ไฟล์ที่สร้างสำเร็จจะถูกเก็บไว้ที่โฟลเดอร์ `frontend/dist/`
3. **การอัปโหลดขึ้น Web Hosting (Server):**
   - นำไฟล์ทั้งหมดภายในโฟลเดอร์ `frontend/dist/` ไปวางไว้ที่โฟลเดอร์สำหรับแสดงผลเว็บของเซิร์ฟเวอร์ (เช่น `public_html/` หรือ `public_html/short-url/`)
   - นำโฟลเดอร์ `backend/` ไปวางคู่กันในเซิร์ฟเวอร์ (เช่น `public_html/short-url/backend/`)
   - ตรวจสอบให้แน่ใจว่าได้คัดลอกไฟล์ `.htaccess` ไปไว้ที่ Root Directory ของโดเมนเพื่อรองรับ SPA Routing และ PHP Redirect

