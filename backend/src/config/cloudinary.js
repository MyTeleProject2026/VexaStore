const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vexastore/images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg'],
    resource_type: 'image',
  },
});

// Storage for app files
const appFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vexastore/apps',
    allowed_formats: ['apk', 'ipa', 'exe', 'dmg', 'deb', 'rpm', 'zip', 'msi'],
    resource_type: 'raw',
  },
});

const imageUpload = multer({ storage: imageStorage });
const appFileUpload = multer({ storage: appFileStorage });

module.exports = { cloudinary, imageUpload, appFileUpload };
