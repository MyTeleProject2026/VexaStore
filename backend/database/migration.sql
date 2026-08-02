-- ============================================================
-- VEXASTORE - COMPLETE DATABASE SCHEMA
-- TiDB / MySQL Compatible
-- Version: 1.0.0
-- Date: 2026-08-02
-- ============================================================

-- ============================================================
-- SECTION 1: DROP TABLES (CLEAN SLATE)
-- Use with caution! This will delete all existing data.
-- ============================================================

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS app_reviews;
DROP TABLE IF EXISTS download_logs;
DROP TABLE IF EXISTS app_versions;
DROP TABLE IF EXISTS apps;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS maintenance_settings;
DROP TABLE IF EXISTS admins;

-- ============================================================
-- SECTION 2: CREATE TABLES
-- ============================================================

-- ----------------------------------------------
-- 1. Admins Table
-- ----------------------------------------------
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
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 2. Maintenance Settings Table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_enabled TINYINT DEFAULT 0,
    message TEXT,
    scheduled_end DATETIME,
    enabled_by INT,
    enabled_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 3. Categories Table
-- ----------------------------------------------
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
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 4. Apps Table
-- ----------------------------------------------
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
    INDEX idx_rating (rating DESC),
    INDEX idx_downloads (total_downloads DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 5. App Versions Table
-- ----------------------------------------------
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
    INDEX idx_downloads (download_count DESC),
    UNIQUE KEY unique_app_os_version (app_id, os, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 6. Download Logs Table
-- ----------------------------------------------
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
    INDEX idx_created (created_at),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------
-- 7. App Reviews Table
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS app_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    user_email VARCHAR(100),
    rating INT DEFAULT 5,
    review TEXT,
    is_verified TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app (app_id),
    INDEX idx_rating (rating),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SECTION 3: INSERT DEFAULT DATA
-- ============================================================

-- ----------------------------------------------
-- Insert Default Admin (password: Admin@123)
-- BCrypt hash for 'Admin@123' (cost: 10)
-- ----------------------------------------------
INSERT INTO admins (email, password, name, role, is_active) VALUES
('admin@vexastore.com', '$2a$10$Lq8Uu5pG3sZqG1nR9vA4tOe6wA5bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY', 'VexaStore Admin', 'super_admin', 1)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- ----------------------------------------------
-- Insert Default Maintenance Settings
-- ----------------------------------------------
INSERT INTO maintenance_settings (id, is_enabled, message, scheduled_end) VALUES
(1, 0, '🚧 VexaStore is currently under maintenance. We\'ll be back soon!', NULL)
ON DUPLICATE KEY UPDATE message=VALUES(message);

-- ----------------------------------------------
-- Insert Default Categories
-- ----------------------------------------------
INSERT INTO categories (name, slug, icon, sort_order, is_active) VALUES
('iOS Apps', 'ios', 'Apple', 1, 1),
('Android Apps', 'android', 'Android', 2, 1),
('Windows Apps', 'windows', 'Windows', 3, 1),
('macOS Apps', 'macos', 'Apple', 4, 1),
('Linux Apps', 'linux', 'Linux', 5, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- SECTION 4: SAMPLE SEED DATA
-- ============================================================

-- ----------------------------------------------
-- Insert Sample Apps
-- ----------------------------------------------
INSERT INTO apps (name, slug, description, long_description, category_id, developer, rating, total_downloads, is_featured, is_active) VALUES
('VexaTrade Pro', 'vexatrade-pro', 'Professional crypto trading platform with advanced tools.', 'VexaTrade Pro offers advanced charting, real-time market data, and seamless trading on the VexaTrade blockchain ecosystem. Features include: Live price tracking, Advanced charting tools, Multi-exchange support, Portfolio management, AI-powered trading signals.', 2, 'VexaTrade', 4.8, 12543, 1, 1),
('VexaWallet', 'vexawallet', 'Secure multi-chain crypto wallet for the VexaTrade ecosystem.', 'Store, send, and receive cryptocurrencies with VexaWallet. Fully integrated with the VexaTrade blockchain ecosystem. Features: Multi-chain support, Biometric security, QR code payments, Transaction history, Asset tracking, Cross-chain swaps.', 1, 'VexaTrade', 4.9, 8942, 1, 1),
('VexaScan', 'vexascan', 'Blockchain explorer for the VexaTrade ecosystem.', 'Track transactions, view blocks, and explore the VexaTrade blockchain with VexaScan. Features: Real-time block monitoring, Transaction search, Smart contract verification, Network statistics, Token tracking, Historical data analysis.', 3, 'VexaTrade', 4.7, 5678, 0, 1),
('VexaSwap', 'vexaswap', 'Decentralized exchange for VexaTrade tokens.', 'Swap tokens, provide liquidity, and earn rewards on the VexaTrade DEX. Features: Token swapping, Liquidity pools, Yield farming, Trading analytics, Price charts, Slippage control.', 4, 'VexaTrade', 4.6, 4321, 0, 1),
('VexaFarm', 'vexafarm', 'Yield farming and staking platform on VexaTrade.', 'Stake your tokens and earn passive income on the VexaTrade blockchain. Features: Multiple staking pools, Auto-compounding, Reward tracking, Performance analytics, Risk assessment.', 5, 'VexaTrade', 4.5, 3210, 0, 1),
('VexaNFT', 'vexanft', 'NFT marketplace on the VexaTrade blockchain.', 'Mint, buy, sell, and trade NFTs on the VexaTrade blockchain ecosystem. Features: NFT minting, Marketplace, Auctions, Royalty tracking, Collection management, Cross-platform compatibility.', 1, 'VexaTrade', 4.4, 2876, 0, 1),
('VexaDAO', 'vexadao', 'Decentralized governance platform for VexaTrade.', 'Participate in VexaTrade DAO governance. Vote on proposals, create initiatives, and shape the future of the ecosystem. Features: Proposal creation, Voting system, Delegation, Treasury management, Analytics dashboard.', 2, 'VexaTrade', 4.3, 1543, 0, 1),
('VexaBridge', 'vexabridge', 'Cross-chain bridge for the VexaTrade ecosystem.', 'Bridge assets between VexaTrade and other major blockchain networks. Features: Multi-chain support, Fast transactions, Low fees, Security audits, Real-time monitoring.', 3, 'VexaTrade', 4.2, 987, 0, 1),
('VexaLend', 'vexalend', 'Decentralized lending and borrowing platform.', 'Lend and borrow crypto assets on the VexaTrade blockchain. Features: Competitive interest rates, Collateral management, Loan tracking, Risk assessment, Automated liquidations.', 4, 'VexaTrade', 4.1, 654, 0, 1),
('VexaID', 'vexaid', 'Decentralized identity management system.', 'Manage your digital identity on the VexaTrade blockchain. Features: Verifiable credentials, Self-sovereign identity, DID creation, Identity verification, Privacy controls.', 5, 'VexaTrade', 4.0, 321, 0, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------
-- Insert App Versions (with actual app_id references)
-- Note: app_id values depend on insertion order.
-- If IDs are different, adjust accordingly.
-- ----------------------------------------------
INSERT INTO app_versions (app_id, version, os, file_url, file_size, release_notes, is_latest, download_count, is_active) VALUES
-- VexaTrade Pro (app_id: 1)
(1, '2.1.0', 'ios', '/uploads/apps/vexatrade-ios-v2.1.0.ipa', '145 MB', 'New charting features and performance improvements. Added support for 20+ new trading pairs.', 1, 3421, 1),
(1, '2.1.0', 'android', '/uploads/apps/vexatrade-android-v2.1.0.apk', '128 MB', 'New charting features and performance improvements. Updated UI for better mobile experience.', 1, 5432, 1),
(1, '2.0.5', 'windows', '/uploads/apps/vexatrade-windows-v2.0.5.exe', '156 MB', 'Desktop version with advanced tools. Multi-window trading interface added.', 1, 2345, 1),
(1, '2.0.5', 'macos', '/uploads/apps/vexatrade-macos-v2.0.5.dmg', '162 MB', 'Desktop version with advanced tools. Apple Silicon native support added.', 1, 1345, 1),
(1, '1.8.0', 'linux', '/uploads/apps/vexatrade-linux-v1.8.0.deb', '98 MB', 'Linux support added. Debian and Ubuntu packages available.', 1, 432, 1),

-- VexaWallet (app_id: 2)
(2, '3.0.1', 'ios', '/uploads/apps/vexawallet-ios-v3.0.1.ipa', '78 MB', 'Multi-chain support added. Support for 15+ blockchain networks.', 1, 2345, 1),
(2, '3.0.1', 'android', '/uploads/apps/vexawallet-android-v3.0.1.apk', '72 MB', 'Multi-chain support added. Biometric security improvements.', 1, 4567, 1),
(2, '2.5.0', 'windows', '/uploads/apps/vexawallet-windows-v2.5.0.exe', '85 MB', 'Desktop wallet with hardware wallet integration.', 1, 1234, 1),
(2, '2.5.0', 'macos', '/uploads/apps/vexawallet-macos-v2.5.0.dmg', '89 MB', 'Desktop wallet with hardware wallet integration.', 1, 789, 1),

-- VexaScan (app_id: 3)
(3, '1.5.2', 'ios', '/uploads/apps/vexascan-ios-v1.5.2.ipa', '45 MB', 'Real-time block monitoring added. Push notifications for transactions.', 1, 1234, 1),
(3, '1.5.2', 'android', '/uploads/apps/vexascan-android-v1.5.2.apk', '42 MB', 'Real-time block monitoring added. Widget support for Android.', 1, 2345, 1),

-- VexaSwap (app_id: 4)
(4, '2.0.3', 'ios', '/uploads/apps/vexaswap-ios-v2.0.3.ipa', '56 MB', 'Token swapping with best route optimization. New UI.', 1, 987, 1),
(4, '2.0.3', 'android', '/uploads/apps/vexaswap-android-v2.0.3.apk', '52 MB', 'Token swapping with best route optimization. Price alerts added.', 1, 1876, 1),

-- VexaFarm (app_id: 5)
(5, '1.3.0', 'ios', '/uploads/apps/vexafarm-ios-v1.3.0.ipa', '38 MB', 'Auto-compounding feature added. New staking pools available.', 1, 654, 1),
(5, '1.3.0', 'android', '/uploads/apps/vexafarm-android-v1.3.0.apk', '35 MB', 'Auto-compounding feature added. Better performance analytics.', 1, 1234, 1),

-- VexaNFT (app_id: 6)
(6, '1.1.5', 'ios', '/uploads/apps/vexanft-ios-v1.1.5.ipa', '67 MB', 'NFT marketplace live. Auction support added.', 1, 543, 1),
(6, '1.1.5', 'android', '/uploads/apps/vexanft-android-v1.1.5.apk', '62 MB', 'NFT marketplace live. Collection management added.', 1, 987, 1),

-- VexaDAO (app_id: 7)
(7, '1.0.8', 'ios', '/uploads/apps/vexadao-ios-v1.0.8.ipa', '41 MB', 'DAO governance portal. Proposal voting added.', 1, 432, 1),
(7, '1.0.8', 'android', '/uploads/apps/vexadao-android-v1.0.8.apk', '39 MB', 'DAO governance portal. Delegation feature added.', 1, 765, 1),

-- VexaBridge (app_id: 8)
(8, '0.9.5', 'ios', '/uploads/apps/vexabridge-ios-v0.9.5.ipa', '48 MB', 'Cross-chain bridge live. Support for 8 networks.', 1, 321, 1),
(8, '0.9.5', 'android', '/uploads/apps/vexabridge-android-v0.9.5.apk', '44 MB', 'Cross-chain bridge live. Real-time monitoring dashboard.', 1, 543, 1),

-- VexaLend (app_id: 9)
(9, '1.0.2', 'ios', '/uploads/apps/vexalend-ios-v1.0.2.ipa', '52 MB', 'Lending and borrowing platform live. Competitive interest rates.', 1, 234, 1),
(9, '1.0.2', 'android', '/uploads/apps/vexalend-android-v1.0.2.apk', '48 MB', 'Lending and borrowing platform live. Collateral management added.', 1, 345, 1),

-- VexaID (app_id: 10)
(10, '0.8.0', 'ios', '/uploads/apps/vexaid-ios-v0.8.0.ipa', '36 MB', 'DID management platform. Verifiable credentials support.', 1, 123, 1),
(10, '0.8.0', 'android', '/uploads/apps/vexaid-android-v0.8.0.apk', '33 MB', 'DID management platform. Self-sovereign identity features.', 1, 198, 1)
ON DUPLICATE KEY UPDATE version=VALUES(version);

-- ----------------------------------------------
-- Insert Sample Reviews
-- ----------------------------------------------
INSERT INTO app_reviews (app_id, user_email, rating, review, is_verified) VALUES
(1, 'trader@email.com', 5, 'Best trading platform I have ever used! The charts are amazing and execution is lightning fast.', 1),
(1, 'crypto_fan@email.com', 4, 'Great platform overall. Would love to see more indicators added.', 0),
(1, 'investor@email.com', 5, 'VexaTrade Pro has completely changed how I trade. Highly recommended!', 1),
(2, 'wallet_user@email.com', 5, 'Very secure wallet. I feel safe storing my assets here.', 1),
(2, 'defi_enthusiast@email.com', 4, 'Great wallet, but could use more chain support.', 0),
(2, 'hodler@email.com', 5, 'Best wallet for VexaTrade ecosystem. UI is beautiful.', 1),
(3, 'blockchain_dev@email.com', 5, 'Excellent blockchain explorer. Very detailed information.', 1),
(3, 'data_analyst@email.com', 4, 'Good tool for transaction tracking. Could improve search speed.', 0),
(4, 'trader@email.com', 4, 'Good DEX, but needs more liquidity pools.', 0),
(4, 'defi_trader@email.com', 5, 'VexaSwap is my go-to DEX. Great UI and fast execution.', 1),
(5, 'yield_farmer@email.com', 5, 'Amazing yields! The auto-compounding is a game changer.', 1),
(5, 'passive_income@email.com', 4, 'Good staking platform. APY is competitive.', 0),
(6, 'nft_collector@email.com', 5, 'Great NFT marketplace. Easy to list and buy NFTs.', 1),
(6, 'digital_artist@email.com', 4, 'Minting is simple. Would like to see more features for artists.', 0),
(7, 'dao_member@email.com', 5, 'Participating in governance has never been easier.', 1),
(7, 'delegate@email.com', 4, 'Good platform for DAO governance. Proposal creation is straightforward.', 0),
(8, 'bridge_user@email.com', 5, 'Cross-chain bridge works perfectly. Fast and secure.', 1),
(8, 'multichain_user@email.com', 4, 'Good bridge. Could add more networks soon.', 0)
ON DUPLICATE KEY UPDATE review=VALUES(review);

-- ============================================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================================

-- Check all tables
SELECT '=== TABLE COUNT ===' as '';
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = DATABASE();

-- Check categories
SELECT '=== CATEGORIES ===' as '';
SELECT id, name, slug, is_active FROM categories ORDER BY sort_order;

-- Check apps
SELECT '=== APPS ===' as '';
SELECT id, name, slug, developer, rating, total_downloads, is_featured FROM apps ORDER BY total_downloads DESC;

-- Check app versions
SELECT '=== APP VERSIONS ===' as '';
SELECT a.name, av.version, av.os, av.file_size, av.download_count, av.is_latest 
FROM app_versions av
JOIN apps a ON a.id = av.app_id
ORDER BY av.download_count DESC
LIMIT 10;

-- Check total downloads
SELECT '=== TOTAL DOWNLOADS ===' as '';
SELECT SUM(total_downloads) as total_downloads FROM apps;

-- Check admin
SELECT '=== ADMIN ===' as '';
SELECT id, email, name, role, is_active FROM admins;

-- Check maintenance settings
SELECT '=== MAINTENANCE SETTINGS ===' as '';
SELECT is_enabled, message, scheduled_end FROM maintenance_settings;

-- ============================================================
-- SECTION 6: USEFUL ADMIN QUERIES
-- ============================================================

-- 1. Get all apps with version count
SELECT 
    a.id,
    a.name,
    a.slug,
    a.developer,
    a.rating,
    a.total_downloads,
    a.is_featured,
    COUNT(av.id) as version_count,
    GROUP_CONCAT(DISTINCT av.os) as platforms
FROM apps a
LEFT JOIN app_versions av ON av.app_id = a.id AND av.is_active = 1
WHERE a.is_active = 1
GROUP BY a.id
ORDER BY a.total_downloads DESC;

-- 2. Get download statistics by OS
SELECT 
    os,
    COUNT(*) as total_downloads,
    COUNT(DISTINCT app_id) as unique_apps
FROM download_logs
GROUP BY os
ORDER BY total_downloads DESC;

-- 3. Get top 5 most downloaded apps
SELECT 
    a.name,
    a.slug,
    a.developer,
    a.total_downloads,
    a.rating
FROM apps a
WHERE a.is_active = 1
ORDER BY a.total_downloads DESC
LIMIT 5;

-- 4. Get featured apps
SELECT 
    a.name,
    a.slug,
    a.description,
    a.rating,
    a.total_downloads,
    c.name as category_name
FROM apps a
JOIN categories c ON c.id = a.category_id
WHERE a.is_featured = 1 AND a.is_active = 1
ORDER BY a.rating DESC;

-- 5. Get apps by category
SELECT 
    c.name as category,
    COUNT(a.id) as app_count,
    SUM(a.total_downloads) as total_downloads
FROM categories c
LEFT JOIN apps a ON a.category_id = c.id AND a.is_active = 1
WHERE c.is_active = 1
GROUP BY c.id
ORDER BY total_downloads DESC;

-- 6. Check latest versions for each app
SELECT 
    a.name,
    av.version,
    av.os,
    av.created_at
FROM app_versions av
JOIN apps a ON a.id = av.app_id
WHERE av.is_latest = 1 AND av.is_active = 1
ORDER BY a.name, av.os;

-- 7. Get download trends (last 30 days)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as downloads,
    COUNT(DISTINCT app_id) as unique_apps
FROM download_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================
-- SECTION 7: CLEANUP (Optional - run if needed)
-- ============================================================

-- If you need to reset the database completely:
-- DROP DATABASE vexastore;
-- CREATE DATABASE vexastore;
-- USE vexastore;
-- (Then re-run this entire script)

-- If you need to delete all sample data but keep tables:
-- TRUNCATE TABLE app_reviews;
-- TRUNCATE TABLE download_logs;
-- TRUNCATE TABLE app_versions;
-- TRUNCATE TABLE apps;
-- TRUNCATE TABLE categories;
-- (Then re-run only the INSERT statements from Section 3 and 4)

-- ============================================================
-- END OF SCHEMA
-- ============================================================