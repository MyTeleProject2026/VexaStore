const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

// ============================================================
// POST: Admin Login
// ============================================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email.trim().toLowerCase()]
    );
    
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    await pool.query(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );
    
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET: All apps (admin)
// ============================================================
router.get('/apps', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name as category_name,
       (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id AND is_active = 1) as version_count
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       ORDER BY a.created_at DESC`
    );
    
    for (const app of rows) {
      const [versions] = await pool.query(
        `SELECT id, version, os, file_url, file_size, release_notes, is_latest, download_count, created_at 
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

// ============================================================
// GET: Single app (admin)
// ============================================================
router.get('/apps/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      `SELECT * FROM apps WHERE id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    
    const [versions] = await pool.query(
      `SELECT * FROM app_versions WHERE app_id = ? AND is_active = 1 ORDER BY created_at DESC`,
      [id]
    );
    
    rows[0].versions = versions;
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Create app (admin only)
// ============================================================
router.post('/apps', authAdmin, upload.single('icon'), async (req, res, next) => {
  try {
    const { 
      name, slug, description, long_description, category_id,
      developer, website, is_featured
    } = req.body;
    
    if (!name || !slug || !category_id) {
      return res.status(400).json({ success: false, message: 'Name, slug, and category are required' });
    }
    
    const icon_url = req.file ? `/uploads/apps/${req.file.filename}` : null;
    
    const [existing] = await pool.query('SELECT id FROM apps WHERE slug = ?', [slug]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO apps 
       (name, slug, description, long_description, category_id, icon_url, developer, website, is_featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description || null, long_description || null, category_id, icon_url, developer || 'VexaTrade', website || null, is_featured || 0]
    );
    
    res.json({
      success: true,
      message: 'App created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUT: Update app (admin only)
// ============================================================
router.put('/apps/:id', authAdmin, upload.single('icon'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, long_description, category_id, developer, website, is_featured, is_active } = req.body;
    
    if (!name || !category_id) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }
    
    let icon_url = null;
    if (req.file) {
      icon_url = `/uploads/apps/${req.file.filename}`;
    }
    
    let query = `
      UPDATE apps 
      SET name = ?, description = ?, long_description = ?, category_id = ?, 
          developer = ?, website = ?, is_featured = ?, is_active = ?, updated_at = NOW()
    `;
    const params = [name, description || null, long_description || null, category_id, developer || 'VexaTrade', website || null, is_featured || 0, is_active !== undefined ? is_active : 1];
    
    if (icon_url) {
      query += `, icon_url = ?`;
      params.push(icon_url);
    }
    
    query += ` WHERE id = ?`;
    params.push(id);
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    
    res.json({ success: true, message: 'App updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE: Delete app (admin only)
// ============================================================
router.delete('/apps/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT icon_url FROM apps WHERE id = ?', [id]);
    if (rows.length && rows[0].icon_url) {
      const filePath = path.join(__dirname, '../../', rows[0].icon_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await pool.query('DELETE FROM download_logs WHERE app_id = ?', [id]);
    await pool.query('DELETE FROM app_versions WHERE app_id = ?', [id]);
    await pool.query('DELETE FROM app_reviews WHERE app_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM apps WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    
    res.json({ success: true, message: 'App deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST: Add version (admin only)
// ============================================================
router.post('/versions', authAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const { app_id, version, os, release_notes, is_latest } = req.body;
    
    if (!app_id || !version || !os || !req.file) {
      return res.status(400).json({ success: false, message: 'app_id, version, os, and file are required' });
    }
    
    const file_url = `/uploads/apps/${req.file.filename}`;
    const file_size = req.file.size;
    const fileSizeFormatted = file_size > 1024 * 1024 
      ? `${(file_size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file_size / 1024).toFixed(1)} KB`;
    
    const [appRows] = await pool.query('SELECT id FROM apps WHERE id = ? AND is_active = 1', [app_id]);
    if (!appRows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    
    if (is_latest === '1' || is_latest === 1) {
      await pool.query(
        'UPDATE app_versions SET is_latest = 0 WHERE app_id = ? AND os = ?',
        [app_id, os]
      );
    }
    
    const [result] = await pool.query(
      `INSERT INTO app_versions 
       (app_id, version, os, file_url, file_size, release_notes, is_latest, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [app_id, version, os, file_url, fileSizeFormatted, release_notes || null, is_latest === '1' ? 1 : 0]
    );
    
    res.json({ 
      success: true, 
      message: 'Version added successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE: Delete version (admin only)
// ============================================================
router.delete('/versions/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT file_url FROM app_versions WHERE id = ?', [id]);
    if (rows.length && rows[0].file_url) {
      const filePath = path.join(__dirname, '../../', rows[0].file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const [result] = await pool.query('DELETE FROM app_versions WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    
    res.json({ success: true, message: 'Version deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add this test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin router is working!' });
});

module.exports = router;