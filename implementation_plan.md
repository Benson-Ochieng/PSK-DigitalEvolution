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
| **Frontend Framework** | React Router v7 | Full-featured SSR and React framework rendering pages |
| **Database** | PostgreSQL (Supabase) | Hosted production database containing products, posts, orders, users, and coupons |
| **DB Client** | `@supabase/supabase-js` | Standard client wrapper used to interact with the Supabase project instance |
| **State Management** | React State & Context | Custom React state handles client-side cart, search suggestions, and overlays |
| **Sync Utility** | Custom TypeScript Runner | Scrapes/syncs categories, products, and blog posts from `https://petstore.co.ke` |
| **Development Server** | Vite / React Router Dev | Running on standard port `5173` |

---

## 4. Database Schema Alignment

The system uses five main tables in the Supabase PostgreSQL database:

### `users`
Represents the administrative and shop management team accounts.
- Fields: `id`, `name`, `email`, `username`, `role` (`administrator`, `shop_manager`, etc.), `status` (`active`, `suspended`), `passwordHash`.

### `coupons`
Stores promotional discount codes.
- Fields: `code` (Primary Key, capitalized), `discountValue`, `discountType` (e.g. `fixed` or `percentage`), `active`, `createdAt`.

### `orders`
Stores customer transaction and billing records.
- Fields: `id`, `date`, `paymentMethod`, `items` (JSONB array), `total`, `shipping`, `currency`, `billing` (JSONB object), `status` (`PENDING_PAYMENT`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).

### `products`
The product inventory catalog pulled from the live website.
- Fields: `id` (Primary Key), `name`, `slug`, `sku`, `price`, `regularPrice`, `salePrice`, `onSale`, `inStock`, `thumbnail`, `categories`, `brands`, `tags`, `status`, `dateCreated`, `dateModified`, etc.

### `posts`
Blog articles and content pages.
- Fields: `id` (Primary Key), `title`, `slug`, `date`, `content`, `excerpt`, `thumbnail` (mapped to `image` in client APIs), `status`, `author`.

> [!NOTE]
> **Post Schema Alignment Mapping:** To resolve column mismatches where the database schema lacks `image`, `link`, and `tag` columns:
> 1. Client query wrappers automatically map the database column `thumbnail` to the application property `image`.
> 2. Write operations (`insert`, `update`, `upsert`) clean-filter and omit unsupported columns (`link`, `tag`) to prevent schema failures on Supabase.
> 3. Read queries hydrate empty fields with fallback values (`link: ""` and `tag: "Pet Care"`) to maintain application compatibility.

---

## 5. Directory & File Structure

```
c:\_Workspace\Projects\PSK-DigitalEvolution\
├── implementation_plan.md              ← This plan
├── package.json                        ← Node dependencies (Supabase, React Router, etc.)
├── content/                            ← Local file system cache & seed data fallback
│   ├── users.json                      ← Local users database
│   ├── coupons.json                    ← Local coupons database
│   ├── orders.json                     ← Local orders database
│   ├── products/                       ← Local product metadata details
│   │   ├── _index.json                 ← Index catalog of all products
│   │   └── *.json                      ← Individual product description files
│   └── posts/
│       └── _index.json                 ← Local blog posts index
├── app/
│   ├── app.css                         ← Custom Cobalt/Emerald Design System styles
│   ├── routes.ts                       ← Application route configuration
│   ├── root.tsx                        ← Main layout, metadata configuration & scripts
│   ├── components/
│   │   ├── Navbar.tsx                  ← Dynamic header, search autocomplete, category drop
│   │   ├── Footer.tsx                  ← Branded customer footer
│   │   └── VisualCodeEditor.tsx        ← Custom code editor interface component
│   ├── lib/
│   │   ├── db.server.ts                ← Unified DB wrapper interfacing local JSON & Supabase
│   │   ├── supabase.server.ts          ← Supabase client initialization & bidirection sync
│   │   └── content.server.ts           ← Local asset manager, history events logs utilities
│   └── routes/
│       ├── home.tsx                    ← Front-facing store landing page
│       ├── shop.tsx                    ← Catalog layout, filter lists, and sorting controls
│       ├── shop.$id.tsx                ← Detailed product layout and WhatsApp order link
│       ├── my-account.tsx              ← Customer login, registration & portal dashboard
│       ├── cart.tsx                    ← Shopping cart review layout
│       ├── checkout.tsx                ← Checkout processing & billing form
│       └── store_backend.tsx           ← Premium admin layout & auth gateway
│       └── store_backend.*.tsx         ← Individual back-office routes (Dashboard, Products, Users, etc.)
└── scratch/
    ├── sync-petstore-to-supabase.ts    ← Downloads WP assets from petstore.co.ke & seeds Supabase
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
- **Products:** 919 products migrated from the live site.
- **Blog Posts:** 27 posts synced, with inline mapping for image fields.
- **Coupons:** Pre-configured with active codes (`WELCOME500`, `PET8`).
- **Users:** Administrative provisioning is enabled and fully active.
