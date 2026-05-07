const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES (' + process.env.JWT_SECRET.substring(0,5) + '...)' : '❌ NOT FOUND');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ toàn bộ Giao diện Front-end như một trang Web thật có miền (http://localhost:5000)
app.use(express.static(path.join(__dirname, '../frontend')));

// Điều hướng mặc định: Khi vào dấu "/" sẽ tự bật trang chủ
app.get('/', (req, res) => {
    res.redirect('/pages/user/index.html');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const promotionRoutes = require('./routes/promotionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Database Connection & Server Setup
const startServer = async () => {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freshfood_db';

    // Tính năng Siêu Tiện Hệ thống: Tự động dùng Database RAM cho các thành viên Backend
    // Nếu biến môi trường là localhost (chưa cài DB), web sẽ tự đẻ ra 1 DB Ảo!
    // -> ĐÃ TẮT: User đã cài đặt MôngDB Thật.
    if (false) {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        console.log('🔄 Đang khởi tạo Database Ảo (Memory Server) siêu tốc cho team...');
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully to:', mongoUri.includes('127.0.0.1') ? 'VIRTUAL RAM DATABASE' : 'CLOUD DATABASE');
        
        // Tự động chèn Mock Data nếu là Database ảo để team không phải chạy seed lại
        if (mongoUri.includes('127.0.0.1')) {
            const Product = require('./models/Product');
            const fs = require('fs');
            const path = require('path');
            
            const count = await Product.countDocuments();
            if (count === 0) {
                const dataPath = path.join(__dirname, '../database/products.json');
                if (fs.existsSync(dataPath)) {
                    const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                    await Product.insertMany(products);
                    console.log('📦 Đã tự động thả dữ liệu mẫu vào Database ảo thành công!');
                }
            }
        }

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is chạy trơn tru trên cổng ${PORT}`);
        });

    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
};

startServer();
