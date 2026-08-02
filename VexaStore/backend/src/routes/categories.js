const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all categories - Public
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

// Get single category by slug - Public
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

module.exports = router;