import fs from 'fs';

const categories = JSON.parse(fs.readFileSync('content/categories/_index.json', 'utf8'));
const cat = categories.find(c => c.slug === 'cat-supplies-store' || c.slug === 'cat');
console.log("Cat:", cat);
if (cat) {
  const children = categories.filter(c => c.parent === cat.id);
  console.log("Children of Cat:");
  children.forEach(c => console.log(`- ${c.name} (${c.slug})`));
}
