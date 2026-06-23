import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Quality Management — PetStore Kenya" },
    { name: "description", content: "Learn about Lider quality standards and testing procedures for pet food supplied by PetStore Kenya." },
  ];
}

export default function QualityManagement() {
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
        <PageHeader title="Quality Management" />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333",
            lineHeight: "1.8",
            fontSize: "1.05rem"
          }}
        >
          {/* Main Headline */}
          <h2 
            style={{ 
              fontSize: "1.65rem", 
              fontWeight: 700, 
              color: "#1E5DA7", 
              marginBottom: "1.8rem",
              lineHeight: "1.3"
            }}
          >
            We l❤️ve your pets as much as you do! They deserve the best.
          </h2>

          {/* Paragraph 1 */}
          <p style={{ marginBottom: "1.5rem" }}>
            Are you frustrated with the lack of bonafide all-natural dog food and cat food available on the market? Does the task of carrying a large bag (10kg or more) of dog food make you cringe? We sincerely understand. We love our pets, but we don't want to break our backs with the effort of simply providing them proper nutrition.
          </p>

          {/* Paragraph 2 */}
          <p style={{ marginBottom: "1.5rem" }}>
            When you shop with <strong style={{ color: "#1E5DA7" }}>PetStore Kenya</strong>, you will find only <strong style={{ color: "#1E5DA7" }}>ultra-premium, super premium and standard all-natural dog food and cat food</strong> supplied directly from Lider, a manufacturer of high-quality pet food located in Turkey.
          </p>

          {/* Paragraph 3 */}
          <p style={{ marginBottom: "2.5rem" }}>
            When you purchase any brand of pet food from us, you may be assured that...
          </p>

          {/* Big Subheading callout */}
          <div 
            style={{ 
              textAlign: "center", 
              margin: "2.5rem 0",
              padding: "0 1rem"
            }}
          >
            <h3 
              style={{ 
                fontSize: "1.45rem", 
                fontWeight: 700, 
                color: "#1E5DA7", 
                lineHeight: "1.4",
                margin: 0
              }}
            >
              Lider performs Quality Analysis 500+ times per day, 12+ times per month and 140+ times per year.
            </h3>
          </div>

          {/* Paragraph 4 */}
          <p style={{ marginBottom: "1.5rem" }}>
            Lider laboratories test raw material, pre- and end- products for animal health safety by using physical, chemical, microbiological and toxicological quality control methods.
          </p>

          {/* Bullet List */}
          <ul 
            style={{ 
              listStyleType: "disc", 
              paddingLeft: "1.5rem", 
              marginBottom: "2.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}
          >
            <li>
              Lider microbiology and chemistry laboratories coordinate with the production process to perform classical chemical crude nutrient analysis (dry matter, water activity, crude protein, ether extract, crude fiber, crude ash, starch, calcium, phosphorus, sodium, free fatty acids, peroxide value etc.). Results are cross checked with an NIR (near infra-red spectroscopy) system.
            </li>
            <li>
              Lider tests samples for contamination by pathogens (e.g. Enterobacteriaceae, Salmonella) and toxicological agents such as mycotoxins (aflatoxins).
            </li>
            <li>
              Lider ensures high quality standards by physical assessment (density, homogeneity, particle durability index).
            </li>
          </ul>

          {/* Paragraph 5 */}
          <p style={{ marginBottom: "1.5rem" }}>
            All Lider products are of high-quality backed by research and development programmes conducted with different Turkey national research associations.
          </p>

        </div>

      </div>
      <Footer />
    </>
  );
}
