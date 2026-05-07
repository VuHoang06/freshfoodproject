const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Promotion = require("../models/Promotion");

const normalizeStatus = (status) => {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw) return "";

  if (raw === "chờ xác nhận") return "Chờ xử lý";
  if (raw === "chờ xử lý") return "Chờ xử lý";
  if (raw === "đang giao" || raw === "đang giao hàng") return "Đang giao";
  if (raw === "đã giao" || raw === "delivered" || raw === "completed") return "Hoàn thành";
  if (raw === "hoàn thành") return "Hoàn thành";
  if (raw === "đã hủy" || raw === "hủy" || raw === "cancelled" || raw === "cancel") return "Đã hủy";

  return status;
};

const normalizeVoucherCode = (code) => String(code || '').trim().toUpperCase();

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPromotionValues = (promo) => {
  const discountType = promo.discountType
    ? String(promo.discountType).trim().toLowerCase()
    : (safeNumber(promo.discountPercentage) > 0 ? 'percent' : 'fixed');

  const rawDiscountValue = promo.discountValue !== undefined && promo.discountValue !== null
    ? promo.discountValue
    : discountType === 'percent'
      ? promo.discountPercentage
      : promo.discountAmount;

  return {
    code: normalizeVoucherCode(promo.code),
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

const computeVoucherDiscount = (promoValues, orderValue) => {
  let discount = 0;
  if (promoValues.discountType === 'percent') {
    discount = Math.floor(orderValue * promoValues.discountValue / 100);
    if (promoValues.maxDiscount > 0) {
      discount = Math.min(discount, promoValues.maxDiscount);
    }
  } else {
    discount = promoValues.discountValue;
  }
  return Math.max(0, Math.min(discount, orderValue));
};

const validateVoucherForOrder = async (code, orderValue) => {
  const normalizedCode = normalizeVoucherCode(code);
  if (!normalizedCode) {
    throw new Error('Vui lòng nhập mã voucher.');
  }

  const promo = await Promotion.findOne({ code: normalizedCode, isActive: true });
  if (!promo) {
    throw new Error('Mã không tồn tại hoặc đã bị vô hiệu hóa');
  }

  const promoValues = getPromotionValues(promo);
  const now = new Date();
  if (!promoValues.expiryDate || now > promoValues.expiryDate) {
    throw new Error('Mã đã hết hạn');
  }
  if (promoValues.usageLimit > 0 && promoValues.usedCount >= promoValues.usageLimit) {
    throw new Error('Mã đã hết lượt sử dụng');
  }
  if (orderValue < promoValues.minOrderAmount) {
    throw new Error(`Đơn tối thiểu phải từ ${promoValues.minOrderAmount.toLocaleString('vi-VN')}đ`);
  }

  const discountAmount = computeVoucherDiscount(promoValues, orderValue);
  return { promo, promoValues, discountAmount };
};

const incrementPromotionUsage = async (promo) => {
  const query = promo.usageLimit > 0
    ? { _id: promo._id, usedCount: { $lt: promo.usageLimit } }
    : { _id: promo._id };

  const updated = await Promotion.findOneAndUpdate(
    query,
    { $inc: { usedCount: 1 } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new Error('Mã voucher đã hết lượt sử dụng hoặc không còn hiệu lực');
  }

  return updated;
};

const restorePromotionUsage = async (code) => {
  const normalizedCode = normalizeVoucherCode(code);
  await Promotion.findOneAndUpdate(
    { code: normalizedCode, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } }
  );
};

const shouldDeductStock = (order) => {
  if (order.stockDeducted) return false;
  return normalizeStatus(order.status) === "Hoàn thành";
};

const aggregateOrderQuantities = (orderItems) => {
  return orderItems.reduce((acc, item) => {
    if (!item.product) {
      throw new Error(`Sản phẩm "${item.name}" không có ID để trừ tồn kho`);
    }
    const productId = String(item.product);
    acc[productId] = acc[productId] || { qty: 0, name: item.name };
    acc[productId].qty += item.qty;
    return acc;
  }, {});
};

const deductOrderItemsStock = async (orderItems) => {
  const productMap = aggregateOrderQuantities(orderItems);
  const processed = [];

  try {
    for (const [productId, { qty, name }] of Object.entries(productMap)) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { returnDocument: 'after' }
      );

      if (!updatedProduct) {
        throw new Error(`Sản phẩm "${name}" không đủ tồn kho để trừ ${qty} đơn vị`);
      }

      processed.push({ productId, qty });
    }
  } catch (error) {
    if (processed.length > 0) {
      for (const item of processed) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      }
    }
    throw error;
  }
};

