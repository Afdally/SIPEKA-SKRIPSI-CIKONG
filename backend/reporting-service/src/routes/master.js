const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterKekerasanController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Public (Digunakan oleh frontend pelapor untuk mengisi form)
router.get('/kekerasan', masterController.getAll);

// Super Admin ONLY
router.post('/kekerasan', authMid, roleMid(['super_admin']), masterController.create);
router.put('/kekerasan/:id', authMid, roleMid(['super_admin']), masterController.update);
router.delete('/kekerasan/:id', authMid, roleMid(['super_admin']), masterController.delete);

module.exports = router;
