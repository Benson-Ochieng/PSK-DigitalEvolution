import fs from 'fs';

const content = fs.readFileSync('production.sql', 'utf8');

// We want to parse the products insert block and prices insert block.
// A simpler way: we can write a script to find and clean up production.sql
// Let's print out all products in production.sql to see their details.
const regex = /\((?:\s*['"][\s\S]*?['"]\s*,?)+?\)/g;
const matches = content.match(regex);
console.log('Matches count:', matches ? matches.length : 0);
