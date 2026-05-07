const Promotion = require('../models/Promotion');

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getPromotionValues = (promo) => {
    if (!promo) return null;
    const discountType = promo.discountType
        ? String(promo.discountType).trim().toLowerCase()
        : (safeNumber(promo.discountPercentage) > 0 ? 'percent' : 'fixed');

    const rawDiscountValue = promo.discountValue !== undefined && promo.discountValue !== null
        ? promo.discountValue
        : discountType === 'percent'
            ? promo.discountPercentage
            : promo.discountAmount;

    return {
        code: normalizeCode(promo.code),
        discountType: discountType === 'fixed' ? 'fixed' : 'percent',
        discountValue: safeNumber(rawDiscountValue, 0),
        maxDiscount: safeNumber(promo.maxDiscount, 0),
        minOrderAmount: promo.minOrderAmount !== undefined && promo.minOrderAmount !== null
            ? safeNumber(promo.minOrderAmount, 0)
            : safeNumber(promo.minPurchase, 0),
        usageLimit: safeNumber(promo.usageLimit, 0),
        usedCount: safeNumber(promo.usedCount, 0),
        isActive: Boolean(promo.isActive),
        expiryDate: promo.expiryDate,
    };
};

const computeDiscount = (promoValues, orderValue) => {
    let discount = 0;
    if (promoValues.discountType === 'percent') {
        discount = Math.floor(orderValue * promoValues.discountValue / 100);
        if (promoValues.maxDiscount > 0) {
            discount = Math.min(discount, promoValues.maxDiscount);
        }
    } else {
        discount = promoValues.discountValue;
    }
    discount = Math.max(0, Math.min(discount, orderValue));
    return discount;
};

const getPromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({ isActive: true, expiryDate: { $gte: now } }).lean();
        const available = promotions
            .filter(p => {
                const promoValues = getPromotionValues(p);
                return promoValues.usageLimit === 0 || promoValues.usedCount < promoValues.usageLimit;
            })
            .map(p => {
                const promoValues = getPromotionValues(p);
                return {
                    ...promoValues,
                    expiryDate: p.expiryDate,
                };
            });
        res.json(available);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const createPromotion = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            maxDiscount,
            minOrderAmount,
            usageLimit,
            expiryDate,
            isActive,
            discountPercentage,
            discountAmount,
            minPurchase,
        } = req.body;

        console.log('[createPromotion] req.body:', req.body);

        const normalizedCode = normalizeCode(code);
        const inferredDiscountType = discountType
            ? String(discountType).trim().toLowerCase()
            : (safeNumber(discountPercentage) > 0 ? 'percent' : 'fixed');
        const inferredDiscountValue = discountValue !== undefined && discountValue !== null
            ? safeNumber(discountValue, NaN)
            : inferredDiscountType === 'percent'
                ? safeNumber(discountPercentage, NaN)
                : safeNumber(discountAmount, NaN);
        const inferredMinOrderAmount = minOrderAmount !== undefined && minOrderAmount !== null
            ? safeNumber(minOrderAmount, 0)
            : safeNumber(minPurchase, 0);

        console.log('[createPromotion] inferred:', { normalizedCode, inferredDiscountType, inferredDiscountValue, inferredMinOrderAmount });

        if (!normalizedCode || !['percent', 'fixed'].includes(inferredDiscountType) || Number.isNaN(inferredDiscountValue) || inferredDiscountValue <= 0) {
            return res.status(400).json({ message: 'Thiếu hoặc sai thông tin voucher. Vui lòng kiểm tra lại.' });
        }

        const exists = await Promotion.findOne({ code: normalizedCode });
        if (exists) return res.status(400).json({ message: 'Mã này đã tồn tại' });

        if (!['percent', 'fixed'].includes(inferredDiscountType)) {
            return res.status(400).json({ message: 'discountType phải là percent hoặc fixed' });
        }

        const promo = new Promotion({
            code: normalizedCode,
            discountType: inferredDiscountType,
            discountValue: Number(inferredDiscountValue),
            maxDiscount: Number(maxDiscount) || 0,
            minOrderAmount: Number(inferredMinOrderAmount) || 0,
            usageLimit: Number(usageLimit) || 0,
            usedCount: 0,
            expiryDate,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        });

        const savedPromo = await promo.save();
        res.status(201).json(savedPromo);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo mã' });
    }
};

