const fs = require('fs');
const path = require('path');

const categoriesPath = path.join(__dirname, '..', 'content', 'categories', '_index.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

console.log("Bird categories:");
const birdCats = categories.filter(c => c.slug.includes("bird") || c.name.toLowerCase().includes("bird"));
birdCats.forEach(c => console.log(`  - [ID: ${c.id}] Name: ${c.name}, Slug: ${c.slug}, Parent: ${c.parent}`));

console.log("\nRabbit categories:");
const rabbitCats = categories.filter(c => c.slug.includes("rabbit") || c.name.toLowerCase().includes("rabbit"));
rabbitCats.forEach(c => console.log(`  - [ID: ${c.id}] Name: ${c.name}, Slug: ${c.slug}, Parent: ${c.parent}`));
