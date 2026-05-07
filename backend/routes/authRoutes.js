const express = require('express');
const { register, login, getProfile, updateProfile, createStaff, getAllUsers, deleteUser, updateUser } = require('../controllers/authController');
const { protect, adminOrStaff, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/staff', protect, adminOnly, createStaff);
router.get('/', protect, adminOrStaff, getAllUsers);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOrStaff, deleteUser);

module.exports = router;
