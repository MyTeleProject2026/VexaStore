const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key';

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ============================================================
// POST: Register (Email/Password)
// ============================================================
router.post('/register', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const [existing] = await connection.query('SELECT id FROM store_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      `INSERT INTO store_users (email, password, name, is_verified) VALUES (?, ?, ?, 0)`,
      [email.trim().toLowerCase(), hashed, name.trim()]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await connection.query(
      `INSERT INTO otp_codes (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'email_verification', ?)`,
      [result.insertId, otp, expiresAt]
    );

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'Registration successful. Please verify your email with OTP.' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
});

// ============================================================
// POST: Verify OTP
// ============================================================
router.post('/verify-otp', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required' });
    }

    const [userRows] = await connection.query('SELECT id FROM store_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [otpRows] = await connection.query(
      `SELECT id, expires_at, is_used FROM otp_codes WHERE user_id = ? AND otp_code = ? AND purpose = 'email_verification' AND is_used = 0 ORDER BY id DESC LIMIT 1`,
      [userRows[0].id, otp]
    );
    if (!otpRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date() > new Date(otpRows[0].expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    await connection.query('UPDATE otp_codes SET is_used = 1 WHERE id = ?', [otpRows[0].id]);
    await connection.query('UPDATE store_users SET is_verified = 1 WHERE id = ?', [userRows[0].id]);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
});

// ============================================================
// POST: Resend OTP
// ============================================================
router.post('/resend-otp', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const [userRows] = await connection.query('SELECT id, email FROM store_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await connection.query(
      `INSERT INTO otp_codes (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'email_verification', ?)`,
      [userRows[0].id, otp, expiresAt]
    );
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP resent' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
});

// ============================================================
// POST: Login (Email/Password)
// ============================================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [rows] = await pool.query('SELECT * FROM store_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email first' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, is_verified: user.is_verified }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Google Login
// ============================================================
router.post('/google', async (req, res, next) => {
  try {
    const { google_id, email, name } = req.body;
    if (!google_id || !email) {
      return res.status(400).json({ success: false, message: 'Missing Google data' });
    }

    let [rows] = await pool.query('SELECT * FROM store_users WHERE google_id = ? OR email = ?', [google_id, email]);
    let user;
    if (rows.length) {
      user = rows[0];
      if (!user.google_id) {
        await pool.query('UPDATE store_users SET google_id = ? WHERE id = ?', [google_id, user.id]);
        user.google_id = google_id;
      }
    } else {
      const [result] = await pool.query(
        `INSERT INTO store_users (email, name, google_id, is_verified) VALUES (?, ?, ?, 1)`,
        [email, name || email.split('@')[0], google_id]
      );
      const [newUser] = await pool.query('SELECT * FROM store_users WHERE id = ?', [result.insertId]);
      user = newUser[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
