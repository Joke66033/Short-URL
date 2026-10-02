-- ==========================================
-- Database: siripaporn_shortURL
-- Schema for 2 tables: urls, clicks
-- ==========================================

-- 1. Table: urls
CREATE TABLE IF NOT EXISTS `urls` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_token` VARCHAR(64) DEFAULT NULL COMMENT 'รหัสประจำเบราว์เซอร์ผู้สร้าง (Browser Session Token)',
  `original_url` TEXT NOT NULL COMMENT 'URL ต้นทาง',
  `short_code` VARCHAR(32) NOT NULL COMMENT 'รหัสสั้น (Unique)',
  `title` VARCHAR(255) DEFAULT NULL COMMENT 'ชื่อเรียกกำกับ URL',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้างลิงก์',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_urls_code` (`short_code`),
  INDEX `idx_urls_client_token` (`client_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: clicks (ตามคอลัมน์จริงใน phpMyAdmin)
CREATE TABLE IF NOT EXISTS `clicks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `url_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID ของ URL ที่ถูกคลิก (FK)',
  `clicked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่ถูกคลิกใช้งาน',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP ที่เข้าใช้งาน',
  `user_agent` TEXT DEFAULT NULL COMMENT 'เบราว์เซอร์ผู้ใช้',
  `device_type` VARCHAR(32) DEFAULT 'desktop' COMMENT 'ประเภทอุปกรณ์ (mobile/desktop)',
  `referer` TEXT DEFAULT NULL COMMENT 'แหล่งที่มาของลิงก์',
  PRIMARY KEY (`id`),
  INDEX `idx_clicks_url_id` (`url_id`),
  CONSTRAINT `fk_clicks_url` FOREIGN KEY (`url_id`) REFERENCES `urls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;