/**
 * Parse & clean the raw Carrefour scrape data.
 * - Extracts correct prices from cardText (format: "1,260\n.00\nKES")
 * - Filters to pet food only (by URL category path)
 * - Outputs clean JSON + SQL seed
 */

import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scratch/carrefour_products.json', 'utf8'));

// Pet food URL category paths
const PET_CATEGORIES = ['dry-dog-food', 'wet-dog-food', 'dry-cat-food', 'wet-cat-food', 'animal-supplements'];
// Explicit non-pet exclusions
const EXCLUDE_KEYWORDS = ['shampoo', 'food colour', 'food color', 'msg', 'fennel', 'bhajia', 'mustard', 'fenugreek', 'muesli', 'kachumbari', 'pink salt', 'nyama choma', 'clovers', 'festival'];

function parsePrice(cardText) {
  if (!cardText) return null;
  // cardText format: "Product Name\n1,260\n.00\nKES\n..." 
  // Price appears as a standalone number (possibly with comma) before ".00" and "KES"
  const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    // Match a price line: digits possibly with comma, NOT containing letters
    if (/^[\d,]+$/.test(lines[i]) && lines[i].length >= 2) {
      const next = lines[i + 1] || '';
      // Confirm it's a price: followed by ".00" or "KES"  
      if (next.startsWith('.') || next === 'KES' || lines[i + 2] === 'KES') {
        return parseFloat(lines[i].replace(/,/g, ''));
      }
    }
  }
  return null;
}

function isPetFood(item) {
  const url = (item.url || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  
  // Must be in a pet food category URL
  const inPetCategory = PET_CATEGORIES.some(cat => url.includes(`/en/${cat}/`));
  // Must not be an excluded item
  const isExcluded = EXCLUDE_KEYWORDS.some(kw => name.includes(kw));
  
  return inPetCategory && !isExcluded;
}

function parseAnimalType(name, url) {
  const text = (name + ' ' + url).toLowerCase();
  if (text.includes('cat') || text.includes('kitten') || text.includes('feline') || text.includes('purrfect') || text.includes('purr-fect')) return 'cat';
  return 'dog';
}

function parseFoodType(name, url) {
  const text = (name + ' ' + url).toLowerCase();
  if (text.includes('wet') || text.includes('jelly') || text.includes('gravy') || text.includes('pouch')) return 'wet';
  if (text.includes('chew') || text.includes('treat') || text.includes('biltong') || text.includes('bite')) return 'treat';
  return 'dry';
}

function parseBrand(name) {
  const brands = ['Farmers Choice', 'Bravo', 'Top Dog', 'Purr-fect', 'Purrfect', 'T.L.C.', 'Scooby', 
                  'Wanpy', 'Pedigree', 'Gilani', 'Bark Bite', 'Royal Canin', 'Whiskas', 'Friskies'];
  for (const b of brands) {
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return name.split(' ')[0];
}

function parseWeight(name) {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'g' || unit === 'ml') return val / 1000;
  return val;
}

// --- Process ---
const petFoodOnly = raw.filter(isPetFood);
const cleaned = petFoodOnly.map(item => {
  const price = parsePrice(item.cardText);
  return {
    name: item.name,
    brand: parseBrand(item.name),
    weight_kg: parseWeight(item.name),
    animal_type: parseAnimalType(item.name, item.url),
    food_type: parseFoodType(item.name, item.url),
    carrefour_price: price,
    carrefour_url: item.url,
    image_url: item.image && !item.image.includes('SLA_clock') ? item.image : null,
  };
});

// Save cleaned JSON
fs.writeFileSync('scratch/petfood_clean.json', JSON.stringify(cleaned, null, 2));

// Print table
console.log(`✅ ${cleaned.length} pet food products found\n`);
console.log('─'.repeat(90));
console.log('  # | Animal | Type  | Brand                | Name                                   | KES');
console.log('─'.repeat(90));
cleaned.forEach((p, i) => {
  const price = p.carrefour_price ? `${p.carrefour_price.toLocaleString()}` : 'N/A';
  const name = p.name.substring(0, 38).padEnd(38);
  const brand = (p.brand || '').substring(0, 18).padEnd(18);
  const animal = p.animal_type.padEnd(6);
  const type = (p.food_type || '').substring(0, 5).padEnd(5);
  console.log(`${String(i+1).padStart(3)} | ${animal} | ${type} | ${brand} | ${name} | ${price}`);
});

// Generate SQL
const sqlLines = [];

sqlLines.push('-- ============================================================');
sqlLines.push('-- PetStore Kenya - Real Carrefour Kenya Data Seed');
sqlLines.push('-- Auto-generated from scraper output');
sqlLines.push('-- ============================================================');
sqlLines.push('TRUNCATE store_prices, products RESTART IDENTITY CASCADE;');
sqlLines.push('');
sqlLines.push('INSERT INTO products (name, brand, weight_kg, animal_type, food_type, image_url) VALUES');

const productRows = cleaned.map(p => {
  const esc = s => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
  return `  (${esc(p.name)}, ${esc(p.brand)}, ${p.weight_kg ?? 'NULL'}, ${esc(p.animal_type)}, ${esc(p.food_type)}, ${esc(p.image_url)})`;
});
sqlLines.push(productRows.join(',\n') + ';');
sqlLines.push('');

// Store prices: Carrefour as reference, PetStore Kenya at 80%
sqlLines.push('INSERT INTO store_prices (product_id, store_name, price, product_url, in_stock) VALUES');
const priceRows = [];
cleaned.forEach((p, i) => {
  const id = i + 1;
  if (p.carrefour_price) {
    const bbpPrice = Math.round(p.carrefour_price * 0.80);
    priceRows.push(`  (${id}, 'PetStore Kenya', ${bbpPrice}, 'https://petstore.co.ke/shop/${id}', true)`);
    priceRows.push(`  (${id}, 'Carrefour', ${p.carrefour_price}, '${p.carrefour_url}', true)`);
  }
});
sqlLines.push(priceRows.join(',\n') + ';');

fs.writeFileSync('petstore_seed.sql', sqlLines.join('\n'));
console.log('\n💾 SQL seed written to petstore_seed.sql');
