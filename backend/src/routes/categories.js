// backend/src/routes/categories.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ──────────────────────────────────────────────────────────────
// GET: List all categories (public)
// ──────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon, sort_order, is_active, created_at, updated_at
       FROM categories
       WHERE is_active = 1
       ORDER BY sort_order ASC, name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Single category by slug (public)
// ──────────────────────────────────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon, sort_order, is_active, created_at, updated_at
       FROM categories
       WHERE slug = ? AND is_active = 1`,
      [slug]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Apps in a category (public)
// ──────────────────────────────────────────────────────────────
router.get('/:slug/apps', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0, featured } = req.query;

    let query = `
      SELECT a.id, a.name, a.slug, a.description, a.icon_url, 
             a.banner_url, a.developer, a.is_free, a.price,
             a.total_downloads, a.average_rating, a.is_featured,
             a.created_at,
        (SELECT version FROM app_versions 
         WHERE app_id = a.id AND is_latest = 1 AND is_active = 1 
         LIMIT 1) as latest_version,
        (SELECT COUNT(*) FROM app_versions 
         WHERE app_id = a.id AND is_active = 1) as version_count
      FROM apps a
      JOIN categories c ON c.id = a.category_id
      WHERE c.slug = ? AND a.is_active = 1
    `;
    const params = [slug];

    if (featured === 'true') {
      query += ' AND a.is_featured = 1';
    }

    query += ' ORDER BY a.total_downloads DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM apps a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = ? AND a.is_active = 1`,
      [slug]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0]?.total || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Category with apps count (public)
// ──────────────────────────────────────────────────────────────
router.get('/:slug/stats', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [categoryRows] = await pool.query(
      `SELECT id, name, slug, icon, sort_order
       FROM categories
       WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    if (!categoryRows.length) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const [appCount] = await pool.query(
      `SELECT COUNT(*) as total
       FROM apps a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = ? AND a.is_active = 1`,
      [slug]
    );

    const [featuredCount] = await pool.query(
      `SELECT COUNT(*) as total
       FROM apps a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = ? AND a.is_active = 1 AND a.is_featured = 1`,
      [slug]
    );

    res.json({
      success: true,
      data: {
        category: categoryRows[0],
        stats: {
          total_apps: appCount[0]?.total || 0,
          featured_apps: featuredCount[0]?.total || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: All categories with app counts (public)
// ──────────────────────────────────────────────────────────────
router.get('/with-counts', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.sort_order,
        (SELECT COUNT(*) FROM apps a WHERE a.category_id = c.id AND a.is_active = 1) as app_count,
        (SELECT COUNT(*) FROM apps a WHERE a.category_id = c.id AND a.is_active = 1 AND a.is_featured = 1) as featured_count
       FROM categories c
       WHERE c.is_active = 1
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
