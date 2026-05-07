const fs = require('fs');
const path = require('path');

const userDir = path.join(__dirname, 'frontend/pages/user');
const files = fs.readdirSync(userDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(userDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update the search input to include ID and onkeydown
    let modified = content.replace(
        /<input type="text" placeholder="Tìm kiếm sản phẩm..." class="([^"]+)">/g,
        '<input type="text" id="header-search" placeholder="Tìm kiếm sản phẩm..." class="$1" onkeydown="if(event.key===\'Enter\') typeof goSearch === \'function\' ? goSearch() : window.location.href=\'products.html?search=\'+encodeURIComponent(this.value.trim())">'
    );

    // 2. Update the search button to include onclick
    modified = modified.replace(
        /<button class="absolute right-3 top-1\/2 transform -translate-y-1\/2 text-slate-400 hover:text-green-600 text-lg">🔍<\/button>/g,
        '<button onclick="const q = document.getElementById(\'header-search\').value.trim(); if(q) { if(typeof goSearch === \'function\') goSearch(); else window.location.href=\'products.html?search=\'+encodeURIComponent(q); }" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-green-600 text-lg">🔍</button>'
    );

    if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log('Updated search bar in', file);
    }
});
