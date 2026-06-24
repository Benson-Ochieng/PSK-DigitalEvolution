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
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        categories          JSONB
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
      -- Removed mock seeds to enforce database-only WooCommerce sync / clean seeding
      SELECT 1;
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
