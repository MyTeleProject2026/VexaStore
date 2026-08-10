// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authAdmin, authSuperAdmin } = require('../middleware/auth');
const { imageUpload, appFileUpload } = require('../config/cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'vexastore_jwt_secret_key_2024_secure';

// ──────────────────────────────────────────────────────────────
// POST: Admin Login (Database + Environment Fallback)
// ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // First try: Check admin_users table
    let [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1',
      [email.trim().toLowerCase()]
    );

    let admin = null;
    let isEnvAdmin = false;

    if (rows.length > 0) {
      admin = rows[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      // Fallback: Check environment variables (for backward compatibility)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@vexastore.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

      if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
        isEnvAdmin = true;
        admin = {
          id: 1,
          email: adminEmail,
          name: 'VexaStore Admin',
          role: 'super_admin'
        };
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // Update last login (only for DB admins)
    if (!isEnvAdmin && admin.id) {
      await pool.query(
        'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
        [admin.id]
      );
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role || 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name || 'VexaStore Admin',
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Verify admin token
// ──────────────────────────────────────────────────────────────
router.get('/verify', authAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// ──────────────────────────────────────────────────────────────
// POST: Admin logout
// ──────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ──────────────────────────────────────────────────────────────
// GET: Test route
// ──────────────────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin router is working!' });
});

// ──────────────────────────────────────────────────────────────
// GET: Dashboard stats
// ──────────────────────────────────────────────────────────────
router.get('/dashboard', authAdmin, async (req, res, next) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as total FROM store_users');
    const [appCount] = await pool.query('SELECT COUNT(*) as total FROM apps WHERE is_active = 1');
    const [downloadCount] = await pool.query('SELECT COUNT(*) as total FROM download_logs');
    const [versionCount] = await pool.query('SELECT COUNT(*) as total FROM app_versions');
    const [categoryCount] = await pool.query('SELECT COUNT(*) as total FROM categories WHERE is_active = 1');

    // Recent downloads
    const [recentDownloads] = await pool.query(
      `SELECT dl.*, a.name as app_name
       FROM download_logs dl
       JOIN apps a ON a.id = dl.app_id
       ORDER BY dl.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        users: userCount[0]?.total || 0,
        apps: appCount[0]?.total || 0,
        downloads: downloadCount[0]?.total || 0,
        versions: versionCount[0]?.total || 0,
        categories: categoryCount[0]?.total || 0,
        recent_activity: recentDownloads
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── APP MANAGEMENT ──────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: All apps (admin)
router.get('/apps', authAdmin, async (req, res, next) => {
  try {
    const { category, featured, active, search } = req.query;

    let query = `
      SELECT a.*, c.name as category_name,
        (SELECT version FROM app_versions WHERE app_id = a.id AND is_latest = 1 AND is_active = 1 LIMIT 1) as latest_version,
        (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id AND is_active = 1) as version_count
      FROM apps a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND a.category_id = ?';
      params.push(category);
    }
    if (featured === 'true') {
      query += ' AND a.is_featured = 1';
    }
    if (active === 'true') {
      query += ' AND a.is_active = 1';
    }
    if (active === 'false') {
      query += ' AND a.is_active = 0';
    }
    if (search) {
      query += ' AND (a.name LIKE ? OR a.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY a.total_downloads DESC, a.created_at DESC';

    const [rows] = await pool.query(query, params);

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

    // Get total count
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM apps');

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET: Single app (admin)
router.get('/apps/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT a.*, c.name as category_name
       FROM apps a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    const [versions] = await pool.query(
      `SELECT * FROM app_versions WHERE app_id = ? AND is_active = 1 ORDER BY created_at DESC`,
      [id]
    );

    const [downloads] = await pool.query(
      `SELECT COUNT(*) as total FROM download_logs WHERE app_id = ?`,
      [id]
    );

    rows[0].versions = versions;
    rows[0].total_downloads = downloads[0]?.total || 0;

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST: Create app (admin only)
router.post('/apps', authAdmin, imageUpload.single('icon'), async (req, res, next) => {
  try {
    const {
      name, slug, description, long_description, category_id,
      developer, website, is_featured, is_free, price
    } = req.body;

    if (!name || !slug || !category_id) {
      return res.status(400).json({ success: false, message: 'Name, slug, and category are required' });
    }

    const icon_url = req.file ? req.file.path : null;

    const [existing] = await pool.query('SELECT id FROM apps WHERE slug = ?', [slug]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO apps
       (name, slug, description, long_description, category_id, icon_url,
        developer, website, is_featured, is_free, price, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        name, slug, description || null, long_description || null,
        category_id, icon_url,
        developer || 'VexaTrade', website || null,
        is_featured || 0, is_free !== undefined ? is_free : 1,
        price || 0
      ]
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

// PUT: Update app (admin only)
router.put('/apps/:id', authAdmin, imageUpload.single('icon'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, slug, description, long_description, category_id,
      developer, website, is_featured, is_active, is_free, price
    } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    // Check if app exists
    const [existing] = await pool.query('SELECT id FROM apps WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    // Check slug uniqueness
    if (slug) {
      const [slugCheck] = await pool.query(
        'SELECT id FROM apps WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    let icon_url = null;
    if (req.file) {
      icon_url = req.file.path;
    }

    let query = `
      UPDATE apps
      SET name = ?, slug = ?, description = ?, long_description = ?,
          category_id = ?, developer = ?, website = ?,
          is_featured = ?, is_active = ?, is_free = ?, price = ?,
          updated_at = NOW()
    `;
    const params = [
      name, slug, description || null, long_description || null,
      category_id, developer || 'VexaTrade', website || null,
      is_featured || 0, is_active !== undefined ? is_active : 1,
      is_free !== undefined ? is_free : 1, price || 0
    ];

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

// DELETE: Delete app (admin only)
router.delete('/apps/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM apps WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    res.json({ success: true, message: 'App deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── VERSION MANAGEMENT ──────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// POST: Add version (admin only)
router.post('/versions', authAdmin, appFileUpload.single('file'), async (req, res, next) => {
  try {
    const { app_id, version, os, release_notes, is_latest } = req.body;

    if (!app_id || !version || !os) {
      return res.status(400).json({ success: false, message: 'app_id, version, and os are required' });
    }

    // Check if app exists
    const [appRows] = await pool.query('SELECT id FROM apps WHERE id = ? AND is_active = 1', [app_id]);
    if (!appRows.length) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    let file_url = null;
    let file_size = null;
    let fileSizeFormatted = null;

    if (req.file) {
      file_url = req.file.path;
      file_size = req.file.size;
      fileSizeFormatted = file_size > 1024 * 1024
        ? `${(file_size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file_size / 1024).toFixed(1)} KB`;
    }

    // If this is the latest version, unset other latest versions for this OS
    if (is_latest === '1' || is_latest === 1) {
      await pool.query(
        'UPDATE app_versions SET is_latest = 0 WHERE app_id = ? AND os = ?',
        [app_id, os]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO app_versions
       (app_id, version, os, file_url, file_size, release_notes, is_latest, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        app_id, version, os,
        file_url, fileSizeFormatted,
        release_notes || null,
        is_latest === '1' || is_latest === 1 ? 1 : 0
      ]
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

// DELETE: Delete version (admin only)
router.delete('/versions/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM app_versions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    res.json({ success: true, message: 'Version deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── CATEGORY MANAGEMENT ─────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: List categories (admin)
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

// POST: Create category (admin only)
router.post('/categories', authAdmin, async (req, res, next) => {
  try {
    const { name, slug, icon, sort_order } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }

    const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, icon, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [name, slug, icon || null, sort_order || 0]
    );

    res.json({
      success: true,
      message: 'Category created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

// PUT: Update category (admin only)
router.put('/categories/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, sort_order, is_active } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }

    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const [slugCheck] = await pool.query(
      'SELECT id FROM categories WHERE slug = ? AND id != ?',
      [slug, id]
    );
    if (slugCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    await pool.query(
      `UPDATE categories SET name = ?, slug = ?, icon = ?, sort_order = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, slug, icon || null, sort_order || 0, is_active !== undefined ? is_active : 1, id]
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete category (admin only)
router.delete('/categories/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has apps
    const [apps] = await pool.query('SELECT id FROM apps WHERE category_id = ?', [id]);
    if (apps.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing apps. Move or delete the apps first.'
      });
    }

    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── NEWS MANAGEMENT ─────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: List news (admin)
router.get('/news', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM news_articles ORDER BY published_at DESC`
    );
    // Parse JSON content
    const parsedRows = rows.map(row => ({
      ...row,
      content: row.content ? JSON.parse(row.content) : row.content
    }));
    res.json({ success: true, data: parsedRows });
  } catch (error) {
    next(error);
  }
});

// POST: Create news (admin only)
router.post('/news', authAdmin, imageUpload.single('image'), async (req, res, next) => {
  try {
    let { title, slug, content, is_featured, is_published } = req.body;
    let image_url = null;

    if (req.file) {
      image_url = req.file.path;
    }

    title = title?.trim();
    slug = slug?.trim();
    content = content?.trim();

    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'Title, slug, and content are required' });
    }

    const contentJson = JSON.stringify(content);

    const [result] = await pool.query(
      `INSERT INTO news_articles (title, slug, content, image_url, is_featured, is_published, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [title, slug, contentJson, image_url, is_featured || 0, is_published !== undefined ? is_published : 1]
    );

    res.json({
      success: true,
      message: 'News article created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

// PUT: Update news (admin only)
router.put('/news/:id', authAdmin, imageUpload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    let { title, slug, content, is_featured, is_published } = req.body;
    let image_url = null;

    if (req.file) {
      image_url = req.file.path;
    }

    title = title?.trim();
    slug = slug?.trim();
    content = content?.trim();

    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'Title, slug, and content are required' });
    }

    const contentJson = JSON.stringify(content);

    let query = `
      UPDATE news_articles
      SET title = ?, slug = ?, content = ?, is_featured = ?, is_published = ?, updated_at = NOW()
    `;
    const params = [title, slug, contentJson, is_featured || 0, is_published !== undefined ? is_published : 1];

    if (image_url) {
      query += `, image_url = ?`;
      params.push(image_url);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, message: 'News article updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete news (admin only)
router.delete('/news/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM news_articles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, message: 'News article deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── USER MANAGEMENT ─────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: List users (admin)
router.get('/users', authAdmin, async (req, res, next) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT id, email, name, google_id, is_verified, is_active,
             avatar_url, phone, bio, created_at, updated_at
      FROM store_users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === 'active') {
      query += ' AND is_active = 1';
    } else if (status === 'inactive') {
      query += ' AND is_active = 0';
    } else if (status === 'verified') {
      query += ' AND is_verified = 1';
    } else if (status === 'unverified') {
      query += ' AND is_verified = 0';
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);

    // Get total counts
    const [totalUsers] = await pool.query('SELECT COUNT(*) as total FROM store_users');
    const [activeUsers] = await pool.query('SELECT COUNT(*) as total FROM store_users WHERE is_active = 1');
    const [verifiedUsers] = await pool.query('SELECT COUNT(*) as total FROM store_users WHERE is_verified = 1');

    res.json({
      success: true,
      data: rows,
      stats: {
        total: totalUsers[0]?.total || 0,
        active: activeUsers[0]?.total || 0,
        verified: verifiedUsers[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT: Update user (admin only)
router.put('/users/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, is_active, is_verified, phone, bio } = req.body;

    const [existing] = await pool.query('SELECT id FROM store_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email) {
      const [emailCheck] = await pool.query(
        'SELECT id FROM store_users WHERE email = ? AND id != ?',
        [email.trim().toLowerCase(), id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.trim().toLowerCase()); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    if (is_verified !== undefined) { updates.push('is_verified = ?'); params.push(is_verified); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(
      `UPDATE store_users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete user (admin only)
router.delete('/users/:id', authAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete related data first
    await pool.query('DELETE FROM otp_codes WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM user_activity_logs WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM user_connected_apps WHERE user_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM store_users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── SITE SETTINGS ───────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: Site settings (admin)
router.get('/settings', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    if (rows.length === 0) {
      // Create default settings if not exists
      await pool.query(
        `INSERT INTO site_settings (id) VALUES (1)
         ON DUPLICATE KEY UPDATE id = id`
      );
      const [newRows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
      return res.json({ success: true, data: newRows[0] });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT: Update site settings (admin only)
router.put('/settings', authAdmin, async (req, res, next) => {
  try {
    const {
      site_title, site_subtitle, primary_color, secondary_color,
      background_color, font_family, custom_css, custom_header_html,
      custom_footer_html
    } = req.body;

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

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST: Upload logo (admin only)
router.post('/settings/upload-logo', authAdmin, imageUpload.single('logo'), async (req, res, next) => {
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

// POST: Upload favicon (admin only)
router.post('/settings/upload-favicon', authAdmin, imageUpload.single('favicon'), async (req, res, next) => {
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
// ─── MAINTENANCE MANAGEMENT ──────────────────────────────────
// ──────────────────────────────────────────────────────────────

// POST: Toggle maintenance mode (admin only)
router.post('/maintenance/toggle', authAdmin, async (req, res, next) => {
  try {
    const { enabled, message, scheduled_end } = req.body;

    // Check if maintenance_settings table exists, create if not
    try {
      await pool.query('SELECT 1 FROM maintenance_settings LIMIT 1');
    } catch {
      // Table doesn't exist, create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS maintenance_settings (
          id INT PRIMARY KEY DEFAULT 1,
          is_enabled BOOLEAN DEFAULT FALSE,
          message TEXT,
          scheduled_end DATETIME,
          enabled_by INT,
          enabled_at DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`INSERT IGNORE INTO maintenance_settings (id) VALUES (1)`);
    }

    await pool.query(
      `UPDATE maintenance_settings SET
        is_enabled = ?,
        message = ?,
        scheduled_end = ?,
        enabled_by = ?,
        enabled_at = CASE WHEN ? = 1 THEN NOW() ELSE enabled_at END,
        updated_at = NOW()
       WHERE id = 1`,
      [
        enabled ? 1 : 0,
        message || null,
        scheduled_end || null,
        req.admin.id || 1,
        enabled ? 1 : 0
      ]
    );

    res.json({
      success: true,
      message: `Maintenance ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// GET: Maintenance status (public)
router.get('/maintenance/status', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT is_enabled, message, scheduled_end FROM maintenance_settings WHERE id = 1');
    const settings = rows[0] || { is_enabled: 0, message: null, scheduled_end: null };
    res.json({
      success: true,
      data: {
        is_enabled: settings.is_enabled === 1,
        message: settings.message,
        scheduled_end: settings.scheduled_end
      }
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// ─── ADMIN USER MANAGEMENT ──────────────────────────────────
// ──────────────────────────────────────────────────────────────

// GET: List admin users (super admin only)
router.get('/admin-users', authSuperAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, name, role, is_active, last_login, created_at
       FROM admin_users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// POST: Create admin user (super admin only)
router.post('/admin-users', authSuperAdmin, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const [existing] = await pool.query('SELECT id FROM admin_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin user already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO admin_users (email, password, name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [email.trim().toLowerCase(), hashed, name || null, role || 'admin']
    );

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

// PUT: Update admin user (super admin only)
router.put('/admin-users/:id', authSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    const [existing] = await pool.query('SELECT id FROM admin_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(
      `UPDATE admin_users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Admin user updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete admin user (super admin only)
router.delete('/admin-users/:id', authSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id == req.admin.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const [result] = await pool.query('DELETE FROM admin_users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.json({ success: true, message: 'Admin user deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