const updateDeliveredTimestamp = (order) => {
  if (normalizeStatus(order.status) === "Hoàn thành" && !order.deliveredAt) {
    order.deliveredAt = Date.now();
  }
};

const processOrderStock = async (order) => {
  if (!shouldDeductStock(order)) return;
  await deductOrderItemsStock(order.orderItems);
  order.stockDeducted = true;
  updateDeliveredTimestamp(order);
};

// Create new order (Online or POS)
const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    shippingPrice,
    orderType,
    voucherCode,
  } = req.body;

  console.log('[addOrderItems] req.body:', req.body);

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: "Không có sản phẩm nào trong đơn hàng" });
  }

  const itemsPrice = orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const shippingFee = Number(shippingPrice) || 0;
  const isPOS = orderType === "POS";

  let order = null;
  let discountAmount = 0;
  let normalizedVoucherCode = "";
  let voucherPromotion = null;
  let voucherUsageIncremented = false;

  try {
    if (voucherCode) {
      const voucherResult = await validateVoucherForOrder(voucherCode, itemsPrice);
      normalizedVoucherCode = voucherResult.promoValues.code;
      discountAmount = voucherResult.discountAmount;
      voucherPromotion = voucherResult.promo;
      console.log('[addOrderItems] voucher validated', { voucherCode: normalizedVoucherCode, itemsPrice, discountAmount, finalPrice: Math.max(itemsPrice + shippingFee - discountAmount, 0) });
    }

    const finalPrice = Math.max(itemsPrice + shippingFee - discountAmount, 0);

    order = new Order({
      user: req.user ? req.user.id : null,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice: shippingFee,
      discountAmount,
      voucherCode: normalizedVoucherCode,
      voucherApplied: false,
      voucherRefunded: false,
      finalPrice,
      totalPrice: finalPrice,
      orderType: orderType || "Online",
      status: isPOS ? "Hoàn thành" : "Chờ xử lý",
      isPaid: isPOS ? true : false,
      paidAt: isPOS ? Date.now() : undefined,
    });

    console.log('[addOrderItems] creating order:', { itemsPrice, shippingFee, discountAmount, finalPrice, normalizedVoucherCode });

    await order.save();

    if (voucherPromotion) {
      await incrementPromotionUsage(voucherPromotion);
      voucherUsageIncremented = true;
      order.voucherApplied = true;
    }

    await processOrderStock(order);
    await order.save();

    const qrCodeUrl =
      paymentMethod === "Chuyển khoản QR"
        ? `https://img.vietqr.io/image/970415-1133668899-print.png?amount=${finalPrice}&addInfo=Thanh toan don hang ${order._id}&accountName=FRESHFOOD`
        : null;

    res.status(201).json({ order, qrCodeUrl });
  } catch (error) {
    if (voucherPromotion && voucherUsageIncremented) {
      await restorePromotionUsage(voucherPromotion.code).catch(() => null);
    }
    if (order && order._id) {
      await Order.findByIdAndDelete(order._id).catch(() => null);
    }

    if (error instanceof Error && error.message.includes("không đủ tồn kho")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(400).json({ message: error.message || "Lỗi tạo đơn hàng" });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "username fullName");
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin đơn hàng" });
  }
};

// Update order status (Admin/Staff)
const updateOrderStatus = async (req, res) => {
  try {
    console.log('[updateOrderStatus] req.params.id:', req.params.id, 'req.body:', req.body);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (normalizeStatus(order.status) === "Đã hủy") {
      return res.status(400).json({ message: "Không thể cập nhật đơn hàng đã hủy" });
    }

    const nextStatus = normalizeStatus(req.body.status || order.status);
    const previousStatus = normalizeStatus(order.status);
    order.status = nextStatus || order.status;

    if (req.body.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    if (order.status === "Hoàn thành" && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    if (nextStatus === "Đã hủy" && previousStatus !== "Đã hủy" && order.voucherCode && order.voucherApplied && !order.voucherRefunded) {
      await restorePromotionUsage(order.voucherCode);
      order.voucherRefunded = true;
    }

    await processOrderStock(order);
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message || "Lỗi cập nhật đơn hàng" });
  }
};

// User confirms order received -> completed
const markOrderReceived = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (!order.user || String(order.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Không có quyền cập nhật đơn hàng này" });
    }

    if (normalizeStatus(order.status) === "Đã hủy") {
      return res.status(400).json({ message: "Đơn đã hủy, không thể xác nhận nhận hàng" });
    }

    order.status = "Hoàn thành";
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    await processOrderStock(order);
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message || "Lỗi cập nhật trạng thái nhận hàng" });
  }
};

// Get logged in user orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Get all orders (Admin/Staff)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id fullName").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn" });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  markOrderReceived,
  getMyOrders,
  getOrders,
};
