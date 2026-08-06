const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendEmail, sendOtpEmail, sendResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key';

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ============================================================
// POST: Register (Email/Password)
// ============================================================
router.post('/register', async (req, res, next) => {
  const start = Date.now();
  const connection = await pool.getConnection();
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    // ✅ Check if user exists
    const [existing] = await connection.query(
      'SELECT id, is_verified FROM store_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length) {
      const user = existing[0];
      
      // ✅ If user exists but is NOT verified → resend OTP
      if (user.is_verified === 0) {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // Delete old OTPs for this user
        await connection.query(
          'DELETE FROM otp_codes WHERE user_id = ? AND purpose = "email_verification"',
          [user.id]
        );
        
        await connection.query(
          `INSERT INTO otp_codes (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'email_verification', ?)`,
          [user.id, otp, expiresAt]
        );
        
        try {
          await sendOtpEmail(email, otp);
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError.message);
        }
        
        return res.status(409).json({
          success: false,
          message: 'Account already registered but not verified. New OTP sent to your email.',
          action: 'verify' // ✅ Frontend can use this to redirect
        });
      }
      
      // ✅ User exists and IS verified
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // ✅ New user – create account
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

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
    }

    console.log('⏱️ Registration completed in:', Date.now() - start, 'ms');
    res.json({
      success: true,
      message: 'Registration successful. Please verify your email with OTP.',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
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

    const [userRows] = await connection.query(
      'SELECT id FROM store_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
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

    const [userRows] = await connection.query(
      'SELECT id, is_verified FROM store_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userRows[0].is_verified === 1) {
      return res.status(400).json({ success: false, message: 'Email already verified. Please login.' });
    }

    const userId = userRows[0].id;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Delete old OTPs
    await connection.query(
      'DELETE FROM otp_codes WHERE user_id = ? AND purpose = "email_verification"',
      [userId]
    );
    
    await connection.query(
      `INSERT INTO otp_codes (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'email_verification', ?)`,
      [userId, otp, expiresAt]
    );
    
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError.message);
    }

    res.json({ success: true, message: 'OTP resent to your email.' });
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

    const [rows] = await pool.query(
      'SELECT * FROM store_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
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

    let [rows] = await pool.query(
      'SELECT * FROM store_users WHERE google_id = ? OR email = ?',
      [google_id, email]
    );
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

// ============================================================
// POST: Forgot Password
// ============================================================
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [rows] = await pool.query(
      'SELECT id, email FROM store_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (!rows.length) {
      return res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
    }

    const user = rows[0];
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await pool.query(
      `INSERT INTO otp_codes (user_id, otp_code, purpose, expires_at) 
       VALUES (?, ?, 'password_reset', DATE_ADD(NOW(), INTERVAL 1 HOUR))
       ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at)`,
      [user.id, resetToken]
    );

    const resetLink = `${process.env.FRONTEND_USER_URL || 'https://vexastore.onrender.com'}/reset-password?token=${resetToken}`;

    try {
      await sendResetEmail(email, resetLink);
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError.message);
    }

    res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Reset Password
// ============================================================
router.post('/reset-password', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    }

    const [otpRows] = await connection.query(
      `SELECT id FROM otp_codes WHERE user_id = ? AND otp_code = ? AND purpose = 'password_reset' AND is_used = 0 AND expires_at > NOW()`,
      [decoded.id, token]
    );
    if (!otpRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE store_users SET password = ? WHERE id = ?', [hashed, decoded.id]);
    await connection.query('UPDATE otp_codes SET is_used = 1 WHERE id = ?', [otpRows[0].id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
