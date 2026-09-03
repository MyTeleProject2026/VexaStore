// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { testConnection, pool } = require('./config/database');

const appRoutes = require('./routes/apps');
const downloadRoutes = require('./routes/downloads');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const vexaAccountSsoRoutes = require('./routes/vexaAccountSso');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const maintenanceRoutes = require('./routes/maintenance');
const settingsRoutes = require('./routes/settings');
const releaseVersionRoutes = require('./routes/releaseVersions');

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

const uploadDirs = [path.join(__dirname, '../uploads/apps'), path.join(__dirname, '../uploads/images')];
for (const dir of uploadDirs) { if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`✅ Created upload directory: ${dir}`); } }

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, crossOriginOpenerPolicy: { policy: 'unsafe-none' } }));
const allowedOrigins = [process.env.FRONTEND_USER_URL || 'http://localhost:5173',process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174','http://localhost:5173','http://localhost:5174','http://localhost:3000','https://vexastore.onrender.com','https://vexastore.2bd.net','https://www.vexastore.2bd.net','https://vexastore-admin.onrender.com','https://admin-vexatrade-manage.onrender.com','https://vexatrade-admin-n36m.onrender.com','https://admin.vexatrade-v.2bd.net','https://vexatrade-6nhs.onrender.com','https://www.vexatrade-v.2bd.net','https://learn-vexatrade.onrender.com','https://vexatrade.onrender.com','https://vexatrade-admin.onrender.com','https://api-vexaaccount.onrender.com','https://api-vexastore.onrender.com','https://vexatrade-5ycu.onrender.com','https://vexatrade-ecosystem-api.onrender.com','https://vexatrade-server.onrender.com'];
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') callback(null, true); else { console.warn(`⚠️ CORS blocked: ${origin}`); callback(null, true); } }, credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'], allowedHeaders: ['Origin','X-Requested-With','Content-Type','Accept','Authorization','X-API-Key'] }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests, please try again later.' }, skip: (req) => req.path === '/api/health' || req.path === '/api/admin/login' });
app.use('/api/', limiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use((req, res, next) => { const start = Date.now(); res.on('finish', () => { const duration = Date.now() - start; const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`; if (res.statusCode >= 400) console.error(`❌ ${log}`); else console.log(`✅ ${log}`); }); next(); });

app.get('/api/health', (req, res) => res.json({ success: true, message: 'VexaStore API is running', timestamp: new Date().toISOString(), version: '2.2.0', environment: process.env.NODE_ENV || 'development' }));
app.get('/', (req, res) => res.json({ success: true, message: '🚀 VexaStore API is running', version: '2.2.0', status: 'online', timestamp: new Date().toISOString(), documentation: { base_url: 'https://api-vexastore.onrender.com', api: '/api', health: '/api/health' } }));

app.use('/api/apps', appRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/vexaaccount', vexaAccountSsoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/release-versions', releaseVersionRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.get('/api', (req, res) => res.json({ success: true, message: 'VexaStore API', endpoints: { sso: ['/api/auth/vexaaccount/login','/api/auth/vexaaccount/start','/api/auth/vexaaccount/callback','/api/auth/vexaaccount/config-check'], release_management: ['/api/admin/release-versions'] } }));
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => { console.error('❌ Error:', err.message); console.error('Stack:', err.stack); if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token. Please log in again.' }); if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Duplicate entry. This record already exists.' }); if (err.code === 'ER_NO_REFERENCED_ROW') return res.status(400).json({ success: false, message: 'Invalid reference. The referenced record does not exist.' }); const status = err.status || 500; res.status(status).json({ success: false, message: err.message || 'Internal server error', ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) }); });

setInterval(async () => { try { const connection = await pool.getConnection(); const [result] = await connection.query(`DELETE FROM store_users WHERE is_verified = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`); connection.release(); if (result.affectedRows > 0) console.log(`🧹 Cleaned up ${result.affectedRows} unverified users`); } catch (error) { console.error('❌ Cleanup error:', error.message); } }, 60 * 60 * 1000);
setInterval(async () => { try { const connection = await pool.getConnection(); const [result] = await connection.query(`DELETE FROM otp_codes WHERE expires_at < NOW() OR is_used = 1`); connection.release(); if (result.affectedRows > 0) console.log(`🧹 Cleaned up ${result.affectedRows} expired OTPs`); } catch (error) { console.error('❌ OTP cleanup error:', error.message); } }, 30 * 60 * 1000);

let server;
const gracefulShutdown = async (signal) => { console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`); try { await pool.end(); console.log('✅ Database connections closed'); if (server) server.close(() => { console.log('✅ Server closed'); process.exit(0); }); else process.exit(0); } catch (error) { console.error('❌ Error during shutdown:', error); process.exit(1); } };
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function ensureReleaseMetadataSchema() {
  const statements = [
    `ALTER TABLE app_versions ADD COLUMN sha256 VARCHAR(64) NULL`,
    `ALTER TABLE app_versions ADD COLUMN package_name VARCHAR(255) NULL`,
    `ALTER TABLE app_versions ADD COLUMN version_code BIGINT NULL`,
    `ALTER TABLE app_versions ADD COLUMN minimum_sdk INT NULL`,
    `ALTER TABLE app_versions ADD COLUMN signing_certificate_sha256 VARCHAR(64) NULL`,
    `ALTER TABLE app_versions ADD COLUMN release_status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED'`
  ];
  for (const statement of statements) {
    try { await pool.query(statement); } catch (error) {
      if (!String(error.message || '').includes('Duplicate column') && error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
}

async function startServer() {
  console.log('🚀 Starting VexaStore API...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  const dbConnected = await testConnection();
  if (!dbConnected) { console.error('❌ Database connection failed. Exiting...'); process.exit(1); }
  try {
    await ensureReleaseMetadataSchema();
    await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (id INT PRIMARY KEY AUTO_INCREMENT,email VARCHAR(255) UNIQUE NOT NULL,password VARCHAR(255) NOT NULL,name VARCHAR(255),role ENUM('admin', 'super_admin') DEFAULT 'admin',is_active BOOLEAN DEFAULT TRUE,last_login DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com'; const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const [adminRows] = await pool.query('SELECT id FROM admin_users WHERE email = ?', [adminEmail.toLowerCase()]);
    if (adminRows.length === 0) { const bcrypt = require('bcryptjs'); const hashed = await bcrypt.hash(adminPassword, 10); await pool.query(`INSERT INTO admin_users (email, password, name, role) VALUES (?, ?, 'Administrator', 'super_admin')`, [adminEmail.toLowerCase(), hashed]); console.log(`✅ Default admin created: ${adminEmail}`); }
  } catch (error) { console.warn('⚠️ Startup database setup warning:', error.message); }
  server = app.listen(PORT, () => { console.log(`\n🚀 VexaStore API running on port ${PORT}`); console.log(`📱 Frontend User: ${process.env.FRONTEND_USER_URL || 'http://localhost:5173'}`); console.log(`⚙️ Frontend Admin: ${process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'}`); console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`); console.log(`\n📋 All endpoints are ready!\n`); });
  return app;
}
module.exports = { app, startServer };
if (require.main === module) startServer().catch(error => { console.error('❌ Failed to start VexaStore API:', error); process.exit(1); });
