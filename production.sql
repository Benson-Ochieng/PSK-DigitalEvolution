-- ============================================================
-- PetStore Kenya — PRODUCTION SCHEMA + FULL SEED
-- Run this on your Coolify PostgreSQL instance
-- ============================================================

-- ── Schema ───────────────────────────────────────────────────

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

-- Useful index for price queries
CREATE INDEX IF NOT EXISTS idx_store_prices_product ON store_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_store_prices_store   ON store_prices(store_name);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone         ON orders(customer_phone);

-- ── Products ─────────────────────────────────────────────────

TRUNCATE store_prices, order_items, orders, products RESTART IDENTITY CASCADE;

INSERT INTO products
  (name, brand, weight_kg, animal_type, food_type, image_url,
   description, nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture,
   key_ingredients, feeding_guide, replaces_brand, replaces_reason)
VALUES
(
  'Reflex Plus Premium Adult Dog Food - Medium/Large Breed Senior Lamb &amp; Rice 15kg', 'Reflex', 15,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2020/10/Reflex-Plus-Medium-Large-Breed-Senior-Dog-Food-Lamb-And-Rice-15kg-min.png',
  'Reflex Plus Senior Dog Food Lamb and Rice is a complete and balanced formulated super premium dry dog food with lamb and rice for medium-large breeds older than 7 years of age.',
  24, 12,
  3, 10,
  'Dried animal protein, Cereals (rice, corn), Chicken fat, Dried sugar beet, Corn gluten, Wheat bran, Liver flavor, Vitamins and minerals, Whey powder, Salt, Flaxseed, Brewer&#8217;s yeast, MOS (Mannan Oligosaccharide ), Yucca schidigera , Preservat...', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Veggie Dog Original Adult 10kg', 'Josera', 10,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2021/10/JVDOA.jpg',
  'Gluten-free complete food with red lentils for sensitive adult dogs',
  24, 12,
  3, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Hill''s Science Plan', 'Matches the premium nutritional profile of Hill''s Science Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Bonnie Adult Dog Food - Beef 15kg', 'Bonnie', 15,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2017/07/Bonnie-Adult-Dog-Beef-min.png',
  'Bonnie Beef Adult Dog food, full-balanced, beef protein-containing all-natural dog food carefully formulated by a dog nutritionist to meet the nutritional requirements of all adult breeds. Beef meal has been used as animal protein source. The balance of omega 3 &amp; 6 is prov...',
  18, 7,
  3, 10,
  'Processed Animal Protein, Wheat, Corn, Animal Fat, Wheat Middlings, Corn Gluten, Dried Sugar Beet, Liver Aroma, Salt, Flaxseed, Dried Brewer&#8217;s Yeast', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Pedigree', 'Matches the premium nutritional profile of Pedigree with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Rogz Dog Utility Stop Pull Harness Medium - Blue', 'Rogz', NULL,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2021/01/SPSJ11-B_Stop-Pull-Harness.jpg',
  'Rogz Dog Utility Stop Pull Harness Medium - Blue',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Rogz Dog Utility Control Collar Web XX-Large - Blue', 'Rogz', NULL,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2021/01/HCW19-B_Control-Collar-Web.jpg',
  'Rogz Utility control collar Web - XX-Large Blue',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'PetD Deworm 6 Tablets Dog and Cat', 'PetD', NULL,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2022/01/petd-dewomers-.png',
  'Pet D worm tablets dewormer for dogs and cats is highly effective in the removal of roundworms and hookworms.',
  32, 14,
  3, 10,
  '; mebendazole, piperazine citrate, and praziquantel to effectively eliminate and control:

Roundworms
Hookworms
Tapeworms

This triple-action formula works quickly to clear existing worms and help restore your pet’s health', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'SHORT EXPIRY - CLEARANCE: Bonnie Adult Dog Food - Lamb and Rice 15kg', 'Bonnie', 15,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2018/02/Bonnie-Adult-Dog-Lamb-Rice-1080x1080-c.png',
  'Give your dog the goodness of nature with Bonnie Lamb &amp; Rice Adult Dog Food. This tasty, balanced recipe blends tender lamb with rice to provide essential nutrients that keep your dog active, healthy, and happy perfect for adult dogs of every size and breed.',
  24, 12,
  3, 10,
  '?Lamb Proteins (dehydrated), Animal proteins (dehydrated), Wheat, Corn, Animal Fat, Corn Gluten, Rice, Dried Beet Pulp, Liver Flavour, Salt, Flaxseed, Dried Brewer?s Yeast, Yucca Schidigera, Mannan-Oligosaccharides, Beta Glucan', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Pedigree', 'Matches the premium nutritional profile of Pedigree with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'DEFECT/DAMAGED PACKAGE CLEARANCE: Reflex Premium Adult Dog Food Salmon &amp; Rice 15kg', 'Reflex', 15,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2017/11/RADFSR.jpg',
  'Crafted for active and sensitive breeds, Reflex Salmon &amp; Rice Adult Dog Food delivers balanced nutrition rich in omega fatty acids to promote joint health, vitality, and overall wellbeing.',
  24, 12,
  3, 10,
  'Processed Animal Protein, Wheat, Corn, Animal Fat, Fish Meal, Corn Gluten, Fish Fat, Rice, Dried Sugar Beet, Fish Aroma, Salt, Flaxseed, Dried Brewer&#8217;s Yeast', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'DEFECT/DAMAGED - CLEARANCE: Spectrum Lowgain Salmon &amp; Anchovy For Medium And Large Breed Adult Dogs 12kg', 'Spectrum', 12,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2021/01/SLGLBSA12.png',
  'SPECTRUM LOW GRAIN Salmon, Anchovy and Blueberry Medium/Large is a Complete and balanced food for Medium and Large Breed Adult Dogs',
  24, 12,
  3, 10,
  'Dehydrated animal protein (salmon and anchovy protein min', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin Size Health', 'Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Reflex Care Dog Shampoo Colour Enhancing - 300ml', 'Reflex', 0.3,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2026/01/Reflex-care-dog-shampoo-colou-enhancing-shampoo.png',
  'Professional colour-enhancing dog shampoo that naturally intensifies white, black, brown, and red coats. Gentle, pH-balanced &amp; ideal for sensitive skin.',
  28, 8,
  0.8, 10,
  'that work in harmony with the natural pigments of the fur, it revitalizes white, black, bro', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Bonnie Adult Cat Food - Chicken 0.5kg', 'Bonnie', 0.5,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2019/09/Bonnie-Adult-Cat-Chicken-500g-min.png',
  'Full-balanced, chicken protein-containing cat food carefully formulated by a cat nutritionists to meet the nutritional requirements of all adult breeds.',
  32, 14,
  3, 10,
  'Processed Animal Protein (Chicken), Wheat, Corn, Animal Fat, Wheat Middlings, Corn Gluten, Dried Sugar Beet, Chicken Liver Aroma, Salt, Flaxseed, Dried Brewers Yeast, Taurine', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Whiskas', 'Matches the premium nutritional profile of Whiskas with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Rogz Cat Fishcake Bowl 200ml - Anchovy Black Paw Print', 'Rogz', 0.2,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2021/01/CBOWL31-A-Anchovy-Black-Paw-1.jpg',
  'The Rogz Fishcake Bowl in Anchovy Black Paw Print blends sleek design with whisker-conscious ergonomics – perfect for cats with sensitive snouts and owners who value both function and form.Capacity: 200mlMaterial: Premium Melamine',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Royal Canin Kitten 2kg', 'Royal Canin', 2,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2021/12/Royal-Canin-Kitten-food-01.jpg',
  'Balanced and complete feed. For kittens up to 12 months old.',
  34, 4.5,
  0.8, 80,
  'Dehydrated poultry protein, animal fats, maize flour, rice, vegetable protein isolate*, hydrolysed animal proteins, yeasts and parts thereof, fish oil, beet pulp, vegetable fibres, soya oil, minerals, fructo-oligo-saccharides (0,35%), hydrolysed y...', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Spectrum Lowgain Cat Food Sterilised Salmon &amp; Anchovy Formula 12kg', 'Spectrum', 12,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2023/11/spectrum-salmon-anchovy-cat-12kg.png',
  'Spectrum low grain cat food Salmon, Anchovy &amp; cranberries is formulated to meet all the nutritional requirements of your neutered adult cat.',
  32, 14,
  3, 10,
  'Processed animal protein (min', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin Size Health', 'Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Spectrum Gusto Soup For Cat With Tuna And Pumpkin 50g', 'Spectrum', 0.05,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2024/06/SPECTRUM-GUSTO-SOUP-FOR-CAT-WITH-TUNA-AND-PUMPKIN-50GR-1.png',
  'Treat your feline friend to a delightful snack experience with SPECTRUM GUSTO Soup for Cats! Appropriate for any Cat/Kitten as a healthy treat but not a substitute for a complete balanced food. Make sufficient drinking water available.',
  9, 0.2,
  0.1, 90,
  'Made with real tuna, rich in essential proteins and omega fatty acids, ensuring your cat gets the nutrition they need', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin Size Health', 'Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Proline Adult Cat Food - Chicken 1.2kg', 'Proline', 1.2,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2023/04/Untitled-design-89.png',
  'Fully balanced all natural cat food with chicken protein. Carefully formulated by cat nutritionists to meet the nutritional requirements of all adult cats.',
  32, 14,
  3, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Cs Cat Carrier Shoulder Travel Backpack Bag Red', 'CS', NULL,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2025/01/CAT-ACRRIER-SHOULDER-TRAVEL-BACKPACK-RED.png',
  'Make every outing an adventure with the Cat Carrier Shoulder Travel Backpack. Lightweight, portable, and designed for comfort, it allows your cat to experience the world safely by your side. Its spacious interior, ventilation holes, and secure closures create a perfect balance...',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Lara Junior Cat Food 350g', 'Lara', 0.35,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2025/07/Untitled-design-58.png',
  'With Lara Junior’s crispy chunks, your naughty kitten will visibly enjoy the delicious flavor of chicken.',
  32, 14,
  3, 10,
  '">
Ingredients
0', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Truly Mini Hearts Chicken &amp; Fish For Cat 50g', 'Truly', 0.05,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2025/04/Truly-Mini-Hearts-chicken-Fish-50g.png',
  'Treat your cat to Truly Mini Hearts Chicken Treats and give them a snack that not only tastes great but also supports their health. Your furry friend will thank you with purrs and cuddles!',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Pack Of 12 - Wanpy Cat Meat Broth - Tuna &amp; Salmon 50g', 'Wanpy', 0.05,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2026/03/WANPY-CAT-MEAT-BROTH-TUNA-SALMON-50GR-1.png',
  'Wanpy Cat Meat Broth Tuna &amp; Salmon 50g is a grain-free hydrating cat food made with real fish. Rich in Omega-3 and taurine, perfect as a topper or tasty snack for cats. &nbsp;',
  8.5, 4.5,
  0.8, 80,
  'and enriched with taurine, salmon oil, and Vitamin E, Wanpy Meat Broth helps support healthy skin, a shiny coat, and optimal heart and eye health', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Reflex Plus Adult Dog Food Canned - Lamb Chunks in Gravy 400g', 'Reflex', 0.4,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2020/04/Reflex-Plus-Lamb-chunks-in-jelly.png',
  'Reflex Plus Lamb Adult Dog Canned Food, its nutritional value and digestibility are high thanks to its high-quality animal protein and vitamin diversity. Its functional ingredients support many systems, while its high-water content contributes to daily water intake and support...',
  8.5, 4.5,
  0.8, 80,
  'support many systems, while its high-water content contributes to daily water intake and support', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Reflex Plus Dog Alutray Mini Small Breed Beef InGravy 85g', 'Reflex', 0.085,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2024/11/REFLEX-PLUS-DOG-ALUTRAY-MINI-SMALL-BREED-BEEF-IN-GRAVY-85GR.png',
  'Alu-tray is a nutritious wet food with high-quality animal protein and a variety of vitamins. It offers multisystemic benefits due to its functional components. With its high water content, it supports the body''s daily water intake and contributes to kidney health. Additionall...',
  8.5, 4.5,
  0.8, 80,
  'Meat and animal derivatives (4% Beef), Minerals, Derivatives of vegetable origin', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'JosiDog Game In Sauce Dog Wet Food 415g', 'Josera', 0.415,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2024/04/JOSIDOG-Game-in-Sauce-Dog-Wet-food-415g.png',
  'JosiDog Game in Sauce, providing breed-appropriate daily nutrition of your adult four-legged friend is child’s play. The fine pieces in sauce with game only contain healthy ingredients, with no added fuss such as artificial additives. What’s more, it also contains vitamins to ...',
  8.5, 4.5,
  0.8, 80,
  ', with no added fuss such as artificial additives', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Hill''s Science Plan', 'Matches the premium nutritional profile of Hill''s Science Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Ultimates Dog Can Chicken Mince &amp; Tuna 400g', 'Ultimates', 0.4,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/06/ULTIMATES-DOG-CAN-CHICKEN-MINCE-TUNA-400G.png',
  'Ultimates Indulge with Chicken Mince &amp; Tuna contains natural meat, grain-free and made with healthy fish oils. Indulge the one you love with the Ultimate dog cuisine.',
  8.5, 4.5,
  0.8, 80,
  'Meats (including chicken and/or beef and/or fish), Thickeners, Vitamins and Minerals, Colour, Gelling Agent', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Pack Of 24  - Reflex Plus Canned Dog Food Salmon In Gravy 400g', 'Reflex', 0.4,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/11/REFLEX-PLUS-CANNED-DOG-FOOD-SALMON-IN-GRAVY-400GR.png',
  'Reflex Plus Canned Dog Food Salmon in Gravy, Its nutritional value and digestibility are high thanks to its high-quality animal protein and vitamin diversity. Its functional ingredients support many systems, while its high-water content contributes to daily water intake and su...',
  8.5, 4.5,
  0.8, 80,
  'support many systems, while its high-water content contributes to daily water intake and su', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Wanpy Dog Food Chicken &amp; Vegetables 375g', 'Wanpy', 0.375,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2026/01/Wanpy-chicken-veg-375-gr-.png',
  'WANPY Chicken &amp; Vegetables Canned Dog Food 375g: Premium wet food with lean chicken, fiber-rich veggies, vitamins A, C, E for all breeds. Boosts digestion, immunity, and muscle health. No artificial additives complete balanced meal! &nbsp;',
  8.5, 4.5,
  0.8, 80,
  'Main Protein: High-quality lean chicken for essential amino acids and energy', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'King Canned Dog Food - Lamb Chunks in Gravy 400g', 'King', 0.4,
  'dog', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/11/KING-2.png',
  'King Canned Dog Food Lamb Chunks in Gravy 400g is a complementary meal for adult dogs, made with real lamb (4%), cereals, and essential minerals. The savory meaty chunks in gravy provide a protein-rich, moisture-packed formula that supports hydration, healthy muscles, and over...',
  7, 5,
  0.5, 83,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Bonnie Canned Cat Food - Chicken in Gravy 400g', 'Bonnie', 0.4,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2018/02/Bonnie-Adult-Cat-Canned-Chicken-Chunks-in-Gravy-1080x1080-c.png',
  'Nutritious wet food made with tender chicken pieces in sauce. Enriched with essential vitamins, minerals, and taurine to support strong muscles, healthy digestion, and hydration for adult cats.',
  8.5, 4.5,
  0.8, 80,
  'Meat and Animal Derivatives (4% Chicken), Grains, Minerals, Plant By-products, Sugar', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Whiskas', 'Matches the premium nutritional profile of Whiskas with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'MigliorGatto Adult Cat Food Pouches Salmon &amp; Tuna 24x100g', 'Miglior', 0.1,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2022/05/MCW016.jpg',
  'Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.',
  8.5, 4.8,
  0.8, 77,
  'Meat and animal derivatives 30%, fish and fish derivatives (salmon 5%), cereals, minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Miglior Canned Cat Food - Veal &amp; Carrots, Pate 400g', 'Miglior', 0.4,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2023/01/MIGLIOR-GATTO-CON-VITELLO-E-CAROTE-IN-PATE-400G.jpg',
  'This formula guarantees key nutrients like Omega-3, vitamins, calcium, and phosphorus supporting strong bones and teeth, healthy skin and a glossy coat. A high-quality meal your cat will love, every day.',
  10, 6,
  0.8, 77,
  '– No artificial colors, flavors, or fillers
Tender, Meaty Texture – Chicken chunks in gravy cats crave
Supports Immune Health – With added antioxidants and essential nutrients
Skin &amp; Coat Support – Omega-3 and vitamins for a glossy coat
Comple...', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Pack Of 24 - Miglior Cat Unico Mousse Pouch - Veal 85g', 'Miglior', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2024/09/MCW2021-UNICO-POUCH-TURKEY.png',
  'Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.',
  10.5, 4,
  0.8, 80,
  'Veal 50% (lungs, livers), minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Felix Cat Pouch 85g Chicken', 'Felix', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/08/Untitled-design-2.png',
  'Satisfy your cat’s appetite with FELIX Chicken Cat Pouch 85g, featuring soft, meaty chicken pieces immersed in savory jelly. Formulated as a complete meal, it contains the perfect balance of nutrients, vitamins, minerals, and Omega-6 to maintain your cat’s overall health and v...',
  11.5, 4.5,
  0.8, 82,
  'Chicken and animal derivatives, vegetable protein extracts, minerals, various sugars', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Whiskas Adult Cat Pouches Poultry/Feasts M/Pak 12x85g', 'Whiskas', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/11/WHISKAS-ACAT-POUCHES-PFEASTS-MPAK-12X85G.png',
  'Give your adult cat the delicious taste they crave and the balanced nutrition they deserve with WHISKAS 1+ Poultry Feasts in Gravy. Expertly crafted with 100% high-quality, sustainably sourced ingredients, this complete wet cat food provides everything your feline needs to sta...',
  8.5, 4.5,
  0.8, 80,
  ', this complete wet cat food provides everything your feline needs to sta', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Rogz Dog Yumz-Treat Toy Bone 11.5cm - Blue Medium (YU03-B)', 'Rogz', NULL,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2022/01/YU01-B-Yumz-Small-Blue.jpg',
  'Rogz Dog Yumz-Treat Toy bone - Blue Medium',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Simba Cat Canned Cat Food Mousse – Salmon &amp; Shrimps 85g', 'Simba', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2026/06/Simba-Cat-Canned-Cat-Food-Mousse-–-Salmon-Shrimps-85g-1.png',
  'Give your cat a delicious gourmet meal with Simba Cat Mousse Salmon &amp; Shrimps. Made in Italy with quality salmon and shrimps, this complete wet cat food provides high-quality protein, essential vitamins, minerals, and taurine to support your cat''s overall health and wellbe...',
  8.5, 4.5,
  0.8, 80,
  'Size: 85g
&nbsp;
			
					
				
	Additional information


			
			Weight
			0', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Bravecto Chewable Tablet for Dogs - 4.5 to 10kg, 1 Treatment', 'Bravecto', 10,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2020/06/Bravecto-Dog-4.5-10kg-Chewable-Tablet-250mg-min.png',
  'Bravecto ® (Fluralaner) 1 dose chew (4.5-10kg dog), 12-week Flea &amp; tick protection for dogs - kill adult fleas, prevent fleas, manage &amp; control ticks.',
  28, 8,
  0.8, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Pack Of 10 - Reflex Happy Hour Dog Treat Healthy Bones Lamb Egg &amp; Cranberry 60g', 'Reflex', 0.06,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2025/01/Happy-Hour-Healthy-Bones-Dog-treats.png',
  'Happy hour dog treats Health Bones Lamb, Egg &amp; Cranberry - Perfect for rewarding good behavior or just showing your pet some extra love, Reflex Happy Hours Dog Treats are free from artificial preservatives and fillers. Plus, they’re great for maintaining healthy teeth and ...',
  28, 8,
  0.8, 10,
  ', these treats are rich in essential vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Wanpy Cat Pouch - Chicken &amp; Shrimp 85g', 'Wanpy', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2026/01/CHICKEN-SHRIMP.png',
  'WANPY Cat Pouch Chicken &amp; Shrimp 85g is a complete, preservative-free wet cat food made with real chicken and shrimp, suitable for kittens and adult cats. &nbsp;',
  8.5, 4.5,
  0.8, 80,
  'Chicken
Shrimp
Water
Natural thickener
Taurine
Added vitamins and minerals

No added preservatives, artificial colors, or flavors', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Reflex Dog Snackies Treats Smoked Beef Training Bites 170g', 'Reflex', 0.17,
  'dog', 'treat', 'https://petstore.co.ke/wp-content/uploads/2026/01/reflex-dog-snackies-treats-smoked-beef-1.png',
  'High-protein beef dog treats made with 92% real meat. Grain-free, 100% natural, and perfect for healthy training rewards and everyday snacking.',
  28, 8,
  0.8, 10,
  ', they contain no artificial colors, flavors, or preservatives—just clean, honest nutrition you can trust', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Reflex Happy Hour Cat Treat Calmness Lamb &amp; Cranberry Calming Support 60g', 'Reflex', 0.06,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2024/07/REFLEX-HAPPY-HOUR-CAT-TREAT-CALMNESS-LAMB-CRANBERRY-CLAMING-SUPPORT-60GR-1.png',
  'Happy hour cat treats calmness lamb &amp; cranberry calming support- Perfect for rewarding good behavior or just showing your pet some extra love, Reflex Happy Hours Cat Treats are free from artificial preservatives and fillers. Plus, they’re great for maintaining healthy teet...',
  28, 8,
  0.8, 10,
  ', these treats are rich in essential vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Pack Of 10 - Reflex Cat Pocket Treat Sensitive 60g', 'Reflex', 0.06,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2024/11/REFLEX-CAT-POCKET-TREAT-SENSITIVE-60GR.png',
  'Reflex Cat Pocket Treats – Delicious, Healthy Snacks for Your Feline Friend Treat your cat to the irresistible taste of Reflex Cat Pocket Treats, a tasty and nutritious reward for your furry companion. Made with high-quality ingredients and crafted for cats of all ages, these ...',
  28, 8,
  0.8, 10,
  'and crafted for cats of all ages, these', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Purina Pro Plan', 'Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Churu Cat Treats Chicken Recipe 4 Tubes', 'Churu', NULL,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2026/01/CHURU-CHICKEN-RECIPE-4CT.png',
  'Churu Cat Lickable Treats Chicken Variety creamy, grain-free puree made with real chicken. Boosts hydration, packed with protein and Vitamin E. Perfect as a snack, topper, or interactive treat for cats.',
  28, 8,
  0.8, 10,
  'Interactive Feeding: Lick straight from the tube, lap from a bowl, or mix into kibble or wet food
Supports Hydration: 91% moisture helps keep cats hydrated and supports urinary health
Nutritious Boost: Vitamin E supports immunity, and added Taurin...', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Inaba Foods Cat Treat Grilled Chicken Fillet Extra Tender In Crab Flavored Broth', 'Churu', NULL,
  'cat', 'treat', 'https://petstore.co.ke/wp-content/uploads/2026/02/Grilled-Cat-Chicken-Fillet-Extra-Tender-In-Crab-Flavored-Broth-1.png',
  'Premium Inaba grilled chicken fillet in crab flavored broth for cats. Grain-free, moisture-rich treat with Vitamin E for immunity and hydration support.',
  28, 8,
  0.8, 10,
  'Chicken, Natural Crab Flavored Broth, Tapioca, Collagen, Guar Gum, Vitamin E Supplement, Green Tea Extract', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Grounded Surface Cleaner- Everyday 500ml', 'Grounded', 0.5,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2020/11/GROUNDED-SPRAY-DEEP.jpg',
  'Everyday surface spray. Deodorizes &amp; degreases. Powered by citrus concentrate, this everyday cleanser is great for kitchens and bathrooms. It contains limonene, a chemical from citrus peels that’s a powerful degreaser/solvent.',
  24, 12,
  3, 10,
  'Saponified Coconut, Canola, Sunflower Oils; Citric Acid, Sodium Bicarbonate, Lemongrass, Eucalyptus &amp; Tea Tree Essential Oils


Proudly MADE IN KENYA by Grounded
			
					
				
	Additional information


			
			Weight
			0', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Gift Voucher 1,000', 'Generic', NULL,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2024/02/Gift-voucher-1k.jpeg',
  'Looking for the perfect present for the pet lover in your life or a pet that is not yours? Delight them with a Petstore Kenya Gift Voucher!',
  24, 12,
  3, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Miglior Cat Food Pouch Salmon &amp; Tuna 100g', 'Miglior', 0.1,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2022/05/MCW016.jpg',
  'Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.',
  8.5, 4.8,
  0.8, 77,
  'Meat and animal derivatives 30%, fish and fish derivatives (salmon 5%), cereals, minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Grounded Body Bar Calming Lavender Coconut Avocado 150g', 'Grounded', 0.15,
  'dog', 'dry', 'https://petstore.co.ke/wp-content/uploads/2024/07/Body-Bar-Calming-2-LAVENDER-e1722431414891.jpg',
  'Enriched with calming and nourishing goodness. This luxurious bar gently cleanses and hydrates your skin, leaving it feeling soft, supple, and irresistibly touchable. Leaves your skin and hair feeling deeply nourished and moisturized.',
  24, 12,
  3, 10,
  'safe for humans and the environment', 'Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Snappy Tom Beef And Veg 85g', 'Generic', 0.085,
  'cat', 'wet', 'https://petstore.co.ke/wp-content/uploads/2025/06/SNAPPY-TOM-BEEF-AND-VEG.png',
  'Made with GRASS-FED beef and vegetables and the combination helps to improve your cat’s appetite. The high-protein fish will keep her in ideal body condition and stay healthy.',
  8.5, 4.5,
  0.8, 80,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
),
(
  'Ferplast Comb GO 5864', 'Ferplast', NULL,
  'cat', 'dry', 'https://petstore.co.ke/wp-content/uploads/2025/08/Screenshot-2025-08-11-094336.png',
  'The Ferplast GRO 5864 is a high-quality grooming comb designed for medium and long-haired dogs and cats. Featuring a sturdy plastic handle and rounded teeth, it detangles fur efficiently while being gentle on your pet’s skin.',
  32, 14,
  3, 10,
  'Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals', 'Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.',
  'Royal Canin', 'Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.'
);

