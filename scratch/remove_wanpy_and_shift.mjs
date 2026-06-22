import fs from 'fs';

let content = fs.readFileSync('production.sql', 'utf8');

// Step 1: Remove Wanpy product from the products insert statement
const insertStart = "INSERT INTO products\n  (name, brand, weight_kg, animal_type, food_type, image_url,\n   description, nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture,\n   key_ingredients, feeding_guide, replaces_brand, replaces_reason)\nVALUES\n(";
const insertEnd = ");";

const startIndex = content.indexOf(insertStart);
const endIndex = content.indexOf(insertEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const productsSection = content.substring(startIndex + insertStart.length - 1, endIndex);
  const products = productsSection.split(/\),\s*\n\s*\(/);
  console.log(`Current products count: ${products.length}`);

  const filteredProducts = products.filter(p => {
    // Check if the product is Wanpy
    if (p.includes("'Wanpy'") && p.includes("'Wanpy Super Premium")) {
      console.log(`Removing Wanpy product: ${p.substring(0, 80)}...`);
      return false;
    }
    return true;
  });

  console.log(`New products count: ${filteredProducts.length}`);
  const newProductsSection = filteredProducts.join("),\n(");
  content = content.substring(0, startIndex + insertStart.length - 1) + newProductsSection + content.substring(endIndex);
} else {
  console.error("Products section not found!");
}

// Step 2: Remove Wanpy's price lines from store_prices
// In the current file (since Pedigree was already removed, Wanpy is ID 11)
// Let's filter out price lines starting with (11,
const lines = content.split('\n');
const filteredLines = lines.filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('(11,')) {
    console.log(`Removing price line: ${trimmed}`);
    return false;
  }
  return true;
});

// Step 3: Shift all price lines with product ID > 11 by subtracting 1
const processedLines = filteredLines.map(line => {
  const trimmed = line.trim();
  const match = trimmed.match(/^\((\d+),\s*'(PetStore Kenya|Carrefour|Jumia|Naivas)',/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (id > 11) {
      const newId = id - 1;
      const index = line.indexOf(`(${id},`);
      if (index !== -1) {
        return line.substring(0, index) + `(${newId},` + line.substring(index + `(${id},`.length);
      }
    }
  }
  return line;
});

fs.writeFileSync('production.sql', processedLines.join('\n'), 'utf8');
console.log('Successfully removed Wanpy and shifted price IDs in production.sql');
