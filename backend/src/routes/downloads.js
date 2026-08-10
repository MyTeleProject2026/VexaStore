// backend/src/routes/downloads.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ──────────────────────────────────────────────────────────────
// POST: Track a download
// ──────────────────────────────────────────────────────────────
router.post('/track', async (req, res, next) => {
  try {
    const { app_id, version_id, os, user_agent, ip, country } = req.body;

    if (!app_id || !version_id) {
      return res.status(400).json({ success: false, message: 'app_id and version_id required' });
    }

    // Update version download count
    await pool.query(
      `UPDATE app_versions SET download_count = download_count + 1 WHERE id = ?`,
      [version_id]
    );

    // Update app total downloads
    await pool.query(
      `UPDATE apps SET total_downloads = total_downloads + 1 WHERE id = ?`,
      [app_id]
    );

    // Log the download
    await pool.query(
      `INSERT INTO download_logs (app_id, app_version_id, os, ip_address, user_agent, country, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [app_id, version_id, os || null, ip || null, user_agent || null, country || null]
    );

    res.json({ success: true, message: 'Download tracked successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Download statistics (public)
// ──────────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let dateCondition = '';
    if (period === '7d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    } else if (period === '30d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    } else if (period === '90d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`;
    }

    // Total downloads
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM download_logs dl WHERE 1=1 ${dateCondition}`
    );

    // Downloads by OS
    const [osRows] = await pool.query(
      `SELECT dl.os, COUNT(*) as count FROM download_logs dl
       WHERE dl.os IS NOT NULL ${dateCondition}
       GROUP BY dl.os
       ORDER BY count DESC`
    );

    // Top apps
    const [topApps] = await pool.query(
      `SELECT a.id, a.name, a.slug, COUNT(dl.id) as downloads
       FROM download_logs dl
       JOIN apps a ON a.id = dl.app_id
       WHERE 1=1 ${dateCondition}
       GROUP BY dl.app_id
       ORDER BY downloads DESC
       LIMIT 10`
    );

    // Daily downloads
    const [dailyRows] = await pool.query(
      `SELECT DATE(dl.created_at) as date, COUNT(*) as count
       FROM download_logs dl
       WHERE dl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(dl.created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: {
        total: totalRows[0]?.total || 0,
        by_os: osRows,
        top_apps: topApps,
        daily: dailyRows
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Downloads for a specific app
// ──────────────────────────────────────────────────────────────
router.get('/app/:appId', async (req, res, next) => {
  try {
    const { appId } = req.params;

    const [rows] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, os
       FROM download_logs
       WHERE app_id = ?
       GROUP BY DATE(created_at), os
       ORDER BY date DESC
       LIMIT 30`,
      [appId]
    );

    const [total] = await pool.query(
      `SELECT COUNT(*) as total FROM download_logs WHERE app_id = ?`,
      [appId]
    );

    res.json({
      success: true,
      data: {
        total: total[0]?.total || 0,
        daily: rows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
