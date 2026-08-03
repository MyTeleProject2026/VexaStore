require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./config/database');

// Routes
const appRoutes = require('./routes/apps');
const downloadRoutes = require('./routes/downloads');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const maintenanceRoutes = require('./routes/maintenance');
// ============================================================
// ✅ ADD: Auth Routes
// ============================================================
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// ✅ Fix for Render's reverse proxy - Use '1' instead of 'true'
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// Ensure uploads directory exists
// ============================================================
const uploadDir = path.join(__dirname, '../uploads/apps');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// ============================================================
// Middleware
// ============================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_USER_URL || 'http://localhost:5173',
  process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vexastore.onrender.com',
  'https://vexastore-admin.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================
// API Routes - ✅ MUST BE AFTER app = express()
// ============================================================
app.use('/api/apps', appRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maintenance', maintenanceRoutes);
// ============================================================
// ✅ ADD: Auth Routes (AFTER app = express())
// ============================================================
app.use('/api/auth', authRoutes);

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'VexaStore API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================
// Start Server
// ============================================================
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Database connection failed. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 VexaStore API running on port ${PORT}`);
    console.log(`📱 Frontend User: ${process.env.FRONTEND_USER_URL || 'http://localhost:5173'}`);
    console.log(`⚙️  Frontend Admin: ${process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();