const applyPromotion = async (req, res) => {
    try {
        const code = normalizeCode(req.body.code);
        const orderValue = Number(req.body.orderValue || 0);

        if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã voucher.' });

        const promo = await Promotion.findOne({ code, isActive: true });
        if (!promo) return res.status(404).json({ message: 'Mã không tồn tại hoặc đã bị vô hiệu hóa' });

        const promoValues = getPromotionValues(promo);
        const now = new Date();
        if (now > promoValues.expiryDate) return res.status(400).json({ message: 'Mã đã hết hạn' });
        if (promoValues.usageLimit > 0 && promoValues.usedCount >= promoValues.usageLimit) return res.status(400).json({ message: 'Mã đã hết lượt sử dụng' });
        if (orderValue < promoValues.minOrderAmount) return res.status(400).json({ message: `Đơn tối thiểu phải từ ${promoValues.minOrderAmount.toLocaleString('vi-VN')}đ` });

        const discountAmount = computeDiscount(promoValues, orderValue);
        const finalPrice = Math.max(0, orderValue - discountAmount);

        console.log('[applyPromotion] code=', code, 'orderValue=', orderValue, 'discountAmount=', discountAmount, 'finalPrice=', finalPrice, 'promoValues=', promoValues);

        res.json({
            message: 'Áp dụng mã thành công',
            code: promoValues.code,
            discountType: promoValues.discountType,
            discountValue: promoValues.discountValue,
            discountAmount,
            finalPrice,
            maxDiscount: promoValues.maxDiscount,
            minOrderAmount: promoValues.minOrderAmount,
            usageLimit: promoValues.usageLimit,
            usedCount: promoValues.usedCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const updatePromotion = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            maxDiscount,
            minOrderAmount,
            usageLimit,
            expiryDate,
            isActive,
            discountPercentage,
            discountAmount,
            minPurchase,
        } = req.body;

        const promo = await Promotion.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Mã không tồn tại' });

        const normalizedCode = code ? normalizeCode(code) : promo.code;
        if (normalizedCode !== promo.code) {
            const exists = await Promotion.findOne({ code: normalizedCode });
            if (exists) return res.status(400).json({ message: 'Mã này đã có người sử dụng' });
        }

        const inferredDiscountType = discountType
            ? String(discountType).trim().toLowerCase()
            : (discountPercentage !== undefined ? 'percent' : undefined)
                || (discountAmount !== undefined ? 'fixed' : undefined);
        const inferredDiscountValue = discountValue !== undefined && discountValue !== null
            ? safeNumber(discountValue, NaN)
            : inferredDiscountType === 'percent'
                ? safeNumber(discountPercentage, NaN)
                : safeNumber(discountAmount, NaN);
        const inferredMinOrderAmount = minOrderAmount !== undefined && minOrderAmount !== null
            ? safeNumber(minOrderAmount, 0)
            : safeNumber(minPurchase, promo.minOrderAmount || promo.minPurchase || 0);

        if (code) promo.code = normalizedCode;
        if (inferredDiscountType) {
            if (!['percent', 'fixed'].includes(inferredDiscountType)) {
                return res.status(400).json({ message: 'discountType phải là percent hoặc fixed' });
            }
            promo.discountType = inferredDiscountType;
        }
        if (!Number.isNaN(inferredDiscountValue)) {
            promo.discountValue = Number(inferredDiscountValue);
        }
        promo.maxDiscount = maxDiscount !== undefined && maxDiscount !== null ? safeNumber(maxDiscount, promo.maxDiscount) : promo.maxDiscount;
        promo.minOrderAmount = inferredMinOrderAmount !== undefined && inferredMinOrderAmount !== null ? Number(inferredMinOrderAmount) : promo.minOrderAmount;
        promo.usageLimit = usageLimit !== undefined && usageLimit !== null ? Number(usageLimit) : promo.usageLimit;
        if (expiryDate) promo.expiryDate = expiryDate;
        if (isActive !== undefined) promo.isActive = Boolean(isActive);

        const updatedPromo = await promo.save();
        res.json(updatedPromo);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật mã' });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const promo = await Promotion.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Mã không tồn tại' });
        await promo.deleteOne();
        res.json({ message: 'Đã xóa mã voucher' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa mã' });
    }
};

module.exports = { getPromotions, createPromotion, applyPromotion, updatePromotion, deletePromotion };
