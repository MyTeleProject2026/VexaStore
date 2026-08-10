// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { testConnection, pool } = require('./config/database');

// ─── ROUTES ──────────────────────────────────────────────────────────
const appRoutes = require('./routes/apps');
const downloadRoutes = require('./routes/downloads');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const maintenanceRoutes = require('./routes/maintenance');
const settingsRoutes = require('./routes/settings');

// ─── INITIALIZE APP ──────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── TRUST PROXY ─────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── ENSURE UPLOAD DIRECTORIES ──────────────────────────────────────
const uploadDirs = [
  path.join(__dirname, '../uploads/apps'),
  path.join(__dirname, '../uploads/images')
];

for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
}

// ─── MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

const allowedOrigins = [
  process.env.FRONTEND_USER_URL || 'http://localhost:5173',
  process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://vexastore.onrender.com',
  'https://vexastore.2bd.net'',
  'https://www.vexastore.2bd.net',
  'https://vexastore-admin.onrender.com',
  'https://admin-vexatrade-manage.onrender.com',
  'https://vexatrade-admin-n36m.onrender.com',
  'https://admin.vexatrade-v.2bd.net',
  'https://vexatrade-6nhs.onrender.com',
  'https://www.vexatrade-v.2bd.net',
  'https://learn-vexatrade.onrender.com',
  'https://vexatrade.onrender.com',
  'https://vexatrade-admin.onrender.com',
  'https://api-vexaaccount.onrender.com',
  'https://api-vexastore.onrender.com',
  'https://vexatrade-5ycu.onrender.com',
  'https://vexatrade-ecosystem-api.onrender.com',
  'https://vexatrade-server.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-API-Key']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/health' || req.path === '/api/admin/login'
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── REQUEST LOGGING ──────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    if (res.statusCode >= 400) {
      console.error(`❌ ${log}`);
    } else {
      console.log(`✅ ${log}`);
    }
  });
  next();
});

// ─── API ROUTES ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VexaStore API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});


// ─── ROOT ENDPOINT ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 VexaStore API is running',
    version: '2.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    documentation: {
      base_url: 'https://api-vexastore.onrender.com',
      api: '/api',
      health: '/api/health',
      endpoints: {
        public: [
          { method: 'GET', path: '/api/apps', description: 'List all apps' },
          { method: 'GET', path: '/api/apps/:slug', description: 'Get app by slug' },
          { method: 'GET', path: '/api/apps/featured', description: 'Get featured apps' },
          { method: 'GET', path: '/api/categories', description: 'List categories' },
          { method: 'POST', path: '/api/auth/login', description: 'User login' },
          { method: 'POST', path: '/api/auth/register', description: 'User register' },
          { method: 'POST', path: '/api/auth/verify-otp', description: 'Verify OTP' },
          { method: 'POST', path: '/api/auth/resend-otp', description: 'Resend OTP' },
          { method: 'POST', path: '/api/auth/forgot-password', description: 'Forgot password' },
          { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password' },
          { method: 'POST', path: '/api/downloads/track', description: 'Track download' },
        ],
        admin: [
          { method: 'POST', path: '/api/admin/login', description: 'Admin login' },
          { method: 'GET', path: '/api/admin/verify', description: 'Verify admin token' },
          { method: 'GET', path: '/api/admin/apps', description: 'List apps (admin)' },
          { method: 'POST', path: '/api/admin/apps', description: 'Create app' },
          { method: 'PUT', path: '/api/admin/apps/:id', description: 'Update app' },
          { method: 'DELETE', path: '/api/admin/apps/:id', description: 'Delete app' },
          { method: 'POST', path: '/api/admin/versions', description: 'Add version' },
          { method: 'DELETE', path: '/api/admin/versions/:id', description: 'Delete version' },
          { method: 'GET', path: '/api/admin/categories', description: 'List categories (admin)' },
          { method: 'POST', path: '/api/admin/categories', description: 'Create category' },
          { method: 'PUT', path: '/api/admin/categories/:id', description: 'Update category' },
          { method: 'DELETE', path: '/api/admin/categories/:id', description: 'Delete category' },
          { method: 'GET', path: '/api/admin/news', description: 'List news' },
          { method: 'POST', path: '/api/admin/news', description: 'Create news' },
          { method: 'PUT', path: '/api/admin/news/:id', description: 'Update news' },
          { method: 'DELETE', path: '/api/admin/news/:id', description: 'Delete news' },
          { method: 'GET', path: '/api/admin/users', description: 'List users' },
          { method: 'PUT', path: '/api/admin/users/:id', description: 'Update user' },
          { method: 'DELETE', path: '/api/admin/users/:id', description: 'Delete user' },
          { method: 'GET', path: '/api/admin/settings', description: 'Get settings' },
          { method: 'PUT', path: '/api/admin/settings', description: 'Update settings' },
          { method: 'POST', path: '/api/admin/settings/upload-logo', description: 'Upload logo' },
          { method: 'POST', path: '/api/admin/settings/upload-favicon', description: 'Upload favicon' },
          { method: 'POST', path: '/api/admin/maintenance/toggle', description: 'Toggle maintenance' },
        ]
      }
    }
  });
});

