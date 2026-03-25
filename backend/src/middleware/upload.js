const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const MATERIALS_MIME = [
  ...ALLOWED_MIME,
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed: images (jpg, png, webp) and videos (mp4, mov, webm)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

const materialsUpload = multer({
  storage,
  fileFilter: (req, file, cb) => MATERIALS_MIME.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'), false),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

module.exports = { upload, materialsUpload, UPLOAD_DIR };
