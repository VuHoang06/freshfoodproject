import { fetchProducts } from './api.js';

const renderProducts = async () => {
    const container = document.getElementById('product-container');
    const products = await fetchProducts();

    if (products.length === 0) {
        container.innerHTML = "<p>Không có sản phẩm nào.</p>";
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="bg-white p-4 rounded-lg shadow">
            <img src="${product.image}" class="w-full h-48 object-cover rounded">
            <h3 class="font-bold mt-2">${product.name}</h3>
            <p class="text-green-600">${product.price.toLocaleString()}đ</p>
        </div>
    `).join('');
};

window.addEventListener('DOMContentLoaded', renderProducts);