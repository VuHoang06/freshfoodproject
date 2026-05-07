const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đọc dữ liệu sản phẩm' });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const createProduct = async (req, res) => {
    const { name, category, price, oldPrice, unit, image, sale, bestseller } = req.body;
    try {
        const product = new Product({ name, category, price, oldPrice, unit, image, sale, bestseller });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi tạo dữ liệu sản phẩm' });
    }
};

const seedProducts = async (req, res) => {
    try {
        await Product.deleteMany(); // Reset data
        const sampleProducts = [
            { name: 'Cải Chíp Hữu Cơ Thủy Canh', category: 'rau', price: 35000, unit: '500g', image: 'https://images.unsplash.com/photo-1557844352-761f2565b576?w=500&q=80', sale: false, bestseller: true },
            { name: 'Thịt Lợn Sinh Học', category: 'thit', price: 120000, oldPrice: 135000, unit: '1kg', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bd6372?w=500&q=80', sale: true, bestseller: true },
            { name: 'Cà Chua Cherry Organic', category: 'rau', price: 45000, unit: '500g', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', sale: false, bestseller: false },
            { name: 'Cá Hồi Na Uy Phi Lê', category: 'thit', price: 350000, unit: '500g', image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&q=80', sale: false, bestseller: true },
            { name: 'Bông Cải Xanh Baby', category: 'rau', price: 38000, oldPrice: 45000, unit: '500g', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', sale: true, bestseller: false },
            { name: 'Táo Envy Size Lớn', category: 'traicay', price: 210000, unit: '1kg', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=500&q=80', sale: false, bestseller: true }
        ];
        await Product.insertMany(sampleProducts);
        res.json({ message: 'Đã tạo xong dữ liệu mẫu cho sản phẩm' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo dữ liệu mẫu' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = req.body.name || product.name;
            product.category = req.body.category || product.category;
            product.price = req.body.price || product.price;
            product.oldPrice = req.body.oldPrice !== undefined ? req.body.oldPrice : product.oldPrice;
            product.unit = req.body.unit || product.unit;
            product.image = req.body.image || product.image;
            product.sale = req.body.sale !== undefined ? req.body.sale : product.sale;
            product.bestseller = req.body.bestseller !== undefined ? req.body.bestseller : product.bestseller;
            product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Xóa sản phẩm thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, seedProducts };
