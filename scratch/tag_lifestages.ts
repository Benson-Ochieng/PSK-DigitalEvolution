import pool from "../app/db.server";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("🏷️ Starting life-stage database auto-tagging based on product details...");

  const client = await pool.connect();
  try {
    // Fetch all products
    const { rows: products } = await client.query(
      `SELECT id, name, categories, tags, food_type FROM products`
    );
    console.log(`Fetched ${products.length} products to evaluate.`);

    let updatedCount = 0;

    for (const p of products) {
      const nameLower = p.name.toLowerCase();
      const currentTags = Array.isArray(p.tags) ? p.tags : [];
      const newTags = [...currentTags];

      const hasTag = (slug: string) => newTags.some(t => t.slug === slug);
      const addTag = (name: string, slug: string) => {
        if (!hasTag(slug)) {
          newTags.push({ name, slug });
          return true;
        }
        return false;
      };

      let changed = false;

      // 1. Puppy
      if (nameLower.includes("puppy") || nameLower.includes("puppies")) {
        if (addTag("puppy", "puppy")) changed = true;
      }

      // 2. Kitten
      if (nameLower.includes("kitten") || nameLower.includes("kittens")) {
        if (addTag("kitten", "kitten")) changed = true;
      }

      // 3. Junior
      if (nameLower.includes("junior")) {
        if (addTag("junior", "junior")) changed = true;
      }

      // 4. Senior
      if (nameLower.includes("senior") || nameLower.includes("older") || nameLower.includes("mature")) {
        if (addTag("senior", "senior")) changed = true;
      }

      // 5. Adult
      // Check if it's a food/treat/litter/supplement/etc item and we can infer "adult"
      const isFoodOrSupp = p.name.toLowerCase().includes("food") || 
                           p.name.toLowerCase().includes("treat") || 
                           p.name.toLowerCase().includes("croquettes") || 
                           p.name.toLowerCase().includes("gravy") || 
                           p.name.toLowerCase().includes("kibble") || 
                           p.food_type === "dry" || 
                           p.food_type === "wet" ||
                           (Array.isArray(p.categories) && p.categories.some((c: any) => c.slug.includes("food") || c.slug.includes("treat")));

      if (isFoodOrSupp) {
        // If it specifically mentions "adult" or is NOT puppy/kitten/junior/senior
        if (nameLower.includes("adult") || nameLower.includes("active") || nameLower.includes("sterilised") || nameLower.includes("sensible")) {
          if (addTag("adult", "adult")) changed = true;
        } else if (!hasTag("puppy") && !hasTag("kitten") && !hasTag("junior") && !hasTag("senior") && !nameLower.includes("puppy") && !nameLower.includes("kitten") && !nameLower.includes("junior") && !nameLower.includes("senior")) {
          // If it has no other life stage keyword, default to adult
          if (addTag("adult", "adult")) changed = true;
        }
      }

      if (changed) {
        await client.query(
          `UPDATE products SET tags = $1 WHERE id = $2`,
          [JSON.stringify(newTags), p.id]
        );
        updatedCount++;
      }
    }

    console.log(`✅ Auto-tagging complete. Updated tags for ${updatedCount} products.`);

  } catch (err) {
    console.error("Error during auto-tagging:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
