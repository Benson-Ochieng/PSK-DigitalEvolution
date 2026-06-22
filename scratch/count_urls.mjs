import fs from 'fs';

const filepath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\f27bb5ad-22aa-445e-8250-e0fd32fedd2d\\.system_generated\\steps\\75\\content.md';
const content = fs.readFileSync(filepath, 'utf8');

// Regex to extract all loc tags
const urlRegex = /<loc>(https:\/\/petstore\.co\.ke\/product\/[^/]+)/g;
const urls = [];
let match;
while ((match = urlRegex.exec(content)) !== null) {
  urls.push(match[1] + '/');
}

console.log('Total URLs found in sitemap:', urls.length);

// Let's classify them by keywords
const categories = {
  dogFoodDry: [],
  dogFoodWet: [],
  dogTreats: [],
  catFoodDry: [],
  catFoodWet: [],
  catTreats: [],
  accessories: []
};

for (const url of urls) {
  const lower = url.toLowerCase();
  if (lower.includes('dog') || lower.includes('puppy')) {
    if (lower.includes('canned') || lower.includes('can-') || lower.includes('chunks') || lower.includes('wet') || lower.includes('gravy')) {
      categories.dogFoodWet.push(url);
    } else if (lower.includes('treat') || lower.includes('chew') || lower.includes('biscuit') || lower.includes('dental')) {
      categories.dogTreats.push(url);
    } else {
      categories.dogFoodDry.push(url);
    }
  } else if (lower.includes('cat') || lower.includes('kitten')) {
    if (lower.includes('canned') || lower.includes('can-') || lower.includes('pouch') || lower.includes('chunks') || lower.includes('wet') || lower.includes('jelly') || lower.includes('gravy') || lower.includes('pate')) {
      categories.catFoodWet.push(url);
    } else if (lower.includes('treat') || lower.includes('paste') || lower.includes('pocket')) {
      categories.catTreats.push(url);
    } else {
      categories.catFoodDry.push(url);
    }
  } else {
    categories.accessories.push(url);
  }
}

for (const [key, list] of Object.entries(categories)) {
  console.log(`- ${key}: ${list.length} URLs (e.g. ${list.slice(0, 3).join(', ')})`);
}
