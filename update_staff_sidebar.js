const fs = require('fs');
const path = require('path');

const staffDir = path.join(__dirname, 'frontend/pages/staff');
const files = fs.readdirSync(staffDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(staffDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update Logo Name
    let modified = content.replace(/MINI MART/g, 'FreshFood');
    
    // Also change "Ca Làm Việc" or something if needed?
    // Let's just fix the logo for now.
    
    if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log('Updated', file);
    }
});
