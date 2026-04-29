const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMid = require('../middleware/auth');
const roleMid = require('../middleware/role');

// Public
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/validate', authController.validateToken);

// Authenticated
router.get('/me', authMid, authController.me);

// Super Admin Only - User Management
router.get('/users', authMid, roleMid(['super_admin']), authController.getUsers);
router.post('/users', authMid, roleMid(['super_admin']), authController.createUser);
router.put('/users/:id', authMid, roleMid(['super_admin']), authController.updateUser);
router.delete('/users/:id', authMid, roleMid(['super_admin']), authController.deleteUser);

module.exports = router;
