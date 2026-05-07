const express = require('express');
const { addOrderItems, getOrderById, updateOrderStatus, markOrderReceived, getMyOrders, getOrders } = require('../controllers/orderController');
const { protect, adminOrStaff } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, addOrderItems);
router.post('/pos', protect, adminOrStaff, addOrderItems);
// QUAN TRỌNG: /myorders phải đặt TRƯỚC /:id
router.get('/myorders', protect, getMyOrders);
router.put('/:id/received', protect, markOrderReceived);
router.get('/', protect, adminOrStaff, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOrStaff, updateOrderStatus);

module.exports = router;
