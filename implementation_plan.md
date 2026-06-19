# Pet Food Bag — Implementation Plan

> **Updated:** 2026-05-24  
> **Status:** 🚀 In Progress — React Router v7 scaffold complete

---

## What We're Building

**Pet Food Bag** is a **direct-to-consumer pet food retail brand** run by Loki (distributor). We sell the same top pet food brands cheaper and faster than Carrefour, Naivas, and Quickmart — using Loki's existing Nairobi logistics infrastructure.

This is **not** a price aggregator. It is a **retail storefront**.

```
Customer journey:
  Browse products → See our price + "You save KES X vs Carrefour" → Order via WhatsApp / checkout

Loki internal:
  Admin dashboard → Monitor competitor prices scraped from supermarket sites → 
  Get alerted if we're no longer the cheapest
```

---

## Brand Identity

**"Kenya's Pet Food, Delivered."**

| Element | Value |
|---|---|
| Brand name | **Pet Food Bag** |
| Tagline | Kenya's Pet Food, Delivered. |
| Aesthetic | Neo-brutalist kraft paper — zero border-radius, heavy borders, white space |
| Background | `#F2EBE0` — warm kraft paper cream |
| Card bg | `#FFFDF9` — near-white with warmth |
| Text / borders | `#1A1A1A` — stamp-on-kraft black |
| CTA / price | `#C8102E` — Kenya flag red |
| Trust accent | `#006600` — Kenya flag green |
| Kenyan flag strip | 4px bar: black · red · green (under navbar + footer) |
| Fonts | **Plus Jakarta Sans** (headings) + **JetBrains Mono** (prices, labels) |
| Border radius | `0` everywhere — zero radius, sharp corners |
| Imagery | Rich photography — happy cats & dogs, Nairobi homes, outdoor Kenyan settings |

---

## Architecture

```
[Customer Browser]
      ↓
[React Router v7 SSR — port 3001]
      ↓
[PostgreSQL petfood_aggregator — localhost:5433 (loki-postgres Docker container)]

[Cron / Manual trigger]
      ↓
[Playwright scraper → updates store_prices for Carrefour / Naivas / Quickmart]
      ↓ (internal only, never shown directly to customers)
[Admin price-watch dashboard at /admin/prices]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Router v7 (framework/SSR mode) |
| Runtime | Node.js via `@react-router/node` |
| Database | PostgreSQL `petfood_aggregator` on `localhost:5433` |
| DB client | `pg` raw SQL + singleton Pool |
| Styling | Tailwind CSS v4 |
| Scraper | Playwright (future phase) |
| Dev port | **3001** (no conflict with merchandiser on 3000) |

---

## Database — `petfood_aggregator` ✅ Already Created

Lives in the **same Docker container** (`loki-postgres`) as `loki_merchandiser`.  
Connection: `postgresql://loki_user:loki_password@localhost:5433/petfood_aggregator`

### Schema

```sql
-- Our products (and competitor SKU mappings)
products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  weight_kg DECIMAL(5,2),
  animal_type VARCHAR(50),   -- 'dog' | 'cat' | 'rabbit' | 'bird'
  food_type VARCHAR(50),     -- 'dry' | 'wet' | 'treat' | 'supplement'
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Our price + competitor reference prices
store_prices (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  store_name VARCHAR(50) NOT NULL,  -- 'Pet Food Bag' | 'Carrefour' | 'Naivas' | 'Quickmart'
  price DECIMAL(10,2) NOT NULL,
  product_url TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

> `store_name = 'Pet Food Bag'` → **our retail price** (the hero number customers see)  
> `store_name = 'Carrefour' | 'Naivas' | 'Quickmart'` → competitor reference (used to compute "You save KES X", admin-only detail view)

---

## File Structure

```
local-petfood/
├── implementation_plan.md          ← this file
├── petfood_seed.sql                ← seed data (24 products × 4 stores)
├── .env                            ← DATABASE_URL, PORT=3001
├── package.json                    ← add: pg, dotenv, lucide-react
├── vite.config.ts                  ← add tailwindcss plugin
├── app/
│   ├── db.server.ts                ← [NEW] pg Pool + auto-migrations
│   ├── app.css                     ← [REPLACE] full Kenyan brown-bag design system
│   ├── root.tsx                    ← [UPDATE] Google Fonts + global layout + flag strip
│   ├── routes.ts                   ← [UPDATE] register all routes
│   └── routes/
│       ├── home.tsx                ← [NEW] / — landing page
│       ├── shop.tsx                ← [NEW] /shop — product catalogue
│       ├── shop.$id.tsx            ← [NEW] /shop/:id — product detail
│       └── admin.prices.tsx        ← [NEW] /admin/prices — internal price watch
└── public/
    └── images/                     ← generated pet photos
