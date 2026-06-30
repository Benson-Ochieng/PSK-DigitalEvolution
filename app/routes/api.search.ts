import { query } from "../db.server";

let dictionaryCache: Set<string> | null = null;
let lastDictionaryBuild = 0;

function levenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

async function getDictionary(): Promise<Set<string>> {
  const now = Date.now();
  if (dictionaryCache && (now - lastDictionaryBuild < 5 * 60 * 1000)) {
    return dictionaryCache;
  }
  const dict = new Set<string>();
  try {
    const res = await query(`SELECT name, brand, categories, tags FROM products`);
    for (const row of res.rows) {
      if (row.name) addWords(row.name, dict);
      if (row.brand) addWords(row.brand, dict);
      if (row.categories && Array.isArray(row.categories)) {
        row.categories.forEach((c: any) => c.name && addWords(c.name, dict));
      }
      if (row.tags && Array.isArray(row.tags)) {
        row.tags.forEach((t: any) => t.name && addWords(t.name, dict));
      }
    }
    dictionaryCache = dict;
    lastDictionaryBuild = now;
  } catch (err) {
    console.error("Failed to build spelling dictionary:", err);
  }
  return dictionaryCache || new Set<string>();
}

function addWords(text: string, dict: Set<string>) {
  const words = text.toLowerCase().split(/[^a-z0-9]+/i);
  for (const w of words) {
    if (w.length >= 3) {
      dict.add(w);
    }
  }
}

function correctQuery(q: string, dict: Set<string>): string {
  const words = q.split(/\s+/).filter(Boolean);
  const corrected = words.map(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanWord.length < 3) return w;
    if (dict.has(cleanWord)) return w; // exact match
    
    let bestWord = w;
    let minDistance = 3; // Threshold of 2 edits
    for (const dictWord of dict) {
      if (Math.abs(dictWord.length - cleanWord.length) >= minDistance) continue;
      const dist = levenshteinDistance(cleanWord, dictWord);
      if (dist < minDistance) {
        minDistance = dist;
        bestWord = dictWord;
      }
    }
    return bestWord;
  });
  return corrected.join(" ");
}

function getProductImage(p: any) {
  if (p.image_url && p.image_url !== "/images/psk_logo.png" && p.image_url !== "") {
    return p.image_url;
  }
  
  let galleryImages: any[] = [];
  if (typeof p.images === "string") {
    try {
      galleryImages = JSON.parse(p.images);
    } catch (e) {}
  } else if (Array.isArray(p.images)) {
    galleryImages = p.images;
  } else if (p.images && typeof p.images === "object") {
    galleryImages = [p.images];
  }
  
  if (galleryImages.length > 0 && galleryImages[0]?.src) {
    return galleryImages[0].src;
  }
  
  if (p.description) {
    const match = p.description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  
  return "/images/psk_logo.png";
}

async function searchProductsExact(searchTerm: string) {
  const words = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  
  const conditions = [];
  const params = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    params.push(`\\y${escaped}\\y`);
    
    conditions.push(`
      (
        p.name ~* $${i + 1} OR
        COALESCE(p.sku, '') ~* $${i + 1} OR
        COALESCE(p.short_description, '') ~* $${i + 1} OR
        p.id::text ~* $${i + 1} OR
        EXISTS (
          SELECT 1 FROM jsonb_to_recordset(CASE WHEN jsonb_typeof(p.categories) = 'array' THEN p.categories ELSE '[]'::jsonb END) AS cat(name text)
          WHERE cat.name ~* $${i + 1}
        ) OR
        EXISTS (
          SELECT 1 FROM jsonb_to_recordset(CASE WHEN jsonb_typeof(p.tags) = 'array' THEN p.tags ELSE '[]'::jsonb END) AS t(name text)
          WHERE t.name ~* $${i + 1}
        )
      )
    `);
  }
  
  const whereClause = conditions.join(" AND ");
  const queryStr = `
    SELECT 
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.description, p.slug, p.sku, p.short_description, p.categories, p.tags,
      bbp.price AS our_price
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE ${whereClause}
  `;
  
  const res = await query(queryStr, params);
  return res.rows;
}

