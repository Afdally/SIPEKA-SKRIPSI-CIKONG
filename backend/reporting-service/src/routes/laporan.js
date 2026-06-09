const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const laporanController = require('../controllers/laporanController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Setup multer for uploads
const storageDir = path.join(__dirname, '../../storage/bukti');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public
router.post('/', upload.single('bukti_file'), laporanController.store);
router.get('/status/:kode', laporanController.cekStatus);
router.get('/public-gis', laporanController.getPublicGis);
router.get('/reset-all-data-dev', laporanController.resetAll);

// Auth Middleware untuk rute di bawah ini
router.use(authMid);

// Executive Monitoring (Super Admin)
router.get('/gis-map', roleMid(['super_admin']), laporanController.getGisMap);

// Protected (Admin/Petugas)
router.get('/', laporanController.index);
router.get('/:id', laporanController.show);
// Dipakai antar-service (Case Service update status laporan)
router.patch('/:id/status', laporanController.updateStatus);

module.exports = router;
