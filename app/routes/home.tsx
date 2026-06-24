import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/home";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const links: Route.LinksFunction = () => [];

export function meta(): Route.MetaDescriptors {
  return [
    { title: "PetStore Kenya | We Love Them as Much as You Do" },
    { name: "description", content: "Shop premium dog food, cat food, treats, healthcare, and accessories at PetStore Kenya. Fast delivery and secure payments." },
  ];
}

export async function loader() {
  const statsRes = await query(`
    SELECT
      (SELECT COUNT(*) FROM products) AS product_count,
      (SELECT MAX(last_updated) FROM store_prices) AS last_updated
  `);

  const featuredRes = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    WHERE bbp.price IS NOT NULL
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug, bbp.price
    ORDER BY (COALESCE(MIN(comp.price), 0) - bbp.price) DESC, p.name
    LIMIT 20
  `);

  return { stats: statsRes.rows[0], featured: featuredRes.rows };
}

// ── Product Card matching PetStore Kenya ───────────────────────
function ProductCard({ p }: { p: any }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: Number(p.our_price),
      image_url: p.image_url,
      weight_kg: p.weight_kg,
      slug: p.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="product-card">
      <Link to={`/product/${p.slug}/`} className="product-card-link">
        <div className="product-card-img">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" />
          ) : (
            <span style={{ fontSize: "3rem" }}>🐾</span>
          )}
        </div>
        <div className="product-card-body">
          <div className="product-name" title={p.name}>{p.name}</div>
          <div className="product-price">{Number(p.our_price).toLocaleString()}KSh</div>
        </div>
      </Link>
      <button className={`add-to-cart-btn ${added ? "added" : ""}`} onClick={handleAdd}>
        {added ? "✓ Added" : "Add To Cart"}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function Home() {
  const { stats, featured } = useLoaderData<typeof loader>();
  const [visibleCount, setVisibleCount] = useState(10);

  // Shop By Pet categories
  const petCategories = [
    { label: "Cat", img: "/images/cat-150x150.webp", href: "/product-category/cat-food/" },
    { label: "Kitten", img: "/images/Kitten-150x150.webp", href: "/product-category/kitten-food/" },
    { label: "Dog", img: "/images/dog-150x150.webp", href: "/product-category/dog-food/" },
    { label: "Puppy", img: "/images/puppy-150x150.webp", href: "/product-category/puppy-food/" },
    { label: "Bird", img: "/images/bird-150x150.webp", href: "/product-category/bird-food/" },
    { label: "Rabbit", img: "/images/rabbit-150x150.webp", href: "/product-category/rabbit-food/" },
  ];

  // Popular categories list (18 items)
  const popularCategories = [
    { label: "Cat Flea & Tick", img: "/images/fleas-ticks-and-worms-150x150.webp", href: "/shop?animal=cat" },
    { label: "Cat Litter", img: "/images/Cat-litter-150x150.webp", href: "/shop?animal=cat" },
    { label: "Dog Food", img: "/images/dog-food-150x150.webp", href: "/product-category/dog-food/" },
    { label: "Puppy Food", img: "/images/PUPPY-FOOD-150x150.webp", href: "/product-category/puppy-food/" },
    { label: "Cat Food & Treats", img: "/images/cat-food-150x150.webp", href: "/product-category/cat-food/" },
    { label: "Kitten Food", img: "/images/kITTEN-FOOD-150x150.webp", href: "/product-category/kitten-food/" },
    { label: "Dog Food & Treats", img: "/images/TREATS-150x150.webp", href: "/product-category/dog-food/" },
    { label: "Dog Beds", img: "/images/BEDS-150x150.webp", href: "/shop?animal=dog" },
    { label: "Dog Healthcare", img: "/images/dental-care.webp", href: "/shop?animal=dog" },
    { label: "Leashes", img: "/images/leashes-150x150.webp", href: "/shop?animal=dog" },
    { label: "Collars", img: "/images/collars-150x150.webp", href: "/shop?animal=dog" },
    { label: "Harnesses", img: "/images/Harness-150x150.webp", href: "/shop?animal=dog" },
    { label: "Toys", img: "/images/TOYS-150x150.webp", href: "/shop" },
    { label: "Bowls", img: "/images/BOWL-150x150.webp", href: "/shop" },
    { label: "Dog Grooming", img: "/images/grooming-tools.webp", href: "/shop?animal=dog" },
    { label: "Cat Grooming", img: "/images/cat-150x150.webp", href: "/product-category/cat-food/" },
    { label: "Supplements", img: "/images/supplements-150x150.webp", href: "/shop" },
    { label: "Dog Flea & Tick", img: "/images/fleas-ticks-and-worms-150x150.webp", href: "/shop?animal=dog" },
  ];

  const visibleProducts = featured.slice(0, visibleCount);

  return (
    <>
      <Navbar />

      <div className="page">

        {/* 1. SHOP BY PET Section */}
        <section className="section">
          <div className="section-header-bar">
            <h2 className="section-heading-main">Shop By Pet</h2>
          </div>
          <div className="pet-categories-grid">
            {petCategories.map((c) => (
              <Link key={c.label} to={c.href} className="pet-category-card">
                <div className="pet-category-circle">
                  <img src={c.img} alt={c.label} loading="lazy" />
                </div>
                <span className="pet-category-label">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. POPULAR CATEGORIES Section */}
        <section className="section">
          <div className="section-header-bar">
            <h2 className="section-heading-main">Popular Categories</h2>
          </div>
          <div className="popular-categories-grid">
            {popularCategories.map((c, i) => (
              <Link key={c.label + i} to={c.href} className="popular-category-card">
                <div className="popular-category-img">
                  <img src={c.img} alt={c.label} loading="lazy" />
                </div>
                <span className="popular-category-label">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Middle Call-To-Action Promo Banners */}
        <div className="promo-banners-grid">
          <Link to="/shop" className="promo-banner-link">
            <img src="/images/ctabanner1.jpg.webp" alt="Cat Food Banner" />
          </Link>
          <Link to="/shop" className="promo-banner-link">
            <img src="/images/ctabanner2-1.jpg.webp" alt="Dog Care Essentials Banner" />
          </Link>
        </div>

        {/* 4. New Arrivals Grid */}
        <section className="section">
          <div className="section-header-bar">
            <h2 className="section-heading-main">New Arrivals</h2>
          </div>
          <div className="product-grid">
            {visibleProducts.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {visibleCount < featured.length && (
            <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="btn-blue"
                style={{ padding: "0.6rem 2.5rem", textTransform: "uppercase", fontSize: "0.8rem" }}
              >
                Load More
              </button>
            </div>
          )}
        </section>

        {/* 5. Clearance and Information Banners Grid */}
        <div className="clearance-banners-container">
          <div className="clearance-grid">
            {/* Left side banner */}
            <Link to="/shop" className="clearance-banner-item side-banner align-center">
              <img src="/images/lbanner2.jpg.webp" alt="Pet Obesity banner" />
            </Link>

            {/* Center large banner */}
            <Link to="/shop" className="clearance-banner-item">
              <img src="/images/midbanner-copy.jpg.webp" alt="Huge Clearance banner" />
            </Link>

            {/* Right stacked banners */}
            <div className="clearance-col-side">
              <Link to="/shop" className="clearance-banner-item side-banner">
                <img src="/images/rbanner1.jpg.webp" alt="What is Aflatoxin" />
              </Link>
              <Link to="/shop" className="clearance-banner-item side-banner">
                <img src="/images/rbanner2.jpg.webp" alt="How does your cat food compare" />
              </Link>
            </div>
          </div>
        </div>

        {/* 6. Trust Badges Section */}
        <div className="trust-badges-container">
          <div className="trust-badge-item">
            <img src="/images/ssl_secure.png.webp" alt="SSL Secure Badge" />
          </div>
          <div className="trust-badge-item">
            <img src="/images/100_guaranteed.png.webp" alt="100% Guarantee Badge" />
          </div>
          <div className="trust-badge-item">
            <img src="/images/fast_delivery.png.webp" alt="Fast Delivery Badge" />
          </div>
        </div>

      </div>

      <Footer />
    </>
  );
}
