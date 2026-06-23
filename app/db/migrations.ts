export interface Migration {
  id: number;
  name: string;
  up: string;
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial_schema',
    up: `
      CREATE TABLE IF NOT EXISTS products (
        id                  SERIAL PRIMARY KEY,
        name                TEXT NOT NULL,
        brand               TEXT,
        weight_kg           NUMERIC(8,2),
        animal_type         TEXT,
        food_type           TEXT,
        image_url           TEXT,
        description         TEXT,
        key_ingredients     TEXT,
        feeding_guide       TEXT,
        replaces_brand      TEXT,
        replaces_reason     TEXT,
        nutrition_protein   NUMERIC(5,1),
        nutrition_fat       NUMERIC(5,1),
        nutrition_fibre     NUMERIC(5,1),
        nutrition_moisture  NUMERIC(5,1),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_prices (
        id           SERIAL PRIMARY KEY,
        product_id   INTEGER REFERENCES products(id) ON DELETE CASCADE,
        store_name   TEXT NOT NULL,
        price        NUMERIC(10,2),
        product_url  TEXT,
        in_stock     BOOLEAN DEFAULT true,
        last_updated TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id           SERIAL PRIMARY KEY,
        phone        TEXT UNIQUE,
        email        TEXT UNIQUE,
        name         TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id               SERIAL PRIMARY KEY,
        customer_name    TEXT,
        customer_phone   TEXT NOT NULL,
        customer_email   TEXT,
        delivery_area    TEXT,
        subtotal_kes     NUMERIC(10,2),
        delivery_fee_kes NUMERIC(10,2),
        total_kes        NUMERIC(10,2),
        payment_method   TEXT,
        status           TEXT DEFAULT 'pending',
        notes            TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id           SERIAL PRIMARY KEY,
        order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id   INTEGER REFERENCES products(id),
        product_name TEXT,
        qty          INTEGER,
        unit_price   NUMERIC(10,2),
        total_price  NUMERIC(10,2)
      );

      CREATE INDEX IF NOT EXISTS idx_store_prices_product ON store_prices(product_id);
      CREATE INDEX IF NOT EXISTS idx_store_prices_store   ON store_prices(store_name);
      CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_phone         ON orders(customer_phone);
    `
  },
  {
    id: 2,
    name: 'seed_products_and_prices',
    up: `
      INSERT INTO products
        (id, name, brand, weight_kg, animal_type, food_type, image_url,
         description, nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture,
         key_ingredients, feeding_guide, replaces_brand, replaces_reason)
      VALUES
      (
        1, 'Farmers Choice Team Pet/Dog Food 2Kg', 'Farmers Choice', 2, 'dog', 'wet',
        'https://cdn.mafrservices.com/pim-content/KEN/media/product/40553/1728486004/40553_main.jpg?im=Resize=(300,300)',
        'A trusted staple in Kenyan homes, Farmers Choice Team Pet Food is formulated for active adult dogs. Balanced protein from maize and soya with essential vitamins makes this a reliable everyday feed that keeps working dogs strong and energetic.',
        18.0, 8.0, 4.5, 12.0,
        'Maize, Soya Bean Meal, Bone Meal, Sunflower Oil, Vitamin & Mineral Premix, Salt',
        'Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day. Always provide fresh water.',
        'Pedigree Adult Dry',
        'Comparable protein levels at a third of the import cost. Made in Kenya so it reaches you fresher, with no long shipping delays that degrade nutrient quality.'
      ),
      (
        2, 'Farmers Choice Beef Dog Food 2Kg', 'Farmers Choice', 2, 'dog', 'wet',
        'https://cdn.mafrservices.com/pim-content/KEN/media/product/40554/1725537604/40554_main.jpg?im=Resize=(300,300)',
        'Farmers Choice Beef Dog Food uses real beef flavour protein to satisfy even the pickiest Kenyan dog. The same trusted Farmers Choice quality, now with a richer taste profile to keep your dog coming back to the bowl.',
        18.5, 8.5, 4.5, 12.0,
        'Maize, Beef Meal, Soya Bean Meal, Animal Fat, Vitamin E, Zinc Sulphate, Salt',
        'Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day.',
        'Pedigree Beef Adult',
        'Real Kenyan beef meal versus imported meat-by-product. Farmers Choice sources from local abattoirs, meaning higher freshness and traceability.'
      ),
      (
        3, 'Bravo Dog Food Adult Chicken 2Kg', 'Bravo', 2, 'dog', 'dry',
        'https://cdn.mafrservices.com/pim-content/KEN/media/product/83730/1758891605/83730_main.jpg?im=Resize=(300,300)',
        'Bravo Adult Chicken is Sigma Foods'' flagship recipe — a high-protein, chicken-forward kibble designed specifically for East African climate conditions. The formula supports coat health and immune function with added omega fatty acids and zinc.',
        21.0, 10.0, 3.5, 10.0,
        'Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Meal, Vitamin A, Vitamin D3, Vitamin E, Zinc, Iron, Manganese',
        'Puppies (2–4 months): 200g/day · Adult small breed: 120–180g · Adult medium breed: 180–300g · Adult large breed: 300–500g.',
        'Royal Canin Adult Chicken',
        'Bravo''s chicken meal sourcing is 100% Kenyan — supporting local poultry farmers. Same AAFCO-aligned nutritional profile at 40–50% less cost.'
      ),
      (
        4, 'Top Dog Krunshi Economy Dog Food 5kg', 'Top Dog', 5, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/h9d/h5e/29090212970526/100547_main.jpg?im=Resize=(300,300)',
        'Top Dog Krunshi is Kenya''s best-known economy dog food — a generations-old formula that millions of Kenyan dogs have thrived on. Crunchy texture helps with dental health while the balanced nutrition keeps energy levels steady all day.',
        16.0, 7.0, 5.0, 12.0,
        'Maize Germ Meal, Wheat Bran, Soya Bean Meal, Blood Meal, Bone Meal, Sunflower Oil, Salt, Vitamins A, D3, B12',
        'Up to 10kg: 100g/day · 10–25kg: 200–300g/day · 25kg+: 350–500g/day. Split into two meals for best digestion.',
        'Pedigree Adult Economy',
        'Designed for Kenyan feeding patterns — higher fibre helps dogs feel full longer on less food, reducing monthly feed costs by up to 35%.'
      ),
      (
        5, 'Top Dog Rice And Chicken Puppy Food 5Kg', 'Top Dog', 5, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/hc3/h3b/28761951567902/140331_main.jpg?im=Resize=(300,300)',
        'Top Dog Rice and Chicken Puppy Food is specially formulated for the fast-growth phase of Kenyan puppies. The elevated protein and DHA support brain development, while the calcium-phosphorus balance builds strong bones.',
        24.0, 12.0, 3.0, 10.0,
        'Rice, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Oil (DHA), Calcium Carbonate, Vitamin A, D3, E, C, Folic Acid',
        '2–4 months: 150–250g/day · 4–6 months: 250–350g/day · 6–12 months: 300–450g/day. Split into 3 meals for young puppies.',
        'Royal Canin Puppy',
        'Top Dog Puppy uses rice as the primary carbohydrate — easier on young Kenyan dogs'' digestive systems than corn-heavy imports. DHA levels are comparable to premium European brands.'
      ),
      (
        6, 'Top Dog Rice And Fish Puppy Food 5Kg', 'Top Dog', 5, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/h18/hce/28980711456798/140333_main.jpg?im=Resize=(300,300)',
        'Top Dog Rice and Fish offers a novel protein source for dogs with chicken or beef sensitivities — a common issue in equatorial climates. Ocean fish provides natural omega-3 fatty acids that promote a shiny coat and reduce skin inflammation.',
        22.0, 9.5, 3.5, 10.0,
        'Rice, Fish Meal, Soya Bean Protein, Fish Oil, Sunflower Oil, Kelp, Vitamin C, Zinc, Copper',
        'Puppies 2–6 months: 200–300g/day · 6–12 months: 300–400g/day. Transition gradually over 7 days.',
        'Hill''s Science Diet Puppy',
        'Fish-based formula at a fraction of the import price. Kenyan fish meal sourcing from Lake Victoria and Indian Ocean supports local fisheries.'
      ),
      (
        7, 'Bravo Beef Flavour Active Dog Food 15Kg', 'Bravo', 15, 'dog', 'dry',
        NULL,
        'Bravo Active Beef 15kg is the working-dog formula — designed for guard dogs, farm dogs, and highly active breeds that burn significant calories daily. The elevated fat content provides sustained energy without the blood sugar spikes of high-carb feeds.',
        22.0, 13.0, 3.5, 10.0,
        'Maize, Beef Meal, Animal Fat, Soya Bean Meal, Whey Protein, Vitamin B Complex, Iron, Selenium',
        'Active adult dogs: 300–600g/day depending on activity level. Increase by 20% for working/guard dogs in full deployment.',
        'Eukanuba Adult Large Breed',
        'Specifically calibrated for the tropical-climate energy demands of Kenyan dogs. Higher fat:protein ratio matches the caloric needs of outdoor working dogs.'
      ),
      (
        8, 'Bravo Chicken Flavour Adult Dog Food 15Kg', 'Bravo', 15, 'dog', 'dry',
        NULL,
        'Bravo Chicken Adult 15kg — the bulk economy for multi-dog households and breeders. Sigma Foods'' trusted Bravo recipe in a large format that significantly reduces per-kilogram cost for breeders, shelters, and large-breed owners.',
        21.0, 10.0, 3.5, 10.0,
        'Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Vitamin & Mineral Premix, Zinc Oxide, Ferrous Sulphate',
        'Adult dogs 10–25kg: 200–300g/day · 25kg+: 300–500g/day. Ideal for breeding kennels and multi-dog homes.',
        'Pedigree Adult 15kg',
        'Bulk format saves up to KES 800 per bag vs equivalent import volumes. Sigma Foods offers consistent batch quality with locally-sourced ingredients.'
      ),
      (
        9, 'Purr-fect Chicken & Rice Cat Food 2kg', 'Purr-fect', 2, 'cat', 'dry',
        'https://cdn.mafrservices.com/pim-content/KEN/media/product/137190/1758891605/137190_main.jpg?im=Resize=(300,300)',
        'Purr-fect Chicken & Rice is Kenya''s leading locally-formulated cat food — designed for the dietary needs of East African domestic cats. The taurine-enriched formula supports feline heart health, while the rice base is easier to digest than corn-heavy imports.',
        32.0, 12.0, 3.0, 10.0,
        'Rice, Chicken Meal, Fish Meal, Taurine, Sunflower Oil, Vitamin A, Vitamin E, Taurine, Biotin, Choline Chloride',
        'Kittens: 40–60g/day · Adult cats (3–5kg): 50–70g/day · Active/outdoor cats: up to 90g/day.',
        'Whiskas Adult Dry',
        'Purr-fect has 32% protein vs Whiskas at 26% — higher biological value from chicken meal rather than plant proteins. Taurine is added at therapeutic levels, not minimum compliance.'
      ),
      (
        10, 'Top Dog Puppy Rice And Chicken Dog Food 2kg', 'Top Dog', 2, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/h18/h87/30107543109662/140330_main.jpg?im=Resize=(300,300)',
        'Top Dog Rice and Chicken Puppy 2kg — the starter pack for new puppy owners. Same quality formula as the 5kg bag but in a more manageable size for trial, travel, or small breeds.',
        24.0, 12.0, 3.0, 10.0,
        'Rice, Chicken Meal, Soya Bean Meal, Fish Oil, Calcium Carbonate, Vitamin A, D3, E, Folic Acid',
        '2–4 months: 150–250g/day (3 meals) · 4–6 months: 250–350g/day (2 meals).',
        'Purina Puppy Chow',
        'Made in Kenya, no import delays, consistent freshness. Rice-based formula better suited to equatorial digestive demands than wheat-based imports.'
      ),
      (
        11, 'Gilani Gourmet Pet Biltong 250g', 'Gilani', 0.25, 'dog', 'treat',
        'https://cdn.mafrservices.com/sys-master-root/hab/ha3/27645612916766/24246_main.jpg?im=Resize=(300,300)',
        'Gilani Gourmet Pet Biltong is Kenya''s most unique pet treat — real air-dried biltong made for dogs. Gilani''s draws on generations of East African dried meat heritage to create a treat that''s 95% protein, zero additives, and absolutely irresistible to dogs.',
        68.0, 8.0, 0.0, 15.0,
        '100% Beef (air-dried), Natural spices, Salt. No artificial preservatives, colours, or flavours.',
        'Use as a reward treat (not a meal replacement). Small dogs: 1–2 strips/day · Large dogs: 3–4 strips/day.',
        'Zuke''s Mini Naturals / Stella & Chewy''s',
        'Real biltong is a superior training treat to processed American-style soft chews. 68% protein vs 25–30% in imported treats. Made metres from where the cattle graze.'
      ),
      (
        12, 'T.L.C. Dog Rice 5Kg', 'T.L.C.', 5, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/hb7/hb3/13964706643998/90776_main.jpg?im=Resize=(300,300)',
        'TLC Dog Rice is a pure, additive-free rice meal specifically formulated as a dietary staple or gastrointestinal support diet for dogs. Vets in Kenya frequently recommend TLC Dog Rice during upset stomach recovery and post-surgery feeding.',
        8.0, 2.0, 1.5, 12.0,
        'Rice (100%), Vitamin B1 fortification. No additives, no preservatives, no meat products.',
        'GI support: 150–200g cooked rice + boiled chicken per meal · Maintenance blend: 30–40% of total meal alongside complete kibble.',
        'Hill''s i/d Gastrointestinal',
        'Vets recommend plain rice for GI recovery — TLC Dog Rice is pre-portioned and vitamin-fortified. Far more affordable than Hill''s prescription diet for recovery feeding.'
      ),
      (
        13, 'Scooby Premium Dog Rice 10Kg', 'Scooby', 10, 'dog', 'dry',
        NULL,
        'Scooby Premium Dog Rice is a higher-grade rice formula for dogs with sensitive stomachs or grain-sensitive pets who tolerate rice well. The premium grade means lower starch content and better digestibility versus standard dog rice.',
        9.0, 2.5, 1.2, 12.0,
        'Premium Long-grain Rice, Vitamin B complex fortification',
        'Blend 40–50% with a protein source (boiled chicken/beef) for a balanced homemade diet.',
        'Purina Pro Plan Sensitive Stomach',
        'Pure rice base is the foundation of any sensitive-stomach diet. Much cheaper than prescription sensitivity formulas for long-term management.'
      ),
      (
        14, 'T.L.C. Dog Rice 3Kg', 'T.L.C.', 3, 'dog', 'dry',
        NULL,
        'TLC Dog Rice 3kg — the mid-size pack for households managing a dog on a rice-based therapeutic or blended diet.',
        8.0, 2.0, 1.5, 12.0,
        'Rice, Fortified with Vitamin B1, B2, Niacin',
        'Blend 50/50 with complete kibble or serve with 100–150g cooked meat per meal.',
        'Hill''s i/d',
        'Cost-effective long-term GI support diet base. TLC''s vitamin fortification ensures B-vitamin replenishment during recovery phases.'
      ),
      (
        15, 'Scooby Dog Rice 5Kg', 'Scooby', 5, 'dog', 'dry',
        NULL,
        'Scooby Dog Rice 5kg is the economy large-format rice staple for multi-dog households or breeders who blend homemade protein with a clean carbohydrate base.',
        8.5, 2.0, 1.5, 12.0,
        'White Rice, Vitamin B Complex',
        'Mix with 20–30% meat protein for a balanced meal. For large breed adults: 250–350g rice portion per day alongside protein.',
        'Generic supermarket rice',
        'Purpose-formulated with B vitamins and consistent granule size for easier digestion. No need for extra vitamin supplements.'
      ),
      (
        16, 'T.L.C. Dog Rice 10Kg', 'T.L.C.', 10, 'dog', 'dry',
        NULL,
        'TLC Dog Rice 10kg — the breeder bulk pack. If you run a kennel, rescue, or breed working dogs, TLC 10kg is your cost base for a rice-supplemented feeding programme.',
        8.0, 2.0, 1.5, 12.0,
        'Rice, Vitamin B1, Vitamin B2, Niacin, Iron Fortification',
        'Breeder programme: 200–300g rice per dog per day blended with 150–200g protein source.',
        'Hill''s Science Plan Adult Large Breed',
        'For breeders, cost efficiency matters. A blended diet of TLC rice + quality Kenyan protein can match prescription diet nutrition at 25% of the cost.'
      ),
      (
        17, 'T.L.C. Dog Meal 5Kg', 'T.L.C.', 5, 'dog', 'dry',
        NULL,
        'TLC Dog Meal is a complete mixed formula — rice base pre-blended with plant protein and essential minerals. A step up from plain rice, TLC Dog Meal is a full dietary meal requiring only the addition of a protein source to become nutritionally complete.',
        14.0, 4.0, 3.0, 12.0,
        'Rice, Soya Bean Meal, Maize, Vitamins A, D3, E, Calcium, Phosphorus, Salt',
        'Adult dogs 10–25kg: 250–350g/day + 100g protein. Large dogs 25kg+: 350–500g/day + 150g protein.',
        'Purina Dog Chow',
        'TLC Dog Meal''s rice-forward formula produces firmer stools and better coat condition in Kenyan heat versus corn-based imports.'
      ),
      (
        18, 'Purrfect Kitten Chicken & Rice 1kg', 'Purrfect', 1, 'cat', 'dry',
        NULL,
        'Purrfect Kitten Chicken & Rice is Kenya''s only locally-made kitten food — a life-stage specific formula with elevated DHA for brain development, high protein for rapid muscle growth, and calcium for bone formation.',
        36.0, 15.0, 2.5, 10.0,
        'Chicken Meal, Rice, Fish Oil (DHA), Taurine, Calcium Carbonate, Vitamin A, D3, E, B Complex, Folic Acid',
        '6 weeks – 3 months: free-feed (60–80g/day) · 3–6 months: 60–80g/day (3 meals) · 6–12 months: 55–70g/day (2 meals).',
        'Royal Canin Kitten / Purina Pro Plan Kitten',
        'Purrfect Kitten matches the DHA and taurine profiles of Royal Canin Kitten at less than half the price. Made in Kenya so it arrives fresh — no months in a shipping container.'
      ),
      (
        19, 'Bark Bite Mini Dog Chews Beef 100g', 'Bark Bite', 0.1, 'dog', 'treat',
        NULL,
        'Bark Bite Mini Beef Chews are 100g training treat pouches made in Kenya from real beef. The mini format is ideal for precision positive reinforcement training sessions — small enough to give frequently without overfeeding.',
        38.0, 10.0, 2.0, 20.0,
        'Beef (60%), Wheat Flour, Glycerine, Potato Starch, Natural Beef Flavouring',
        'Training treats: 3–5 chews per reward session. Max 20–25 chews per day for small dogs.',
        'Zuke''s Mini Naturals',
        'Bark Bite uses Kenyan beef with no artificial colours or flavour enhancers. Mini format equivalent to Zuke''s at 60% of the import price.'
      ),
      (
        20, 'Bark Bite Mini Dog Chew Chicken 100g', 'Bark Bite', 0.1, 'dog', 'treat',
        NULL,
        'Bark Bite Mini Chicken Chews bring the same great training treat formula with a chicken flavour profile — ideal for rotating treat variety to maintain high value for trained dogs.',
        36.0, 9.5, 2.0, 20.0,
        'Chicken (55%), Wheat Flour, Glycerine, Potato Starch, Natural Chicken Flavouring',
        'Training treats: 3–5 chews per session. For puppies over 8 weeks: 5–10 chews per day max.',
        'Zuke''s Mini Naturals Chicken',
        'Local Kenyan chicken sourcing means lower food miles and higher freshness. No soy protein isolate filler that many imported treats use.'
      ),
      (
        21, 'T.L.C. Dog Chews 250g', 'T.L.C.', 0.25, 'dog', 'treat',
        'https://cdn.mafrservices.com/sys-master-root/hf6/he2/13964618104862/110450_main.jpg?im=Resize=(300,300)',
        'TLC Dog Chews are a longer-format dental chew designed to keep dogs occupied and promote oral hygiene. The texture is calibrated for medium to large dogs — firm enough to require sustained chewing that mechanically removes tartar and plaque.',
        25.0, 8.0, 3.0, 18.0,
        'Beef Skin, Wheat Flour, Maize Starch, Beef Fat, Natural Flavouring, Vitamin E',
        '1 chew per day for medium dogs (10–25kg) · 1–2 chews for large dogs (25kg+). Supervise during chewing.',
        'Pedigree Dentastix',
        'TLC Chews use real beef skin rather than plant-derived cellulose — more natural plaque removal. No artificial colours or sweeteners.'
      ),
      (
        22, 'Bravo Active Beef Flavour 2Kg', 'Bravo', 2, 'dog', 'dry',
        'https://cdn.mafrservices.com/pim-content/KEN/media/product/120353/1758891605/120353_main.jpg?im=Resize=(300,300)',
        'Bravo Active Beef 2kg is Sigma Foods'' compact working dog formula — all the caloric density of the 15kg version in a bag that''s easy to carry to the farm, training ground, or weekend bush camp.',
        22.0, 13.0, 3.5, 10.0,
        'Maize, Beef Meal, Animal Fat, Whey Protein, Vitamin B Complex, Iron, Selenium, Zinc',
        'Working dogs: 350–600g/day. Increase 20–25% on heavy activity days. Never restrict water access.',
        'Eukanuba Adult Performance',
        'Bravo Active''s fat content (13%) matches performance feed standards for working dogs. Kenyan-made, so you''re not paying import margins for a product designed for Kenyan conditions.'
      ),
      (
        23, 'Top Dog Rice 10Kg', 'Top Dog', 10, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/h50/h46/14806723624990/35807_main.jpg?im=Resize=(300,300)',
        'Top Dog Rice 10kg is the bulk rice product for large kennels and breeding operations. The same vitamin-fortified formula used in the 5kg bags, now in a more economical large format.',
        8.0, 2.0, 1.5, 12.0,
        'White Rice, Vitamin B1, B2, Niacin, Iron',
        'Blend 40–50% with complete protein source. Breeder programme: 200–300g rice + 150g protein per adult dog per day.',
        'Hill''s Prescription Diet i/d Large Breed',
        'For kennel-scale GI support or carbohydrate supplementation, Top Dog Rice delivers equivalent nutrition at a fraction of prescription diet pricing.'
      ),
      (
        24, 'Top Dog Uncooked Dog Rice 5Kg', 'Top Dog', 5, 'dog', 'dry',
        'https://cdn.mafrservices.com/sys-master-root/he8/h42/14806723723294/35806_main.jpg?im=Resize=(300,300)',
        'Top Dog Uncooked Dog Rice 5kg is raw, unprocessed dog-grade rice for owners who cook their dogs'' food fresh. No vitamin fortification — this is pure substrate for home-cooking programmes.',
        7.0, 1.5, 0.8, 13.0,
        'Unprocessed White Rice',
        'Cook 1 cup dry rice per 10kg body weight per day. Always serve at room temperature. Combine with 100–150g cooked protein per meal.',
        'Supermarket rice (table-grade)',
        'Larger, consistent granule size than table rice — cooks more evenly and produces better texture for dogs. Dog-grade quality control ensures no foreign material contamination.'
      ),
      (
        25, 'Robeliz Omena Dog Food 10kg', 'Robeliz', 10, 'dog', 'dry',
        '/images/products/product_27.jpg',
        'High-Protein Nutrition from Local Kenyan Fish. Formulated using omena (silver cyminim) – a nutrient-dense small fish abundant in Lake Victoria and Kenyan waters. This recipe provides high-quality protein for strong muscles, healthy skin, and a shiny coat. Perfect for multi-dog households and working dogs.',
        22.0, 10.0, 4.0, 10.0,
        'Omena Fish Meal, Rice, Maize Germ, Soya Bean Meal, Sunflower Oil, Calcium Carbonate, Vitamin & Mineral Premix',
        'Medium dogs (10–25kg): 200–350g/day · Large dogs (25kg+): 350–500g/day. Split into two meals.',
        'Pedigree Adult 10kg',
        'Real Kenyan omena fish meal offers a superior, natural omega-3 profile compared to meat-by-product imports, at 20% lower cost.'
      ),
      (
        26, 'Omena Perfect Mix Dog Meal 5kg', 'Omena Perfect Mix', 5, 'dog', 'dry',
        '/images/products/product_28.png',
        'A classic high-protein supplement and daily feed base. Made with 100% genuine sun-dried omena from Lake Victoria mixed with local grains. High in calcium and natural fats, this mix is highly digestible and builds strong bones and a glowing coat.',
        20.0, 9.0, 4.5, 11.0,
        'Omena Fish, Broken Rice, Maize Bran, Bone Meal, Essential Salt, Vitamin Premix',
        'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–300g/day. Mix with warm water or broth if preferred.',
        'Pedigree Complete 5kg',
        'Pure whole omena fish versus imported rendered meat meal. Sourced locally in East Africa, giving you premium fish protein at a fraction of the cost.'
      )
      ON CONFLICT (id) DO NOTHING;

      SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products;

      INSERT INTO store_prices (product_id, store_name, price, product_url, in_stock) VALUES
        (1,  'PetStore Kenya', 336,  'https://petstore.co.ke/shop/1',  true),
        (1,  'Carrefour',    420,  'https://www.carrefour.ke/mafken/en/animal-supplements/farmers-choice-team-pet-food-2kg/p/40553', true),
        (2,  'PetStore Kenya', 336,  'https://petstore.co.ke/shop/2',  true),
        (2,  'Carrefour',    420,  'https://www.carrefour.ke/mafken/en/animal-supplements/farmers-choice-beefo-pet-food-2kg/p/40554', true),
        (3,  'PetStore Kenya', 739,  'https://petstore.co.ke/shop/3',  true),
        (3,  'Carrefour',    924,  'https://www.carrefour.ke/mafken/en/dry-dog-food/bravo-dog-food-adult-chicken-2kg/p/83730', true),
        (4,  'PetStore Kenya', 1008, 'https://petstore.co.ke/shop/4',  true),
        (4,  'Carrefour',    1260, 'https://www.carrefour.ke/mafken/en/dry-dog-food/krunshi-dog-foodi-economy5kg/p/100547', true),
        (5,  'PetStore Kenya', 1348, 'https://petstore.co.ke/shop/5',  true),
        (5,  'Carrefour',    1685, 'https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-chicken-fl-5kgs/p/140331', true),
        (6,  'PetStore Kenya', 1348, 'https://petstore.co.ke/shop/6',  true),
        (6,  'Carrefour',    1685, 'https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-fish-5kgs/p/140333', true),
        (9,  'PetStore Kenya', 1848, 'https://petstore.co.ke/shop/9',  true),
        (9,  'Carrefour',    2310, 'https://www.carrefour.ke/mafken/en/dry-cat-food/purr-fect-chicken-rice-flavour2kg/p/137190', true),
        (10, 'PetStore Kenya', 552,  'https://petstore.co.ke/shop/10', true),
        (10, 'Carrefour',    690,  'https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-chicken-fl-2kgs/p/140330', true),
        (11, 'PetStore Kenya', 1278, 'https://petstore.co.ke/shop/13', true),
        (11, 'Carrefour',    1597, 'https://www.carrefour.ke/mafken/en/dry-dog-food/gilani-gourpet-pet-biltong-250g/p/24246', true),
        (12, 'PetStore Kenya', 760,  'https://petstore.co.ke/shop/14', true),
        (12, 'Carrefour',    950,  'https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-rice-5kg/p/90776', true),
        (14, 'PetStore Kenya', 552,  'https://petstore.co.ke/shop/16', true),
        (14, 'Carrefour',    690,  'https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-rice-3kg/p/90775', true),
        (15, 'PetStore Kenya', 840,  'https://petstore.co.ke/shop/17', true),
        (15, 'Carrefour',    1050, 'https://www.carrefour.ke/mafken/en/dry-dog-food/scooby-dog-rice-5kg/p/23125', true),
        (17, 'PetStore Kenya', 654,  'https://petstore.co.ke/shop/19', true),
        (17, 'Carrefour',    818,  'https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-meal-5kg/p/109401', true),
        (18, 'PetStore Kenya', 1100, 'https://petstore.co.ke/shop/20', true),
        (18, 'Carrefour',    1375, 'https://www.carrefour.ke/mafken/en/dry-cat-food/purrfect-kitten-chicken-rice-1kg/p/174226', true),
        (21, 'PetStore Kenya', 286,  'https://petstore.co.ke/shop/23', true),
        (21, 'Carrefour',    358,  'https://www.carrefour.ke/mafken/en/dry-dog-food/tlc-dog-chews250g/p/110450', true),
        (22, 'PetStore Kenya', 757,  'https://petstore.co.ke/shop/24', true),
        (22, 'Carrefour',    946,  'https://www.carrefour.ke/mafken/en/dry-dog-food/bravo-active-beef-flavour2kg/p/120353', true),
        (23, 'PetStore Kenya', 1780, 'https://petstore.co.ke/shop/25', true),
        (23, 'Carrefour',    2225, 'https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-rice-10kg/p/35807', true),
        (24, 'PetStore Kenya', 896,  'https://petstore.co.ke/shop/26', true),
        (24, 'Carrefour',    1120, 'https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-rice-5kg/p/35806', true),
        (25, 'PetStore Kenya', 2960, 'https://petstore.co.ke/shop/27', true),
        (25, 'Jumia',        3700, 'https://www.jumia.co.ke/generic-robeliz-omena-dog-food-10kg-327641759.html', true),
        (26, 'PetStore Kenya', 688,  'https://petstore.co.ke/shop/28', true),
        (26, 'Naivas',       860,  'https://www.naivas.online/omena-perfect-mix-dog-meal-5kg', true)
      ON CONFLICT DO NOTHING;

      SELECT setval(pg_get_serial_sequence('store_prices', 'id'), COALESCE(max(id), 1)) FROM store_prices;
    `
  },
  {
    id: 3,
    name: 'create_blog_posts',
    up: `
      CREATE TABLE IF NOT EXISTS blog_posts (
        id           SERIAL PRIMARY KEY,
        title        TEXT NOT NULL,
        slug         TEXT UNIQUE NOT NULL,
        content      TEXT NOT NULL,
        excerpt      TEXT,
        image_url    TEXT,
        published_at TIMESTAMPTZ DEFAULT NOW(),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, published_at) VALUES
      (
        1, 'The Essential Dog Care Guide', 'essential-dog-care-guide',
        'Whether you''re a first time dog parent or looking to brush up on the basics, this easy and practical guide has everything you need to give your pup the best start. Inside, you''ll find essential supplies, a safety checklist, nutrition and feeding tips, foods to avoid, grooming, and training pointers.',
        'Whether you''re a first time dog parent or looking to brush up on the basics, this easy and practical guide has everything you need to give your pup the best start.',
        '/images/blogs/puppy-guide.webp', '2022-12-01T00:00:00Z'
      ),
      (
        2, 'The Essential Cat Care Guide', 'essential-cat-care-guide',
        'Whether you''re a new cat parent or looking to refresh your knowledge, this quick and practical guide has everything you need to give your feline the best start. Inside, you''ll find essential supplies, a safety checklist, nutrition and feeding tips, foods to avoid, litter training, and enrichment ideas.',
        'Whether you''re a new cat parent or looking to refresh your knowledge, this quick and practical guide has everything you need to give your feline the best start.',
        '/images/blogs/Cat.jpg.webp', '2022-11-30T00:00:00Z'
      ),
      (
        3, 'Mixed Feeding for Dogs & Cats: How to Combine Wet and Dry Food the Right Way', 'mixed-feeding-dogs-cats',
        'If you''ve ever stood in the pet food aisle or browsed through website products, you''ve probably asked yourself: ''Should I feed my pet dry food, wet food, or both?'' But what if you don''t have to choose? What if you could give your pet the best of both worlds? Mixed feeding, which combines wet and dry food, offers excellent hydration and chewing benefits.',
        'If you''ve ever stood in the pet food aisle or browsed through website products, you''ve probably asked yourself: ''Should I feed my pet dry food, wet food, or both?''',
        '/images/blogs/happy-dog-and-cat.jpg.webp', '2022-11-29T00:00:00Z'
      ),
      (
        4, 'Wet vs. Dry Pet Food: Which is the Best Food for Your Dog & Cat?', 'wet-vs-dry-pet-food',
        'As a loving pet parent, you want nothing but the best for your furry family member. Their health and happiness often begin right in their food bowl because the food they eat provides all the essential building blocks, energy, and nutrients that they need to thrive. Just like humans, a balanced diet is key to a long, happy life.',
        'As a loving pet parent, you want nothing but the best for your furry family member. Their health and happiness often begin right in their food bowl.',
        '/images/blogs/istockphoto-2227067994-612x612-1.jpg.webp', '2022-11-29T00:00:00Z'
      ),
      (
        5, 'Puppy Guide', 'puppy-guide',
        'PSK - New Puppy Quick Start Guide Here''s a guide to help you through the initial stages with your puppy! This would be an amazing journey. A checklist will help you out in taking care of your little bundle of furry joy. We offer some considerations you should have in mind. It covers everything from toys to vaccinations.',
        'PSK - New Puppy Quick Start Guide Here''s a guide to help you through the initial stages with your puppy! This would be an amazing journey.',
        '/images/blogs/puppy-guide (1).webp', '2022-11-28T00:00:00Z'
      ),
      (
        6, 'Kitten Guide', 'kitten-guide',
        'PSK - New Kitten Quick Start Guide Here''s a guide to help you through the initial stages with your kitten - being a first time parent can be scary, but this guide will walk you through some of the considerations you should have when starting the journey. It covers setting up their environment, diets, litter choice, and play.',
        'PSK - New Kitten Quick Start Guide Here''s a guide to help you through the initial stages with your kitten - being a first time parent can be scary.',
        '/images/blogs/kitten-guide.webp', '2022-11-28T00:00:00Z'
      ),
      (
        7, 'How to Evaluate Which Food is Best for Your Dog: A Comprehensive Guide', 'how-to-evaluate-dog-food',
        '<strong>November 28th 2022:</strong> When it comes to feeding your dog, you want to make sure you are giving them the best possible food for their individual needs. But, with all the different options, how can you know which one is right for your pup? This comprehensive guide will go over everything you need to look for, from ingredient lists to calorie density.',
        '<strong>November 28th 2022:</strong> When it comes to feeding your dog, you want to make sure you are giving them the best possible food for their individual needs.',
        '/images/blogs/which_food_is_best_for_your_dog_2.webp', '2022-11-28T00:00:00Z'
      ),
      (
        8, '\"Keep Their Food Fresh\": Easy Tips on Storing Dog and Cat Food', 'keep-food-fresh-storing-tips',
        '<strong>November 22nd 2022:</strong> Have you ever had your furry friend experience an unexplained bout of loose stool or vomiting? If you have, you may want to check your pet food storage methods. Poor pet food storage can be the cause of these issues, as bacteria or spoilage can occur if hygiene isn''t observed in keeping the kibbles dry and cool.',
        '<strong>November 22nd 2022:</strong> Have you ever had your furry friend experience an unexplained bout of loose stool or vomiting? If you have, you may want to check your storage methods.',
        '/images/blogs/tips_on_storing_dog_and_cat_food_2.webp', '2022-11-22T00:00:00Z'
      ),
      (
        9, 'Why is my Cat not eating? Hunger Strike or Anorexia in cats', 'why-cat-not-eating-hunger-strike',
        '<strong>November 15th 2022:</strong> Did you know that cats also suffer from anorexia? Yes, our feline friends are known to be fussy eaters but, unfortunately, that''s not always the case. If your cat used to love their food but is now on a food strike or anorexia, it could be a sign that something is wrong. We explore medical, environmental, and behavioral reasons.',
        '<strong>November 15th 2022:</strong> Did you know that cats also suffer from anorexia? Yes, our feline friends are known to be fussy eaters but, unfortunately, that''s not always the case.',
        '/images/blogs/why_is_my_cat_not_eating_2.webp', '2022-11-15T00:00:00Z'
      ),
      (
        10, 'Do You Know Why Your Cat Sleeps So Much? 4 Reasons Your Cat May Be Sleeping All Day', 'why-cat-sleeps-so-much',
        '<strong>November 6th 2022:</strong> Did you know that cats can sleep an average of 15 hours daily? Some stretch that up to 20 hours, especially for older cats and kittens. We watch many cute and funny videos on our phones of how much cats love sleeping all day, every day, literally anywhere and everywhere. Behind this habit are evolutionary sleep patterns.',
        '<strong>November 6th 2022:</strong> Did you know that cats can sleep an average of 15 hours daily? Some stretch that up to 20 hours, especially for older cats and kittens.',
        '/images/blogs/do_you_know_why_your_cat_sleeps_so_much_2.webp', '2022-11-06T00:00:00Z'
      )
      ON CONFLICT (id) DO NOTHING;

      SELECT setval(pg_get_serial_sequence('blog_posts', 'id'), COALESCE(max(id), 1)) FROM blog_posts;
    `
  }
];
