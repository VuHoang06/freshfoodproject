/**
 * Export toàn bộ dữ liệu MongoDB freshfood_db ra file JSON
 * Chạy: node database/exportDB.js
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017/freshfood_db';
const OUTPUT_DIR = path.join(__dirname, 'exported_data');

async function exportDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB:', MONGODB_URI);

        // Tạo thư mục output
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Lấy danh sách tất cả collections
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log(`📦 Tìm thấy ${collections.length} collections:`);
        
        const summary = {};

        for (const col of collections) {
            const name = col.name;
            const data = await db.collection(name).find({}).toArray();
            
            const filePath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            
            summary[name] = data.length;
            console.log(`   ✅ ${name}: ${data.length} documents → ${name}.json`);
        }

        // Tạo file tổng hợp
        const summaryPath = path.join(OUTPUT_DIR, '_summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify({
            exportedAt: new Date().toISOString(),
            database: 'freshfood_db',
            collections: summary
        }, null, 2), 'utf-8');

        console.log('\n🎉 Export thành công! Dữ liệu lưu tại:', OUTPUT_DIR);
        console.log('📊 Tổng kết:', JSON.stringify(summary, null, 2));
        
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

exportDB();
