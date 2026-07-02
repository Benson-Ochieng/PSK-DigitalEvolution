const fs = require('fs');
const categories = JSON.parse(fs.readFileSync('content/categories/_index.json', 'utf-8'));

// Build parent-child mapping
const byId = {};
categories.forEach(c => {
  byId[c.id] = { ...c, children: [] };
});

const roots = [];
categories.forEach(c => {
  if (c.parent && byId[c.parent]) {
    byId[c.parent].children.push(byId[c.id]);
  } else {
    roots.push(byId[c.id]);
  }
});

function printNode(node, depth = 0) {
  console.log(`${'  '.repeat(depth)}- ${node.name} (slug: ${node.slug}, id: ${node.id}, count: ${node.count})`);
  node.children.forEach(child => printNode(child, depth + 1));
}

console.log("Category hierarchy:");
roots.forEach(r => {
  // Only print main categories or hierarchy under Cat (2325) and Dog (2345)
  if (r.id === 2325 || r.id === 2345 || r.slug.includes('cat') || r.slug.includes('dog')) {
    printNode(r);
  }
});
