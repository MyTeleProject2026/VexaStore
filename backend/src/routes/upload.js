// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const { imageUpload } = require('../config/cloudinary');
const { authUser, authAdmin } = require('../middleware/auth');

// ──────────────────────────────────────────────────────────────
// POST: Upload Avatar (user only)
// ──────────────────────────────────────────────────────────────
router.post('/avatar', authUser, imageUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatar_url = req.file.path;

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_url
    });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload App Icon (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/app-icon', authAdmin, imageUpload.single('icon'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const icon_url = req.file.path;

    res.json({
      success: true,
      message: 'App icon uploaded successfully',
      icon_url
    });
  } catch (error) {
    console.error('❌ App icon upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload App Banner (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/app-banner', authAdmin, imageUpload.single('banner'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const banner_url = req.file.path;

    res.json({
      success: true,
      message: 'App banner uploaded successfully',
      banner_url
    });
  } catch (error) {
    console.error('❌ App banner upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload News Image (admin only)
// ──────────────────────────────────────────────────────────────
router.post('/news-image', authAdmin, imageUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const image_url = req.file.path;

    res.json({
      success: true,
      message: 'News image uploaded successfully',
      image_url
    });
  } catch (error) {
    console.error('❌ News image upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload Logo (admin only - also in settings.js)
// ──────────────────────────────────────────────────────────────
router.post('/logo', authAdmin, imageUpload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const logo_url = req.file.path;

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url
    });
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload Favicon (admin only - also in settings.js)
// ──────────────────────────────────────────────────────────────
router.post('/favicon', authAdmin, imageUpload.single('favicon'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const favicon_url = req.file.path;

    res.json({
      success: true,
      message: 'Favicon uploaded successfully',
      favicon_url
    });
  } catch (error) {
    console.error('❌ Favicon upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload App File (admin only - also in admin.js)
// ──────────────────────────────────────────────────────────────
router.post('/app-file', authAdmin, imageUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file_url = req.file.path;
    const file_size = req.file.size;
    const fileSizeFormatted = file_size > 1024 * 1024
      ? `${(file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file_size / 1024).toFixed(1)} KB`;

    res.json({
      success: true,
      message: 'App file uploaded successfully',
      file_url,
      file_size: fileSizeFormatted,
      file_size_bytes: file_size
    });
  } catch (error) {
    console.error('❌ App file upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload Profile Picture (user only)
// ──────────────────────────────────────────────────────────────
router.post('/profile-picture', authUser, imageUpload.single('profile_picture'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatar_url = req.file.path;

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      avatar_url
    });
  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload KYC Document (user only)
// ──────────────────────────────────────────────────────────────
router.post('/kyc-document', authUser, imageUpload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const document_url = req.file.path;
    const { document_type = 'id' } = req.body;

    res.json({
      success: true,
      message: 'KYC document uploaded successfully',
      document_url,
      document_type
    });
  } catch (error) {
    console.error('❌ KYC document upload error:', error);
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Upload Receipt (user only)
// ──────────────────────────────────────────────────────────────
router.post('/receipt', authUser, imageUpload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const receipt_url = req.file.path;

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receipt_url
    });
  } catch (error) {
    console.error('❌ Receipt upload error:', error);
    next(error);
  }
});

module.exports = router;
