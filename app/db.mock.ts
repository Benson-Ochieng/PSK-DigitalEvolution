// Automatically generated in-memory mock database
export interface Product {
  id: number;
  name: string;
  brand: string | null;
  weight_kg: number | null;
  animal_type: string | null;
  food_type: string | null;
  image_url: string | null;
  description: string | null;
  nutrition_protein: number | null;
  nutrition_fat: number | null;
  nutrition_fibre: number | null;
  nutrition_moisture: number | null;
  key_ingredients: string | null;
  feeding_guide: string | null;
  replaces_brand: string | null;
  replaces_reason: string | null;
  created_at: string;
}

export interface StorePrice {
  id: number;
  product_id: number;
  store_name: string;
  price: number;
  product_url: string | null;
  in_stock: boolean;
  last_updated: string;
}

export interface Order {
  id: number;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  delivery_area: string | null;
  subtotal_kes: number;
  delivery_fee_kes: number;
  total_kes: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id: number;
  phone: string;
  email: string | null;
  name: string | null;
  created_at: string;
}

export const mockProducts: Product[] = [
  {
    "id": 1,
    "name": "Farmers Choice Team Pet/Dog Food 2Kg",
    "brand": "Farmers Choice",
    "weight_kg": 2,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://cdn.mafrservices.com/pim-content/KEN/media/product/40553/1728486004/40553_main.jpg?im=Resize=(300,300)",
    "description": "A trusted staple in Kenyan homes, Farmers Choice Team Pet Food is formulated for active adult dogs. Balanced protein from maize and soya with essential vitamins makes this a reliable everyday feed that keeps working dogs strong and energetic.",
    "nutrition_protein": 18,
    "nutrition_fat": 8,
    "nutrition_fibre": 4.5,
    "nutrition_moisture": 12,
    "key_ingredients": "Maize, Soya Bean Meal, Bone Meal, Sunflower Oil, Vitamin & Mineral Premix, Salt",
    "feeding_guide": "Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day. Always provide fresh water.",
    "replaces_brand": "Pedigree Adult Dry",
    "replaces_reason": "Comparable protein levels at a third of the import cost. Made in Kenya so it reaches you fresher, with no long shipping delays that degrade nutrient quality.",
    "created_at": "2026-06-19T14:30:16.557Z"
  },
  {
    "id": 2,
    "name": "Farmers Choice Beef Dog Food 2Kg",
    "brand": "Farmers Choice",
    "weight_kg": 2,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://cdn.mafrservices.com/pim-content/KEN/media/product/40554/1725537604/40554_main.jpg?im=Resize=(300,300)",
    "description": "Farmers Choice Beef Dog Food uses real beef flavour protein to satisfy even the pickiest Kenyan dog. The same trusted Farmers Choice quality, now with a richer taste profile to keep your dog coming back to the bowl.",
    "nutrition_protein": 18.5,
    "nutrition_fat": 8.5,
    "nutrition_fibre": 4.5,
    "nutrition_moisture": 12,
    "key_ingredients": "Maize, Beef Meal, Soya Bean Meal, Animal Fat, Vitamin E, Zinc Sulphate, Salt",
    "feeding_guide": "Small dogs (5–10kg): 100–150g/day · Medium dogs (10–25kg): 150–300g/day · Large dogs (25kg+): 300–450g/day.",
    "replaces_brand": "Pedigree Beef Adult",
    "replaces_reason": "Real Kenyan beef meal versus imported meat-by-product. Farmers Choice sources from local abattoirs, meaning higher freshness and traceability.",
    "created_at": "2026-06-19T14:30:16.559Z"
  },
  {
    "id": 3,
    "name": "Bravo Dog Food Adult Chicken 2Kg",
    "brand": "Bravo",
    "weight_kg": 2,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/pim-content/KEN/media/product/83730/1758891605/83730_main.jpg?im=Resize=(300,300)",
    "description": "Bravo Adult Chicken is Sigma Foods' flagship recipe — a high-protein, chicken-forward kibble designed specifically for East African climate conditions. The formula supports coat health and immune function with added omega fatty acids and zinc.",
    "nutrition_protein": 21,
    "nutrition_fat": 10,
    "nutrition_fibre": 3.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Meal, Vitamin A, Vitamin D3, Vitamin E, Zinc, Iron, Manganese",
    "feeding_guide": "Puppies (2–4 months): 200g/day · Adult small breed: 120–180g · Adult medium breed: 180–300g · Adult large breed: 300–500g.",
    "replaces_brand": "Royal Canin Adult Chicken",
    "replaces_reason": "Bravo's chicken meal sourcing is 100% Kenyan — supporting local poultry farmers. Same AAFCO-aligned nutritional profile at 40–50% less cost.",
    "created_at": "2026-06-19T14:30:16.560Z"
  },
  {
    "id": 4,
    "name": "Top Dog Krunshi Economy Dog Food 5kg",
    "brand": "Top Dog",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/h9d/h5e/29090212970526/100547_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Krunshi is Kenya's best-known economy dog food — a generations-old formula that millions of Kenyan dogs have thrived on. Crunchy texture helps with dental health while the balanced nutrition keeps energy levels steady all day.",
    "nutrition_protein": 16,
    "nutrition_fat": 7,
    "nutrition_fibre": 5,
    "nutrition_moisture": 12,
    "key_ingredients": "Maize Germ Meal, Wheat Bran, Soya Bean Meal, Blood Meal, Bone Meal, Sunflower Oil, Salt, Vitamins A, D3, B12",
    "feeding_guide": "Up to 10kg: 100g/day · 10–25kg: 200–300g/day · 25kg+: 350–500g/day. Split into two meals for best digestion.",
    "replaces_brand": "Pedigree Adult Economy",
    "replaces_reason": "Designed for Kenyan feeding patterns — higher fibre helps dogs feel full longer on less food, reducing monthly feed costs by up to 35%.",
    "created_at": "2026-06-19T14:30:16.560Z"
  },
  {
    "id": 5,
    "name": "Top Dog Rice And Chicken Puppy Food 5Kg",
    "brand": "Top Dog",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/hc3/h3b/28761951567902/140331_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Rice and Chicken Puppy Food is specially formulated for the fast-growth phase of Kenyan puppies. The elevated protein and DHA support brain development, while the calcium-phosphorus balance builds strong bones.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Rice, Chicken Meal, Soya Bean Meal, Chicken Fat, Fish Oil (DHA), Calcium Carbonate, Vitamin A, D3, E, C, Folic Acid",
    "feeding_guide": "2–4 months: 150–250g/day · 4–6 months: 250–350g/day · 6–12 months: 300–450g/day. Split into 3 meals for young puppies.",
    "replaces_brand": "Royal Canin Puppy",
    "replaces_reason": "Top Dog Puppy uses rice as the primary carbohydrate — easier on young Kenyan dogs' digestive systems than corn-heavy imports. DHA levels are comparable to premium European brands.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 6,
    "name": "Top Dog Rice And Fish Puppy Food 5Kg",
    "brand": "Top Dog",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/h18/hce/28980711456798/140333_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Rice and Fish offers a novel protein source for dogs with chicken or beef sensitivities — a common issue in equatorial climates. Ocean fish provides natural omega-3 fatty acids that promote a shiny coat and reduce skin inflammation.",
    "nutrition_protein": 22,
    "nutrition_fat": 9.5,
    "nutrition_fibre": 3.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Rice, Fish Meal, Soya Bean Protein, Fish Oil, Sunflower Oil, Kelp, Vitamin C, Zinc, Copper",
    "feeding_guide": "Puppies 2–6 months: 200–300g/day · 6–12 months: 300–400g/day. Transition gradually over 7 days.",
    "replaces_brand": "Hill's Science Diet Puppy",
    "replaces_reason": "Fish-based formula at a fraction of the import price. Kenyan fish meal sourcing from Lake Victoria and Indian Ocean supports local fisheries.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 7,
    "name": "Bravo Beef Flavour Active Dog Food 15Kg",
    "brand": "Bravo",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "Bravo Active Beef 15kg is the working-dog formula — designed for guard dogs, farm dogs, and highly active breeds that burn significant calories daily. The elevated fat content provides sustained energy without the blood sugar spikes of high-carb feeds.",
    "nutrition_protein": 22,
    "nutrition_fat": 13,
    "nutrition_fibre": 3.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Maize, Beef Meal, Animal Fat, Soya Bean Meal, Whey Protein, Vitamin B Complex, Iron, Selenium",
    "feeding_guide": "Active adult dogs: 300–600g/day depending on activity level. Increase by 20% for working/guard dogs in full deployment.",
    "replaces_brand": "Eukanuba Adult Large Breed",
    "replaces_reason": "Specifically calibrated for the tropical-climate energy demands of Kenyan dogs. Higher fat:protein ratio matches the caloric needs of outdoor working dogs.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 8,
    "name": "Bravo Chicken Flavour Adult Dog Food 15Kg",
    "brand": "Bravo",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "Bravo Chicken Adult 15kg — the bulk economy for multi-dog households and breeders. Sigma Foods' trusted Bravo recipe in a large format that significantly reduces per-kilogram cost for breeders, shelters, and large-breed owners.",
    "nutrition_protein": 21,
    "nutrition_fat": 10,
    "nutrition_fibre": 3.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Maize, Chicken Meal, Soya Bean Meal, Chicken Fat, Vitamin & Mineral Premix, Zinc Oxide, Ferrous Sulphate",
    "feeding_guide": "Adult dogs 10–25kg: 200–300g/day · 25kg+: 300–500g/day. Ideal for breeding kennels and multi-dog homes.",
    "replaces_brand": "Pedigree Adult 15kg",
    "replaces_reason": "Bulk format saves up to KES 800 per bag vs equivalent import volumes. Sigma Foods offers consistent batch quality with locally-sourced ingredients.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 9,
    "name": "Purr-fect Chicken & Rice Cat Food 2kg",
    "brand": "Purr-fect",
    "weight_kg": 2,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/pim-content/KEN/media/product/137190/1758891605/137190_main.jpg?im=Resize=(300,300)",
    "description": "Purr-fect Chicken & Rice is Kenya's leading locally-formulated cat food — designed for the dietary needs of East African domestic cats. The taurine-enriched formula supports feline heart health, while the rice base is easier to digest than corn-heavy imports.",
    "nutrition_protein": 32,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Rice, Chicken Meal, Fish Meal, Taurine, Sunflower Oil, Vitamin A, Vitamin E, Taurine, Biotin, Choline Chloride",
    "feeding_guide": "Kittens: 40–60g/day · Adult cats (3–5kg): 50–70g/day · Active/outdoor cats: up to 90g/day.",
    "replaces_brand": "Whiskas Adult Dry",
    "replaces_reason": "Purr-fect has 32% protein vs Whiskas at 26% — higher biological value from chicken meal rather than plant proteins. Taurine is added at therapeutic levels, not minimum compliance.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 10,
    "name": "Top Dog Puppy Rice And Chicken Dog Food 2kg",
    "brand": "Top Dog",
    "weight_kg": 2,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/h18/h87/30107543109662/140330_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Rice and Chicken Puppy 2kg — the starter pack for new puppy owners. Same quality formula as the 5kg bag but in a more manageable size for trial, travel, or small breeds.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Rice, Chicken Meal, Soya Bean Meal, Fish Oil, Calcium Carbonate, Vitamin A, D3, E, Folic Acid",
    "feeding_guide": "2–4 months: 150–250g/day (3 meals) · 4–6 months: 250–350g/day (2 meals).",
    "replaces_brand": "Purina Puppy Chow",
    "replaces_reason": "Made in Kenya, no import delays, consistent freshness. Rice-based formula better suited to equatorial digestive demands than wheat-based imports.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 11,
    "name": "Gilani Gourmet Pet Biltong 250g",
    "brand": "Gilani",
    "weight_kg": 0.25,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/hab/ha3/27645612916766/24246_main.jpg?im=Resize=(300,300)",
    "description": "Gilani Gourmet Pet Biltong is Kenya's most unique pet treat — real air-dried biltong made for dogs. Gilani's draws on generations of East African dried meat heritage to create a treat that's 95% protein, zero additives, and absolutely irresistible to dogs.",
    "nutrition_protein": 68,
    "nutrition_fat": 8,
    "nutrition_fibre": 0,
    "nutrition_moisture": 15,
    "key_ingredients": "100% Beef (air-dried), Natural spices, Salt. No artificial preservatives, colours, or flavours.",
    "feeding_guide": "Use as a reward treat (not a meal replacement). Small dogs: 1–2 strips/day · Large dogs: 3–4 strips/day.",
    "replaces_brand": "Zuke's Mini Naturals / Stella & Chewy's",
    "replaces_reason": "Real biltong is a superior training treat to processed American-style soft chews. 68% protein vs 25–30% in imported treats. Made metres from where the cattle graze.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 12,
    "name": "T.L.C. Dog Rice 5Kg",
    "brand": "T.L.C.",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/hb7/hb3/13964706643998/90776_main.jpg?im=Resize=(300,300)",
    "description": "TLC Dog Rice is a pure, additive-free rice meal specifically formulated as a dietary staple or gastrointestinal support diet for dogs. Vets in Kenya frequently recommend TLC Dog Rice during upset stomach recovery and post-surgery feeding.",
    "nutrition_protein": 8,
    "nutrition_fat": 2,
    "nutrition_fibre": 1.5,
    "nutrition_moisture": 12,
    "key_ingredients": "Rice (100%), Vitamin B1 fortification. No additives, no preservatives, no meat products.",
    "feeding_guide": "GI support: 150–200g cooked rice + boiled chicken per meal · Maintenance blend: 30–40% of total meal alongside complete kibble.",
    "replaces_brand": "Hill's i/d Gastrointestinal",
    "replaces_reason": "Vets recommend plain rice for GI recovery — TLC Dog Rice is pre-portioned and vitamin-fortified. Far more affordable than Hill's prescription diet for recovery feeding.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 13,
    "name": "Scooby Premium Dog Rice 10Kg",
    "brand": "Scooby",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "Scooby Premium Dog Rice is a higher-grade rice formula for dogs with sensitive stomachs or grain-sensitive pets who tolerate rice well. The premium grade means lower starch content and better digestibility versus standard dog rice.",
    "nutrition_protein": 9,
    "nutrition_fat": 2.5,
    "nutrition_fibre": 1.2,
    "nutrition_moisture": 12,
    "key_ingredients": "Premium Long-grain Rice, Vitamin B complex fortification",
    "feeding_guide": "Blend 40–50% with a protein source (boiled chicken/beef) for a balanced homemade diet.",
    "replaces_brand": "Purina Pro Plan Sensitive Stomach",
    "replaces_reason": "Pure rice base is the foundation of any sensitive-stomach diet. Much cheaper than prescription sensitivity formulas for long-term management.",
    "created_at": "2026-06-19T14:30:16.561Z"
  },
  {
    "id": 14,
    "name": "T.L.C. Dog Rice 3Kg",
    "brand": "T.L.C.",
    "weight_kg": 3,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "TLC Dog Rice 3kg — the mid-size pack for households managing a dog on a rice-based therapeutic or blended diet.",
    "nutrition_protein": 8,
    "nutrition_fat": 2,
    "nutrition_fibre": 1.5,
    "nutrition_moisture": 12,
    "key_ingredients": "Rice, Fortified with Vitamin B1, B2, Niacin",
    "feeding_guide": "Blend 50/50 with complete kibble or serve with 100–150g cooked meat per meal.",
    "replaces_brand": "Hill's i/d",
    "replaces_reason": "Cost-effective long-term GI support diet base. TLC's vitamin fortification ensures B-vitamin replenishment during recovery phases.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 15,
    "name": "Scooby Dog Rice 5Kg",
    "brand": "Scooby",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "Scooby Dog Rice 5kg is the economy large-format rice staple for multi-dog households or breeders who blend homemade protein with a clean carbohydrate base.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 2,
    "nutrition_fibre": 1.5,
    "nutrition_moisture": 12,
    "key_ingredients": "White Rice, Vitamin B Complex",
    "feeding_guide": "Mix with 20–30% meat protein for a balanced meal. For large breed adults: 250–350g rice portion per day alongside protein.",
    "replaces_brand": "Generic supermarket rice",
    "replaces_reason": "Purpose-formulated with B vitamins and consistent granule size for easier digestion. No need for extra vitamin supplements.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 16,
    "name": "T.L.C. Dog Rice 10Kg",
    "brand": "T.L.C.",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "TLC Dog Rice 10kg — the breeder bulk pack. If you run a kennel, rescue, or breed working dogs, TLC 10kg is your cost base for a rice-supplemented feeding programme.",
    "nutrition_protein": 8,
    "nutrition_fat": 2,
    "nutrition_fibre": 1.5,
    "nutrition_moisture": 12,
    "key_ingredients": "Rice, Vitamin B1, Vitamin B2, Niacin, Iron Fortification",
    "feeding_guide": "Breeder programme: 200–300g rice per dog per day blended with 150–200g protein source.",
    "replaces_brand": "Hill's Science Plan Adult Large Breed",
    "replaces_reason": "For breeders, cost efficiency matters. A blended diet of TLC rice + quality Kenyan protein can match prescription diet nutrition at 25% of the cost.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 17,
    "name": "T.L.C. Dog Meal 5Kg",
    "brand": "T.L.C.",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": null,
    "description": "TLC Dog Meal is a complete mixed formula — rice base pre-blended with plant protein and essential minerals. A step up from plain rice, TLC Dog Meal is a full dietary meal requiring only the addition of a protein source to become nutritionally complete.",
    "nutrition_protein": 14,
    "nutrition_fat": 4,
    "nutrition_fibre": 3,
    "nutrition_moisture": 12,
    "key_ingredients": "Rice, Soya Bean Meal, Maize, Vitamins A, D3, E, Calcium, Phosphorus, Salt",
    "feeding_guide": "Adult dogs 10–25kg: 250–350g/day + 100g protein. Large dogs 25kg+: 350–500g/day + 150g protein.",
    "replaces_brand": "Purina Dog Chow",
    "replaces_reason": "TLC Dog Meal's rice-forward formula produces firmer stools and better coat condition in Kenyan heat versus corn-based imports.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 18,
    "name": "Purrfect Kitten Chicken & Rice 1kg",
    "brand": "Purrfect",
    "weight_kg": 1,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": null,
    "description": "Purrfect Kitten Chicken & Rice is Kenya's only locally-made kitten food — a life-stage specific formula with elevated DHA for brain development, high protein for rapid muscle growth, and calcium for bone formation.",
    "nutrition_protein": 36,
    "nutrition_fat": 15,
    "nutrition_fibre": 2.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Chicken Meal, Rice, Fish Oil (DHA), Taurine, Calcium Carbonate, Vitamin A, D3, E, B Complex, Folic Acid",
    "feeding_guide": "6 weeks – 3 months: free-feed (60–80g/day) · 3–6 months: 60–80g/day (3 meals) · 6–12 months: 55–70g/day (2 meals).",
    "replaces_brand": "Royal Canin Kitten / Purina Pro Plan Kitten",
    "replaces_reason": "Purrfect Kitten matches the DHA and taurine profiles of Royal Canin Kitten at less than half the price. Made in Kenya so it arrives fresh — no months in a shipping container.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 19,
    "name": "Bark Bite Mini Dog Chews Beef 100g",
    "brand": "Bark Bite",
    "weight_kg": 0.1,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": null,
    "description": "Bark Bite Mini Beef Chews are 100g training treat pouches made in Kenya from real beef. The mini format is ideal for precision positive reinforcement training sessions — small enough to give frequently without overfeeding.",
    "nutrition_protein": 38,
    "nutrition_fat": 10,
    "nutrition_fibre": 2,
    "nutrition_moisture": 20,
    "key_ingredients": "Beef (60%), Wheat Flour, Glycerine, Potato Starch, Natural Beef Flavouring",
    "feeding_guide": "Training treats: 3–5 chews per reward session. Max 20–25 chews per day for small dogs.",
    "replaces_brand": "Zuke's Mini Naturals",
    "replaces_reason": "Bark Bite uses Kenyan beef with no artificial colours or flavour enhancers. Mini format equivalent to Zuke's at 60% of the import price.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 20,
    "name": "Bark Bite Mini Dog Chew Chicken 100g",
    "brand": "Bark Bite",
    "weight_kg": 0.1,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": null,
    "description": "Bark Bite Mini Chicken Chews bring the same great training treat formula with a chicken flavour profile — ideal for rotating treat variety to maintain high value for trained dogs.",
    "nutrition_protein": 36,
    "nutrition_fat": 9.5,
    "nutrition_fibre": 2,
    "nutrition_moisture": 20,
    "key_ingredients": "Chicken (55%), Wheat Flour, Glycerine, Potato Starch, Natural Chicken Flavouring",
    "feeding_guide": "Training treats: 3–5 chews per session. For puppies over 8 weeks: 5–10 chews per day max.",
    "replaces_brand": "Zuke's Mini Naturals Chicken",
    "replaces_reason": "Local Kenyan chicken sourcing means lower food miles and higher freshness. No soy protein isolate filler that many imported treats use.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 21,
    "name": "T.L.C. Dog Chews 250g",
    "brand": "T.L.C.",
    "weight_kg": 0.25,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/hf6/he2/13964618104862/110450_main.jpg?im=Resize=(300,300)",
    "description": "TLC Dog Chews are a longer-format dental chew designed to keep dogs occupied and promote oral hygiene. The texture is calibrated for medium to large dogs — firm enough to require sustained chewing that mechanically removes tartar and plaque.",
    "nutrition_protein": 25,
    "nutrition_fat": 8,
    "nutrition_fibre": 3,
    "nutrition_moisture": 18,
    "key_ingredients": "Beef Skin, Wheat Flour, Maize Starch, Beef Fat, Natural Flavouring, Vitamin E",
    "feeding_guide": "1 chew per day for medium dogs (10–25kg) · 1–2 chews for large dogs (25kg+). Supervise during chewing.",
    "replaces_brand": "Pedigree Dentastix",
    "replaces_reason": "TLC Chews use real beef skin rather than plant-derived cellulose — more natural plaque removal. No artificial colours or sweeteners.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 22,
    "name": "Bravo Active Beef Flavour 2Kg",
    "brand": "Bravo",
    "weight_kg": 2,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/pim-content/KEN/media/product/120353/1758891605/120353_main.jpg?im=Resize=(300,300)",
    "description": "Bravo Active Beef 2kg is Sigma Foods' compact working dog formula — all the caloric density of the 15kg version in a bag that's easy to carry to the farm, training ground, or weekend bush camp.",
    "nutrition_protein": 22,
    "nutrition_fat": 13,
    "nutrition_fibre": 3.5,
    "nutrition_moisture": 10,
    "key_ingredients": "Maize, Beef Meal, Animal Fat, Whey Protein, Vitamin B Complex, Iron, Selenium, Zinc",
    "feeding_guide": "Working dogs: 350–600g/day. Increase 20–25% on heavy activity days. Never restrict water access.",
    "replaces_brand": "Eukanuba Adult Performance",
    "replaces_reason": "Bravo Active's fat content (13%) matches performance feed standards for working dogs. Kenyan-made, so you're not paying import margins for a product designed for Kenyan conditions.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 23,
    "name": "Top Dog Rice 10Kg",
    "brand": "Top Dog",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/h50/h46/14806723624990/35807_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Rice 10kg is the bulk rice product for large kennels and breeding operations. The same vitamin-fortified formula used in the 5kg bags, now in a more economical large format.",
    "nutrition_protein": 8,
    "nutrition_fat": 2,
    "nutrition_fibre": 1.5,
    "nutrition_moisture": 12,
    "key_ingredients": "White Rice, Vitamin B1, B2, Niacin, Iron",
    "feeding_guide": "Blend 40–50% with complete protein source. Breeder programme: 200–300g rice + 150g protein per adult dog per day.",
    "replaces_brand": "Hill's Prescription Diet i/d Large Breed",
    "replaces_reason": "For kennel-scale GI support or carbohydrate supplementation, Top Dog Rice delivers equivalent nutrition at a fraction of prescription diet pricing.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 24,
    "name": "Top Dog Uncooked Dog Rice 5Kg",
    "brand": "Top Dog",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://cdn.mafrservices.com/sys-master-root/he8/h42/14806723723294/35806_main.jpg?im=Resize=(300,300)",
    "description": "Top Dog Uncooked Dog Rice 5kg is raw, unprocessed dog-grade rice for owners who cook their dogs' food fresh. No vitamin fortification — this is pure substrate for home-cooking programmes.",
    "nutrition_protein": 7,
    "nutrition_fat": 1.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 13,
    "key_ingredients": "Unprocessed White Rice",
    "feeding_guide": "Cook 1 cup dry rice per 10kg body weight per day. Always serve at room temperature. Combine with 100–150g cooked protein per meal.",
    "replaces_brand": "Supermarket rice (table-grade)",
    "replaces_reason": "Larger, consistent granule size than table rice — cooks more evenly and produces better texture for dogs. Dog-grade quality control ensures no foreign material contamination.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 25,
    "name": "Robeliz Omena Dog Food 10kg",
    "brand": "Robeliz",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "/images/products/product_27.jpg",
    "description": "High-Protein Nutrition from Local Kenyan Fish. Formulated using omena (silver cyprinid) – a nutrient-dense small fish abundant in Lake Victoria and Kenyan waters. This recipe provides high-quality protein for strong muscles, healthy skin, and a shiny coat. Perfect for multi-dog households and working dogs.",
    "nutrition_protein": 22,
    "nutrition_fat": 10,
    "nutrition_fibre": 4,
    "nutrition_moisture": 10,
    "key_ingredients": "Omena Fish Meal, Rice, Maize Germ, Soya Bean Meal, Sunflower Oil, Calcium Carbonate, Vitamin & Mineral Premix",
    "feeding_guide": "Medium dogs (10–25kg): 200–350g/day · Large dogs (25kg+): 350–500g/day. Split into two meals.",
    "replaces_brand": "Pedigree Adult 10kg",
    "replaces_reason": "Real Kenyan omena fish meal offers a superior, natural omega-3 profile compared to meat-by-product imports, at 20% lower cost.",
    "created_at": "2026-06-19T14:30:16.562Z"
  },
  {
    "id": 26,
    "name": "Omena Perfect Mix Dog Meal 5kg",
    "brand": "Omena Perfect Mix",
    "weight_kg": 5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "/images/products/product_28.png",
    "description": "A classic high-protein supplement and daily feed base. Made with 100% genuine sun-dried omena from Lake Victoria mixed with local grains. High in calcium and natural fats, this mix is highly digestible and builds strong bones and a glowing coat.",
    "nutrition_protein": 20,
    "nutrition_fat": 9,
    "nutrition_fibre": 4.5,
    "nutrition_moisture": 11,
    "key_ingredients": "Omena Fish, Broken Rice, Maize Bran, Bone Meal, Essential Salt, Vitamin Premix",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–300g/day. Mix with warm water or broth if preferred.",
    "replaces_brand": "Pedigree Complete 5kg",
    "replaces_reason": "Pure whole omena fish versus imported rendered meat meal. Sourced locally in East Africa, giving you premium fish protein at a fraction of the cost.",
    "created_at": "2026-06-19T14:30:16.562Z"
  }
];

