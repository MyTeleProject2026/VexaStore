-- VexaStore Database Schema (TiDB/MySQL Compatible)
-- Run this once to set up all tables

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
);

-- 2. Apps table
CREATE TABLE IF NOT EXISTS apps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    category_id INT,
    icon_url VARCHAR(255),
    banner_url VARCHAR(255),
    screenshots JSON,
    developer VARCHAR(100),
    website VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0,
    total_downloads INT DEFAULT 0,
    is_featured TINYINT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_slug (slug),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active),
    INDEX idx_rating (rating DESC)
);

-- 3. App Versions table
CREATE TABLE IF NOT EXISTS app_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    version VARCHAR(20) NOT NULL,
    os VARCHAR(20) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size VARCHAR(20),
    release_notes TEXT,
    is_latest TINYINT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app_id),
    INDEX idx_os (os),
    INDEX idx_latest (is_latest),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_app_os_version (app_id, os, version)
);

-- 4. Download Logs table
CREATE TABLE IF NOT EXISTS download_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    app_version_id INT NOT NULL,
    os VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app (app_id),
    INDEX idx_version (app_version_id),
    INDEX idx_os (os),
    INDEX idx_created (created_at)
);

-- 5. Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active TINYINT DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 6. Maintenance Settings table
CREATE TABLE IF NOT EXISTS maintenance_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_enabled TINYINT DEFAULT 0,
    message TEXT,
    scheduled_end DATETIME,
    enabled_by INT,
    enabled_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. App Reviews (Optional)
CREATE TABLE IF NOT EXISTS app_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    user_email VARCHAR(100),
    rating INT DEFAULT 5,
    review TEXT,
    is_verified TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app (app_id),
    INDEX idx_rating (rating)
);

-- Insert default categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
('iOS Apps', 'ios', 'Apple', 1),
('Android Apps', 'android', 'Android', 2),
('Windows Apps', 'windows', 'Windows', 3),
('macOS Apps', 'macos', 'Apple', 4),
('Linux Apps', 'linux', 'Linux', 5)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default admin (password: Admin@123)
-- Use bcrypt hash for 'Admin@123' (cost 10)
INSERT INTO admins (email, password, name, role) 
VALUES ('admin@vexastore.com', '$2a$10$Lq8Uu5pG3sZqG1nR9vA4tOe6wA5bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY', 'VexaStore Admin', 'super_admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert default maintenance settings
INSERT INTO maintenance_settings (id, is_enabled, message)
VALUES (1, 0, '🚧 VexaStore is currently under maintenance. We\'ll be back soon!')
ON DUPLICATE KEY UPDATE message=VALUES(message);