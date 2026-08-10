// backend/src/routes/settings.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const { imageUpload } = require('../config/cloudinary');

// ──────────────────────────────────────────────────────────────
// GET: Public site settings (no auth)
// ──────────────────────────────────────────────────────────────
router.get('/public', async (req, res, next) => {
  try {
    // Ensure table exists
    try {
      await pool.query('SELECT 1 FROM site_settings LIMIT 1');
    } catch {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT PRIMARY KEY DEFAULT 1,
          site_title VARCHAR(255) DEFAULT 'VexaStore',
          site_subtitle VARCHAR(255) DEFAULT 'Official App Hub',
          logo_url VARCHAR(500),
          favicon_url VARCHAR(500),
          primary_color VARCHAR(20) DEFAULT '#06b6d4',
          secondary_color VARCHAR(20) DEFAULT '#8b5cf6',
          background_color VARCHAR(20) DEFAULT '#0b0b0b',
          font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
          custom_css TEXT,
          custom_header_html TEXT,
          custom_footer_html TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO site_settings (id) VALUES (1)`);
    }

    const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Admin settings (with auth)
// ──────────────────────────────────────────────────────────────
router.get('/', authAdmin, async (req, res, next) => {
  try {
    // Ensure table exists
    try {
      await pool.query('SELECT 1 FROM site_settings LIMIT 1');
    } catch {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT PRIMARY KEY DEFAULT 1,
          site_title VARCHAR(255) DEFAULT 'VexaStore',
          site_subtitle VARCHAR(255) DEFAULT 'Official App Hub',
          logo_url VARCHAR(500),
          favicon_url VARCHAR(500),
          primary_color VARCHAR(20) DEFAULT '#06b6d4',
          secondary_color VARCHAR(20) DEFAULT '#8b5cf6',
          background_color VARCHAR(20) DEFAULT '#0b0b0b',
          font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
          custom_css TEXT,
          custom_header_html TEXT,
          custom_footer_html TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO site_settings (id) VALUES (1)`);
    }

    const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: Update settings (admin only)
// ──────────────────────────────────────────────────────────────
router.put('/', authAdmin, async (req, res, next) => {
  try {
    const {
      site_title, site_subtitle, primary_color, secondary_color,
      background_color, font_family, custom_css, custom_header_html, custom_footer_html
    } = req.body;

    // Ensure table exists
    try {
      await pool.query('SELECT 1 FROM site_settings LIMIT 1');
    } catch {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT PRIMARY KEY DEFAULT 1,
          site_title VARCHAR(255) DEFAULT 'VexaStore',
          site_subtitle VARCHAR(255) DEFAULT 'Official App Hub',
          logo_url VARCHAR(500),
          favicon_url VARCHAR(500),
          primary_color VARCHAR(20) DEFAULT '#06b6d4',
          secondary_color VARCHAR(20) DEFAULT '#8b5cf6',
          background_color VARCHAR(20) DEFAULT '#0b0b0b',
          font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
          custom_css TEXT,
          custom_header_html TEXT,
          custom_footer_html TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO site_settings (id) VALUES (1)`);
    }

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
      [
        site_title, site_subtitle,
        primary_color, secondary_color,
        background_color, font_family,
        custom_css, custom_header_html,
        custom_footer_html
      ]
    );

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload logo (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/upload-logo', authAdmin, imageUpload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const logo_url = req.file.path;
    await pool.query('UPDATE site_settings SET logo_url = ? WHERE id = 1', [logo_url]);
    res.json({ success: true, logo_url });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload favicon (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/upload-favicon', authAdmin, imageUpload.single('favicon'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const favicon_url = req.file.path;
    await pool.query('UPDATE site_settings SET favicon_url = ? WHERE id = 1', [favicon_url]);
    res.json({ success: true, favicon_url });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: News articles (public)
// ──────────────────────────────────────────────────────────────
router.get('/news', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, content, image_url, is_featured, published_at
       FROM news_articles
       WHERE is_published = 1
       ORDER BY published_at DESC`
    );
    const parsedRows = rows.map(row => ({
      ...row,
      content: row.content ? JSON.parse(row.content) : row.content
    }));
    res.json({ success: true, data: parsedRows });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Single news article (public)
// ──────────────────────────────────────────────────────────────
router.get('/news/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM news_articles WHERE slug = ? AND is_published = 1`,
      [req.params.slug]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    const article = rows[0];
    article.content = article.content ? JSON.parse(article.content) : article.content;
    res.json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
