const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads/apps');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and app files
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream', 'application/vnd.android.package-archive'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.apk') || file.originalname.endsWith('.ipa') || file.originalname.endsWith('.dmg') || file.originalname.endsWith('.exe') || file.originalname.endsWith('.deb') || file.originalname.endsWith('.rpm')) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter
});

module.exports = upload;