```

---

## Pages

### `/` — Homepage
- **Navbar**: `Pet Food Bag.` logo · Shop · About · Contact · `[ORDER NOW →]`
- **Kenyan flag stripe** (4px: black · red · green)
- **Hero**: Full-width section — "Kenya's Pet Food, Delivered." — bold headline, cat & dog image, `[SHOP NOW]` CTA
- **Trust bar**: 🇰🇪 Proudly Kenyan · 🐾 All Major Brands · 🚚 Nairobi Delivery · 💰 Beat Supermarket Prices
- **Category grid**: Dog Food · Cat Food · Treats · Supplements
- **Featured products** (3 cards, best sellers)
- **"Why Pet Food Bag?"** — 3-column: 💰 Lowest Price / 🚚 Fast Delivery / 🐾 Quality Brands
- **Footer** + flag stripe

### `/shop` — Product Catalogue
- Filter tabs: All · 🐕 Dogs · 🐈 Cats · 🦴 Treats
- Sort: Price ↑ · Price ↓ · Newest
- Product cards:
  - Image
  - Brand badge + product name + weight
  - **KES [our price]** (large, red)
  - `SAVE KES X vs Carrefour` badge (green)
  - `[ORDER ON WHATSAPP]` button

### `/shop/:id` — Product Detail
- Large product image
- Brand, name, weight, animal type, food type
- **Our price** (hero)
- Subtle competitor price bar: "At Carrefour: KES X · Naivas: KES X"
- WhatsApp order button (pre-filled message)
- Related products

### `/admin/prices` — Internal Price Intelligence
- No auth for now (internal use only, localhost)
- Table: Product · Our Price · Carrefour · Naivas · Quickmart · Last Updated
- 🔴 Highlight rows where a competitor is cheaper than us
- Manual scrape trigger button (future)

---

## Implementation Steps

- [x] PostgreSQL `petfood_aggregator` database created
- [x] `products` + `store_prices` tables created with indexes
- [x] Seed SQL file written (`petfood_seed.sql`)
- [x] React Router v7 scaffolded in `local-petfood/`
- [ ] Install additional deps: `pg`, `dotenv`, `lucide-react`
- [ ] Create `.env` with `DATABASE_URL` + `PORT=3001`
- [ ] Build `app/db.server.ts` (pg pool + auto-migrations)
- [ ] Build `app/app.css` — full brown-bag + Kenyan design system
- [ ] Update `app/root.tsx` — Google Fonts, flag strip, global layout
- [ ] Build `app/routes/home.tsx` — landing page
- [ ] Build `app/routes/shop.tsx` — catalogue
- [ ] Build `app/routes/shop.$id.tsx` — product detail
- [ ] Build `app/routes/admin.prices.tsx` — internal dashboard
- [ ] Run `petfood_seed.sql` to populate DB
- [ ] Run `npm run dev` and verify on port 3001
- [ ] Generate/embed cat & dog images

---

## Future Phases

| Phase | Work |
|---|---|
| Phase 2 | Playwright scraper to pull live Carrefour/Naivas/Quickmart prices |
| Phase 3 | WhatsApp ordering integration (Baileys, same as loki-merchandiser) |
| Phase 4 | Admin product management UI (add/edit/remove products) |
| Phase 5 | Delivery zone map + M-Pesa payment integration |
