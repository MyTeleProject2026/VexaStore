// backend/src/routes/apps.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ─── GET: List all apps (public) ──────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { category, featured, limit = 20, offset = 0, search } = req.query;

    let query = `
      SELECT a.*, c.name as category_name,
        (SELECT version FROM app_versions WHERE app_id = a.id AND is_latest = 1 AND is_active = 1 LIMIT 1) as latest_version,
        (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id AND is_active = 1) as version_count
      FROM apps a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND a.category_id = ?';
      params.push(category);
    }
    if (featured === 'true') {
      query += ' AND a.is_featured = 1';
    }
    if (search) {
      query += ' AND (a.name LIKE ? OR a.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY a.total_downloads DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM apps WHERE is_active = 1`
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

// ─── GET: Featured apps (public) ──────────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name as category_name,
        (SELECT version FROM app_versions WHERE app_id = a.id AND is_latest = 1 AND is_active = 1 LIMIT 1) as latest_version
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.is_active = 1 AND a.is_featured = 1
       ORDER BY a.total_downloads DESC
       LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// ─── GET: Single app by slug ──────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const [appRows] = await pool.query(
      `SELECT a.*, c.name as category_name
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.slug = ? AND a.is_active = 1`,
      [req.params.slug]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    const [versionRows] = await pool.query(
      `SELECT * FROM app_versions WHERE app_id = ? AND is_active = 1 ORDER BY created_at DESC`,
      [appRows[0].id]
    );

    res.json({
      success: true,
      data: {
        ...appRows[0],
        versions: versionRows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
