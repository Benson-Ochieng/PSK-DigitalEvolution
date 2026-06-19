/**
 * Carrefour Kenya Pet Food Scraper v3
 * The page loads correctly - products just need scroll + extra wait.
 * Run: node scratch/carrefour_scraper.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = `https://www.carrefour.ke/mafken/en/search?filter=country_origin%3A%27Kenya%27&currentPage=PAGE&keyword=pet+food`;

async function extractProducts(page) {
  return await page.evaluate(() => {
    const results = [];

    // Dump all text so we can inspect the structure
    const allLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
    
    allLinks.forEach(link => {
      // Walk up to find the product card container
      let card = link;
      for (let i = 0; i < 5; i++) {
        card = card.parentElement;
        if (!card) break;
        const text = card.innerText || '';
        // A product card should have a price (KES or numbers)
        if (text.match(/\d{2,}/) && text.length > 10 && text.length < 500) {
          break;
        }
      }

      const cardText = card?.innerText || '';
      const img = link.closest('[class]')?.querySelector('img')?.src || 
                  card?.querySelector('img')?.src;

      // Extract price — look for KES pattern or standalone number
      const priceMatch = cardText.match(/KES\s*([\d,]+(?:\.\d+)?)|(\d{2,4}(?:,\d{3})*(?:\.\d+)?)/);
      const price = priceMatch 
        ? parseFloat((priceMatch[1] || priceMatch[2]).replace(/,/g, ''))
        : null;

      // Product name: first meaningful text line before price
      const lines = cardText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      const name = lines[0] || '';

      if (name && link.href && !results.find(r => r.url === link.href)) {
        results.push({
          name,
          price,
          priceRaw: priceMatch?.[0] || '',
          url: link.href,
          image: img || null,
          cardText: cardText.substring(0, 200),
        });
      }
    });

    // Also try by class names that contain product-like patterns
    if (results.length === 0) {
      // Get all elements with 'product' in their class
      const productEls = document.querySelectorAll('[class*="product"], [class*="Product"], [class*="item-card"], [class*="ItemCard"]');
      productEls.forEach(el => {
        const nameEl = el.querySelector('h3, h2, [class*="name"], [class*="Name"], [class*="title"]');
        const priceEl = el.querySelector('[class*="price"], [class*="Price"]');
        const link = el.querySelector('a');
        const img = el.querySelector('img');
        
        const name = nameEl?.textContent?.trim();
        const priceRaw = priceEl?.textContent?.trim();
        const priceMatch = priceRaw?.match(/[\d,]+(?:\.\d+)?/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
        
        if (name && name.length > 3) {
          results.push({ name, price, priceRaw, url: link?.href, image: img?.src });
        }
      });
    }

    return results;
  });
}

async function scrape() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-KE',
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  const allProducts = [];

  for (let pageNum = 0; pageNum <= 5; pageNum++) {
    const url = BASE_URL.replace('PAGE', pageNum);
    console.log(`\n📄 Page ${pageNum}: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Accept cookies if banner appears
    await page.getByText('Accept All Cookies').click().catch(() => {});
    await page.waitForTimeout(1000);

    // Scroll slowly to trigger lazy-load
    console.log('  ⏬ Scrolling to trigger lazy load...');
    for (let scroll = 0; scroll < 5; scroll++) {
      await page.evaluate((step) => window.scrollBy(0, step * 400), scroll);
      await page.waitForTimeout(800);
    }
    await page.waitForTimeout(3000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: `scratch/carrefour_p${pageNum}.png`, fullPage: true });

    // Save HTML
    const html = await page.content();
    fs.writeFileSync(`scratch/carrefour_p${pageNum}.html`, html);
    console.log(`  💾 HTML: ${Math.round(html.length / 1024)}KB`);

    // Check for product links
    const productLinkCount = await page.evaluate(() =>
      document.querySelectorAll('a[href*="/p/"]').length
    );
    console.log(`  🔗 Product links found: ${productLinkCount}`);

    if (productLinkCount === 0 && pageNum === 0) {
      // Dump visible text for inspection
      const bodyText = await page.evaluate(() => document.body.innerText);
      fs.writeFileSync('scratch/page0_text.txt', bodyText);
      console.log('  📝 Full page text saved to scratch/page0_text.txt');

      // Dump all classes used on page
      const classes = await page.evaluate(() => {
        const all = new Set();
        document.querySelectorAll('[class]').forEach(el => {
          el.className.split(' ').forEach(c => c.trim() && all.add(c));
        });
        return [...all].sort();
      });
      fs.writeFileSync('scratch/page0_classes.txt', classes.join('\n'));
      console.log(`  📝 ${classes.length} CSS classes saved to scratch/page0_classes.txt`);
      break;
    }

    const products = await extractProducts(page);
    console.log(`  ✅ Extracted ${products.length} products`);
    allProducts.push(...products);

    // Check if next page exists
    const hasNextPage = await page.evaluate((pn) => {
      const links = document.querySelectorAll('a[href*="currentPage"]');
      return Array.from(links).some(l => l.href.includes(`currentPage=${pn + 1}`));
    }, pageNum);

    if (!hasNextPage) {
      console.log('  🏁 No more pages');
      break;
    }
  }

  await browser.close();

  const unique = [...new Map(allProducts.map(p => [p.name?.toLowerCase().trim(), p])).values()];
  
  if (unique.length > 0) {
    fs.writeFileSync('scratch/carrefour_products.json', JSON.stringify(unique, null, 2));
    console.log(`\n🎉 Saved ${unique.length} products → scratch/carrefour_products.json`);
    console.log('\n🛒 Products:');
    console.log('─'.repeat(80));
    unique.forEach((p, i) => {
      const price = p.price ? `KES ${p.price.toLocaleString()}` : 'N/A';
      console.log(`${String(i + 1).padStart(3)}. ${(p.name || '').substring(0, 52).padEnd(52)} ${price}`);
    });
  } else {
    console.log('\n⚠️  No products extracted. Check scratch/page0_text.txt and scratch/page0_classes.txt');
  }
}

scrape().catch(console.error);
