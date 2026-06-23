import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Why Choose Us — PetStore Kenya" },
    { name: "description", content: "Discover the PetStore Kenya difference. Learn how we deliver fresher, cheaper, and locally sourced pet food in Nairobi." },
  ];
}

export default function WhyUs() {
  const points = [
    {
      title: "Trusted by Premium Pet Owners",
      desc: "Years of proven service and a loyal customer base make us the go-to destination for discerning pet owners seeking quality, care, and expert advice."
    },
    {
      title: "Trusted Expertise",
      desc: "Our team of pet care specialists offer personalized recommendations tailored to each pet's needs. We guide you to make the best choices for your pet."
    },
    {
      title: "Committed to the Pet Ecosystem",
      desc: "Our mission is to enhance the lives of pets, support ethical sourcing, and strengthen the broader pet community."
    },
    {
      title: "Convenient Multi-Channel Shopping",
      desc: "Shop online or in-store, with flexible options and free home delivery (minimum cart size applies) for a seamless experience."
    },
    {
      title: "Supporting Pets & Communities",
      desc: "Every purchase supports shelters, rescues, feeding programs, and community uplift initiative across Kenya."
    },
    {
      title: "Premium Quality Guaranteed",
      desc: "Over 95% of our products come from ISO-certified manufacturers, ensuring top-tier standards in pet nutrition, care, and safety."
    }
  ];

  return (
    <>
      <Navbar />
      <div 
        className="page-container" 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "3rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)",
          backgroundColor: "#ffffff"
        }}
      >
        
        {/* Title Banner */}
        <PageHeader title="Why Choose Us" />

        {/* Cards Grid */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
            gap: "2rem",
            marginBottom: "4rem"
          }}
        >
          {points.map((p, idx) => (
            <div 
              key={idx} 
              style={{ 
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "16px",
                padding: "3rem 2rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03)";
              }}
            >
              <h2 
                style={{ 
                  fontSize: "1.45rem", 
                  fontWeight: 700, 
                  color: "#1E5DA7", 
                  lineHeight: 1.25, 
                  marginBottom: "1.25rem",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {p.title}
              </h2>
              <p 
                style={{ 
                  fontSize: "0.95rem", 
                  color: "#4A5568", 
                  lineHeight: 1.6,
                  margin: 0
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
      <Footer />
    </>
  );
}
