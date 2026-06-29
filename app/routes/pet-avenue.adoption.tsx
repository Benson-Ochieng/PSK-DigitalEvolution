import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Pet Adoption Centers — PetStore Kenya" },
    { name: "description", content: "Find trusted pet adoption centers in Nairobi, Mombasa, Nanyuki, Naivasha, and across Kenya. Adopt a pet and save a life today." },
  ];
}

const ADOPTION_CENTERS = [
  {
    name: "Nairobi Feline Sanctuary",
    contacts: ["0726 522 675"],
    location: "Utawala & Tigoni"
  },
  {
    name: "Nairobi Sanctuary for Stray Animals (NSSA)",
    contacts: ["0797 679 178"],
    location: "Kiambu County"
  },
  {
    name: "PAWMOJA",
    contacts: ["+254 713 730344"],
    location: "Kibera, Nairobi"
  },
  {
    name: "PAW – Pwani Animal Welfare",
    contacts: ["0708 944 883"],
    location: "Mombasa"
  },
  {
    name: "Forever Home 254",
    contacts: ["0757 466 271"],
    location: "Tigoni, Limuru"
  },
  {
    name: "KSPCA Nanyuki (Laikipia)",
    contacts: ["+254 705 280 834"],
    location: "Nanyuki Town, Laikipia County"
  },
  {
    name: "KSPCA Mombasa",
    contacts: ["+254 733 728 356"],
    location: "Malindi Road, Nyali, Mombasa",
    email: "kspcamsa@gmail.com"
  },
  {
    name: "KSPCA Naivasha",
    contacts: ["+254 795 551 425"],
    location: "Moi Southlake Road, Karagita, Naivasha",
    email: "kspcanaivasha@gmail.com"
  },
  {
    name: "KSPCA Nairobi (Head Office)",
    contacts: ["+254 709 007 500", "020 243 0318", "0799 303 940"],
    location: "Langata Road, Karen, Nairobi",
    email: "info@kspca.or.ke",
    emergency: "+254 733 571 125"
  }
];

export default function AdoptionDirectory() {
  function formatPhoneUrl(phone: string) {
    if (!phone) return "";
    const clean = phone.trim().replace(/[^0-9+]/g, "");
    return `tel:${clean}`;
  }

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
        <PageHeader title="Pet Adoption" />

        {/* Page Titles */}
        <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#1E5DA7",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              margin: "0 0 10px 0"
            }}
          >
            PET ADOPTION CENTERS
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              color: "#1E5DA7",
              fontWeight: 600,
              margin: 0
            }}
          >
            Trusted pet adoption options.
          </p>
        </div>

        {/* Adoption Centers Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "3rem"
          }}
        >
          {ADOPTION_CENTERS.map((center, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03)";
              }}
            >
              {/* Center Name */}
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: 0
                }}
              >
                {center.name}
              </h3>

              {/* Blue Dividing Line */}
              <div style={{ borderBottom: "2px solid #1E5DA7", width: "100%", opacity: 0.8, margin: "2px 0 6px 0" }} />

              {/* Center Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Contact List */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.95rem" }}>
                  <span style={{ color: "#1E5DA7", fontSize: "1rem", marginTop: "2px" }}>📞</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ color: "#475569", fontWeight: 600 }}>
                      Contact{center.contacts.length > 1 ? "s" : ""}:
                    </div>
                    {center.contacts.map((contact, cIdx) => (
                      <a
                        key={cIdx}
                        href={formatPhoneUrl(contact)}
                        style={{
                          color: "#1E5DA7",
                          textDecoration: "none",
                          fontWeight: 700,
                          transition: "color 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#0e3e75"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                      >
                        {contact}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.95rem" }}>
                  <span style={{ color: "#ef4444", fontSize: "1rem", marginTop: "2px" }}>📍</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ color: "#475569", fontWeight: 600 }}>Location:</span>
                    <span style={{ color: "#1e293b", fontWeight: 500 }}>{center.location}</span>
                  </div>
                </div>

                {/* Email (if any) */}
                {center.email && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.95rem" }}>
                    <span style={{ color: "#1E5DA7", fontSize: "1rem", marginTop: "2px" }}>✉️</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>Email:</span>
                      <a
                        href={`mailto:${center.email}`}
                        style={{
                          color: "#1E5DA7",
                          textDecoration: "none",
                          fontWeight: 700,
                          transition: "color 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#0e3e75"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                      >
                        {center.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Emergency (if any) */}
                {center.emergency && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.95rem" }}>
                    <span style={{ color: "#ef4444", fontSize: "1rem", marginTop: "2px" }}>🚨</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>Emergency:</span>
                      <a
                        href={formatPhoneUrl(center.emergency)}
                        style={{
                          color: "#ef4444",
                          textDecoration: "none",
                          fontWeight: 700,
                          transition: "color 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#b91c1c"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#ef4444"}
                      >
                        {center.emergency}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