export const mockStorePrices: StorePrice[] = [
  {
    "id": 1,
    "product_id": 1,
    "store_name": "Pet Food Bag",
    "price": 336,
    "product_url": "https://petfoodbag.co.ke/shop/1",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 2,
    "product_id": 1,
    "store_name": "Carrefour",
    "price": 420,
    "product_url": "https://www.carrefour.ke/mafken/en/animal-supplements/farmers-choice-team-pet-food-2kg/p/40553",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 3,
    "product_id": 2,
    "store_name": "Pet Food Bag",
    "price": 336,
    "product_url": "https://petfoodbag.co.ke/shop/2",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 4,
    "product_id": 2,
    "store_name": "Carrefour",
    "price": 420,
    "product_url": "https://www.carrefour.ke/mafken/en/animal-supplements/farmers-choice-beefo-pet-food-2kg/p/40554",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 5,
    "product_id": 3,
    "store_name": "Pet Food Bag",
    "price": 739,
    "product_url": "https://petfoodbag.co.ke/shop/3",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 6,
    "product_id": 3,
    "store_name": "Carrefour",
    "price": 924,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/bravo-dog-food-adult-chicken-2kg/p/83730",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 7,
    "product_id": 4,
    "store_name": "Pet Food Bag",
    "price": 1008,
    "product_url": "https://petfoodbag.co.ke/shop/4",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 8,
    "product_id": 4,
    "store_name": "Carrefour",
    "price": 1260,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/krunshi-dog-foodi-economy5kg/p/100547",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 9,
    "product_id": 5,
    "store_name": "Pet Food Bag",
    "price": 1348,
    "product_url": "https://petfoodbag.co.ke/shop/5",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 10,
    "product_id": 5,
    "store_name": "Carrefour",
    "price": 1685,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-chicken-fl-5kgs/p/140331",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 11,
    "product_id": 6,
    "store_name": "Pet Food Bag",
    "price": 1348,
    "product_url": "https://petfoodbag.co.ke/shop/6",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 12,
    "product_id": 6,
    "store_name": "Carrefour",
    "price": 1685,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-fish-5kgs/p/140333",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 13,
    "product_id": 9,
    "store_name": "Pet Food Bag",
    "price": 1848,
    "product_url": "https://petfoodbag.co.ke/shop/9",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 14,
    "product_id": 9,
    "store_name": "Carrefour",
    "price": 2310,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-cat-food/purr-fect-chicken-rice-flavour2kg/p/137190",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 15,
    "product_id": 10,
    "store_name": "Pet Food Bag",
    "price": 552,
    "product_url": "https://petfoodbag.co.ke/shop/10",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 16,
    "product_id": 10,
    "store_name": "Carrefour",
    "price": 690,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-puppy-rice-chicken-fl-2kgs/p/140330",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 17,
    "product_id": 11,
    "store_name": "Pet Food Bag",
    "price": 1278,
    "product_url": "https://petfoodbag.co.ke/shop/13",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 18,
    "product_id": 11,
    "store_name": "Carrefour",
    "price": 1597,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/gilani-gourmet-pet-biltong-250g/p/24246",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 19,
    "product_id": 12,
    "store_name": "Pet Food Bag",
    "price": 760,
    "product_url": "https://petfoodbag.co.ke/shop/14",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 20,
    "product_id": 12,
    "store_name": "Carrefour",
    "price": 950,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-rice-5kg/p/90776",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 21,
    "product_id": 14,
    "store_name": "Pet Food Bag",
    "price": 552,
    "product_url": "https://petfoodbag.co.ke/shop/16",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 22,
    "product_id": 14,
    "store_name": "Carrefour",
    "price": 690,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-rice-3kg/p/90775",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 23,
    "product_id": 15,
    "store_name": "Pet Food Bag",
    "price": 840,
    "product_url": "https://petfoodbag.co.ke/shop/17",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 24,
    "product_id": 15,
    "store_name": "Carrefour",
    "price": 1050,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/scooby-dog-rice-5kg/p/23125",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.563Z"
  },
  {
    "id": 25,
    "product_id": 17,
    "store_name": "Pet Food Bag",
    "price": 654,
    "product_url": "https://petfoodbag.co.ke/shop/19",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 26,
    "product_id": 17,
    "store_name": "Carrefour",
    "price": 818,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/t-l-c-dog-meal-5kg/p/109401",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 27,
    "product_id": 18,
    "store_name": "Pet Food Bag",
    "price": 1100,
    "product_url": "https://petfoodbag.co.ke/shop/20",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 28,
    "product_id": 18,
    "store_name": "Carrefour",
    "price": 1375,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-cat-food/purrfect-kitten-chicken-rice-1kg/p/174226",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 29,
    "product_id": 21,
    "store_name": "Pet Food Bag",
    "price": 286,
    "product_url": "https://petfoodbag.co.ke/shop/23",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 30,
    "product_id": 21,
    "store_name": "Carrefour",
    "price": 358,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/tlc-dog-chews250g/p/110450",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 31,
    "product_id": 22,
    "store_name": "Pet Food Bag",
    "price": 757,
    "product_url": "https://petfoodbag.co.ke/shop/24",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 32,
    "product_id": 22,
    "store_name": "Carrefour",
    "price": 946,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/bravo-active-beef-flavour2kg/p/120353",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 33,
    "product_id": 23,
    "store_name": "Pet Food Bag",
    "price": 1780,
    "product_url": "https://petfoodbag.co.ke/shop/25",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 34,
    "product_id": 23,
    "store_name": "Carrefour",
    "price": 2225,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-rice-10kg/p/35807",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 35,
    "product_id": 24,
    "store_name": "Pet Food Bag",
    "price": 896,
    "product_url": "https://petfoodbag.co.ke/shop/26",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 36,
    "product_id": 24,
    "store_name": "Carrefour",
    "price": 1120,
    "product_url": "https://www.carrefour.ke/mafken/en/dry-dog-food/top-dog-rice-5kg/p/35806",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 37,
    "product_id": 25,
    "store_name": "Pet Food Bag",
    "price": 2960,
    "product_url": "https://petfoodbag.co.ke/shop/27",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 38,
    "product_id": 25,
    "store_name": "Jumia",
    "price": 3700,
    "product_url": "https://www.jumia.co.ke/generic-robeliz-omena-dog-food-10kg-327641759.html",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 39,
    "product_id": 26,
    "store_name": "Pet Food Bag",
    "price": 688,
    "product_url": "https://petfoodbag.co.ke/shop/28",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  },
  {
    "id": 40,
    "product_id": 26,
    "store_name": "Naivas",
    "price": 860,
    "product_url": "https://www.naivas.online/omena-perfect-mix-dog-meal-5kg",
    "in_stock": true,
    "last_updated": "2026-06-19T14:30:16.564Z"
  }
];

