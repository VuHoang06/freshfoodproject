/**
 * Mini Mart - Authentication & Global Systems
 * Uses localStorage keys: isLoggedIn, userName
 * Pure Frontend - No Backend required
 */

const Auth = {
  // ── User data from localStorage ──────────────────────────
  get user() {
    const name = localStorage.getItem("userName") || "Khách";
    return {
      name: name,
      rank: "Khách hàng Thân thiết",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    };
  },

  init() {
    this.syncUI();
    this.initListeners();
    this.updateCartBadges();
  },

  // ── Core Auth Check ──────────────────────────────────────
  isLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
  },

  // ── Redirect to login page ───────────────────────────────
  redirectToLogin() {
    const currentPage = window.location.href;
    const loginPath = this.getLoginPath();
    window.location.href =
      loginPath + "?redirect=1&returnUrl=" + encodeURIComponent(currentPage);
  },

  getLoginPath() {
    const path = window.location.pathname;
    if (path.includes("/pages/user/")) {
      return "login.html";
    } else if (path.includes("/pages/")) {
      return "user/login.html";
    } else {
      return "pages/user/login.html";
    }
  },

  getCheckoutPath() {
    const path = window.location.pathname;
    if (path.includes("/pages/user/")) {
      return "checkout.html";
    } else if (path.includes("/pages/")) {
      return "user/checkout.html";
    } else {
      return "pages/user/checkout.html";
    }
  },

  getCartPath() {
    const path = window.location.pathname;
    if (path.includes("/pages/user/")) {
      return "../cart.html";
    } else if (path.includes("/pages/")) {
      return "cart.html";
    } else {
      return "pages/cart.html";
    }
  },

  // ── Logout ───────────────────────────────────────────────
  logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    location.reload();
  },

  // ── Sidebar UI Sync ──────────────────────────────────────
  syncUI() {
    const accountSection = document.querySelector("#sidebar-account-section");
    if (!accountSection) {
      this.syncHeaderUI();
      return;
    }

    if (this.isLoggedIn()) {
      const user = this.user;
      accountSection.innerHTML = `
                <div class="flex items-center gap-3 mb-4">
                    <img src="${user.avatar}" class="w-10 h-10 rounded-full border-2 border-blue-400" alt="User">
                    <div class="overflow-hidden">
                        <p class="text-xs font-bold text-white truncate leading-none">${user.name}</p>
                        <p class="text-[10px] text-blue-300 uppercase mt-1 font-bold">${user.rank}</p>
                    </div>
                </div>
                <button onclick="Auth.logout()" class="w-full py-2 bg-red-500/20 hover:bg-red-500 text-red-200 font-bold rounded-xl text-[10px] transition-all border border-red-500/30 font-headline uppercase tracking-widest">Đăng xuất</button>
            `;
    } else {
      accountSection.innerHTML = `
                <div class="mb-4">
                    <p class="text-[10px] text-blue-300 uppercase font-bold text-center mb-2">Đăng nhập để nhận ưu đãi</p>
                    <button onclick="Auth.redirectToLogin()" class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm" style="font-size:16px!important;">login</span>
                        ĐĂNG NHẬP
                    </button>
                </div>
                <p class="text-[9px] text-blue-400 text-center">Hoặc <button onclick="Auth.redirectToRegister()" class="text-white hover:underline font-bold bg-transparent border-none cursor-pointer p-0">Đăng ký thành viên mới</button></p>
            `;
    }

    this.syncHeaderUI();
  },

  // ── Header Account Section (top-right) ───────────────────
  syncHeaderUI() {
    const headerAccount = document.getElementById("header-account-section");
    if (!headerAccount) return;

    if (this.isLoggedIn()) {
      const user = this.user;
      headerAccount.innerHTML = `
                <div class="text-right hidden sm:block">
                    <p class="text-xs font-bold text-slate-900 leading-none">${user.name}</p>
                    <p class="text-[10px] text-slate-400 mt-1 uppercase font-bold">Thành viên</p>
                </div>
                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
                    <img src="${user.avatar}" alt="Avatar">
                </div>
            `;
    } else {
      headerAccount.innerHTML = `
                <button onclick="Auth.redirectToLogin()" class="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200">
                    <span class="material-symbols-outlined" style="font-size:18px!important;">login</span>
                    Đăng nhập
                </button>
            `;
    }
  },

  redirectToRegister() {
    const currentPage = window.location.href;
    const loginPath = this.getLoginPath();
    window.location.href =
      loginPath +
      "?redirect=1&tab=register&returnUrl=" +
      encodeURIComponent(currentPage);
  },

  // ── Global Click Interceptor for [data-auth] ─────────────
  initListeners() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-auth="true"]');
      if (btn && !this.isLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();
        this.redirectToLogin();
      }
    });

    // Initialize Favorites from LocalStorage
    const favorites = JSON.parse(
      localStorage.getItem("mini_mart_favorites") || "[]",
    );
    document.querySelectorAll("[data-fav-id]").forEach((btn) => {
      const id = btn.dataset.favId;
      if (favorites.includes(id)) {
        btn.classList.add("text-red-500");
        const icon = btn.querySelector("span");
        if (icon) icon.style.fontVariationSettings = "'FILL' 1";
      }
    });
  },

  // ── Favorite Toggle ──────────────────────────────────────
  toggleFavorite(btn, productId) {
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    let favorites = JSON.parse(
      localStorage.getItem("mini_mart_favorites") || "[]",
    );
    const isFav = favorites.includes(productId);

    if (isFav) {
      favorites = favorites.filter((id) => id !== productId);
      btn.classList.remove("text-red-500");
      const icon = btn.querySelector("span");
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    } else {
      favorites.push(productId);
      btn.classList.add("text-red-500");
      const icon = btn.querySelector("span");
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    }

    localStorage.setItem("mini_mart_favorites", JSON.stringify(favorites));
  },

  // ── Cart Badge Update ────────────────────────────────────
  updateCartBadges() {
    const cart = JSON.parse(localStorage.getItem("mini_mart_cart") || "[]");
    const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    document
      .querySelectorAll("#cart-count, #cart-fab-count, .cart-badge")
      .forEach((b) => {
        b.textContent = total > 0 ? total : "0";
      });
  },

  // ── Add to Cart (with auth check) ────────────────────────
  addToCart(productId, productName, price, image) {
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return false;
    }

    let cart = JSON.parse(localStorage.getItem("mini_mart_cart") || "[]");
    const existing = cart.find((i) => i.id === productId);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: price,
        image: image,
        qty: 1,
      });
    }
    localStorage.setItem("mini_mart_cart", JSON.stringify(cart));
    this.updateCartBadges();

    // Show toast
    this.showToast('Đã thêm "' + productName + '" vào giỏ hàng!');
    return true;
  },

  // ── Buy Now (with auth check) ────────────────────────────
  buyNow(productId, productName, price, image) {
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }
    // Add to cart then go to checkout
    let cart = JSON.parse(localStorage.getItem("mini_mart_cart") || "[]");
    const existing = cart.find((i) => i.id === productId);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: price,
        image: image,
        qty: 1,
      });
    }
    localStorage.setItem("mini_mart_cart", JSON.stringify(cart));

    // Mark this item as selected for checkout
    localStorage.setItem("mini_mart_selected", JSON.stringify([productId]));

    window.location.href = this.getCheckoutPath();
  },

  // ── Toast Notification ───────────────────────────────────
  showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className =
        "fixed top-6 right-6 z-[200] bg-[#00236f] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transform translate-x-[200%] transition-transform duration-300 font-bold text-sm";
      toast.innerHTML =
        '<span class="material-symbols-outlined">check_circle</span><span id="toastMsg"></span>';
      document.body.appendChild(toast);
    }
    const msg = document.getElementById("toastMsg");
    if (msg) msg.textContent = message;
    toast.style.transform = "translateX(0)";
    setTimeout(() => {
      toast.style.transform = "translateX(200%)";
    }, 2500);
  },
};

