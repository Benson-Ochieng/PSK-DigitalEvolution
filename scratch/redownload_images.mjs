/**
 * Download product images by intercepting network responses
 * while navigating each Carrefour product page.
 * Run: node scratch/redownload_images.mjs
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
const clean = JSON.parse(fs.readFileSync('scratch/petfood_clean.json', 'utf8'));

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });

  console.log(`🚀 Intercepting images for ${clean.length} products...\n`);
  let ok = 0, fail = 0;

  for (let i = 0; i < clean.length; i++) {
    const product = clean[i];
    const productId = i + 1;
    const cdnUrl = product.image_url;

    const filename = `product_${productId}.jpg`;
    const localPath = path.join(OUTPUT_DIR, filename);
    const publicPath = `/images/products/${filename}`;

    if (!cdnUrl) {
      console.log(`  ⬜ [${productId}] no image`);
      continue;
    }

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 2000) {
      console.log(`  ⏭️  [${productId}] already downloaded`);
      await pool.query(`UPDATE products SET image_url = $1 WHERE id = $2`, [publicPath, productId]);
      ok++; continue;
    }

    // Navigate to the product page and intercept the image response
    const page = await context.newPage();
    let captured = false;

    // Intercept all responses from the CDN
    page.on('response', async (response) => {
      if (captured) return;
      const url = response.url();
      const ct = response.headers()['content-type'] || '';
      if (url.includes('mafrservices.com') && ct.includes('image')) {
        try {
          const buffer = await response.body();
          if (buffer.length > 2000) {
            fs.writeFileSync(localPath, buffer);
            captured = true;
          }
        } catch {}
      }
    });

    // Navigate to the actual product page on carrefour.ke
    const productPageUrl = product.carrefour_url;
    if (!productPageUrl) {
      console.log(`  ⬜ [${productId}] no product URL`);
      await page.close();
      continue;
    }

    try {
      await page.goto(productPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000); // Wait for images to load

      if (captured && fs.existsSync(localPath) && fs.statSync(localPath).size > 2000) {
        const size = fs.statSync(localPath).size;
        console.log(`  ✅ [${String(productId).padStart(2)}] ${product.name.substring(0, 48).padEnd(48)} ${Math.round(size/1024)}KB`);
        await pool.query(`UPDATE products SET image_url = $1 WHERE id = $2`, [publicPath, productId]);
        ok++;
      } else {
        // Fallback: screenshot the product image element
        const imgEl = page.locator('img[src*="mafrservices"]').first();
        const count = await imgEl.count();
        if (count > 0) {
          await imgEl.screenshot({ path: localPath });
          const size = fs.statSync(localPath).size;
          if (size > 1000) {
            console.log(`  📸 [${String(productId).padStart(2)}] ${product.name.substring(0, 48).padEnd(48)} screenshot ${Math.round(size/1024)}KB`);
            await pool.query(`UPDATE products SET image_url = $1 WHERE id = $2`, [publicPath, productId]);
            ok++;
          } else {
            throw new Error('Screenshot too small');
          }
        } else {
          throw new Error('No product image found on page');
        }
      }
    } catch (err) {
      console.log(`  ❌ [${String(productId).padStart(2)}] ${product.name.substring(0, 40)} — ${err.message.substring(0, 55)}`);
      await pool.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [productId]);
      fail++;
    }

    await page.close();
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
  await pool.end();
  console.log(`\n📊 Done — ✅ ${ok} images, ❌ ${fail} failed`);
  console.log(`   Saved to: ${OUTPUT_DIR}`);
}

run().catch(console.error);
