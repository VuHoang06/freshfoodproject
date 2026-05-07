const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const getDashboardStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Calculate Revenue from completed orders only
        const completedOrders = await Order.find({ status: 'Hoàn thành' }).sort({ createdAt: -1 });
        const revenue = completedOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

        // Sales per weekday from completed orders (last 7 days)
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const revenueByDayMap = new Map();
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            revenueByDayMap.set(dayNames[d.getDay()], 0);
        }

        completedOrders.forEach((o) => {
            const d = new Date(o.createdAt);
            if (d >= start) {
                const key = dayNames[d.getDay()];
                revenueByDayMap.set(key, (revenueByDayMap.get(key) || 0) + (o.totalPrice || 0));
            }
        });

        const revenueSeries = Array.from(revenueByDayMap.entries()).map(([label, value]) => ({ label, value }));

        // latest 3 orders (recently placed)
        const latestOrders = await Order.find({}).sort({ createdAt: -1 }).limit(3).select('shippingAddress totalPrice createdAt');

        res.json({
            totalOrders,
            totalProducts,
            totalUsers,
            revenue,
            revenueSeries,
            latestOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải thống kê', error });
    }
};

module.exports = { getDashboardStats };
