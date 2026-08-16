const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const register = async (req, res) => {
  const {
    username,
    password,
    fullName,
    phone,
    email,
    defaultAddress,
    address,
  } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      fullName,
      phone,
      email,
      defaultAddress: defaultAddress || address || "",
      address: address || defaultAddress || "",
      role: "user",
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        defaultAddress: user.defaultAddress || user.address || "",
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
  } catch (error) {
    console.error("❌ Register Error:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Đăng nhập không thành công" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu không đúng" });

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      defaultAddress: user.defaultAddress || user.address || "",
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const { fullName, phone, email, defaultAddress, address } = req.body;

    if (typeof fullName === "string") user.fullName = fullName;
    if (typeof phone === "string") user.phone = phone;
    if (typeof email === "string") user.email = email;

    const addr =
      typeof defaultAddress === "string"
        ? defaultAddress
        : typeof address === "string"
          ? address
          : undefined;
    if (typeof addr === "string") {
      user.defaultAddress = addr;
      user.address = addr; // keep legacy sync
    }

    const saved = await user.save();
    res.json({
      _id: saved._id,
      username: saved.username,
      role: saved.role,
      fullName: saved.fullName,
      phone: saved.phone,
      email: saved.email,
      defaultAddress: saved.defaultAddress || saved.address || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Admin creates staff account
const createStaff = async (req, res) => {
  const {
    username,
    password,
    fullName,
    phone,
    email,
    defaultAddress,
    address,
  } = req.body;
  try {
    if (!username || !password)
      return res.status(400).json({ message: "Thiếu username/password" });
    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      fullName,
      phone,
      email,
      defaultAddress: defaultAddress || address || "",
      address: address || defaultAddress || "",
      role: "staff",
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      defaultAddress: user.defaultAddress || user.address || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Không thể xóa tài khoản Admin" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa hệ thống thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const { fullName, phone, email, role, password } = req.body;
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updated = await user.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật auth" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  createStaff,
  getAllUsers,
  deleteUser,
  updateUser,
};

// baitaplon
