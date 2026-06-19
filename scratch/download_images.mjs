/**
 * Download product images from Carrefour CDN → public/images/products/
 * Then update the DB image_url to local paths.
 * Run: node scratch/download_images.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const OUTPUT_DIR = path.join('public', 'images', 'products');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Referer': 'https://www.carrefour.ke/',
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function run() {
  // Get all products with image_url from DB
  const { rows } = await pool.query(
    `SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL AND image_url LIKE 'http%'`
  );

  console.log(`📦 Downloading images for ${rows.length} products...\n`);

  for (const product of rows) {
    const ext = '.jpg';
    const filename = `product_${product.id}${ext}`;
    const localPath = path.join(OUTPUT_DIR, filename);
    const publicPath = `/images/products/${filename}`;

    if (fs.existsSync(localPath)) {
      console.log(`  ⏭️  Skip  [${product.id}] ${product.name.substring(0, 40)} (already exists)`);
      // Still update DB if it still points to CDN
      await pool.query(
        `UPDATE products SET image_url = $1 WHERE id = $2`,
        [publicPath, product.id]
      );
      continue;
    }

    try {
      await download(product.image_url, localPath);
      const size = fs.statSync(localPath).size;
      console.log(`  ✅ ${String(product.id).padStart(2)}. ${product.name.substring(0, 45).padEnd(45)} → ${filename} (${Math.round(size/1024)}KB)`);
      
      // Update DB to local path
      await pool.query(
        `UPDATE products SET image_url = $1 WHERE id = $2`,
        [publicPath, product.id]
      );
    } catch (err) {
      console.log(`  ❌ ${String(product.id).padStart(2)}. ${product.name.substring(0, 45).padEnd(45)} → ${err.message}`);
      // Set to null so app falls back to emoji
      await pool.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [product.id]);
    }
  }

  await pool.end();
  console.log(`\n✅ Done! Images saved to: ${OUTPUT_DIR}`);
  console.log(`   DB image_url updated to local /images/products/ paths.`);
}

run().catch(console.error);
