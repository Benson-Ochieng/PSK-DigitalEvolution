import fs from 'fs';

let content = fs.readFileSync('production.sql', 'utf8');

const lines = content.split('\n');
const processedLines = lines.map(line => {
  const trimmed = line.trim();
  // Match lines like: (13, 'PetStore Kenya', ...
  // or: (13, 'Carrefour', ...
  const match = trimmed.match(/^\((\d+),\s*'(PetStore Kenya|Carrefour|Jumia|Naivas)',/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (id > 12) {
      const newId = id - 1;
      // Replace the first occurrence of `(id,` with `(newId,`
      const index = line.indexOf(`(${id},`);
      if (index !== -1) {
        return line.substring(0, index) + `(${newId},` + line.substring(index + `(${id},`.length);
      }
    }
  }
  return line;
});

fs.writeFileSync('production.sql', processedLines.join('\n'), 'utf8');
console.log('Successfully shifted price IDs in production.sql');
