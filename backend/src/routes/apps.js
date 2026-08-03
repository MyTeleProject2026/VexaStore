const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { category, os, featured, search, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        a.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT version FROM app_versions WHERE app_id = a.id AND is_latest = 1 AND is_active = 1 LIMIT 1) as latest_version,
        (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id AND is_active = 1) as version_count
      FROM apps a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.is_active = 1
    `;

    const params = [];

    if (category) {
      query += ` AND c.slug = ?`;
      params.push(category);
    }

    if (featured === 'true') {
      query += ` AND a.is_featured = 1`;
    }

    if (search) {
      query += ` AND (a.name LIKE ? OR a.description LIKE ? OR a.long_description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (os) {
      query += ` AND EXISTS (SELECT 1 FROM app_versions WHERE app_id = a.id AND os = ? AND is_active = 1)`;
      params.push(os);
    }

    query += ` ORDER BY a.is_featured DESC, a.total_downloads DESC, a.rating DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    for (const app of rows) {
      const [versions] = await pool.query(
        `SELECT id, version, os, file_url, file_size, release_notes, download_count, created_at
         FROM app_versions
         WHERE app_id = ? AND is_active = 1
         ORDER BY os ASC, created_at DESC`,
        [app.id]
      );
      app.versions = versions;
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query(
      `SELECT
        a.*,
        c.name as category_name,
        c.slug as category_slug
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.slug = ? AND a.is_active = 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    const app = rows[0];

    const [versions] = await pool.query(
      `SELECT id, version, os, file_url, file_size, release_notes, is_latest, download_count, created_at
       FROM app_versions
       WHERE app_id = ? AND is_active = 1
       ORDER BY os ASC, created_at DESC`,
      [app.id]
    );
    app.versions = versions;

    const [reviews] = await pool.query(
      `SELECT rating, review, user_email, created_at
       FROM app_reviews
       WHERE app_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [app.id]
    );
    app.reviews = reviews;

    res.json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/versions/:os', async (req, res, next) => {
  try {
    const { slug, os } = req.params;

    const [appRows] = await pool.query(
      `SELECT id FROM apps WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    if (!appRows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    const [versions] = await pool.query(
      `SELECT id, version, file_url, file_size, release_notes, download_count, created_at
       FROM app_versions
       WHERE app_id = ? AND os = ? AND is_active = 1
       ORDER BY created_at DESC`,
      [appRows[0].id, os]
    );

    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
