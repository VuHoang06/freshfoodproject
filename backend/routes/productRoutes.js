const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, seedProducts } = require('../controllers/productController');
const { protect, adminOrStaff } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOrStaff, createProduct);
router.put('/:id', protect, adminOrStaff, updateProduct);
router.delete('/:id', protect, adminOrStaff, deleteProduct);

// Endpoint đặc biệt để tạo dữ liệu mẫu - phải đặt TRƯỚC /:id
router.post('/seed', protect, adminOrStaff, seedProducts);

module.exports = router;
