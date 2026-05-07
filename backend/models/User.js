const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
    fullName: { type: String },
    phone: { type: String },
    email: { type: String },
    defaultAddress: { type: String },
    // legacy field (older UI may still write/read this)
    address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
