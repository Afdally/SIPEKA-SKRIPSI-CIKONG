const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterMetodeController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Public / Petugas dapat melihat (untuk dropdown)
// Namun karena service ini diproteksi Nginx /api/penanganan/, rute ini akan berada di /api/master/metode
router.get('/metode', masterController.getAll);

// Super Admin ONLY
router.post('/metode', authMid, roleMid(['super_admin']), masterController.create);
router.put('/metode/:id', authMid, roleMid(['super_admin']), masterController.update);
router.delete('/metode/:id', authMid, roleMid(['super_admin']), masterController.delete);

module.exports = router;
