import fs from 'fs';
import path from 'path';

const categories = JSON.parse(fs.readFileSync('content/categories/_index.json', 'utf8'));

console.log("Total categories in JSON:", categories.length);

const dogRelated = categories.filter(c => 
  c.slug.includes('dog') || 
  c.name.toLowerCase().includes('dog') ||
  c.name.toLowerCase().includes('kennel') ||
  c.name.toLowerCase().includes('carrier')
);

console.log("Found matches:");
dogRelated.slice(0, 30).forEach(c => {
  console.log(`ID: ${c.id}, Name: ${c.name}, Slug: ${c.slug}, Parent: ${c.parent}`);
});