export const mockCustomers: Customer[] = [];

export const mockOrders: Order[] = [
  {
    id: 1,
    customer_name: "John Doe",
    customer_phone: "254712345678",
    customer_email: "john@example.com",
    delivery_area: "Westlands",
    subtotal_kes: 1478,
    delivery_fee_kes: 200,
    total_kes: 1678,
    payment_method: "mpesa",
    status: "pending",
    notes: "Deliver after 5 PM",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    customer_name: "Jane Smith",
    customer_phone: "254798765432",
    customer_email: null,
    delivery_area: "Kilimani",
    subtotal_kes: 2696,
    delivery_fee_kes: 250,
    total_kes: 2946,
    payment_method: "cod",
    status: "confirmed",
    notes: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const mockOrderItems: OrderItem[] = [
  {
    id: 1,
    order_id: 1,
    product_id: 3,
    product_name: "Bravo Dog Food Adult Chicken 2Kg",
    qty: 2,
    unit_price: 739,
    total_price: 1478
  },
  {
    id: 2,
    order_id: 2,
    product_id: 5,
    product_name: "Top Dog Rice And Chicken Puppy Food 5Kg",
    qty: 2,
    unit_price: 1348,
    total_price: 2696
  }
];

export async function executeMockQuery(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
  const queryText = text.replace(/\s+/g, ' ').trim();

  // 1. Stats query on homepage
  if (queryText.includes("COUNT(*) FROM products") && queryText.includes("MAX(last_updated)")) {
    return {
      rows: [{
        product_count: mockProducts.length,
        last_updated: new Date().toISOString()
      }],
      rowCount: 1
    };
  }

  // 2. Featured products query
  if (queryText.includes("MIN(comp.price) AS competitor_min") && queryText.includes("LIMIT 6")) {
    const featured = mockProducts
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'Pet Food Bag');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'Pet Food Bag').map(sp => sp.price);
        const competitor_min = compPrices.length > 0 ? Math.min(...compPrices) : null;
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight_kg: p.weight_kg,
          animal_type: p.animal_type,
          food_type: p.food_type,
          image_url: p.image_url,
          our_price: bbp ? bbp.price : null,
          competitor_min
        };
      })
      .filter(item => item.our_price !== null && item.competitor_min !== null)
      .sort((a, b) => ((b.competitor_min || 0) - (b.our_price || 0)) - ((a.competitor_min || 0) - (a.our_price || 0)))
      .slice(0, 6);

    return { rows: featured, rowCount: featured.length };
  }

  // 3. Shop products list query
  if (queryText.includes("bbp.price AS our_price") && queryText.includes("LEFT JOIN store_prices comp")) {
    let animalFilter = '';
    let typeFilter = '';
    let searchFilter = '';

    if (params && params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string') {
          if (p.startsWith('%') && p.endsWith('%')) {
            searchFilter = p.slice(1, -1).toLowerCase();
          } else if (['dog', 'cat', 'rabbit', 'bird'].includes(p)) {
            animalFilter = p;
          } else if (['dry', 'wet', 'treat', 'supplement'].includes(p)) {
            typeFilter = p;
          }
        }
      }
    }

    const list = mockProducts
      .filter(p => {
        if (animalFilter && p.animal_type !== animalFilter) return false;
        if (typeFilter && p.food_type !== typeFilter) return false;
        if (searchFilter && !p.name.toLowerCase().includes(searchFilter)) return false;
        return true;
      })
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'Pet Food Bag');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'Pet Food Bag').map(sp => sp.price);
        const competitor_min = compPrices.length > 0 ? Math.min(...compPrices) : null;
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight_kg: p.weight_kg,
          animal_type: p.animal_type,
          food_type: p.food_type,
          image_url: p.image_url,
          our_price: bbp ? bbp.price : null,
          competitor_min
        };
      })
      .filter(item => item.our_price !== null)
      .sort((a, b) => {
        const diffA = (a.competitor_min || 0) - (a.our_price || 0);
        const diffB = (b.competitor_min || 0) - (b.our_price || 0);
        if (diffB !== diffA) return diffB - diffA;
        return a.name.localeCompare(b.name);
      });

    return { rows: list, rowCount: list.length };
  }

  // 4. Product detail query
  if (queryText.includes("json_agg") && queryText.includes("sp.product_id = p.id") && queryText.includes("p.id = $1")) {
    const id = Number(params[0]);
    const p = mockProducts.find(x => x.id === id);
    if (!p) {
      return { rows: [], rowCount: 0 };
    }

    const prices = mockStorePrices
      .filter(sp => sp.product_id === p.id)
      .map(sp => ({
        store: sp.store_name,
        price: sp.price,
        url: sp.product_url,
        in_stock: sp.in_stock,
        last_updated: sp.last_updated
      }))
      .sort((a, b) => {
        if (a.store === 'Pet Food Bag' && b.store !== 'Pet Food Bag') return -1;
        if (a.store !== 'Pet Food Bag' && b.store === 'Pet Food Bag') return 1;
        return a.price - b.price;
      });

    return {
      rows: [{
        ...p,
        prices
      }],
      rowCount: 1
    };
  }

  // 5. Admin Products list
  if (queryText.includes("FROM products p LEFT JOIN store_prices bbp") && queryText.includes("ORDER BY p.name")) {
    const list = mockProducts
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'Pet Food Bag');
        return {
          ...p,
          our_price: bbp ? bbp.price : null
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return { rows: list, rowCount: list.length };
  }

  // 6. Admin prices audit query
  if (queryText.includes("json_object_agg") && queryText.includes("sp.product_id = p.id")) {
    const list = mockProducts
      .map(p => {
        const store_data: Record<string, any> = {};
        mockStorePrices
          .filter(sp => sp.product_id === p.id)
          .forEach(sp => {
            store_data[sp.store_name] = {
              price: sp.price,
              in_stock: sp.in_stock,
              last_updated: sp.last_updated,
              url: sp.product_url
            };
          });
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          animal_type: p.animal_type,
          food_type: p.food_type,
          weight_kg: p.weight_kg,
          store_data
        };
      })
      .sort((a, b) => {
        const typeA = a.animal_type || '';
        const typeB = b.animal_type || '';
        if (typeA !== typeB) return typeA.localeCompare(typeB);
        return a.name.localeCompare(b.name);
      });
    return { rows: list, rowCount: list.length };
  }

  // 7. Admin Dashboard Overview stats
  if (queryText === "SELECT COUNT(*) FROM orders") {
    return { rows: [{ count: mockOrders.length }], rowCount: 1 };
  }
  if (queryText.includes("SUM(total_kes) FROM orders WHERE status != 'cancelled'")) {
    const total = mockOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_kes), 0);
    return { rows: [{ sum: total }], rowCount: 1 };
  }
  if (queryText.includes("COUNT(*) FROM orders WHERE status = 'pending'")) {
    const count = mockOrders.filter(o => o.status === 'pending').length;
    return { rows: [{ count }], rowCount: 1 };
  }
  if (queryText === "SELECT COUNT(*) FROM products") {
    return { rows: [{ count: mockProducts.length }], rowCount: 1 };
  }
  if (queryText.includes("COUNT(DISTINCT p.id) as count") && queryText.includes("comp.price < bbp.price")) {
    const alerts = mockProducts.filter(p => {
      const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'Pet Food Bag');
      const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'Pet Food Bag').map(sp => sp.price);
      return bbp && compPrices.some(price => price < bbp.price);
    }).length;
    return { rows: [{ count: alerts }], rowCount: 1 };
  }
  if (queryText.includes("FROM orders ORDER BY created_at DESC LIMIT 10")) {
    const recent = mockOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    return { rows: recent, rowCount: recent.length };
  }

  // 8. Admin Orders list
  if (queryText.includes("FROM orders o LEFT JOIN order_items oi")) {
    const statusFilter = params[0] || '';
    const filtered = statusFilter
      ? mockOrders.filter(o => o.status === statusFilter)
      : mockOrders;

    const list = filtered
      .map(o => {
        const items = mockOrderItems
          .filter(oi => oi.order_id === o.id)
          .map(oi => ({
            product_name: oi.product_name,
            qty: oi.qty,
            unit_price: oi.unit_price,
            total_price: oi.total_price
          }));
        return {
          ...o,
          items
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { rows: list, rowCount: list.length };
  }

  // 9. INSERT / UPDATE / DELETE operations (Mutations)

  // Insert customer (Upsert)
  if (queryText.includes("INSERT INTO customers")) {
    const phone = params[0];
    const email = params[1];
    const name = params[2];
    let cust = mockCustomers.find(c => c.phone === phone);
    if (cust) {
      if (email !== null) cust.email = email;
      if (name !== null) cust.name = name;
      cust.created_at = new Date().toISOString();
    } else {
      mockCustomers.push({
        id: mockCustomers.length + 1,
        phone,
        email,
        name,
        created_at: new Date().toISOString()
      });
    }
    return { rows: [], rowCount: 1 };
  }

  // Insert order
  if (queryText.includes("INSERT INTO orders") && queryText.includes("RETURNING id")) {
    const newId = mockOrders.length > 0 ? Math.max(...mockOrders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      id: newId,
      customer_name: params[0],
      customer_phone: params[1],
      customer_email: params[2],
      delivery_area: params[3],
      subtotal_kes: Number(params[4]),
      delivery_fee_kes: Number(params[5]),
      total_kes: Number(params[6]),
      payment_method: params[7],
      notes: params[8],
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // Insert order item
  if (queryText.includes("INSERT INTO order_items")) {
    const newId = mockOrderItems.length > 0 ? Math.max(...mockOrderItems.map(oi => oi.id)) + 1 : 1;
    mockOrderItems.push({
      id: newId,
      order_id: params[0],
      product_id: params[1],
      product_name: params[2],
      qty: params[3],
      unit_price: params[4],
      total_price: params[5]
    });
    return { rows: [], rowCount: 1 };
  }

  // Update order status
  if (queryText.includes("UPDATE orders SET status = $1 WHERE id = $2")) {
    const status = params[0];
    const id = Number(params[1]);
    const order = mockOrders.find(o => o.id === id);
    if (order) {
      order.status = status;
    }
    return { rows: [], rowCount: 1 };
  }

  // Insert product
  if (queryText.includes("INSERT INTO products") && queryText.includes("RETURNING id")) {
    const newId = mockProducts.length > 0 ? Math.max(...mockProducts.map(p => p.id)) + 1 : 1;
    mockProducts.push({
      id: newId,
      name: params[0],
      brand: params[1],
      weight_kg: params[2],
      animal_type: params[3],
      food_type: params[4],
      image_url: params[5],
      description: params[6],
      key_ingredients: params[7],
      feeding_guide: params[8],
      replaces_brand: params[9],
      replaces_reason: params[10],
      nutrition_protein: params[11],
      nutrition_fat: params[12],
      nutrition_fibre: params[13],
      nutrition_moisture: params[14],
      created_at: new Date().toISOString()
    });
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // Insert store_prices
  if (queryText.includes("INSERT INTO store_prices")) {
    const newId = mockStorePrices.length > 0 ? Math.max(...mockStorePrices.map(sp => sp.id)) + 1 : 1;
    mockStorePrices.push({
      id: newId,
      product_id: params[0],
      store_name: params[1],
      price: params[2],
      product_url: params[3] || null,
      in_stock: true,
      last_updated: new Date().toISOString()
    });
    return { rows: [], rowCount: 1 };
  }

  // Update store_prices price
  if (queryText.includes("UPDATE store_prices SET price = $1") && queryText.includes("store_name = 'Pet Food Bag'")) {
    const price = params[0];
    const pid = Number(params[1]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'Pet Food Bag');
    if (sp) {
      sp.price = price;
      sp.last_updated = new Date().toISOString();
    }
    return { rows: [], rowCount: 1 };
  }

  // Check store_prices
  if (queryText.includes("SELECT id FROM store_prices WHERE product_id = $1 AND store_name = 'Pet Food Bag'")) {
    const pid = Number(params[0]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'Pet Food Bag');
    return { rows: sp ? [{ id: sp.id }] : [], rowCount: sp ? 1 : 0 };
  }

  // Update product
  if (queryText.includes("UPDATE products SET name = $1")) {
    const pid = Number(params[15]);
    const p = mockProducts.find(x => x.id === pid);
    if (p) {
      p.name = params[0];
      p.brand = params[1];
      p.weight_kg = params[2];
      p.animal_type = params[3];
      p.food_type = params[4];
      p.image_url = params[5];
      p.description = params[6];
      p.key_ingredients = params[7];
      p.feeding_guide = params[8];
      p.replaces_brand = params[9];
      p.replaces_reason = params[10];
      p.nutrition_protein = params[11];
      p.nutrition_fat = params[12];
      p.nutrition_fibre = params[13];
      p.nutrition_moisture = params[14];
    }
    return { rows: [], rowCount: 1 };
  }

  // Delete product
  if (queryText.includes("DELETE FROM products WHERE id = $1")) {
    const pid = Number(params[0]);
    const idx = mockProducts.findIndex(x => x.id === pid);
    if (idx !== -1) {
      mockProducts.splice(idx, 1);
    }
    // Clean up prices
    for (let i = mockStorePrices.length - 1; i >= 0; i--) {
      if (mockStorePrices[i].product_id === pid) {
        mockStorePrices.splice(i, 1);
      }
    }
    return { rows: [], rowCount: 1 };
  }

  // 10. Fallback for unhandled/general queries (just print warning and return empty)
  console.warn("⚠️ Unhandled mock query:", text, "with params:", params);
  return { rows: [], rowCount: 0 };
}
