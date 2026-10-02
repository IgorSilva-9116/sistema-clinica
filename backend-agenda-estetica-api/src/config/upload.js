const multer = require('multer');
const path = require('path');
const fs = require('fs');

// No Azure use UPLOAD_DIR=/home/uploads (pasta que não é apagada a cada deploy)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage
});

module.exports = upload;
module.exports.UPLOAD_DIR = UPLOAD_DIR;