const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update Logo Name
    content = content.replace(/MINI MART/g, 'FreshFood');

    // 2. Remove POS Bán lẻ in sidebar
    const posRegex = /<a href="create-order\.html"[\s\S]*?POS Bán lẻ[\s\S]*?<\/a>/;
    content = content.replace(posRegex, '');

    // 3. Add to User Store in logout section
    const logoutRegex = /<button onclick="logoutAdmin\(\)" class="flex items-center gap-4 w-full py-3 px-4 text-red-500 hover:bg-red-50 rounded-xl transition-all">[\s\S]*?<span class="material-symbols-outlined text-xl">logout<\/span>[\s\S]*?<span class="text-sm font-bold">Đăng xuất<\/span>[\s\S]*?<\/button>/;
    
    const newLogout = `<a href="../user/index.html" class="flex items-center gap-4 w-full py-3 px-4 text-slate-500 hover:bg-slate-50 hover:text-green-700 rounded-xl transition-all mb-2">
                <span class="material-symbols-outlined text-xl">storefront</span>
                <span class="text-sm font-bold">Cửa hàng</span>
            </a>
            <button onclick="logoutAdmin()" class="flex items-center gap-4 w-full py-3 px-4 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <span class="material-symbols-outlined text-xl">logout</span>
                <span class="text-sm font-bold">Đăng xuất</span>
            </button>`;

    content = content.replace(logoutRegex, newLogout);

    // 4. Update Admin name to be dynamic ID
    const nameRegex = /<p class="text-sm font-extrabold text-slate-900 leading-none uppercase">Admin<\/p>/;
    content = content.replace(nameRegex, '<p id="admin-header-name" class="text-sm font-extrabold text-slate-900 leading-none uppercase">Admin</p>');

    // Optional: inject dynamic name code if not there
    if (!content.includes('Set Admin Name')) {
        const scriptToAdd = `
        <script>
            // Set Admin Name
            document.addEventListener('DOMContentLoaded', () => {
                const uStr = localStorage.getItem('currentUser');
                if (uStr) {
                    const u = JSON.parse(uStr);
                    const el = document.getElementById('admin-header-name');
                    if (el) el.innerText = u.displayName || u.username || 'Admin';
                }
            });
        </script>
    </body>`;
        content = content.replace(/<\/body>/, scriptToAdd);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
});
