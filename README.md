# FreshFood - Hệ thống Thực phẩm sạch Organic
**FreshFood** là nền tảng thương mại điện tử chuyên cung cấp thực phẩm sạch, nguồn gốc hữu cơ từ nông trại đến tận tay người tiêu dùng. Dự án tập trung vào trải nghiệm người dùng hiện đại, giao diện tinh tế và hiệu năng mượt mà.
---
## Tính năng chính
* **Mua sắm trực tuyến:** Danh mục sản phẩm đa dạng (Rau củ, Thịt tươi, Trái cây Envy...).
* **Quản lý tài khoản:** Đăng nhập, đăng ký với phân quyền (Admin, Staff, User).
* **Thanh toán & Giỏ hàng:** Hệ thống tính toán linh hoạt, giao diện tối ưu.
* **Giao diện hiện đại:** Sử dụng Tailwind CSS và font chữ **Be Vietnam Pro** chuyên biệt cho tiếng Việt.
---

## 🛠 Công nghệ sử dụng
* **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (Mongoose).
* **Tools:** Git, Bcrypt (Mã hóa mật khẩu), JWT (Xác thực người dùng).
---
## Hướng dẫn cài đặt & Kết nối
Để chạy dự án này ở máy cục bộ (Localhost), hãy làm theo các bước sau:

### 1. Yêu cầu hệ thống
* Cài đặt **Node.js** (Phiên bản 16.x trở lên).
* Cài đặt **MongoDB Compass** và đảm bảo Service đang chạy.

### 2. Tải mã nguồn
```bash
git clone <link-repo>
```
### 3. Cài đặt Backend
#Di chuyển vào thư mục backend và cài đặt thư viện:
```bash
npm install
```
###Quan trọng: Tạo file .env trong thư mục backend và dán cấu hình sau thì mới đăng nhập được:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freshfood_db
JWT_SECRET=your_secret_key_here
```
### 4. Khởi tạo dữ liệu (Seeding)
# Cài thư viện db trước: 
```bash
npm install
```
# Tại thư mục gốc hoặc thư mục database
```bash
node seed.js        # Nạp danh sách sản phẩm
node seedUsers.js   # Nạp tài khoản admin/staff mẫu
```
# Nhưng thay vì chạy 2 lệnh trên, chạy lệnh sau để cập nhật db mới nhất (Nga đã sửa lại db): 
```bash
node database/importDB.js
```
hoặc nếu bạn thay đổi db và muốn cập nhật:
```bash
node database/exportDB.js
```
### 5. Chạy ứng dụng
Chạy Server: Tại thư mục backend, gõ npm start.
Chạy Frontend: Mở file frontend/index.html bằng công cụ Live Server trên VS Code

