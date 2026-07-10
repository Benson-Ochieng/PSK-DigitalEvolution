const categories = require('../content/categories/_index.json');

console.log("=== Matching categories for 'food' or 'puppy' ===");
const matches = categories.filter(c => 
  c.name.toLowerCase().includes('food') || 
  c.slug.toLowerCase().includes('food') ||
  c.name.toLowerCase().includes('puppy') ||
  c.slug.toLowerCase().includes('puppy')
);

matches.forEach(c => {
  console.log(`ID: ${c.id}, Name: "${c.name}", Slug: "${c.slug}", Parent: ${c.parent}`);
});
