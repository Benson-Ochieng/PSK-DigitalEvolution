/**
 * Seed rich product nutrition + description data
 * node scratch/seed_nutrition.mjs
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const products = [
  {
    id: 1,
    description: "A trusted staple in Kenyan homes, Farmers Choice Team Pet Food is formulated for active adult dogs. Balanced protein from maize and soya with essential vitamins makes this a reliable everyday feed that keeps working dogs strong and energetic.",
    nutrition_protein: 18.0, nutrition_fat: 8.0, nutrition_fibre: 4.5, nutrition_moisture: 12.0,
    key_ingredients: "Maize, Soya Bean Meal, Bone Meal, Sunflower Oil, Vitamin & Mineral Premix, Salt",
    feeding_guide: "Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day. Always provide fresh water.",
    replaces_brand: "Pedigree Adult Dry",
    replaces_reason: "Comparable protein levels at a third of the import cost. Made in Kenya so it reaches you fresher, with no long shipping delays that degrade nutrient quality."
  },
  {
    id: 2,
    description: "Farmers Choice Beef Dog Food uses real beef flavour protein to satisfy even the pickiest Kenyan dog. The same trusted Farmers Choice quality, now with a richer taste profile to keep your dog coming back to the bowl.",
    nutrition_protein: 18.5, nutrition_fat: 8.5, nutrition_fibre: 4.5, nutrition_moisture: 12.0,
    key_ingredients: "Maize, Beef Meal, Soya Bean Meal, Animal Fat, Vitamin E, Zinc Sulphate, Salt",
    feeding_guide: "Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day.",
    replaces_brand: "Pedigree Beef Adult",
    replaces_reason: "Real Kenyan beef meal versus imported meat-by-product. Farmers Choice sources from local abattoirs, meaning higher freshness and traceability."
  },
  {
    id: 3,
    description: "Bravo Adult Chicken is Sigma Foods' flagship recipe — a high-protein, chicken-forward kibble designed specifically for East African climate conditions. The formula supports coat health and immune function with added omega fatty acids and zinc.",
    nutrition_protein: 21.0, nutrition_fat: 10.0, nutrition_fibre: 3.5, nutrition_moisture: 10.0,
    key_ingredients: "Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Meal, Vitamin A, Vitamin D3, Vitamin E, Zinc, Iron, Manganese",
    feeding_guide: "Puppies (2–4 months): 200g/day · Adult small breed: 120–180g · Adult medium breed: 180–300g · Adult large breed: 300–500g.",
    replaces_brand: "Royal Canin Adult Chicken",
    replaces_reason: "Bravo's chicken meal sourcing is 100% Kenyan — supporting local poultry farmers. Same AAFCO-aligned nutritional profile at 40–50% less cost."
  },
  {
    id: 4,
    description: "Top Dog Krunshi is Kenya's best-known economy dog food — a generations-old formula that millions of Kenyan dogs have thrived on. Crunchy texture helps with dental health while the balanced nutrition keeps energy levels steady all day.",
    nutrition_protein: 16.0, nutrition_fat: 7.0, nutrition_fibre: 5.0, nutrition_moisture: 12.0,
    key_ingredients: "Maize Germ Meal, Wheat Bran, Soya Bean Meal, Blood Meal, Bone Meal, Sunflower Oil, Salt, Vitamins A, D3, B12",
    feeding_guide: "Up to 10kg: 100g/day · 10–25kg: 200–300g/day · 25kg+: 350–500g/day. Split into two meals for best digestion.",
    replaces_brand: "Whiskas Dry (cat crossover)",
    replaces_reason: "Designed for Kenyan feeding patterns — higher fibre helps dogs feel full longer on less food, reducing monthly feed costs by up to 35%."
  },
  {
    id: 5,
    description: "Top Dog Rice and Chicken Puppy Food is specially formulated for the fast-growth phase of Kenyan puppies. The elevated protein and DHA support brain development, while the calcium-phosphorus balance builds strong bones. Ideal for breeds common in Kenya — German Shepherds, Rottweilers, Boerboels.",
    nutrition_protein: 24.0, nutrition_fat: 12.0, nutrition_fibre: 3.0, nutrition_moisture: 10.0,
    key_ingredients: "Rice, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Oil (DHA), Calcium Carbonate, Vitamin A, D3, E, C, Folic Acid",
    feeding_guide: "2–4 months: 150–250g/day · 4–6 months: 250–350g/day · 6–12 months: 300–450g/day. Split into 3 meals for young puppies.",
    replaces_brand: "Royal Canin Puppy",
    replaces_reason: "Top Dog Puppy uses rice as the primary carbohydrate — easier on young Kenyan dogs' digestive systems than corn-heavy imports. DHA levels are comparable to premium European brands."
  },
  {
    id: 6,
    description: "Top Dog Rice and Fish offers a novel protein source for dogs with chicken or beef sensitivities — a common issue in equatorial climates. Ocean fish provides natural omega-3 fatty acids that promote a shiny coat and reduce skin inflammation.",
    nutrition_protein: 22.0, nutrition_fat: 9.5, nutrition_fibre: 3.5, nutrition_moisture: 10.0,
    key_ingredients: "Rice, Fish Meal, Soya Bean Protein, Fish Oil, Sunflower Oil, Kelp, Vitamin C, Zinc, Copper",
    feeding_guide: "Puppies 2–6 months: 200–300g/day · 6–12 months: 300–400g/day. Transition gradually over 7 days.",
    replaces_brand: "Hill's Science Diet Puppy",
    replaces_reason: "Fish-based formula at a fraction of the import price. Kenyan fish meal sourcing from Lake Victoria and Indian Ocean supports local fisheries."
  },
  {
    id: 7,
    description: "Bravo Active Beef 15kg is the working-dog formula — designed for guard dogs, farm dogs, and highly active breeds that burn significant calories daily. The elevated fat content provides sustained energy without the blood sugar spikes of high-carb feeds.",
    nutrition_protein: 22.0, nutrition_fat: 13.0, nutrition_fibre: 3.5, nutrition_moisture: 10.0,
    key_ingredients: "Maize, Beef Meal, Animal Fat, Soya Bean Meal, Whey Protein, Vitamin B Complex, Iron, Selenium",
    feeding_guide: "Active adult dogs: 300–600g/day depending on activity level. Increase by 20% for working/guard dogs in full deployment.",
    replaces_brand: "Eukanuba Adult Large Breed",
    replaces_reason: "Specifically calibrated for the tropical-climate energy demands of Kenyan dogs. Higher fat:protein ratio matches the caloric needs of outdoor working dogs."
  },
  {
    id: 8,
    description: "Bravo Chicken Adult 15kg — the bulk economy for multi-dog households and breeders. Sigma Foods' trusted Bravo recipe in a large format that significantly reduces per-kilogram cost for breeders, shelters, and large-breed owners.",
    nutrition_protein: 21.0, nutrition_fat: 10.0, nutrition_fibre: 3.5, nutrition_moisture: 10.0,
    key_ingredients: "Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Vitamin & Mineral Premix, Zinc Oxide, Ferrous Sulphate",
    feeding_guide: "Adult dogs 10–25kg: 200–300g/day · 25kg+: 300–500g/day. Ideal for breeding kennels and multi-dog homes.",
    replaces_brand: "Pedigree Adult 15kg",
    replaces_reason: "Bulk format saves up to KES 800 per bag vs equivalent import volumes. Sigma Foods offers consistent batch quality with locally-sourced ingredients."
  },
  {
    id: 9,
    description: "Purr-fect Chicken & Rice is Kenya's leading locally-formulated cat food — designed for the dietary needs of East African domestic cats. The taurine-enriched formula supports feline heart health, while the rice base is easier to digest than corn-heavy imports.",
    nutrition_protein: 32.0, nutrition_fat: 12.0, nutrition_fibre: 3.0, nutrition_moisture: 10.0,
    key_ingredients: "Rice, Chicken Meal, Fish Meal, Taurine, Sunflower Oil, Vitamin A, Vitamin E, Taurine, Biotin, Choline Chloride",
    feeding_guide: "Kittens: 40–60g/day · Adult cats (3–5kg): 50–70g/day · Active/outdoor cats: up to 90g/day. Free-feeding or 2 meals per day.",
    replaces_brand: "Whiskas Adult Dry",
    replaces_reason: "Purr-fect has 32% protein vs Whiskas at 26% — higher biological value from chicken meal rather than plant proteins. Taurine is added at therapeutic levels, not minimum compliance."
  },
  {
    id: 10,
    description: "Top Dog Rice and Chicken Puppy 2kg — the starter pack for new puppy owners. Same quality formula as the 5kg bag but in a more manageable size for trial, travel, or small breeds. Perfect for mixed-breed puppies newly adopted from Nairobi's shelters.",
    nutrition_protein: 24.0, nutrition_fat: 12.0, nutrition_fibre: 3.0, nutrition_moisture: 10.0,
    key_ingredients: "Rice, Chicken Meal, Soya Bean Meal, Fish Oil, Calcium Carbonate, Vitamin A, D3, E, Folic Acid",
    feeding_guide: "2–4 months: 150–250g/day (3 meals) · 4–6 months: 250–350g/day (2 meals).",
    replaces_brand: "Purina Puppy Chow",
    replaces_reason: "Made in Kenya, no import delays, consistent freshness. Rice-based formula better suited to equatorial digestive demands than wheat-based imports."
  },
  {
    id: 11,
    description: "Wanpy Super Premium Chicken & Duck is the prestige import in our range — a Chinese-made super-premium formula with real duck protein for dogs prone to allergies. The dual-protein approach (chicken + duck) provides a complete amino acid profile. Ideal for discerning pet owners who want imported quality with Kenyan affordability.",
    nutrition_protein: 28.0, nutrition_fat: 14.0, nutrition_fibre: 2.5, nutrition_moisture: 10.0,
    key_ingredients: "Chicken, Duck Meal, Brown Rice, Pea Protein, Chicken Fat, Blueberry, Cranberry, Probiotics, Omega-3, Omega-6",
    feeding_guide: "Small breeds (< 10kg): 80–120g/day · Medium (10–25kg): 160–250g/day · Large (25kg+): 280–420g/day.",
    replaces_brand: "Acana / Orijen",
    replaces_reason: "Premium dual-protein formula at 60% of Acana's price. Wanpy uses real whole meats, not rendered by-products, matching the biologically-appropriate feeding philosophy."
  },
  {
    id: 12,
    description: "Pedigree Vital Protection Lamb in Jelly is a classic wet food format — ideal for senior dogs, dogs recovering from illness, or picky eaters who refuse dry kibble. The lamb protein is gentle on ageing digestive systems and the jelly provides hydration.",
    nutrition_protein: 7.5, nutrition_fat: 4.5, nutrition_fibre: 0.5, nutrition_moisture: 82.0,
    key_ingredients: "Meat & Animal Derivatives (including 4% Lamb), Cereals, Sugars, Minerals, Vegetable Protein Extracts",
    feeding_guide: "Small dogs (< 10kg): 1 pouch/day · Medium dogs (10–25kg): 2 pouches/day. Mix with dry kibble for balanced diet.",
    replaces_brand: "Félix / Sheba Pouches",
    replaces_reason: "Pedigree Vital Protection is formulated for dogs, not cats — many owners mistakenly feed cat wet food to small dogs. This provides the correct mineral balance for canine health."
  },
  {
    id: 13,
    description: "Gilani Gourmet Pet Biltong is Kenya's most unique pet treat — real air-dried biltong made for dogs. Gilani's draws on generations of East African dried meat heritage to create a treat that's 95% protein, zero additives, and absolutely irresistible to dogs. Grain-free, gluten-free, preservative-free.",
    nutrition_protein: 68.0, nutrition_fat: 8.0, nutrition_fibre: 0.0, nutrition_moisture: 15.0,
    key_ingredients: "100% Beef (air-dried), Natural spices, Salt. No artificial preservatives, colours, or flavours.",
    feeding_guide: "Use as a reward treat (not a meal replacement). Small dogs: 1–2 strips/day · Large dogs: 3–4 strips/day. Ideal for training high-value rewards.",
    replaces_brand: "Zuke's Mini Naturals / Stella & Chewy's",
    replaces_reason: "Real biltong is a superior training treat to processed American-style soft chews. 68% protein vs 25–30% in imported treats. Made metres from where the cattle graze."
  },
  {
    id: 14,
    description: "TLC Dog Rice is a pure, additive-free rice meal specifically formulated as a dietary staple or gastrointestinal support diet for dogs. Vets in Kenya frequently recommend TLC Dog Rice during upset stomach recovery and post-surgery feeding.",
    nutrition_protein: 8.0, nutrition_fat: 2.0, nutrition_fibre: 1.5, nutrition_moisture: 12.0,
    key_ingredients: "Rice (100%), Vitamin B1 fortification. No additives, no preservatives, no meat products.",
    feeding_guide: "GI support: 150–200g cooked rice + boiled chicken (not included) per meal · Maintenance blend: 30–40% of total meal alongside complete kibble.",
    replaces_brand: "Hill's i/d Gastrointestinal",
    replaces_reason: "Vets recommend plain rice for GI recovery — TLC Dog Rice is pre-portioned and vitamin-fortified. Far more affordable than Hill's prescription diet for recovery feeding."
  },
  {
    id: 15,
    description: "Scooby Premium Dog Rice is a higher-grade rice formula for dogs with sensitive stomachs or grain-sensitive pets who tolerate rice well. The premium grade means lower starch content and better digestibility versus standard dog rice.",
    nutrition_protein: 9.0, nutrition_fat: 2.5, nutrition_fibre: 1.2, nutrition_moisture: 12.0,
    key_ingredients: "Premium Long-grain Rice, Vitamin B complex fortification",
    feeding_guide: "Blend 40–50% with a protein source (boiled chicken/beef) for a balanced homemade diet. Not recommended as sole feed without protein supplement.",
    replaces_brand: "Purina Pro Plan Sensitive Stomach",
    replaces_reason: "Pure rice base is the foundation of any sensitive-stomach diet. Much cheaper than prescription sensitivity formulas for long-term management."
  },
  {
    id: 16,
    description: "TLC Dog Rice 3kg — the mid-size pack for households managing a dog on a rice-based therapeutic or blended diet. Ideal for breeders supplementing kibble with rice, or owners transitioning dogs from hospital recovery diets back to normal feeding.",
    nutrition_protein: 8.0, nutrition_fat: 2.0, nutrition_fibre: 1.5, nutrition_moisture: 12.0,
    key_ingredients: "Rice, Fortified with Vitamin B1, B2, Niacin",
    feeding_guide: "Blend 50/50 with complete kibble or serve with 100–150g cooked meat per meal.",
    replaces_brand: "Hill's i/d",
    replaces_reason: "Cost-effective long-term GI support diet base. TLC's vitamin fortification ensures B-vitamin replenishment during recovery phases."
  },
  {
    id: 17,
    description: "Scooby Dog Rice 5kg is the economy large-format rice staple for multi-dog households or breeders who blend homemade protein with a clean carbohydrate base. Consistent quality, affordable price, trusted by Kenyan breeders for decades.",
    nutrition_protein: 8.5, nutrition_fat: 2.0, nutrition_fibre: 1.5, nutrition_moisture: 12.0,
    key_ingredients: "White Rice, Vitamin B Complex",
    feeding_guide: "Mix with 20–30% meat protein for a balanced meal. For large breed adults: 250–350g rice portion per day alongside protein.",
    replaces_brand: "Generic supermarket rice",
    replaces_reason: "Purpose-formulated with B vitamins and consistent granule size for easier digestion than cooking table rice. No need for extra vitamin supplements."
  },
  {
    id: 18,
    description: "TLC Dog Rice 10kg — the breeder bulk pack. If you run a kennel, rescue, or breed working dogs, TLC 10kg is your cost base for a rice-supplemented feeding programme. Consistent vitamin fortification batch-to-batch ensures reliable nutrition even at scale.",
    nutrition_protein: 8.0, nutrition_fat: 2.0, nutrition_fibre: 1.5, nutrition_moisture: 12.0,
    key_ingredients: "Rice, Vitamin B1, Vitamin B2, Niacin, Iron Fortification",
    feeding_guide: "Breeder programme: 200–300g rice per dog per day blended with 150–200g protein source.",
    replaces_brand: "Hill's Science Plan Adult Large Breed",
    replaces_reason: "For breeders, cost efficiency matters. A blended diet of TLC rice + quality Kenyan protein can match prescription diet nutrition at 25% of the cost."
  },
  {
    id: 19,
    description: "TLC Dog Meal is a complete mixed formula — rice base pre-blended with plant protein and essential minerals. A step up from plain rice, TLC Dog Meal is a full dietary meal requiring only the addition of a protein source to become nutritionally complete.",
    nutrition_protein: 14.0, nutrition_fat: 4.0, nutrition_fibre: 3.0, nutrition_moisture: 12.0,
    key_ingredients: "Rice, Soya Bean Meal, Maize, Vitamins A, D3, E, Calcium, Phosphorus, Salt",
    feeding_guide: "Adult dogs 10–25kg: 250–350g/day + 100g protein. Large dogs 25kg+: 350–500g/day + 150g protein.",
    replaces_brand: "Purina Dog Chow",
    replaces_reason: "TLC Dog Meal's rice-forward formula produces firmer stools and better coat condition in Kenyan heat versus corn-based imports which cause loose stools in warm climates."
  },
  {
    id: 20,
    description: "Purrfect Kitten Chicken & Rice is Kenya's only locally-made kitten food — a life-stage specific formula with elevated DHA for brain development, high protein for rapid muscle growth, and calcium for bone formation. Essential for the critical first 12 months.",
    nutrition_protein: 36.0, nutrition_fat: 15.0, nutrition_fibre: 2.5, nutrition_moisture: 10.0,
    key_ingredients: "Chicken Meal, Rice, Fish Oil (DHA), Taurine, Calcium Carbonate, Vitamin A, D3, E, B Complex, Folic Acid",
    feeding_guide: "6 weeks – 3 months: free-feed (60–80g/day) · 3–6 months: 60–80g/day (3 meals) · 6–12 months: 55–70g/day (2 meals).",
    replaces_brand: "Royal Canin Kitten / Purina Pro Plan Kitten",
    replaces_reason: "Purrfect Kitten matches the DHA and taurine profiles of Royal Canin Kitten at less than half the price. Made in Kenya so it arrives fresh — no months in a shipping container."
  },
  {
    id: 21,
    description: "Bark Bite Mini Beef Chews are 100g training treat pouches made in Kenya from real beef. The mini format (each chew < 1cm) is ideal for precision positive reinforcement training sessions — small enough to give frequently without overfeeding.",
    nutrition_protein: 38.0, nutrition_fat: 10.0, nutrition_fibre: 2.0, nutrition_moisture: 20.0,
    key_ingredients: "Beef (60%), Wheat Flour, Glycerine, Potato Starch, Natural Beef Flavouring",
    feeding_guide: "Training treats: 3–5 chews per reward session. Max 20–25 chews per day (small dogs 10–15). Reduce main meal portion by 10% on heavy training days.",
    replaces_brand: "Zuke's Mini Naturals",
    replaces_reason: "Bark Bite uses Kenyan beef with no artificial colours or flavour enhancers. Mini format equivalent to Zuke's at 60% of the import price."
  },
  {
    id: 22,
    description: "Bark Bite Mini Chicken Chews bring the same great training treat formula with a chicken flavour profile — ideal for rotating treat variety to maintain high value for trained dogs. Chicken is the most popular flavour in Bark Bite's range.",
    nutrition_protein: 36.0, nutrition_fat: 9.5, nutrition_fibre: 2.0, nutrition_moisture: 20.0,
    key_ingredients: "Chicken (55%), Wheat Flour, Glycerine, Potato Starch, Natural Chicken Flavouring",
    feeding_guide: "Training treats: 3–5 chews per session. For puppies over 8 weeks: 5–10 chews per day max.",
    replaces_brand: "Zuke's Mini Naturals Chicken",
    replaces_reason: "Local Kenyan chicken sourcing means lower food miles and higher freshness. Bark Bite Mini has no soy protein isolate filler that many imported treats use to inflate protein numbers."
  },
  {
    id: 23,
    description: "TLC Dog Chews are a longer-format dental chew designed to keep dogs occupied and promote oral hygiene. The texture is calibrated for medium to large dogs — firm enough to require sustained chewing that mechanically removes tartar and plaque from molars.",
    nutrition_protein: 25.0, nutrition_fat: 8.0, nutrition_fibre: 3.0, nutrition_moisture: 18.0,
    key_ingredients: "Beef Skin, Wheat Flour, Maize Starch, Beef Fat, Natural Flavouring, Vitamin E",
    feeding_guide: "1 chew per day for medium dogs (10–25kg) · 1–2 chews for large dogs (25kg+). Supervise during chewing. Not suitable for aggressive chewers or dogs under 6 months.",
    replaces_brand: "Pedigree Dentastix",
    replaces_reason: "TLC Chews use real beef skin rather than plant-derived cellulose as the abrasive base — more natural plaque removal. No artificial colours or sweeteners."
  },
  {
    id: 24,
    description: "Bravo Active Beef 2kg is Sigma Foods' compact working dog formula — all the caloric density of the 15kg version in a bag that's easy to carry to the farm, training ground, or weekend bush camp. Formulated for dogs that don't slow down.",
    nutrition_protein: 22.0, nutrition_fat: 13.0, nutrition_fibre: 3.5, nutrition_moisture: 10.0,
    key_ingredients: "Maize, Beef Meal, Animal Fat, Whey Protein, Vitamin B Complex, Iron, Selenium, Zinc",
    feeding_guide: "Working dogs: 350–600g/day. Increase 20–25% on heavy activity days. Never restrict water access.",
    replaces_brand: "Eukanuba Adult Performance",
    replaces_reason: "Bravo Active's fat content (13%) matches performance feed standards for working dogs. Kenyan-made, so you're not paying import margins for a product designed for Kenyan conditions."
  },
  {
    id: 25,
    description: "Top Dog Rice 10kg is the bulk rice product for large kennels and breeding operations. The same vitamin-fortified formula used in the 5kg bags, now in a more economical large format that reduces packaging waste and per-kg cost for professional dog breeders.",
    nutrition_protein: 8.0, nutrition_fat: 2.0, nutrition_fibre: 1.5, nutrition_moisture: 12.0,
    key_ingredients: "White Rice, Vitamin B1, B2, Niacin, Iron",
    feeding_guide: "Blend 40–50% with complete protein source. Breeder programme: 200–300g rice + 150g protein per adult dog per day.",
    replaces_brand: "Hill's Prescription Diet i/d Large Breed",
    replaces_reason: "For kennel-scale GI support or carbohydrate supplementation, Top Dog Rice delivers equivalent nutrition at a fraction of prescription diet pricing."
  },
  {
    id: 26,
    description: "Top Dog Uncooked Dog Rice 5kg is raw, unprocessed dog-grade rice for owners who cook their dogs' food fresh. No vitamin fortification — this is pure substrate for home-cooking programmes. Cook until fully soft and combine with boiled chicken, beef, or fish.",
    nutrition_protein: 7.0, nutrition_fat: 1.5, nutrition_fibre: 0.8, nutrition_moisture: 13.0,
    key_ingredients: "Unprocessed White Rice",
    feeding_guide: "Cook 1 cup dry rice per 10kg body weight per day (yields ~3 cups cooked). Always serve at room temperature. Combine with 100–150g cooked protein per meal.",
    replaces_brand: "Supermarket rice (table-grade)",
    replaces_reason: "Larger, consistent granule size than table rice — cooks more evenly and produces better texture for dogs. Dog-grade quality control ensures no foreign material contamination."
  },
];

async function run() {
  console.log(`Seeding rich product data for ${products.length} products...\n`);
  for (const p of products) {
    await pool.query(`
      UPDATE products SET
        description       = $1,
        nutrition_protein = $2,
        nutrition_fat     = $3,
        nutrition_fibre   = $4,
        nutrition_moisture= $5,
        key_ingredients   = $6,
        feeding_guide     = $7,
        replaces_brand    = $8,
        replaces_reason   = $9
      WHERE id = $10
    `, [p.description, p.nutrition_protein, p.nutrition_fat, p.nutrition_fibre,
        p.nutrition_moisture, p.key_ingredients, p.feeding_guide,
        p.replaces_brand, p.replaces_reason, p.id]);
    console.log(`  ✅ [${p.id}]`);
  }
  await pool.end();
  console.log('\nDone.');
}
run().catch(console.error);
