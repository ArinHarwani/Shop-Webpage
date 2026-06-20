const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AddNewItem.jsx', 'utf8');
content = content.replace(/\\\$/g, '$');
content = content.replace(/\\`/g, '`');
fs.writeFileSync('src/pages/admin/AddNewItem.jsx', content);
