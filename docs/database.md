# Database Schema Reference

This document maps out the database tables, relations, fields, and indexing strategies utilized in the PetStore Kenya application.

## Entity-Relationship Schema

```mermaid
erDiagram
    products {
        serial id PK
        text name
        text brand
        numeric weight_kg
        text animal_type
        text food_type
        text image_url
        text description
        text key_ingredients
        text feeding_guide
        text replaces_brand
        text replaces_reason
        numeric nutrition_protein
        numeric nutrition_fat
        numeric nutrition_fibre
        numeric nutrition_moisture
        timestamptz created_at
    }

    store_prices {
        serial id PK
        integer product_id FK
        text store_name
        numeric price
        text product_url
        boolean in_stock
        timestamptz last_updated
    }

    customers {
        serial id PK
        text phone UK
        text email UK
        text name
        timestamptz created_at
    }

    orders {
        serial id PK
        text customer_name
        text customer_phone FK
        text customer_email
        text delivery_area
        numeric subtotal_kes
        numeric delivery_fee_kes
        numeric total_kes
        text payment_method
        text status
        text notes
        timestamptz created_at
    }

    order_items {
        serial id PK
        integer order_id FK
        integer product_id FK
        text product_name
        integer qty
        numeric unit_price
        numeric total_price
    }

    products ||--o{ store_prices : "has competitor benchmarks"
    orders ||--|{ order_items : "contains"
    products ||--o{ order_items : "referenced in"
```

---

## Tables & Details

### 1. `products`
The core catalog table. Contains metadata for each item.
- `id` (SERIAL PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `brand` (TEXT)
- `weight_kg` (NUMERIC(8,2))
- `animal_type` (TEXT) - e.g., 'dog', 'cat'
- `food_type` (TEXT) - e.g., 'dry', 'wet', 'treat'
- `replaces_brand`/`replaces_reason` (TEXT) - Used for comparison logic against imported brands on the storefront.
- `nutrition_protein`/`nutrition_fat`/`nutrition_fibre`/`nutrition_moisture` (NUMERIC(5,1)) - Used to display nutrient sheets.

### 2. `store_prices`
Tracks pricing benchmarks for PetStore Kenya and competitors (Carrefour, Naivas, Jumia).
- `id` (SERIAL PRIMARY KEY)
- `product_id` (INTEGER, REFERENCES `products(id)` ON DELETE CASCADE)
- `store_name` (TEXT, NOT NULL) - e.g. 'PetStore Kenya', 'Carrefour'
- `price` (NUMERIC(10,2))
- `product_url` (TEXT) - Deep link to competitor listing
- `in_stock` (BOOLEAN)

### 3. `customers`
Registry of distinct customers.
- `id` (SERIAL PRIMARY KEY)
- `phone` (TEXT, UNIQUE) - Core lookup identifier
- `email` (TEXT, UNIQUE)
- `name` (TEXT)

### 4. `orders`
Header records for checkouts.
- `id` (SERIAL PRIMARY KEY)
- `customer_name` (TEXT)
- `customer_phone` (TEXT, NOT NULL)
- `customer_email` (TEXT)
- `delivery_area` (TEXT)
- `total_kes` (NUMERIC(10,2))
- `status` (TEXT, DEFAULT 'pending') - 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'.

### 5. `order_items`
Details of items checked out in each order.
- `id` (SERIAL PRIMARY KEY)
- `order_id` (INTEGER, REFERENCES `orders(id)` ON DELETE CASCADE)
- `product_id` (INTEGER, REFERENCES `products(id)` ON DELETE SET NULL)
- `qty` (INTEGER)
- `unit_price` (NUMERIC(10,2))
- `total_price` (NUMERIC(10,2))

---

## Indexing Strategy
To optimize analytical dashboard performance and prevent lookup lag, we define:
- `idx_store_prices_product`: Index on `store_prices(product_id)` to speed up product-level price list lookups.
- `idx_store_prices_store`: Index on `store_prices(store_name)` to accelerate competitor specific filtering.
- `idx_orders_status`: Index on `orders(status)` to speed up status-specific admin filter loads.
- `idx_orders_phone`: Index on `orders(customer_phone)` to fetch customer purchase histories quickly.
