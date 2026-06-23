import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Retail Locations — PetStore Kenya" },
    { name: "description", content: "Available at Leading Retailers Nationwide. Find Your Pet's Favourite Food – Anywhere in Kenya." },
  ];
}

export default function RetailLocations() {
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
        <PageHeader title="Retail Locations" />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333"
          }}
        >
          {/* Section Header */}
          <h2 
            style={{ 
              fontSize: "1.45rem", 
              fontWeight: 700, 
              color: "#1E5DA7", 
              marginBottom: "2rem",
              borderBottom: "1px solid #edf2f7",
              paddingBottom: "0.5rem"
            }}
          >
            Available at Leading Retailers Nationwide
          </h2>

          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              textAlign: "center", 
              gap: "2.5rem",
              marginTop: "2rem"
            }}
          >
            
            {/* Finding Favorite Food Heading & Paragraph */}
            <div style={{ maxWidth: "800px" }}>
              <h3 
                style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: 700, 
                  color: "#2d3748", 
                  marginBottom: "1rem" 
                }}
              >
                Find Your Pet's Favourite Food – Anywhere in Kenya
              </h3>
              <p style={{ color: "#4a5568", lineHeight: "1.8", fontSize: "1.05rem", margin: 0 }}>
                Our premium cat and dog food brands are available in over <strong>400+ retail locations nationwide</strong> and growing every day. From Nairobi to Mombasa, Kisumu to Eldoret, and everywhere in between, we're making premium pet nutrition more accessible for pet parents across Kenya.
              </p>
            </div>

            {/* Shop Conveniently section */}
            <div style={{ maxWidth: "800px" }}>
              <h3 
                style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: 700, 
                  color: "#2d3748", 
                  marginBottom: "0.5rem" 
                }}
              >
                Shop Conveniently Near You
              </h3>
              <p style={{ color: "#718096", fontSize: "0.95rem", margin: 0 }}>
                You can find our products at trusted retailers including:
              </p>
            </div>

            {/* List of Retailers */}
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.8rem", 
                alignItems: "center",
                fontWeight: 700,
                fontSize: "1.8rem",
                color: "#1E5DA7"
              }}
            >
              <div>NAIVAS,</div>
              <div>CARREFOUR,</div>
              <div>CHANDARANA,</div>
              <div>QUICKMART,</div>
              <div>Neighborhood Supermarket,</div>
              <div>Pet Boardings or,</div>
              <div>Vet clinics.</div>
            </div>

            {/* Support and delivery text */}
            <div style={{ maxWidth: "800px", color: "#4a5568", lineHeight: "1.8", fontSize: "1.05rem" }}>
              <p style={{ marginBottom: "1.5rem" }}>
                If you don't see our products at your preferred store, simply get in touch with us and we'll do our best to make them available near you. Your pet's happiness and yours is always our priority. <strong>Fast & Hassle-Free Home Delivery</strong> Order your pet's favourite food online anytime, anywhere. Our online store offers a fast, secure, and seamless shopping experience from the convenience of your mobile phone, tablet, or desktop. You can also place orders directly via WhatsApp <strong>+254 795 350 292</strong>
              </p>
            </div>

            {/* Newsletter and Voucher */}
            <div 
              style={{ 
                maxWidth: "800px", 
                fontSize: "1.1rem", 
                color: "#2d3748",
                borderTop: "1px solid #edf2f7",
                borderBottom: "1px solid #edf2f7",
                padding: "1.5rem 0",
                width: "100%"
              }}
            >
              Join Our Community:{" "}
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                style={{ color: "#3182ce", textDecoration: "none", fontWeight: 700 }}
              >
                SUBSCRIBE to our email list
              </a>
              . We'll make it worth your while with a{" "}
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                style={{ color: "#3182ce", textDecoration: "none", fontWeight: 700 }}
              >
                FREE DELIVERY VOUCHER
              </a>
              .
            </div>

            {/* Footer-like note */}
            <div style={{ fontStyle: "italic", color: "#718096", fontSize: "1rem" }}>
              Because we love them as much as you do!
            </div>

          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}
