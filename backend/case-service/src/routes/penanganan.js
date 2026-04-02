const express = require('express');
const router = express.Router();
const penangananController = require('../controllers/penangananController');
const authMid = require('../middleware/auth');

router.use(authMid);

router.get('/', penangananController.index);
router.post('/', penangananController.store);
router.get('/:id', penangananController.show);
router.put('/:id', penangananController.update);
router.delete('/:id', penangananController.destroy);

module.exports = router;
