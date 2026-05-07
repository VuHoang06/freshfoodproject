const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    unit: { type: String, required: true },
    image: { type: String, required: true },
    stock: { type: Number, default: 0 },
    sale: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
