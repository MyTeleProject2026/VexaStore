const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const { appFileUpload } = require('../config/cloudinary');

const normalizeSha = (value) => String(value || '').trim().toLowerCase();

router.post('/', authAdmin, appFileUpload.single('file'), async (req, res, next) => {
  try {
    const { app_id, version, os, release_notes, is_latest, sha256, package_name, version_code, minimum_sdk, signing_certificate_sha256, release_status } = req.body;
    if (!app_id || !version || !os || !req.file) return res.status(400).json({ success: false, message: 'app_id, version, os, and file are required' });

    const [apps] = await pool.query('SELECT id FROM apps WHERE id = ? AND is_active = 1', [app_id]);
    if (!apps.length) return res.status(404).json({ success: false, message: 'App not found' });

    const checksum = normalizeSha(sha256);
    if (checksum && !/^[a-f0-9]{64}$/.test(checksum)) return res.status(400).json({ success: false, message: 'sha256 must be a 64-character SHA-256 hexadecimal value' });
    if (os === 'android' && (!package_name || !checksum)) {
      return res.status(400).json({ success: false, message: 'Android releases require package_name and sha256' });
    }

    if (String(is_latest) === '1') {
      await pool.query('UPDATE app_versions SET is_latest = 0 WHERE app_id = ? AND os = ?', [app_id, os]);
    }

    const size = req.file.size || 0;
    const formattedSize = size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
    const [result] = await pool.query(
      `INSERT INTO app_versions
       (app_id, version, os, file_url, file_size, release_notes, is_latest, is_active, sha256, package_name, version_code, minimum_sdk, signing_certificate_sha256, release_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [app_id, version.trim(), os, req.file.path, formattedSize, release_notes || null, String(is_latest) === '1' ? 1 : 0,
        checksum || null, package_name || null, version_code ? Number(version_code) : null, minimum_sdk ? Number(minimum_sdk) : null,
        normalizeSha(signing_certificate_sha256) || null, release_status || 'PUBLISHED']
    );

    res.json({
      success: true,
      message: 'Release version added successfully',
      data: { id: result.insertId, file_url: req.file.path, file_size: formattedSize, sha256: checksum || null }
    });
  } catch (error) { next(error); }
});

router.put('/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sha256, package_name, version_code, minimum_sdk, signing_certificate_sha256, release_status, release_notes, is_latest } = req.body;
    const [rows] = await pool.query('SELECT id, app_id, os FROM app_versions WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Version not found' });
    const checksum = normalizeSha(sha256);
    if (checksum && !/^[a-f0-9]{64}$/.test(checksum)) return res.status(400).json({ success: false, message: 'sha256 must be a 64-character SHA-256 hexadecimal value' });
    if (String(is_latest) === '1') await pool.query('UPDATE app_versions SET is_latest = 0 WHERE app_id = ? AND os = ?', [rows[0].app_id, rows[0].os]);
    await pool.query(
      `UPDATE app_versions SET sha256 = ?, package_name = ?, version_code = ?, minimum_sdk = ?, signing_certificate_sha256 = ?, release_status = COALESCE(?, release_status), release_notes = COALESCE(?, release_notes), is_latest = COALESCE(?, is_latest), updated_at = NOW() WHERE id = ?`,
      [checksum || null, package_name || null, version_code ? Number(version_code) : null, minimum_sdk ? Number(minimum_sdk) : null, normalizeSha(signing_certificate_sha256) || null, release_status || null, release_notes || null, is_latest === undefined ? null : (String(is_latest) === '1' ? 1 : 0), id]
    );
    res.json({ success: true, message: 'Release metadata updated successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
