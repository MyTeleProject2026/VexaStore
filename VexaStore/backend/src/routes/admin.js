const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

// Admin login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email]
    );
    
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Update last login
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

// Create app (admin only)
router.post('/apps', authAdmin, upload.single('icon'), async (req, res, next) => {
  try {
    const { 
      name, slug, description, long_description, category_id,
      developer, website, is_featured
    } = req.body;
    
    const icon_url = req.file ? `/uploads/apps/${req.file.filename}` : null;
    
    const [result] = await pool.query(
      `INSERT INTO apps 
       (name, slug, description, long_description, category_id, icon_url, developer, website, is_featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description, long_description, category_id, icon_url, developer, website, is_featured || 0]
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

// Update app
router.put('/apps/:id', authAdmin, upload.single('icon'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, long_description, category_id, developer, website, is_featured, is_active } = req.body;
    
    let icon_url = null;
    if (req.file) {
      icon_url = `/uploads/apps/${req.file.filename}`;
    }
    
    let query = `
      UPDATE apps 
      SET name = ?, description = ?, long_description = ?, category_id = ?, 
          developer = ?, website = ?, is_featured = ?, is_active = ?, updated_at = NOW()
    `;
    const params = [name, description, long_description, category_id, developer, website, is_featured || 0, is_active || 1];
    
    if (icon_url) {
      query += `, icon_url = ?`;
      params.push(icon_url);
    }
    
    query += ` WHERE id = ?`;
    params.push(id);
    
    await pool.query(query, params);
    
    res.json({ success: true, message: 'App updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete app
router.delete('/apps/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get icon to delete
    const [rows] = await pool.query('SELECT icon_url FROM apps WHERE id = ?', [id]);
    if (rows.length && rows[0].icon_url) {
      const filePath = path.join(__dirname, '../../', rows[0].icon_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete versions and logs
    await pool.query('DELETE FROM download_logs WHERE app_id = ?', [id]);
    await pool.query('DELETE FROM app_versions WHERE app_id = ?', [id]);
    await pool.query('DELETE FROM app_reviews WHERE app_id = ?', [id]);
    await pool.query('DELETE FROM apps WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'App deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add version
router.post('/versions', authAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const { app_id, version, os, release_notes, is_latest } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    
    const file_url = `/uploads/apps/${req.file.filename}`;
    const file_size = req.file.size;
    
    // If this is latest, update other versions for this OS
    if (is_latest === '1') {
      await pool.query(
        'UPDATE app_versions SET is_latest = 0 WHERE app_id = ? AND os = ?',
        [app_id, os]
      );
    }
    
    await pool.query(
      `INSERT INTO app_versions 
       (app_id, version, os, file_url, file_size, release_notes, is_latest, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [app_id, version, os, file_url, file_size, release_notes, is_latest || 0]
    );
    
    res.json({ success: true, message: 'Version added successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all apps (admin)
router.get('/apps', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name as category_name,
       (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id AND is_active = 1) as version_count
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       ORDER BY a.created_at DESC`
    );
    
    // Get versions for each app
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

// Get single app (admin)
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

// Delete version
router.delete('/versions/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get file to delete
    const [rows] = await pool.query('SELECT file_url FROM app_versions WHERE id = ?', [id]);
    if (rows.length && rows[0].file_url) {
      const filePath = path.join(__dirname, '../../', rows[0].file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await pool.query('DELETE FROM app_versions WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Version deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;