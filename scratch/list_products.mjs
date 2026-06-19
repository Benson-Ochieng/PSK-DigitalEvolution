import fs from 'fs';

const content = fs.readFileSync('production.sql', 'utf8');

// Match all INSERT INTO products ... VALUES (...); blocks
// Let's just find lines containing "Pedigree", "Whiskas", "Royal Canin" in the products list
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Pedigree') || line.includes('Whiskas') || line.includes('Royal Canin')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
