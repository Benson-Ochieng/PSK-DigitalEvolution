# PetStore Kenya — Implementation Plan & System Architecture

> **Last Updated:** 2026-06-23  
> **Status:** ✅ Production Ready & Fully Synchronized with Live Site

---

## 1. System Overview

**PetStore Kenya (PSK)** is a modern, premium direct-to-consumer pet food retail storefront and administrative back-office system. The project focuses on providing a fast, responsive e-commerce experience for purchasing pet products online, integrated with a high-fidelity WordPress-style administrative dashboard for shop management.

The architecture uses a **hybrid cache/persistence approach**: local JSON files stored under `content/` act as local caches/fallbacks, while a **Supabase PostgreSQL database** acts as the production persistence layer. Data is synchronized bidirectionally between the local filesystem and the Supabase instance.

---

## 2. Brand Identity & Design System

The visual system is designed to look premium, modern, and highly interactive, incorporating high-quality typography, smooth hover state micro-animations, and structured spacing.

| Element | Value | Description |
|---|---|---|
| **Brand Name** | PetStore Kenya / PSK Commerce | Global store identity |
| **Primary Theme** | Cobalt Blue (`#1E5DA7`) | Used for main headers, navbars, and primary branding elements |
| **Secondary Accent** | Emerald Green (`#5BA672`) | Used for success statuses, discount save badges, and key CTAs |
| **Orange Highlight** | Orange (`#FB8E28`) | Used for star ratings and cart item count badges |
| **Main Font** | Roboto | Clean sans-serif used for body copy and general layout |
| **Serif Font** | Roboto Slab | Modern slab-serif used for main headings and titles |
| **Mono Font** | JetBrains Mono | Monospace typeface used for pricing, tags, and SKUs |
| **Border Radius** | 4px (sm), 8px (md), 16px (lg) | Curved modern styling for buttons, inputs, and cards |

---

## 3. Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend & SSR** | React Router v7 (`v7.15.1`) | Serves as the full-stack web framework (evolution of Remix) with Server-Side Rendering and ESM compliance. |
| **Styling & UI** | TailwindCSS v4.0 & Custom CSS | Styled with the `@tailwindcss/vite` plugin and native HSL variables. |
| **Database Server** | PostgreSQL (Supabase) | Production relational database host with tables for products, prices, orders, order items, users, and coupons. |
| **Database Client** | Native Client & SDK | Uses native client connection pools (`pg` driver) for SQL transactions, plus the `@supabase/supabase-js` client SDK. |
| **Fallback Storage** | JSON File Cache (`/content`) | A local filesystem cache acting as a persistent offline database fallback. |
| **Integrations** | WooCommerce API REST (`wc/v3`) | Connects dynamically to `https://petstore.co.ke` via authorization headers. |
| **Sync Utility** | Custom Background Worker | `woocommerce.server.ts` performs non-blocking, automated data pulls and mapping. |
| **State & Session** | Cookies & Context | React context API handles UI state; secure HTTP-only cookie sessions (`__vp_session`) handle admin access. |
| **Containerization** | Docker | Binds port `3001` via a `Dockerfile` and `docker-compose.yml` configuration. |
| **Build Engine** | Vite (`v8.0.3`) | Compiles bundles and provides Hot Module Replacement (HMR). |

---

## 4. Database Schema Alignment

The system synchronizes and maintains a relational database on Supabase containing seven core tables:

### `users`
Represents administrative, management, and authenticated client accounts.
- Fields: `id` (Primary Key), `name`, `email`, `username`, `role` (`administrator`, `shop_manager`, `customer`), `ordersCount`, `status` (`active`, `suspended`), `passwordHash`, `createdAt`.

### `coupons`
Stores promotional codes and discount thresholds.
- Fields: `code` (Primary Key, capitalized), `discountValue`, `discountType` (percentage or fixed, mapping metadata), `active`, `createdAt`.

### `orders`
Represents customer purchases, linked directly to transactional details.
- Fields: `id` (Primary Key), `customer_name`, `customer_phone`, `customer_email`, `delivery_area`, `subtotal_kes`, `delivery_fee_kes`, `total_kes`, `payment_method`, `status` (`pending_payment`, `processing`, `completed`, `failed`, `cancelled`, `on_hold`, `refunded`, `trash`), `notes`, `created_at`.

### `order_items`
Indexes each item purchased in an order, maintaining foreign-key references to products.
- Fields: `id` (Auto-increment PK), `order_id` (References `orders`), `product_id` (References `products`), `product_name`, `qty`, `unit_price`, `total_price`.

### `products`
The product inventory catalog synchronized from the WooCommerce store.
- Fields: `id` (Primary Key), `name`, `brand`, `weight_kg`, `animal_type` (categorized as `dog`, `cat`, etc.), `food_type` (`dry`, `wet`, `treat`), `image_url`, `description`, `categories` (JSON), `slug`, `tags` (JSON), `sku`, `short_description`.

### `store_prices`
Tracks pricing benchmarks for PetStore Kenya and surrounding retail brands.
- Fields: `id` (Auto-increment PK), `product_id` (References `products`), `store_name` (e.g., `PetStore Kenya`, `Naivas`, `Carrefour`, `Quickmart`), `price`, `product_url`, `in_stock`, `last_updated`.

### `posts`
Blog articles and informational pages.
- Fields: `id` (Primary Key), `title`, `slug`, `date`, `content`, `excerpt`, `thumbnail` (mapped to `image` in client-side APIs), `status`, `author`.

