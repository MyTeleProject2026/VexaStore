const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon, sort_order, is_active
       FROM categories
       WHERE is_active = 1
       ORDER BY sort_order ASC, name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon, sort_order FROM categories WHERE slug = ? AND is_active = 1`,
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

router.get('/:slug/apps', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const [rows] = await pool.query(
      `SELECT a.*,
        (SELECT version FROM app_versions WHERE app_id = a.id AND is_latest = 1 LIMIT 1) as latest_version
       FROM apps a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = ? AND a.is_active = 1
       ORDER BY a.total_downloads DESC
       LIMIT ? OFFSET ?`,
      [slug, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
