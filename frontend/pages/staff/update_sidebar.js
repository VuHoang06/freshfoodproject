const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '_sidebar.html');
const sidebarTpl = fs.readFileSync(sidebarPath, 'utf8');

fs.readdirSync(__dirname).forEach(file => {
    if (!file.endsWith('.html') || file === '_sidebar.html') return;
    
    let html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    if (!html.includes('<aside id="sidebar"')) return;
    
    // Replace sidebar
    let newHtml = html.replace(/<aside id="sidebar"[\s\S]*?<\/aside>/, sidebarTpl);
    
    // Remove old sidebar-active classes
    newHtml = newHtml.replace(/sidebar-active/g, '');
    
    // Add sidebar-active to current page link
    const pageName = file;
    // Replace <a href="pageName" class="xxx"> with <a href="pageName" class="xxx sidebar-active">
    const re = new RegExp(`href="${pageName}"([^>]*?)class="(.*?)"`);
    if(newHtml.match(re)){
        newHtml = newHtml.replace(re, `href="${pageName}"$1class="$2 sidebar-active"`);
    }

    fs.writeFileSync(path.join(__dirname, file), newHtml, 'utf8');
});

console.log('Replaced all sidebars successfully!');
