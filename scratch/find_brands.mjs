import fs from 'fs';
import path from 'path';

const sqlPath = 'production.sql';
const content = fs.readFileSync(sqlPath, 'utf16le'); // try UTF-16 first, if it looks wrong we'll try utf8
console.log('UTF-16 length:', content.length);
if (content.includes('Pedigree')) {
  console.log('File is UTF-16LE!');
} else {
  const utf8Content = fs.readFileSync(sqlPath, 'utf8');
  console.log('UTF-8 length:', utf8Content.length);
  if (utf8Content.includes('Pedigree')) {
    console.log('File is UTF-8!');
  }
}
