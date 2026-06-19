import fs from 'fs';

let content = fs.readFileSync('production.sql', 'utf8');

// Replace PNG with JPG for product 27
content = content.replace(/\/images\/products\/product_27\.png/g, '/images/products/product_27.jpg');

fs.writeFileSync('production.sql', content, 'utf8');
console.log('Updated production.sql image extension.');

// Copy to petfood_seed.sql
fs.copyFileSync('production.sql', 'petfood_seed.sql');
console.log('Synced petfood_seed.sql.');