// ── Shared Product Data (used by cart.html & checkout.html) ───
const SAMPLE_PRODUCTS = [
  {
    id: "apple-01",
    name: "Táo Đỏ Organic Nhập Khẩu",
    price: 65000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AG8uY8z4E0zQpZ19D8C0S6P7d8S9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z",
    category: "Trái cây",
  },
  {
    id: "ice-01",
    name: "Kem Vinamilk Socola 400ml",
    price: 15000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoQFpVFTPRRUujh6g-lo7o2WiJBR6wmxZwf8BneVCklxdY6i9pKJBxEPg0ijbiFKMofH-KXV1iamk31Y3_I-FjCFnkxPRfeAC3EKfl-FTS_6LJ2yAIOxjLA7QTT3v4ZR3-H-zjRFivlbpHNfsDbj-79SrceUUWgyHv-2n6ehGWaESZfdgRjpkaZPbfNbxuCoS6GVIIDoowCveXK1swAuxwnAz5vIJfv3429bCiwGHxhBeZCJS7hJDmFu0isz-Bq7_XdCj6gVKT6UYw",
    category: "Kem",
  },
  {
    id: "water-01",
    name: "Nước Khoáng Lavie 500ml",
    price: 6000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAunflwHBTQqowNBj4mJD_K5ZMnPbYMa0zzGa2c7KbBriS5hUfwwSwxjcbFaLaDnK2c0xNjO4cjpu8odYj6ghAU91s05WSW05gfsXzvoNx2NY6uKq3EgbOh7ks1aOdVRs7gQ59fGFxyN8yRFHGYFNcs2F8KCmzSZzs08ZoSYMJwDV4du8ZsPgKUOVE-qFX3MZSfjSDMq0VWN0u206Hcw9TH4WfAGGKlSroBfjn6H_HbdSg8Gl0N1xQrfIGmlXTuV9QJIQ6FjiCAvy3Y",
    category: "Nước giải khát",
  },
  {
    id: "noodle-01",
    name: "Mì Hảo Hảo Tôm Chua Cay",
    price: 4500,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHdJAMUnFm6QRi3UssgTu_IkOUvIGYABI6r9sPYlwXERa6xtRz5-EclqNjaCvMrkSM90UTeIcr53paWMQpEV9DNa93GzbRpoXSIsvjMV__tSGBoDZpbJf4SaJ3_5dt54YjKIXNnKNrnWWXjZgvchUrS-69VEkvT85Em6yPjNuEbrAjUg7cTKdhcrzlzQD4AciFTGel-tKXW1UvO-I7fEG0LePBcnCCZE-FHcycxjljMYEh-FV-i8L0uGzZM8F7TTc1mqfYbmX6RQsi",
    category: "Mì gói",
  },
  {
    id: "candy-01",
    name: "Kẹo Dẻo Oishi Trái Cây Mix",
    price: 12000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEzHpppdH21R0MP5ced66Cd0DKgNZcWUDj7PvQvOMfHO_Wh0aEsDfZw--PAtIjtCNos3-ug7MY8oUdzaMBmm1LPPTq-cfAZZsuErTWvDLnohrFxU3wuCmmLhRslxEyzff17kTkpuW6tuKW0eOGCbUkL3RmIrLTr-GglFtaVTA5Tprpn3zHattBfbhbX8qjJAJacEtX7fbr4REfBZq4weIV7wWXytdRS9wVQGPyli7iBIgpxsEI2n5KXPHF_TbmUqoTZe1tUmKyAez8",
    category: "Bánh kẹo",
  },
  {
    id: "sua-01",
    name: "Sữa Tươi TH Ít Đường 1L",
    price: 32000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDOJb7R2bo3Wo_kPWjTvGpmzqCniXYL_dldDlP65ztM6NN2yrbocw05wSiWWTkptOVJfpF8G4YYjnOnOHF6gTs6yN9NaiaPCTFKhTZ8gZDrIwwlEtdYbt3CoDrnOQYHYlan3tem1fbZefm29gzTZKZ1s6oEfk4zDl9zd-lBX4JuzEYNdhjPFGfJ4TI7Nss2iVraG9SaXvgbJgkEBrYBKLojAODgxu62YkHw4lvcrwUt9I72K0eynyKTV2nywAamODzbFWVQUpx6rCqX",
    category: "Sữa tươi",
  },
  {
    id: "kitkat-01",
    name: "Bánh KitKat Socola 4 Thanh",
    price: 18500,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD-bTnzgpfGzJnCet0xuGKuwKlbpxMYrielh-Aj6CB3LXJsoaJxRzEHGb65Ts5R-Ucw8v4wUdg5SNFTFRkE2DWMpktV-CmbrZMMQjpHz31EDBKn6f-0OAeAM3g1eOUS8-wYe6fUN2YbcDtlXD0KxHh7LwjYLzgmmfpGIr2VhYcupnVFVoF7RGxA2R2H-diEYtIYWi0E8TyNnx6a6g36_s3jiUhySEI1yhbqBnc2pVoUPGIZpqXfqwvBM-qiITl5dcXRn-inkmcypDDC",
    category: "Bánh kẹo",
  },
  {
    id: "coke-01",
    name: "Coca-Cola Lon 330ml",
    price: 10000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvCD5HODbF8Dtc-SCmBqJHCTK9LT5FDXNzWeY2tdXRD24joAGsymZMMCrBUvTMIHCfQJSlmduHmhnAD_1f-4yJZsmUE2mOHJJkWfC_QZDfIQyFYJqrsI9GJb1HsW_7Stsi99PoqCaCpmEzXPGJrnVFl7J-rH13tbORdLy7qzDugs24BrEGSsJAPoH_ZFVQmr88PZIdHmVPlCj-huryKm_DuTpMP4vnRGm-zY7botRQ8CGUFGrBkfOZUXz_kqgBv4lbxt6cgnG_TN2a",
    category: "Nước giải khát",
  },
  {
    id: "lays-01",
    name: "Snack Khoai Tây Lay's Tự Nhiên",
    price: 14000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8ssUUhLbYq4pokbVVzDqe7Owomn0YVXDBa9iKh_OU4g31p4qm1jlHwwz9dImx6Ixx9_drtPQKuK44HjGvVHW237UN26XFHD8skmWFomJ0MvCZOy8Mktnl6II4IoMe2NcReslqcul-RemqLfmmgtijXadx_e2Cpvh2yR7T0mpHakISvA2bmLAgW6Eb24nl-00OpZDr7zXO1-BOuz_5Y5UBLO6SUlpGLZVfQVBOe4MM-iVVtt_CgjqququGl3p12_ADIJJoWDUs9urR",
    category: "Bánh kẹo",
  },
];
// --- SAU ĐOẠN Auth CŨ, DÁN THÊM ĐOẠN NÀY ---

