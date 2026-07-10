import pool, { withTransaction } from "../app/db.server";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("🚀 Starting fast life-stage database auto-tagging...");

  const client = await pool.connect();
  try {
    // Fetch all products
    const { rows: products } = await client.query(
      `SELECT id, name, categories, tags, food_type FROM products`
    );
    console.log(`Fetched ${products.length} products to evaluate.`);

    const updates: { id: number; tags: string }[] = [];

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
      const isFoodOrSupp = p.name.toLowerCase().includes("food") || 
                           p.name.toLowerCase().includes("treat") || 
                           p.name.toLowerCase().includes("croquettes") || 
                           p.name.toLowerCase().includes("gravy") || 
                           p.name.toLowerCase().includes("kibble") || 
                           p.food_type === "dry" || 
                           p.food_type === "wet" ||
                           (Array.isArray(p.categories) && p.categories.some((c: any) => c.slug.includes("food") || c.slug.includes("treat")));

      if (isFoodOrSupp) {
        if (nameLower.includes("adult") || nameLower.includes("active") || nameLower.includes("sterilised") || nameLower.includes("sensible")) {
          if (addTag("adult", "adult")) changed = true;
        } else if (!hasTag("puppy") && !hasTag("kitten") && !hasTag("junior") && !hasTag("senior") && !nameLower.includes("puppy") && !nameLower.includes("kitten") && !nameLower.includes("junior") && !nameLower.includes("senior")) {
          if (addTag("adult", "adult")) changed = true;
        }
      }

      if (changed) {
        updates.push({ id: p.id, tags: JSON.stringify(newTags) });
      }
    }

    console.log(`Found ${updates.length} products needing tag updates.`);

    if (updates.length === 0) {
      console.log("No updates needed!");
      process.exit(0);
    }

    // Process updates in chunks of 100
    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(updates.length / CHUNK_SIZE);

    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
      
      const valuePlaceholders: string[] = [];
      const queryParams: any[] = [];
      let paramIdx = 1;

      for (const item of chunk) {
        valuePlaceholders.push(`($${paramIdx++}::integer, $${paramIdx++}::jsonb)`);
        queryParams.push(item.id, item.tags);
      }

      const updateQuery = `
        UPDATE products AS p
        SET tags = v.tags
        FROM (VALUES ${valuePlaceholders.join(", ")}) AS v(id, tags)
        WHERE p.id = v.id
      `;

      await client.query(updateQuery, queryParams);
      console.log(`Updated chunk ${chunkIndex} of ${totalChunks}`);
    }

    console.log("🎉 ALL PRODUCTS AUTO-TAGGED WITH LIFE-STAGE SUCCESSFULLY!");

  } catch (err) {
    console.error("Error during fast auto-tagging:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
