-- ============================================================
-- ADDITIONAL TABLES FOR VEXASTORE
-- Run this after the existing schema
-- ============================================================

-- 1. Users Table (for store visitors)
CREATE TABLE IF NOT EXISTS store_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,  -- NULL for Google OAuth users
    name VARCHAR(100) NOT NULL,
    google_id VARCHAR(100) NULL,
    is_verified TINYINT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. OTP Verification Codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) DEFAULT 'email_verification',
    expires_at DATETIME NOT NULL,
    is_used TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_code (otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Site Settings (UI/UX Customization)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(100) DEFAULT 'VexaStore',
    site_subtitle VARCHAR(255) DEFAULT 'The Official App Hub of VexaTrade Blockchain Ecosystem',
    primary_color VARCHAR(7) DEFAULT '#06b6d4',
    secondary_color VARCHAR(7) DEFAULT '#10b981',
    background_color VARCHAR(7) DEFAULT '#050812',
    font_family VARCHAR(100) DEFAULT 'Inter',
    custom_css TEXT,
    custom_header_html TEXT,
    custom_footer_html TEXT,
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO site_settings (id, site_title, site_subtitle, primary_color, secondary_color, background_color)
VALUES (1, 'VexaStore', 'The Official App Hub of VexaTrade Blockchain Ecosystem', '#06b6d4', '#10b981', '#050812')
ON DUPLICATE KEY UPDATE site_title=VALUES(site_title);

-- 4. News / Articles
CREATE TABLE IF NOT EXISTS news_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,  -- HTML content
    image_url VARCHAR(255),
    is_featured TINYINT DEFAULT 0,
    is_published TINYINT DEFAULT 1,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;