// Public routes
app.use('/api/apps', appRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Admin routes
app.use('/api/admin', adminAuthRoutes);    // POST /api/admin/login
app.use('/api/admin', adminRoutes);        // All admin CRUD
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// ─── API INDEX ────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'VexaStore API',
    endpoints: {
      public: [
        '/api/apps',
        '/api/apps/:slug',
        '/api/apps/featured',
        '/api/categories',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify-otp',
        '/api/auth/resend-otp',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/downloads/track',
        '/api/health'
      ],
      admin: [
        '/api/admin/login',
        '/api/admin/verify',
        '/api/admin/apps',
        '/api/admin/apps/:id',
        '/api/admin/versions',
        '/api/admin/versions/:id',
        '/api/admin/categories',
        '/api/admin/news',
        '/api/admin/users',
        '/api/admin/settings',
        '/api/admin/settings/upload-logo',
        '/api/admin/settings/upload-favicon',
        '/api/admin/maintenance/toggle'
      ]
    }
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token. Please log in again.'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. The referenced record does not exist.'
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── BACKGROUND CLEANUP JOBS ─────────────────────────────────────────

// Delete unverified users after 1 hour
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `DELETE FROM store_users WHERE is_verified = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );
    connection.release();
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} unverified users`);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}, 60 * 60 * 1000);

// Delete expired OTPs
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `DELETE FROM otp_codes WHERE expires_at < NOW() OR is_used = 1`
    );
    connection.release();
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} expired OTPs`);
    }
  } catch (error) {
    console.error('❌ OTP cleanup error:', error.message);
  }
}, 30 * 60 * 1000);

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────────────────

let server;

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    await pool.end();
    console.log('✅ Database connections closed');

    if (server) {
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── START SERVER ─────────────────────────────────────────────────────

async function startServer() {
  console.log('🚀 Starting VexaStore API...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed. Exiting...');
    process.exit(1);
  }

  // Create default admin user if not exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role ENUM('admin', 'super_admin') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const [adminRows] = await pool.query(
      'SELECT id FROM admin_users WHERE email = ?',
      [adminEmail.toLowerCase()]
    );

    if (adminRows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO admin_users (email, password, name, role) VALUES (?, ?, 'Administrator', 'super_admin')`,
        [adminEmail.toLowerCase(), hashed]
      );
      console.log(`✅ Default admin created: ${adminEmail}`);
    }
  } catch (error) {
    console.warn('⚠️ Admin user setup warning:', error.message);
  }

  server = app.listen(PORT, () => {
    console.log(`\n🚀 VexaStore API running on port ${PORT}`);
    console.log(`📱 Frontend User: ${process.env.FRONTEND_USER_URL || 'http://localhost:5173'}`);
    console.log(`⚙️  Frontend Admin: ${process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📋 All endpoints are ready!\n`);
  });

  return app;
}

module.exports = { app, startServer };

if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}
