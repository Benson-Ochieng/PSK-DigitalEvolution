import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Why Choose Us — PetStore Kenya" },
    { name: "description", content: "Discover the PetStore Kenya difference. Learn how we deliver fresher, cheaper, and locally sourced pet food in Nairobi." },
  ];
}

export default function WhyUs() {
  const points = [
    {
      title: "Always Cheaper (No Middle-Men)",
      icon: "💰",
      desc: "Traditional pet food imports pass through multiple hands—importers, national distributors, wholesalers, and retail chains—each adding their markup. We work directly with Kenyan manufacturers like Sigma Foods (Bravo) and Farmers Choice, bypassing all middlemen to offer prices that are up to 25% cheaper than Carrefour, Naivas, and Quickmart.",
      list: [
        "No international shipping freight costs added",
        "Zero import tariffs or customs slotting fees",
        "Direct manufacturer partnerships",
        "We pass all savings directly to pet parents"
      ]
    },
    {
      title: "Ultra-Fresh Local Sourcing",
      icon: "🌱",
      desc: "Imported kibble is shipped from European or Asian factories and spends 3 to 6 months in hot cargo containers, customs warehouses, and transit lines. Under equatorial heat, this causes oxidation of essential fats (causing nutrient rancidity) and vitamin breakdown. Our local formulations are processed in Kenya and reach your pet's bowl within days of manufacture.",
      list: [
        "Bioavailable proteins and fats that aren't oxidized",
        "Highest nutrient retention and vitamin potency",
        "Traceable local supply chain",
        "Fresher taste that dogs and cats love"
      ]
    },
    {
      title: "Powered by Loki Logistics",
      icon: "🚚",
      desc: "Getting premium pet food shouldn't be an chore. Our delivery engine, powered by Loki Logistics, offers seamless delivery across Nairobi and beyond. Place your order before 1:00 PM and get same-day delivery, or next-day delivery for all other orders.",
      list: [
        "Same-day delivery in Nairobi (under 4 hours)",
        "Free delivery for orders above KES 5,000",
        "Real-time WhatsApp courier tracking",
        "Carefully handled cargo to prevent packaging damage"
      ]
    },
    {
      title: "Kenyan First (Economic Impact)",
      icon: "🇰🇪",
      desc: "When you buy imported brands, your money leaves the country. When you buy from PetStore Kenya, your money stays here, supporting Kenyan contract farmers for poultry, beef pastures in Nakuru, and local lakeside communities harvesting Omena on Lake Victoria.",
      list: [
        "Supports Kenyan agricultural jobs",
        "Supports sustainable local lakeside fisheries",
        "Guarantees fair price matching for local producers",
        "Builds self-reliance in East African pet nutrition"
      ]
    }
  ];

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-light)", marginBottom: "2rem", letterSpacing: "0.06em" }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>HOME</Link>
          {" / "}
          <span style={{ color: "var(--ink)" }}>WHY CHOOSE US</span>
        </div>

        {/* Hero */}
        <div style={{ border: "3px solid var(--ink)", padding: "2.5rem", background: "var(--card-bg)", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
            The <em style={{ fontStyle: "italic", color: "var(--ke-red)" }}>PetStore Kenya</em> Difference
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink-light)", maxWidth: "850px" }}>
            Why pay double for old, imported kibble? We built PetStore Kenya to provide Nairobi pet parents with premium, ultra-fresh pet food, sourced locally and delivered directly to your door at unbeatable prices. Here is how we do it:
          </p>
        </div>

        {/* Points grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {points.map((p, idx) => (
            <div key={p.title} style={{ border: "3px solid var(--ink)", background: "var(--card-bg)", display: "grid", gridTemplateColumns: "1fr" }}>
              {/* Header */}
              <div style={{ background: "var(--tan-light)", color: "var(--ink)", borderBottom: "3px solid var(--ink)", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{p.icon}</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{p.title}</h3>
              </div>

              {/* Body */}
              <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--ink-light)" }}>{p.desc}</p>
                </div>
                <div style={{ borderLeft: "3px solid var(--ink)", paddingLeft: "1.5rem" }}>
                  <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: "var(--ke-red)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>Key Features</h4>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                    {p.list.map(item => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                        <span style={{ color: "var(--ke-green)", fontWeight: "bold" }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Local Sourcing Promise CTA */}
        <div style={{ marginTop: "4rem", border: "3px solid var(--ink)", padding: "3rem 1.5rem", background: "var(--card-bg)", textAlign: "center" }}>
          <span style={{ display: "inline-flex", flexDirection: "column", width: 22, height: 15, border: "1.5px solid var(--ink)", flexShrink: 0, marginBottom: "1rem" }}>
            <span style={{ height: "33.3%", background: "var(--ke-black)" }} />
            <span style={{ height: "33.3%", background: "var(--ke-red)" }} />
            <span style={{ height: "33.3%", background: "var(--ke-green)" }} />
          </span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>Read about our Sourcing & Trust</h2>
          <p style={{ color: "var(--ink-light)", marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
            Learn more about our local contract farmers, processing standardizations, and lake fisheries in Kisumu.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/trust" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", background: "var(--ke-green)", borderColor: "var(--ke-green)" }}>
              🤝 Meet Our Manufacturers
            </Link>
            <Link to="/shop" className="btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", border: "3px solid var(--ink)", color: "var(--ink)", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: 700 }}>
              🛒 Shop All Products
            </Link>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
