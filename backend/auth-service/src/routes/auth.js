const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Public
router.post('/login', authController.login);
router.get('/validate', authController.validateToken);

// Protected
router.post('/logout', authMid, authController.logout);
router.post('/refresh', authMid, (req, res) => {
  // Dalam stateless JWT, refresh token biasanya ditangani di client, atau dengan refresh token terpisah.
  // Untuk kesederhanaan, asumsikan token masih valid jika masuk ke sini.
  res.json({ message: 'Token valid (mock refresh)' });
});
router.get('/me', authMid, authController.me);

// Rekan DB / Admin DP3A only
router.post('/users', authMid, roleMid(['admin_dp3a']), authController.createUser);

module.exports = router;