> [!NOTE]
> **Data Resilience and Schema Translation:**
> 1. To resolve mismatches with WordPress models, the client wrapper maps legacy API keys (e.g., `thumbnail` $\rightarrow$ `image`).
> 2. Write operations filter out local transient properties (`link`, `tag`) to prevent syntax failures on remote databases.
> 3. Read requests inject default configurations to preserve frontend compatibility when parameters are absent.

---

## 5. Directory & File Structure

```
c:\_Workspace\Projects\PSK-DigitalEvolution\
├── implementation_plan.md              ← System overview and architecture details
├── package.json                        ← Node.js package manifests, dependencies, scripts
├── Dockerfile                          ← Packaging script mapping container dependencies
├── docker-compose.yml                  ← Orchestration script binding server ports
├── vite.config.ts                      ← Vite bundler configuration including Tailwind integration
├── content/                            ← Local filesystem cache database (offline fallbacks)
│   ├── users.json                      ← Cached customer and administrator registry
│   ├── coupons.json                    ← Cached promotional coupon settings
│   ├── orders.json                     ← Cached customer billing entries
│   ├── products/                       ← Cached product descriptions and catalog metadata
│   │   ├── _index.json                 ← Unified product summaries list
│   │   └── *.json                      ← Distinct details for each product
│   └── posts/
│       └── _index.json                 ← Cached blog content index
├── app/
│   ├── app.css                         ← Style theme incorporating color definitions
│   ├── routes.ts                       ← Route definitions and mapping logic
│   ├── root.tsx                        ← Entry layout containing HTML anchors, headers, scripts
│   ├── components/
│   │   ├── Navbar.tsx                  ← Navigation bar with active query autocomplete
│   │   ├── Footer.tsx                  ← Informative footer widget
│   │   └── VisualCodeEditor.tsx        ← Custom code sandbox block editor
│   ├── lib/
│   │   ├── db.server.ts                ← Database controller mediating JSON files & PostgreSQL
│   │   ├── supabase.server.ts          ← Supabase clients and sync connectors
│   │   ├── woocommerce.server.ts       ← WooCommerce REST clients and background task manager
│   │   ├── sessions.server.ts          ← Secure cookie storage and session validation check
│   │   ├── content.server.ts           ← History events log parsing and file utilities
│   │   ├── media.server.ts             ← Asset manager for dynamic attachments
│   │   ├── types.ts                    ← Common TypeScript type bindings
│   │   └── utils.ts                    ← Miscellaneous client-side support utilities
│   └── routes/
│       ├── home.tsx                    ← Store landing layout
│       ├── shop.tsx                    ← Catalog layout, category directories, sorting controls
│       ├── product.$slug.tsx           ← Dynamic SEO details layout with WhatsApp ordering links
│       ├── my-account.tsx              ← Customer portals and entry gateways
│       ├── cart.tsx                    ← Shopping checkout basket reviews
│       ├── checkout.tsx                ← Order dispatch forms
│       ├── store_backend.tsx           ← Secured administrator layout panel
│       └── store_backend.*.tsx         ← Back-office routes (analytics, settings, products, coupons)
└── scratch/
    ├── sync-petstore-to-supabase.ts    ← Legacy sync script
    └── validate-sync.ts                ← Verifies Supabase row counts and connection integrity
```

---

## 6. Storefront & Backend Routes

### Core Customer Pages
*   **`/` (Homepage):** Welcoming banner, product category slider, interactive brand grids, and high-conversion trust rows.
*   **`/shop` (Catalog):** Grid listing 919 items with categorization, dynamic search filters, and sorting controls.
*   **`/shop/:id` (Detail Page):** Full product descriptions, image carousels, and an automated WhatsApp ordering link pointing directly to the merchant.
*   **`/my-account` (Customer Portal):** Conditional portal that respects the global `anyoneCanRegister` toggle, allowing secure customer registration and login.
*   **`/cart` & `/checkout`:** Item review page, discount coupon applying logic, and billing forms with M-Pesa options.

### Administrative "PSK Commerce" Backend
*   **`/store_backend/login`:** Authentication layout.
*   **`/store_backend` (Dashboard):** Provides shop statistics, visual analytics graphs, recent action histories, and quick-access shortcuts.
*   **`/store_backend/products`:** Table lists all catalog products with options to edit stock levels, change pricing, and modify descriptions.
*   **`/store_backend/users`:** Management portal to provision new administrative accounts, assign access permission roles, suspend, or trigger secure password resets.
*   **`/store_backend/posts`:** Manage blog posts, with direct support for local drafts, categories, and content edits.
*   **`/store_backend/coupons`:** Edit, create, and manage promotional discount coupons.
*   **`/store_backend/settings`:** Edit shop configurations, toggle client registration, adjust email servers, and customize brand details.

---

## 7. Migration & Sync Status

The database synchronization is fully operational and verified:
- **Products:** 919 products migrated and synchronized, categorized into animal species (dog, cat, rabbit, bird, fish) and diet types (wet, dry, treat) automatically during import.
- **Competitor Prices:** Competitor price simulation logs created for major local retail outlets (Naivas, Carrefour, Quickmart) to enable benchmarking.
- **Blog Posts:** 27 blog posts synchronized with correct tag, author, and description mappings.
- **Coupons:** Pre-configured with live active codes (`WELCOME500`, `PET8`) and syncing mechanism to keep local caching aligned.
- **Users:** Administrative provisioning and role-based session cookie gates (`__vp_session`) are fully operational.
