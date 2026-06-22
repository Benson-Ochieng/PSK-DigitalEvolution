import { query } from "../db.server";
import { mockProducts, mockStorePrices } from "../db.mock";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const trimmed = q.trim().toLowerCase();

  if (!trimmed) {
    return Response.json({ suggestions: [], groups: [], products: [] });
  }

  let dbProducts: any[] = [];
  try {
    const res = await query(`
      SELECT 
        p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.description,
        bbp.price AS our_price
      FROM products p
      JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
      WHERE p.name ILIKE $1 OR p.brand ILIKE $1 OR p.animal_type ILIKE $1 OR p.food_type ILIKE $1
    `, [`%${trimmed}%`]);
    dbProducts = res.rows;
  } catch (err) {
    // In-memory matching from mockProducts if Postgres connection fails
    dbProducts = mockProducts
      .filter(p => 
        (p.name?.toLowerCase().includes(trimmed)) ||
        (p.brand?.toLowerCase().includes(trimmed)) ||
        (p.animal_type?.toLowerCase().includes(trimmed)) ||
        (p.food_type?.toLowerCase().includes(trimmed))
      )
      .map(p => {
        const priceObj = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight_kg: p.weight_kg,
          animal_type: p.animal_type,
          food_type: p.food_type,
          image_url: p.image_url,
          description: p.description,
          our_price: priceObj ? priceObj.price : null
        };
      });
  }

  const results = dbProducts.map(p => ({
    id: p.id,
    name: p.name || "",
    brand: p.brand || "",
    weight_kg: p.weight_kg,
    animal_type: p.animal_type || "",
    food_type: p.food_type || "",
    image_url: p.image_url || "",
    description: p.description || "",
    price: Number(p.our_price || 0)
  }));

  // 1. Generate search suggestions
  const brands = [...new Set(results.map(p => p.brand).filter(Boolean))].slice(0, 4);
  const foodTypes = [...new Set(results.map(p => p.food_type).filter(Boolean))].slice(0, 2);
  
  const suggestionsSet = new Set<string>();
  
  brands.forEach(b => {
    suggestionsSet.add(`${b.toLowerCase()} ${trimmed}`);
  });
  
  foodTypes.forEach(t => {
    suggestionsSet.add(`${trimmed} ${t === 'dry' || t === 'wet' ? 'food' : t}`);
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
    products: results.slice(0, 8)
  });
}
