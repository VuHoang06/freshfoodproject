const express = require('express');
const { getPromotions, createPromotion, applyPromotion, updatePromotion, deletePromotion } = require('../controllers/promotionController');
const { protect, adminOrStaff } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPromotions);
router.post('/', protect, adminOrStaff, createPromotion);
router.post('/apply', protect, applyPromotion);
router.put('/:id', protect, adminOrStaff, updatePromotion);
router.delete('/:id', protect, adminOrStaff, deletePromotion);

module.exports = router;
