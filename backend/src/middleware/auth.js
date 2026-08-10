// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

// ──────────────────────────────────────────────────────────────
// ADMIN AUTHENTICATION – verifies admin role
// ──────────────────────────────────────────────────────────────
const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if role is admin or super_admin
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Verify admin exists in database (if admin_users table exists)
    try {
      const [rows] = await pool.query(
        'SELECT id, email, name, role, is_active FROM admin_users WHERE id = ? AND is_active = 1',
        [decoded.id]
      );

      if (rows.length > 0) {
        req.admin = rows[0];
        return next();
      }
    } catch {
      // admin_users table might not exist, fallback to env admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com';
      if (decoded.email === adminEmail) {
        req.admin = {
          id: decoded.id || 1,
          email: decoded.email,
          name: 'VexaStore Admin',
          role: 'super_admin'
        };
        return next();
      }
    }

    return res.status(401).json({ success: false, message: 'Admin account not found or inactive' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    console.error('❌ Admin auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ──────────────────────────────────────────────────────────────
// USER AUTHENTICATION – validates token from VexaAccount
// ──────────────────────────────────────────────────────────────
const authUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);

    // Allow 'user', 'admin', and 'super_admin' roles
    if (decoded.role !== 'user' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Invalid token role' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    console.error('❌ User auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ──────────────────────────────────────────────────────────────
// SUPER ADMIN ONLY
// ──────────────────────────────────────────────────────────────
const authSuperAdmin = async (req, res, next) => {
  try {
    await authAdmin(req, res, () => {
      if (req.admin && req.admin.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Super admin access required' });
      }
      next();
    });
  } catch (error) {
    console.error('❌ Super admin auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { authAdmin, authUser, authSuperAdmin };
