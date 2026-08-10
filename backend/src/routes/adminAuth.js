// backend/src/routes/adminAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

// ──────────────────────────────────────────────────────────────
// POST: Admin Login (Database + Environment Fallback)
// ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Try: Check admin_users table
    let [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1',
      [email.trim().toLowerCase()]
    );

    let admin = null;
    let isEnvAdmin = false;

    if (rows.length > 0) {
      admin = rows[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Update last login
      await pool.query(
        'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
        [admin.id]
      );
    } else {
      // Fallback: Environment variables
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

      if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
        isEnvAdmin = true;
        admin = {
          id: 1,
          email: adminEmail,
          name: 'VexaStore Admin',
          role: 'super_admin'
        };
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role || 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name || 'VexaStore Admin',
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Verify admin token
// ──────────────────────────────────────────────────────────────
router.get('/verify', authAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// ──────────────────────────────────────────────────────────────
// POST: Admin logout
// ──────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
