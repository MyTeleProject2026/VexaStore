// backend/src/routes/maintenance.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');

// ──────────────────────────────────────────────────────────────
// GET: Maintenance status (public)
// ──────────────────────────────────────────────────────────────
router.get('/status', async (req, res, next) => {
  try {
    // Ensure table exists
    try {
      await pool.query('SELECT 1 FROM maintenance_settings LIMIT 1');
    } catch {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS maintenance_settings (
          id INT PRIMARY KEY DEFAULT 1,
          is_enabled BOOLEAN DEFAULT FALSE,
          message TEXT,
          scheduled_end DATETIME,
          enabled_by INT,
          enabled_at DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO maintenance_settings (id) VALUES (1)`);
    }

    const [rows] = await pool.query(
      'SELECT is_enabled, message, scheduled_end FROM maintenance_settings WHERE id = 1'
    );
    const settings = rows[0] || { is_enabled: 0, message: null, scheduled_end: null };
    res.json({
      success: true,
      data: {
        is_enabled: settings.is_enabled === 1,
        message: settings.message,
        scheduled_end: settings.scheduled_end
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Toggle maintenance (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/toggle', authAdmin, async (req, res, next) => {
  try {
    const { enabled, message, scheduled_end } = req.body;

    // Ensure table exists
    try {
      await pool.query('SELECT 1 FROM maintenance_settings LIMIT 1');
    } catch {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS maintenance_settings (
          id INT PRIMARY KEY DEFAULT 1,
          is_enabled BOOLEAN DEFAULT FALSE,
          message TEXT,
          scheduled_end DATETIME,
          enabled_by INT,
          enabled_at DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO maintenance_settings (id) VALUES (1)`);
    }

    await pool.query(
      `UPDATE maintenance_settings SET
        is_enabled = ?,
        message = ?,
        scheduled_end = ?,
        enabled_by = ?,
        enabled_at = CASE WHEN ? = 1 THEN NOW() ELSE enabled_at END,
        updated_at = NOW()
       WHERE id = 1`,
      [
        enabled ? 1 : 0,
        message || null,
        scheduled_end || null,
        req.admin.id || 1,
        enabled ? 1 : 0
      ]
    );

    res.json({
      success: true,
      message: `Maintenance ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
