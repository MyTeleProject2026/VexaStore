const express = require('express');
const router = express.Router();
const { imageUpload } = require('../config/cloudinary');
const { authUser } = require('../middleware/auth');

// ============================================================
// POST: Upload Avatar
// ============================================================
router.post('/avatar', authUser, imageUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Cloudinary returns the URL in req.file.path
    const avatar_url = req.file.path;
    res.json({ success: true, avatar_url });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
