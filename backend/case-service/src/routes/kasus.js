const express = require('express');
const router = express.Router();
const kasusController = require('../controllers/kasusController');
const statsController = require('../controllers/statsController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Semua route butuh login
router.use(authMid);

// Executive Monitoring (Super Admin)
router.get('/stats/summary', roleMid(['super_admin']), statsController.getSummary);
router.get('/stats/kinerja', roleMid(['super_admin']), statsController.getKinerja);
router.get('/export/csv', roleMid(['super_admin']), statsController.exportCSV);

// Daftar & Detail kasus
router.get('/', kasusController.index);
router.get('/:id', kasusController.show);

// Tahap 1: Registrasi laporan
router.post('/registrasi', kasusController.registrasi);

// Tahap 2: Input assessment
router.put('/:id/assessment', kasusController.assessment);

// Tahap 3: Rencana intervensi
router.put('/:id/intervensi', kasusController.intervensi);

// Tahap 4: Log aktivitas & selesaikan
router.post('/:id/log', kasusController.addLog);
router.put('/:id/selesai', kasusController.selesaikan);

module.exports = router;
