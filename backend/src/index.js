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
// Public routes
const appRoutes = require('./routes/apps');
const downloadRoutes = require('./routes/downloads');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

// Admin routes
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const maintenanceRoutes = require('./routes/maintenance');
const settingsRoutes = require('./routes/settings');

// ─── INITIALIZE APP ──────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── TRUST PROXY (for Render/Heroku) ────────────────────────────────
app.set('trust proxy', 1);

// ─── ENSURE UPLOAD DIRECTORIES EXIST ───────────────────────────────
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

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_USER_URL || 'http://localhost:5173',
  process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://vexastore.onrender.com',
  'https://vexastore-admin.onrender.com',
  'https://vexastore-frontend.onrender.com',
  'https://vexatrade.onrender.com',
  'https://vexatrade-admin.onrender.com',
  'https://api-vexaaccount.onrender.com',
  'https://vexatrade-server.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(null, true); // Allow in production too, but log
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
}));

// Body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VexaStore API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────
app.use('/api/apps', appRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// ─── ADMIN ROUTES ──────────────────────────────────────────────────
app.use('/api/admin', adminAuthRoutes);    // POST /api/admin/login
app.use('/api/admin', adminRoutes);        // All admin CRUD routes
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// ─── FALLBACK: Catch-all for public routes ──────────────────────────
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

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please log in again.'
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

  // Default error response
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
      `DELETE FROM store_users 
       WHERE is_verified = 0 
       AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );
    connection.release();
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} unverified users`);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}, 60 * 60 * 1000); // Run every hour

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
}, 30 * 60 * 1000); // Run every 30 minutes

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────────────────

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Close database connections
    await pool.end();
    console.log('✅ Database connections closed');
    
    // Close server
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── START SERVER ─────────────────────────────────────────────────────

let server;

async function startServer() {
  console.log('🚀 Starting VexaStore API...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed. Exiting...');
    process.exit(1);
  }

  // Create admin user if it doesn't exist
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    // Check if admin_users table exists
    try {
      await pool.query('SELECT 1 FROM admin_users LIMIT 1');
    } catch {
      // Create admin_users table
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
      console.log('✅ Created admin_users table');
    }

    // Check if default admin exists
    const [adminRows] = await pool.query(
      'SELECT id FROM admin_users WHERE email = ?',
      [adminEmail.toLowerCase()]
    );

    if (adminRows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO admin_users (email, password, name, role) VALUES (?, ?, ?, 'super_admin')`,
        [adminEmail.toLowerCase(), hashed, 'Administrator']
      );
      console.log(`✅ Default admin created: ${adminEmail}`);
    }
  } catch (error) {
    console.warn('⚠️ Admin user setup warning:', error.message);
  }

  // Start listening
  server = app.listen(PORT, () => {
    console.log(`\n🚀 VexaStore API running on port ${PORT}`);
    console.log(`📱 Frontend User: ${process.env.FRONTEND_USER_URL || 'http://localhost:5173'}`);
    console.log(`⚙️  Frontend Admin: ${process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST /api/admin/login - Admin login`);
    console.log(`   GET  /api/admin/apps - List apps`);
    console.log(`   GET  /api/admin/apps/:id - Get app details`);
    console.log(`   POST /api/admin/apps - Create app`);
    console.log(`   PUT  /api/admin/apps/:id - Update app`);
    console.log(`   DELETE /api/admin/apps/:id - Delete app`);
    console.log(`   POST /api/admin/versions - Add app version`);
    console.log(`   DELETE /api/admin/versions/:id - Delete version`);
    console.log(`   GET  /api/admin/categories - List categories`);
    console.log(`   POST /api/admin/categories - Create category`);
    console.log(`   PUT  /api/admin/categories/:id - Update category`);
    console.log(`   DELETE /api/admin/categories/:id - Delete category`);
    console.log(`   GET  /api/admin/news - List news`);
    console.log(`   POST /api/admin/news - Create news`);
    console.log(`   PUT  /api/admin/news/:id - Update news`);
    console.log(`   DELETE /api/admin/news/:id - Delete news`);
    console.log(`   GET  /api/admin/users - List users`);
    console.log(`   PUT  /api/admin/users/:id - Update user`);
    console.log(`   DELETE /api/admin/users/:id - Delete user`);
    console.log(`   GET  /api/admin/settings - Get site settings`);
    console.log(`   PUT  /api/admin/settings - Update site settings`);
    console.log(`   POST /api/admin/settings/upload-logo - Upload logo`);
    console.log(`   POST /api/admin/settings/upload-favicon - Upload favicon`);
    console.log(`   POST /api/admin/maintenance/toggle - Toggle maintenance`);
    console.log(`   GET  /api/health - Health check\n`);
  });

  return app;
}

// ─── EXPORT FOR TESTING ──────────────────────────────────────────────
module.exports = { app, startServer };

// ─── RUN IF DIRECTLY EXECUTED ────────────────────────────────────────
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}
