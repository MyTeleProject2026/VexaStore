const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');

// ============================================================
// GET: Maintenance status (public)
// ============================================================
router.get('/status', async (req, res, next) => {
  try {
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

// ============================================================
// POST: Toggle maintenance (admin only)
// ============================================================
router.post('/toggle', authAdmin, async (req, res, next) => {
  try {
    const { enabled, message, scheduled_end } = req.body;
    
    await pool.query(
      `UPDATE maintenance_settings 
       SET is_enabled = ?, message = ?, scheduled_end = ?, enabled_by = ?, enabled_at = NOW(), updated_at = NOW()
       WHERE id = 1`,
      [enabled ? 1 : 0, message || null, scheduled_end || null, req.admin.id]
    );
    
    res.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;