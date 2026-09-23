// backend/src/routes/adminAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vexastore.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1',
      [normalizedEmail]
    );

    let admin = null;
    let isEnvAdmin = false;

    if (rows.length > 0) {
      admin = rows[0];

      let valid = false;
      try {
        valid = typeof admin.password === 'string' && admin.password.length === 60
          ? await bcrypt.compare(password, admin.password)
          : false;
      } catch (compareError) {
        console.warn('⚠️ Stored admin password hash is invalid:', compareError.message);
      }

      if (!valid) {
        // If the configured production/admin credentials are correct, repair a
        // stale or malformed seeded hash instead of permanently locking the
        // configured administrator out.
        if (normalizedEmail === adminEmail && password === adminPassword) {
          const repairedHash = await bcrypt.hash(adminPassword, 10);
          await pool.query(
            'UPDATE admin_users SET password = ?, is_active = 1, updated_at = NOW() WHERE id = ?',
            [repairedHash, admin.id]
          );
          admin.password = repairedHash;
        } else {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
      }

      await pool.query(
        'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
        [admin.id]
      );
    } else {
      // Environment credentials remain the emergency/bootstrap fallback.
      if (normalizedEmail === adminEmail && password === adminPassword) {
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

router.get('/verify', authAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
