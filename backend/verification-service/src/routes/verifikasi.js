const express = require('express');
const router = express.Router();
const verifikasiController = require('../controllers/verifikasiController');
const authMid = require('../middleware/auth');

router.use(authMid);

router.get('/', verifikasiController.index);
router.post('/terima', verifikasiController.terima);
router.post('/tolak', verifikasiController.tolak);
router.post('/teruskan', verifikasiController.teruskan);

module.exports = router;
