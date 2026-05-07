const mongoose = require('mongoose');
const fs = require('fs');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    unit: { type: String, required: true },
    image: { type: String, required: true },
    sale: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const URI = 'mongodb://localhost:27017/freshfood_db';

const seedDatabase = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(URI);
        console.log('Connected!');

        console.log('Clearing existing products...');
        await Product.deleteMany();

        console.log('Reading products.json...');
        const data = fs.readFileSync('./products.json', 'utf8');
        const products = JSON.parse(data);

        console.log('Inserting sample products...');
        await Product.insertMany(products);

        console.log('Seed completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedDatabase();