const ShiftSystem = {
  config: {
    Morning: { start: 6, end: 12, label: "Ca Sáng (06:00 - 12:00)" },
    Afternoon: { start: 12, end: 18, label: "Ca Chiều (12:00 - 18:00)" },
    Evening: { start: 18, end: 23, label: "Ca Tối (18:00 - 23:00)" },
  },

  isShiftAvailable(key) {
    const hour = new Date().getHours();
    const s = this.config[key];
    return hour >= s.start && hour < s.end;
  },

  showShiftModal() {
    // Nếu chưa đăng nhập hoặc đã chọn ca rồi thì thôi
    if (!Auth.isLoggedIn() || sessionStorage.getItem("currentShift")) return;

    const modalHtml = `
            <div id="shift-modal" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);">
                <div style="background:white;padding:30px;border-radius:20px;width:350px;text-align:center;box-shadow:0 20px-25px rgba(0,0,0,0.5);">
                    <h3 style="margin-bottom:20px;font-weight:bold;">CHỌN CA LÀM VIỆC</h3>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        ${Object.keys(this.config)
                          .map((key) => {
                            const available = this.isShiftAvailable(key);
                            return `
                                <button 
                                    ${available ? `onclick="ShiftSystem.selectShift('${key}')"` : "disabled"}
                                    style="padding:15px; border-radius:10px; border:1px solid #ddd; font-weight:bold; cursor:${available ? "pointer" : "not-allowed"}; 
                                    background:${available ? "#eff6ff" : "#f1f5f9"}; 
                                    color:${available ? "#1e40af" : "#94a3b8"};
                                    opacity:${available ? "1" : "0.5"};
                                    pointer-events:${available ? "auto" : "none"};"
                                >
                                    ${this.config[key].label} ${available ? "✅" : "🔒"}
                                </button>
                            `;
                          })
                          .join("")}
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  selectShift(key) {
    sessionStorage.setItem("currentShift", key);
    document.getElementById("shift-modal").remove();
    Auth.showToast("Bắt đầu ca làm: " + this.config[key].label);
  },
};

// Cập nhật lại hàm init gốc của Auth để gọi cái Modal này
const originalAuthInit = Auth.init;
Auth.init = function () {
  originalAuthInit.apply(this); // Chạy những gì vốn có của Auth
  if (this.isLoggedIn()) {
    setTimeout(() => ShiftSystem.showShiftModal(), 500);
  }
};
// Auto-init on every page
document.addEventListener("DOMContentLoaded", () => Auth.init());
