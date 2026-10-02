# Short-URL — ระบบย่อลิงก์ Short URL และสร้าง QR Code

คู่มือขั้นตอนการติดตั้งและการรันโปรเจกต์ Short-URL (React + PHP PDO + MySQL)

---

## ⚡ วิธีการติดตั้งและการรันโปรเจกต์ (Installation & Running)

### 1. ตั้งค่าฐานข้อมูล (Database Setup)
1. สร้างฐานข้อมูล MySQL ชื่อ `short_url_db` ใน phpMyAdmin หรือ MySQL Client
2. นำเข้าไฟล์ SQL จาก [`database.sql`](file:///d:/short-url/database.sql) เพื่อสร้างตาราง `short_urls`

---

### 2. ตั้งค่า Backend (PHP Setup)
1. เปิดไฟล์ [`backend/config.php`](file:///d:/short-url/backend/config.php)
2. ปรับแก้ไขข้อมูลการเชื่อมต่อฐานข้อมูลให้ตรงกับเครื่องของคุณ:
   ```php
   $DB_HOST = 'localhost';
   $DB_NAME = 'short_url_db';
   $DB_USER = 'root';
   $DB_PASS = '';
   ```

---

### 3. ติดตั้งและรัน Frontend (React Vite)
1. เปิด Terminal และเข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies (ถ้ายังไม่ได้ติดตั้ง):
   ```bash
   npm install
   ```
3. รันคำสั่งเปิด Development Server:
   ```bash
   npm run dev
   ```
4. เปิดเว็บเบราว์เซอร์เข้าใช้งานที่: `http://localhost:5173`

> 💡 **หมายเหตุ**: หากไม่ได้เปิด PHP/MySQL ระบบมี **LocalStorage Fallback** สำรองอัตโนมัติ เพื่อให้ทดลองใช้งานฟังก์ชันย่อลิงก์ คัดลอก และสร้าง QR Code ได้ทันที

---

## 🚀 การ Build และนำขึ้นเซิร์ฟเวอร์ (Production Deployment)

1. สั่ง Build Production Bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. นำไฟล์จากโฟลเดอร์ `frontend/dist/` ไปวางที่ `public_html/` ของ Web Server (หรือโฟลเดอร์สำหรับแสดงผลเว็บ)
3. นำโฟลเดอร์ `backend/` ไปวางที่ `public_html/backend/`
4. ตรวจสอบให้แน่ใจว่าได้คัดลอกไฟล์ `.htaccess` ไปไว้ที่ Root Directory เพื่อรองรับ Single Page Application (SPA) Routing
