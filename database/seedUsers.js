const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database URI (Cùng đường dẫn với server.js)
const MONGODB_URI = 'mongodb://localhost:27017/freshfood_db';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
    fullName: { type: String },
    phone: { type: String },
    address: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const seedUsers = async () => {
    try {
        console.log('🔄 Đang kết nối tới CSDL...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối!');

        // Dọn tài khoản cũ (Tùy chọn)
        await User.deleteMany({ role: { $in: ['admin', 'staff'] } });

        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('123456', salt);
        const staffPass = await bcrypt.hash('123456', salt);

        const newUsers = [
            {
                username: 'admin',
                password: adminPass,
                role: 'admin',
                fullName: 'Quản Trị Viên Tối Cao'
            },
            {
                username: 'staff',
                password: staffPass,
                role: 'staff',
                fullName: 'Nhân Viên Cửa Hàng POS'
            }
        ];

        await User.insertMany(newUsers);
        console.log('🎉 Đã tạo thành công 2 tài khoản mới!');
        console.log('-----------------------------------');
        console.log('👤 Tài khoản Admin: admin / 123456');
        console.log('👤 Tài khoản Staff: staff / 123456');
        console.log('-----------------------------------');

        process.exit();
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

seedUsers();
