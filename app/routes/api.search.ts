import {
  getDictionary,
  correctQuery,
  getProductImage,
  searchProductsExact,
  searchProductsPartial,
  getSearchCache,
  setSearchCache
} from "../lib/search.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const trimmed = q.trim();

  if (!trimmed) {
    return Response.json({ suggestions: [], groups: [], products: [] });
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = getSearchCache(cacheKey);
  if (cached) {
    return Response.json(cached);
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

  const responseData = {
    suggestions,
    groups,
    products: results.slice(0, 15), // Show up to 15 products with scrollbar
    correctedQuery: isAutocorrected ? finalSearchTerm : null
  };

  setSearchCache(cacheKey, responseData);

  return Response.json(responseData);
}
