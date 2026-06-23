import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Brochures — PetStore Kenya" },
    { name: "description", content: "Download our product brochures and leaflets at PetStore Kenya." },
  ];
}

export default function Brochures() {
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
        <PageHeader title="Brochures" />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333"
          }}
        >
          
          <div style={{ marginTop: "1rem" }}>
            <a 
              href="/downloads/Spectrum-Brochure_-Final-19.05.2021.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#3182ce",
                textDecoration: "none",
                fontSize: "1.05rem",
                fontWeight: 500,
                gap: "0.5rem"
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              <i className="fa fa-cloud-download" style={{ fontSize: "1.2rem" }} />
              Brochure: Spectrum Functional Line & Spectrum Low Grain
            </a>
          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}