-- ── Prices ───────────────────────────────────────────────────

INSERT INTO store_prices (product_id, store_name, price, product_url, in_stock) VALUES
  (1, 'PetStore Kenya', 11500, 'https://petstore.co.ke/product/reflex-plus-premium-adult-dog-food-medium-large-breed-senior-lamb-rice-15kg/', false),
  (1, 'Carrefour', 13800, 'https://www.carrefour.ke/mafken/en/search?q=reflex-plus-premium-adult-dog-food-medium-large-breed-senior-lamb-rice-15kg', false),
  (2, 'PetStore Kenya', 15900, 'https://petstore.co.ke/product/veggie-dog-original-adult-10kg/', true),
  (2, 'Carrefour', 19080, 'https://www.carrefour.ke/mafken/en/search?q=veggie-dog-original-adult-10kg', true),
  (3, 'PetStore Kenya', 6570, 'https://petstore.co.ke/product/bonnie-adult-dog-food-beef-15kg/', true),
  (3, 'Carrefour', 7884, 'https://www.carrefour.ke/mafken/en/search?q=bonnie-adult-dog-food-beef-15kg', true),
  (4, 'PetStore Kenya', 3240, 'https://petstore.co.ke/product/rogz-dog-utility-stop-pull-harness-medium-blue/', true),
  (4, 'Carrefour', 3888, 'https://www.carrefour.ke/mafken/en/search?q=rogz-dog-utility-stop-pull-harness-medium-blue', true),
  (5, 'PetStore Kenya', 2080, 'https://petstore.co.ke/product/rogz-dog-utility-control-collar-web-xx-large-blue/', true),
  (5, 'Carrefour', 2496, 'https://www.carrefour.ke/mafken/en/search?q=rogz-dog-utility-control-collar-web-xx-large-blue', true),
  (6, 'PetStore Kenya', 500, 'https://petstore.co.ke/product/petd-deworm-tablets-dog-and-cat/', true),
  (6, 'Carrefour', 600, 'https://www.carrefour.ke/mafken/en/search?q=petd-deworm-tablets-dog-and-cat', true),
  (7, 'PetStore Kenya', 4599, 'https://petstore.co.ke/product/short-expiry-clearance-bonnie-adult-dog-food-lamb-and-rice-15kg/', false),
  (7, 'Carrefour', 5519, 'https://www.carrefour.ke/mafken/en/search?q=short-expiry-clearance-bonnie-adult-dog-food-lamb-and-rice-15kg', false),
  (8, 'PetStore Kenya', 7703, 'https://petstore.co.ke/product/reflex-premium-adult-dog-food-salmon-rice-15kg-2/', false),
  (8, 'Carrefour', 9244, 'https://www.carrefour.ke/mafken/en/search?q=reflex-premium-adult-dog-food-salmon-rice-15kg-2', false),
  (9, 'PetStore Kenya', 11165, 'https://petstore.co.ke/product/defect-damaged-package-clearance-spectrum-low-grain-salmon-anchovy-for-medium-and-large-breed-adult-dogs-12kg-copy/', false),
  (9, 'Carrefour', 13398, 'https://www.carrefour.ke/mafken/en/search?q=defect-damaged-package-clearance-spectrum-low-grain-salmon-anchovy-for-medium-and-large-breed-adult-dogs-12kg-copy', false),
  (10, 'PetStore Kenya', 1508, 'https://petstore.co.ke/product/reflex-care-colour-enhancing-dog-shampoo/', false),
  (10, 'Carrefour', 1810, 'https://www.carrefour.ke/mafken/en/search?q=reflex-care-colour-enhancing-dog-shampoo', false),
  (11, 'PetStore Kenya', 690, 'https://petstore.co.ke/product/bonnie-adult-cat-food-chicken/', true),
  (11, 'Carrefour', 828, 'https://www.carrefour.ke/mafken/en/search?q=bonnie-adult-cat-food-chicken', true),
  (12, 'PetStore Kenya', 1850, 'https://petstore.co.ke/product/rogz-cat-fishcake-bowl-200ml-anchovy-black-paw-print/', true),
  (12, 'Carrefour', 2220, 'https://www.carrefour.ke/mafken/en/search?q=rogz-cat-fishcake-bowl-200ml-anchovy-black-paw-print', true),
  (13, 'PetStore Kenya', 6000, 'https://petstore.co.ke/product/royal-canin-kitten-2kg/', true),
  (13, 'Carrefour', 7200, 'https://www.carrefour.ke/mafken/en/search?q=royal-canin-kitten-2kg', true),
  (14, 'PetStore Kenya', 15200, 'https://petstore.co.ke/product/spectrum-low-grain-cat-food-sterlised-salmon-anchovy-12kg/', false),
  (14, 'Carrefour', 18240, 'https://www.carrefour.ke/mafken/en/search?q=spectrum-low-grain-cat-food-sterlised-salmon-anchovy-12kg', false),
  (15, 'PetStore Kenya', 176, 'https://petstore.co.ke/product/spectrum-gusto-soup-for-cat-with-tuna-and-pumpkin-50gr-2/', true),
  (15, 'Carrefour', 211, 'https://www.carrefour.ke/mafken/en/search?q=spectrum-gusto-soup-for-cat-with-tuna-and-pumpkin-50gr-2', true),
  (16, 'PetStore Kenya', 1765, 'https://petstore.co.ke/product/proline-adult-cat-food-chicken-1-2kg-2/', true),
  (16, 'Carrefour', 2118, 'https://www.carrefour.ke/mafken/en/search?q=proline-adult-cat-food-chicken-1-2kg-2', true),
  (17, 'PetStore Kenya', 3500, 'https://petstore.co.ke/product/cs-cat-carrier-shoulder-travel-backpack-bag-red/', true),
  (17, 'Carrefour', 4200, 'https://www.carrefour.ke/mafken/en/search?q=cs-cat-carrier-shoulder-travel-backpack-bag-red', true),
  (18, 'PetStore Kenya', 495, 'https://petstore.co.ke/product/lara-junior-cat-food-350g/', false),
  (18, 'Carrefour', 594, 'https://www.carrefour.ke/mafken/en/search?q=lara-junior-cat-food-350g', false),
  (19, 'PetStore Kenya', 260, 'https://petstore.co.ke/product/truly-mini-hearts-chicken-fish-for-cat-50g/', true),
  (19, 'Carrefour', 312, 'https://www.carrefour.ke/mafken/en/search?q=truly-mini-hearts-chicken-fish-for-cat-50g', true),
  (20, 'PetStore Kenya', 1557, 'https://petstore.co.ke/product/pack-of-12-pay-for-10-get-2-free-wanpy-cat-meat-broth-tuna-salmon-50gr/', true),
  (20, 'Carrefour', 1868, 'https://www.carrefour.ke/mafken/en/search?q=pack-of-12-pay-for-10-get-2-free-wanpy-cat-meat-broth-tuna-salmon-50gr', true),
  (21, 'PetStore Kenya', 244, 'https://petstore.co.ke/product/reflex-plus-adult-dog-food-canned-lamb-chunks-in-gravy-0-4kg/', true),
  (21, 'Carrefour', 293, 'https://www.carrefour.ke/mafken/en/search?q=reflex-plus-adult-dog-food-canned-lamb-chunks-in-gravy-0-4kg', true),
  (22, 'PetStore Kenya', 187, 'https://petstore.co.ke/product/reflex-plus-dog-alutray-mini-small-breed-beef-in-gravy-85gr-2/', false),
  (22, 'Carrefour', 224, 'https://www.carrefour.ke/mafken/en/search?q=reflex-plus-dog-alutray-mini-small-breed-beef-in-gravy-85gr-2', false),
  (23, 'PetStore Kenya', 306, 'https://petstore.co.ke/product/josidog-game-in-sauce-dog-wet-food-415kg-2/', true),
  (23, 'Carrefour', 367, 'https://www.carrefour.ke/mafken/en/search?q=josidog-game-in-sauce-dog-wet-food-415kg-2', true),
  (24, 'PetStore Kenya', 284, 'https://petstore.co.ke/product/ultimates-dog-can-chicken-mince-tuna-400g-2/', true),
  (24, 'Carrefour', 341, 'https://www.carrefour.ke/mafken/en/search?q=ultimates-dog-can-chicken-mince-tuna-400g-2', true),
  (25, 'PetStore Kenya', 6588, 'https://petstore.co.ke/product/pack-of-24-reflex-plus-canned-dog-food-salmon-in-gravy-400gr/', true),
  (25, 'Carrefour', 7906, 'https://www.carrefour.ke/mafken/en/search?q=pack-of-24-reflex-plus-canned-dog-food-salmon-in-gravy-400gr', true),
  (26, 'PetStore Kenya', 200, 'https://petstore.co.ke/product/wanpy-chicken-vegetables-canned-dog-food-375g/', true),
  (26, 'Carrefour', 240, 'https://www.carrefour.ke/mafken/en/search?q=wanpy-chicken-vegetables-canned-dog-food-375g', true),
  (27, 'PetStore Kenya', 201, 'https://petstore.co.ke/product/king-canned-dog-food-lamb-chunks-in-gravy-400gr/', true),
  (27, 'Carrefour', 241, 'https://www.carrefour.ke/mafken/en/search?q=king-canned-dog-food-lamb-chunks-in-gravy-400gr', true),
  (28, 'PetStore Kenya', 231, 'https://petstore.co.ke/product/bonnie-canned-cat-food-chicken-in-gravy-400gr/', true),
  (28, 'Carrefour', 277, 'https://www.carrefour.ke/mafken/en/search?q=bonnie-canned-cat-food-chicken-in-gravy-400gr', true),
  (29, 'PetStore Kenya', 3823, 'https://petstore.co.ke/product/migliorgatto-adult-cat-food-pouch-strips-salmon-and-tuna-100gr-pack-of-24/', true),
  (29, 'Carrefour', 4588, 'https://www.carrefour.ke/mafken/en/search?q=migliorgatto-adult-cat-food-pouch-strips-salmon-and-tuna-100gr-pack-of-24', true),
  (30, 'PetStore Kenya', 224, 'https://petstore.co.ke/product/miglior-cat-can-chunks-veal-carrots-in-pate-400gr-2/', true),
  (30, 'Carrefour', 269, 'https://www.carrefour.ke/mafken/en/search?q=miglior-cat-can-chunks-veal-carrots-in-pate-400gr-2', true),
  (31, 'PetStore Kenya', 3815, 'https://petstore.co.ke/product/miglior-cat-unico-pouch-veal-85gr-pack-of-24/', true),
  (31, 'Carrefour', 4578, 'https://www.carrefour.ke/mafken/en/search?q=miglior-cat-unico-pouch-veal-85gr-pack-of-24', true),
  (32, 'PetStore Kenya', 194, 'https://petstore.co.ke/product/felix-cat-pouch-85g-chicken/', true),
  (32, 'Carrefour', 233, 'https://www.carrefour.ke/mafken/en/search?q=felix-cat-pouch-85g-chicken', true),
  (33, 'PetStore Kenya', 2620, 'https://petstore.co.ke/product/whiskas-adult-cat-pouches-fish-m-pak-12x85g/', false),
  (33, 'Carrefour', 3144, 'https://www.carrefour.ke/mafken/en/search?q=whiskas-adult-cat-pouches-fish-m-pak-12x85g', false),
  (34, 'PetStore Kenya', 1400, 'https://petstore.co.ke/product/rogz-dog-yumz-treat-toy-bone-11-5cm-blue-medium/', false),
  (34, 'Carrefour', 1680, 'https://www.carrefour.ke/mafken/en/search?q=rogz-dog-yumz-treat-toy-bone-11-5cm-blue-medium', false),
  (35, 'PetStore Kenya', 179, 'https://petstore.co.ke/product/simba-cat-canned-cat-food-mousse-salmon-shrimps-85g-2/', true),
  (35, 'Carrefour', 215, 'https://www.carrefour.ke/mafken/en/search?q=simba-cat-canned-cat-food-mousse-salmon-shrimps-85g-2', true),
  (36, 'PetStore Kenya', 3850, 'https://petstore.co.ke/product/bravecto-chewable-tablet-for-dogs-4-5kg-10kg-flea-tick-treatment/', true),
  (36, 'Carrefour', 4620, 'https://www.carrefour.ke/mafken/en/search?q=bravecto-chewable-tablet-for-dogs-4-5kg-10kg-flea-tick-treatment', true),
  (37, 'PetStore Kenya', 1755, 'https://petstore.co.ke/product/reflex-happy-hour-dog-treat-healthy-bones-lamb-egg-cranberry-60gr-pack-of-12/', true),
  (37, 'Carrefour', 2106, 'https://www.carrefour.ke/mafken/en/search?q=reflex-happy-hour-dog-treat-healthy-bones-lamb-egg-cranberry-60gr-pack-of-12', true),
  (38, 'PetStore Kenya', 144, 'https://petstore.co.ke/product/wanpy-cat-pouch-chicken-shrimp-85g/', true),
  (38, 'Carrefour', 173, 'https://www.carrefour.ke/mafken/en/search?q=wanpy-cat-pouch-chicken-shrimp-85g', true),
  (39, 'PetStore Kenya', 1150, 'https://petstore.co.ke/product/premium-beef-dog-treats-grain-free-natural/', true),
  (39, 'Carrefour', 1380, 'https://www.carrefour.ke/mafken/en/search?q=premium-beef-dog-treats-grain-free-natural', true),
  (40, 'PetStore Kenya', 195, 'https://petstore.co.ke/product/reflex-happy-hour-cat-treat-calmness-lamb-cranberry-claming-support-60gr-2/', true),
  (40, 'Carrefour', 234, 'https://www.carrefour.ke/mafken/en/search?q=reflex-happy-hour-cat-treat-calmness-lamb-cranberry-claming-support-60gr-2', true),
  (41, 'PetStore Kenya', 3150, 'https://petstore.co.ke/product/reflex-cat-pocket-treat-sensitive-60gr-pack-of-10/', true),
  (41, 'Carrefour', 3780, 'https://www.carrefour.ke/mafken/en/search?q=reflex-cat-pocket-treat-sensitive-60gr-pack-of-10', true),
  (42, 'PetStore Kenya', 350, 'https://petstore.co.ke/product/churu-cat-lickable-treats-chicken-recipe/', true),
  (42, 'Carrefour', 420, 'https://www.carrefour.ke/mafken/en/search?q=churu-cat-lickable-treats-chicken-recipe', true),
  (43, 'PetStore Kenya', 350, 'https://petstore.co.ke/product/inaba-grilled-chicken-crab-broth-cat-treat/', true),
  (43, 'Carrefour', 420, 'https://www.carrefour.ke/mafken/en/search?q=inaba-grilled-chicken-crab-broth-cat-treat', true),
  (44, 'PetStore Kenya', 575, 'https://petstore.co.ke/product/grounded-all-natural-non-toxic-cleaner-500ml/', true),
  (44, 'Carrefour', 690, 'https://www.carrefour.ke/mafken/en/search?q=grounded-all-natural-non-toxic-cleaner-500ml', true),
  (45, 'PetStore Kenya', 1000, 'https://petstore.co.ke/product/gift-voucher-1000/', true),
  (45, 'Carrefour', 1200, 'https://www.carrefour.ke/mafken/en/search?q=gift-voucher-1000', true),
  (46, 'PetStore Kenya', 177, 'https://petstore.co.ke/product/migliorgatto-pouch-strips-salmon-and-tuna-100gr/', true),
  (46, 'Carrefour', 212, 'https://www.carrefour.ke/mafken/en/search?q=migliorgatto-pouch-strips-salmon-and-tuna-100gr', true),
  (47, 'PetStore Kenya', 420, 'https://petstore.co.ke/product/grounded-body-bar-calming-lavender-coconut-avocado-150g/', true),
  (47, 'Carrefour', 504, 'https://www.carrefour.ke/mafken/en/search?q=grounded-body-bar-calming-lavender-coconut-avocado-150g', true),
  (48, 'PetStore Kenya', 169, 'https://petstore.co.ke/product/snappy-tom-beef-and-veg-85g/', true),
  (48, 'Carrefour', 203, 'https://www.carrefour.ke/mafken/en/search?q=snappy-tom-beef-and-veg-85g', true),
  (49, 'PetStore Kenya', 2485, 'https://petstore.co.ke/product/ferplast-comb-gro-5864/', true),
  (49, 'Carrefour', 2982, 'https://www.carrefour.ke/mafken/en/search?q=ferplast-comb-gro-5864', true);

