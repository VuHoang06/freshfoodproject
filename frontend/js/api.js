// frontend/assets/js/api.js
const API_BASE_URL = 'http://localhost:5000/api';

export const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        return await response.json();
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        return [];
    }
};