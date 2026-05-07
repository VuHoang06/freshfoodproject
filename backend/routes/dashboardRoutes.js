const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, adminOrStaff } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, adminOrStaff, getDashboardStats);

module.exports = router;
