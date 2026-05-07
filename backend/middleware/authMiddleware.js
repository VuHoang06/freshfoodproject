const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token không hợp lệ, xác thực thất bại' });
        }
    } else {
        return res.status(401).json({ message: 'Không có token, xác thực thất bại' });
    }
};

const adminOrStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
        next();
    } else {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Không có quyền truy cập' });
};

module.exports = { protect, adminOrStaff, adminOnly };
