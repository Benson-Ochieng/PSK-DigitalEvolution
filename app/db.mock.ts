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
    "name": "Reflex Plus Premium Adult Dog Food - Medium/Large Breed Senior Lamb &amp; Rice 15kg",
    "brand": "Reflex",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2020/10/Reflex-Plus-Medium-Large-Breed-Senior-Dog-Food-Lamb-And-Rice-15kg-min.png",
    "description": "Reflex Plus Senior Dog Food Lamb and Rice is a complete and balanced formulated super premium dry dog food with lamb and rice for medium-large breeds older than 7 years of age.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Dried animal protein, Cereals (rice, corn), Chicken fat, Dried sugar beet, Corn gluten, Wheat bran, Liver flavor, Vitamins and minerals, Whey powder, Salt, Flaxseed, Brewer&#8217;s yeast, MOS (Mannan Oligosaccharide ), Yucca schidigera , Preservat...",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.869Z"
  },
  {
    "id": 2,
    "name": "Veggie Dog Original Adult 10kg",
    "brand": "Josera",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/10/JVDOA.jpg",
    "description": "Gluten-free complete food with red lentils for sensitive adult dogs",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Hill's Science Plan",
    "replaces_reason": "Matches the premium nutritional profile of Hill's Science Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.871Z"
  },
  {
    "id": 3,
    "name": "Bonnie Adult Dog Food - Beef 15kg",
    "brand": "Bonnie",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2017/07/Bonnie-Adult-Dog-Beef-min.png",
    "description": "Bonnie Beef Adult Dog food, full-balanced, beef protein-containing all-natural dog food carefully formulated by a dog nutritionist to meet the nutritional requirements of all adult breeds. Beef meal has been used as animal protein source. The balance of omega 3 &amp; 6 is prov...",
    "nutrition_protein": 18,
    "nutrition_fat": 7,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed Animal Protein, Wheat, Corn, Animal Fat, Wheat Middlings, Corn Gluten, Dried Sugar Beet, Liver Aroma, Salt, Flaxseed, Dried Brewer&#8217;s Yeast",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Pedigree",
    "replaces_reason": "Matches the premium nutritional profile of Pedigree with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.871Z"
  },
  {
    "id": 4,
    "name": "Rogz Dog Utility Stop Pull Harness Medium - Blue",
    "brand": "Rogz",
    "weight_kg": null,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/01/SPSJ11-B_Stop-Pull-Harness.jpg",
    "description": "Rogz Dog Utility Stop Pull Harness Medium - Blue",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.873Z"
  },
  {
    "id": 5,
    "name": "Rogz Dog Utility Control Collar Web XX-Large - Blue",
    "brand": "Rogz",
    "weight_kg": null,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/01/HCW19-B_Control-Collar-Web.jpg",
    "description": "Rogz Utility control collar Web - XX-Large Blue",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.873Z"
  },
  {
    "id": 6,
    "name": "PetD Deworm 6 Tablets Dog and Cat",
    "brand": "PetD",
    "weight_kg": null,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2022/01/petd-dewomers-.png",
    "description": "Pet D worm tablets dewormer for dogs and cats is highly effective in the removal of roundworms and hookworms.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "; mebendazole, piperazine citrate, and praziquantel to effectively eliminate and control:\n\nRoundworms\nHookworms\nTapeworms\n\nThis triple-action formula works quickly to clear existing worms and help restore your pet’s health",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 7,
    "name": "SHORT EXPIRY - CLEARANCE: Bonnie Adult Dog Food - Lamb and Rice 15kg",
    "brand": "Bonnie",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2018/02/Bonnie-Adult-Dog-Lamb-Rice-1080x1080-c.png",
    "description": "Give your dog the goodness of nature with Bonnie Lamb &amp; Rice Adult Dog Food. This tasty, balanced recipe blends tender lamb with rice to provide essential nutrients that keep your dog active, healthy, and happy perfect for adult dogs of every size and breed.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "?Lamb Proteins (dehydrated), Animal proteins (dehydrated), Wheat, Corn, Animal Fat, Corn Gluten, Rice, Dried Beet Pulp, Liver Flavour, Salt, Flaxseed, Dried Brewer?s Yeast, Yucca Schidigera, Mannan-Oligosaccharides, Beta Glucan",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Pedigree",
    "replaces_reason": "Matches the premium nutritional profile of Pedigree with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 8,
    "name": "DEFECT/DAMAGED PACKAGE CLEARANCE: Reflex Premium Adult Dog Food Salmon &amp; Rice 15kg",
    "brand": "Reflex",
    "weight_kg": 15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2017/11/RADFSR.jpg",
    "description": "Crafted for active and sensitive breeds, Reflex Salmon &amp; Rice Adult Dog Food delivers balanced nutrition rich in omega fatty acids to promote joint health, vitality, and overall wellbeing.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed Animal Protein, Wheat, Corn, Animal Fat, Fish Meal, Corn Gluten, Fish Fat, Rice, Dried Sugar Beet, Fish Aroma, Salt, Flaxseed, Dried Brewer&#8217;s Yeast",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 9,
    "name": "DEFECT/DAMAGED - CLEARANCE: Spectrum Lowgain Salmon &amp; Anchovy For Medium And Large Breed Adult Dogs 12kg",
    "brand": "Spectrum",
    "weight_kg": 12,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/01/SLGLBSA12.png",
    "description": "SPECTRUM LOW GRAIN Salmon, Anchovy and Blueberry Medium/Large is a Complete and balanced food for Medium and Large Breed Adult Dogs",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Dehydrated animal protein (salmon and anchovy protein min",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin Size Health",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 10,
    "name": "Reflex Care Dog Shampoo Colour Enhancing - 300ml",
    "brand": "Reflex",
    "weight_kg": 0.3,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/01/Reflex-care-dog-shampoo-colou-enhancing-shampoo.png",
    "description": "Professional colour-enhancing dog shampoo that naturally intensifies white, black, brown, and red coats. Gentle, pH-balanced &amp; ideal for sensitive skin.",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "that work in harmony with the natural pigments of the fur, it revitalizes white, black, bro",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 11,
    "name": "Bonnie Adult Cat Food - Chicken 0.5kg",
    "brand": "Bonnie",
    "weight_kg": 0.5,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2019/09/Bonnie-Adult-Cat-Chicken-500g-min.png",
    "description": "Full-balanced, chicken protein-containing cat food carefully formulated by a cat nutritionists to meet the nutritional requirements of all adult breeds.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed Animal Protein (Chicken), Wheat, Corn, Animal Fat, Wheat Middlings, Corn Gluten, Dried Sugar Beet, Chicken Liver Aroma, Salt, Flaxseed, Dried Brewers Yeast, Taurine",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Whiskas",
    "replaces_reason": "Matches the premium nutritional profile of Whiskas with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 12,
    "name": "Rogz Cat Fishcake Bowl 200ml - Anchovy Black Paw Print",
    "brand": "Rogz",
    "weight_kg": 0.2,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/01/CBOWL31-A-Anchovy-Black-Paw-1.jpg",
    "description": "The Rogz Fishcake Bowl in Anchovy Black Paw Print blends sleek design with whisker-conscious ergonomics – perfect for cats with sensitive snouts and owners who value both function and form.Capacity: 200mlMaterial: Premium Melamine",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.874Z"
  },
  {
    "id": 13,
    "name": "Royal Canin Kitten 2kg",
    "brand": "Royal Canin",
    "weight_kg": 2,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2021/12/Royal-Canin-Kitten-food-01.jpg",
    "description": "Balanced and complete feed. For kittens up to 12 months old.",
    "nutrition_protein": 34,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Dehydrated poultry protein, animal fats, maize flour, rice, vegetable protein isolate*, hydrolysed animal proteins, yeasts and parts thereof, fish oil, beet pulp, vegetable fibres, soya oil, minerals, fructo-oligo-saccharides (0,35%), hydrolysed y...",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 14,
    "name": "Spectrum Lowgain Cat Food Sterilised Salmon &amp; Anchovy Formula 12kg",
    "brand": "Spectrum",
    "weight_kg": 12,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2023/11/spectrum-salmon-anchovy-cat-12kg.png",
    "description": "Spectrum low grain cat food Salmon, Anchovy &amp; cranberries is formulated to meet all the nutritional requirements of your neutered adult cat.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein (min",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin Size Health",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 15,
    "name": "Spectrum Gusto Soup For Cat With Tuna And Pumpkin 50g",
    "brand": "Spectrum",
    "weight_kg": 0.05,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/06/SPECTRUM-GUSTO-SOUP-FOR-CAT-WITH-TUNA-AND-PUMPKIN-50GR-1.png",
    "description": "Treat your feline friend to a delightful snack experience with SPECTRUM GUSTO Soup for Cats! Appropriate for any Cat/Kitten as a healthy treat but not a substitute for a complete balanced food. Make sufficient drinking water available.",
    "nutrition_protein": 9,
    "nutrition_fat": 0.2,
    "nutrition_fibre": 0.1,
    "nutrition_moisture": 90,
    "key_ingredients": "Made with real tuna, rich in essential proteins and omega fatty acids, ensuring your cat gets the nutrition they need",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin Size Health",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin Size Health with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 16,
    "name": "Proline Adult Cat Food - Chicken 1.2kg",
    "brand": "Proline",
    "weight_kg": 1.2,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2023/04/Untitled-design-89.png",
    "description": "Fully balanced all natural cat food with chicken protein. Carefully formulated by cat nutritionists to meet the nutritional requirements of all adult cats.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 17,
    "name": "Cs Cat Carrier Shoulder Travel Backpack Bag Red",
    "brand": "CS",
    "weight_kg": null,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/01/CAT-ACRRIER-SHOULDER-TRAVEL-BACKPACK-RED.png",
    "description": "Make every outing an adventure with the Cat Carrier Shoulder Travel Backpack. Lightweight, portable, and designed for comfort, it allows your cat to experience the world safely by your side. Its spacious interior, ventilation holes, and secure closures create a perfect balance...",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 18,
    "name": "Lara Junior Cat Food 350g",
    "brand": "Lara",
    "weight_kg": 0.35,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/07/Untitled-design-58.png",
    "description": "With Lara Junior’s crispy chunks, your naughty kitten will visibly enjoy the delicious flavor of chicken.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "\">\nIngredients\n0",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 19,
    "name": "Truly Mini Hearts Chicken &amp; Fish For Cat 50g",
    "brand": "Truly",
    "weight_kg": 0.05,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/04/Truly-Mini-Hearts-chicken-Fish-50g.png",
    "description": "Treat your cat to Truly Mini Hearts Chicken Treats and give them a snack that not only tastes great but also supports their health. Your furry friend will thank you with purrs and cuddles!",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 20,
    "name": "Pack Of 12 - Wanpy Cat Meat Broth - Tuna &amp; Salmon 50g",
    "brand": "Wanpy",
    "weight_kg": 0.05,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/03/WANPY-CAT-MEAT-BROTH-TUNA-SALMON-50GR-1.png",
    "description": "Wanpy Cat Meat Broth Tuna &amp; Salmon 50g is a grain-free hydrating cat food made with real fish. Rich in Omega-3 and taurine, perfect as a topper or tasty snack for cats. &nbsp;",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "and enriched with taurine, salmon oil, and Vitamin E, Wanpy Meat Broth helps support healthy skin, a shiny coat, and optimal heart and eye health",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 21,
    "name": "Reflex Plus Adult Dog Food Canned - Lamb Chunks in Gravy 400g",
    "brand": "Reflex",
    "weight_kg": 0.4,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2020/04/Reflex-Plus-Lamb-chunks-in-jelly.png",
    "description": "Reflex Plus Lamb Adult Dog Canned Food, its nutritional value and digestibility are high thanks to its high-quality animal protein and vitamin diversity. Its functional ingredients support many systems, while its high-water content contributes to daily water intake and support...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "support many systems, while its high-water content contributes to daily water intake and support",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 22,
    "name": "Reflex Plus Dog Alutray Mini Small Breed Beef InGravy 85g",
    "brand": "Reflex",
    "weight_kg": 0.085,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/11/REFLEX-PLUS-DOG-ALUTRAY-MINI-SMALL-BREED-BEEF-IN-GRAVY-85GR.png",
    "description": "Alu-tray is a nutritious wet food with high-quality animal protein and a variety of vitamins. It offers multisystemic benefits due to its functional components. With its high water content, it supports the body's daily water intake and contributes to kidney health. Additionall...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Meat and animal derivatives (4% Beef), Minerals, Derivatives of vegetable origin",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 23,
    "name": "JosiDog Game In Sauce Dog Wet Food 415g",
    "brand": "Josera",
    "weight_kg": 0.415,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/04/JOSIDOG-Game-in-Sauce-Dog-Wet-food-415g.png",
    "description": "JosiDog Game in Sauce, providing breed-appropriate daily nutrition of your adult four-legged friend is child’s play. The fine pieces in sauce with game only contain healthy ingredients, with no added fuss such as artificial additives. What’s more, it also contains vitamins to ...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": ", with no added fuss such as artificial additives",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Hill's Science Plan",
    "replaces_reason": "Matches the premium nutritional profile of Hill's Science Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 24,
    "name": "Ultimates Dog Can Chicken Mince &amp; Tuna 400g",
    "brand": "Ultimates",
    "weight_kg": 0.4,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/06/ULTIMATES-DOG-CAN-CHICKEN-MINCE-TUNA-400G.png",
    "description": "Ultimates Indulge with Chicken Mince &amp; Tuna contains natural meat, grain-free and made with healthy fish oils. Indulge the one you love with the Ultimate dog cuisine.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Meats (including chicken and/or beef and/or fish), Thickeners, Vitamins and Minerals, Colour, Gelling Agent",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.875Z"
  },
  {
    "id": 25,
    "name": "Pack Of 24  - Reflex Plus Canned Dog Food Salmon In Gravy 400g",
    "brand": "Reflex",
    "weight_kg": 0.4,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/11/REFLEX-PLUS-CANNED-DOG-FOOD-SALMON-IN-GRAVY-400GR.png",
    "description": "Reflex Plus Canned Dog Food Salmon in Gravy, Its nutritional value and digestibility are high thanks to its high-quality animal protein and vitamin diversity. Its functional ingredients support many systems, while its high-water content contributes to daily water intake and su...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "support many systems, while its high-water content contributes to daily water intake and su",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 26,
    "name": "Wanpy Dog Food Chicken &amp; Vegetables 375g",
    "brand": "Wanpy",
    "weight_kg": 0.375,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/01/Wanpy-chicken-veg-375-gr-.png",
    "description": "WANPY Chicken &amp; Vegetables Canned Dog Food 375g: Premium wet food with lean chicken, fiber-rich veggies, vitamins A, C, E for all breeds. Boosts digestion, immunity, and muscle health. No artificial additives complete balanced meal! &nbsp;",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Main Protein: High-quality lean chicken for essential amino acids and energy",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 27,
    "name": "King Canned Dog Food - Lamb Chunks in Gravy 400g",
    "brand": "King",
    "weight_kg": 0.4,
    "animal_type": "dog",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/11/KING-2.png",
    "description": "King Canned Dog Food Lamb Chunks in Gravy 400g is a complementary meal for adult dogs, made with real lamb (4%), cereals, and essential minerals. The savory meaty chunks in gravy provide a protein-rich, moisture-packed formula that supports hydration, healthy muscles, and over...",
    "nutrition_protein": 7,
    "nutrition_fat": 5,
    "nutrition_fibre": 0.5,
    "nutrition_moisture": 83,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 28,
    "name": "Bonnie Canned Cat Food - Chicken in Gravy 400g",
    "brand": "Bonnie",
    "weight_kg": 0.4,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2018/02/Bonnie-Adult-Cat-Canned-Chicken-Chunks-in-Gravy-1080x1080-c.png",
    "description": "Nutritious wet food made with tender chicken pieces in sauce. Enriched with essential vitamins, minerals, and taurine to support strong muscles, healthy digestion, and hydration for adult cats.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Meat and Animal Derivatives (4% Chicken), Grains, Minerals, Plant By-products, Sugar",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Whiskas",
    "replaces_reason": "Matches the premium nutritional profile of Whiskas with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 29,
    "name": "MigliorGatto Adult Cat Food Pouches Salmon &amp; Tuna 24x100g",
    "brand": "Miglior",
    "weight_kg": 0.1,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2022/05/MCW016.jpg",
    "description": "Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 77,
    "key_ingredients": "Meat and animal derivatives 30%, fish and fish derivatives (salmon 5%), cereals, minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 30,
    "name": "Miglior Canned Cat Food - Veal &amp; Carrots, Pate 400g",
    "brand": "Miglior",
    "weight_kg": 0.4,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2023/01/MIGLIOR-GATTO-CON-VITELLO-E-CAROTE-IN-PATE-400G.jpg",
    "description": "This formula guarantees key nutrients like Omega-3, vitamins, calcium, and phosphorus supporting strong bones and teeth, healthy skin and a glossy coat. A high-quality meal your cat will love, every day.",
    "nutrition_protein": 10,
    "nutrition_fat": 6,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 77,
    "key_ingredients": "– No artificial colors, flavors, or fillers\nTender, Meaty Texture – Chicken chunks in gravy cats crave\nSupports Immune Health – With added antioxidants and essential nutrients\nSkin &amp; Coat Support – Omega-3 and vitamins for a glossy coat\nComple...",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 31,
    "name": "Pack Of 24 - Miglior Cat Unico Mousse Pouch - Veal 85g",
    "brand": "Miglior",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/09/MCW2021-UNICO-POUCH-TURKEY.png",
    "description": "Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.",
    "nutrition_protein": 10.5,
    "nutrition_fat": 4,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Veal 50% (lungs, livers), minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 32,
    "name": "Felix Cat Pouch 85g Chicken",
    "brand": "Felix",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/08/Untitled-design-2.png",
    "description": "Satisfy your cat’s appetite with FELIX Chicken Cat Pouch 85g, featuring soft, meaty chicken pieces immersed in savory jelly. Formulated as a complete meal, it contains the perfect balance of nutrients, vitamins, minerals, and Omega-6 to maintain your cat’s overall health and v...",
    "nutrition_protein": 11.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 82,
    "key_ingredients": "Chicken and animal derivatives, vegetable protein extracts, minerals, various sugars",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 33,
    "name": "Whiskas Adult Cat Pouches Poultry/Feasts M/Pak 12x85g",
    "brand": "Whiskas",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/11/WHISKAS-ACAT-POUCHES-PFEASTS-MPAK-12X85G.png",
    "description": "Give your adult cat the delicious taste they crave and the balanced nutrition they deserve with WHISKAS 1+ Poultry Feasts in Gravy. Expertly crafted with 100% high-quality, sustainably sourced ingredients, this complete wet cat food provides everything your feline needs to sta...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": ", this complete wet cat food provides everything your feline needs to sta",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 34,
    "name": "Rogz Dog Yumz-Treat Toy Bone 11.5cm - Blue Medium (YU03-B)",
    "brand": "Rogz",
    "weight_kg": null,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2022/01/YU01-B-Yumz-Small-Blue.jpg",
    "description": "Rogz Dog Yumz-Treat Toy bone - Blue Medium",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 35,
    "name": "Simba Cat Canned Cat Food Mousse – Salmon &amp; Shrimps 85g",
    "brand": "Simba",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/06/Simba-Cat-Canned-Cat-Food-Mousse-–-Salmon-Shrimps-85g-1.png",
    "description": "Give your cat a delicious gourmet meal with Simba Cat Mousse Salmon &amp; Shrimps. Made in Italy with quality salmon and shrimps, this complete wet cat food provides high-quality protein, essential vitamins, minerals, and taurine to support your cat's overall health and wellbe...",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Size: 85g\n&nbsp;\n\t\t\t\r\n\t\t\t\t\t\r\n\t\t\t\t\r\n\tAdditional information\r\n\r\n\r\n\t\t\t\r\n\t\t\tWeight\r\n\t\t\t0",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 36,
    "name": "Bravecto Chewable Tablet for Dogs - 4.5 to 10kg, 1 Treatment",
    "brand": "Bravecto",
    "weight_kg": 10,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2020/06/Bravecto-Dog-4.5-10kg-Chewable-Tablet-250mg-min.png",
    "description": "Bravecto ® (Fluralaner) 1 dose chew (4.5-10kg dog), 12-week Flea &amp; tick protection for dogs - kill adult fleas, prevent fleas, manage &amp; control ticks.",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 37,
    "name": "Pack Of 10 - Reflex Happy Hour Dog Treat Healthy Bones Lamb Egg &amp; Cranberry 60g",
    "brand": "Reflex",
    "weight_kg": 0.06,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/01/Happy-Hour-Healthy-Bones-Dog-treats.png",
    "description": "Happy hour dog treats Health Bones Lamb, Egg &amp; Cranberry - Perfect for rewarding good behavior or just showing your pet some extra love, Reflex Happy Hours Dog Treats are free from artificial preservatives and fillers. Plus, they’re great for maintaining healthy teeth and ...",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": ", these treats are rich in essential vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.876Z"
  },
  {
    "id": 38,
    "name": "Wanpy Cat Pouch - Chicken &amp; Shrimp 85g",
    "brand": "Wanpy",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/01/CHICKEN-SHRIMP.png",
    "description": "WANPY Cat Pouch Chicken &amp; Shrimp 85g is a complete, preservative-free wet cat food made with real chicken and shrimp, suitable for kittens and adult cats. &nbsp;",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Chicken\nShrimp\nWater\nNatural thickener\nTaurine\nAdded vitamins and minerals\n\nNo added preservatives, artificial colors, or flavors",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 39,
    "name": "Reflex Dog Snackies Treats Smoked Beef Training Bites 170g",
    "brand": "Reflex",
    "weight_kg": 0.17,
    "animal_type": "dog",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/01/reflex-dog-snackies-treats-smoked-beef-1.png",
    "description": "High-protein beef dog treats made with 92% real meat. Grain-free, 100% natural, and perfect for healthy training rewards and everyday snacking.",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": ", they contain no artificial colors, flavors, or preservatives—just clean, honest nutrition you can trust",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 40,
    "name": "Reflex Happy Hour Cat Treat Calmness Lamb &amp; Cranberry Calming Support 60g",
    "brand": "Reflex",
    "weight_kg": 0.06,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/07/REFLEX-HAPPY-HOUR-CAT-TREAT-CALMNESS-LAMB-CRANBERRY-CLAMING-SUPPORT-60GR-1.png",
    "description": "Happy hour cat treats calmness lamb &amp; cranberry calming support- Perfect for rewarding good behavior or just showing your pet some extra love, Reflex Happy Hours Cat Treats are free from artificial preservatives and fillers. Plus, they’re great for maintaining healthy teet...",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": ", these treats are rich in essential vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 41,
    "name": "Pack Of 10 - Reflex Cat Pocket Treat Sensitive 60g",
    "brand": "Reflex",
    "weight_kg": 0.06,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/11/REFLEX-CAT-POCKET-TREAT-SENSITIVE-60GR.png",
    "description": "Reflex Cat Pocket Treats – Delicious, Healthy Snacks for Your Feline Friend Treat your cat to the irresistible taste of Reflex Cat Pocket Treats, a tasty and nutritious reward for your furry companion. Made with high-quality ingredients and crafted for cats of all ages, these ...",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "and crafted for cats of all ages, these",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Purina Pro Plan",
    "replaces_reason": "Matches the premium nutritional profile of Purina Pro Plan with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 42,
    "name": "Churu Cat Treats Chicken Recipe 4 Tubes",
    "brand": "Churu",
    "weight_kg": null,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/01/CHURU-CHICKEN-RECIPE-4CT.png",
    "description": "Churu Cat Lickable Treats Chicken Variety creamy, grain-free puree made with real chicken. Boosts hydration, packed with protein and Vitamin E. Perfect as a snack, topper, or interactive treat for cats.",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Interactive Feeding: Lick straight from the tube, lap from a bowl, or mix into kibble or wet food\nSupports Hydration: 91% moisture helps keep cats hydrated and supports urinary health\nNutritious Boost: Vitamin E supports immunity, and added Taurin...",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 43,
    "name": "Inaba Foods Cat Treat Grilled Chicken Fillet Extra Tender In Crab Flavored Broth",
    "brand": "Churu",
    "weight_kg": null,
    "animal_type": "cat",
    "food_type": "treat",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2026/02/Grilled-Cat-Chicken-Fillet-Extra-Tender-In-Crab-Flavored-Broth-1.png",
    "description": "Premium Inaba grilled chicken fillet in crab flavored broth for cats. Grain-free, moisture-rich treat with Vitamin E for immunity and hydration support.",
    "nutrition_protein": 28,
    "nutrition_fat": 8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 10,
    "key_ingredients": "Chicken, Natural Crab Flavored Broth, Tapioca, Collagen, Guar Gum, Vitamin E Supplement, Green Tea Extract",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 44,
    "name": "Grounded Surface Cleaner- Everyday 500ml",
    "brand": "Grounded",
    "weight_kg": 0.5,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2020/11/GROUNDED-SPRAY-DEEP.jpg",
    "description": "Everyday surface spray. Deodorizes &amp; degreases. Powered by citrus concentrate, this everyday cleanser is great for kitchens and bathrooms. It contains limonene, a chemical from citrus peels that’s a powerful degreaser/solvent.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Saponified Coconut, Canola, Sunflower Oils; Citric Acid, Sodium Bicarbonate, Lemongrass, Eucalyptus &amp; Tea Tree Essential Oils\n\n\nProudly MADE IN KENYA by Grounded\n\t\t\t\r\n\t\t\t\t\t\r\n\t\t\t\t\r\n\tAdditional information\r\n\r\n\r\n\t\t\t\r\n\t\t\tWeight\r\n\t\t\t0",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 45,
    "name": "Gift Voucher 1,000",
    "brand": "Generic",
    "weight_kg": null,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/02/Gift-voucher-1k.jpeg",
    "description": "Looking for the perfect present for the pet lover in your life or a pet that is not yours? Delight them with a Petstore Kenya Gift Voucher!",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 46,
    "name": "Miglior Cat Food Pouch Salmon &amp; Tuna 100g",
    "brand": "Miglior",
    "weight_kg": 0.1,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2022/05/MCW016.jpg",
    "description": "Formula designed to guarantee the key nutrients required for the well-being of your cat, including vitamins, Omega 3, calcium and phosphorous to support strong bones and teeth, healthy skin and glossy coat, and toned musculature.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.8,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 77,
    "key_ingredients": "Meat and animal derivatives 30%, fish and fish derivatives (salmon 5%), cereals, minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 47,
    "name": "Grounded Body Bar Calming Lavender Coconut Avocado 150g",
    "brand": "Grounded",
    "weight_kg": 0.15,
    "animal_type": "dog",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2024/07/Body-Bar-Calming-2-LAVENDER-e1722431414891.jpg",
    "description": "Enriched with calming and nourishing goodness. This luxurious bar gently cleanses and hydrates your skin, leaving it feeling soft, supple, and irresistibly touchable. Leaves your skin and hair feeling deeply nourished and moisturized.",
    "nutrition_protein": 24,
    "nutrition_fat": 12,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "safe for humans and the environment",
    "feeding_guide": "Small dogs (5–10kg): 100–180g/day · Medium dogs (10–25kg): 180–320g/day · Large dogs (25kg+): 320–500g/day. Split into 2 daily meals.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 48,
    "name": "Snappy Tom Beef And Veg 85g",
    "brand": "Generic",
    "weight_kg": 0.085,
    "animal_type": "cat",
    "food_type": "wet",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/06/SNAPPY-TOM-BEEF-AND-VEG.png",
    "description": "Made with GRASS-FED beef and vegetables and the combination helps to improve your cat’s appetite. The high-protein fish will keep her in ideal body condition and stay healthy.",
    "nutrition_protein": 8.5,
    "nutrition_fat": 4.5,
    "nutrition_fibre": 0.8,
    "nutrition_moisture": 80,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  },
  {
    "id": 49,
    "name": "Ferplast Comb GO 5864",
    "brand": "Ferplast",
    "weight_kg": null,
    "animal_type": "cat",
    "food_type": "dry",
    "image_url": "https://petstore.co.ke/wp-content/uploads/2025/08/Screenshot-2025-08-11-094336.png",
    "description": "The Ferplast GRO 5864 is a high-quality grooming comb designed for medium and long-haired dogs and cats. Featuring a sturdy plastic handle and rounded teeth, it detangles fur efficiently while being gentle on your pet’s skin.",
    "nutrition_protein": 32,
    "nutrition_fat": 14,
    "nutrition_fibre": 3,
    "nutrition_moisture": 10,
    "key_ingredients": "Processed animal protein, wheat, corn, wheat bran, animal fat, fish oil, vitamins and minerals",
    "feeding_guide": "Kittens/Adults up to 3kg: 30–50g/day · 3–5kg: 50–75g/day · 5kg+: 75–100g/day. Always provide clean drinking water.",
    "replaces_brand": "Royal Canin",
    "replaces_reason": "Matches the premium nutritional profile of Royal Canin with high digestibility and sun-dried local recipe quality, delivering a 40% cost reduction.",
    "created_at": "2026-06-22T07:52:40.877Z"
  }
];

