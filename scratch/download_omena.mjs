import fs from 'fs';
import path from 'path';
import https from 'https';

const url = 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/95/7146723/1.jpg?9784';
const dest = path.join('public', 'images', 'products', 'product_27.jpg');

fs.mkdirSync(path.dirname(dest), { recursive: true });

const file = fs.createWriteStream(dest);
https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
  }
}, (res) => {
  if (res.statusCode !== 200) {
    console.error(`HTTP ${res.statusCode}`);
    file.close();
    fs.unlinkSync(dest);
    process.exit(1);
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      console.log(`Successfully downloaded omena dog food image to ${dest} (${fs.statSync(dest).size} bytes)`);
      process.exit(0);
    });
  });
}).on('error', (err) => {
  console.error(err);
  file.close();
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  process.exit(1);
});
