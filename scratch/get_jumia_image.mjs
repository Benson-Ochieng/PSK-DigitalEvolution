import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';

async function run() {
  const url = 'https://www.jumia.co.ke/generic-robeliz-omena-dog-food-10kg-327641759.html';
  console.log(`Visiting Jumia page: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Get image URL
  // Jumia PDP main image has a specific class or selector. Typically it's in a gallery, let's find it.
  const imageUrls = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('#img-holder img, [data-src], .-gallery img'));
    return images.map(img => img.getAttribute('data-src') || img.getAttribute('src')).filter(Boolean);
  });

  console.log('Found images:', imageUrls);

  // Let's also get the product title and details just to confirm
  const title = await page.locator('h1').innerText().catch(() => '');
  console.log('Title:', title);

  const price = await page.locator('[data-price]').first().innerText().catch(() => '');
  console.log('Price:', price);

  await browser.close();
}

run().catch(console.error);
