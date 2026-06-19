import fs from 'fs';

let content = fs.readFileSync('production.sql', 'utf8');

// Fix escaped single quotes (replace \' with '')
content = content.replace(/\\'/g, "''");

// Let's remove product 12. Since it is in a multiline INSERT INTO products,
// let's look at the product values.
// Product 12 starts with:
// (
//   'Pedigree Vital Protection Lamb In Jelly Dog Food 100g'
// ...
// ),
// Let's write a script that splits by "),\n(" or similar to separate products, filters out Pedigree, and joins back.
// But wait, the products are separated by "),\n(". Let's do that!

const insertStart = "INSERT INTO products\n  (name, brand, weight_kg, animal_type, food_type, image_url,\n   description, nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture,\n   key_ingredients, feeding_guide, replaces_brand, replaces_reason)\nVALUES\n(";
const insertEnd = ");";

const startIndex = content.indexOf(insertStart);
const endIndex = content.indexOf(insertEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const productsSection = content.substring(startIndex + insertStart.length - 1, endIndex); // starts with "("
  
  // The products are separated by "),\n("
  const products = productsSection.split(/\),\s*\n\s*\(/);
  console.log(`Initial products count: ${products.length}`);
  
  const filteredProducts = products.filter(p => {
    // Check if the product contains 'Pedigree' as a brand or name
    // But wait, some products mention Pedigree in replaces_brand. We ONLY want to filter out the product where Pedigree is the brand.
    // The brand is the second value: 'Pedigree Vital Protection Lamb In Jelly Dog Food 100g', 'Pedigree', ...
    const lines = p.split('\n').map(l => l.trim());
    const nameLine = lines.find(l => l.startsWith("'"));
    const isPedigreeProduct = p.includes("'Pedigree'") && p.includes("'Pedigree Vital Protection");
    if (isPedigreeProduct) {
      console.log(`Removing product: ${p.substring(0, 80)}...`);
      return false;
    }
    return true;
  });
  
  console.log(`Filtered products count: ${filteredProducts.length}`);
  
  const newProductsSection = filteredProducts.join("),\n(");
  content = content.substring(0, startIndex + insertStart.length - 1) + newProductsSection + content.substring(endIndex);
} else {
  console.error("Products section not found!");
}

// Now let's remove the prices for product 12 from store_prices.
// The prices are like:
//   (12, 'Pet Food Bag', 192,  'https://petfoodbag.co.ke/shop/12', true),
//   (12, 'Carrefour',    240,  'https://www.carrefour.ke/mafken/en/wet-dog-food/pedigree-adult-lam-livr-n-jelly100g/p/45403', true),
// We can use a regex to match and remove lines starting with (12,
const lines = content.split('\n');
const filteredLines = lines.filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('(12,')) {
    console.log(`Removing price line: ${trimmed}`);
    return false;
  }
  return true;
});

content = filteredLines.join('\n');

fs.writeFileSync('production.sql', content, 'utf8');
console.log('Successfully updated production.sql');
