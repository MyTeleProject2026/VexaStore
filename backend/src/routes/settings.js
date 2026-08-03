const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

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
    const { site_title, site_subtitle, primary_color, secondary_color, background_color, font_family, custom_css, custom_header_html, custom_footer_html } = req.body;
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
router.post('/upload-logo', authAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const logo_url = req.file.path;
    await pool.query('UPDATE site_settings SET logo_url = ? WHERE id = 1', [logo_url]);
    res.json({ success: true, logo_url });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Upload favicon (admin only)
// ============================================================
router.post('/upload-favicon', authAdmin, upload.single('favicon'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const favicon_url = req.file.path;
    await pool.query('UPDATE site_settings SET favicon_url = ? WHERE id = 1', [favicon_url]);
    res.json({ success: true, favicon_url });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET: News articles (public)
// ============================================================
router.get('/news', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, content, image_url, is_featured, published_at FROM news_articles WHERE is_published = 1 ORDER BY published_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET: Single news article (public)
// ============================================================
router.get('/news/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM news_articles WHERE slug = ? AND is_published = 1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: News CRUD
// ============================================================
router.post('/news', authAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { title, slug, content, is_featured, is_published } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'Title, slug, content required' });
    }
    const image_url = req.file ? req.file.path : null;
    const [result] = await pool.query(
      `INSERT INTO news_articles (title, slug, content, image_url, is_featured, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, slug, content, image_url, is_featured || 0, is_published !== undefined ? is_published : 1]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
});

router.put('/news/:id', authAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { title, slug, content, is_featured, is_published } = req.body;
    const image_url = req.file ? req.file.path : null;
    let query = `UPDATE news_articles SET title = ?, slug = ?, content = ?, is_featured = ?, is_published = ?, updated_at = NOW()`;
    const params = [title, slug, content, is_featured || 0, is_published !== undefined ? is_published : 1];
    if (image_url) {
      query += `, image_url = ?`;
      params.push(image_url);
    }
    query += ` WHERE id = ?`;
    params.push(req.params.id);
    await pool.query(query, params);
    res.json({ success: true, message: 'Article updated' });
  } catch (error) {
    next(error);
  }
});

router.delete('/news/:id', authAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM news_articles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: User Management
// ============================================================
router.get('/users', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, name, google_id, is_verified, is_active, created_at FROM store_users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', authAdmin, async (req, res, next) => {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE store_users SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', authAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM store_users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: Categories CRUD
// ============================================================

// Get all categories (admin)
router.get('/categories', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM categories ORDER BY sort_order ASC, name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/categories', authAdmin, async (req, res, next) => {
  try {
    const { name, slug, icon, sort_order } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug required' });
    }
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, icon, sort_order, is_active) VALUES (?, ?, ?, ?, 1)`,
      [name, slug, icon || null, sort_order || 0]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
});

// Update category (admin only)
router.put('/categories/:id', authAdmin, async (req, res, next) => {
  try {
    const { name, slug, icon, sort_order, is_active } = req.body;
    const [result] = await pool.query(
      `UPDATE categories SET name = ?, slug = ?, icon = ?, sort_order = ?, is_active = ? WHERE id = ?`,
      [name, slug, icon || null, sort_order || 0, is_active !== undefined ? is_active : 1, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/categories/:id', authAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;