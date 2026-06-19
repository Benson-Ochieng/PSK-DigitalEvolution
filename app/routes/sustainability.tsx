import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Sustainability & Green Logistics — Pet Food Bag" },
    { name: "description", content: "Learn about our e-bike delivery philosophy, green credentials of local sourcing, and our journey to ISO certification." },
  ];
}

export default function Sustainability() {
  const points = [
    {
      title: "Zero-Emissions E-Bike Logistics",
      icon: "🚲",
      desc: "Nairobi's streets are notoriously congested, and delivery vans spew particulate matter and CO2 into our city's air. At Pet Food Bag, our final-mile delivery partner—Loki Logistics—is deploying a custom fleet of electric cargo bikes (e-bikes). These bikes emit exactly zero tailpipe emissions, require minimal charging infrastructure, and move silently through local estates to bring food to your doorstep.",
      list: [
        "Zero fuel combusted for last-mile delivery",
        "Less wear-and-tear on Nairobi local roads",
        "Saves time by bypassing bumper-to-bumper traffic",
        "Charging runs on grid power, moving to solar charging"
      ]
    },
    {
      title: "The Carbon Logic of Sourcing Locally",
      icon: "🌍",
      desc: "Standard pet food packages imported from Europe or North America spend months traveling across oceans on container ships, followed by heavy diesel transport. This results in significant 'food miles' and carbon emissions before the food even reaches Kenya. By sourcing our beef, poultry, and grains directly from Kenyan farms (like pastures in Nakuru and fisheries in Lake Victoria), our transport footprint is up to 95% lower than imports.",
      list: [
        "95% reduction in shipping-related carbon emissions",
        "Zero trans-continental marine shipping voyages",
        "Fresh raw materials processed close to the point of origin",
        "Prevents fat oxidation caused by months in hot sea cargo"
      ]
    },
    {
      title: "ISO Certification: Standardized Logistics",
      icon: "📜",
      desc: "We don't just talk about being green; we standardize it. Loki Logistics is actively undergoing implementation audits for ISO 14001 (Environmental Management System) and ISO 9001 (Quality Management System) certification. This guarantees that our vehicle routes are optimized mathematically for energy efficiency, our operations minimize waste, and our carbon tracking is independently verified.",
      list: [
        "ISO 14001: Audited compliance for waste and emission controls",
        "ISO 9001: Standardized service excellence & cold-chain safety",
        "Mathematical route optimization to reduce kilometers driven",
        "Transparent, quarterly carbon footprint disclosures"
      ]
    },
    {
      title: "Eco-Friendly Recycled Packaging",
      icon: "🛍️",
      desc: "Single-use plastic bags are a massive environmental threat in Kenya. We pack our customized bulk mixtures in durable, multi-layer kraft paper bags. These bags are strong, breathable (keeping kibble fresh naturally), and 100% recyclable. We encourage our pet parents to reuse or return their paper bags, which we sanitize and recycle.",
      list: [
        "Biodegradable natural brown kraft paper casing",
        "Non-toxic vegetable ink stamps used on all packages",
        "Bag-Return Program: Get KES 100 credit on your next order",
        "Helps keep plastic out of local Nairobi wetlands"
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
          <span style={{ color: "var(--ink)" }}>SUSTAINABILITY</span>
        </div>

        {/* Hero Banner */}
        <div style={{ border: "3px solid var(--ink)", padding: "2.5rem", background: "var(--card-bg)", marginBottom: "3rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-30px", fontSize: "10rem", opacity: 0.05, pointerEvents: "none" }}>🌿</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "var(--ke-green)", color: "#fff", padding: "0.25rem 0.6rem", marginBottom: "1.25rem" }}>
            🍃 GREEN & ETHICAL LOGISTICS
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Sustainably Sourced, <em style={{ fontStyle: "italic", color: "var(--ke-green)" }}>E-Bike Delivered</em>
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink-light)", maxWidth: "850px" }}>
            Caring for your pet shouldn't cost the Earth. We built our supply chain in Kenya to eliminate international shipping carbon, packaging waste, and diesel exhaust. From Lake Victoria fisheries to Nairobi's quietest electric bicycle routes, here is how we ensure a greener paw-print.
          </p>
        </div>

        {/* Value Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
          {[
            { val: "0%", label: "Tailpipe Emissions", desc: "For all e-bike last-mile runs in Nairobi." },
            { val: "-95%", label: "Shipping Carbon", desc: "Compared to importing pet food from overseas." },
            { val: "14001", label: "ISO Environmental", desc: "Logistics standard auditing in progress." },
          ].map(s => (
            <div key={s.label} style={{ border: "3px solid var(--ink)", padding: "1.5rem", background: "var(--card-bg)", boxShadow: "4px 4px 0 var(--ink)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.5rem", fontWeight: 700, color: "var(--ke-green)" }}>{s.val}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", margin: "0.5rem 0", letterSpacing: "0.04em" }}>{s.label}</div>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-light)", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Detail Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {points.map((p) => (
            <div key={p.title} style={{ border: "3px solid var(--ink)", background: "var(--card-bg)", display: "grid", gridTemplateColumns: "1fr" }}>
              {/* Header */}
              <div style={{ background: "#e8f5e9", color: "var(--ink)", borderBottom: "3px solid var(--ink)", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{p.icon}</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--ke-green)" }}>{p.title}</h3>
              </div>

              {/* Body */}
              <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--ink-light)" }}>{p.desc}</p>
                </div>
                <div style={{ borderLeft: "3px solid var(--ink)", paddingLeft: "1.5rem" }}>
                  <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: "var(--ke-green)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>Core Impact</h4>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                    {p.list.map(item => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                        <span style={{ color: "var(--ke-green)", fontWeight: "bold" }}>🍃</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "4rem", border: "3px solid var(--ink)", padding: "3rem 1.5rem", background: "var(--card-bg)", textAlign: "center" }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🚲🌾</span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>Support Green Local Sourcing</h2>
          <p style={{ color: "var(--ink-light)", marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
            Choose food that is better for your dog, better for Kenyan contract farmers, and better for the planet.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/shop" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", background: "var(--ke-green)", borderColor: "var(--ke-green)" }}>
              🛒 Shop Sustainably Sourced Food
            </Link>
            <Link to="/trust" className="btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", border: "3px solid var(--ink)", color: "var(--ink)", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: 700 }}>
              🤝 Sourcing & Integrity Promise
            </Link>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