async function searchProductsPartial(searchTerm: string) {
  const words = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  
  const conditions = [];
  const params = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    params.push(escaped);
    
    conditions.push(`
      (
        p.name ~* $${i + 1} OR
        COALESCE(p.sku, '') ~* $${i + 1} OR
        COALESCE(p.short_description, '') ~* $${i + 1} OR
        p.id::text ~* $${i + 1} OR
        EXISTS (
          SELECT 1 FROM jsonb_to_recordset(CASE WHEN jsonb_typeof(p.categories) = 'array' THEN p.categories ELSE '[]'::jsonb END) AS cat(name text)
          WHERE cat.name ~* $${i + 1}
        ) OR
        EXISTS (
          SELECT 1 FROM jsonb_to_recordset(CASE WHEN jsonb_typeof(p.tags) = 'array' THEN p.tags ELSE '[]'::jsonb END) AS t(name text)
          WHERE t.name ~* $${i + 1}
        )
      )
    `);
  }
  
  const whereClause = conditions.join(" AND ");
  const queryStr = `
    SELECT 
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.description, p.slug, p.sku, p.short_description, p.categories, p.tags,
      bbp.price AS our_price
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE ${whereClause}
  `;
  
  const res = await query(queryStr, params);
  return res.rows;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const trimmed = q.trim();

  if (!trimmed) {
    return Response.json({ suggestions: [], groups: [], products: [] });
  }

  let dbProducts: any[] = [];
  let finalSearchTerm = trimmed;
  let isAutocorrected = false;

  try {
    // Try 1: Exact match with whole word boundary
    dbProducts = await searchProductsExact(trimmed);

    // Try 2: If no results, attempt typo correction
    if (dbProducts.length === 0) {
      const dict = await getDictionary();
      const corrected = correctQuery(trimmed, dict);
      if (corrected.toLowerCase() !== trimmed.toLowerCase()) {
        dbProducts = await searchProductsExact(corrected);
        if (dbProducts.length > 0) {
          finalSearchTerm = corrected;
          isAutocorrected = true;
        }
      }
    }

    // Try 3: If still no results, fallback to partial matching
    if (dbProducts.length === 0) {
      dbProducts = await searchProductsPartial(trimmed);
    }
  } catch (err) {
    console.error("Search query error:", err);
    dbProducts = [];
  }

  const results = dbProducts.map(p => ({
    id: p.id,
    name: p.name || "",
    brand: p.brand || "",
    weight_kg: p.weight_kg,
    animal_type: p.animal_type || "",
    food_type: p.food_type || "",
    image_url: getProductImage(p),
    description: p.description || "",
    short_description: p.short_description || "",
    slug: p.slug || "",
    price: Number(p.our_price || 0),
    categories: p.categories || [],
    tags: p.tags || []
  }));

  // 1. Generate search suggestions based on the final search term used
  const lowerFinal = finalSearchTerm.toLowerCase();
  const brands = [...new Set(results.map(p => p.brand).filter(Boolean))].slice(0, 4);
  const foodTypes = [...new Set(results.map(p => p.food_type).filter(Boolean))].slice(0, 2);
  
  const suggestionsSet = new Set<string>();
  
  brands.forEach(b => {
    suggestionsSet.add(`${b.toLowerCase()} ${lowerFinal}`);
  });
  
  foodTypes.forEach(t => {
    suggestionsSet.add(`${lowerFinal} ${t === 'dry' || t === 'wet' ? 'food' : t}`);
  });

  if (suggestionsSet.size === 0) {
    results.slice(0, 3).forEach(p => {
      const parts = p.name.split(" ");
      if (parts.length > 2) {
        suggestionsSet.add(`${parts[0].toLowerCase()} ${parts[1].toLowerCase()}`);
      }
    });
  }

  const suggestions = Array.from(suggestionsSet).slice(0, 6);

  // 2. Generate search groups/counts
  const animalCounts: { [key: string]: number } = {};
  const foodTypeCounts: { [key: string]: number } = {};
  
  results.forEach(p => {
    if (p.animal_type) {
      const a = p.animal_type.charAt(0).toUpperCase() + p.animal_type.slice(1);
      animalCounts[a] = (animalCounts[a] || 0) + 1;
    }
    if (p.food_type) {
      const f = p.food_type.charAt(0).toUpperCase() + p.food_type.slice(1);
      foodTypeCounts[f] = (foodTypeCounts[f] || 0) + 1;
    }
  });

  const groups = [
    ...Object.entries(animalCounts).map(([name, count]) => `${name} (${count})`),
    ...Object.entries(foodTypeCounts).map(([name, count]) => `${name} (${count})`)
  ].slice(0, 3);

  return Response.json({
    suggestions,
    groups,
    products: results.slice(0, 15), // Show up to 15 products with scrollbar
    correctedQuery: isAutocorrected ? finalSearchTerm : null
  });
}
