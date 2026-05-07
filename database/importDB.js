/**
 * Import dữ liệu từ file JSON vào MongoDB freshfood_db
 * Chạy: node database/importDB.js
 * ⚠️ Script này sẽ XÓA dữ liệu cũ trong các collection trước khi import!
 */
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017/freshfood_db';
const DATA_DIR = path.join(__dirname, 'exported_data');

/**
 * Chuyển đổi các trường _id (và các trường tham chiếu) từ string sang ObjectId
 * để Mongoose findById() hoạt động đúng.
 */
function convertIds(doc) {
    const converted = { ...doc };
    // Chuyển _id sang ObjectId
    if (converted._id && typeof converted._id === 'string' && ObjectId.isValid(converted._id)) {
        converted._id = new ObjectId(converted._id);
    }
    // Chuyển các trường tham chiếu phổ biến (user, product, ...)
    const refFields = ['user', 'product'];
    refFields.forEach(field => {
        if (converted[field] && typeof converted[field] === 'string' && ObjectId.isValid(converted[field])) {
            converted[field] = new ObjectId(converted[field]);
        }
    });
    // Chuyển items bên trong mảng (ví dụ: order.items[].product)
    if (Array.isArray(converted.items)) {
        converted.items = converted.items.map(item => {
            const newItem = { ...item };
            if (newItem.product && typeof newItem.product === 'string' && ObjectId.isValid(newItem.product)) {
                newItem.product = new ObjectId(newItem.product);
            }
            return newItem;
        });
    }
    return converted;
}

async function importDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB:', MONGODB_URI);

        const db = mongoose.connection.db;

        if (!fs.existsSync(DATA_DIR)) {
            console.error('❌ Thư mục exported_data không tồn tại! Hãy chạy exportDB.js trước.');
            process.exit(1);
        }

        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
        
        console.log(`📦 Tìm thấy ${files.length} file dữ liệu:`);

        for (const file of files) {
            const collectionName = path.basename(file, '.json');
            const filePath = path.join(DATA_DIR, file);
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            if (!Array.isArray(rawData) || rawData.length === 0) {
                console.log(`   ⏭️  ${collectionName}: bỏ qua (rỗng)`);
                continue;
            }

            // Chuyển đổi _id từ string sang ObjectId trước khi import
            const data = rawData.map(convertIds);

            // Xóa collection cũ rồi insert mới
            try {
                await db.collection(collectionName).drop();
            } catch (e) {
                // Collection chưa tồn tại thì bỏ qua
            }
            
            await db.collection(collectionName).insertMany(data);
            console.log(`   ✅ ${collectionName}: import ${data.length} documents`);
        }

        console.log('\n🎉 Import thành công!');
        
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

importDB();
