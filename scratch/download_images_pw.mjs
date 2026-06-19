/**
 * Download product images using Playwright (browser context with cookies)
 * so the Carrefour CDN accepts the requests.
 * Run: node scratch/download_images_pw.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const OUTPUT_DIR = path.join('public', 'images', 'products');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Get all products with CDN image URLs
  const { rows } = await pool.query(
    `SELECT id, name, image_url FROM products WHERE image_url LIKE 'http%'`
  );
  
  if (rows.length === 0) {
    console.log('No CDN images to download.');
    await pool.end();
    return;
  }

  console.log(`🚀 Launching browser to download ${rows.length} images...\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  // Visit carrefour first to get cookies
  console.log('🍪 Getting cookies from Carrefour...');
  const cookiePage = await context.newPage();
  await cookiePage.goto('https://www.carrefour.ke', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await cookiePage.waitForTimeout(2000);
  await cookiePage.close();
  console.log('   ✅ Cookies acquired\n');

  for (const product of rows) {
    const filename = `product_${product.id}.jpg`;
    const localPath = path.join(OUTPUT_DIR, filename);
    const publicPath = `/images/products/${filename}`;

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      console.log(`  ⏭️  Skip [${product.id}] ${product.name.substring(0, 40)} (already exists)`);
      await pool.query(`UPDATE products SET image_url = $1 WHERE id = $2`, [publicPath, product.id]);
      continue;
    }

    try {
      // Use browser fetch with cookies
      const page = await context.newPage();
      const response = await page.goto(product.image_url, { timeout: 20000 });
      
      if (response && response.ok()) {
        const buffer = await response.body();
        fs.writeFileSync(localPath, buffer);
        const size = fs.statSync(localPath).size;
        
        if (size > 500) {
          console.log(`  ✅ [${String(product.id).padStart(2)}] ${product.name.substring(0, 45).padEnd(45)} ${Math.round(size/1024)}KB`);
          await pool.query(`UPDATE products SET image_url = $1 WHERE id = $2`, [publicPath, product.id]);
        } else {
          console.log(`  ⚠️  [${String(product.id).padStart(2)}] ${product.name.substring(0, 45).padEnd(45)} too small (${size}B) — skipping`);
          fs.unlinkSync(localPath);
          await pool.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [product.id]);
        }
      } else {
        console.log(`  ❌ [${String(product.id).padStart(2)}] ${product.name.substring(0, 45)} → HTTP ${response?.status()}`);
        await pool.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [product.id]);
      }
      await page.close();
    } catch (err) {
      console.log(`  ❌ [${String(product.id).padStart(2)}] ${product.name.substring(0, 45)} → ${err.message.substring(0, 60)}`);
      await pool.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [product.id]);
    }
  }

  await browser.close();
  await pool.end();

  const downloaded = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`\n✅ Done! ${downloaded.length} images saved to public/images/products/`);
}

run().catch(console.error);
