import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Kenyan Sourced, Trusted Quality — Pet Food Bag" },
    { name: "description", content: "Learn why buying local Kenyan pet food is fresher, cheaper, and healthier for your pets than imported brands." },
  ];
}

export default function TrustBuilder() {
  const partners = [
    {
      name: "Lake Victoria Fishery Communities",
      brand: "Omena Foods (Robeliz / Perfect Mix)",
      location: "Kisumu & Homa Bay 🐟",
      image: "🎣 SOURCED FROM LAKE VICTORIA",
      desc: "Our premium Omena products are sourced directly from small-scale local fishers on the shores of Lake Victoria. Sun-dried under strict hygienic standards, this omena is a nutrient-dense powerhouse packed with Omega-3, calcium, and proteins.",
      impact: "Every purchase directly supports lakeside families, promoting sustainable fishing and bypassing greedy middle-men to deliver fair value to local fishers.",
      color: "var(--ke-green)",
    },
    {
      name: "Sigma Foods Ltd",
      brand: "Bravo Pet Food",
      location: "Nairobi Industrial Area 🐔",
      image: "🍗 FRESH POULTRY FARMING",
      desc: "Sigma Foods operates a state-of-the-art poultry and animal feed facility, formulating Bravo recipes strictly to AAFCO nutritional profiles. Sourcing 100% of their ingredients locally, they ensure consistent batch-to-batch protein quality.",
      impact: "Supports Kenyan contract poultry farmers and guarantees a high-protein, fresh kibble that hasn't degraded in transit for months.",
      color: "var(--ke-red)",
    },
    {
      name: "Gilani's Gourmet",
      brand: "Pet Biltong & Jerky Treats",
      location: "Nakuru County 🐄",
      image: "🥩 RIFT VALLEY PASTURE-RAISED BEEF",
      desc: "With decades of experience in East African traditional air-curing and biltong crafting, Gilani's produces premium, single-ingredient treats from free-range Rift Valley cattle. Highly digestible, rich in iron, and completely chemical-free.",
      impact: "Promotes pasture-raised cattle farming in Nakuru and provides pets with biologically appropriate snacks free of artificial binders.",
      color: "var(--tan)",
    },
    {
      name: "Farmers Choice",
      brand: "Team Pet & Beef Dry Dog Food",
      location: "Nairobi / Rift Valley Farms 🚜",
      image: "🌾 WHOLESOME GRAIN & MEAT SOURCING",
      desc: "The name synonymous with quality meats in Kenya. Sourcing beef meal and quality local maize and wheat germ directly from Rift Valley farmers, Farmers Choice processes and bags daily feed that reaches Nairobi pet parents within days of manufacture.",
      impact: "Uses local agricultural products, keeping 100% of the manufacturing spend within the Kenyan economy while maintaining exceptional freshness.",
      color: "var(--ink)",
    },
    {
      name: "T.L.C. & Scooby",
      brand: "Grain-free Dog Rice & Fortified Meals",
      location: "Eldoret County 🌽",
      image: "🍚 ELDORET MILLING & VEGAN STAPLES",
      desc: "Veterinarians across Nairobi prescribe TLC Dog Rice and Scooby formulations for dogs recovering from gastrointestinal distress or managing sensitive stomachs. Clean, pre-portioned, and fortified with vitamin B complexes.",
      impact: "Milled locally in the agricultural heartland of Eldoret, ensuring top-tier processing standards and grain consistency for therapeutic pet feeding.",
      color: "var(--ink-light)",
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
          <span style={{ color: "var(--ink)" }}>LOCAL SOURCING & TRUST</span>
        </div>

        {/* Hero */}
        <div style={{ border: "3px solid var(--ink)", padding: "2.5rem", background: "var(--card-bg)", marginBottom: "3rem" }}>
          <span className="hero-tag" style={{ display: "inline-block", background: "var(--ke-green)", color: "#fff", padding: "0.2rem 0.6rem", fontSize: "0.65rem", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            🇰🇪 Local Sourcing Pledge
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Fresher. Cheaper. <em style={{ fontStyle: "italic", color: "var(--ke-red)" }}>Kenyan Sourced.</em>
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink-light)", maxWidth: "800px" }}>
            Did you know imported pet food spends up to <strong>6 months</strong> inside hot shipping containers and customs clearance before reaching Kenyan shelves? This heat and time degrades vital proteins, fats, and vitamin content. 
            By choosing <strong>Pet Food Bag</strong>, you bypass imports, support Kenyan farmers and fishers, and feed your pet food manufactured right here in Kenya that reaches your bowl within days.
          </p>
        </div>

        {/* Grid of Partners */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", borderBottom: "3px solid var(--ink)", paddingBottom: "0.5rem" }}>
            🤝 Our Local Manufacturing Partners
          </h2>

          {partners.map((p, idx) => (
            <div key={p.name} style={{ display: "grid", gridTemplateColumns: "1fr", border: "3px solid var(--ink)", background: "var(--card-bg)" }}>
              {/* Top Banner */}
              <div style={{ background: p.color, color: "#fff", padding: "0.6rem 1.25rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <span>{p.image}</span>
                <span>📍 {p.location}</span>
              </div>
              
              {/* Content body */}
              <div style={{ padding: "2rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-light)", marginBottom: "0.25rem" }}>PARTNER #{idx + 1} · {p.brand}</div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" }}>{p.name}</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                  <div>
                    <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>What they do</h4>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--ink-light)" }}>{p.desc}</p>
                  </div>
                  <div style={{ borderLeft: "3px solid var(--tan-light)", paddingLeft: "1.25rem" }}>
                    <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: p.color === "var(--ink)" ? "var(--ke-red)" : p.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Community Impact</h4>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--ink)" }}>{p.impact}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Local vs Import comparison */}
        <div style={{ marginTop: "4rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", borderBottom: "3px solid var(--ink)", paddingBottom: "0.5rem", marginBottom: "2rem" }}>
            ⚖️ Local Sourced vs. Imported Pet Food
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            <div style={{ border: "3px solid var(--ink)", background: "rgba(0,102,0,0.06)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🇰🇪</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Kenyan Local Sourced</h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", lineHeight: 1.5 }}>
                <li>🚀 <strong>Freshness:</strong> Reaches your dog or cat in days. High nutrient bioavailability.</li>
                <li>💰 <strong>Price:</strong> 30% - 50% cheaper since there are no shipping containers or heavy import tariffs.</li>
                <li>🌱 <strong>Eco-Friendly:</strong> Negligible carbon footprint from shipping miles. Sourced right here.</li>
                <li>🤝 <strong>Community:</strong> Supports local East African poultry farmers and Lake Victoria fisheries.</li>
              </ul>
            </div>

            <div style={{ border: "3px solid var(--ink)", background: "rgba(200,16,46,0.04)", padding: "1.5rem", opacity: 0.85 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🚢</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink-light)" }}>Imported Brands</h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", lineHeight: 1.5, color: "var(--ink-light)" }}>
                <li>⌛ <strong>Freshness:</strong> Sits in ocean cargo for 3-6 months. Preservatives added to extend shelf life.</li>
                <li>💸 <strong>Price:</strong> Expensive. You pay for international sea freight and 25%+ customs duty.</li>
                <li>🌍 <strong>Eco-Friendly:</strong> Large carbon footprint from transcontinental shipping and logistics.</li>
                <li>🏢 <strong>Community:</strong> Profits go directly to overseas multinational conglomerates.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "4rem", textAlign: "center", border: "3px solid var(--ink)", padding: "3rem 1.5rem", background: "var(--card-bg)" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>Support Local, Save Big Today</h2>
          <p style={{ color: "var(--ink-light)", marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
            Feed your pets high-quality, fresher food while supporting our local Kenyan manufacturing partners. Free Nairobi delivery for orders over KES 5,000.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/shop" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
              🛒 Shop Local Pet Food
            </Link>
            <a href="https://wa.me/254700000000?text=Hi%20Pet%20Food%20Bag%2C%20I%27d%20like%20to%20order!" className="btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", border: "3px solid var(--ink)", color: "var(--ink)", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: 700 }}>
              📱 Order on WhatsApp
            </a>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