export const mockStorePrices: StorePrice[] = [
  {
    "id": 1,
    "product_id": 1,
    "store_name": "PetStore Kenya",
    "price": 11500,
    "product_url": "https://petstore.co.ke/product/reflex-plus-premium-adult-dog-food-medium-large-breed-senior-lamb-rice-15kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 2,
    "product_id": 1,
    "store_name": "Carrefour",
    "price": 13800,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-plus-premium-adult-dog-food-medium-large-breed-senior-lamb-rice-15kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 3,
    "product_id": 2,
    "store_name": "PetStore Kenya",
    "price": 15900,
    "product_url": "https://petstore.co.ke/product/veggie-dog-original-adult-10kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 4,
    "product_id": 2,
    "store_name": "Carrefour",
    "price": 19080,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=veggie-dog-original-adult-10kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 5,
    "product_id": 3,
    "store_name": "PetStore Kenya",
    "price": 6570,
    "product_url": "https://petstore.co.ke/product/bonnie-adult-dog-food-beef-15kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 6,
    "product_id": 3,
    "store_name": "Carrefour",
    "price": 7884,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=bonnie-adult-dog-food-beef-15kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 7,
    "product_id": 4,
    "store_name": "PetStore Kenya",
    "price": 3240,
    "product_url": "https://petstore.co.ke/product/rogz-dog-utility-stop-pull-harness-medium-blue/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 8,
    "product_id": 4,
    "store_name": "Carrefour",
    "price": 3888,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=rogz-dog-utility-stop-pull-harness-medium-blue",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 9,
    "product_id": 5,
    "store_name": "PetStore Kenya",
    "price": 2080,
    "product_url": "https://petstore.co.ke/product/rogz-dog-utility-control-collar-web-xx-large-blue/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 10,
    "product_id": 5,
    "store_name": "Carrefour",
    "price": 2496,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=rogz-dog-utility-control-collar-web-xx-large-blue",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 11,
    "product_id": 6,
    "store_name": "PetStore Kenya",
    "price": 500,
    "product_url": "https://petstore.co.ke/product/petd-deworm-tablets-dog-and-cat/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 12,
    "product_id": 6,
    "store_name": "Carrefour",
    "price": 600,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=petd-deworm-tablets-dog-and-cat",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 13,
    "product_id": 7,
    "store_name": "PetStore Kenya",
    "price": 4599,
    "product_url": "https://petstore.co.ke/product/short-expiry-clearance-bonnie-adult-dog-food-lamb-and-rice-15kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 14,
    "product_id": 7,
    "store_name": "Carrefour",
    "price": 5519,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=short-expiry-clearance-bonnie-adult-dog-food-lamb-and-rice-15kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 15,
    "product_id": 8,
    "store_name": "PetStore Kenya",
    "price": 7703,
    "product_url": "https://petstore.co.ke/product/reflex-premium-adult-dog-food-salmon-rice-15kg-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 16,
    "product_id": 8,
    "store_name": "Carrefour",
    "price": 9244,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-premium-adult-dog-food-salmon-rice-15kg-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 17,
    "product_id": 9,
    "store_name": "PetStore Kenya",
    "price": 11165,
    "product_url": "https://petstore.co.ke/product/defect-damaged-package-clearance-spectrum-low-grain-salmon-anchovy-for-medium-and-large-breed-adult-dogs-12kg-copy/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 18,
    "product_id": 9,
    "store_name": "Carrefour",
    "price": 13398,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=defect-damaged-package-clearance-spectrum-low-grain-salmon-anchovy-for-medium-and-large-breed-adult-dogs-12kg-copy",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 19,
    "product_id": 10,
    "store_name": "PetStore Kenya",
    "price": 1508,
    "product_url": "https://petstore.co.ke/product/reflex-care-colour-enhancing-dog-shampoo/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 20,
    "product_id": 10,
    "store_name": "Carrefour",
    "price": 1810,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-care-colour-enhancing-dog-shampoo",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 21,
    "product_id": 11,
    "store_name": "PetStore Kenya",
    "price": 690,
    "product_url": "https://petstore.co.ke/product/bonnie-adult-cat-food-chicken/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 22,
    "product_id": 11,
    "store_name": "Carrefour",
    "price": 828,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=bonnie-adult-cat-food-chicken",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 23,
    "product_id": 12,
    "store_name": "PetStore Kenya",
    "price": 1850,
    "product_url": "https://petstore.co.ke/product/rogz-cat-fishcake-bowl-200ml-anchovy-black-paw-print/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 24,
    "product_id": 12,
    "store_name": "Carrefour",
    "price": 2220,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=rogz-cat-fishcake-bowl-200ml-anchovy-black-paw-print",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 25,
    "product_id": 13,
    "store_name": "PetStore Kenya",
    "price": 6000,
    "product_url": "https://petstore.co.ke/product/royal-canin-kitten-2kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 26,
    "product_id": 13,
    "store_name": "Carrefour",
    "price": 7200,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=royal-canin-kitten-2kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 27,
    "product_id": 14,
    "store_name": "PetStore Kenya",
    "price": 15200,
    "product_url": "https://petstore.co.ke/product/spectrum-low-grain-cat-food-sterlised-salmon-anchovy-12kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 28,
    "product_id": 14,
    "store_name": "Carrefour",
    "price": 18240,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=spectrum-low-grain-cat-food-sterlised-salmon-anchovy-12kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 29,
    "product_id": 15,
    "store_name": "PetStore Kenya",
    "price": 176,
    "product_url": "https://petstore.co.ke/product/spectrum-gusto-soup-for-cat-with-tuna-and-pumpkin-50gr-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 30,
    "product_id": 15,
    "store_name": "Carrefour",
    "price": 211,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=spectrum-gusto-soup-for-cat-with-tuna-and-pumpkin-50gr-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 31,
    "product_id": 16,
    "store_name": "PetStore Kenya",
    "price": 1765,
    "product_url": "https://petstore.co.ke/product/proline-adult-cat-food-chicken-1-2kg-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 32,
    "product_id": 16,
    "store_name": "Carrefour",
    "price": 2118,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=proline-adult-cat-food-chicken-1-2kg-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 33,
    "product_id": 17,
    "store_name": "PetStore Kenya",
    "price": 3500,
    "product_url": "https://petstore.co.ke/product/cs-cat-carrier-shoulder-travel-backpack-bag-red/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 34,
    "product_id": 17,
    "store_name": "Carrefour",
    "price": 4200,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=cs-cat-carrier-shoulder-travel-backpack-bag-red",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 35,
    "product_id": 18,
    "store_name": "PetStore Kenya",
    "price": 495,
    "product_url": "https://petstore.co.ke/product/lara-junior-cat-food-350g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 36,
    "product_id": 18,
    "store_name": "Carrefour",
    "price": 594,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=lara-junior-cat-food-350g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.879Z"
  },
  {
    "id": 37,
    "product_id": 19,
    "store_name": "PetStore Kenya",
    "price": 260,
    "product_url": "https://petstore.co.ke/product/truly-mini-hearts-chicken-fish-for-cat-50g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 38,
    "product_id": 19,
    "store_name": "Carrefour",
    "price": 312,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=truly-mini-hearts-chicken-fish-for-cat-50g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 39,
    "product_id": 20,
    "store_name": "PetStore Kenya",
    "price": 1557,
    "product_url": "https://petstore.co.ke/product/pack-of-12-pay-for-10-get-2-free-wanpy-cat-meat-broth-tuna-salmon-50gr/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 40,
    "product_id": 20,
    "store_name": "Carrefour",
    "price": 1868,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=pack-of-12-pay-for-10-get-2-free-wanpy-cat-meat-broth-tuna-salmon-50gr",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 41,
    "product_id": 21,
    "store_name": "PetStore Kenya",
    "price": 244,
    "product_url": "https://petstore.co.ke/product/reflex-plus-adult-dog-food-canned-lamb-chunks-in-gravy-0-4kg/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 42,
    "product_id": 21,
    "store_name": "Carrefour",
    "price": 293,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-plus-adult-dog-food-canned-lamb-chunks-in-gravy-0-4kg",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 43,
    "product_id": 22,
    "store_name": "PetStore Kenya",
    "price": 187,
    "product_url": "https://petstore.co.ke/product/reflex-plus-dog-alutray-mini-small-breed-beef-in-gravy-85gr-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 44,
    "product_id": 22,
    "store_name": "Carrefour",
    "price": 224,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-plus-dog-alutray-mini-small-breed-beef-in-gravy-85gr-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 45,
    "product_id": 23,
    "store_name": "PetStore Kenya",
    "price": 306,
    "product_url": "https://petstore.co.ke/product/josidog-game-in-sauce-dog-wet-food-415kg-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 46,
    "product_id": 23,
    "store_name": "Carrefour",
    "price": 367,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=josidog-game-in-sauce-dog-wet-food-415kg-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 47,
    "product_id": 24,
    "store_name": "PetStore Kenya",
    "price": 284,
    "product_url": "https://petstore.co.ke/product/ultimates-dog-can-chicken-mince-tuna-400g-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 48,
    "product_id": 24,
    "store_name": "Carrefour",
    "price": 341,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=ultimates-dog-can-chicken-mince-tuna-400g-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 49,
    "product_id": 25,
    "store_name": "PetStore Kenya",
    "price": 6588,
    "product_url": "https://petstore.co.ke/product/pack-of-24-reflex-plus-canned-dog-food-salmon-in-gravy-400gr/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 50,
    "product_id": 25,
    "store_name": "Carrefour",
    "price": 7906,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=pack-of-24-reflex-plus-canned-dog-food-salmon-in-gravy-400gr",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 51,
    "product_id": 26,
    "store_name": "PetStore Kenya",
    "price": 200,
    "product_url": "https://petstore.co.ke/product/wanpy-chicken-vegetables-canned-dog-food-375g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 52,
    "product_id": 26,
    "store_name": "Carrefour",
    "price": 240,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=wanpy-chicken-vegetables-canned-dog-food-375g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 53,
    "product_id": 27,
    "store_name": "PetStore Kenya",
    "price": 201,
    "product_url": "https://petstore.co.ke/product/king-canned-dog-food-lamb-chunks-in-gravy-400gr/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 54,
    "product_id": 27,
    "store_name": "Carrefour",
    "price": 241,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=king-canned-dog-food-lamb-chunks-in-gravy-400gr",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 55,
    "product_id": 28,
    "store_name": "PetStore Kenya",
    "price": 231,
    "product_url": "https://petstore.co.ke/product/bonnie-canned-cat-food-chicken-in-gravy-400gr/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 56,
    "product_id": 28,
    "store_name": "Carrefour",
    "price": 277,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=bonnie-canned-cat-food-chicken-in-gravy-400gr",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 57,
    "product_id": 29,
    "store_name": "PetStore Kenya",
    "price": 3823,
    "product_url": "https://petstore.co.ke/product/migliorgatto-adult-cat-food-pouch-strips-salmon-and-tuna-100gr-pack-of-24/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 58,
    "product_id": 29,
    "store_name": "Carrefour",
    "price": 4588,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=migliorgatto-adult-cat-food-pouch-strips-salmon-and-tuna-100gr-pack-of-24",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 59,
    "product_id": 30,
    "store_name": "PetStore Kenya",
    "price": 224,
    "product_url": "https://petstore.co.ke/product/miglior-cat-can-chunks-veal-carrots-in-pate-400gr-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 60,
    "product_id": 30,
    "store_name": "Carrefour",
    "price": 269,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=miglior-cat-can-chunks-veal-carrots-in-pate-400gr-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 61,
    "product_id": 31,
    "store_name": "PetStore Kenya",
    "price": 3815,
    "product_url": "https://petstore.co.ke/product/miglior-cat-unico-pouch-veal-85gr-pack-of-24/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 62,
    "product_id": 31,
    "store_name": "Carrefour",
    "price": 4578,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=miglior-cat-unico-pouch-veal-85gr-pack-of-24",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 63,
    "product_id": 32,
    "store_name": "PetStore Kenya",
    "price": 194,
    "product_url": "https://petstore.co.ke/product/felix-cat-pouch-85g-chicken/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 64,
    "product_id": 32,
    "store_name": "Carrefour",
    "price": 233,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=felix-cat-pouch-85g-chicken",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 65,
    "product_id": 33,
    "store_name": "PetStore Kenya",
    "price": 2620,
    "product_url": "https://petstore.co.ke/product/whiskas-adult-cat-pouches-fish-m-pak-12x85g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 66,
    "product_id": 33,
    "store_name": "Carrefour",
    "price": 3144,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=whiskas-adult-cat-pouches-fish-m-pak-12x85g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 67,
    "product_id": 34,
    "store_name": "PetStore Kenya",
    "price": 1400,
    "product_url": "https://petstore.co.ke/product/rogz-dog-yumz-treat-toy-bone-11-5cm-blue-medium/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 68,
    "product_id": 34,
    "store_name": "Carrefour",
    "price": 1680,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=rogz-dog-yumz-treat-toy-bone-11-5cm-blue-medium",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 69,
    "product_id": 35,
    "store_name": "PetStore Kenya",
    "price": 179,
    "product_url": "https://petstore.co.ke/product/simba-cat-canned-cat-food-mousse-salmon-shrimps-85g-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 70,
    "product_id": 35,
    "store_name": "Carrefour",
    "price": 215,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=simba-cat-canned-cat-food-mousse-salmon-shrimps-85g-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 71,
    "product_id": 36,
    "store_name": "PetStore Kenya",
    "price": 3850,
    "product_url": "https://petstore.co.ke/product/bravecto-chewable-tablet-for-dogs-4-5kg-10kg-flea-tick-treatment/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 72,
    "product_id": 36,
    "store_name": "Carrefour",
    "price": 4620,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=bravecto-chewable-tablet-for-dogs-4-5kg-10kg-flea-tick-treatment",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 73,
    "product_id": 37,
    "store_name": "PetStore Kenya",
    "price": 1755,
    "product_url": "https://petstore.co.ke/product/reflex-happy-hour-dog-treat-healthy-bones-lamb-egg-cranberry-60gr-pack-of-12/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 74,
    "product_id": 37,
    "store_name": "Carrefour",
    "price": 2106,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-happy-hour-dog-treat-healthy-bones-lamb-egg-cranberry-60gr-pack-of-12",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 75,
    "product_id": 38,
    "store_name": "PetStore Kenya",
    "price": 144,
    "product_url": "https://petstore.co.ke/product/wanpy-cat-pouch-chicken-shrimp-85g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 76,
    "product_id": 38,
    "store_name": "Carrefour",
    "price": 173,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=wanpy-cat-pouch-chicken-shrimp-85g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 77,
    "product_id": 39,
    "store_name": "PetStore Kenya",
    "price": 1150,
    "product_url": "https://petstore.co.ke/product/premium-beef-dog-treats-grain-free-natural/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 78,
    "product_id": 39,
    "store_name": "Carrefour",
    "price": 1380,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=premium-beef-dog-treats-grain-free-natural",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 79,
    "product_id": 40,
    "store_name": "PetStore Kenya",
    "price": 195,
    "product_url": "https://petstore.co.ke/product/reflex-happy-hour-cat-treat-calmness-lamb-cranberry-claming-support-60gr-2/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 80,
    "product_id": 40,
    "store_name": "Carrefour",
    "price": 234,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-happy-hour-cat-treat-calmness-lamb-cranberry-claming-support-60gr-2",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 81,
    "product_id": 41,
    "store_name": "PetStore Kenya",
    "price": 3150,
    "product_url": "https://petstore.co.ke/product/reflex-cat-pocket-treat-sensitive-60gr-pack-of-10/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 82,
    "product_id": 41,
    "store_name": "Carrefour",
    "price": 3780,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=reflex-cat-pocket-treat-sensitive-60gr-pack-of-10",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 83,
    "product_id": 42,
    "store_name": "PetStore Kenya",
    "price": 350,
    "product_url": "https://petstore.co.ke/product/churu-cat-lickable-treats-chicken-recipe/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 84,
    "product_id": 42,
    "store_name": "Carrefour",
    "price": 420,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=churu-cat-lickable-treats-chicken-recipe",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 85,
    "product_id": 43,
    "store_name": "PetStore Kenya",
    "price": 350,
    "product_url": "https://petstore.co.ke/product/inaba-grilled-chicken-crab-broth-cat-treat/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 86,
    "product_id": 43,
    "store_name": "Carrefour",
    "price": 420,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=inaba-grilled-chicken-crab-broth-cat-treat",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 87,
    "product_id": 44,
    "store_name": "PetStore Kenya",
    "price": 575,
    "product_url": "https://petstore.co.ke/product/grounded-all-natural-non-toxic-cleaner-500ml/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 88,
    "product_id": 44,
    "store_name": "Carrefour",
    "price": 690,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=grounded-all-natural-non-toxic-cleaner-500ml",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 89,
    "product_id": 45,
    "store_name": "PetStore Kenya",
    "price": 1000,
    "product_url": "https://petstore.co.ke/product/gift-voucher-1000/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 90,
    "product_id": 45,
    "store_name": "Carrefour",
    "price": 1200,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=gift-voucher-1000",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 91,
    "product_id": 46,
    "store_name": "PetStore Kenya",
    "price": 177,
    "product_url": "https://petstore.co.ke/product/migliorgatto-pouch-strips-salmon-and-tuna-100gr/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 92,
    "product_id": 46,
    "store_name": "Carrefour",
    "price": 212,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=migliorgatto-pouch-strips-salmon-and-tuna-100gr",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 93,
    "product_id": 47,
    "store_name": "PetStore Kenya",
    "price": 420,
    "product_url": "https://petstore.co.ke/product/grounded-body-bar-calming-lavender-coconut-avocado-150g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 94,
    "product_id": 47,
    "store_name": "Carrefour",
    "price": 504,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=grounded-body-bar-calming-lavender-coconut-avocado-150g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 95,
    "product_id": 48,
    "store_name": "PetStore Kenya",
    "price": 169,
    "product_url": "https://petstore.co.ke/product/snappy-tom-beef-and-veg-85g/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 96,
    "product_id": 48,
    "store_name": "Carrefour",
    "price": 203,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=snappy-tom-beef-and-veg-85g",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 97,
    "product_id": 49,
    "store_name": "PetStore Kenya",
    "price": 2485,
    "product_url": "https://petstore.co.ke/product/ferplast-comb-gro-5864/",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  },
  {
    "id": 98,
    "product_id": 49,
    "store_name": "Carrefour",
    "price": 2982,
    "product_url": "https://www.carrefour.ke/mafken/en/search?q=ferplast-comb-gro-5864",
    "in_stock": true,
    "last_updated": "2026-06-22T07:52:40.880Z"
  }
];

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string;
  published_at: string;
  created_at: string;
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'The Essential Dog Care Guide',
    slug: 'essential-dog-care-guide',
    content: 'Whether you\'re a first time dog parent or looking to brush up on the basics, this easy and practical guide has everything you need to give your pup the best start. Inside, you\'ll find essential supplies, a safety checklist, nutrition and feeding tips, foods to avoid, grooming, and training pointers.',
    excerpt: 'Whether you\'re a first time dog parent or looking to brush up on the basics, this easy and practical guide has everything you need to give your pup the best start.',
    image_url: '/images/puppy-150x150.webp',
    published_at: '2022-12-01T00:00:00Z',
    created_at: '2022-12-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'The Essential Cat Care Guide',
    slug: 'essential-cat-care-guide',
    content: 'Whether you\'re a new cat parent or looking to refresh your knowledge, this quick and practical guide has everything you need to give your feline the best start. Inside, you\'ll find essential supplies, a safety checklist, nutrition and feeding tips, foods to avoid, litter training, and enrichment ideas.',
    excerpt: 'Whether you\'re a new cat parent or looking to refresh your knowledge, this quick and practical guide has everything you need to give your feline the best start.',
    image_url: '/images/kitten-150x150.webp',
    published_at: '2022-11-30T00:00:00Z',
    created_at: '2022-11-30T00:00:00Z'
  },
  {
    id: 3,
    title: 'Mixed Feeding for Dogs & Cats: How to Combine Wet and Dry Food the Right Way',
    slug: 'mixed-feeding-dogs-cats',
    content: 'If you\'ve ever stood in the pet food aisle or browsed through website products, you\'ve probably asked yourself: \'Should I feed my pet dry food, wet food, or both?\' But what if you don\'t have to choose? What if you could give your pet the best of both worlds? Mixed feeding, which combines wet and dry food, offers excellent hydration and chewing benefits.',
    excerpt: 'If you\'ve ever stood in the pet food aisle or browsed through website products, you\'ve probably asked yourself: \'Should I feed my pet dry food, wet food, or both?\'',
    image_url: '/images/dog-150x150.webp',
    published_at: '2022-11-29T00:00:00Z',
    created_at: '2022-11-29T00:00:00Z'
  },
  {
    id: 4,
    title: 'Wet vs. Dry Pet Food: Which is the Best Food for Your Dog & Cat?',
    slug: 'wet-vs-dry-pet-food',
    content: 'As a loving pet parent, you want nothing but the best for your furry family member. Their health and happiness often begin right in their food bowl because the food they eat provides all the essential building blocks, energy, and nutrients that they need to thrive. Just like humans, a balanced diet is key to a long, happy life.',
    excerpt: 'As a loving pet parent, you want nothing but the best for your furry family member. Their health and happiness often begin right in their food bowl.',
    image_url: '/images/cat-150x150.webp',
    published_at: '2022-11-29T00:00:00Z',
    created_at: '2022-11-29T00:00:00Z'
  },
  {
    id: 5,
    title: 'Puppy Guide',
    slug: 'puppy-guide',
    content: 'PSK - New Puppy Quick Start Guide Here\'s a guide to help you through the initial stages with your puppy! This would be an amazing journey. A checklist will help you out in taking care of your little bundle of furry joy. We offer some considerations you should have in mind. It covers everything from toys to vaccinations.',
    excerpt: 'PSK - New Puppy Quick Start Guide Here\'s a guide to help you through the initial stages with your puppy! This would be an amazing journey.',
    image_url: '/images/puppy-150x150.webp',
    published_at: '2022-11-28T00:00:00Z',
    created_at: '2022-11-28T00:00:00Z'
  },
  {
    id: 6,
    title: 'Kitten Guide',
    slug: 'kitten-guide',
    content: 'PSK - New Kitten Quick Start Guide Here\'s a guide to help you through the initial stages with your kitten - being a first time parent can be scary, but this guide will walk you through some of the considerations you should have when starting the journey. It covers setting up their environment, diets, litter choice, and play.',
    excerpt: 'PSK - New Kitten Quick Start Guide Here\'s a guide to help you through the initial stages with your kitten - being a first time parent can be scary.',
    image_url: '/images/kitten-150x150.webp',
    published_at: '2022-11-28T00:00:00Z',
    created_at: '2022-11-28T00:00:00Z'
  },
  {
    id: 7,
    title: 'How to Evaluate Which Food is Best for Your Dog: A Comprehensive Guide',
    slug: 'how-to-evaluate-dog-food',
    content: 'When it comes to feeding your dog, you want to make sure you are giving them the best possible food for their individual needs. But, with all the different options, how can you know which one is right for your pup? This comprehensive guide will go over everything you need to look for, from ingredient lists to calorie density.',
    excerpt: 'When it comes to feeding your dog, you want to make sure you are giving them the best possible food for their individual needs.',
    image_url: '/images/dog-150x150.webp',
    published_at: '2022-11-28T00:00:00Z',
    created_at: '2022-11-28T00:00:00Z'
  },
  {
    id: 8,
    title: '\"Keep Their Food Fresh\": Easy Tips on Storing Dog and Cat Food',
    slug: 'keep-food-fresh-storing-tips',
    content: 'Have you ever had your furry friend experience an unexplained bout of loose stool or vomiting? If you have, you may want to check your pet food storage methods. Poor pet food storage can be the cause of these issues, as bacteria or spoilage can occur if hygiene isn\'t observed in keeping the kibbles dry and cool.',
    excerpt: 'Have you ever had your furry friend experience an unexplained bout of loose stool or vomiting? If you have, you may want to check your storage methods.',
    image_url: '/images/cat-150x150.webp',
    published_at: '2022-11-22T00:00:00Z',
    created_at: '2022-11-22T00:00:00Z'
  },
  {
    id: 9,
    title: 'Why is my Cat not eating? Hunger Strike or Anorexia in cats',
    slug: 'why-cat-not-eating-hunger-strike',
    content: 'Did you know that cats also suffer from anorexia? Yes, our feline friends are known to be fussy eaters but, unfortunately, that\'s not always the case. If your cat used to love their food but is now on a food strike or anorexia, it could be a sign that something is wrong. We explore medical, environmental, and behavioral reasons.',
    excerpt: 'Did you know that cats also suffer from anorexia? Yes, our feline friends are known to be fussy eaters but, unfortunately, that\'s not always the case.',
    image_url: '/images/kitten-150x150.webp',
    published_at: '2022-11-15T00:00:00Z',
    created_at: '2022-11-15T00:00:00Z'
  },
  {
    id: 10,
    title: 'Do You Know Why Your Cat Sleeps So Much? 4 Reasons Your Cat May Be Sleeping All Day',
    slug: 'why-cat-sleeps-so-much',
    content: 'Did you know that cats can sleep an average of 15 hours daily? Some stretch that up to 20 hours, especially for older cats and kittens. We watch many cute and funny videos on our phones of how much cats love sleeping all day, every day, literally anywhere and everywhere. Behind this habit are evolutionary sleep patterns.',
    excerpt: 'Did you know that cats can sleep an average of 15 hours daily? Some stretch that up to 20 hours, especially for older cats and kittens.',
    image_url: '/images/cat-150x150.webp',
    published_at: '2022-11-06T00:00:00Z',
    created_at: '2022-11-06T00:00:00Z'
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

  // Blog posts queries
  if (queryText.includes("FROM blog_posts") && queryText.includes("ORDER BY published_at DESC")) {
    const list = [...mockBlogPosts].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return { rows: list, rowCount: list.length };
  }

  if (queryText.includes("INSERT INTO blog_posts") && queryText.includes("RETURNING id")) {
    const newId = mockBlogPosts.length > 0 ? Math.max(...mockBlogPosts.map(p => p.id)) + 1 : 1;
    mockBlogPosts.push({
      id: newId,
      title: params[0],
      slug: params[1],
      content: params[2],
      excerpt: params[3],
      image_url: params[4],
      published_at: params[5] || new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  if (queryText.includes("UPDATE blog_posts SET title = $1")) {
    const title = params[0];
    const slug = params[1];
    const content = params[2];
    const excerpt = params[3];
    const image_url = params[4];
    const published_at = params[5];
    const id = Number(params[6]);
    const bp = mockBlogPosts.find(x => x.id === id);
    if (bp) {
      bp.title = title;
      bp.slug = slug;
      bp.content = content;
      bp.excerpt = excerpt;
      bp.image_url = image_url;
      if (published_at) bp.published_at = published_at;
    }
    return { rows: [], rowCount: 1 };
  }

  if (queryText.includes("DELETE FROM blog_posts WHERE id = $1")) {
    const id = Number(params[0]);
    const idx = mockBlogPosts.findIndex(x => x.id === id);
    if (idx !== -1) {
      mockBlogPosts.splice(idx, 1);
    }
    return { rows: [], rowCount: 1 };
  }

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
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
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
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
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
        if (a.store === 'PetStore Kenya' && b.store !== 'PetStore Kenya') return -1;
        if (a.store !== 'PetStore Kenya' && b.store === 'PetStore Kenya') return 1;
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
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
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
      const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
      const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
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
  if (queryText.includes("UPDATE store_prices SET price = $1") && queryText.includes("store_name = 'PetStore Kenya'")) {
    const price = params[0];
    const pid = Number(params[1]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'PetStore Kenya');
    if (sp) {
      sp.price = price;
      sp.last_updated = new Date().toISOString();
    }
    return { rows: [], rowCount: 1 };
  }

  // Check store_prices
  if (queryText.includes("SELECT id FROM store_prices WHERE product_id = $1 AND store_name = 'PetStore Kenya'")) {
    const pid = Number(params[0]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'PetStore Kenya');
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
