const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const { imageUpload } = require('../config/cloudinary');

// ============================================================
// GET: Public site settings (no auth)
// ============================================================
router.get('/public', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET: Admin settings (with auth)
// ============================================================
router.get('/', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUT: Update settings (admin only)
// ============================================================
router.put('/', authAdmin, async (req, res, next) => {
  try {
    const {
      site_title, site_subtitle, primary_color, secondary_color,
      background_color, font_family, custom_css, custom_header_html, custom_footer_html
    } = req.body;
    await pool.query(
      `UPDATE site_settings SET
        site_title = COALESCE(?, site_title),
        site_subtitle = COALESCE(?, site_subtitle),
        primary_color = COALESCE(?, primary_color),
        secondary_color = COALESCE(?, secondary_color),
        background_color = COALESCE(?, background_color),
        font_family = COALESCE(?, font_family),
        custom_css = ?,
        custom_header_html = ?,
        custom_footer_html = ?,
        updated_at = NOW()
       WHERE id = 1`,
      [site_title, site_subtitle, primary_color, secondary_color, background_color, font_family, custom_css, custom_header_html, custom_footer_html]
    );
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Upload logo (admin only)
// ============================================================
router.post('/upload-logo', authAdmin, imageUpload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const logo_url = req.file.path;
    await pool.query('UPDATE site_settings SET logo_url = ? WHERE id
