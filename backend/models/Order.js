const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // null if POS anonymous
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    discountAmount: { type: Number, default: 0.0 },
    voucherCode: { type: String, default: "" },
    voucherApplied: { type: Boolean, default: false },
    voucherRefunded: { type: Boolean, default: false },
    finalPrice: { type: Number, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    orderType: { type: String, enum: ["Online", "POS"], default: "Online" },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: [
        "Chờ xử lý",
        "Đang giao",
        "Hoàn thành",
        "Đã hủy",
        "Chờ xác nhận",
        "Đang giao hàng",
      ],
      default: "Chờ xử lý",
    },
    stockDeducted: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
